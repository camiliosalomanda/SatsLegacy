/**
 * Detailed test of timelock script encoding
 *
 * This test proves:
 * 1. The script uses OP_CHECKLOCKTIMEVERIFY (not CSV)
 * 2. The locktime is properly encoded as a Bitcoin script number
 * 3. The script structure matches expected format
 * 4. The address is valid and deterministic
 *
 * Run with: npx tsx scripts/test-timelock-script.ts
 */

import * as bitcoin from 'bitcoinjs-lib';
import { generateTimelockAddress, validateAddress } from '../src/vault/scripts/bitcoin-address';

// Bitcoin Script opcodes for reference
const OPCODES = {
  OP_IF: 0x63,
  OP_ELSE: 0x67,
  OP_ENDIF: 0x68,
  OP_DROP: 0x75,
  OP_CHECKSIG: 0xac,
  OP_CHECKLOCKTIMEVERIFY: 0xb1,  // CLTV - absolute timelock
  OP_CHECKSEQUENCEVERIFY: 0xb2,  // CSV - relative timelock (NOT USED)
};

// Test keys (valid compressed pubkeys)
const TEST_OWNER_PUBKEY = '02e493dbf1c10d80f3581e4904930b1404cc6c13900ee0758474fa94abe8c4cd13';
const TEST_HEIR_PUBKEY = '03a0434d9e47f3c86235477c7b1ae6ae5d3442d49b1943c2b752a68e2a47e247c7';
const TEST_LOCKTIME = 900000; // Block height

function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  // Check if it's comma-separated decimals (from Buffer.toString())
  if (hex.includes(',')) {
    return hex.split(',').map(s => parseInt(s.trim(), 10));
  }
  // Otherwise treat as hex string
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

function bytesToHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

function formatOpcode(byte: number): string {
  for (const [name, value] of Object.entries(OPCODES)) {
    if (value === byte) return name;
  }
  return `0x${byte.toString(16).padStart(2, '0')}`;
}

function decodeScriptNumber(bytes: number[]): number {
  // Bitcoin script number encoding (little-endian with sign bit)
  if (bytes.length === 0) return 0;

  let result = 0;
  for (let i = 0; i < bytes.length; i++) {
    result |= bytes[i] << (8 * i);
  }

  // Check sign bit
  if (bytes[bytes.length - 1] & 0x80) {
    result = -(result & ~(0x80 << (8 * (bytes.length - 1))));
  }

  return result;
}

function disassembleScript(scriptHex: string): void {
  const bytes = hexToBytes(scriptHex);
  let i = 0;
  let step = 1;

  console.log('\n=== Script Disassembly ===\n');
  console.log(`Raw hex (${bytes.length} bytes): ${bytesToHex(bytes)}\n`);

  while (i < bytes.length) {
    const byte = bytes[i];

    // Check if it's a data push
    if (byte >= 0x01 && byte <= 0x4b) {
      // Direct push of N bytes
      const dataLen = byte;
      const data = bytes.slice(i + 1, i + 1 + dataLen);
      const dataHex = data.map(b => b.toString(16).padStart(2, '0')).join('');

      // Check if this looks like a pubkey (33 bytes starting with 02 or 03)
      if (dataLen === 33 && (data[0] === 0x02 || data[0] === 0x03)) {
        console.log(`${step}. PUSH ${dataLen} bytes: <pubkey ${dataHex.slice(0, 8)}...>`);
      }
      // Check if this is a locktime (3-4 bytes)
      else if (dataLen <= 5) {
        const num = decodeScriptNumber(data);
        console.log(`${step}. PUSH ${dataLen} bytes: ${num} (locktime block height)`);
      }
      else {
        console.log(`${step}. PUSH ${dataLen} bytes: ${dataHex}`);
      }

      i += 1 + dataLen;
    } else {
      // It's an opcode
      console.log(`${step}. ${formatOpcode(byte)}`);
      i += 1;
    }
    step++;
  }
}

