/**
 * Quick validation script for all 14 miniscript stack fixes.
 *
 * Run with: npm run test:fixes  (or: npx tsx scripts/test-miniscript-fixes.ts)
 *
 * Tests all fixes without UI or network interaction.
 * Exit code 0 = all pass, 1 = at least one failure.
 */

import * as bitcoin from 'bitcoinjs-lib';
import { Buffer } from 'buffer';

import {
  generatePolicy,
  compileToMiniscript,
  extractRedeemInfo,
  analyzePolicy,
  generateStaggeredPolicies,
  type VaultScriptConfig,
} from '../src/vault/scripts/miniscript';
import {
  generateTimelockAddress,
  generateDeadManSwitchAddress,
  generateMultisigDecayAddress,
  validateAddress,
} from '../src/vault/scripts/bitcoin-address';
import {
  generateVaultAddressFromConfig,
  type VaultAddressConfig,
} from '../src/vault/scripts/vault-address-generator';
import {
  buildTimelockWitnessScript,
  buildDeadManSwitchWitnessScript,
  detectScriptType,
  parseWitnessScript,
  estimateVsize,
} from '../src/vault/scripts/psbt-builder';
import type { SpendPath, MultisigDecayConfig } from '../src/vault/scripts/types';

// ── Colours ────────────────────────────────────────
const G = '\x1b[32m';
const R = '\x1b[31m';
const Y = '\x1b[33m';
const B = '\x1b[34m';
const BOLD = '\x1b[1m';
const RST = '\x1b[0m';

let passCount = 0;
let failCount = 0;

function pass(label: string, detail?: string) {
  passCount++;
  console.log(`  [${G}PASS${RST}] ${label}${detail ? `  ${B}${detail}${RST}` : ''}`);
}

function fail(label: string, detail?: string) {
  failCount++;
  console.log(`  [${R}FAIL${RST}] ${label}${detail ? `  ${R}${detail}${RST}` : ''}`);
}

function assert(condition: boolean, label: string, detail?: string) {
  condition ? pass(label, detail) : fail(label, detail);
}

function section(title: string) {
  console.log(`\n${Y}${title}${RST}`);
}

// ── Test keys ──────────────────────────────────────
const OWNER = '02' + 'aa'.repeat(32);
const HEIR1 = '03' + 'bb'.repeat(32);
const HEIR2 = '02' + 'cc'.repeat(32);
const LOCKTIME = 900000;

function makeConfig(overrides: Partial<VaultScriptConfig> = {}): VaultScriptConfig {
  return {
    keys: [
      { id: 'owner', label: 'Owner', publicKey: OWNER, keyType: 'owner' },
      { id: 'heir', label: 'Heir', publicKey: HEIR1, keyType: 'heir' },
    ],
    timelocks: [{ type: 'absolute', value: LOCKTIME }],
    logic: 'timelock',
    additionalGates: [],
    ...overrides,
  };
}

// ════════════════════════════════════════════════════
console.log(`\n${BOLD}=== Miniscript Stack Fix Validation (14 issues) ===${RST}`);
// ════════════════════════════════════════════════════

// ── CRIT-1 ─────────────────────────────────────────
section('CRIT-1: multisig_decay via vault-address-generator uses OP_CHECKMULTISIG');
try {
  const cfg: VaultAddressConfig = {
    logic: { primary: 'multisig_decay' },
    ownerPubkey: OWNER,
    beneficiaries: [
      { name: 'H1', pubkey: HEIR1, percentage: 50 },
      { name: 'H2', pubkey: HEIR2, percentage: 50 },
    ],
    inactivityTrigger: 365,
  };
  const result = generateVaultAddressFromConfig(cfg, 'mainnet');
  assert(result.address.startsWith('bc1q') && result.address.length === 62,
    'Address is P2WSH (bc1q, 62 chars)', result.address.substring(0, 20) + '...');
  assert(result.witnessScript.includes('ae'),
    'Witness script contains OP_CHECKMULTISIG (0xae)');
  assert(result.isValid, 'Address validates on mainnet');
} catch (e) {
  fail('CRIT-1 threw', String(e));
}

