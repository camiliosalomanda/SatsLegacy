#!/usr/bin/env tsx
/**
 * Regtest Integration Tests for SatsLegacy Vault Scripts
 *
 * Runs against a real Bitcoin Core regtest node via Docker.
 * Proves every vault type is spendable under correct conditions
 * and NOT spendable under wrong conditions.
 *
 * Run: npm run test:regtest
 */

import * as bitcoin from 'bitcoinjs-lib';
import { Buffer } from 'buffer';

import {
  generateTimelockAddress,
  generateDeadManSwitchAddress,
  generateMultisigDecayAddress,
} from '../../src/vault/scripts/bitcoin-address';
import {
  finalizePsbt,
  detectScriptType,
} from '../../src/vault/scripts/psbt-builder';
import type { MultisigDecayConfig } from '../../src/vault/scripts/types';

import { RegtestRPC } from './rpc-client';
import {
  REGTEST,
  generateKeypair,
  bootstrapWallet,
  fundAddress,
  mineBlocks,
  findUTXO,
  signVaultSpend,
  broadcast,
  pass,
  fail,
  assert,
  section,
  summary,
} from './test-helpers';

// ─── Network mapping ─────────────────────────────────
// The address generation functions accept 'testnet' which produces
// tb1... addresses. Regtest also uses tb1... (bcrt1 in newer Core,
// but bitcoinjs-lib's regtest network handles both). We generate
// addresses using the REGTEST network object directly when needed.
//
// Since bitcoin-address.ts only accepts 'mainnet'|'testnet'|'signet',
// we use 'testnet' and then re-derive the P2WSH address from the
// witness script using REGTEST network to get the correct bcrt1 prefix.

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

// ─── Main ────────────────────────────────────────────

