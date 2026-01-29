/**
 * Hybrid Vault Configurations Test
 *
 * Shows how multiple conditions are combined:
 * - Timelock + Multisig
 * - Decay + Challenge
 * - Dead Man's Switch + Oracle
 * - Staggered Release
 */

import {
  generatePolicy,
  generateStaggeredPolicies,
  compileToMiniscript,
  type VaultScriptConfig,
  type MultisigDecayConfig,
} from '../src/vault/scripts/miniscript';

import {
  validateConfiguration,
  PRESET_BUNDLES,
  type VaultConfiguration,
} from '../src/vault/creation/validation/compatibility';

console.log('=== Hybrid Vault Configurations ===\n');

// ============================================
// 1. SIMPLE TIMELOCK
// ============================================
console.log('--- 1. Simple Timelock ---');
console.log('Owner can spend anytime, heir can spend after block 900000\n');

const timelockConfig: VaultScriptConfig = {
  keys: [
    { id: '1', label: 'Owner', publicKey: 'OWNER', keyType: 'owner' },
    { id: '2', label: 'Heir', publicKey: 'HEIR', keyType: 'heir' },
  ],
  timelocks: [{ type: 'absolute', value: 900000 }],
  logic: 'timelock',
  additionalGates: [],
};

const timelockPolicy = generatePolicy(timelockConfig);
console.log('Policy:', timelockPolicy);
console.log('Meaning: or(pk(owner), and(pk(heir), after(900000)))');
console.log();

// ============================================
// 2. TIMELOCK + CHALLENGE (Hybrid)
// ============================================
console.log('--- 2. Timelock + Challenge ---');
console.log('Heir must know passphrase AND wait for timelock\n');

const timelockChallengeConfig: VaultScriptConfig = {
  keys: [
    { id: '1', label: 'Owner', publicKey: 'OWNER', keyType: 'owner' },
    { id: '2', label: 'Heir', publicKey: 'HEIR', keyType: 'heir' },
  ],
  timelocks: [{ type: 'absolute', value: 900000 }],
  logic: 'timelock',
  additionalGates: ['challenge'],
  challengeHash: 'SHA256_OF_PASSPHRASE',
};

const timelockChallengePolicy = generatePolicy(timelockChallengeConfig);
console.log('Policy:', timelockChallengePolicy);
console.log('Meaning: and(sha256(hash), or(pk(owner), and(pk(heir), after(900000))))');
console.log('         ^^ Challenge required for ALL spend paths');
console.log();

// ============================================
// 3. MULTISIG DECAY
// ============================================
console.log('--- 3. Multisig Decay ---');
console.log('2-of-3 initially, 1-of-2 heirs after timelock\n');

const decayConfig: MultisigDecayConfig = {
  initialThreshold: 2,
  initialTotal: 3,
  decayedThreshold: 1,
  decayedTotal: 2,
  decayAfterBlocks: 900000,
};

const multisigDecayConfig: VaultScriptConfig = {
  keys: [
    { id: '1', label: 'Owner', publicKey: 'OWNER', keyType: 'owner' },
    { id: '2', label: 'Heir1', publicKey: 'HEIR1', keyType: 'heir' },
    { id: '3', label: 'Heir2', publicKey: 'HEIR2', keyType: 'heir' },
  ],
  timelocks: [{ type: 'absolute', value: 900000 }],
  logic: 'multisig_decay',
  additionalGates: [],
  decayConfig,
};

const multisigDecayPolicy = generatePolicy(multisigDecayConfig);
console.log('Policy:', multisigDecayPolicy);
console.log('Before decay: 2-of-3 (any combination of owner + heirs)');
console.log('After decay:  1-of-2 (heirs only, owner excluded)');
console.log();

// ============================================
// 4. DEAD MAN'S SWITCH
// ============================================
console.log('--- 4. Dead Man\'s Switch ---');
console.log('Owner refreshes by spending to self, heir claims after inactivity\n');

const dmsConfig: VaultScriptConfig = {
  keys: [
    { id: '1', label: 'Owner', publicKey: 'OWNER', keyType: 'owner' },
    { id: '2', label: 'Heir', publicKey: 'HEIR', keyType: 'heir' },
  ],
  timelocks: [{ type: 'relative', value: 12960 }], // ~90 days
  logic: 'dead_man_switch',
  additionalGates: [],
};

const dmsPolicy = generatePolicy(dmsConfig);
console.log('Policy:', dmsPolicy);
console.log('Uses: older() for relative timelock (OP_CHECKSEQUENCEVERIFY)');
console.log('Timer resets each time owner spends');
console.log();

// ============================================
// 5. MULTISIG DECAY + CHALLENGE + DURESS (Full Hybrid)
// ============================================
console.log('--- 5. Full Hybrid: Decay + Challenge + Duress ---');
console.log('Multiple security layers combined\n');