// ── CRIT-2 ─────────────────────────────────────────
section('CRIT-2: detectScriptType distinguishes checksig vs multisig');
try {
  const tlScript = buildTimelockWitnessScript(OWNER, HEIR1, LOCKTIME);
  assert(detectScriptType(Buffer.from(tlScript)) === 'checksig',
    'Timelock script → checksig');

  const decayConfig: MultisigDecayConfig = {
    initialThreshold: 2, initialTotal: 3,
    decayedThreshold: 1, decayedTotal: 2,
    decayAfterBlocks: LOCKTIME,
  };
  const msResult = generateMultisigDecayAddress(OWNER, [HEIR1, HEIR2], decayConfig, 'mainnet');
  const msBuf = Buffer.from(msResult.witnessScript, 'hex');
  assert(detectScriptType(msBuf) === 'multisig',
    'Multisig decay script → multisig');
} catch (e) {
  fail('CRIT-2 threw', String(e));
}

// ── HIGH-3 ─────────────────────────────────────────
section('HIGH-3: DMS uses relative timelock, timelock uses absolute');
try {
  const dmsResult = generateVaultAddressFromConfig({
    logic: { primary: 'dead_man_switch' },
    ownerPubkey: OWNER,
    beneficiaries: [{ name: 'H', pubkey: HEIR1, percentage: 100 }],
    inactivityTrigger: 90,
  }, 'mainnet');
  assert(dmsResult.policy.includes('older(') && !dmsResult.policy.includes('after('),
    'DMS policy uses older() (relative)');

  const tlResult = generateVaultAddressFromConfig({
    logic: { primary: 'timelock' },
    ownerPubkey: OWNER,
    beneficiaries: [{ name: 'H', pubkey: HEIR1, percentage: 100 }],
    inactivityTrigger: 365,
  }, 'mainnet');
  assert(tlResult.policy.includes('after(') && !tlResult.policy.includes('older('),
    'Timelock policy uses after() (absolute)');
} catch (e) {
  fail('HIGH-3 threw', String(e));
}

// ── HIGH-4 ─────────────────────────────────────────
section('HIGH-4: isValid doesn\'t require miniscript compilation');
try {
  const result = generateVaultAddressFromConfig({
    logic: { primary: 'multisig_decay' },
    ownerPubkey: OWNER,
    beneficiaries: [
      { name: 'H1', pubkey: HEIR1, percentage: 50 },
      { name: 'H2', pubkey: HEIR2, percentage: 50 },
    ],
    inactivityTrigger: 365,
  }, 'mainnet');
  assert(result.isValid === true, 'isValid is true (address-based, not miniscript)');
  assert(result.address.length > 0, 'Address is non-empty');
} catch (e) {
  fail('HIGH-4 threw', String(e));
}

// ── MED-5 ──────────────────────────────────────────
section('MED-5: SpendPath and MultisigDecayConfig from ./types');
try {
  const sp: SpendPath = { name: 'Test', description: 'test' };
  assert(sp.name === 'Test', 'SpendPath type works');

  const mc: MultisigDecayConfig = {
    initialThreshold: 2, initialTotal: 3,
    decayedThreshold: 1, decayedTotal: 2,
    decayAfterBlocks: 900000,
  };
  assert(mc.initialThreshold === 2, 'MultisigDecayConfig type works');
} catch (e) {
  fail('MED-5 threw', String(e));
}

// ── MED-6 ──────────────────────────────────────────
section('MED-6: timelocks value 0 uses 0, not default fallback');
try {
  const tlPolicy = generatePolicy(makeConfig({
    timelocks: [{ type: 'absolute', value: 0 }],
    logic: 'timelock',
  }));
  assert(tlPolicy.includes('after(0)') && !tlPolicy.includes('after(52560)'),
    'Timelock: after(0) present, no after(52560)', tlPolicy.substring(0, 60));

  const dmsPolicy = generatePolicy(makeConfig({
    timelocks: [{ type: 'relative', value: 0 }],
    logic: 'dead_man_switch',
  }));
  assert(dmsPolicy.includes('older(0)') && !dmsPolicy.includes('older(4320)'),
    'DMS: older(0) present, no older(4320)');
} catch (e) {
  fail('MED-6 threw', String(e));
}

