/**
 * SatsLegacy Bitcoin Address Utilities
 *
 * Generates vault addresses from configuration.
 * Uses bitcoinjs-lib for address derivation.
 */

import * as bitcoin from 'bitcoinjs-lib';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { Buffer } from 'buffer';
import type { SpendPath, MultisigDecayConfig } from './types';

// Re-export shared types so existing consumers that import from bitcoin-address.ts still work
export type { SpendPath, MultisigDecayConfig } from './types';

// ============================================
// TYPES
// ============================================

// SpendPath is imported+re-exported from ./types

/** Redeem information returned by address generation functions */
export interface VaultRedeemInfo {
  ownerPubkey?: string;
  heirPubkey?: string;
  heirPubkeys?: string[];
  locktime?: number;
  sequenceBlocks?: number;
  sequenceEncoded?: number;
  estimatedDays?: number;
  timelockType?: 'absolute' | 'relative';
  config?: {
    initialThreshold: number;
    initialTotal: number;
    decayedThreshold: number;
    decayedTotal: number;
    decayAfterBlocks: number;
  };
  pubkeys?: string[];
  threshold?: number;
  decayedThreshold?: number;
  miniscript?: string;
  keys?: string[];
  spendPaths: SpendPath[];
}

// Initialize BIP32 with secp256k1
const bip32 = BIP32Factory(ecc);

// Network configurations
const networks = {
  mainnet: bitcoin.networks.bitcoin,
  testnet: bitcoin.networks.testnet,
  signet: bitcoin.networks.testnet, // Signet uses testnet address format
};

// Block height estimation anchor point
// Block 878,000 was mined approximately January 1, 2025
const ANCHOR_HEIGHT = 878000;
const ANCHOR_DATE = new Date('2025-01-01T00:00:00Z');
const BLOCKS_PER_DAY = 144; // ~10 min per block

/**
 * Estimate the current Bitcoin block height based on a known anchor point.
 * Uses ~144 blocks/day (10 min average).
 */
export function estimateCurrentBlockHeight(): number {
  const now = new Date();
  const daysSinceAnchor = (now.getTime() - ANCHOR_DATE.getTime()) / (24 * 60 * 60 * 1000);
  return Math.floor(ANCHOR_HEIGHT + daysSinceAnchor * BLOCKS_PER_DAY);
}

/**
 * Convert a date string to an estimated Bitcoin block height (for CLTV locktime).
 *
 * Uses a known anchor point (block 878,000 ~ Jan 1 2025) and ~144 blocks/day.
 * This is the standard way to set absolute timelocks for inheritance vaults.
 */
export function dateToBlockHeight(dateStr: string): number {
  const targetDate = new Date(dateStr);
  if (isNaN(targetDate.getTime())) {
    throw new Error(`Invalid date string: "${dateStr}". Cannot compute block height.`);
  }
  if (targetDate.getTime() < Date.now()) {
    throw new Error(
      `Lock date ${dateStr} is in the past. A past locktime means the heir path is immediately spendable.`
    );
  }
  const daysSinceAnchor = (targetDate.getTime() - ANCHOR_DATE.getTime()) / (24 * 60 * 60 * 1000);
  return Math.floor(ANCHOR_HEIGHT + daysSinceAnchor * BLOCKS_PER_DAY);
}

/**
 * Convert a Uint8Array to hex string.
 * Uses Buffer for efficiency since it's already available via the buffer polyfill.
 */
function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

/**
 * Convert an xpub/tpub to a hex-encoded public key
 *
 * IMPORTANT: This derives the first receive address key (/0/0) from the xpub,
 * NOT the account-level key. This ensures compatibility with standard wallet
 * software like Sparrow, Electrum, etc. that can sign for derived addresses.
 *
 * Extended public key format (78 bytes total after base58check decode):
 * - 4 bytes: version
 * - 1 byte: depth
 * - 4 bytes: parent fingerprint
 * - 4 bytes: child index
 * - 32 bytes: chain code
 * - 33 bytes: public key
 *
 * @param xpub - The extended public key (xpub, tpub, etc.)
 * @param derivePath - Derivation path from the xpub (default: "0/0" for first receive address)
 * @returns Hex-encoded compressed public key
 */
export function xpubToPublicKey(xpub: string, derivePath: string = '0/0'): string {
  try {
    // Parse the xpub using BIP32
    const node = bip32.fromBase58(xpub);

    // Derive the child key at the specified path (e.g., /0/0 for first receive address)
    // This makes the key compatible with standard wallet software
    const childNode = node.derivePath(derivePath);

    // Get the compressed public key
    const publicKey = childNode.publicKey;

    // Validate it's a compressed public key (starts with 02 or 03)
    if (publicKey[0] !== 0x02 && publicKey[0] !== 0x03) {
      throw new Error('Invalid public key prefix');
    }

    return toHex(publicKey);
  } catch (e) {
    console.error('Failed to parse xpub:', e);
    throw new Error('Invalid extended public key format. Make sure you\'re using a valid xpub/tpub.');
  }
}