async function main() {
  console.log('\n\x1b[1m╔═══════════════════════════════════════╗');
  console.log('║  SatsLegacy Regtest Integration Tests  ║');
  console.log('╚═══════════════════════════════════════╝\x1b[0m\n');

  const rpc = new RegtestRPC();

  // Wait for bitcoind
  console.log('Waiting for bitcoind...');
  await rpc.waitForReady(30, 2000);
  console.log('bitcoind is ready.\n');

  // Bootstrap
  const minerAddr = await bootstrapWallet(rpc);
  const startHeight = await rpc.getBlockCount();
  console.log(`Start block height: ${startHeight}`);

  // ═════════════════════════════════════════════
  //  TEST 1: Timelock — Owner Spend
  // ═════════════════════════════════════════════
  section('Test 1: Timelock Vault — Owner Spend');
  {
    const owner = generateKeypair();
    const heir = generateKeypair();
    const currentHeight = await rpc.getBlockCount();
    const locktime = currentHeight + 200; // far in the future

    // Generate vault
    const result = generateTimelockAddress(owner.publicKey, heir.publicKey, locktime, 'testnet');
    const vaultAddr = p2wshAddress(result.witnessScript);
    console.log(`  Vault address: ${vaultAddr}`);
    console.log(`  Locktime: block ${locktime} (current: ${currentHeight})`);

    // Fund
    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);
    assert(utxo.value === 100_000_000, 'Vault funded with 1 BTC', `${utxo.value} sats`);

    // Destination
    const dest = p2wpkhAddress(generateKeypair().publicKey);

    // Owner spend
    const txHex = signVaultSpend({
      utxo,
      witnessScript: Buffer.from(result.witnessScript, 'hex'),
      signers: [owner.ecpair],
      spendPath: 'owner',
      destinationAddress: dest,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, 'Owner can spend timelock vault anytime', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  // ═════════════════════════════════════════════
  //  TEST 2: Timelock — Heir Before Locktime (MUST FAIL)
  // ═════════════════════════════════════════════
  section('Test 2: Timelock Vault — Heir Spend Before Locktime (MUST FAIL)');
  {
    const owner = generateKeypair();
    const heir = generateKeypair();
    const currentHeight = await rpc.getBlockCount();
    const locktime = currentHeight + 200;

    const result = generateTimelockAddress(owner.publicKey, heir.publicKey, locktime, 'testnet');
    const vaultAddr = p2wshAddress(result.witnessScript);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    const txHex = signVaultSpend({
      utxo,
      witnessScript: Buffer.from(result.witnessScript, 'hex'),
      signers: [heir.ecpair],
      spendPath: 'heir',
      destinationAddress: dest,
      locktime,
      sequence: 0xfffffffe,
    });

    const res = await broadcast(rpc, txHex);
    assert(!res.success, 'Heir CANNOT spend before locktime', res.error || 'unexpectedly succeeded');
  }

  // ═════════════════════════════════════════════
  //  TEST 3: Timelock — Heir After Locktime
  // ═════════════════════════════════════════════
  section('Test 3: Timelock Vault — Heir Spend After Locktime');
  {
    const owner = generateKeypair();
    const heir = generateKeypair();
    const currentHeight = await rpc.getBlockCount();
    const locktime = currentHeight + 10; // close locktime

    const result = generateTimelockAddress(owner.publicKey, heir.publicKey, locktime, 'testnet');
    const vaultAddr = p2wshAddress(result.witnessScript);
    console.log(`  Locktime: block ${locktime} (current: ${currentHeight})`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    // Mine past locktime
    const blocksNeeded = locktime - (await rpc.getBlockCount()) + 1;
    if (blocksNeeded > 0) {
      console.log(`  Mining ${blocksNeeded} blocks to pass locktime...`);
      await mineBlocks(rpc, blocksNeeded, minerAddr);
    }
    const afterHeight = await rpc.getBlockCount();
    console.log(`  Current height after mining: ${afterHeight}`);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    const txHex = signVaultSpend({
      utxo,
      witnessScript: Buffer.from(result.witnessScript, 'hex'),
      signers: [heir.ecpair],
      spendPath: 'heir',
      destinationAddress: dest,
      locktime,
      sequence: 0xfffffffe,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, 'Heir CAN spend after locktime', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  // ═════════════════════════════════════════════
  //  TEST 4: Dead Man's Switch — Owner Refresh
  // ═════════════════════════════════════════════
  section("Test 4: Dead Man's Switch — Owner Refresh");
  {
    const owner = generateKeypair();
    const heir = generateKeypair();
    const sequenceBlocks = 10;

    const result = generateDeadManSwitchAddress(
      owner.publicKey, heir.publicKey, sequenceBlocks, 'testnet'
    );
    const vaultAddr = p2wshAddress(result.witnessScript);
    console.log(`  Vault address: ${vaultAddr}`);
    console.log(`  CSV sequence: ${result.sequence} (${sequenceBlocks} blocks)`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    // Owner spend — sequence 0xFFFFFFFF (no CSV restriction)
    const txHex = signVaultSpend({
      utxo,
      witnessScript: Buffer.from(result.witnessScript, 'hex'),
      signers: [owner.ecpair],
      spendPath: 'owner',
      destinationAddress: dest,
      sequence: 0xffffffff,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, 'Owner can spend DMS vault anytime', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  // ═════════════════════════════════════════════
  //  TEST 5: DMS — Heir Before Inactivity Period (MUST FAIL)
  // ═════════════════════════════════════════════
  section("Test 5: Dead Man's Switch — Heir Before Inactivity (MUST FAIL)");
  {
    const owner = generateKeypair();
    const heir = generateKeypair();
    const sequenceBlocks = 10;

    const result = generateDeadManSwitchAddress(
      owner.publicKey, heir.publicKey, sequenceBlocks, 'testnet'
    );
    const vaultAddr = p2wshAddress(result.witnessScript);

    // Fund and mine only 1 block (to confirm), NOT enough for CSV
    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    // Heir spend with CSV sequence value
    const txHex = signVaultSpend({
      utxo,
      witnessScript: Buffer.from(result.witnessScript, 'hex'),
      signers: [heir.ecpair],
      spendPath: 'heir',
      destinationAddress: dest,
      locktime: 0,
      sequence: result.sequence,
    });

    const res = await broadcast(rpc, txHex);
    assert(!res.success, 'Heir CANNOT spend before CSV period', res.error || 'unexpectedly succeeded');
  }

  // ═════════════════════════════════════════════
  //  TEST 6: DMS — Heir After Inactivity Period
  // ═════════════════════════════════════════════
  section("Test 6: Dead Man's Switch — Heir After Inactivity Period");
  {
    const owner = generateKeypair();
    const heir = generateKeypair();
    const sequenceBlocks = 10;

    const result = generateDeadManSwitchAddress(
      owner.publicKey, heir.publicKey, sequenceBlocks, 'testnet'
    );
    const vaultAddr = p2wshAddress(result.witnessScript);
    console.log(`  CSV sequence: ${result.sequence} (${sequenceBlocks} blocks)`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    // Mine enough blocks so the UTXO is old enough for CSV
    console.log(`  Mining ${sequenceBlocks} blocks for CSV maturity...`);
    await mineBlocks(rpc, sequenceBlocks, minerAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    const txHex = signVaultSpend({
      utxo,
      witnessScript: Buffer.from(result.witnessScript, 'hex'),
      signers: [heir.ecpair],
      spendPath: 'heir',
      destinationAddress: dest,
      locktime: 0,
      sequence: result.sequence,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, 'Heir CAN spend after CSV inactivity period', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  // ═════════════════════════════════════════════
  //  TEST 7: Multisig Decay — 2-of-3 Before Decay
  // ═════════════════════════════════════════════
  section('Test 7: Multisig Decay — 2-of-3 Before Decay');
  {
    const owner = generateKeypair();
    const heir1 = generateKeypair();
    const heir2 = generateKeypair();
    const currentHeight = await rpc.getBlockCount();

    const config: MultisigDecayConfig = {
      initialThreshold: 2,
      initialTotal: 3,
      decayedThreshold: 1,
      decayedTotal: 2,
      decayAfterBlocks: currentHeight + 200, // far in the future
    };

    const result = generateMultisigDecayAddress(
      owner.publicKey, [heir1.publicKey, heir2.publicKey], config, 'testnet'
    );
    const vaultAddr = p2wshAddress(result.witnessScript);
    console.log(`  Vault address: ${vaultAddr}`);
    console.log(`  Decay at block: ${config.decayAfterBlocks}`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    // The witness script sorts pubkeys by BIP67. We need to sign with
    // 2 keys that appear in the sorted initial set and provide signatures
    // in the correct order matching the sorted pubkeys.
    const witnessScript = Buffer.from(result.witnessScript, 'hex');
    const allKeys = [owner, heir1, heir2];

    // Sort the same way generateMultisigDecayAddress does (BIP67)
    const sortedPairs = [...allKeys].sort((a, b) =>
      Buffer.from(a.publicKey, 'hex').compare(Buffer.from(b.publicKey, 'hex'))
    );

    // Pick first 2 from sorted order for 2-of-3
    const signers = [sortedPairs[0], sortedPairs[1]];

    // For CHECKMULTISIG, signatures must be in the same order as pubkeys
    // appear in the script. We already sorted, so sign in this order.
    const txHex = signVaultSpend({
      utxo,
      witnessScript,
      signers: signers.map(k => k.ecpair),
      spendPath: 'multisig_before_decay',
      destinationAddress: dest,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, '2-of-3 multisig spend before decay', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  // ═════════════════════════════════════════════
  //  TEST 8: Multisig Decay — 1-of-2 Heir Before Decay (MUST FAIL)
  // ═════════════════════════════════════════════
  section('Test 8: Multisig Decay — 1-of-2 Heir Before Decay (MUST FAIL)');
  {
    const owner = generateKeypair();
    const heir1 = generateKeypair();
    const heir2 = generateKeypair();
    const currentHeight = await rpc.getBlockCount();

    const config: MultisigDecayConfig = {
      initialThreshold: 2,
      initialTotal: 3,
      decayedThreshold: 1,
      decayedTotal: 2,
      decayAfterBlocks: currentHeight + 200,
    };

    const result = generateMultisigDecayAddress(
      owner.publicKey, [heir1.publicKey, heir2.publicKey], config, 'testnet'
    );
    const vaultAddr = p2wshAddress(result.witnessScript);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    // Sort heir keys same as the script
    const heirKeys = [heir1, heir2].sort((a, b) =>
      Buffer.from(a.publicKey, 'hex').compare(Buffer.from(b.publicKey, 'hex'))
    );

    // Try OP_ELSE path (after decay) with 1 heir — should fail because locktime not reached
    const txHex = signVaultSpend({
      utxo,
      witnessScript: Buffer.from(result.witnessScript, 'hex'),
      signers: [heirKeys[0].ecpair],
      spendPath: 'multisig_after_decay',
      destinationAddress: dest,
      locktime: config.decayAfterBlocks,
      sequence: 0xfffffffe,
    });

    const res = await broadcast(rpc, txHex);
    assert(!res.success, 'Heir CANNOT use decayed path before locktime', res.error || 'unexpectedly succeeded');
  }

  // ═════════════════════════════════════════════
  //  TEST 9: Multisig Decay — 1-of-2 Heir After Decay
  // ═════════════════════════════════════════════
  section('Test 9: Multisig Decay — 1-of-2 Heir After Decay');
  {
    const owner = generateKeypair();
    const heir1 = generateKeypair();
    const heir2 = generateKeypair();
    const currentHeight = await rpc.getBlockCount();

    const config: MultisigDecayConfig = {
      initialThreshold: 2,
      initialTotal: 3,
      decayedThreshold: 1,
      decayedTotal: 2,
      decayAfterBlocks: currentHeight + 10,
    };

    const result = generateMultisigDecayAddress(
      owner.publicKey, [heir1.publicKey, heir2.publicKey], config, 'testnet'
    );
    const vaultAddr = p2wshAddress(result.witnessScript);
    console.log(`  Vault address: ${vaultAddr}`);
    console.log(`  Decay at block: ${config.decayAfterBlocks} (current: ${currentHeight})`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    // Mine past the decay point
    const blocksNeeded = config.decayAfterBlocks - (await rpc.getBlockCount()) + 1;
    if (blocksNeeded > 0) {
      console.log(`  Mining ${blocksNeeded} blocks to pass decay locktime...`);
      await mineBlocks(rpc, blocksNeeded, minerAddr);
    }
    const afterHeight = await rpc.getBlockCount();
    console.log(`  Current height after mining: ${afterHeight}`);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    // Sort heir keys same as the script
    const heirKeys = [heir1, heir2].sort((a, b) =>
      Buffer.from(a.publicKey, 'hex').compare(Buffer.from(b.publicKey, 'hex'))
    );

    // 1-of-2 heir spend via OP_ELSE (after decay)
    const txHex = signVaultSpend({
      utxo,
      witnessScript: Buffer.from(result.witnessScript, 'hex'),
      signers: [heirKeys[0].ecpair],
      spendPath: 'multisig_after_decay',
      destinationAddress: dest,
      locktime: config.decayAfterBlocks,
      sequence: 0xfffffffe,
    });

    const res = await broadcast(rpc, txHex);
    assert(res.success, '1-of-2 heir can spend after decay', res.txid || res.error);
    if (res.success) await mineBlocks(rpc, 1, minerAddr);
  }

  // ═════════════════════════════════════════════
  //  TEST 10: finalizePsbt Integration
  // ═════════════════════════════════════════════
  section('Test 10: finalizePsbt Integration — Consensus Acceptance');
  {
    const owner = generateKeypair();
    const heir = generateKeypair();
    const currentHeight = await rpc.getBlockCount();
    const locktime = currentHeight + 200;

    const result = generateTimelockAddress(owner.publicKey, heir.publicKey, locktime, 'testnet');
    const vaultAddr = p2wshAddress(result.witnessScript);
    const witnessScript = Buffer.from(result.witnessScript, 'hex');

    console.log(`  Vault address: ${vaultAddr}`);

    const fundTxid = await fundAddress(rpc, vaultAddr, 1.0, minerAddr);
    const utxo = await findUTXO(rpc, fundTxid, vaultAddr);

    const dest = p2wpkhAddress(generateKeypair().publicKey);

    // Build a PSBT using bitcoinjs-lib, sign it, then finalize with our finalizePsbt()
    const psbt = new bitcoin.Psbt({ network: REGTEST });

    // Parse funding tx to get the output script
    const fundingTx = bitcoin.Transaction.fromHex(utxo.rawTxHex);
    const fundingOutput = fundingTx.outs[utxo.vout];

    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      sequence: 0xffffffff, // owner path
      witnessUtxo: {
        script: Buffer.from(fundingOutput.script),
        value: BigInt(utxo.value),
      },
      witnessScript,
    });

    const outputValue = utxo.value - 1000;
    psbt.addOutput({
      address: dest,
      value: BigInt(outputValue),
    });

    // Sign with owner key
    psbt.signInput(0, owner.ecpair);

    // Use our finalizePsbt() from psbt-builder.ts
    const psbtBase64 = psbt.toBase64();
    const finalizeResult = finalizePsbt(psbtBase64, 'testnet', 'owner');

    assert(!finalizeResult.error, 'finalizePsbt completes without error', finalizeResult.error);

    if (finalizeResult.txHex) {
      const res = await broadcast(rpc, finalizeResult.txHex);
      assert(res.success, 'finalizePsbt output accepted by consensus', res.txid || res.error);
      if (res.success) await mineBlocks(rpc, 1, minerAddr);
    } else {
      fail('finalizePsbt produced no txHex');
    }
  }

  // ═════════════════════════════════════════════
  //  Summary
  // ═════════════════════════════════════════════
  const { failCount: failures } = summary();
  process.exit(failures > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n\x1b[31mFATAL:\x1b[0m', err);
  process.exit(1);
});
