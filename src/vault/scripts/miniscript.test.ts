/**
 * Vitest tests for miniscript.ts
 *
 * Covers baseline policy generation + fixes:
 * MED-5, MED-6, MED-8, MED-9, LOW-12
 */

import { describe, it, expect } from 'vitest';
import {
  generatePolicy,
  compileToMiniscript,
  extractRedeemInfo,
  analyzePolicy,
  generateStaggeredPolicies,
  type VaultScriptConfig,
} from './miniscript';
import type { SpendPath, MultisigDecayConfig } from './types';

// Test keys — valid 33-byte compressed pubkey format
const OWNER_KEY = '02' + 'aa'.repeat(32);
const HEIR_KEY = '03' + 'bb'.repeat(32);
const HEIR_KEY_2 = '02' + 'cc'.repeat(32);
const ORACLE_KEY = '03' + 'dd'.repeat(32);

// Helper to build a minimal VaultScriptConfig
function makeConfig(overrides: Partial<VaultScriptConfig> = {}): VaultScriptConfig {
  return {
    keys: [
      { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
      { id: 'heir', label: 'Heir', publicKey: HEIR_KEY, keyType: 'heir' },
    ],
    timelocks: [{ type: 'absolute', value: 900000 }],
    logic: 'timelock',
    additionalGates: [],
    ...overrides,
  };
}

describe('generatePolicy', () => {
  it('generates timelock policy with after()', () => {
    const policy = generatePolicy(makeConfig());
    expect(policy).toContain('after(900000)');
    expect(policy).toContain(`pk(${OWNER_KEY})`);
    expect(policy).toContain(`pk(${HEIR_KEY})`);
    expect(policy).toMatch(/^or\(/);
  });

  it('generates dead_man_switch policy with older()', () => {
    const policy = generatePolicy(makeConfig({
      timelocks: [{ type: 'relative', value: 4320 }],
      logic: 'dead_man_switch',
    }));
    expect(policy).toContain('older(4320)');
    expect(policy).not.toContain('after(');
  });

  it('generates multisig_decay policy with thresh()', () => {
    const config = makeConfig({
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'heir1', label: 'Heir 1', publicKey: HEIR_KEY, keyType: 'heir' },
        { id: 'heir2', label: 'Heir 2', publicKey: HEIR_KEY_2, keyType: 'heir' },
      ],
      logic: 'multisig_decay',
      decayConfig: {
        initialThreshold: 2,
        initialTotal: 3,
        decayedThreshold: 1,
        decayedTotal: 2,
        decayAfterBlocks: 900000,
      },
    });
    const policy = generatePolicy(config);
    expect(policy).toContain('thresh(');
  });

  // MED-6: timelocks[0].value = 0 should produce after(0), not fallback to 52560
  it('timelock with value 0 uses 0, not default 52560 (MED-6)', () => {
    const policy = generatePolicy(makeConfig({
      timelocks: [{ type: 'absolute', value: 0 }],
      logic: 'timelock',
    }));
    expect(policy).toContain('after(0)');
    expect(policy).not.toContain('after(52560)');
  });

  // MED-6: same for dead_man_switch
  it('dead_man_switch with value 0 uses 0, not default 4320 (MED-6)', () => {
    const policy = generatePolicy(makeConfig({
      timelocks: [{ type: 'relative', value: 0 }],
      logic: 'dead_man_switch',
    }));
    expect(policy).toContain('older(0)');
    expect(policy).not.toContain('older(4320)');
  });
});

// MED-9: extractRedeemInfo should NOT include a duress spend path
describe('extractRedeemInfo', () => {
  it('does not include duress spend path (MED-9)', () => {
    const config = makeConfig({
      additionalGates: ['duress'],
      duressConfig: {
        duressKeyIndex: 0,
        burnAddress: '1BitcoinEaterAddressDontSendf59kuE',
      },
    });
    const policy = generatePolicy(config);
    const info = extractRedeemInfo(policy, config);

    const pathNames = info.spendPaths.map(p => p.name.toLowerCase());
    expect(pathNames).not.toContain('duress');
    // Should still have owner + heir paths
    expect(info.spendPaths.length).toBeGreaterThanOrEqual(1);
  });
});

// MED-8: deriveAddress was removed from exports
describe('module exports', () => {
  it('does not export deriveAddress (MED-8)', async () => {
    const mod = await import('./miniscript');
    expect('deriveAddress' in mod).toBe(false);
  });
});

// MED-5: SpendPath and MultisigDecayConfig imported from ./types
describe('shared types (MED-5)', () => {
  it('SpendPath type is usable', () => {
    const path: SpendPath = {
      name: 'Test',
      description: 'test path',
    };
    expect(path.name).toBe('Test');
  });

  it('MultisigDecayConfig type is usable', () => {
    const config: MultisigDecayConfig = {
      initialThreshold: 2,
      initialTotal: 3,
      decayedThreshold: 1,
      decayedTotal: 2,
      decayAfterBlocks: 900000,
    };
    expect(config.initialThreshold).toBe(2);
  });
});

// LOW-12: analyzePolicy oracle heuristic comment / fields
describe('analyzePolicy', () => {
  it('returns expected fields (LOW-12 smoke test)', () => {
    const policy = `or(pk(${OWNER_KEY}),and(pk(${HEIR_KEY}),after(900000)))`;
    const result = analyzePolicy(policy);
    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('keys');
    expect(result).toHaveProperty('timelocks');
    expect(result).toHaveProperty('hasChallenge');
    expect(result).toHaveProperty('hasOracle');
    expect(result.type).toBe('timelock');
    expect(result.keys).toHaveLength(2);
  });

  it('detects dead_man_switch type', () => {
    const policy = `or(pk(${OWNER_KEY}),and(pk(${HEIR_KEY}),older(4320)))`;
    const result = analyzePolicy(policy);
    expect(result.type).toBe('dead_man_switch');
  });
});

// Staggered policies smoke test (LOW-14 area)
describe('generateStaggeredPolicies', () => {
  it('generates staggered policies for dead_man_switch', () => {
    const config = makeConfig({
      logic: 'dead_man_switch',
      timelocks: [{ type: 'relative', value: 4320 }],
      staggeredConfig: {
        stages: [
          { percent: 50, blocksAfterTrigger: 0 },
          { percent: 50, blocksAfterTrigger: 1440 },
        ],
      },
    });
    const stages = generateStaggeredPolicies(config);
    expect(stages).toHaveLength(2);
    expect(stages[0].percent).toBe(50);
    expect(stages[1].percent).toBe(50);
    // Both should be valid policy strings
    stages.forEach(s => {
      expect(s.policy).toContain('older(');
      expect(s.policy).toContain(`pk(${OWNER_KEY})`);
    });
  });
});