/**
 * Get the fingerprint of this xpub node (for PSBT BIP32 derivation info).
 *
 * NOTE: This returns the fingerprint of the xpub node itself (HASH160 of its
 * public key), NOT the master/root fingerprint. For PSBT BIP32 derivation
 * hints, hardware wallets need the root master fingerprint. To get that,
 * you would need the root xpub (depth 0) or store the master fingerprint
 * separately during initial key setup.
 */
export function getXpubFingerprint(xpub: string): Buffer {
  try {
    const node = bip32.fromBase58(xpub);
    return Buffer.from(node.fingerprint);
  } catch {
    return Buffer.alloc(4); // Return empty fingerprint on error
  }
}

/**
 * Check if a string is an extended public key (xpub/tpub/etc).
 * Accepts standard prefixes: xpub, ypub, zpub, tpub, upub, vpub
 * and their uppercase variants (Ypub, Zpub).
 * Validates against Base58 character set (no 0, O, I, l).
 */
export function isExtendedPubkey(key: string): boolean {
  return /^[xXyYzZtTuUvV]pub[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{100,108}$/.test(key);
}

/**
 * Check if a string is a valid hex public key (33 bytes compressed)
 */
export function isHexPubkey(key: string): boolean {
  return /^(02|03)[a-fA-F0-9]{64}$/.test(key);
}

/**
 * Normalize a public key - convert xpub to hex if needed
 */
export function normalizePublicKey(key: string): string {
  if (isHexPubkey(key)) {
    return key.toLowerCase();
  }
  if (isExtendedPubkey(key)) {
    return xpubToPublicKey(key);
  }
  throw new Error('Invalid public key format. Expected xpub/tpub or 33-byte hex compressed pubkey.');
}

/**
 * Generate a simple P2WPKH (native segwit) address from a public key.
 *
 * Expects a 33-byte compressed public key in hex (starting with 02 or 03).
 * Callers should validate with isHexPubkey() or normalizePublicKey() first.
 * bitcoinjs-lib will throw internally if the key is invalid, but pre-validation
 * provides clearer error messages.
 */
export function generateP2WPKHAddress(
  publicKeyHex: string,
  network: 'mainnet' | 'testnet' | 'signet' = 'mainnet'
): string {
  const pubkeyBuffer = Buffer.from(publicKeyHex, 'hex');
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: pubkeyBuffer,
    network: networks[network],
  });
  
  if (!address) {
    throw new Error('Failed to generate P2WPKH address');
  }
  
  return address;
}

/**
 * Generate a P2WSH (native segwit script hash) address from a witness script
 */
export function generateP2WSHAddress(
  witnessScriptHex: string,
  network: 'mainnet' | 'testnet' | 'signet' = 'mainnet'
): string {
  const scriptBuffer = Buffer.from(witnessScriptHex, 'hex');
  const { address } = bitcoin.payments.p2wsh({
    redeem: { output: scriptBuffer },
    network: networks[network],
  });
  
  if (!address) {
    throw new Error('Failed to generate P2WSH address');
  }
  
  return address;
}

/**
 * Generate a simple 2-of-2 multisig address (owner + heir)
 * This is a simplified version for basic inheritance vaults
 */
export function generateMultisigAddress(
  publicKeys: string[],
  threshold: number,
  network: 'mainnet' | 'testnet' | 'signet' = 'mainnet'
): { address: string; redeemScript: string } {
  const pubkeyBuffers = publicKeys.map(pk => Buffer.from(pk, 'hex'));
  
  const p2ms = bitcoin.payments.p2ms({
    m: threshold,
    pubkeys: pubkeyBuffers,
    network: networks[network],
  });
  
  const p2wsh = bitcoin.payments.p2wsh({
    redeem: p2ms,
    network: networks[network],
  });
  
  if (!p2wsh.address || !p2ms.output) {
    throw new Error('Failed to generate multisig address');
  }
  
  return {
    address: p2wsh.address,
    redeemScript: p2ms.output.toString('hex'),
  };
}

/**
 * Encode a relative timelock value for OP_CHECKSEQUENCEVERIFY
 *
 * BIP68 sequence number encoding:
 * - Bits 0-15: Lock value (blocks or 512-second intervals)
 * - Bit 22: If set, use time-based lock (512-second intervals)
 * - Bit 31: Must be 0 for CSV to be enforced
 *
 * For block-based locks (days * 144 blocks/day):
 * - Max ~65535 blocks (~455 days)
 * - For longer periods, use time-based encoding
 */
