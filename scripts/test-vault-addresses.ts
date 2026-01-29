/**
 * Test script to verify vault address generation
 *
 * Run with: npm run test:addresses
 *
 * Tests:
 * 1. Mainnet timelock address generation
 * 2. Testnet timelock address generation
 * 3. Signet address generation
 * 4. Policy generation
 * 5. Miniscript compilation
 * 6. Address validation
 */

import { generateTimelockAddress, validateAddress, getAddressType } from '../src/vault/scripts/bitcoin-address';
import { generatePolicy, compileToMiniscript, analyzePolicy } from '../src/vault/scripts/miniscript';
import { generateVaultAddressFromConfig, canGenerateAddress } from '../src/vault/scripts/vault-address-generator';
import type { NetworkType } from '../src/types/settings';

// Test vectors - using valid compressed public keys (33 bytes hex = 66 chars)
// These are example public keys for testing only
const TEST_OWNER_PUBKEY = '02' + '1'.repeat(64).slice(0, 64); // Valid compressed pubkey format
const TEST_HEIR_PUBKEY = '03' + '2'.repeat(64).slice(0, 64);  // Valid compressed pubkey format
const TEST_LOCKTIME = 900000; // Future block height

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logResult(test: string, passed: boolean, details?: string) {
  const status = passed ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
  console.log(`  [${status}] ${test}`);
  if (details) {
    console.log(`         ${colors.blue}${details}${colors.reset}`);
  }
}

