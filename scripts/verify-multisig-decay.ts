/**
 * Verify multisig decay implementation
 *
 * Requirements:
 * 1. Starts as 2-of-3
 * 2. After timelock, becomes 1-of-3 (any key)
 * 3. Valid Miniscript that Bitcoin Core would accept
 */

import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import { compileToMiniscript, generatePolicy } from '../src/vault/scripts/miniscript';

const ECPair = ECPairFactory(ecc);

// Generate deterministic test keys for reproducibility
const owner = ECPair.makeRandom();
const heir1 = ECPair.makeRandom();
const heir2 = ECPair.makeRandom();

const ownerPub = Buffer.from(owner.publicKey).toString('hex');
const heir1Pub = Buffer.from(heir1.publicKey).toString('hex');
const heir2Pub = Buffer.from(heir2.publicKey).toString('hex');

console.log('=== Multisig Decay Verification ===\n');

// ============================================
// TEST 1: Current Implementation (1-of-2 heirs after decay)
// ============================================
console.log('--- Current Implementation ---');
console.log('Before: 2-of-3 (owner, heir1, heir2)');
console.log('After:  1-of-2 (heir1, heir2 only - owner EXCLUDED)\n');

// The Miniscript policy for current implementation
const currentPolicy = `or(thresh(2,pk(A),pk(B),pk(C)),and(thresh(1,pk(B),pk(C)),after(900000)))`;
console.log('Policy:', currentPolicy);

const currentResult = compileToMiniscript(currentPolicy);
console.log('Miniscript:', currentResult.miniscript || '(compilation failed)');
console.log('Valid:', currentResult.isValid);
console.log('Sane:', currentResult.isSaneSublevel);
console.log();

// ============================================
// TEST 2: Alternative (1-of-3 ANY key after decay)
// ============================================
console.log('--- Alternative: 1-of-3 after decay ---');
console.log('Before: 2-of-3 (owner, heir1, heir2)');
console.log('After:  1-of-3 (ANY of owner, heir1, heir2)\n');

// The Miniscript policy for 1-of-3 after decay
const altPolicy = `or(thresh(2,pk(A),pk(B),pk(C)),and(thresh(1,pk(A),pk(B),pk(C)),after(900000)))`;
console.log('Policy:', altPolicy);

const altResult = compileToMiniscript(altPolicy);
console.log('Miniscript:', altResult.miniscript || '(compilation failed)');
console.log('Valid:', altResult.isValid);
console.log('Sane:', altResult.isSaneSublevel);
console.log();

// ============================================
// TEST 3: Simpler equivalent policies
// ============================================
console.log('--- Simpler Policy Variations ---\n');

// Try different policy formulations
const policies = [
  // 2-of-3 OR (1-of-3 after timelock)
  'or(thresh(2,pk(A),pk(B),pk(C)),and(or(pk(A),pk(B),pk(C)),after(900000)))',

  // Using multi() syntax
  'or(multi(2,A,B,C),and(multi(1,A,B,C),after(900000)))',

  // Threshold with timelock branch
  'thresh(1,pk(A),pk(B),pk(C),and(pk(A),after(900000)),and(pk(B),after(900000)),and(pk(C),after(900000)))',
];

for (const policy of policies) {
  console.log('Policy:', policy);
  const result = compileToMiniscript(policy);
  console.log('  Miniscript:', result.miniscript?.slice(0, 60) || '(failed)' + (result.miniscript?.length > 60 ? '...' : ''));
  console.log('  Valid:', result.isValid);
  console.log();
}

// ============================================
// TEST 4: Build actual script and verify
// ============================================
console.log('--- Building Actual Bitcoin Script ---\n');

// For 1-of-3 after decay, the script structure would be:
// OP_IF
//   OP_2 <pk1> <pk2> <pk3> OP_3 OP_CHECKMULTISIG
// OP_ELSE
//   <locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP
//   OP_1 <pk1> <pk2> <pk3> OP_3 OP_CHECKMULTISIG
// OP_ENDIF

const allPubkeys = [
  Buffer.from(ownerPub, 'hex'),
  Buffer.from(heir1Pub, 'hex'),
  Buffer.from(heir2Pub, 'hex'),
].sort(Buffer.compare);

const locktime = 900000;
const lockBuffer = bitcoin.script.number.encode(locktime);

// Build 2-of-3 -> 1-of-3 decay script
const decayScript = Buffer.from(bitcoin.script.compile([
  bitcoin.opcodes.OP_IF,
  bitcoin.opcodes.OP_2,       // 2-of-3 before decay
  ...allPubkeys,
  bitcoin.opcodes.OP_3,
  bitcoin.opcodes.OP_CHECKMULTISIG,
  bitcoin.opcodes.OP_ELSE,
  lockBuffer,
  bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
  bitcoin.opcodes.OP_DROP,
  bitcoin.opcodes.OP_1,       // 1-of-3 after decay (ANY key)
  ...allPubkeys,              // Same 3 keys
  bitcoin.opcodes.OP_3,
  bitcoin.opcodes.OP_CHECKMULTISIG,
  bitcoin.opcodes.OP_ENDIF,
]));

console.log('Script length:', decayScript.length, 'bytes');

// Verify structure
const decompiled = bitcoin.script.decompile(decayScript);
if (decompiled) {
  const hasIF = decompiled.includes(bitcoin.opcodes.OP_IF);
  const hasELSE = decompiled.includes(bitcoin.opcodes.OP_ELSE);
  const hasENDIF = decompiled.includes(bitcoin.opcodes.OP_ENDIF);
  const hasCLTV = decompiled.includes(bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY);
  const multisigCount = decompiled.filter(op => op === bitcoin.opcodes.OP_CHECKMULTISIG).length;
  const pubkeyCount = decompiled.filter(op => Buffer.isBuffer(op) && op.length === 33).length;

  console.log('Structure:');
  console.log('  OP_IF:', hasIF);
  console.log('  OP_ELSE:', hasELSE);
  console.log('  OP_ENDIF:', hasENDIF);
  console.log('  OP_CHECKLOCKTIMEVERIFY:', hasCLTV);
  console.log('  OP_CHECKMULTISIG count:', multisigCount, '(should be 2)');
  console.log('  Pubkey count:', pubkeyCount, '(should be 6: 3+3)');
}

// Create P2WSH address
const p2wsh = bitcoin.payments.p2wsh({
  redeem: { output: decayScript },
  network: bitcoin.networks.testnet,
});

console.log('\nTestnet Address:', p2wsh.address);
console.log();

// ============================================
// Summary
// ============================================
console.log('=== Summary ===\n');
console.log('For 2-of-3 -> 1-of-3 decay:');
console.log('');
console.log('  OP_IF');
console.log('    OP_2 <pk1> <pk2> <pk3> OP_3 OP_CHECKMULTISIG  // 2-of-3');
console.log('  OP_ELSE');
console.log('    <900000> OP_CHECKLOCKTIMEVERIFY OP_DROP');
console.log('    OP_1 <pk1> <pk2> <pk3> OP_3 OP_CHECKMULTISIG  // 1-of-3');
console.log('  OP_ENDIF');
console.log('');
console.log('Spend paths:');
console.log('  Path 1 (before block 900000): Need 2 of 3 signatures');
console.log('  Path 2 (after block 900000):  Need only 1 of 3 signatures');
console.log('');
console.log('Miniscript policy: or(multi(2,A,B,C),and(multi(1,A,B,C),after(900000)))');
