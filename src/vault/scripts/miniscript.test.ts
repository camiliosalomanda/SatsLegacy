/**
 * Vitest tests for miniscript.ts
 *
 * Covers baseline policy generation + fixes:
 * MED-5, MED-6, MED-8, MED-9, LOW-12
 */

import { describe, it, expect } from 'vitest';
import {
  generatePolicy,
  generatePolicyV2,
  generateSoloVaultPolicy,
  generateSpousePlanPolicy,
  generateFamilyVaultPolicy,
  generateBusinessVaultPolicy,
  generateDeadMansSwitchPolicyV2,
  validateBIP68,
  applyGates,
  compileToMiniscript,
  extractRedeemInfo,
  analyzePolicy,
  generateStaggeredPolicies,
  type VaultScriptConfig,
  type VaultScriptConfigV2,
} from './miniscript';
import type { SpendPath, MultisigDecayConfig } from './types';

// Test keys — valid 33-byte compressed pubkey format
const OWNER_KEY = '02' + 'aa'.repeat(32);
const HEIR_KEY = '03' + 'bb'.repeat(32);
const HEIR_KEY_2 = '02' + 'cc'.repeat(32);
const HEIR_KEY_3 = '03' + 'ee'.repeat(32);
const ORACLE_KEY = '03' + 'dd'.repeat(32);
const RECOVERY_KEY = '02' + 'ff'.repeat(32);
const SPOUSE_KEY = '03' + '11'.repeat(32);
const PARTNER_KEY = '02' + '22'.repeat(32);
const TRUSTEE_KEY = '03' + '33'.repeat(32);

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

// ============================================
// V2 PROFILE-BASED POLICY GENERATOR TESTS
// ============================================

// Helper to build V2 configs
function makeV2Config(overrides: Partial<VaultScriptConfigV2>): VaultScriptConfigV2 {
  return {
    keys: [],
    timelocks: [],
    profile: 'solo_vault',
    gates: [],
    ...overrides,
  };
}

describe('validateBIP68', () => {
  it('accepts valid block values', () => {
    expect(() => validateBIP68(1)).not.toThrow();
    expect(() => validateBIP68(4320)).not.toThrow();
    expect(() => validateBIP68(52560)).not.toThrow();
    expect(() => validateBIP68(65535)).not.toThrow();
  });

  it('rejects 0', () => {
    expect(() => validateBIP68(0)).toThrow('BIP68 range');
  });

  it('rejects values over 65535', () => {
    expect(() => validateBIP68(65536)).toThrow('BIP68 range');
  });
});

describe('applyGates', () => {
  it('wraps condition with challenge gate', () => {
    const result = applyGates('and(pk(A),older(100))', ['challenge'], {
      challengeHash: 'abcd1234',
    });
    expect(result).toBe('and(sha256(abcd1234),and(pk(A),older(100)))');
  });

  it('wraps condition with oracle gate', () => {
    const result = applyGates('and(pk(A),older(100))', ['oracle'], {
      oracleKey: ORACLE_KEY,
    });
    expect(result).toBe(`and(pk(${ORACLE_KEY}),and(pk(A),older(100)))`);
  });

  it('applies both gates in order', () => {
    const result = applyGates('and(pk(A),older(100))', ['challenge', 'oracle'], {
      challengeHash: 'abcd1234',
      oracleKey: ORACLE_KEY,
    });
    // Challenge applied first, then oracle wraps around it
    expect(result).toContain('sha256(abcd1234)');
    expect(result).toContain(`pk(${ORACLE_KEY})`);
  });

  it('skips challenge gate when no hash provided', () => {
    const result = applyGates('and(pk(A),older(100))', ['challenge'], {});
    expect(result).toBe('and(pk(A),older(100))');
  });
});

