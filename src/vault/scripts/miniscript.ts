/**
 * BitTrust Miniscript Policy Generator
 *
 * Generates Miniscript policies from vault configurations.
 * These policies compile to Bitcoin Script for on-chain inheritance.
 */

import type { VaultConfiguration, InheritanceLogic } from '../creation/validation/compatibility';
import { compilePolicy as compileMiniscriptPolicy, compileMiniscript as compileMiniscriptToAsm, satisfier } from '@bitcoinerlab/miniscript';
import type { SpendPath, MultisigDecayConfig } from './types';

// Re-export shared types so existing consumers that import from miniscript.ts still work
export type { SpendPath, MultisigDecayConfig } from './types';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface KeyDescriptor {
  id: string
  label: string
  publicKey: string      // Hex-encoded public key
  derivationPath?: string // BIP32 path if applicable
  keyType: 'owner' | 'heir' | 'backup' | 'oracle'
}

export interface TimelockConfig {
  type: 'absolute' | 'relative'
  value: number          // Block height (absolute) or blocks (relative)
  estimatedDate?: Date   // Human-readable estimate
}

export interface VaultScriptConfig {
  keys: KeyDescriptor[]
  timelocks: TimelockConfig[]
  logic: InheritanceLogic
  additionalGates: InheritanceLogic[]
  challengeHash?: string  // SHA256 hash for challenge-response
  duressConfig?: DuressConfig
  decayConfig?: MultisigDecayConfig
  staggeredConfig?: StaggeredReleaseConfig
}

export interface DuressConfig {
  burnAddress?: string    // OP_RETURN or unspendable
  donationAddress?: string // Donation target
  duressKeyIndex: number  // Which key triggers duress
}

// MultisigDecayConfig is imported+re-exported from ./types

export interface StaggeredReleaseConfig {
  stages: {
    percent: number
    blocksAfterTrigger: number
  }[]
}

export interface MiniscriptOutput {
  policy: string           // Human-readable Miniscript policy
  miniscript: string       // Compiled Miniscript
  witnessScript: string    // Hex-encoded witness script
  address: string          // P2WSH address
  redeemInfo: RedeemInfo   // Info needed for spending
}

export interface RedeemInfo {
  requiredKeys: string[]
  requiredTimelocks: TimelockConfig[]
  requiredChallenge: boolean
  spendPaths: SpendPath[]
}

// SpendPath is imported+re-exported from ./types

// ============================================
// POLICY TEMPLATES
// ============================================

/**
 * Generate policy for pure timelock inheritance
 * 
 * Owner can spend anytime.
 * Heir can spend after timelock.
 */
function generateTimelockPolicy(
  ownerKey: string,
  heirKey: string,
  lockBlocks: number
): string {
  return `or(pk(${ownerKey}),and(pk(${heirKey}),after(${lockBlocks})))`
}

/**
 * Generate policy for multisig decay
 * 
 * Initially requires threshold of keys.
 * After timelock, requires fewer keys.
 */
function generateMultisigDecayPolicy(
  keys: string[],
  config: MultisigDecayConfig
): string {
  // Validate key counts match config
  if (keys.length < config.initialTotal) {
    throw new Error(
      `Not enough keys for multisig decay: need ${config.initialTotal} for initial threshold, ` +
      `but only ${keys.length} keys provided.`
    );
  }
  const heirKeyCount = keys.length - 1; // exclude owner at index 0
  if (heirKeyCount < config.decayedTotal) {
    throw new Error(
      `Not enough heir keys for decayed threshold: need ${config.decayedTotal}, ` +
      `but only ${heirKeyCount} heir keys available.`
    );
  }

  // Before decay: requires initialThreshold of initialTotal
  const beforeDecay = `thresh(${config.initialThreshold},${keys.slice(0, config.initialTotal).map(k => `pk(${k})`).join(',')})`

  // After decay: requires decayedThreshold of decayedTotal (usually just heir keys)
  const heirKeys = keys.filter((_, i) => i > 0) // Exclude owner key
  const afterDecay = `and(thresh(${config.decayedThreshold},${heirKeys.slice(0, config.decayedTotal).map(k => `pk(${k})`).join(',')}),after(${config.decayAfterBlocks}))`
  
  return `or(${beforeDecay},${afterDecay})`
}

