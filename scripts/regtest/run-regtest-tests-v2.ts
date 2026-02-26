#!/usr/bin/env tsx
/**
 * Regtest Integration Tests for V2 Unified Vault Profiles
 *
 * Tests all 5 vault profiles against a real Bitcoin Core regtest node:
 *  - Solo Vault (owner + recovery with CSV)
 *  - Spouse Plan (owner + spouse + heir, 3-tier CSV)
 *  - Family Vault (owner + recovery + 2-of-3 heirs, 3-tier CSV + multisig)
 *  - Business Vault (joint + owner solo + trustee, 3-path CSV)
 *  - Dead Man's Switch V2 (owner + heir with CSV)
 *
 * Run: npm run test:regtest:v2
 * Requires: docker compose -f docker-compose.regtest.yml up -d
 */

import * as bitcoin from 'bitcoinjs-lib';
import { Buffer } from 'buffer';

import {
  generateDeadManSwitchAddress,
  generateBusinessVaultScript,
} from '../../src/vault/scripts/bitcoin-address';

import { RegtestRPC } from './rpc-client';
import {
  REGTEST,
  generateKeypair,
  bootstrapWallet,
  fundAddress,
  mineBlocks,
  findUTXO,
  broadcast,
  assert,
  section,
  summary,
  type TestKeypair,
  type TestUTXO,
} from './test-helpers';

// ─── Network helpers ────────────────────────────────

function p2wshAddress(witnessScriptHex: string): string {
  const ws = Buffer.from(witnessScriptHex, 'hex');
  const { address } = bitcoin.payments.p2wsh({
    redeem: { output: ws },
    network: REGTEST,
  });
  if (!address) throw new Error('Failed to derive P2WSH address');
  return address;
}

function p2wpkhAddress(pubkeyHex: string): string {
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(pubkeyHex, 'hex'),
    network: REGTEST,
  });
  if (!address) throw new Error('Failed to derive P2WPKH address');
  return address;
}

// ─── Script builders for V2 profiles ────────────────
// Hand-crafted witness scripts matching each profile's spending conditions.
// All timelocks use OP_CHECKSEQUENCEVERIFY (CSV / relative) so they reset
// on owner activity (spending to self creates a new UTXO).

/**
 * Spouse Plan witness script (3-tier):
 *
 * OP_IF
 *   <owner> OP_CHECKSIG
 * OP_ELSE
 *   OP_IF
 *     <spouseBlocks> OP_CSV OP_DROP <spouse> OP_CHECKSIG
 *   OP_ELSE
 *     <heirBlocks> OP_CSV OP_DROP <heir> OP_CHECKSIG
 *   OP_ENDIF
 * OP_ENDIF
 *
 * Witness stacks:
 *   Owner:  [sig, TRUE, witnessScript]
 *   Spouse: [sig, TRUE, FALSE, witnessScript]  (outer ELSE → inner IF)
 *   Heir:   [sig, FALSE, FALSE, witnessScript] (outer ELSE → inner ELSE)
 */
function buildSpousePlanScript(
  ownerPubkeyHex: string,
  spousePubkeyHex: string,
  heirPubkeyHex: string,
  spouseBlocks: number,
  heirBlocks: number,
): Buffer {
  const owner = Buffer.from(ownerPubkeyHex, 'hex');
  const spouse = Buffer.from(spousePubkeyHex, 'hex');
  const heir = Buffer.from(heirPubkeyHex, 'hex');

  return Buffer.from(bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
      owner,
      bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ELSE,
      bitcoin.opcodes.OP_IF,
        bitcoin.script.number.encode(spouseBlocks),
        bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
        bitcoin.opcodes.OP_DROP,
        spouse,
        bitcoin.opcodes.OP_CHECKSIG,
      bitcoin.opcodes.OP_ELSE,
        bitcoin.script.number.encode(heirBlocks),
        bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
        bitcoin.opcodes.OP_DROP,
        heir,
        bitcoin.opcodes.OP_CHECKSIG,
      bitcoin.opcodes.OP_ENDIF,
    bitcoin.opcodes.OP_ENDIF,
  ]));
}