function encodeSequence(blocks: number, useTimeBased: boolean = false): number {
  if (useTimeBased) {
    // Time-based: value is in 512-second intervals
    // Set bit 22 (0x00400000) for time-based
    const intervals = Math.floor(blocks * 600 / 512); // Convert blocks to 512s intervals
    if (intervals > 0xFFFF) {
      throw new Error(
        `Sequence value overflow: ${intervals} intervals exceeds BIP68 maximum of 65535 ` +
        `(~388 days in time-based mode). Reduce the inactivity period.`
      );
    }
    return 0x00400000 | (intervals & 0xFFFF);
  }
  // Block-based: just the number of blocks (max 65535)
  if (blocks > 0xFFFF) {
    throw new Error(
      `Sequence value overflow: ${blocks} blocks exceeds BIP68 maximum of 65535 ` +
      `(~455 days). Use time-based encoding for longer periods.`
    );
  }
  return blocks & 0xFFFF;
}

/**
 * Generate a Dead Man's Switch address using relative timelock (CSV)
 *
 * Script: OP_IF <owner_pubkey> OP_CHECKSIG OP_ELSE <sequence> OP_CHECKSEQUENCEVERIFY OP_DROP <heir_pubkey> OP_CHECKSIG OP_ENDIF
 *
 * Owner can spend anytime (resets the timer by creating new UTXO).
 * Heir can spend after UTXO has been unspent for `sequenceBlocks` blocks.
 *
 * Key difference from CLTV timelock:
 * - CLTV: Absolute block height (heir can spend after block N)
 * - CSV: Relative to UTXO creation (heir can spend N blocks after last activity)
 */
export function generateDeadManSwitchAddress(
  ownerPubkeyHex: string,
  heirPubkeyHex: string,
  sequenceBlocks: number, // Number of blocks of inactivity before heir can claim
  network: 'mainnet' | 'testnet' | 'signet' = 'mainnet'
): { address: string; witnessScript: string; sequence: number; redeemInfo: VaultRedeemInfo } {
  const ownerPubkey = Buffer.from(ownerPubkeyHex, 'hex');
  const heirPubkey = Buffer.from(heirPubkeyHex, 'hex');

  // Encode sequence for CSV
  // For periods > 65535 blocks (~455 days), use time-based encoding
  const useTimeBased = sequenceBlocks > 65535;
  const sequence = encodeSequence(sequenceBlocks, useTimeBased);
  const sequenceBuffer = bitcoin.script.number.encode(sequence);

  // Build the script:
  // OP_IF
  //   <owner_pubkey> OP_CHECKSIG
  // OP_ELSE
  //   <sequence> OP_CHECKSEQUENCEVERIFY OP_DROP
  //   <heir_pubkey> OP_CHECKSIG
  // OP_ENDIF

  const witnessScript = bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
    ownerPubkey,
    bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ELSE,
    sequenceBuffer,
    bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
    bitcoin.opcodes.OP_DROP,
    heirPubkey,
    bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ENDIF,
  ]);

  const p2wsh = bitcoin.payments.p2wsh({
    redeem: { output: witnessScript },
    network: networks[network],
  });

  if (!p2wsh.address) {
    throw new Error('Failed to generate dead man switch address');
  }

  const estimatedDays = Math.round(sequenceBlocks / 144);

  return {
    address: p2wsh.address,
    witnessScript: toHex(witnessScript),
    sequence,
    redeemInfo: {
      ownerPubkey: ownerPubkeyHex,
      heirPubkey: heirPubkeyHex,
      sequenceBlocks,
      sequenceEncoded: sequence,
      estimatedDays,
      timelockType: 'relative',
      spendPaths: [
        {
          name: 'Owner (Check-in)',
          description: 'Owner can spend anytime - resets the inactivity timer',
          witness: '<signature> TRUE <witnessScript>',
          sequence: 0xFFFFFFFF, // No sequence requirement for owner
        },
        {
          name: 'Heir (Claim)',
          description: `Heir can spend after ${sequenceBlocks} blocks (~${estimatedDays} days) of owner inactivity`,
          witness: '<signature> FALSE <witnessScript>',
          sequence: sequence, // Must set nSequence to this value
        },
      ],
    },
  };
}

// MultisigDecayConfig is imported+re-exported from ./types

/**
 * Generate a threshold-based decay address using valid Miniscript
 *
 * Uses: thresh(2, pk(A), s:pk(B), s:pk(C), sln:after(locktime))
 *
 * This is a valid Miniscript that Bitcoin Core accepts!
 *
 * How it works:
 * - Requires satisfying 2 of 4 conditions: sig_A, sig_B, sig_C, or timelock
 * - Before timelock: Only 3 conditions available, need 2 sigs (any 2-of-3)
 * - After timelock: 4 conditions available, need 1 sig + timelock = 2
 *
 * This achieves: 2-of-3 initially, decays to 1-of-3 after timelock
 */