/**
 * Generate policy for dead man's switch
 * 
 * Owner refreshes by spending to self.
 * If no refresh after timeout, heir can spend.
 * Uses relative timelock (CSV) since it resets on each spend.
 */
function generateDeadManSwitchPolicy(
  ownerKey: string,
  heirKey: string,
  timeoutBlocks: number
): string {
  // BIP68 relative timelocks are encoded in 16 bits (max 65535)
  if (timeoutBlocks < 1 || timeoutBlocks > 65535) {
    throw new Error(
      `older() value ${timeoutBlocks} is out of BIP68 range (1-65535). ` +
      `Maximum is ~455 days in block-based mode.`
    );
  }
  // Using 'older' for relative timelock (OP_CHECKSEQUENCEVERIFY)
  return `or(pk(${ownerKey}),and(pk(${heirKey}),older(${timeoutBlocks})))`
}

// Gate functions are no longer used as string wrappers.
// Gates are now applied structurally inside generatePolicy() to ensure:
// - Challenge only gates the heir path, not the owner (CRIT-6 fix)
// - Oracle is applied structurally, not via fragile regex (CRIT-8 fix)
// - Duress is NOT added to on-chain script — Bitcoin Script cannot enforce
//   sending to a specific address, so a duress key would just be an
//   unconditional spending backdoor. Duress is handled at the app layer
//   via decoy vaults and duress password detection. (CRIT-7 fix)

// ============================================
// MAIN POLICY GENERATOR
// ============================================

/**
 * Generate Miniscript policy from vault configuration.
 *
 * Gates (challenge, oracle) are applied ONLY to the heir spending condition,
 * never to the owner path. This ensures the owner can always spend their
 * own funds without needing a preimage or oracle co-sign.
 *
 * Duress is NOT included in the on-chain script — it is handled by the
 * application layer (decoy vaults / duress password). Bitcoin Script cannot
 * enforce routing funds to a burn address, so an on-chain duress key would
 * be an unconditional backdoor.
 */
export function generatePolicy(config: VaultScriptConfig): string {
  const ownerKey = config.keys.find(k => k.keyType === 'owner')?.publicKey
  const heirKeys = config.keys.filter(k => k.keyType === 'heir').map(k => k.publicKey)
  const oracleKey = config.keys.find(k => k.keyType === 'oracle')?.publicKey

  if (!ownerKey) {
    throw new Error('Owner key is required')
  }

  if (heirKeys.length === 0) {
    throw new Error('At least one heir key is required')
  }

  // For multisig_decay, the structure is fundamentally different (no simple owner/heir split)
  if (config.logic === 'multisig_decay') {
    if (!config.decayConfig) {
      throw new Error('Decay config required for multisig_decay logic')
    }
    const allKeys = [ownerKey, ...heirKeys]
    return generateMultisigDecayPolicy(allKeys, config.decayConfig)
  }

  // Build the heir spending condition based on vault type
  let heirCondition: string

  switch (config.logic) {
    case 'timelock': {
      const lockBlocks = config.timelocks[0]?.value ?? 52560
      heirCondition = `and(pk(${heirKeys[0]}),after(${lockBlocks}))`
      break
    }
    case 'dead_man_switch': {
      const timeoutBlocks = config.timelocks[0]?.value ?? 4320
      heirCondition = `and(pk(${heirKeys[0]}),older(${timeoutBlocks}))`
      break
    }
    default: {
      heirCondition = `and(pk(${heirKeys[0]}),after(52560))`
    }
  }

  // Apply gates ONLY to the heir condition (not the owner path)
  for (const gate of config.additionalGates) {
    switch (gate) {
      case 'challenge':
        if (config.challengeHash) {
          // Heir must also provide the SHA-256 preimage
          heirCondition = `and(sha256(${config.challengeHash}),${heirCondition})`
        }
        break

      case 'oracle':
        if (oracleKey) {
          // Heir must also have oracle co-signature
          heirCondition = `and(pk(${oracleKey}),${heirCondition})`
        }
        break

      case 'duress':
        // Duress is handled at the application layer (decoy vaults),
        // NOT in the on-chain script. See CRIT-7 explanation above.
        break
    }
  }

  // Owner can always spend; heir can spend when their conditions are met
  return `or(pk(${ownerKey}),${heirCondition})`
}

