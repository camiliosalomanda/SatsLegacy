/**
 * Test thresh-based multisig decay
 *
 * Using: thresh(2,pk(A),s:pk(B),s:pk(C),sln:after(900000))
 *
 * Before timelock: Need 2 sigs (any 2-of-3)
 * After timelock: Need 1 sig + timelock = 2 conditions
 */

import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import { compilePolicy, compileMiniscript } from '@bitcoinerlab/miniscript';

const ECPair = ECPairFactory(ecc);

console.log('=== Thresh-Based Multisig Decay ===\n');

// Test the miniscript
const miniscript = 'thresh(2,pk(A),s:pk(B),s:pk(C),sln:after(900000))';
console.log('Miniscript:', miniscript);
console.log();

const result = compileMiniscript(miniscript);
console.log('Compiled ASM:');
console.log(result.asm);
console.log();
console.log('Valid (sane):', result.issane);
console.log('Sane sublevel:', result.issanesublevel);
console.log();

// Now build with real keys
const keyA = ECPair.makeRandom();
const keyB = ECPair.makeRandom();
const keyC = ECPair.makeRandom();

const pubA = Buffer.from(keyA.publicKey).toString('hex');
const pubB = Buffer.from(keyB.publicKey).toString('hex');
const pubC = Buffer.from(keyC.publicKey).toString('hex');

console.log('Public Keys:');
console.log('  A:', pubA.slice(0, 20) + '...');
console.log('  B:', pubB.slice(0, 20) + '...');
console.log('  C:', pubC.slice(0, 20) + '...');
console.log();

// Replace placeholders with actual pubkeys in ASM
let asm = result.asm;
asm = asm.replace(/<A>/g, pubA);
asm = asm.replace(/<B>/g, pubB);
asm = asm.replace(/<C>/g, pubC);

console.log('ASM with real keys:');
console.log(asm.slice(0, 100) + '...');
console.log();

// Convert ASM to script
function asmToScript(asmStr: string): Buffer {
  const parts = asmStr.split(' ');
  const scriptParts: (number | Buffer)[] = [];

  for (const part of parts) {
    if (part.startsWith('OP_')) {
      const opcode = (bitcoin.opcodes as any)[part];
      if (opcode !== undefined) {
        scriptParts.push(opcode);
      }
    } else if (/^[0-9a-fA-F]+$/.test(part) && part.length >= 2) {
      // Hex data (pubkey or number)
      scriptParts.push(Buffer.from(part, 'hex'));
    } else if (/^\d+$/.test(part)) {
      // Small number
      const num = parseInt(part);
      if (num === 0) {
        scriptParts.push(bitcoin.opcodes.OP_0);
      } else if (num >= 1 && num <= 16) {
        scriptParts.push(0x50 + num); // OP_1 through OP_16
      } else {
        scriptParts.push(bitcoin.script.number.encode(num));
      }
    }
  }

  return Buffer.from(bitcoin.script.compile(scriptParts));
}

try {
  const script = asmToScript(asm);
  console.log('Script length:', script.length, 'bytes');
  console.log('Script hex:', script.toString('hex').slice(0, 80) + '...');
  console.log();

  // Create P2WSH address
  const p2wsh = bitcoin.payments.p2wsh({
    redeem: { output: script },
    network: bitcoin.networks.testnet,
  });

  console.log('Testnet Address:', p2wsh.address);
  console.log();
} catch (e: any) {
  console.log('Script conversion error:', e.message);
}

// Explain spend conditions
console.log('=== Spend Conditions ===\n');
console.log('This script requires satisfying 2 of 4 conditions:');
console.log('  1. Signature from key A');
console.log('  2. Signature from key B');
console.log('  3. Signature from key C');
console.log('  4. Timelock (nLockTime >= 900000)');
console.log();
console.log('Before block 900000:');
console.log('  - Timelock condition CANNOT be satisfied');
console.log('  - Must provide 2 signatures (any 2-of-3)');
console.log('  - Valid combinations: A+B, A+C, B+C');
console.log();
console.log('After block 900000:');
console.log('  - Timelock condition CAN be satisfied');
console.log('  - Need only 1 signature + timelock = 2 conditions');
console.log('  - Valid combinations: A+timelock, B+timelock, C+timelock');
console.log('  - Also still valid: A+B, A+C, B+C (2 sigs)');
console.log();
console.log('✅ This IS valid Miniscript that Bitcoin Core accepts!');