export function generateThreshDecayAddress(
  pubkeysHex: string[],
  initialThreshold: number,
  decayAfterBlocks: number,
  network: 'mainnet' | 'testnet' | 'signet' = 'mainnet'
): { address: string; witnessScript: string; locktime: number; miniscript: string; redeemInfo: VaultRedeemInfo } {
  if (pubkeysHex.length < 2) {
    throw new Error('Need at least 2 public keys');
  }
  if (initialThreshold < 1 || initialThreshold > pubkeysHex.length) {
    throw new Error(`Invalid threshold ${initialThreshold} for ${pubkeysHex.length} keys`);
  }

  const pubkeys = pubkeysHex.map(pk => Buffer.from(pk, 'hex'));

  // Sort pubkeys for BIP67 compliance
  const sortedPubkeys = [...pubkeys].sort(Buffer.compare);
  const sortedHex = sortedPubkeys.map(pk => pk.toString('hex'));

  // Build the thresh script manually
  // thresh(N, pk(A), s:pk(B), s:pk(C), ..., sln:after(locktime))
  //
  // Script structure:
  // <A> OP_CHECKSIG OP_SWAP <B> OP_CHECKSIG OP_ADD OP_SWAP <C> OP_CHECKSIG OP_ADD ...
  // OP_SWAP OP_IF 0 OP_ELSE <locktime> OP_CHECKLOCKTIMEVERIFY OP_0NOTEQUAL OP_ENDIF OP_ADD
  // <N> OP_EQUAL

  const lockBuffer = bitcoin.script.number.encode(decayAfterBlocks);

  const scriptParts: (number | Buffer)[] = [];

  // First key: <A> OP_CHECKSIG
  scriptParts.push(sortedPubkeys[0]);
  scriptParts.push(bitcoin.opcodes.OP_CHECKSIG);

  // Remaining keys: OP_SWAP <key> OP_CHECKSIG OP_ADD
  for (let i = 1; i < sortedPubkeys.length; i++) {
    scriptParts.push(bitcoin.opcodes.OP_SWAP);
    scriptParts.push(sortedPubkeys[i]);
    scriptParts.push(bitcoin.opcodes.OP_CHECKSIG);
    scriptParts.push(bitcoin.opcodes.OP_ADD);
  }

  // Timelock condition: OP_SWAP OP_IF 0 OP_ELSE <locktime> OP_CHECKLOCKTIMEVERIFY OP_0NOTEQUAL OP_ENDIF OP_ADD
  scriptParts.push(bitcoin.opcodes.OP_SWAP);
  scriptParts.push(bitcoin.opcodes.OP_IF);
  scriptParts.push(bitcoin.opcodes.OP_0);
  scriptParts.push(bitcoin.opcodes.OP_ELSE);
  scriptParts.push(lockBuffer);
  scriptParts.push(bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY);
  scriptParts.push(bitcoin.opcodes.OP_0NOTEQUAL);
  scriptParts.push(bitcoin.opcodes.OP_ENDIF);
  scriptParts.push(bitcoin.opcodes.OP_ADD);

  // Threshold check: <N> OP_EQUAL
  // OP_1 through OP_16 are opcodes 0x51-0x60; for values > 16 use script number encoding
  if (initialThreshold >= 1 && initialThreshold <= 16) {
    scriptParts.push(0x50 + initialThreshold); // OP_N
  } else {
    scriptParts.push(Buffer.from(bitcoin.script.number.encode(initialThreshold)));
  }
  scriptParts.push(bitcoin.opcodes.OP_EQUAL);

  const witnessScript = Buffer.from(bitcoin.script.compile(scriptParts));

  const p2wsh = bitcoin.payments.p2wsh({
    redeem: { output: witnessScript },
    network: networks[network],
  });

  if (!p2wsh.address) {
    throw new Error('Failed to generate thresh decay address');
  }

  // Generate miniscript representation
  const keyLabels = sortedHex.map((_, i) => String.fromCharCode(65 + i)); // A, B, C, ...
  const miniscript = `thresh(${initialThreshold},pk(${keyLabels[0]}),${
    keyLabels.slice(1).map(k => `s:pk(${k})`).join(',')
  },sln:after(${decayAfterBlocks}))`;

  return {
    address: p2wsh.address,
    witnessScript: witnessScript.toString('hex'),
    locktime: decayAfterBlocks,
    miniscript,
    redeemInfo: {
      pubkeys: sortedHex,
      threshold: initialThreshold,
      decayedThreshold: initialThreshold - 1,
      locktime: decayAfterBlocks,
      miniscript,
      timelockType: 'absolute',
      spendPaths: [
        {
          name: 'Before Decay',
          description: `Requires ${initialThreshold} of ${pubkeysHex.length} signatures`,
          witness: `<sig1> <sig2> ... 0 <witnessScript>`,
          note: 'Timelock condition unavailable, need full threshold of signatures',
        },
        {
          name: 'After Decay',
          description: `After block ${decayAfterBlocks}: requires ${initialThreshold - 1} signature(s) + timelock`,
          witness: `<sig> 1 <witnessScript>`,
          availableAfterBlock: decayAfterBlocks,
          note: `Any ${initialThreshold - 1} of ${pubkeysHex.length} keys can spend (timelock counts as 1 condition)`,
        },
      ],
    },
  };
}