/**
 * Family Vault witness script (3-tier + CHECKMULTISIG):
 *
 * OP_IF
 *   <owner> OP_CHECKSIG
 * OP_ELSE
 *   OP_IF
 *     <recoveryBlocks> OP_CSV OP_DROP <recovery> OP_CHECKSIG
 *   OP_ELSE
 *     <heirBlocks> OP_CSV OP_DROP
 *     OP_2 <h1> <h2> <h3> OP_3 OP_CHECKMULTISIG
 *   OP_ENDIF
 * OP_ENDIF
 *
 * Heir pubkeys are BIP67-sorted before inclusion.
 *
 * Witness stacks:
 *   Owner:    [sig, TRUE, witnessScript]
 *   Recovery: [sig, TRUE, FALSE, witnessScript]
 *   2-of-3:   [OP_0, sig_a, sig_b, FALSE, FALSE, witnessScript]
 *             (sigs must be ordered to match sorted pubkey positions)
 */
function buildFamilyVaultScript(
  ownerPubkeyHex: string,
  recoveryPubkeyHex: string,
  heirPubkeyHexes: string[],
  recoveryBlocks: number,
  heirBlocks: number,
): { witnessScript: Buffer; sortedHeirPubkeys: Buffer[] } {
  const owner = Buffer.from(ownerPubkeyHex, 'hex');
  const recovery = Buffer.from(recoveryPubkeyHex, 'hex');
  const heirPubkeys = heirPubkeyHexes.map(h => Buffer.from(h, 'hex'));

  // BIP67 sort
  const sortedHeirPubkeys = [...heirPubkeys].sort(Buffer.compare);

  const witnessScript = Buffer.from(bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
      owner,
      bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ELSE,
      bitcoin.opcodes.OP_IF,
        bitcoin.script.number.encode(recoveryBlocks),
        bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
        bitcoin.opcodes.OP_DROP,
        recovery,
        bitcoin.opcodes.OP_CHECKSIG,
      bitcoin.opcodes.OP_ELSE,
        bitcoin.script.number.encode(heirBlocks),
        bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
        bitcoin.opcodes.OP_DROP,
        bitcoin.opcodes.OP_2,
        ...sortedHeirPubkeys,
        bitcoin.opcodes.OP_3,
        bitcoin.opcodes.OP_CHECKMULTISIG,
      bitcoin.opcodes.OP_ENDIF,
    bitcoin.opcodes.OP_ENDIF,
  ]));

  return { witnessScript, sortedHeirPubkeys };
}

// ─── Flexible transaction builder ────────────────────

/**
 * Build a transaction, compute sighash, sign, and apply a custom witness.
 *
 * The caller provides a `buildWitness` callback that receives the DER+sighash
 * signatures (one per signer) and returns the witness stack items EXCLUDING
 * the witnessScript (which is appended automatically).
 */
function buildSignedTx(opts: {
  utxo: TestUTXO;
  witnessScript: Buffer;
  signers: TestKeypair[];
  buildWitness: (sigs: Buffer[]) => Buffer[];
  destinationAddress: string;
  fee?: number;
  locktime?: number;
  sequence?: number;
}): string {
  const {
    utxo,
    witnessScript,
    signers,
    buildWitness,
    destinationAddress,
    fee = 1000,
    locktime = 0,
    sequence = 0xffffffff,
  } = opts;

  const tx = new bitcoin.Transaction();
  tx.version = 2;
  tx.locktime = locktime;

  tx.addInput(Buffer.from(utxo.txid, 'hex').reverse(), utxo.vout, sequence);

  const outputValue = utxo.value - fee;
  const outputScript = bitcoin.address.toOutputScript(destinationAddress, REGTEST);
  tx.addOutput(outputScript, BigInt(outputValue));

  // Compute sighash for witness v0
  const sighashType = bitcoin.Transaction.SIGHASH_ALL;
  const sigHash = tx.hashForWitnessV0(
    0,
    witnessScript,
    BigInt(utxo.value),
    sighashType
  );

  // Sign with each signer — DER encode for consensus validity
  const signatures: Buffer[] = signers.map(kp => {
    const compactSig = kp.ecpair.sign(sigHash); // 64-byte r||s
    return Buffer.from(bitcoin.script.signature.encode(compactSig, sighashType)); // DER + hashtype
  });

  // Build witness: items + witnessScript
  const witnessItems = buildWitness(signatures);
  tx.setWitness(0, [...witnessItems, witnessScript]);

  return tx.toHex();
}

