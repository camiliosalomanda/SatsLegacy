/**
 * Test script for multisig decay implementation
 *
 * Multisig decay: Threshold decreases over time
 * - Initially: 2-of-3 (owner + 2 heirs)
 * - After timelock: 1-of-2 (just heirs, owner excluded)
 *
 * Run with: npx tsx scripts/test-multisig-decay.ts
 */

import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import {
  generateMultisigDecayAddress,
  validateAddress,
  type MultisigDecayConfig
} from '../src/vault/scripts/bitcoin-address';

const ECPair = ECPairFactory(ecc);

// Generate test keypairs
function generateTestKeypair() {
  const keyPair = ECPair.makeRandom();
  // keyPair.publicKey is Uint8Array in ecpair, need Buffer.from for proper hex conversion
  return {
    privateKey: Buffer.from(keyPair.privateKey!).toString('hex'),
    publicKey: Buffer.from(keyPair.publicKey).toString('hex'),
  };
}

// Test keys
const owner = generateTestKeypair();
const heir1 = generateTestKeypair();
const heir2 = generateTestKeypair();

console.log('=== Multisig Decay Implementation Test ===\n');

console.log('Test Keys Generated:');
console.log(`  Owner:  ${owner.publicKey.slice(0, 20)}...`);
console.log(`  Heir 1: ${heir1.publicKey.slice(0, 20)}...`);
console.log(`  Heir 2: ${heir2.publicKey.slice(0, 20)}...`);
console.log();

// Decay configuration
const decayConfig: MultisigDecayConfig = {
  initialThreshold: 2,   // Initially need 2 signatures
  initialTotal: 3,       // Out of 3 possible signers
  decayedThreshold: 1,   // After decay, need only 1 signature
  decayedTotal: 2,       // Out of 2 possible signers (heirs only)
  decayAfterBlocks: 900000 // ~6 months from current block height
};

console.log('Decay Configuration:');
console.log(`  Initial: ${decayConfig.initialThreshold}-of-${decayConfig.initialTotal} (owner + heirs)`);
console.log(`  After block ${decayConfig.decayAfterBlocks}: ${decayConfig.decayedThreshold}-of-${decayConfig.decayedTotal} (heirs only)`);
console.log();

// Generate mainnet address
console.log('Generating mainnet address...');
const mainnetResult = generateMultisigDecayAddress(
  owner.publicKey,
  [heir1.publicKey, heir2.publicKey],
  decayConfig,
  'mainnet'
);

console.log(`  Address: ${mainnetResult.address}`);
console.log(`  Valid: ${validateAddress(mainnetResult.address, 'mainnet')}`);
console.log(`  Type: P2WSH (starts with bc1q, 62 chars): ${mainnetResult.address.startsWith('bc1q') && mainnetResult.address.length === 62}`);
console.log();

// Generate testnet address
console.log('Generating testnet address...');
const testnetResult = generateMultisigDecayAddress(
  owner.publicKey,
  [heir1.publicKey, heir2.publicKey],
  decayConfig,
  'testnet'
);

console.log(`  Address: ${testnetResult.address}`);
console.log(`  Valid: ${validateAddress(testnetResult.address, 'testnet')}`);
console.log(`  Type: P2WSH testnet (starts with tb1q): ${testnetResult.address.startsWith('tb1q')}`);
console.log();

// Analyze witness script
console.log('=== Witness Script Analysis ===\n');
const scriptHex = mainnetResult.witnessScript;
const scriptBuffer = Buffer.from(scriptHex, 'hex');

console.log(`Script length: ${scriptBuffer.length} bytes`);
console.log(`Script hex (first 80 chars): ${scriptHex.slice(0, 80)}...`);
console.log();

// Decompile and verify structure
const decompiled = bitcoin.script.decompile(scriptBuffer);
if (decompiled) {
  // Check for key opcodes
  const hasIF = decompiled.includes(bitcoin.opcodes.OP_IF);
  const hasELSE = decompiled.includes(bitcoin.opcodes.OP_ELSE);
  const hasENDIF = decompiled.includes(bitcoin.opcodes.OP_ENDIF);
  const hasCLTV = decompiled.includes(bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY);
  const multisigCount = decompiled.filter(op => op === bitcoin.opcodes.OP_CHECKMULTISIG).length;
  const pubkeyCount = decompiled.filter(op => Buffer.isBuffer(op) && op.length === 33).length;

  console.log('Script Structure Verification:');
  console.log(`  ✓ Has OP_IF: ${hasIF}`);
  console.log(`  ✓ Has OP_ELSE: ${hasELSE}`);
  console.log(`  ✓ Has OP_ENDIF: ${hasENDIF}`);
  console.log(`  ✓ Has OP_CHECKLOCKTIMEVERIFY: ${hasCLTV}`);
  console.log(`  ✓ Has OP_CHECKMULTISIG (×2): ${multisigCount === 2}`);
  console.log(`  ✓ Contains 5 pubkeys (3 initial + 2 decayed): ${pubkeyCount === 5}`);
  console.log();

  if (hasIF && hasELSE && hasENDIF && hasCLTV && multisigCount === 2) {
    console.log('✅ Script structure is CORRECT!');
  } else {
    console.log('❌ Script structure has issues');
  }
}
console.log();

// Show redeem info
console.log('=== Spend Paths ===\n');
const redeemInfo = mainnetResult.redeemInfo as any;
for (const path of redeemInfo.spendPaths) {
  console.log(`${path.name}:`);
  console.log(`  ${path.description}`);
  if (path.combinations) {
    console.log(`  Valid signing combinations:`);
    for (const combo of path.combinations) {
      console.log(`    - ${combo.join(' + ')}`);
    }
  }
  if (path.note) {
    console.log(`  ⚠️  ${path.note}`);
  }
  console.log();
}

// Summary
console.log('=== Summary ===\n');
console.log('The multisig decay script implements:');
console.log('');
console.log('  OP_IF');
console.log('    // Path 1: Before decay (immediately available)');
console.log('    OP_2 <pubkey1> <pubkey2> <pubkey3> OP_3 OP_CHECKMULTISIG');
console.log('  OP_ELSE');
console.log('    // Path 2: After decay (after block 900000)');
console.log('    <900000> OP_CHECKLOCKTIMEVERIFY OP_DROP');
console.log('    OP_1 <heir1_pubkey> <heir2_pubkey> OP_2 OP_CHECKMULTISIG');
console.log('  OP_ENDIF');
console.log();
console.log('This allows:');
console.log('  - Any 2-of-3 (owner+heir1, owner+heir2, or heir1+heir2) to spend immediately');
console.log('  - After block 900000: Either heir alone can spend (owner excluded)');