/**
 * Generate a multisig decay address
 *
 * Script structure:
 * OP_IF
 *   // Path 1: Before decay - requires initialThreshold of initialTotal signatures
 *   OP_<initialThreshold>
 *   <owner_pubkey>
 *   <heir1_pubkey>
 *   <heir2_pubkey>
 *   OP_<initialTotal>
 *   OP_CHECKMULTISIG
 * OP_ELSE
 *   // Path 2: After decay - requires decayedThreshold of decayedTotal (heirs only)
 *   <locktime>
 *   OP_CHECKLOCKTIMEVERIFY
 *   OP_DROP
 *   OP_<decayedThreshold>
 *   <heir1_pubkey>
 *   <heir2_pubkey>
 *   OP_<decayedTotal>
 *   OP_CHECKMULTISIG
 * OP_ENDIF
 *
 * Spend paths:
 * - Before decay: Any 2-of-3 can spend (owner+heir1, owner+heir2, heir1+heir2)
 * - After decay: Any 1-of-2 heirs can spend alone (owner excluded)
 */
export function generateMultisigDecayAddress(
  ownerPubkeyHex: string,
  heirPubkeysHex: string[],
  config: MultisigDecayConfig,
  network: 'mainnet' | 'testnet' | 'signet' = 'mainnet'
): { address: string; witnessScript: string; locktime: number; redeemInfo: VaultRedeemInfo } {
  const ownerPubkey = Buffer.from(ownerPubkeyHex, 'hex');
  const heirPubkeys = heirPubkeysHex.map(pk => Buffer.from(pk, 'hex'));

  // Validate we have enough keys
  const allPubkeys = [ownerPubkey, ...heirPubkeys];
  if (allPubkeys.length < config.initialTotal) {
    throw new Error(`Need at least ${config.initialTotal} keys for initial multisig`);
  }
  if (heirPubkeys.length < config.decayedTotal) {
    throw new Error(`Need at least ${config.decayedTotal} heir keys for decayed multisig`);
  }

  // Sort pubkeys for consistent ordering (BIP67)
  const sortedInitialPubkeys = allPubkeys.slice(0, config.initialTotal).sort(Buffer.compare);
  const sortedDecayedPubkeys = heirPubkeys.slice(0, config.decayedTotal).sort(Buffer.compare);

  const lockBuffer = bitcoin.script.number.encode(config.decayAfterBlocks);

  // Build the script
  // OP_IF path: initialThreshold-of-initialTotal multisig (before decay)
  // OP_ELSE path: decayedThreshold-of-decayedTotal multisig + CLTV (after decay)
  //
  // For small numbers 1-16, Bitcoin uses OP_1 through OP_16 (0x51-0x60)
  // For values > 16, use script number encoding (push data)
  const opNum = (n: number): number | Buffer => {
    if (n >= 1 && n <= 16) return 0x50 + n;
    return Buffer.from(bitcoin.script.number.encode(n));
  };

  // bitcoin.script.compile returns Uint8Array in v7, convert to Buffer for compatibility
  const witnessScriptRaw = bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
    // Before decay: m-of-n multisig with all keys
    opNum(config.initialThreshold),
    ...sortedInitialPubkeys,
    opNum(config.initialTotal),
    bitcoin.opcodes.OP_CHECKMULTISIG,
    bitcoin.opcodes.OP_ELSE,
    // After decay: CLTV + reduced multisig (heirs only)
    lockBuffer,
    bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
    bitcoin.opcodes.OP_DROP,
    opNum(config.decayedThreshold),
    ...sortedDecayedPubkeys,
    opNum(config.decayedTotal),
    bitcoin.opcodes.OP_CHECKMULTISIG,
    bitcoin.opcodes.OP_ENDIF,
  ]);
  const witnessScript = Buffer.from(witnessScriptRaw);

  const p2wsh = bitcoin.payments.p2wsh({
    redeem: { output: witnessScript },
    network: networks[network],
  });

  if (!p2wsh.address) {
    throw new Error('Failed to generate multisig decay address');
  }

  // Generate key labels for redeem info
  const initialKeyLabels = ['Owner', ...heirPubkeysHex.slice(0, config.initialTotal - 1).map((_, i) => `Heir ${i + 1}`)];
  const decayedKeyLabels = heirPubkeysHex.slice(0, config.decayedTotal).map((_, i) => `Heir ${i + 1}`);

  return {
    address: p2wsh.address,
    witnessScript: witnessScript.toString('hex'),
    locktime: config.decayAfterBlocks,
    redeemInfo: {
      ownerPubkey: ownerPubkeyHex,
      heirPubkeys: heirPubkeysHex,
      config,
      timelockType: 'absolute',
      spendPaths: [
        {
          name: 'Before Decay',
          description: `Requires ${config.initialThreshold} of ${config.initialTotal} signatures (${initialKeyLabels.join(', ')})`,
          witness: `OP_0 <sig1> <sig2> ... TRUE <witnessScript>`,
          availableNow: true,
          combinations: generateCombinations(initialKeyLabels, config.initialThreshold),
        },
        {
          name: 'After Decay',
          description: `After block ${config.decayAfterBlocks}: requires only ${config.decayedThreshold} of ${config.decayedTotal} heir signatures (${decayedKeyLabels.join(', ')})`,
          witness: `OP_0 <heir_sig> FALSE <witnessScript>`,
          availableAfterBlock: config.decayAfterBlocks,
          combinations: generateCombinations(decayedKeyLabels, config.decayedThreshold),
          note: 'Owner key NOT accepted on this path',
        },
      ],
    },
  };
}