// ─── Main ────────────────────────────────────────────

async function main() {
  console.log('\n\x1b[1m╔══════════════════════════════════════════════════╗');
  console.log('║  SatsLegacy V2 Profile Regtest Integration Tests  ║');
  console.log('╚══════════════════════════════════════════════════╝\x1b[0m\n');

  const rpc = new RegtestRPC();

  // Wait for bitcoind
  console.log('Waiting for bitcoind...');
  await rpc.waitForReady(30, 2000);
  console.log('bitcoind is ready.\n');

  // Bootstrap
  const minerAddr = await bootstrapWallet(rpc);
  const startHeight = await rpc.getBlockCount();
  console.log(`Start block height: ${startHeight}`);

  // ═══════════════════════════════════════════════════
  //  SOLO VAULT (owner + recovery with CSV)
  // ═══════════════════════════════════════════════════
  // Uses the same OP_IF/CHECKSIG/ELSE/CSV/CHECKSIG/ENDIF structure
  // as the legacy Dead Man's Switch, but with "recovery" key role.

  section('V2-1: Solo Vault — Owner Spend');
  {
    const owner = generateKeypair();
    const recovery = generateKeypair();
    const csvBlocks = 10;

    const result = generateDeadManSwitchAddress(
      owner.publicKey, recovery.publicKey, csvBlocks, 'testnet'
    );
    const vaultAddr = p2wshAddress(result.witnessScript);
    const ws = Buffer.from(result.witnessScript, 'hex');
    console.log(`  Vault: ${vaultAddr}  CSV: ${csvBlocks} blocks`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);
    const dest = p2wpkhAddress(generateKeypair().publicKey);

    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [owner],
      buildWitness: (sigs) => [sigs[0], Buffer.from([0x01])], // TRUE → owner IF branch
      destinationAddress: dest,
      sequence: 0xffffffff,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, 'Owner can spend Solo Vault anytime', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  section('V2-2: Solo Vault — Recovery Before CSV (MUST FAIL)');
  {
    const owner = generateKeypair();
    const recovery = generateKeypair();
    const csvBlocks = 10;

    const result = generateDeadManSwitchAddress(
      owner.publicKey, recovery.publicKey, csvBlocks, 'testnet'
    );
    const vaultAddr = p2wshAddress(result.witnessScript);
    const ws = Buffer.from(result.witnessScript, 'hex');

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);
    const dest = p2wpkhAddress(generateKeypair().publicKey);

    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [recovery],
      buildWitness: (sigs) => [sigs[0], Buffer.alloc(0)], // FALSE → recovery ELSE branch
      destinationAddress: dest,
      locktime: 0,
      sequence: result.sequence,
    });

    const res = await broadcast(rpc, txHex);
    assert(!res.success, 'Recovery CANNOT spend before CSV', res.error || 'unexpectedly succeeded');
  }

  section('V2-3: Solo Vault — Recovery After CSV');
  {
    const owner = generateKeypair();
    const recovery = generateKeypair();
    const csvBlocks = 10;

    const result = generateDeadManSwitchAddress(
      owner.publicKey, recovery.publicKey, csvBlocks, 'testnet'
    );
    const vaultAddr = p2wshAddress(result.witnessScript);
    const ws = Buffer.from(result.witnessScript, 'hex');
    console.log(`  CSV: ${csvBlocks} blocks`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    console.log(`  Mining ${csvBlocks} blocks for CSV maturity...`);
    await mineBlocks(rpc, csvBlocks, minerAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [recovery],
      buildWitness: (sigs) => [sigs[0], Buffer.alloc(0)],
      destinationAddress: dest,
      locktime: 0,
      sequence: result.sequence,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, 'Recovery CAN spend after CSV', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  // ═══════════════════════════════════════════════════
  //  SPOUSE PLAN (owner + spouse + heir, 3-tier CSV)
  // ═══════════════════════════════════════════════════

  section('V2-4: Spouse Plan — Owner Spend');
  {
    const owner = generateKeypair();
    const spouse = generateKeypair();
    const heir = generateKeypair();
    const spouseBlocks = 10;
    const heirBlocks = 50;

    const ws = buildSpousePlanScript(
      owner.publicKey, spouse.publicKey, heir.publicKey,
      spouseBlocks, heirBlocks
    );
    const vaultAddr = p2wshAddress(ws.toString('hex'));
    console.log(`  Vault: ${vaultAddr}`);
    console.log(`  Spouse CSV: ${spouseBlocks}  Heir CSV: ${heirBlocks}`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);
    const dest = p2wpkhAddress(generateKeypair().publicKey);

    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [owner],
      buildWitness: (sigs) => [sigs[0], Buffer.from([0x01])], // TRUE → owner path
      destinationAddress: dest,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, 'Owner can spend Spouse Plan anytime', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  section('V2-5: Spouse Plan — Spouse Before CSV (MUST FAIL)');
  {
    const owner = generateKeypair();
    const spouse = generateKeypair();
    const heir = generateKeypair();
    const spouseBlocks = 10;
    const heirBlocks = 50;

    const ws = buildSpousePlanScript(
      owner.publicKey, spouse.publicKey, heir.publicKey,
      spouseBlocks, heirBlocks
    );
    const vaultAddr = p2wshAddress(ws.toString('hex'));

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);
    const dest = p2wpkhAddress(generateKeypair().publicKey);

    // Spouse path: outer FALSE → inner TRUE
    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [spouse],
      buildWitness: (sigs) => [sigs[0], Buffer.from([0x01]), Buffer.alloc(0)],
      destinationAddress: dest,
      sequence: spouseBlocks,
    });

    const res = await broadcast(rpc, txHex);
    assert(!res.success, 'Spouse CANNOT spend before CSV', res.error || 'unexpectedly succeeded');
  }

  section('V2-6: Spouse Plan — Spouse After CSV');
  {
    const owner = generateKeypair();
    const spouse = generateKeypair();
    const heir = generateKeypair();
    const spouseBlocks = 10;
    const heirBlocks = 50;

    const ws = buildSpousePlanScript(
      owner.publicKey, spouse.publicKey, heir.publicKey,
      spouseBlocks, heirBlocks
    );
    const vaultAddr = p2wshAddress(ws.toString('hex'));
    console.log(`  Spouse CSV: ${spouseBlocks} blocks`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    console.log(`  Mining ${spouseBlocks} blocks for spouse CSV maturity...`);
    await mineBlocks(rpc, spouseBlocks, minerAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [spouse],
      buildWitness: (sigs) => [sigs[0], Buffer.from([0x01]), Buffer.alloc(0)],
      destinationAddress: dest,
      sequence: spouseBlocks,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, 'Spouse CAN spend after CSV', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  section('V2-7: Spouse Plan — Heir Before CSV (MUST FAIL)');
  {
    // Spouse CSV has matured but heir CSV has NOT
    const owner = generateKeypair();
    const spouse = generateKeypair();
    const heir = generateKeypair();
    const spouseBlocks = 10;
    const heirBlocks = 50;

    const ws = buildSpousePlanScript(
      owner.publicKey, spouse.publicKey, heir.publicKey,
      spouseBlocks, heirBlocks
    );
    const vaultAddr = p2wshAddress(ws.toString('hex'));

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    // Mine enough for spouse CSV but NOT heir CSV
    console.log(`  Mining ${spouseBlocks + 5} blocks (enough for spouse, not heir)...`);
    await mineBlocks(rpc, spouseBlocks + 5, minerAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    // Heir path: outer FALSE → inner FALSE
    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [heir],
      buildWitness: (sigs) => [sigs[0], Buffer.alloc(0), Buffer.alloc(0)],
      destinationAddress: dest,
      sequence: heirBlocks, // CSV requires this many blocks
    });

    const res = await broadcast(rpc, txHex);
    assert(!res.success, 'Heir CANNOT spend before their CSV', res.error || 'unexpectedly succeeded');
  }

  section('V2-8: Spouse Plan — Heir After CSV');
  {
    const owner = generateKeypair();
    const spouse = generateKeypair();
    const heir = generateKeypair();
    const spouseBlocks = 10;
    const heirBlocks = 20; // shorter for faster testing

    const ws = buildSpousePlanScript(
      owner.publicKey, spouse.publicKey, heir.publicKey,
      spouseBlocks, heirBlocks
    );
    const vaultAddr = p2wshAddress(ws.toString('hex'));
    console.log(`  Heir CSV: ${heirBlocks} blocks`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    console.log(`  Mining ${heirBlocks} blocks for heir CSV maturity...`);
    await mineBlocks(rpc, heirBlocks, minerAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [heir],
      buildWitness: (sigs) => [sigs[0], Buffer.alloc(0), Buffer.alloc(0)],
      destinationAddress: dest,
      sequence: heirBlocks,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, 'Heir CAN spend after CSV', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  // ═══════════════════════════════════════════════════
  //  FAMILY VAULT (owner + recovery + 2-of-3 heirs)
  // ═══════════════════════════════════════════════════

  section('V2-9: Family Vault — Owner Spend');
  {
    const owner = generateKeypair();
    const recovery = generateKeypair();
    const heir1 = generateKeypair();
    const heir2 = generateKeypair();
    const heir3 = generateKeypair();
    const recoveryBlocks = 10;
    const heirBlocks = 50;

    const { witnessScript: ws } = buildFamilyVaultScript(
      owner.publicKey, recovery.publicKey,
      [heir1.publicKey, heir2.publicKey, heir3.publicKey],
      recoveryBlocks, heirBlocks
    );
    const vaultAddr = p2wshAddress(ws.toString('hex'));
    console.log(`  Vault: ${vaultAddr}`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);
    const dest = p2wpkhAddress(generateKeypair().publicKey);

    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [owner],
      buildWitness: (sigs) => [sigs[0], Buffer.from([0x01])], // TRUE → owner path
      destinationAddress: dest,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, 'Owner can spend Family Vault anytime', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  section('V2-10: Family Vault — Recovery Before CSV (MUST FAIL)');
  {
    const owner = generateKeypair();
    const recovery = generateKeypair();
    const heir1 = generateKeypair();
    const heir2 = generateKeypair();
    const heir3 = generateKeypair();
    const recoveryBlocks = 10;
    const heirBlocks = 50;

    const { witnessScript: ws } = buildFamilyVaultScript(
      owner.publicKey, recovery.publicKey,
      [heir1.publicKey, heir2.publicKey, heir3.publicKey],
      recoveryBlocks, heirBlocks
    );
    const vaultAddr = p2wshAddress(ws.toString('hex'));

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);
    const dest = p2wpkhAddress(generateKeypair().publicKey);

    // Recovery path: outer FALSE → inner TRUE
    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [recovery],
      buildWitness: (sigs) => [sigs[0], Buffer.from([0x01]), Buffer.alloc(0)],
      destinationAddress: dest,
      sequence: recoveryBlocks,
    });

    const res = await broadcast(rpc, txHex);
    assert(!res.success, 'Recovery CANNOT spend before CSV', res.error || 'unexpectedly succeeded');
  }

  section('V2-11: Family Vault — Recovery After CSV');
  {
    const owner = generateKeypair();
    const recovery = generateKeypair();
    const heir1 = generateKeypair();
    const heir2 = generateKeypair();
    const heir3 = generateKeypair();
    const recoveryBlocks = 10;
    const heirBlocks = 50;

    const { witnessScript: ws } = buildFamilyVaultScript(
      owner.publicKey, recovery.publicKey,
      [heir1.publicKey, heir2.publicKey, heir3.publicKey],
      recoveryBlocks, heirBlocks
    );
    const vaultAddr = p2wshAddress(ws.toString('hex'));
    console.log(`  Recovery CSV: ${recoveryBlocks} blocks`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    console.log(`  Mining ${recoveryBlocks} blocks for recovery CSV maturity...`);
    await mineBlocks(rpc, recoveryBlocks, minerAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [recovery],
      buildWitness: (sigs) => [sigs[0], Buffer.from([0x01]), Buffer.alloc(0)],
      destinationAddress: dest,
      sequence: recoveryBlocks,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, 'Recovery CAN spend after CSV', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  section('V2-12: Family Vault — 1-of-3 Heir After CSV (MUST FAIL)');
  {
    const owner = generateKeypair();
    const recovery = generateKeypair();
    const heir1 = generateKeypair();
    const heir2 = generateKeypair();
    const heir3 = generateKeypair();
    const recoveryBlocks = 10;
    const heirBlocks = 15;

    const { witnessScript: ws, sortedHeirPubkeys } = buildFamilyVaultScript(
      owner.publicKey, recovery.publicKey,
      [heir1.publicKey, heir2.publicKey, heir3.publicKey],
      recoveryBlocks, heirBlocks
    );
    const vaultAddr = p2wshAddress(ws.toString('hex'));

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    console.log(`  Mining ${heirBlocks} blocks for heir CSV maturity...`);
    await mineBlocks(rpc, heirBlocks, minerAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    // Identify which keypair matches the first sorted position
    const allHeirs = [heir1, heir2, heir3];
    const sortedHeirs = [...allHeirs].sort((a, b) =>
      Buffer.from(a.publicKey, 'hex').compare(Buffer.from(b.publicKey, 'hex'))
    );

    // Only 1 sig — CHECKMULTISIG requires 2-of-3
    // Witness: [OP_0_dummy, real_sig, empty_placeholder, FALSE, FALSE]
    // CHECKMULTISIG pops 2 sigs: empty (fails all pubkeys) + real (matches one).
    // Only 1 match found, need 2. Result: FALSE → tx invalid.
    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [sortedHeirs[0]],
      buildWitness: (sigs) => [
        Buffer.alloc(0), // OP_0 dummy for CHECKMULTISIG bug
        sigs[0],         // sig for first sorted heir
        Buffer.alloc(0), // placeholder — not a valid sig
        Buffer.alloc(0), // inner FALSE → heir ELSE branch
        Buffer.alloc(0), // outer FALSE → ELSE branch
      ],
      destinationAddress: dest,
      sequence: heirBlocks,
    });

    const res = await broadcast(rpc, txHex);
    assert(!res.success, '1-of-3 heir CANNOT spend (needs 2-of-3)', res.error || 'unexpectedly succeeded');
  }

  section('V2-13: Family Vault — 2-of-3 Heirs After CSV');
  {
    const owner = generateKeypair();
    const recovery = generateKeypair();
    const heir1 = generateKeypair();
    const heir2 = generateKeypair();
    const heir3 = generateKeypair();
    const recoveryBlocks = 10;
    const heirBlocks = 15;

    const { witnessScript: ws } = buildFamilyVaultScript(
      owner.publicKey, recovery.publicKey,
      [heir1.publicKey, heir2.publicKey, heir3.publicKey],
      recoveryBlocks, heirBlocks
    );
    const vaultAddr = p2wshAddress(ws.toString('hex'));
    console.log(`  Vault: ${vaultAddr}  Heir CSV: ${heirBlocks} blocks`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    console.log(`  Mining ${heirBlocks} blocks for heir CSV maturity...`);
    await mineBlocks(rpc, heirBlocks, minerAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    // Sort heirs by pubkey to match BIP67 order in the script
    const allHeirs = [heir1, heir2, heir3];
    const sortedHeirs = [...allHeirs].sort((a, b) =>
      Buffer.from(a.publicKey, 'hex').compare(Buffer.from(b.publicKey, 'hex'))
    );

    // Sign with first two sorted heirs for 2-of-3
    // Witness: [OP_0, sig_sorted[0], sig_sorted[1], FALSE, FALSE]
    // CHECKMULTISIG verifies: sig_sorted[0] matches an early pubkey,
    // sig_sorted[1] matches a later pubkey. Both valid → 2 matched → TRUE.
    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [sortedHeirs[0], sortedHeirs[1]],
      buildWitness: (sigs) => [
        Buffer.alloc(0), // OP_0 dummy for CHECKMULTISIG bug
        sigs[0],         // sig for first sorted heir
        sigs[1],         // sig for second sorted heir
        Buffer.alloc(0), // inner FALSE → heir ELSE branch
        Buffer.alloc(0), // outer FALSE → ELSE branch
      ],
      destinationAddress: dest,
      sequence: heirBlocks,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, '2-of-3 heirs CAN spend after CSV', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  // ═══════════════════════════════════════════════════
  //  BUSINESS VAULT (joint + owner solo + trustee)
  // ═══════════════════════════════════════════════════
  // Uses generateBusinessVaultScript() from bitcoin-address.ts
  // which builds the script directly (can't compile via miniscript
  // due to intentional owner key reuse across joint + solo paths).

  section('V2-14: Business Vault — Joint Spend (Owner + Partner)');
  {
    const owner = generateKeypair();
    const partner = generateKeypair();
    const trustee = generateKeypair();
    const ownerSoloBlocks = 10;
    const trusteeBlocks = 50;

    const result = generateBusinessVaultScript(
      owner.publicKey, partner.publicKey, trustee.publicKey,
      ownerSoloBlocks, trusteeBlocks, 'testnet'
    );
    const vaultAddr = p2wshAddress(result.witnessScript);
    const ws = Buffer.from(result.witnessScript, 'hex');
    console.log(`  Vault: ${vaultAddr}`);
    console.log(`  Owner Solo CSV: ${ownerSoloBlocks}  Trustee CSV: ${trusteeBlocks}`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);
    const dest = p2wpkhAddress(generateKeypair().publicKey);

    // Joint path: TRUE → OP_IF → CHECKSIGVERIFY(owner) + CHECKSIG(partner)
    // Witness stack: [partner_sig, owner_sig, TRUE]
    // After OP_IF consumes TRUE, stack = [partner_sig, owner_sig]
    // CHECKSIGVERIFY pops owner_pubkey (pushed) + owner_sig → verify
    // CHECKSIG pops partner_pubkey (pushed) + partner_sig → verify
    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [owner, partner],
      buildWitness: (sigs) => [
        sigs[1],             // partner_sig (bottom)
        sigs[0],             // owner_sig (consumed first by CHECKSIGVERIFY)
        Buffer.from([0x01]), // TRUE → joint IF branch
      ],
      destinationAddress: dest,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, 'Joint (owner+partner) can spend anytime', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  section('V2-15: Business Vault — Owner Solo Before CSV (MUST FAIL)');
  {
    const owner = generateKeypair();
    const partner = generateKeypair();
    const trustee = generateKeypair();
    const ownerSoloBlocks = 10;
    const trusteeBlocks = 50;

    const result = generateBusinessVaultScript(
      owner.publicKey, partner.publicKey, trustee.publicKey,
      ownerSoloBlocks, trusteeBlocks, 'testnet'
    );
    const vaultAddr = p2wshAddress(result.witnessScript);
    const ws = Buffer.from(result.witnessScript, 'hex');

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);
    const dest = p2wpkhAddress(generateKeypair().publicKey);

    // Owner solo path: outer FALSE → inner TRUE → CSV + CHECKSIG
    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [owner],
      buildWitness: (sigs) => [
        sigs[0],             // owner_sig
        Buffer.from([0x01]), // inner TRUE → owner solo branch
        Buffer.alloc(0),     // outer FALSE → ELSE
      ],
      destinationAddress: dest,
      sequence: ownerSoloBlocks,
    });

    const res = await broadcast(rpc, txHex);
    assert(!res.success, 'Owner solo CANNOT spend before CSV', res.error || 'unexpectedly succeeded');
  }

  section('V2-16: Business Vault — Owner Solo After CSV');
  {
    const owner = generateKeypair();
    const partner = generateKeypair();
    const trustee = generateKeypair();
    const ownerSoloBlocks = 10;
    const trusteeBlocks = 50;

    const result = generateBusinessVaultScript(
      owner.publicKey, partner.publicKey, trustee.publicKey,
      ownerSoloBlocks, trusteeBlocks, 'testnet'
    );
    const vaultAddr = p2wshAddress(result.witnessScript);
    const ws = Buffer.from(result.witnessScript, 'hex');
    console.log(`  Owner Solo CSV: ${ownerSoloBlocks} blocks`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    console.log(`  Mining ${ownerSoloBlocks} blocks for owner solo CSV maturity...`);
    await mineBlocks(rpc, ownerSoloBlocks, minerAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [owner],
      buildWitness: (sigs) => [
        sigs[0],
        Buffer.from([0x01]),
        Buffer.alloc(0),
      ],
      destinationAddress: dest,
      sequence: ownerSoloBlocks,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, 'Owner solo CAN spend after CSV', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  section('V2-17: Business Vault — Trustee Before CSV (MUST FAIL)');
  {
    const owner = generateKeypair();
    const partner = generateKeypair();
    const trustee = generateKeypair();
    const ownerSoloBlocks = 10;
    const trusteeBlocks = 50;

    const result = generateBusinessVaultScript(
      owner.publicKey, partner.publicKey, trustee.publicKey,
      ownerSoloBlocks, trusteeBlocks, 'testnet'
    );
    const vaultAddr = p2wshAddress(result.witnessScript);
    const ws = Buffer.from(result.witnessScript, 'hex');

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    // Mine enough for owner solo CSV but NOT trustee CSV
    console.log(`  Mining ${ownerSoloBlocks + 5} blocks (enough for owner solo, not trustee)...`);
    await mineBlocks(rpc, ownerSoloBlocks + 5, minerAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    // Trustee path: outer FALSE → inner FALSE → CSV + CHECKSIG
    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [trustee],
      buildWitness: (sigs) => [
        sigs[0],
        Buffer.alloc(0), // inner FALSE → trustee branch
        Buffer.alloc(0), // outer FALSE → ELSE
      ],
      destinationAddress: dest,
      sequence: trusteeBlocks,
    });

    const res = await broadcast(rpc, txHex);
    assert(!res.success, 'Trustee CANNOT spend before CSV', res.error || 'unexpectedly succeeded');
  }

  section('V2-18: Business Vault — Trustee After CSV');
  {
    const owner = generateKeypair();
    const partner = generateKeypair();
    const trustee = generateKeypair();
    const ownerSoloBlocks = 10;
    const trusteeBlocks = 20; // shorter for faster testing

    const result = generateBusinessVaultScript(
      owner.publicKey, partner.publicKey, trustee.publicKey,
      ownerSoloBlocks, trusteeBlocks, 'testnet'
    );
    const vaultAddr = p2wshAddress(result.witnessScript);
    const ws = Buffer.from(result.witnessScript, 'hex');
    console.log(`  Trustee CSV: ${trusteeBlocks} blocks`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    console.log(`  Mining ${trusteeBlocks} blocks for trustee CSV maturity...`);
    await mineBlocks(rpc, trusteeBlocks, minerAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [trustee],
      buildWitness: (sigs) => [
        sigs[0],
        Buffer.alloc(0),
        Buffer.alloc(0),
      ],
      destinationAddress: dest,
      sequence: trusteeBlocks,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, 'Trustee CAN spend after CSV', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  // ═══════════════════════════════════════════════════
  //  DEAD MAN'S SWITCH V2 (owner + heir with CSV)
  // ═══════════════════════════════════════════════════
  // Structurally identical to Solo Vault (same OP_IF/ELSE/CSV script).
  // Included for completeness to confirm V2 "dead_mans_switch" profile
  // uses the same consensus-valid script with ~6 month default CSV.

  section("V2-19: Dead Man's Switch — Owner Refresh");
  {
    const owner = generateKeypair();
    const heir = generateKeypair();
    const csvBlocks = 10;

    const result = generateDeadManSwitchAddress(
      owner.publicKey, heir.publicKey, csvBlocks, 'testnet'
    );
    const vaultAddr = p2wshAddress(result.witnessScript);
    const ws = Buffer.from(result.witnessScript, 'hex');
    console.log(`  Vault: ${vaultAddr}  CSV: ${csvBlocks} blocks`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);
    const dest = p2wpkhAddress(generateKeypair().publicKey);

    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [owner],
      buildWitness: (sigs) => [sigs[0], Buffer.from([0x01])],
      destinationAddress: dest,
      sequence: 0xffffffff,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, 'Owner can refresh DMS anytime', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  section("V2-20: Dead Man's Switch — Heir After Inactivity");
  {
    const owner = generateKeypair();
    const heir = generateKeypair();
    const csvBlocks = 10;

    const result = generateDeadManSwitchAddress(
      owner.publicKey, heir.publicKey, csvBlocks, 'testnet'
    );
    const vaultAddr = p2wshAddress(result.witnessScript);
    const ws = Buffer.from(result.witnessScript, 'hex');
    console.log(`  CSV: ${csvBlocks} blocks`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    console.log(`  Mining ${csvBlocks} blocks for inactivity period...`);
    await mineBlocks(rpc, csvBlocks, minerAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    const txHex = buildSignedTx({
      utxo,
      witnessScript: ws,
      signers: [heir],
      buildWitness: (sigs) => [sigs[0], Buffer.alloc(0)],
      destinationAddress: dest,
      locktime: 0,
      sequence: result.sequence,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, 'Heir CAN spend after inactivity period', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  // ═══════════════════════════════════════════════════
  //  Summary
  // ═══════════════════════════════════════════════════
  const { failCount: failures } = summary();
  process.exit(failures > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n\x1b[31mFATAL:\x1b[0m', err);
  process.exit(1);
});
