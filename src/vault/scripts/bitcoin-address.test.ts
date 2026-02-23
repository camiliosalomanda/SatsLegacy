/**
 * Vitest tests for bitcoin-address.ts
 *
 * Covers baseline address generation + fixes:
 * LOW-13 (TRUE/FALSE witness labels)
 */

import { describe, it, expect } from 'vitest';
import {
  generateTimelockAddress,
  generateDeadManSwitchAddress,
  generateMultisigDecayAddress,
  validateAddress,
} from './bitcoin-address';
import type { MultisigDecayConfig } from './types';

// Test keys — valid 33-byte compressed pubkey format
const OWNER_KEY = '02' + 'aa'.repeat(32);
const HEIR_KEY = '03' + 'bb'.repeat(32);
const HEIR_KEY_2 = '02' + 'cc'.repeat(32);
const LOCKTIME = 900000;
const SEQUENCE_BLOCKS = 4320; // ~30 days

describe('generateTimelockAddress', () => {
  it('produces valid P2WSH bc1q address on mainnet', () => {
    const result = generateTimelockAddress(OWNER_KEY, HEIR_KEY, LOCKTIME, 'mainnet');
    expect(result.address).toMatch(/^bc1q/);
    expect(result.address.length).toBe(62); // P2WSH = 62 chars
    expect(validateAddress(result.address, 'mainnet')).toBe(true);
  });

  it('produces valid P2WSH tb1q address on testnet', () => {
    const result = generateTimelockAddress(OWNER_KEY, HEIR_KEY, LOCKTIME, 'testnet');
    expect(result.address).toMatch(/^tb1q/);
    expect(validateAddress(result.address, 'testnet')).toBe(true);
  });

  it('is deterministic — same inputs produce same address', () => {
    const r1 = generateTimelockAddress(OWNER_KEY, HEIR_KEY, LOCKTIME, 'mainnet');
    const r2 = generateTimelockAddress(OWNER_KEY, HEIR_KEY, LOCKTIME, 'mainnet');
    expect(r1.address).toBe(r2.address);
    expect(r1.witnessScript).toBe(r2.witnessScript);
  });

  // LOW-13: witness descriptions use TRUE/FALSE not OP_TRUE/OP_FALSE
  it('witness descriptions use TRUE/FALSE not OP_TRUE/OP_FALSE (LOW-13)', () => {
    const result = generateTimelockAddress(OWNER_KEY, HEIR_KEY, LOCKTIME, 'mainnet');
    for (const path of result.redeemInfo.spendPaths) {
      if (path.witness) {
        expect(path.witness).not.toContain('OP_TRUE');
        expect(path.witness).not.toContain('OP_FALSE');
        // Should use TRUE or FALSE
        expect(path.witness).toMatch(/TRUE|FALSE/);
      }
    }
  });
});

describe('generateDeadManSwitchAddress', () => {
  it('produces valid P2WSH address', () => {
    const result = generateDeadManSwitchAddress(OWNER_KEY, HEIR_KEY, SEQUENCE_BLOCKS, 'mainnet');
    expect(result.address).toMatch(/^bc1q/);
    expect(result.address.length).toBe(62);
    expect(validateAddress(result.address, 'mainnet')).toBe(true);
  });

  it('is deterministic', () => {
    const r1 = generateDeadManSwitchAddress(OWNER_KEY, HEIR_KEY, SEQUENCE_BLOCKS, 'mainnet');
    const r2 = generateDeadManSwitchAddress(OWNER_KEY, HEIR_KEY, SEQUENCE_BLOCKS, 'mainnet');
    expect(r1.address).toBe(r2.address);
  });

  // LOW-13
  it('witness descriptions use TRUE/FALSE (LOW-13)', () => {
    const result = generateDeadManSwitchAddress(OWNER_KEY, HEIR_KEY, SEQUENCE_BLOCKS, 'mainnet');
    for (const path of result.redeemInfo.spendPaths) {
      if (path.witness) {
        expect(path.witness).not.toContain('OP_TRUE');
        expect(path.witness).not.toContain('OP_FALSE');
      }
    }
  });
});

describe('generateMultisigDecayAddress', () => {
  const decayConfig: MultisigDecayConfig = {
    initialThreshold: 2,
    initialTotal: 3,
    decayedThreshold: 1,
    decayedTotal: 2,
    decayAfterBlocks: LOCKTIME,
  };

  it('produces valid P2WSH address', () => {
    const result = generateMultisigDecayAddress(OWNER_KEY, [HEIR_KEY, HEIR_KEY_2], decayConfig, 'mainnet');
    expect(result.address).toMatch(/^bc1q/);
    expect(result.address.length).toBe(62);
    expect(validateAddress(result.address, 'mainnet')).toBe(true);
  });

  it('witness script contains OP_CHECKMULTISIG and OP_CHECKLOCKTIMEVERIFY', () => {
    const result = generateMultisigDecayAddress(OWNER_KEY, [HEIR_KEY, HEIR_KEY_2], decayConfig, 'mainnet');
    const scriptHex = result.witnessScript;
    // OP_CHECKMULTISIG = 0xae, OP_CHECKLOCKTIMEVERIFY = 0xb1
    // Count occurrences of ae (CHECKMULTISIG) in the hex
    const checkmultisigCount = (scriptHex.match(/ae/g) || []).length;
    expect(checkmultisigCount).toBeGreaterThanOrEqual(2); // one for each branch

    // OP_CHECKLOCKTIMEVERIFY
    expect(scriptHex).toContain('b1');
  });

  it('is deterministic', () => {
    const r1 = generateMultisigDecayAddress(OWNER_KEY, [HEIR_KEY, HEIR_KEY_2], decayConfig, 'mainnet');
    const r2 = generateMultisigDecayAddress(OWNER_KEY, [HEIR_KEY, HEIR_KEY_2], decayConfig, 'mainnet');
    expect(r1.address).toBe(r2.address);
  });
});