describe('generateSoloVaultPolicy', () => {
  it('generates correct solo vault policy', () => {
    const config = makeV2Config({
      profile: 'solo_vault',
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'recovery', label: 'Recovery', publicKey: RECOVERY_KEY, keyType: 'recovery' },
      ],
      timelocks: [{ type: 'relative', value: 52560 }],
    });
    const policy = generateSoloVaultPolicy(config);
    expect(policy).toBe(`or(pk(${OWNER_KEY}),and(pk(${RECOVERY_KEY}),older(52560)))`);
  });

  it('throws without owner key', () => {
    const config = makeV2Config({
      keys: [{ id: 'recovery', label: 'Recovery', publicKey: RECOVERY_KEY, keyType: 'recovery' }],
    });
    expect(() => generateSoloVaultPolicy(config)).toThrow('Owner key is required');
  });

  it('throws without recovery key', () => {
    const config = makeV2Config({
      keys: [{ id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' }],
    });
    expect(() => generateSoloVaultPolicy(config)).toThrow('Recovery key is required');
  });

  it('applies challenge gate to recovery path', () => {
    const config = makeV2Config({
      profile: 'solo_vault',
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'recovery', label: 'Recovery', publicKey: RECOVERY_KEY, keyType: 'recovery' },
      ],
      timelocks: [{ type: 'relative', value: 52560 }],
      gates: ['challenge'],
      challengeHash: 'deadbeef',
    });
    const policy = generateSoloVaultPolicy(config);
    expect(policy).toContain('sha256(deadbeef)');
    // Owner path should NOT have challenge
    expect(policy).toMatch(/^or\(pk\(/);
  });

  it('uses only older() (relative timelocks)', () => {
    const config = makeV2Config({
      profile: 'solo_vault',
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'recovery', label: 'Recovery', publicKey: RECOVERY_KEY, keyType: 'recovery' },
      ],
      timelocks: [{ type: 'relative', value: 52560 }],
    });
    const policy = generateSoloVaultPolicy(config);
    expect(policy).toContain('older(');
    expect(policy).not.toContain('after(');
  });
});

describe('generateSpousePlanPolicy', () => {
  it('generates correct spouse plan policy', () => {
    const config = makeV2Config({
      profile: 'spouse_plan',
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'spouse', label: 'Spouse', publicKey: SPOUSE_KEY, keyType: 'spouse' },
        { id: 'heir', label: 'Heir', publicKey: HEIR_KEY, keyType: 'heir' },
      ],
      timelocks: [
        { type: 'relative', value: 4320 },
        { type: 'relative', value: 52560 },
      ],
    });
    const policy = generateSpousePlanPolicy(config);
    expect(policy).toContain(`pk(${OWNER_KEY})`);
    expect(policy).toContain(`pk(${SPOUSE_KEY})`);
    expect(policy).toContain(`pk(${HEIR_KEY})`);
    expect(policy).toContain('older(4320)');
    expect(policy).toContain('older(52560)');
  });

  it('applies gates only to heir path, not spouse', () => {
    const config = makeV2Config({
      profile: 'spouse_plan',
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'spouse', label: 'Spouse', publicKey: SPOUSE_KEY, keyType: 'spouse' },
        { id: 'heir', label: 'Heir', publicKey: HEIR_KEY, keyType: 'heir' },
      ],
      timelocks: [
        { type: 'relative', value: 4320 },
        { type: 'relative', value: 52560 },
      ],
      gates: ['challenge'],
      challengeHash: 'cafebabe',
    });
    const policy = generateSpousePlanPolicy(config);
    // Challenge should appear in heir section, not spouse
    const spousePart = `and(pk(${SPOUSE_KEY}),older(4320))`;
    expect(policy).toContain(spousePart); // spouse path unchanged
    expect(policy).toContain('sha256(cafebabe)');
  });

  it('uses only older() (relative timelocks)', () => {
    const config = makeV2Config({
      profile: 'spouse_plan',
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'spouse', label: 'Spouse', publicKey: SPOUSE_KEY, keyType: 'spouse' },
        { id: 'heir', label: 'Heir', publicKey: HEIR_KEY, keyType: 'heir' },
      ],
      timelocks: [
        { type: 'relative', value: 4320 },
        { type: 'relative', value: 52560 },
      ],
    });
    const policy = generateSpousePlanPolicy(config);
    expect(policy).toContain('older(');
    expect(policy).not.toContain('after(');
  });
});

