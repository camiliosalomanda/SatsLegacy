/**
 * Unified Vault Address Generator
 *
 * Combines vault configuration, Miniscript compilation, and address generation
 * into a single workflow for generating P2WSH inheritance vault addresses.
 */

import type { NetworkType } from '../../types/settings';
import type { Vault, Beneficiary } from '../../types/vault';
import { generatePolicy, generatePolicyV2, compileToMiniscript, extractRedeemInfo, type VaultScriptConfig, type VaultScriptConfigV2, type RedeemInfo } from './miniscript';
import { generateTimelockAddress, generateDeadManSwitchAddress, generateMultisigDecayAddress, generateAddressFromPolicy, generateBusinessVaultScript, validateAddress, estimateCurrentBlockHeight, normalizePublicKey, type VaultRedeemInfo, type PolicyAddressResult } from './bitcoin-address';
import type { MultisigDecayConfig } from './types';
import type { VaultProfile, KeyRole } from '../../vault/creation/validation/compatibility';

export interface VaultAddressResult {
  address: string;
  witnessScript: string;
  policy: string;
  miniscript: string;
  redeemInfo: RedeemInfo;
  network: NetworkType;
  isValid: boolean;
  error?: string;
}

export interface VaultAddressConfig {
  logic: {
    primary: 'timelock' | 'dead_man_switch' | 'multisig_decay';
    gates?: string[];
  };
  ownerPubkey?: string;
  beneficiaries?: Beneficiary[];
  lockDate?: string;  // ISO date string for unlock date
  inactivityTrigger?: number; // Days until unlock
}

/**
 * Calculate lock block height from lock date or days
 *
 * Uses ~144 blocks per day estimate. In production, this could
 * fetch the current block height from an API for more accuracy.
 */