const fullHybridConfig: VaultScriptConfig = {
  keys: [
    { id: '1', label: 'Owner', publicKey: 'OWNER', keyType: 'owner' },
    { id: '2', label: 'Heir1', publicKey: 'HEIR1', keyType: 'heir' },
    { id: '3', label: 'Heir2', publicKey: 'HEIR2', keyType: 'heir' },
    { id: '4', label: 'Duress', publicKey: 'DURESS', keyType: 'backup' },
  ],
  timelocks: [{ type: 'absolute', value: 900000 }],
  logic: 'multisig_decay',
  additionalGates: ['challenge', 'duress'],
  challengeHash: 'SHA256_HASH',
  decayConfig,
  duressConfig: {
    duressKeyIndex: 3,
    burnAddress: 'bc1qburn...',
  },
};

const fullHybridPolicy = generatePolicy(fullHybridConfig);
console.log('Policy:', fullHybridPolicy);
console.log();
console.log('Layers:');
console.log('  1. Challenge: SHA256 preimage required');
console.log('  2. Decay: 2-of-3 -> 1-of-2 after timelock');
console.log('  3. Duress: Alternative path that burns funds');
console.log();

// ============================================
// 6. STAGGERED RELEASE
// ============================================
console.log('--- 6. Staggered Release ---');
console.log('Funds released in stages over time\n');

const staggeredConfig: VaultScriptConfig = {
  keys: [
    { id: '1', label: 'Owner', publicKey: 'OWNER', keyType: 'owner' },
    { id: '2', label: 'Heir', publicKey: 'HEIR', keyType: 'heir' },
  ],
  timelocks: [{ type: 'absolute', value: 900000 }],
  logic: 'timelock',
  additionalGates: [],
  staggeredConfig: {
    stages: [
      { percent: 25, blocksAfterTrigger: 0 },        // 25% at unlock
      { percent: 25, blocksAfterTrigger: 26280 },    // 25% after ~6 months
      { percent: 50, blocksAfterTrigger: 52560 },    // 50% after ~1 year
    ],
  },
};

const staggeredPolicies = generateStaggeredPolicies(staggeredConfig);
console.log('Generates separate UTXOs with different timelocks:');
staggeredPolicies.forEach(p => {
  console.log(`  Stage ${p.stage}: ${p.percent}% - Block ${900000 + (p.stage > 0 ? staggeredConfig.staggeredConfig!.stages[p.stage].blocksAfterTrigger : 0)}`);
});
console.log();

// ============================================
// 7. PRESET BUNDLES
// ============================================
console.log('--- 7. Preset Bundles ---\n');

for (const bundle of PRESET_BUNDLES) {
  console.log(`${bundle.name}: "${bundle.tagline}"`);
  console.log(`  Infrastructure: ${bundle.config.infrastructure.join(', ')}`);
  console.log(`  Logic: ${bundle.config.primaryLogic}`);
  if (bundle.config.additionalGates.length > 0) {
    console.log(`  Gates: ${bundle.config.additionalGates.join(', ')}`);
  }
  if (bundle.config.modifiers.length > 0) {
    console.log(`  Modifiers: ${bundle.config.modifiers.join(', ')}`);
  }

  const validation = validateConfiguration(bundle.config);
  console.log(`  Valid: ${validation.valid}`);
  console.log();
}

// ============================================
// 8. MINISCRIPT COMPILATION TEST
// ============================================
console.log('--- 8. Miniscript Compilation ---\n');

const testPolicies = [
  { name: 'Simple timelock', policy: 'or(pk(A),and(pk(B),after(900000)))' },
  { name: 'With challenge', policy: 'and(sha256(H),or(pk(A),and(pk(B),after(900000))))' },
  { name: 'Dead man switch', policy: 'or(pk(A),and(pk(B),older(12960)))' },
];

for (const { name, policy } of testPolicies) {
  const result = compileToMiniscript(policy);
  console.log(`${name}:`);
  console.log(`  Policy: ${policy}`);
  console.log(`  Compiles: ${result.isValid}`);
  if (result.miniscript) {
    console.log(`  Miniscript: ${result.miniscript.slice(0, 60)}${result.miniscript.length > 60 ? '...' : ''}`);
  }
  console.log();
}

// ============================================
// SUMMARY
// ============================================
console.log('=== Summary: How Conditions Combine ===\n');
console.log('Base Logic (pick one):');
console.log('  - timelock: or(pk(owner), and(pk(heir), after(N)))');
console.log('  - dead_man_switch: or(pk(owner), and(pk(heir), older(N)))');
console.log('  - multisig_decay: or(thresh(2,...), and(thresh(1,...), after(N)))');
console.log();
console.log('Additional Gates (wrap around base):');
console.log('  - challenge: and(sha256(H), <base>)');
console.log('  - oracle: Adds oracle co-sign to heir path');
console.log('  - duress: or(<base>, pk(duress_key))');
console.log();
console.log('Modifiers (affect UTXO structure):');
console.log('  - staggered: Multiple UTXOs with progressive timelocks');
console.log('  - multi_beneficiary: Different conditions per beneficiary');
console.log('  - decoy: Hidden real vault behind decoy');