describe('generateFamilyVaultPolicy', () => {
  it('generates correct family vault policy with 3 heirs', () => {
    const config = makeV2Config({
      profile: 'family_vault',
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'recovery', label: 'Recovery', publicKey: RECOVERY_KEY, keyType: 'recovery' },
        { id: 'heir1', label: 'Heir 1', publicKey: HEIR_KEY, keyType: 'heir' },
        { id: 'heir2', label: 'Heir 2', publicKey: HEIR_KEY_2, keyType: 'heir' },
        { id: 'heir3', label: 'Heir 3', publicKey: HEIR_KEY_3, keyType: 'heir' },
      ],
      timelocks: [
        { type: 'relative', value: 4320 },
        { type: 'relative', value: 52560 },
      ],
    });
    const policy = generateFamilyVaultPolicy(config);
    expect(policy).toContain('thresh(2,');
    expect(policy).toContain(`pk(${HEIR_KEY})`);
    expect(policy).toContain(`pk(${HEIR_KEY_2})`);
    expect(policy).toContain(`pk(${HEIR_KEY_3})`);
    expect(policy).toContain('older(4320)');
    expect(policy).toContain('older(52560)');
  });

  it('works with exactly 2 heirs', () => {
    const config = makeV2Config({
      profile: 'family_vault',
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'recovery', label: 'Recovery', publicKey: RECOVERY_KEY, keyType: 'recovery' },
        { id: 'heir1', label: 'Heir 1', publicKey: HEIR_KEY, keyType: 'heir' },
        { id: 'heir2', label: 'Heir 2', publicKey: HEIR_KEY_2, keyType: 'heir' },
      ],
      timelocks: [
        { type: 'relative', value: 4320 },
        { type: 'relative', value: 52560 },
      ],
    });
    const policy = generateFamilyVaultPolicy(config);
    expect(policy).toContain('thresh(2,');
  });

  it('throws with fewer than 2 heirs', () => {
    const config = makeV2Config({
      profile: 'family_vault',
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'recovery', label: 'Recovery', publicKey: RECOVERY_KEY, keyType: 'recovery' },
        { id: 'heir1', label: 'Heir 1', publicKey: HEIR_KEY, keyType: 'heir' },
      ],
    });
    expect(() => generateFamilyVaultPolicy(config)).toThrow('At least 2 heir keys');
  });

  it('uses only older() (relative timelocks)', () => {
    const config = makeV2Config({
      profile: 'family_vault',
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'recovery', label: 'Recovery', publicKey: RECOVERY_KEY, keyType: 'recovery' },
        { id: 'heir1', label: 'Heir 1', publicKey: HEIR_KEY, keyType: 'heir' },
        { id: 'heir2', label: 'Heir 2', publicKey: HEIR_KEY_2, keyType: 'heir' },
        { id: 'heir3', label: 'Heir 3', publicKey: HEIR_KEY_3, keyType: 'heir' },
      ],
      timelocks: [
        { type: 'relative', value: 4320 },
        { type: 'relative', value: 52560 },
      ],
    });
    const policy = generateFamilyVaultPolicy(config);
    expect(policy).toContain('older(');
    expect(policy).not.toContain('after(');
  });
});