/**
 * Generate all k-combinations of an array (for showing possible signing combinations).
 * Caps output at 1000 combinations to prevent performance issues with large key sets.
 */
function generateCombinations(arr: string[], k: number): string[][] {
  const MAX_COMBINATIONS = 1000;
  const result: string[][] = [];

  function combine(start: number, combo: string[]) {
    if (result.length >= MAX_COMBINATIONS) return;
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }

  combine(0, []);
  return result;
}

/**
 * Generate a timelocked inheritance address (absolute timelock)
 *
 * Script: OP_IF <owner_pubkey> OP_CHECKSIG OP_ELSE <locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP <heir_pubkey> OP_CHECKSIG OP_ENDIF
 *
 * Owner can spend anytime, heir can spend after locktime
 */
export function generateTimelockAddress(
  ownerPubkeyHex: string,
  heirPubkeyHex: string,
  locktime: number, // Block height
  network: 'mainnet' | 'testnet' | 'signet' = 'mainnet'
): { address: string; witnessScript: string; redeemInfo: VaultRedeemInfo } {
  const ownerPubkey = Buffer.from(ownerPubkeyHex, 'hex');
  const heirPubkey = Buffer.from(heirPubkeyHex, 'hex');
  
  // Build the script manually
  // OP_IF
  //   <owner_pubkey> OP_CHECKSIG
  // OP_ELSE
  //   <locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP
  //   <heir_pubkey> OP_CHECKSIG
  // OP_ENDIF
  
  const lockBuffer = bitcoin.script.number.encode(locktime);
  
  const witnessScript = bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
    ownerPubkey,
    bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ELSE,
    lockBuffer,
    bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
    bitcoin.opcodes.OP_DROP,
    heirPubkey,
    bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ENDIF,
  ]);
  
  const p2wsh = bitcoin.payments.p2wsh({
    redeem: { output: witnessScript },
    network: networks[network],
  });
  
  if (!p2wsh.address) {
    throw new Error('Failed to generate timelock address');
  }
  
  return {
    address: p2wsh.address,
    witnessScript: toHex(witnessScript),
    redeemInfo: {
      ownerPubkey: ownerPubkeyHex,
      heirPubkey: heirPubkeyHex,
      locktime,
      spendPaths: [
        {
          name: 'Owner',
          description: 'Owner can spend anytime',
          witness: '<signature> TRUE <witnessScript>',
        },
        {
          name: 'Heir',
          description: `Heir can spend after block ${locktime}`,
          witness: '<signature> FALSE <witnessScript>',
        },
      ],
    },
  };
}

/**
 * Generate address for a vault based on its configuration
 */
export function generateVaultAddress(
  vaultConfig: {
    logic: { primary: string };
    ownerPubkey?: string;
    heirPubkeys?: string[];
    locktime?: number;
    inactivityDays?: number; // For dead man's switch
    decayConfig?: MultisigDecayConfig; // For multisig decay
  },
  network: 'mainnet' | 'testnet' | 'signet' = 'mainnet'
): { address: string; script?: string; redeemInfo?: VaultRedeemInfo; sequence?: number; locktime?: number } {
  const { logic, ownerPubkey, heirPubkeys, locktime, inactivityDays, decayConfig } = vaultConfig;

  // If no keys provided, generate a placeholder address
  if (!ownerPubkey || !heirPubkeys || heirPubkeys.length === 0) {
    // Return empty - address will be generated when keys are added
    return { address: '' };
  }

  // Normalize keys - convert xpub/tpub to hex pubkeys if needed
  const normalizedOwnerPubkey = normalizePublicKey(ownerPubkey);
  const normalizedHeirPubkeys = heirPubkeys.map(pk => normalizePublicKey(pk));

  switch (logic.primary) {
    case 'timelock': {
      if (!locktime) {
        throw new Error('Locktime (block height) is required for timelock vaults. Use dateToBlockHeight() to compute from a date.');
      }
      const result = generateTimelockAddress(
        normalizedOwnerPubkey,
        normalizedHeirPubkeys[0],
        locktime,
        network
      );
      return {
        address: result.address,
        script: result.witnessScript,
        redeemInfo: result.redeemInfo,
      };
    }

    case 'dead_man_switch': {
      // Convert days to blocks (~144 blocks per day)
      const days = inactivityDays || 90; // Default 90 days
      const sequenceBlocks = days * 144;
      const result = generateDeadManSwitchAddress(
        normalizedOwnerPubkey,
        normalizedHeirPubkeys[0],
        sequenceBlocks,
        network
      );
      return {
        address: result.address,
        script: result.witnessScript,
        redeemInfo: result.redeemInfo,
        sequence: result.sequence,
      };
    }

    case 'multisig_decay': {
      if (!locktime && !decayConfig) {
        throw new Error('Locktime or decay config is required for multisig_decay vaults. Use dateToBlockHeight() to compute from a date.');
      }
      // Multisig with decaying threshold over time
      // Default config: 2-of-3 initially, 1-of-2 heirs after 1 year
      const config = decayConfig || {
        initialThreshold: 2,
        initialTotal: Math.min(3, 1 + normalizedHeirPubkeys.length), // owner + up to 2 heirs
        decayedThreshold: 1,
        decayedTotal: Math.min(2, normalizedHeirPubkeys.length),
        decayAfterBlocks: locktime!,
      };

      const result = generateMultisigDecayAddress(
        normalizedOwnerPubkey,
        normalizedHeirPubkeys,
        config,
        network
      );
      return {
        address: result.address,
        script: result.witnessScript,
        redeemInfo: result.redeemInfo,
        locktime: result.locktime,
      };
    }

    default: {
      // Default to simple timelock
      if (normalizedHeirPubkeys.length > 0) {
        if (!locktime) {
          throw new Error('Locktime (block height) is required. Use dateToBlockHeight() to compute from a date.');
        }
        const result = generateTimelockAddress(
          normalizedOwnerPubkey,
          normalizedHeirPubkeys[0],
          locktime,
          network
        );
        return {
          address: result.address,
          script: result.witnessScript,
          redeemInfo: result.redeemInfo,
        };
      }
      return { address: '' };
    }
  }
}

