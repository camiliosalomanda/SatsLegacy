/**
 * Test helpers for regtest integration tests.
 *
 * Keypair generation, UTXO funding, block mining, and manual
 * witness-stack construction for vault spends.
 */

import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { Buffer } from 'buffer';
import { RegtestRPC } from './rpc-client';

// ── ECPair factory ───────────────────────────────────
const ECPair = ECPairFactory(ecc);

// regtest uses the same bech32 prefix as testnet (tb1)
export const REGTEST = bitcoin.networks.regtest;

// ── Colours ──────────────────────────────────────────
const G = '\x1b[32m';
const R = '\x1b[31m';
const Y = '\x1b[33m';
const B = '\x1b[34m';
const BOLD = '\x1b[1m';
const RST = '\x1b[0m';

let passCount = 0;
let failCount = 0;

export function pass(label: string, detail?: string) {
  passCount++;
  console.log(`  [${G}PASS${RST}] ${label}${detail ? `  ${B}${detail}${RST}` : ''}`);
}

export function fail(label: string, detail?: string) {
  failCount++;
  console.log(`  [${R}FAIL${RST}] ${label}${detail ? `  ${R}${detail}${RST}` : ''}`);
}

export function assert(condition: boolean, label: string, detail?: string) {
  if (condition) pass(label, detail);
  else fail(label, detail);
}

export function section(title: string) {
  console.log(`\n${BOLD}${Y}── ${title} ──${RST}`);
}

export function summary() {
  console.log(`\n${BOLD}═══════════════════════════════════════${RST}`);
  console.log(`  ${G}Passed: ${passCount}${RST}   ${failCount > 0 ? R : G}Failed: ${failCount}${RST}`);
  console.log(`${BOLD}═══════════════════════════════════════${RST}\n`);
  return { passCount, failCount };
}

// ── Keypair generation ───────────────────────────────

export interface TestKeypair {
  publicKey: string;     // hex compressed
  privateKey: Buffer;
  ecpair: ReturnType<typeof ECPair.makeRandom>;
}

export function generateKeypair(): TestKeypair {
  const kp = ECPair.makeRandom({ network: REGTEST });
  return {
    publicKey: Buffer.from(kp.publicKey).toString('hex'),
    privateKey: Buffer.from(kp.privateKey!),
    ecpair: kp,
  };
}

// ── Funding helpers ──────────────────────────────────

/**
 * Bootstrap the regtest wallet: create wallet + mine 101 blocks so
 * coinbase outputs are spendable.
 */
export async function bootstrapWallet(rpc: RegtestRPC): Promise<string> {
  await rpc.createWallet('regtest_test');
  const minerAddr = await rpc.getNewAddress();
  await rpc.generateToAddress(101, minerAddr);
  return minerAddr;
}

/**
 * Fund an arbitrary address with `amountBtc` BTC.
 * Returns the txid of the funding transaction.
 */
export async function fundAddress(
  rpc: RegtestRPC,
  address: string,
  amountBtc: number,
  minerAddr: string
): Promise<string> {
  const txid = await rpc.sendToAddress(address, amountBtc);
  // Mine a block to confirm
  await rpc.generateToAddress(1, minerAddr);
  return txid;
}

/**
 * Mine `n` blocks.
 */
export async function mineBlocks(rpc: RegtestRPC, n: number, minerAddr: string): Promise<void> {
  await rpc.generateToAddress(n, minerAddr);
}

// ── UTXO lookup ──────────────────────────────────────

export interface TestUTXO {
  txid: string;
  vout: number;
  value: number;       // satoshis
  rawTxHex: string;
}

/**
 * Find the UTXO that funded `address` from transaction `txid`.
 */
export async function findUTXO(rpc: RegtestRPC, txid: string, address: string): Promise<TestUTXO> {
  const rawHex: string = await rpc.getRawTransaction(txid);
  const tx = bitcoin.Transaction.fromHex(rawHex);

  for (let i = 0; i < tx.outs.length; i++) {
    try {
      const outAddr = bitcoin.address.fromOutputScript(
        Buffer.from(tx.outs[i].script),
        REGTEST
      );
      if (outAddr === address) {
        return {
          txid,
          vout: i,
          value: Number(tx.outs[i].value),
          rawTxHex: rawHex,
        };
      }
    } catch {
      // output is not a standard address type — skip
    }
  }
  throw new Error(`No output to ${address} found in tx ${txid}`);
}

