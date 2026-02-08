/**
 * BitTrust Vault Module
 * 
 * Sovereign Bitcoin inheritance infrastructure.
 * 
 * @module vault
 */

// ============================================
// VALIDATION & CONFIGURATION
// ============================================

export {
  validateConfiguration,
  canAddOption,
  getAvailableOptions,
  getPresetBundle,
  PRESET_BUNDLES,
  type VaultConfiguration,
  type InfrastructureOption,
  type InheritanceLogic,
  type Modifier,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type Recommendation,
  type PresetBundle
} from './creation/validation/compatibility';

// ============================================
// MINISCRIPT & BITCOIN SCRIPTS
// ============================================

export {
  generatePolicy,
  generateStaggeredPolicies,
  compileToMiniscript,
  extractRedeemInfo,
  analyzePolicy,
  type KeyDescriptor,
  type TimelockConfig,
  type VaultScriptConfig,
  type MiniscriptOutput,
  type RedeemInfo,
  type SpendPath,
  type DuressConfig,
  type MultisigDecayConfig,
  type StaggeredReleaseConfig
} from './scripts/miniscript';

// ============================================
// LOCAL STORAGE
// ============================================

export {
  deriveKey,
  encryptVault,
  decryptVault,
  VaultStorage,
  MemoryStorage,
  LocalStorageBackend,
  exportVaultToFile,
  importVaultFromFile,
  exportVaultToQR,
  type VaultData,
  type EncryptedVault,
  type ExportedVault,
  type StorageBackend
} from './infrastructure/local/storage';

// ============================================
// SHAMIR SECRET SHARING
// ============================================

export {
  split as shamirSplit,
  combine as shamirCombine,
  verifyShare as shamirVerify,
  encodeShare as shamirEncode,
  decodeShare as shamirDecode,
  type ShamirShare,
  type ShamirConfig,
  type EncodedShare
} from './infrastructure/shamir/shamir';

// ============================================
// NOSTR RELAY STORAGE
// ============================================

export {
  NostrVaultStorage,
  RelayConnection,
  HeartbeatManager,
  generateNostrKeys,
  type NostrEvent,
  type NostrKeys,
  type RelayConfig,
  type NostrStorageConfig,
  type StoredVaultEvent,
  type HeartbeatConfig
} from './infrastructure/nostr/nostr';

// ============================================
// UI COMPONENTS
// ============================================

export { VaultCreationWizard } from './creation/wizard/VaultCreationWizard';

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

import { v4 as uuidv4 } from 'uuid';
import type { VaultConfiguration } from './creation/validation/compatibility';
import type { VaultData } from './infrastructure/local/storage';
import { generatePolicy, type VaultScriptConfig, type KeyDescriptor, type TimelockConfig } from './scripts/miniscript';

/**
 * Create a new vault data object from configuration
 */
export async function createVaultData(
  config: VaultConfiguration,
  name: string,
  keys: KeyDescriptor[],
  timelocks: TimelockConfig[],
  description?: string,
  challengePassphrase?: string
): Promise<VaultData> {
  const challengeHash = config.additionalGates.includes('challenge')
    ? await generateChallengeHash(challengePassphrase)
    : undefined;

  const scriptConfig: VaultScriptConfig = {
    keys,
    timelocks,
    logic: config.primaryLogic,
    additionalGates: config.additionalGates,
    challengeHash,
    decayConfig: config.primaryLogic === 'multisig_decay' ? {
      initialThreshold: 2,
      initialTotal: 3,
      decayedThreshold: 1,
      decayedTotal: 2,
      decayAfterBlocks: timelocks[0]?.value || 52560
    } : undefined,
    staggeredConfig: config.modifiers.includes('staggered') ? {
      stages: [
        { percent: 25, blocksAfterTrigger: 0 },
        { percent: 25, blocksAfterTrigger: 26280 },
        { percent: 50, blocksAfterTrigger: 105120 }
      ]
    } : undefined
  };

  const policy = generatePolicy(scriptConfig);

  return {
    vault_id: uuidv4(),
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    name,
    description,
    miniscript_policy: policy,
    public_keys: keys.map(k => ({
      id: k.id,
      label: k.label,
      public_key: k.publicKey,
      key_type: k.keyType
    })),
    derivation_paths: keys.map(k => k.derivationPath || "m/84'/0'/0'/0/0"),
    timelocks: timelocks.map(t => ({
      block_height: t.value,
      purpose: t.type === 'absolute' ? 'inheritance_trigger' : 'refresh_period',
      estimated_date: t.estimatedDate?.toISOString()
    })),
    beneficiaries: keys
      .filter(k => k.keyType === 'heir')
      .map((k, i) => ({
        id: uuidv4(),
        label: k.label,
        key_index: keys.indexOf(k),
        allocation_percent: Math.floor(100 / keys.filter(kk => kk.keyType === 'heir').length)
      })),
    infrastructure: config.infrastructure,
    logic: {
      primary: config.primaryLogic,
      gates: config.additionalGates
    },
    modifiers: {
      staggered: config.modifiers.includes('staggered') ? {
        stages: [
          { percent: 25, blocks: 0 },
          { percent: 25, blocks: 26280 },
          { percent: 50, blocks: 105120 }
        ]
      } : undefined,
      decoy: config.modifiers.includes('decoy') ? {
        decoy_derivation_path: "m/84'/0'/0'/0/0",
        real_derivation_path: "m/84'/0'/1337'/0/0"
      } : undefined
    }
  };
}

/**
 * Generate a challenge hash from a passphrase using SHA-256.
 * The heir must know the passphrase to satisfy the challenge gate.
 */
async function generateChallengeHash(passphrase?: string): Promise<string> {
  if (!passphrase) {
    console.warn('[generateChallengeHash] No passphrase provided - challenge gate will not be verifiable');
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Estimate block height from date
 */
export function estimateBlockHeight(targetDate: Date, currentHeight?: number): number {
  // Use anchor-based estimation if no current height provided
  const ANCHOR_HEIGHT = 878000;
  const ANCHOR_DATE = new Date('2025-01-01T00:00:00Z');
  const BLOCKS_PER_DAY = 144;

  const baseHeight = currentHeight ?? Math.floor(
    ANCHOR_HEIGHT + ((Date.now() - ANCHOR_DATE.getTime()) / (24 * 60 * 60 * 1000)) * BLOCKS_PER_DAY
  );

  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  const blocksToAdd = Math.floor(diffMinutes / 10); // ~10 min per block
  return baseHeight + blocksToAdd;
}

/**
 * Estimate date from block height
 */
export function estimateDateFromBlock(blockHeight: number, currentHeight?: number): Date {
  const ANCHOR_HEIGHT = 878000;
  const ANCHOR_DATE = new Date('2025-01-01T00:00:00Z');
  const BLOCKS_PER_DAY = 144;

  if (!currentHeight) {
    currentHeight = Math.floor(
      ANCHOR_HEIGHT + ((Date.now() - ANCHOR_DATE.getTime()) / (24 * 60 * 60 * 1000)) * BLOCKS_PER_DAY
    );
  }
  const blocksDiff = blockHeight - currentHeight;
  const minutesDiff = blocksDiff * 10;
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutesDiff);
  return date;
}

// ============================================
// BITCOIN ADDRESS UTILITIES
// ============================================

export {
  generateP2WPKHAddress,
  generateP2WSHAddress,
  generateMultisigAddress,
  generateTimelockAddress,
  generateVaultAddress,
  validateAddress,
  getAddressType,
  dateToBlockHeight,
  estimateCurrentBlockHeight,
} from './scripts/bitcoin-address';
