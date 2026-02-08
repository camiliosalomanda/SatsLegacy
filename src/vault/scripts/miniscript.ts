/**
 * BitTrust Miniscript Policy Generator
 *
 * Generates Miniscript policies from vault configurations.
 * These policies compile to Bitcoin Script for on-chain inheritance.
 */

import type { VaultConfiguration, InheritanceLogic } from '../creation/validation/compatibility';
import { compilePolicy as compileMiniscriptPolicy, compileMiniscript as compileMiniscriptToAsm, satisfier } from '@bitcoinerlab/miniscript';

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

export interface MultisigDecayConfig {
  initialThreshold: number  // e.g., 2
  initialTotal: number      // e.g., 3
  decayedThreshold: number  // e.g., 1
  decayedTotal: number      // e.g., 2
  decayAfterBlocks: number
}

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

export interface SpendPath {
  name: string
  description: string
  requirements: string[]
  availableAfter?: Date
}

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
  const keyList = keys.join(',')
  
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
      const lockBlocks = config.timelocks[0]?.value || 52560
      heirCondition = `and(pk(${heirKeys[0]}),after(${lockBlocks}))`
      break
    }
    case 'dead_man_switch': {
      const timeoutBlocks = config.timelocks[0]?.value || 4320
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

  const baseLockBlocks = config.timelocks[0]?.value || 52560

  return config.staggeredConfig.stages.map((stage, index) => {
    const stageConfig = {
      ...config,
      timelocks: [{
        type: 'absolute' as const,
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
// ADDRESS DERIVATION
// ============================================

/**
 * Derive P2WSH address from witness script
 */
export function deriveAddress(
  witnessScript: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): string {
  // This would use bitcoinjs-lib in production
  // const scriptHash = bitcoin.crypto.sha256(Buffer.from(witnessScript, 'hex'))
  // return bitcoin.address.toBech32(scriptHash, 0, network === 'mainnet' ? 'bc' : 'tb')
  throw new Error('Address derivation requires bitcoinjs-lib')
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

    // Duress path
    if (config.additionalGates.includes('duress')) {
      spendPaths.push({
        name: 'Duress Escape',
        description: 'Wrong PIN routes funds to burn/donation address',
        requirements: ['Duress key/PIN']
      })
    }
  }

  return {
    requiredKeys: config.keys.map(k => k.publicKey),
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
  
  // Extract public keys
  const keyMatches = policy.matchAll(/pk\(([a-fA-F0-9]+)\)/g)
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
    hasOracle: keys.length > 2 && policy.includes('and(and(pk(')
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