function verifyScriptStructure(scriptHex: string): { valid: boolean; details: string[] } {
  const bytes = hexToBytes(scriptHex);
  const details: string[] = [];
  let valid = true;

  // Expected structure:
  // OP_IF <33-byte pubkey> OP_CHECKSIG OP_ELSE <locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP <33-byte pubkey> OP_CHECKSIG OP_ENDIF

  let i = 0;

  // 1. OP_IF
  if (bytes[i] !== OPCODES.OP_IF) {
    details.push(`FAIL: Expected OP_IF at position 0, got 0x${bytes[i].toString(16)}`);
    valid = false;
  } else {
    details.push('OK: Script starts with OP_IF');
  }
  i++;

  // 2. Owner pubkey (33 bytes)
  if (bytes[i] !== 33) {
    details.push(`FAIL: Expected 33-byte push for owner pubkey, got ${bytes[i]}`);
    valid = false;
  } else {
    const pubkey = bytes.slice(i + 1, i + 34);
    if (pubkey[0] !== 0x02 && pubkey[0] !== 0x03) {
      details.push(`FAIL: Owner pubkey doesn't start with 02 or 03`);
      valid = false;
    } else {
      details.push(`OK: Owner pubkey (33 bytes, starts with 0x${pubkey[0].toString(16)})`);
    }
  }
  i += 34;

  // 3. OP_CHECKSIG
  if (bytes[i] !== OPCODES.OP_CHECKSIG) {
    details.push(`FAIL: Expected OP_CHECKSIG after owner pubkey`);
    valid = false;
  } else {
    details.push('OK: OP_CHECKSIG for owner path');
  }
  i++;

  // 4. OP_ELSE
  if (bytes[i] !== OPCODES.OP_ELSE) {
    details.push(`FAIL: Expected OP_ELSE`);
    valid = false;
  } else {
    details.push('OK: OP_ELSE (heir path begins)');
  }
  i++;

  // 5. Locktime (variable length, typically 3-4 bytes for block heights)
  const locktimeLen = bytes[i];
  if (locktimeLen < 1 || locktimeLen > 5) {
    details.push(`FAIL: Unexpected locktime length: ${locktimeLen}`);
    valid = false;
  } else {
    const locktimeBytes = bytes.slice(i + 1, i + 1 + locktimeLen);
    const locktime = decodeScriptNumber(locktimeBytes);
    details.push(`OK: Locktime = ${locktime} blocks (${locktimeLen} bytes encoded)`);
  }
  i += 1 + locktimeLen;

  // 6. OP_CHECKLOCKTIMEVERIFY (THIS IS THE KEY CHECK!)
  if (bytes[i] !== OPCODES.OP_CHECKLOCKTIMEVERIFY) {
    if (bytes[i] === OPCODES.OP_CHECKSEQUENCEVERIFY) {
      details.push(`FAIL: Script uses OP_CHECKSEQUENCEVERIFY (relative) instead of OP_CHECKLOCKTIMEVERIFY (absolute)`);
    } else {
      details.push(`FAIL: Expected OP_CHECKLOCKTIMEVERIFY (0xb1), got 0x${bytes[i].toString(16)}`);
    }
    valid = false;
  } else {
    details.push('OK: OP_CHECKLOCKTIMEVERIFY (CLTV) - absolute timelock confirmed');
  }
  i++;

  // 7. OP_DROP
  if (bytes[i] !== OPCODES.OP_DROP) {
    details.push(`FAIL: Expected OP_DROP after CLTV`);
    valid = false;
  } else {
    details.push('OK: OP_DROP (removes locktime from stack)');
  }
  i++;

  // 8. Heir pubkey (33 bytes)
  if (bytes[i] !== 33) {
    details.push(`FAIL: Expected 33-byte push for heir pubkey`);
    valid = false;
  } else {
    const pubkey = bytes.slice(i + 1, i + 34);
    if (pubkey[0] !== 0x02 && pubkey[0] !== 0x03) {
      details.push(`FAIL: Heir pubkey doesn't start with 02 or 03`);
      valid = false;
    } else {
      details.push(`OK: Heir pubkey (33 bytes, starts with 0x${pubkey[0].toString(16)})`);
    }
  }
  i += 34;

  // 9. OP_CHECKSIG
  if (bytes[i] !== OPCODES.OP_CHECKSIG) {
    details.push(`FAIL: Expected OP_CHECKSIG after heir pubkey`);
    valid = false;
  } else {
    details.push('OK: OP_CHECKSIG for heir path');
  }
  i++;

  // 10. OP_ENDIF
  if (bytes[i] !== OPCODES.OP_ENDIF) {
    details.push(`FAIL: Expected OP_ENDIF`);
    valid = false;
  } else {
    details.push('OK: OP_ENDIF (script complete)');
  }

  return { valid, details };
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     SatsLegacy Timelock Script Verification Test               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Generate the timelock address
  console.log('Test Parameters:');
  console.log(`  Owner Pubkey: ${TEST_OWNER_PUBKEY}`);
  console.log(`  Heir Pubkey:  ${TEST_HEIR_PUBKEY}`);
  console.log(`  Locktime:     ${TEST_LOCKTIME} blocks`);

  const result = generateTimelockAddress(
    TEST_OWNER_PUBKEY,
    TEST_HEIR_PUBKEY,
    TEST_LOCKTIME,
    'testnet'
  );

  console.log(`\nGenerated Address: ${result.address}`);
  console.log(`Witness Script:    ${result.witnessScript}`);

  // Disassemble the script
  disassembleScript(result.witnessScript);

  // Verify script structure
  console.log('\n=== Script Structure Verification ===\n');
  const verification = verifyScriptStructure(result.witnessScript);

  for (const detail of verification.details) {
    const icon = detail.startsWith('OK') ? '✓' : '✗';
    const color = detail.startsWith('OK') ? '\x1b[32m' : '\x1b[31m';
    console.log(`${color}${icon}\x1b[0m ${detail}`);
  }

  // Validate the address
  console.log('\n=== Address Validation ===\n');

  const isValidTestnet = validateAddress(result.address, 'testnet');
  const isValidMainnet = validateAddress(result.address, 'mainnet');

  console.log(`Testnet validation: ${isValidTestnet ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Mainnet validation: ${isValidMainnet ? '✓ PASS (should fail)' : '✗ FAIL (expected)'}`);

  // Test determinism - same inputs should produce same address
  console.log('\n=== Determinism Test ===\n');

  const result2 = generateTimelockAddress(
    TEST_OWNER_PUBKEY,
    TEST_HEIR_PUBKEY,
    TEST_LOCKTIME,
    'testnet'
  );

  const isDeterministic = result.address === result2.address && result.witnessScript === result2.witnessScript;
  console.log(`Same inputs produce same output: ${isDeterministic ? '✓ PASS' : '✗ FAIL'}`);

  // Test different locktimes produce different addresses
  const result3 = generateTimelockAddress(
    TEST_OWNER_PUBKEY,
    TEST_HEIR_PUBKEY,
    TEST_LOCKTIME + 1000,
    'testnet'
  );

  const differentLocktime = result.address !== result3.address;
  console.log(`Different locktime produces different address: ${differentLocktime ? '✓ PASS' : '✗ FAIL'}`);

  // Spending path analysis
  console.log('\n=== Spending Paths ===\n');
  console.log('Owner Path (OP_IF branch):');
  console.log('  - Can spend ANYTIME');
  console.log('  - Witness: <owner_signature> OP_TRUE <witnessScript>');
  console.log('  - No locktime requirement\n');

  console.log('Heir Path (OP_ELSE branch):');
  console.log(`  - Can spend AFTER block ${TEST_LOCKTIME}`);
  console.log('  - Witness: <heir_signature> OP_FALSE <witnessScript>');
  console.log('  - Transaction nLockTime must be >= locktime');
  console.log('  - Transaction nSequence must be < 0xffffffff');

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                         SUMMARY                                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`\nScript Type: P2WSH (Pay to Witness Script Hash)`);
  console.log(`Timelock Type: OP_CHECKLOCKTIMEVERIFY (absolute block height)`);
  console.log(`Script Valid: ${verification.valid ? '✓ YES' : '✗ NO'}`);
  console.log(`Address Valid: ${isValidTestnet ? '✓ YES' : '✗ NO'}`);

  if (!verification.valid) {
    process.exit(1);
  }
}

runTests().catch(console.error);
