/**
 * Unified Vault Address Generator
 *
 * Combines vault configuration, Miniscript compilation, and address generation
 * into a single workflow for generating P2WSH inheritance vault addresses.
 */

import type { NetworkType } from '../../types/settings';
import type { Vault, Beneficiary } from '../../types/vault';
import { generatePolicy, compileToMiniscript, extractRedeemInfo, type VaultScriptConfig, type RedeemInfo } from './miniscript';
import { generateTimelockAddress, generateDeadManSwitchAddress, generateMultisigAddress, validateAddress, estimateCurrentBlockHeight } from './bitcoin-address';

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

  return {
    keys,
    timelocks: [{
      type: 'absolute',
      value: lockBlocks,
      estimatedDate: new Date(Date.now() + (config.inactivityTrigger || 365) * 24 * 60 * 60 * 1000)
    }],
    logic: config.logic.primary,
    additionalGates: config.logic.gates || [],
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

    let addressResult: { address: string; witnessScript: string; redeemInfo: object };

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

      case 'multisig_decay':
        // For multisig, use 2-of-3 with owner + heirs
        const allKeys = [config.ownerPubkey, ...heirPubkeys.slice(0, 2)];
        const multisigResult = generateMultisigAddress(allKeys, 2, network);
        addressResult = {
          address: multisigResult.address,
          witnessScript: multisigResult.redeemScript,
          redeemInfo: {
            keys: allKeys,
            threshold: 2,
            spendPaths: [{
              name: 'Multisig Spend',
              description: 'Requires 2 of 3 signatures',
              requirements: allKeys.map((_, i) => `Key ${i + 1}`)
            }]
          }
        };
        break;

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
      isValid: isAddressValid && miniscriptResult.isValid
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

export default {
  generateVaultAddressFromConfig,
  generateAddressForVault,
  canGenerateAddress,
  getAddressPrefix
};