describe('generateBusinessVaultPolicy', () => {
  it('generates correct business vault policy', () => {
    const config = makeV2Config({
      profile: 'business_vault',
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'partner', label: 'Partner', publicKey: PARTNER_KEY, keyType: 'partner' },
        { id: 'trustee', label: 'Trustee', publicKey: TRUSTEE_KEY, keyType: 'trustee' },
      ],
      timelocks: [
        { type: 'relative', value: 4320 },
        { type: 'relative', value: 52560 },
      ],
    });
    const policy = generateBusinessVaultPolicy(config);
    // Joint path: and(pk(owner), pk(partner))
    expect(policy).toContain(`and(pk(${OWNER_KEY}),pk(${PARTNER_KEY}))`);
    // Owner solo path: and(pk(owner), older(4320))
    expect(policy).toContain(`and(pk(${OWNER_KEY}),older(4320))`);
    // Trustee path: and(pk(trustee), older(52560))
    expect(policy).toContain(`and(pk(${TRUSTEE_KEY}),older(52560))`);
  });

  it('applies gates only to trustee path', () => {
    const config = makeV2Config({
      profile: 'business_vault',
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'partner', label: 'Partner', publicKey: PARTNER_KEY, keyType: 'partner' },
        { id: 'trustee', label: 'Trustee', publicKey: TRUSTEE_KEY, keyType: 'trustee' },
      ],
      timelocks: [
        { type: 'relative', value: 4320 },
        { type: 'relative', value: 52560 },
      ],
      gates: ['challenge'],
      challengeHash: 'aabbccdd',
    });
    const policy = generateBusinessVaultPolicy(config);
    // Joint and owner-solo paths should NOT have challenge
    expect(policy).toContain(`and(pk(${OWNER_KEY}),pk(${PARTNER_KEY}))`);
    expect(policy).toContain(`and(pk(${OWNER_KEY}),older(4320))`);
    // Trustee path SHOULD have challenge
    expect(policy).toContain('sha256(aabbccdd)');
  });

  it('uses only older() (relative timelocks)', () => {
    const config = makeV2Config({
      profile: 'business_vault',
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'partner', label: 'Partner', publicKey: PARTNER_KEY, keyType: 'partner' },
        { id: 'trustee', label: 'Trustee', publicKey: TRUSTEE_KEY, keyType: 'trustee' },
      ],
      timelocks: [
        { type: 'relative', value: 4320 },
        { type: 'relative', value: 52560 },
      ],
    });
    const policy = generateBusinessVaultPolicy(config);
    expect(policy).toContain('older(');
    expect(policy).not.toContain('after(');
  });

  // NOTE: Business vault reuses the owner key in joint and solo paths.
  // This is intentional design but means the policy cannot compile to
  // "sane" miniscript (key reuse creates theoretical malleability).
  // Address generation for business vault uses direct script construction.
});

describe('generateDeadMansSwitchPolicyV2', () => {
  it('generates correct DMS policy', () => {
    const config = makeV2Config({
      profile: 'dead_mans_switch',
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'heir', label: 'Heir', publicKey: HEIR_KEY, keyType: 'heir' },
      ],
      timelocks: [{ type: 'relative', value: 26280 }],
    });
    const policy = generateDeadMansSwitchPolicyV2(config);
    expect(policy).toBe(`or(pk(${OWNER_KEY}),and(pk(${HEIR_KEY}),older(26280)))`);
  });

  it('rejects BIP68-exceeding timelock', () => {
    const config = makeV2Config({
      profile: 'dead_mans_switch',
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'heir', label: 'Heir', publicKey: HEIR_KEY, keyType: 'heir' },
      ],
      timelocks: [{ type: 'relative', value: 70000 }],
    });
    expect(() => generateDeadMansSwitchPolicyV2(config)).toThrow('BIP68 range');
  });

  it('uses only older() (relative timelocks)', () => {
    const config = makeV2Config({
      profile: 'dead_mans_switch',
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'heir', label: 'Heir', publicKey: HEIR_KEY, keyType: 'heir' },
      ],
      timelocks: [{ type: 'relative', value: 26280 }],
    });
    const policy = generateDeadMansSwitchPolicyV2(config);
    expect(policy).toContain('older(');
    expect(policy).not.toContain('after(');
  });
});