async function runTests() {
  log('\n=== SatsLegacy Address Generation Tests ===\n', 'bold');
  let passCount = 0;
  let failCount = 0;

  // Test 1: Mainnet timelock address
  log('Test 1: Mainnet Timelock Address', 'yellow');
  try {
    const mainnetResult = generateTimelockAddress(
      TEST_OWNER_PUBKEY,
      TEST_HEIR_PUBKEY,
      TEST_LOCKTIME,
      'mainnet'
    );
    const startsCorrectly = mainnetResult.address.startsWith('bc1q');
    logResult('Address starts with bc1q', startsCorrectly, mainnetResult.address);
    startsCorrectly ? passCount++ : failCount++;

    const hasWitnessScript = mainnetResult.witnessScript.length > 0;
    logResult('Has witness script', hasWitnessScript);
    hasWitnessScript ? passCount++ : failCount++;
  } catch (e) {
    logResult('Mainnet address generation', false, String(e));
    failCount++;
  }

  // Test 2: Testnet timelock address
  log('\nTest 2: Testnet Timelock Address', 'yellow');
  try {
    const testnetResult = generateTimelockAddress(
      TEST_OWNER_PUBKEY,
      TEST_HEIR_PUBKEY,
      TEST_LOCKTIME,
      'testnet'
    );
    const startsCorrectly = testnetResult.address.startsWith('tb1q');
    logResult('Address starts with tb1q', startsCorrectly, testnetResult.address);
    startsCorrectly ? passCount++ : failCount++;
  } catch (e) {
    logResult('Testnet address generation', false, String(e));
    failCount++;
  }

  // Test 3: Signet address
  log('\nTest 3: Signet Address', 'yellow');
  try {
    const signetResult = generateTimelockAddress(
      TEST_OWNER_PUBKEY,
      TEST_HEIR_PUBKEY,
      TEST_LOCKTIME,
      'signet'
    );
    // Signet uses testnet address format (tb1)
    const startsCorrectly = signetResult.address.startsWith('tb1q');
    logResult('Address starts with tb1q (signet uses testnet format)', startsCorrectly, signetResult.address);
    startsCorrectly ? passCount++ : failCount++;
  } catch (e) {
    logResult('Signet address generation', false, String(e));
    failCount++;
  }

  // Test 4: Policy generation
  log('\nTest 4: Policy Generation', 'yellow');
  try {
    const policy = generatePolicy({
      keys: [
        { id: '1', label: 'Owner', publicKey: TEST_OWNER_PUBKEY, keyType: 'owner' },
        { id: '2', label: 'Heir', publicKey: TEST_HEIR_PUBKEY, keyType: 'heir' }
      ],
      timelocks: [{ type: 'absolute', value: TEST_LOCKTIME }],
      logic: 'timelock',
      additionalGates: []
    });
    const hasPolicy = policy.length > 0 && policy.includes('or(') && policy.includes('pk(');
    logResult('Policy generated', hasPolicy, policy.substring(0, 80) + '...');
    hasPolicy ? passCount++ : failCount++;
  } catch (e) {
    logResult('Policy generation', false, String(e));
    failCount++;
  }

  // Test 5: Miniscript compilation
  // Note: @bitcoinerlab/miniscript expects key aliases (A, B, owner, heir) not raw hex pubkeys
  // The policy with raw keys is used for documentation; actual scripts use bitcoinjs-lib
  log('\nTest 5: Miniscript Compilation (with key aliases)', 'yellow');
  try {
    // Use key aliases as expected by the miniscript library
    const simplePolicy = `or(pk(owner),and(pk(heir),after(${TEST_LOCKTIME})))`;
    const { miniscript, isValid, asm } = compileToMiniscript(simplePolicy);

    logResult('Miniscript compiled', miniscript.length > 0 || asm.length > 0);
    logResult('Compilation valid', isValid, `isValid=${isValid}`);
    if (miniscript) {
      logResult('Miniscript output', true, miniscript.substring(0, 60) + '...');
    }
    isValid ? passCount++ : failCount++;
  } catch (e) {
    logResult('Miniscript compilation', false, String(e));
    failCount++;
  }

  // Test 6: Address validation
  log('\nTest 6: Address Validation', 'yellow');
  try {
    const mainnetResult = generateTimelockAddress(TEST_OWNER_PUBKEY, TEST_HEIR_PUBKEY, TEST_LOCKTIME, 'mainnet');
    const testnetResult = generateTimelockAddress(TEST_OWNER_PUBKEY, TEST_HEIR_PUBKEY, TEST_LOCKTIME, 'testnet');

    const mainnetValid = validateAddress(mainnetResult.address, 'mainnet');
    logResult('Mainnet address validates on mainnet', mainnetValid);
    mainnetValid ? passCount++ : failCount++;

    const testnetValid = validateAddress(testnetResult.address, 'testnet');
    logResult('Testnet address validates on testnet', testnetValid);
    testnetValid ? passCount++ : failCount++;

    const crossValid = validateAddress(testnetResult.address, 'mainnet');
    logResult('Testnet address rejected on mainnet', !crossValid);
    !crossValid ? passCount++ : failCount++;
  } catch (e) {
    logResult('Address validation', false, String(e));
    failCount++;
  }

  // Test 7: Vault address generator
  log('\nTest 7: Vault Address Generator', 'yellow');
  try {
    const vaultConfig = {
      logic: { primary: 'timelock' as const },
      ownerPubkey: TEST_OWNER_PUBKEY,
      beneficiaries: [{ name: 'Heir 1', pubkey: TEST_HEIR_PUBKEY, percentage: 100 }],
      inactivityTrigger: 365
    };

    const result = generateVaultAddressFromConfig(vaultConfig, 'testnet');
    logResult('Vault address generated', result.address.length > 0, result.address);
    result.address.length > 0 ? passCount++ : failCount++;

    logResult('Has policy', result.policy.length > 0);
    result.policy.length > 0 ? passCount++ : failCount++;

    logResult('Has redeem info', result.redeemInfo.spendPaths.length > 0);
    result.redeemInfo.spendPaths.length > 0 ? passCount++ : failCount++;
  } catch (e) {
    logResult('Vault address generator', false, String(e));
    failCount++;
  }

  // Test 8: canGenerateAddress helper
  log('\nTest 8: canGenerateAddress Helper', 'yellow');
  try {
    const canGen1 = canGenerateAddress({ ownerPubkey: TEST_OWNER_PUBKEY, beneficiaries: [{ name: 'A', pubkey: TEST_HEIR_PUBKEY, percentage: 100 }] });
    logResult('Returns true with valid config', canGen1);
    canGen1 ? passCount++ : failCount++;

    const canGen2 = canGenerateAddress({ ownerPubkey: TEST_OWNER_PUBKEY, beneficiaries: [] });
    logResult('Returns false without beneficiaries', !canGen2);
    !canGen2 ? passCount++ : failCount++;

    const canGen3 = canGenerateAddress({ beneficiaries: [{ name: 'A', pubkey: TEST_HEIR_PUBKEY, percentage: 100 }] });
    logResult('Returns false without owner key', !canGen3);
    !canGen3 ? passCount++ : failCount++;
  } catch (e) {
    logResult('canGenerateAddress helper', false, String(e));
    failCount++;
  }

  // Test 9: Address type detection
  log('\nTest 9: Address Type Detection', 'yellow');
  try {
    const mainnetResult = generateTimelockAddress(TEST_OWNER_PUBKEY, TEST_HEIR_PUBKEY, TEST_LOCKTIME, 'mainnet');
    const addressType = getAddressType(mainnetResult.address);
    const isP2WSH = addressType.includes('P2WSH') || addressType.includes('Native SegWit Script');
    logResult('Detects P2WSH address type', isP2WSH, addressType);
    isP2WSH ? passCount++ : failCount++;
  } catch (e) {
    logResult('Address type detection', false, String(e));
    failCount++;
  }

  // Test 10: Policy analysis
  log('\nTest 10: Policy Analysis', 'yellow');
  try {
    const policy = `or(pk(${TEST_OWNER_PUBKEY}),and(pk(${TEST_HEIR_PUBKEY}),after(${TEST_LOCKTIME})))`;
    const analysis = analyzePolicy(policy);

    logResult('Detects timelock type', analysis.type === 'timelock', `type=${analysis.type}`);
    analysis.type === 'timelock' ? passCount++ : failCount++;

    logResult('Extracts keys', analysis.keys.length === 2, `keys=${analysis.keys.length}`);
    analysis.keys.length === 2 ? passCount++ : failCount++;

    logResult('Extracts timelocks', analysis.timelocks.length === 1, `timelocks=${analysis.timelocks.length}`);
    analysis.timelocks.length === 1 ? passCount++ : failCount++;
  } catch (e) {
    logResult('Policy analysis', false, String(e));
    failCount++;
  }

  // Summary
  log('\n=== Test Summary ===', 'bold');
  log(`Passed: ${passCount}`, 'green');
  log(`Failed: ${failCount}`, failCount > 0 ? 'red' : 'green');
  log(`Total:  ${passCount + failCount}\n`, 'blue');

  // Exit with error code if any tests failed
  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