/**
 * Validate a Bitcoin address
 */
export function validateAddress(
  address: string,
  network: 'mainnet' | 'testnet' | 'signet' = 'mainnet'
): boolean {
  try {
    bitcoin.address.toOutputScript(address, networks[network]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get address type from address string
 */
export function getAddressType(address: string): string {
  if (address.startsWith('bc1q') && address.length === 42) {
    return 'P2WPKH (Native SegWit)';
  } else if (address.startsWith('bc1q') && address.length === 62) {
    return 'P2WSH (Native SegWit Script)';
  } else if (address.startsWith('bc1p')) {
    return 'P2TR (Taproot)';
  } else if (address.startsWith('3')) {
    return 'P2SH (Script Hash)';
  } else if (address.startsWith('1')) {
    return 'P2PKH (Legacy)';
  } else if (address.startsWith('tb1') || address.startsWith('2') || address.startsWith('m') || address.startsWith('n')) {
    return 'Testnet Address';
  }
  return 'Unknown';
}

// ============================================
// POLICY-BASED ADDRESS GENERATION (V2)
// ============================================

import { compileToMiniscript } from './miniscript';
import type { VaultProfile } from '../creation/validation/compatibility';

/**
 * Result of policy-based address generation
 */
export interface PolicyAddressResult {
  address: string
  witnessScript: string       // Hex-encoded witness script
  witnessScriptBuffer: Buffer // Raw witness script buffer
  policy: string
  miniscript: string
  network: 'mainnet' | 'testnet' | 'signet'
  isValid: boolean
  error?: string
}

/**
 * Generate a P2WSH address from a Miniscript policy string.
 *
 * Pipeline: policy → miniscript → witness script → P2WSH address
 *
 * This handles the full compilation chain for profiles that compile
 * to sane miniscript (solo_vault, spouse_plan, family_vault, dead_mans_switch).
 *
 * For business_vault (which has intentional key reuse), use
 * generateBusinessVaultScript() which builds the script directly.
 */
export function generateAddressFromPolicy(
  policy: string,
  network: 'mainnet' | 'testnet' | 'signet' = 'mainnet'
): PolicyAddressResult {
  try {
    // Step 1: Compile policy to miniscript
    const miniscriptResult = compileToMiniscript(policy);

    if (!miniscriptResult.isValid || !miniscriptResult.asm) {
      return {
        address: '',
        witnessScript: '',
        witnessScriptBuffer: Buffer.alloc(0),
        policy,
        miniscript: miniscriptResult.miniscript || '',
        network,
        isValid: false,
        error: 'Policy compilation failed — miniscript not sane',
      }
    }

    // Step 2: Convert ASM to witness script Buffer
    const witnessScript = Buffer.from(
      bitcoin.script.fromASM(miniscriptResult.asm)
    );

    // Step 3: Generate P2WSH address
    const p2wsh = bitcoin.payments.p2wsh({
      redeem: { output: witnessScript },
      network: networks[network],
    });

    if (!p2wsh.address) {
      return {
        address: '',
        witnessScript: witnessScript.toString('hex'),
        witnessScriptBuffer: witnessScript,
        policy,
        miniscript: miniscriptResult.miniscript,
        network,
        isValid: false,
        error: 'Failed to generate P2WSH address from compiled script',
      }
    }

    return {
      address: p2wsh.address,
      witnessScript: witnessScript.toString('hex'),
      witnessScriptBuffer: witnessScript,
      policy,
      miniscript: miniscriptResult.miniscript,
      network,
      isValid: true,
    }
  } catch (error) {
    return {
      address: '',
      witnessScript: '',
      witnessScriptBuffer: Buffer.alloc(0),
      policy,
      miniscript: '',
      network,
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown compilation error',
    }
  }
}

/**
 * Build a Business Vault witness script directly using Bitcoin Script opcodes.
 *
 * The business vault has intentional key reuse (owner in joint + solo paths)
 * which prevents sane miniscript compilation. We build the script manually:
 *
 * OP_IF
 *   // Joint path: owner + partner can spend immediately
 *   <owner_pubkey> OP_CHECKSIGVERIFY <partner_pubkey> OP_CHECKSIG
 * OP_ELSE
 *   OP_IF
 *     // Owner solo path: owner after 30 days
 *     <owner_solo_blocks> OP_CHECKSEQUENCEVERIFY OP_DROP
 *     <owner_pubkey> OP_CHECKSIG
 *   OP_ELSE
 *     // Trustee path: trustee after 1 year
 *     <trustee_blocks> OP_CHECKSEQUENCEVERIFY OP_DROP
 *     <trustee_pubkey> OP_CHECKSIG
 *   OP_ENDIF
 * OP_ENDIF
 */
export function generateBusinessVaultScript(
  ownerPubkeyHex: string,
  partnerPubkeyHex: string,
  trusteePubkeyHex: string,
  ownerSoloBlocks: number,
  trusteeBlocks: number,
  network: 'mainnet' | 'testnet' | 'signet' = 'mainnet'
): { address: string; witnessScript: string; redeemInfo: VaultRedeemInfo } {
  const ownerPubkey = Buffer.from(ownerPubkeyHex, 'hex');
  const partnerPubkey = Buffer.from(partnerPubkeyHex, 'hex');
  const trusteePubkey = Buffer.from(trusteePubkeyHex, 'hex');

  const ownerSoloSeq = bitcoin.script.number.encode(ownerSoloBlocks);
  const trusteeSeq = bitcoin.script.number.encode(trusteeBlocks);

  const witnessScript = bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
      // Joint: owner + partner
      ownerPubkey,
      bitcoin.opcodes.OP_CHECKSIGVERIFY,
      partnerPubkey,
      bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ELSE,
      bitcoin.opcodes.OP_IF,
        // Owner solo after CSV
        ownerSoloSeq,
        bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
        bitcoin.opcodes.OP_DROP,
        ownerPubkey,
        bitcoin.opcodes.OP_CHECKSIG,
      bitcoin.opcodes.OP_ELSE,
        // Trustee after CSV
        trusteeSeq,
        bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
        bitcoin.opcodes.OP_DROP,
        trusteePubkey,
        bitcoin.opcodes.OP_CHECKSIG,
      bitcoin.opcodes.OP_ENDIF,
    bitcoin.opcodes.OP_ENDIF,
  ]);

  const p2wsh = bitcoin.payments.p2wsh({
    redeem: { output: witnessScript },
    network: networks[network],
  });

  if (!p2wsh.address) {
    throw new Error('Failed to generate business vault address');
  }

  return {
    address: p2wsh.address,
    witnessScript: toHex(witnessScript),
    redeemInfo: {
      ownerPubkey: ownerPubkeyHex,
      timelockType: 'relative',
      spendPaths: [
        {
          name: 'Joint (Owner + Partner)',
          description: 'Owner and partner can spend together at any time',
          witness: '<owner_sig> <partner_sig> TRUE <witnessScript>',
        },
        {
          name: 'Owner Solo',
          description: `Owner can spend alone after ${ownerSoloBlocks} blocks (~${Math.round(ownerSoloBlocks / 144)} days) of inactivity`,
          witness: '<owner_sig> TRUE FALSE <witnessScript>',
          sequence: ownerSoloBlocks,
        },
        {
          name: 'Trustee',
          description: `Trustee can spend after ${trusteeBlocks} blocks (~${Math.round(trusteeBlocks / 144)} days) of inactivity`,
          witness: '<trustee_sig> FALSE FALSE <witnessScript>',
          sequence: trusteeBlocks,
        },
      ],
    },
  };
}

export default {
  generateP2WPKHAddress,
  generateP2WSHAddress,
  generateMultisigAddress,
  generateMultisigDecayAddress,
  generateThreshDecayAddress,
  generateTimelockAddress,
  generateDeadManSwitchAddress,
  generateVaultAddress,
  generateAddressFromPolicy,
  generateBusinessVaultScript,
  validateAddress,
  getAddressType,
  xpubToPublicKey,
  isExtendedPubkey,
  isHexPubkey,
  normalizePublicKey,
};
