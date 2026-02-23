/**
 * Vitest tests for psbt-builder.ts
 *
 * Covers PSBT building, script detection, and parsing + fixes:
 * CRIT-2, MED-7, MED-10
 */

import { describe, it, expect } from 'vitest';
import * as bitcoin from 'bitcoinjs-lib';
import { Buffer } from 'buffer';
import {
  buildTimelockWitnessScript,
  buildDeadManSwitchWitnessScript,
  detectScriptType,
  parseWitnessScript,
  estimateVsize,
  finalizePsbt,
} from './psbt-builder';
import { generateMultisigDecayAddress } from './bitcoin-address';
import type { MultisigDecayConfig } from './types';

// Test keys
const OWNER_KEY = '02' + 'aa'.repeat(32);
const HEIR_KEY = '03' + 'bb'.repeat(32);
const HEIR_KEY_2 = '02' + 'cc'.repeat(32);
const LOCKTIME = 900000;
const SEQUENCE = 4320;

describe('buildTimelockWitnessScript', () => {
  it('produces a decompilable script', () => {
    const script = buildTimelockWitnessScript(OWNER_KEY, HEIR_KEY, LOCKTIME);
    expect(script).toBeInstanceOf(Uint8Array);
    const decompiled = bitcoin.script.decompile(script);
    expect(decompiled).not.toBeNull();
    expect(decompiled!.length).toBeGreaterThan(0);
  });

  it('contains OP_CHECKSIG and OP_CHECKLOCKTIMEVERIFY', () => {
    const script = buildTimelockWitnessScript(OWNER_KEY, HEIR_KEY, LOCKTIME);
    const decompiled = bitcoin.script.decompile(script)!;
    expect(decompiled).toContain(bitcoin.opcodes.OP_CHECKSIG);
    expect(decompiled).toContain(bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY);
  });
});

describe('buildDeadManSwitchWitnessScript', () => {
  it('produces a decompilable script', () => {
    const script = buildDeadManSwitchWitnessScript(OWNER_KEY, HEIR_KEY, SEQUENCE);
    const decompiled = bitcoin.script.decompile(script);
    expect(decompiled).not.toBeNull();
    expect(decompiled!.length).toBeGreaterThan(0);
  });

  it('contains OP_CHECKSEQUENCEVERIFY', () => {
    const script = buildDeadManSwitchWitnessScript(OWNER_KEY, HEIR_KEY, SEQUENCE);
    const decompiled = bitcoin.script.decompile(script)!;
    expect(decompiled).toContain(bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY);
  });
});

// CRIT-2: detectScriptType correctly identifies script types
describe('detectScriptType', () => {
  it('returns "checksig" for timelock witness script (CRIT-2)', () => {
    const script = buildTimelockWitnessScript(OWNER_KEY, HEIR_KEY, LOCKTIME);
    expect(detectScriptType(Buffer.from(script))).toBe('checksig');
  });

  it('returns "checksig" for DMS witness script', () => {
    const script = buildDeadManSwitchWitnessScript(OWNER_KEY, HEIR_KEY, SEQUENCE);
    expect(detectScriptType(Buffer.from(script))).toBe('checksig');
  });

  it('returns "multisig" for multisig decay witness script (CRIT-2)', () => {
    const decayConfig: MultisigDecayConfig = {
      initialThreshold: 2,
      initialTotal: 3,
      decayedThreshold: 1,
      decayedTotal: 2,
      decayAfterBlocks: LOCKTIME,
    };
    const result = generateMultisigDecayAddress(OWNER_KEY, [HEIR_KEY, HEIR_KEY_2], decayConfig, 'mainnet');
    const scriptBuf = Buffer.from(result.witnessScript, 'hex');
    expect(detectScriptType(scriptBuf)).toBe('multisig');
  });
});

// MED-7: parseWitnessScript handles various formats
describe('parseWitnessScript', () => {
  it('handles hex strings (MED-7)', () => {
    const script = buildTimelockWitnessScript(OWNER_KEY, HEIR_KEY, LOCKTIME);
    const hex = Buffer.from(script).toString('hex');
    const parsed = parseWitnessScript(hex);
    expect(Buffer.from(parsed).toString('hex')).toBe(hex);
  });

  it('handles comma-separated byte format (MED-7)', () => {
    const script = buildTimelockWitnessScript(OWNER_KEY, HEIR_KEY, LOCKTIME);
    const bytes = Array.from(script);
    const csvStr = bytes.join(',');
    const parsed = parseWitnessScript(csvStr);
    expect(Buffer.from(parsed).toString('hex')).toBe(Buffer.from(script).toString('hex'));
  });

  it('throws on invalid bytes >255 (MED-7)', () => {
    expect(() => parseWitnessScript('99,256,33')).toThrow(/Invalid byte value/);
  });

  it('throws on negative bytes (MED-7)', () => {
    expect(() => parseWitnessScript('99,-1,33')).toThrow(/Invalid byte value/);
  });

  it('throws on non-numeric values in CSV (MED-7)', () => {
    expect(() => parseWitnessScript('99,abc,33')).toThrow(/Invalid byte value/);
  });
});

// MED-10: estimateVsize returns larger value for multisig_decay
describe('estimateVsize', () => {
  it('multisig_decay estimate is larger than single-sig (MED-10)', () => {
    const singleSig = estimateVsize(1, 1, true);
    const multisigDecay = estimateVsize(1, 1, true, 'multisig_decay');
    expect(multisigDecay).toBeGreaterThan(singleSig);
  });

  it('heir spend estimate is larger than owner spend', () => {
    const ownerSpend = estimateVsize(1, 1, false);
    const heirSpend = estimateVsize(1, 1, true);
    expect(heirSpend).toBeGreaterThan(ownerSpend);
  });

  it('scales with input count', () => {
    const oneInput = estimateVsize(1, 1, false);
    const twoInputs = estimateVsize(2, 1, false);
    expect(twoInputs).toBeGreaterThan(oneInput);
  });
});

// CRIT-2: finalizePsbt accepts multisig spend paths
describe('finalizePsbt', () => {
  it('accepts multisig_before_decay and multisig_after_decay spend paths', () => {
    // We can't fully test finalization without a signed PSBT, but we can verify
    // the function signature accepts these values without throwing a type error.
    // With an empty/invalid PSBT it should return an error, not crash.
    const result1 = finalizePsbt('', 'mainnet', 'multisig_before_decay');
    expect(result1).toHaveProperty('error');

    const result2 = finalizePsbt('', 'mainnet', 'multisig_after_decay');
    expect(result2).toHaveProperty('error');

    // Original paths should still work too
    const result3 = finalizePsbt('', 'mainnet', 'owner');
    expect(result3).toHaveProperty('error');

    const result4 = finalizePsbt('', 'mainnet', 'heir');
    expect(result4).toHaveProperty('error');
  });
});