/**
 * Generate policies for staggered release
 * Returns multiple policies, one for each stage
 */
export function generateStaggeredPolicies(
  config: VaultScriptConfig
): { stage: number, percent: number, policy: string }[] {
  if (!config.staggeredConfig) {
    return [{ stage: 0, percent: 100, policy: generatePolicy(config) }]
  }

  // LIMITATION: Staggered releases with dead_man_switch add stage.blocksAfterTrigger to a
  // relative timelock base. This means staggered stages are additive offsets from the base
  // inactivity period, NOT independent CSV timers. Each stage's CSV value will be larger
  // than the previous, but they all start counting from the same UTXO creation time.
  // For true independent timers per stage, each stage would need its own UTXO.
  const baseLockBlocks = config.timelocks[0]?.value ?? 52560

  return config.staggeredConfig.stages.map((stage, index) => {
    const timelockType = config.logic === 'dead_man_switch' ? 'relative' as const : 'absolute' as const;
    const stageConfig = {
      ...config,
      timelocks: [{
        type: timelockType,
        value: baseLockBlocks + stage.blocksAfterTrigger
      }]
    }
    
    return {
      stage: index,
      percent: stage.percent,
      policy: generatePolicy(stageConfig)
    }
  })
}

// ============================================
// MINISCRIPT COMPILER
// ============================================

export interface MiniscriptCompileResult {
  miniscript: string;
  asm: string;
  isValid: boolean;
  isSaneSublevel: boolean;
}

export interface ScriptCompileResult {
  asm: string;
  isValid: boolean;
  isSaneSublevel: boolean;
}

export interface SatisfactionPath {
  asm: string;
  nLockTime?: number;
  nSequence?: number;
}

/**
 * Compile policy to Miniscript using @bitcoinerlab/miniscript
 *
 * @param policy - Human-readable policy string (e.g., "or(pk(A),and(pk(B),after(100)))")
 * @returns Compiled miniscript result with ASM and validity flags
 */
export function compileToMiniscript(policy: string): MiniscriptCompileResult {
  try {
    const result = compileMiniscriptPolicy(policy);
    return {
      miniscript: result.miniscript,
      asm: result.asm,
      isValid: result.issane,
      isSaneSublevel: result.issanesublevel
    };
  } catch (error) {
    console.error('Policy compilation failed:', error);
    return {
      miniscript: '',
      asm: '',
      isValid: false,
      isSaneSublevel: false
    };
  }
}

/**
 * Compile Miniscript to Bitcoin Script ASM
 *
 * @param miniscript - Miniscript string to compile
 * @returns Compiled script result with ASM and validity flags
 */
export function compileToScript(miniscript: string): ScriptCompileResult {
  try {
    const result = compileMiniscriptToAsm(miniscript);
    return {
      asm: result.asm,
      isValid: result.issane,
      isSaneSublevel: result.issanesublevel
    };
  } catch (error) {
    console.error('Miniscript compilation failed:', error);
    return {
      asm: '',
      isValid: false,
      isSaneSublevel: false
    };
  }
}

/**
 * Get witness satisfaction paths for a miniscript
 *
 * Returns the different ways a miniscript can be satisfied,
 * including required timelocks (nLockTime/nSequence).
 *
 * @param miniscript - Miniscript to analyze
 * @returns Object containing unknown, non-malleable, and malleable satisfaction paths
 */
export function getWitnessSatisfaction(miniscript: string): {
  unknownSats: SatisfactionPath[];
  nonMalleableSats: SatisfactionPath[];
  malleableSats: SatisfactionPath[];
} {
  try {
    const result = satisfier(miniscript);
    return {
      unknownSats: result.unknownSats || [],
      nonMalleableSats: result.nonMalleableSats || [],
      malleableSats: result.malleableSats || []
    };
  } catch (error) {
    console.error('Satisfaction analysis failed:', error);
    return {
      unknownSats: [],
      nonMalleableSats: [],
      malleableSats: []
    };
  }
}

// ============================================
// REDEEM INFO EXTRACTION
// ============================================

/**
 * Extract spend path information from policy
 */