// ── Transaction building + signing ───────────────────

export type SpendPath =
  | 'owner'
  | 'heir'
  | 'multisig_before_decay'
  | 'multisig_after_decay';

export interface SignVaultSpendOpts {
  utxo: TestUTXO;
  witnessScript: Buffer;
  signers: ReturnType<typeof ECPair.makeRandom>[];
  spendPath: SpendPath;
  destinationAddress: string;
  fee?: number;            // sats, default 1000
  locktime?: number;       // nLockTime (for CLTV heir paths)
  sequence?: number;       // nSequence (for CSV heir paths)
}

/**
 * Build and sign a transaction that spends from a P2WSH vault.
 *
 * Manually constructs the witness stack matching the finalizePsbt logic
 * in psbt-builder.ts.
 *
 * Returns the fully signed transaction hex ready for broadcast.
 */
export function signVaultSpend(opts: SignVaultSpendOpts): string {
  const {
    utxo,
    witnessScript,
    signers,
    spendPath,
    destinationAddress,
    fee = 1000,
    locktime = 0,
    sequence,
  } = opts;

  const tx = new bitcoin.Transaction();
  tx.version = 2;
  tx.locktime = locktime;

  // Determine nSequence
  let nSequence: number;
  if (sequence !== undefined) {
    nSequence = sequence;
  } else if (spendPath === 'owner' || spendPath === 'multisig_before_decay') {
    nSequence = 0xffffffff;
  } else {
    // heir CLTV path: must be < 0xFFFFFFFF to enable nLockTime
    nSequence = 0xfffffffe;
  }

  // Add input
  tx.addInput(Buffer.from(utxo.txid, 'hex').reverse(), utxo.vout, nSequence);

  // Add output
  const outputValue = utxo.value - fee;
  const outputScript = bitcoin.address.toOutputScript(destinationAddress, REGTEST);
  tx.addOutput(outputScript, BigInt(outputValue));

  // Compute sighash
  const p2wsh = bitcoin.payments.p2wsh({
    redeem: { output: witnessScript },
    network: REGTEST,
  });
  const sighashType = bitcoin.Transaction.SIGHASH_ALL;
  const sigHash = tx.hashForWitnessV0(
    0,
    witnessScript,
    BigInt(utxo.value),
    sighashType
  );

  // Sign with each signer
  const signatures: Buffer[] = signers.map(kp => {
    const sig = kp.sign(sigHash);
    // Append sighash type byte
    return Buffer.concat([sig, Buffer.from([sighashType])]);
  });

  // Build witness stack based on spend path
  const isMultisig = spendPath === 'multisig_before_decay' || spendPath === 'multisig_after_decay';
  const isOwnerOrBeforeDecay = spendPath === 'owner' || spendPath === 'multisig_before_decay';

  let witnessStack: Buffer[];

  if (isMultisig) {
    // CHECKMULTISIG: [OP_0, sig1, sig2, ..., branchFlag, witnessScript]
    const branchFlag = isOwnerOrBeforeDecay
      ? Buffer.from([0x01])  // TRUE → OP_IF
      : Buffer.alloc(0);     // empty → OP_ELSE
    witnessStack = [
      Buffer.alloc(0), // OP_0 dummy for CHECKMULTISIG bug
      ...signatures,
      branchFlag,
      witnessScript,
    ];
  } else {
    // CHECKSIG: [sig, branchFlag, witnessScript]
    const branchFlag = spendPath === 'owner'
      ? Buffer.from([0x01])
      : Buffer.alloc(0);
    witnessStack = [
      signatures[0],
      branchFlag,
      witnessScript,
    ];
  }

  tx.setWitness(0, witnessStack);

  return tx.toHex();
}

/**
 * Attempt to broadcast a raw transaction.
 * Returns { success, txid?, error? }.
 */
export async function broadcast(
  rpc: RegtestRPC,
  txHex: string
): Promise<{ success: boolean; txid?: string; error?: string }> {
  try {
    const txid = await rpc.sendRawTransaction(txHex);
    return { success: true, txid };
  } catch (e: any) {
    return { success: false, error: e.rpcMessage || e.message };
  }
}