describe('generatePolicyV2 (router)', () => {
  it('routes solo_vault correctly', () => {
    const config = makeV2Config({
      profile: 'solo_vault',
      keys: [
        { id: 'owner', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
        { id: 'recovery', label: 'Recovery', publicKey: RECOVERY_KEY, keyType: 'recovery' },
      ],
      timelocks: [{ type: 'relative', value: 52560 }],
    });
    const policy = generatePolicyV2(config);
    expect(policy).toContain('older(52560)');
    expect(policy).toContain(`pk(${RECOVERY_KEY})`);
  });

  it('routes all 5 profiles without error', () => {
    const profiles: Array<{ profile: VaultScriptConfigV2['profile']; keys: VaultScriptConfigV2['keys'] }> = [
      {
        profile: 'solo_vault',
        keys: [
          { id: 'o', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
          { id: 'r', label: 'Recovery', publicKey: RECOVERY_KEY, keyType: 'recovery' },
        ],
      },
      {
        profile: 'spouse_plan',
        keys: [
          { id: 'o', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
          { id: 's', label: 'Spouse', publicKey: SPOUSE_KEY, keyType: 'spouse' },
          { id: 'h', label: 'Heir', publicKey: HEIR_KEY, keyType: 'heir' },
        ],
      },
      {
        profile: 'family_vault',
        keys: [
          { id: 'o', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
          { id: 'r', label: 'Recovery', publicKey: RECOVERY_KEY, keyType: 'recovery' },
          { id: 'h1', label: 'Heir 1', publicKey: HEIR_KEY, keyType: 'heir' },
          { id: 'h2', label: 'Heir 2', publicKey: HEIR_KEY_2, keyType: 'heir' },
        ],
      },
      {
        profile: 'business_vault',
        keys: [
          { id: 'o', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
          { id: 'p', label: 'Partner', publicKey: PARTNER_KEY, keyType: 'partner' },
          { id: 't', label: 'Trustee', publicKey: TRUSTEE_KEY, keyType: 'trustee' },
        ],
      },
      {
        profile: 'dead_mans_switch',
        keys: [
          { id: 'o', label: 'Owner', publicKey: OWNER_KEY, keyType: 'owner' },
          { id: 'h', label: 'Heir', publicKey: HEIR_KEY, keyType: 'heir' },
        ],
      },
    ];

    for (const p of profiles) {
      const config = makeV2Config({
        profile: p.profile,
        keys: p.keys,
        timelocks: [
          { type: 'relative', value: 4320 },
          { type: 'relative', value: 52560 },
        ],
      });
      const policy = generatePolicyV2(config);
      expect(policy).toBeTruthy();
      // All V2 policies should use older() (relative timelocks)
      expect(policy).toContain('older(');
    }
  });

  it('compiles 4 of 5 profiles to sane miniscript (using abstract keys)', () => {
    // Uses abstract key names because @bitcoinerlab/miniscript validates
    // that hex keys are valid secp256k1 points. Abstract names bypass this.
    const compilableProfiles = [
      { name: 'Solo', policy: 'or(pk(OWNER),and(pk(RECOVERY),older(52560)))' },
      { name: 'Spouse', policy: 'or(pk(OWNER),or(and(pk(SPOUSE),older(4320)),and(pk(HEIR),older(52560))))' },
      { name: 'Family', policy: 'or(pk(OWNER),or(and(pk(RECOVERY),older(4320)),and(thresh(2,pk(HEIR1),pk(HEIR2),pk(HEIR3)),older(52560))))' },
      { name: 'DMS', policy: 'or(pk(OWNER),and(pk(HEIR),older(26280)))' },
    ];

    for (const { name, policy } of compilableProfiles) {
      const result = compileToMiniscript(policy);
      expect(result.isValid).toBe(true);
      expect(result.miniscript).not.toBe('');
    }
  });

  it('business vault cannot compile to sane miniscript (intentional key reuse)', () => {
    // Business vault reuses OWNER key in joint and solo paths.
    // This is by design but the miniscript compiler considers it non-sane.
    // Address generation for business vault uses direct script construction.
    const policy = 'or(and(pk(OWNER),pk(PARTNER)),or(and(pk(OWNER),older(4320)),and(pk(TRUSTEE),older(52560))))';
    const result = compileToMiniscript(policy);
    expect(result.isValid).toBe(false);
  });

  it('throws on unknown profile', () => {
    const config = makeV2Config({ profile: 'nonexistent' as any });
    expect(() => generatePolicyV2(config)).toThrow('Unknown vault profile');
  });
});