export function extractRedeemInfo(
  policy: string,
  config: VaultScriptConfig
): RedeemInfo {
  const spendPaths: SpendPath[] = []

  // Analyze policy to determine spend paths
  if (policy.includes('or(')) {
    // Multiple spend paths exist
    
    // Owner path (usually first option)
    const ownerKey = config.keys.find(k => k.keyType === 'owner')
    if (ownerKey && policy.includes(`pk(${ownerKey.publicKey})`)) {
      spendPaths.push({
        name: 'Owner Spend',
        description: 'Owner can spend at any time with their key',
        requirements: [`Key: ${ownerKey.label}`]
      })
    }

    // Heir path (usually second option with timelock)
    const heirKeys = config.keys.filter(k => k.keyType === 'heir')
    const timelock = config.timelocks[0]
    if (heirKeys.length > 0 && timelock) {
      const requirements = heirKeys.map(k => `Key: ${k.label}`)
      requirements.push(`Timelock: Block ${timelock.value}`)
      
      if (policy.includes('sha256(')) {
        requirements.push('Challenge: Passphrase required')
      }
      
      spendPaths.push({
        name: 'Heir Inheritance',
        description: 'Heirs can spend after timelock expires',
        requirements,
        availableAfter: timelock.estimatedDate
      })
    }

    // Duress is handled at the application layer (decoy vaults),
    // NOT in the on-chain script. No spend path entry needed.
  }

  // Collect only the keys that appear in at least one spend path
  const pathKeys = new Set<string>();
  for (const path of spendPaths) {
    for (const req of path.requirements) {
      const keyMatch = config.keys.find(k => req.includes(k.label));
      if (keyMatch) pathKeys.add(keyMatch.publicKey);
    }
  }
  // Fall back to all keys if no spend paths were detected
  const relevantKeys = pathKeys.size > 0
    ? Array.from(pathKeys)
    : config.keys.map(k => k.publicKey);

  return {
    requiredKeys: relevantKeys,
    requiredTimelocks: config.timelocks,
    requiredChallenge: config.additionalGates.includes('challenge'),
    spendPaths
  }
}

// ============================================
// POLICY ANALYSIS
// ============================================

/**
 * Analyze a policy to extract its components
 */
export function analyzePolicy(policy: string): {
  type: string
  keys: string[]
  timelocks: { type: 'absolute' | 'relative', value: number }[]
  hasChallenge: boolean
  hasOracle: boolean
} {
  const keys: string[] = []
  const timelocks: { type: 'absolute' | 'relative', value: number }[] = []
  
  // Extract public keys (hex keys, xpub/tpub descriptors, or other key formats)
  const keyMatches = policy.matchAll(/pk\(([^)]+)\)/g)
  for (const match of keyMatches) {
    keys.push(match[1])
  }

  // Extract absolute timelocks
  const absoluteMatches = policy.matchAll(/after\((\d+)\)/g)
  for (const match of absoluteMatches) {
    timelocks.push({ type: 'absolute', value: parseInt(match[1]) })
  }

  // Extract relative timelocks
  const relativeMatches = policy.matchAll(/older\((\d+)\)/g)
  for (const match of relativeMatches) {
    timelocks.push({ type: 'relative', value: parseInt(match[1]) })
  }

  // Determine type
  let type = 'unknown'
  if (policy.includes('older(')) {
    type = 'dead_man_switch'
  } else if (policy.includes('thresh(') && policy.includes('after(')) {
    type = 'multisig_decay'
  } else if (policy.includes('after(')) {
    type = 'timelock'
  }

  return {
    type,
    keys,
    timelocks,
    hasChallenge: policy.includes('sha256('),
    // Oracle adds an extra pk() wrapping the heir condition.
    // Count nested pk() calls - more than 2 in an and(pk(...),and(pk(...) pattern suggests oracle.
    // LIMITATION: This heuristic can false-positive on multisig_decay policies (which have 3+ pk()
    // calls in thresh() wrappers) or policies with backup keys. A more robust approach would parse
    // the policy AST, but for display purposes this is acceptable.
    hasOracle: keys.length > 2 && (policy.includes('and(pk(') && (policy.match(/and\(pk\(/g) || []).length >= 2)
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  generatePolicy,
  generateStaggeredPolicies,
  compileToMiniscript,
  compileToScript,
  getWitnessSatisfaction,
  extractRedeemInfo,
  analyzePolicy
}