function calculateLockBlocks(config: VaultAddressConfig): number {
  // ~144 blocks per day on Bitcoin
  const blocksPerDay = 144;

  const estimatedCurrentHeight = estimateCurrentBlockHeight();

  // If lockDate is provided, calculate blocks from that
  if (config.lockDate) {
    const lockDate = new Date(config.lockDate);
    const now = new Date();
    const daysUntilLock = Math.ceil((lockDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    if (daysUntilLock > 0) {
      return estimatedCurrentHeight + (daysUntilLock * blocksPerDay);
    }
  }

  // Fall back to inactivity trigger (days)
  const days = config.inactivityTrigger || 365;
  return estimatedCurrentHeight + (days * blocksPerDay);
}

/**
 * Build VaultScriptConfig from vault configuration
 */
function buildScriptConfig(config: VaultAddressConfig): VaultScriptConfig {
  const keys = [];

  // Add owner key
  if (config.ownerPubkey) {
    keys.push({
      id: 'owner',
      label: 'Owner',
      publicKey: config.ownerPubkey,
      keyType: 'owner' as const
    });
  }

  // Add beneficiary keys
  if (config.beneficiaries) {
    config.beneficiaries.forEach((b, i) => {
      if (b.pubkey) {
        keys.push({
          id: `heir-${i}`,
          label: b.name || `Heir ${i + 1}`,
          publicKey: b.pubkey,
          keyType: 'heir' as const
        });
      }
    });
  }

  const lockBlocks = calculateLockBlocks(config);

  // Build decay config for multisig_decay so generatePolicy has what it needs
  const heirKeys = keys.filter(k => k.keyType === 'heir');
  let decayConfig: MultisigDecayConfig | undefined;
  if (config.logic.primary === 'multisig_decay' && heirKeys.length > 0) {
    decayConfig = {
      initialThreshold: 2,
      initialTotal: Math.min(3, 1 + heirKeys.length),
      decayedThreshold: 1,
      decayedTotal: Math.min(2, heirKeys.length),
      decayAfterBlocks: lockBlocks,
    };
  }

  return {
    keys,
    timelocks: [{
      type: config.logic.primary === 'dead_man_switch' ? 'relative' : 'absolute',
      value: lockBlocks,
      estimatedDate: new Date(Date.now() + (config.inactivityTrigger || 365) * 24 * 60 * 60 * 1000)
    }],
    logic: config.logic.primary,
    additionalGates: config.logic.gates || [],
    decayConfig,
  };
}

/**
 * Generate a vault address from configuration
 *
 * This function:
 * 1. Takes vault config + network
 * 2. Generates Miniscript policy
 * 3. Compiles to Bitcoin Script
 * 4. Generates P2WSH address
 * 5. Returns address + witnessScript + redeemInfo
 */
export function generateVaultAddressFromConfig(
  config: VaultAddressConfig,
  network: NetworkType = 'mainnet'
): VaultAddressResult {
  // Validate required keys
  if (!config.ownerPubkey) {
    return {
      address: '',
      witnessScript: '',
      policy: '',
      miniscript: '',
      redeemInfo: {
        requiredKeys: [],
        requiredTimelocks: [],
        requiredChallenge: false,
        spendPaths: []
      },
      network,
      isValid: false,
      error: 'Owner public key is required'
    };
  }

  const heirPubkeys = config.beneficiaries?.filter(b => b.pubkey).map(b => b.pubkey!) || [];
  if (heirPubkeys.length === 0) {
    return {
      address: '',
      witnessScript: '',
      policy: '',
      miniscript: '',
      redeemInfo: {
        requiredKeys: [],
        requiredTimelocks: [],
        requiredChallenge: false,
        spendPaths: []
      },
      network,
      isValid: false,
      error: 'At least one beneficiary with public key is required'
    };
  }

  try {
    // Build script configuration
    const scriptConfig = buildScriptConfig(config);

    // Generate policy string
    const policy = generatePolicy(scriptConfig);

    // Compile policy to miniscript
    const miniscriptResult = compileToMiniscript(policy);

    // For now, use the direct bitcoin script generation
    // (The miniscript library gives us ASM, but we still need to use
    // bitcoinjs-lib for address generation from our custom scripts)
    // Reuse lockBlocks from scriptConfig to avoid non-deterministic re-computation
    const lockBlocks = scriptConfig.timelocks[0]?.value || calculateLockBlocks(config);

    let addressResult: { address: string; witnessScript: string; redeemInfo: VaultRedeemInfo };

    switch (config.logic.primary) {
      case 'timelock':
        addressResult = generateTimelockAddress(
          config.ownerPubkey,
          heirPubkeys[0],
          lockBlocks,
          network
        );
        break;

      case 'dead_man_switch': {
        // Dead man's switch uses relative timelock (CSV), not absolute (CLTV)
        // Convert days to blocks for the inactivity period
        const inactivityBlocks = (config.inactivityTrigger || 90) * 144;
        const dmsResult = generateDeadManSwitchAddress(
          config.ownerPubkey,
          heirPubkeys[0],
          inactivityBlocks,
          network
        );
        addressResult = {
          address: dmsResult.address,
          witnessScript: dmsResult.witnessScript,
          redeemInfo: dmsResult.redeemInfo
        };
        break;
      }

      case 'multisig_decay': {
        // Build decay config: 2-of-3 initially, 1-of-2 heirs after lockBlocks
        // Mirrors the default config in bitcoin-address.ts generateVaultAddress()
        const decayConfig: MultisigDecayConfig = {
          initialThreshold: 2,
          initialTotal: Math.min(3, 1 + heirPubkeys.length), // owner + up to 2 heirs
          decayedThreshold: 1,
          decayedTotal: Math.min(2, heirPubkeys.length),
          decayAfterBlocks: lockBlocks,
        };
        const decayResult = generateMultisigDecayAddress(
          config.ownerPubkey,
          heirPubkeys,
          decayConfig,
          network
        );
        addressResult = {
          address: decayResult.address,
          witnessScript: decayResult.witnessScript,
          redeemInfo: decayResult.redeemInfo,
        };
        break;
      }

      default:
        addressResult = generateTimelockAddress(
          config.ownerPubkey,
          heirPubkeys[0],
          lockBlocks,
          network
        );
    }

    // Extract redeem info from policy
    const redeemInfo = extractRedeemInfo(policy, scriptConfig);

    // Validate the generated address
    const isAddressValid = validateAddress(addressResult.address, network);

    return {
      address: addressResult.address,
      witnessScript: addressResult.witnessScript,
      policy,
      miniscript: miniscriptResult.miniscript,
      redeemInfo,
      network,
      isValid: isAddressValid
    };
  } catch (error) {
    console.error('Address generation failed:', error);
    return {
      address: '',
      witnessScript: '',
      policy: '',
      miniscript: '',
      redeemInfo: {
        requiredKeys: [],
        requiredTimelocks: [],
        requiredChallenge: false,
        spendPaths: []
      },
      network,
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate address for an existing vault
 */
export function generateAddressForVault(
  vault: Vault,
  network: NetworkType = 'mainnet'
): VaultAddressResult {
  return generateVaultAddressFromConfig({
    logic: vault.logic || { primary: 'timelock' },
    ownerPubkey: vault.ownerPubkey,
    beneficiaries: vault.beneficiaries,
    lockDate: vault.lockDate,
    inactivityTrigger: vault.inactivityTrigger
  }, network);
}

/**
 * Check if a vault has sufficient configuration to generate an address
 */
export function canGenerateAddress(vault: Partial<Vault>): boolean {
  if (!vault.ownerPubkey) return false;
  if (!vault.beneficiaries || vault.beneficiaries.length === 0) return false;
  if (!vault.beneficiaries.some(b => b.pubkey)) return false;
  return true;
}

/**
 * Get address prefix for a network
 */
export function getAddressPrefix(network: NetworkType): string {
  switch (network) {
    case 'mainnet':
      return 'bc1';
    case 'testnet':
    case 'signet':
      return 'tb1';
    default:
      return 'bc1';
  }
}

// ============================================
// V2 PROFILE-BASED ADDRESS GENERATION
// ============================================

export interface VaultAddressConfigV2 {
  profile: VaultProfile
  keys: Record<KeyRole, string | undefined>  // role → pubkey (hex or xpub)
  heirKeys?: string[]                         // For family vault (multiple heirs)
  gates?: ('challenge' | 'oracle')[]
  challengeHash?: string
  timelockOverrides?: Record<string, number>  // role → blocks override
}

/**
 * Generate a vault address from a V2 profile-based config.
 *
 * For profiles that compile to sane miniscript (solo, spouse, family, DMS):
 *   policy → miniscript → witness script → P2WSH
 *
 * For business vault (key reuse):
 *   Direct Bitcoin Script construction → P2WSH
 */
export function generateVaultAddressV2(
  config: VaultAddressConfigV2,
  network: NetworkType = 'mainnet'
): VaultAddressResult {
  const emptyResult: VaultAddressResult = {
    address: '',
    witnessScript: '',
    policy: '',
    miniscript: '',
    redeemInfo: { requiredKeys: [], requiredTimelocks: [], requiredChallenge: false, spendPaths: [] },
    network,
    isValid: false,
  }

  try {
    // Normalize all keys
    const normalize = (k: string | undefined): string | undefined => {
      if (!k) return undefined
      try { return normalizePublicKey(k) } catch { return undefined }
    }

    const ownerKey = normalize(config.keys.owner)
    if (!ownerKey) return { ...emptyResult, error: 'Owner public key is required' }

    // Special case: business vault uses direct script construction
    if (config.profile === 'business_vault') {
      const partnerKey = normalize(config.keys.partner)
      const trusteeKey = normalize(config.keys.trustee)
      if (!partnerKey) return { ...emptyResult, error: 'Partner key is required for Business Vault' }
      if (!trusteeKey) return { ...emptyResult, error: 'Trustee key is required for Business Vault' }

      const ownerSoloBlocks = config.timelockOverrides?.owner_solo ?? 4320
      const trusteeBlocks = config.timelockOverrides?.trustee ?? 52560

      const result = generateBusinessVaultScript(
        ownerKey, partnerKey, trusteeKey,
        ownerSoloBlocks, trusteeBlocks, network
      )

      const policy = `or(and(pk(${ownerKey}),pk(${partnerKey})),or(and(pk(${ownerKey}),older(${ownerSoloBlocks})),and(pk(${trusteeKey}),older(${trusteeBlocks}))))`

      return {
        address: result.address,
        witnessScript: result.witnessScript,
        policy,
        miniscript: '(direct script — key reuse prevents sane miniscript)',
        redeemInfo: {
          requiredKeys: [ownerKey, partnerKey, trusteeKey],
          requiredTimelocks: [
            { type: 'relative', value: ownerSoloBlocks },
            { type: 'relative', value: trusteeBlocks },
          ],
          requiredChallenge: config.gates?.includes('challenge') ?? false,
          spendPaths: result.redeemInfo.spendPaths,
        },
        network,
        isValid: true,
      }
    }

    // Build V2 script config for miniscript-based profiles
    const keys: VaultScriptConfigV2['keys'] = []
    keys.push({ id: 'owner', label: 'Owner', publicKey: ownerKey, keyType: 'owner' })

    // Add profile-specific keys
    switch (config.profile) {
      case 'solo_vault': {
        const recoveryKey = normalize(config.keys.recovery)
        if (!recoveryKey) return { ...emptyResult, error: 'Recovery key is required' }
        keys.push({ id: 'recovery', label: 'Recovery', publicKey: recoveryKey, keyType: 'recovery' })
        break
      }
      case 'spouse_plan': {
        const spouseKey = normalize(config.keys.spouse)
        const heirKey = normalize(config.keys.heir)
        if (!spouseKey) return { ...emptyResult, error: 'Spouse key is required' }
        if (!heirKey) return { ...emptyResult, error: 'Heir key is required' }
        keys.push({ id: 'spouse', label: 'Spouse', publicKey: spouseKey, keyType: 'spouse' })
        keys.push({ id: 'heir', label: 'Heir', publicKey: heirKey, keyType: 'heir' })
        break
      }
      case 'family_vault': {
        const recoveryKey = normalize(config.keys.recovery)
        if (!recoveryKey) return { ...emptyResult, error: 'Recovery key is required' }
        keys.push({ id: 'recovery', label: 'Recovery', publicKey: recoveryKey, keyType: 'recovery' })
        const heirKeys = (config.heirKeys || []).map(k => normalize(k)).filter(Boolean) as string[]
        if (heirKeys.length < 2) return { ...emptyResult, error: 'At least 2 heir keys required' }
        heirKeys.forEach((k, i) => keys.push({
          id: `heir-${i}`, label: `Heir ${i + 1}`, publicKey: k, keyType: 'heir'
        }))
        break
      }
      case 'dead_mans_switch': {
        const heirKey = normalize(config.keys.heir)
        if (!heirKey) return { ...emptyResult, error: 'Heir key is required' }
        keys.push({ id: 'heir', label: 'Heir', publicKey: heirKey, keyType: 'heir' })
        break
      }
    }

    // Build timelocks based on profile defaults + overrides
    const timelocks: VaultScriptConfigV2['timelocks'] = []
    const defaults = getProfileTimelockDefaults(config.profile)
    for (const [role, defaultBlocks] of Object.entries(defaults)) {
      timelocks.push({
        type: 'relative',
        value: config.timelockOverrides?.[role] ?? defaultBlocks,
      })
    }

    // Generate policy
    const v2Config: VaultScriptConfigV2 = {
      keys,
      timelocks,
      profile: config.profile,
      gates: config.gates || [],
      challengeHash: config.challengeHash,
    }
    const policy = generatePolicyV2(v2Config)

    // Compile to address
    const addressResult = generateAddressFromPolicy(policy, network)

    if (!addressResult.isValid) {
      return { ...emptyResult, policy, error: addressResult.error }
    }

    return {
      address: addressResult.address,
      witnessScript: addressResult.witnessScript,
      policy,
      miniscript: addressResult.miniscript,
      redeemInfo: {
        requiredKeys: keys.map(k => k.publicKey),
        requiredTimelocks: timelocks,
        requiredChallenge: config.gates?.includes('challenge') ?? false,
        spendPaths: buildSpendPaths(config.profile, keys, timelocks),
      },
      network,
      isValid: true,
    }
  } catch (error) {
    return {
      ...emptyResult,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/** Get default timelock values for a profile (in blocks) */
function getProfileTimelockDefaults(profile: VaultProfile): Record<string, number> {
  switch (profile) {
    case 'solo_vault': return { recovery: 52560 }
    case 'spouse_plan': return { spouse: 4320, heir: 52560 }
    case 'family_vault': return { recovery: 4320, heir: 52560 }
    case 'business_vault': return { owner_solo: 4320, trustee: 52560 }
    case 'dead_mans_switch': return { heir: 26280 }
    default: return {}
  }
}

/** Build spend path descriptions for a profile */
function buildSpendPaths(
  profile: VaultProfile,
  keys: VaultScriptConfigV2['keys'],
  timelocks: VaultScriptConfigV2['timelocks']
): RedeemInfo['spendPaths'] {
  const paths: RedeemInfo['spendPaths'] = []
  const ownerKey = keys.find(k => k.keyType === 'owner')

  switch (profile) {
    case 'solo_vault':
      paths.push(
        { name: 'Owner', description: 'Owner can spend at any time', requirements: [`Key: ${ownerKey?.label}`] },
        { name: 'Recovery', description: `Recovery key can spend after ~${Math.round((timelocks[0]?.value ?? 52560) / 144)} days`, requirements: [`Key: Recovery`, `Timelock: ${timelocks[0]?.value} blocks`] }
      )
      break
    case 'spouse_plan':
      paths.push(
        { name: 'Owner', description: 'Owner can spend at any time', requirements: [`Key: ${ownerKey?.label}`] },
        { name: 'Spouse', description: `Spouse can spend after ~${Math.round((timelocks[0]?.value ?? 4320) / 144)} days`, requirements: ['Key: Spouse', `Timelock: ${timelocks[0]?.value} blocks`] },
        { name: 'Heir', description: `Heir can spend after ~${Math.round((timelocks[1]?.value ?? 52560) / 144)} days`, requirements: ['Key: Heir', `Timelock: ${timelocks[1]?.value} blocks`] }
      )
      break
    case 'family_vault':
      paths.push(
        { name: 'Owner', description: 'Owner can spend at any time', requirements: [`Key: ${ownerKey?.label}`] },
        { name: 'Recovery', description: `Recovery key after ~${Math.round((timelocks[0]?.value ?? 4320) / 144)} days`, requirements: ['Key: Recovery', `Timelock: ${timelocks[0]?.value} blocks`] },
        { name: 'Heir Threshold', description: `2-of-${keys.filter(k => k.keyType === 'heir').length} heirs after ~${Math.round((timelocks[1]?.value ?? 52560) / 144)} days`, requirements: ['Keys: 2-of-N heirs', `Timelock: ${timelocks[1]?.value} blocks`] }
      )
      break
    case 'dead_mans_switch':
      paths.push(
        { name: 'Owner (Check-in)', description: 'Owner can spend anytime — resets the timer', requirements: [`Key: ${ownerKey?.label}`] },
        { name: 'Heir (Claim)', description: `Heir can claim after ~${Math.round((timelocks[0]?.value ?? 26280) / 144)} days of inactivity`, requirements: ['Key: Heir', `Timelock: ${timelocks[0]?.value} blocks`] }
      )
      break
  }

  return paths
}

export default {
  generateVaultAddressFromConfig,
  generateVaultAddressV2,
  generateAddressForVault,
  canGenerateAddress,
  getAddressPrefix
};