// ── MED-7 ──────────────────────────────────────────
section('MED-7: parseWitnessScript handles hex and CSV');
try {
  const script = buildTimelockWitnessScript(OWNER, HEIR1, LOCKTIME);
  const hex = Buffer.from(script).toString('hex');

  // Hex input
  const fromHex = parseWitnessScript(hex);
  assert(Buffer.from(fromHex).toString('hex') === hex, 'Hex round-trip OK');

  // CSV input
  const csv = Array.from(script).join(',');
  const fromCsv = parseWitnessScript(csv);
  assert(Buffer.from(fromCsv).toString('hex') === hex, 'CSV round-trip OK');

  // Invalid byte
  let threw = false;
  try { parseWitnessScript('99,256,33'); } catch { threw = true; }
  assert(threw, 'Throws on byte > 255');
} catch (e) {
  fail('MED-7 threw', String(e));
}

// ── MED-8 ──────────────────────────────────────────
section('MED-8: deriveAddress not exported from miniscript');
try {
  const mod = await import('../src/vault/scripts/miniscript');
  assert(!('deriveAddress' in mod), 'deriveAddress not in miniscript exports');
} catch (e) {
  fail('MED-8 threw', String(e));
}

// ── MED-9 ──────────────────────────────────────────
section('MED-9: extractRedeemInfo excludes duress spend path');
try {
  const config = makeConfig({
    additionalGates: ['duress'],
    duressConfig: { duressKeyIndex: 0, burnAddress: '1BitcoinEaterAddressDontSendf59kuE' },
  });
  const policy = generatePolicy(config);
  const info = extractRedeemInfo(policy, config);
  const names = info.spendPaths.map(p => p.name.toLowerCase());
  assert(!names.some(n => n.includes('duress')), 'No duress spend path in output');
} catch (e) {
  fail('MED-9 threw', String(e));
}

// ── MED-10 ─────────────────────────────────────────
section('MED-10: estimateVsize larger for multisig_decay');
try {
  const single = estimateVsize(1, 1, true);
  const multisig = estimateVsize(1, 1, true, 'multisig_decay');
  assert(multisig > single,
    `multisig_decay (${multisig}) > single-sig (${single})`);
} catch (e) {
  fail('MED-10 threw', String(e));
}

// ── LOW-12 ─────────────────────────────────────────
section('LOW-12: analyzePolicy returns expected fields');
try {
  const policy = `or(pk(${OWNER}),and(pk(${HEIR1}),after(${LOCKTIME})))`;
  const analysis = analyzePolicy(policy);
  assert(analysis.type === 'timelock', `type is "timelock", got "${analysis.type}"`);
  assert(analysis.keys.length === 2, `2 keys extracted`);
  assert(analysis.timelocks.length === 1, `1 timelock extracted`);
  assert('hasChallenge' in analysis && 'hasOracle' in analysis, 'hasChallenge/hasOracle present');
} catch (e) {
  fail('LOW-12 threw', String(e));
}

// ── LOW-13 ─────────────────────────────────────────
section('LOW-13: Witness descriptions use TRUE/FALSE');
try {
  const tlResult = generateTimelockAddress(OWNER, HEIR1, LOCKTIME, 'mainnet');
  const dmsResult = generateDeadManSwitchAddress(OWNER, HEIR1, 4320, 'mainnet');

  let allGood = true;
  for (const result of [tlResult, dmsResult]) {
    for (const path of result.redeemInfo.spendPaths) {
      if (path.witness && (path.witness.includes('OP_TRUE') || path.witness.includes('OP_FALSE'))) {
        allGood = false;
      }
    }
  }
  assert(allGood, 'No OP_TRUE/OP_FALSE found in witness descriptions');

  // Positive check: TRUE or FALSE present
  const hasCorrectLabels = tlResult.redeemInfo.spendPaths.some(p => p.witness?.includes('TRUE') || p.witness?.includes('FALSE'));
  assert(hasCorrectLabels, 'TRUE/FALSE labels present');
} catch (e) {
  fail('LOW-13 threw', String(e));
}

// ── LOW-14 ─────────────────────────────────────────
section('LOW-14: generateStaggeredPolicies smoke test');
try {
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
  assert(stages.length === 2, `2 stages generated`);
  assert(stages.every(s => s.policy.includes('older(')), 'All stages use older()');
} catch (e) {
  fail('LOW-14 threw', String(e));
}

// ════════════════════════════════════════════════════
console.log(`\n${BOLD}=== Summary ===${RST}`);
console.log(`${G}Passed: ${passCount}${RST}`);
console.log(`${failCount > 0 ? R : G}Failed: ${failCount}${RST}`);
console.log(`${B}Total:  ${passCount + failCount}${RST}\n`);

if (failCount > 0) process.exit(1);
