/**
 * BitTrust Vault Compatibility Validation
 * 
 * Validates infrastructure and logic combinations to prevent
 * conflicting or redundant configurations.
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export type InfrastructureOption = 
  | 'local'           // Local encrypted storage (always on)
  | 'microsd'         // Encrypted microSD/steel export
  | 'shamir'          // Shamir backup splits
  | 'nostr'           // Nostr relay blob storage
  | 'ipfs'            // IPFS pinning
  | 'multisig_config' // Multisig config across devices

export type InheritanceLogic = 
  | 'timelock'        // Pure timelock
  | 'dead_man_switch' // Requires periodic proof of life
  | 'multisig_decay'  // Starts 2-of-3, decays to 1-of-2
  | 'challenge'       // Challenge-response gate
  | 'oracle'          // Oracle-assisted attestation
  | 'duress'          // Duress routing

export type Modifier = 
  | 'staggered'       // Staggered release over time
  | 'multi_beneficiary' // Multiple heirs with different conditions
  | 'decoy'           // Decoy vault with hidden real vault

export interface VaultConfiguration {
  infrastructure: InfrastructureOption[]
  primaryLogic: InheritanceLogic
  additionalGates: InheritanceLogic[]
  modifiers: Modifier[]
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  recommendations: Recommendation[]
}

export interface ValidationError {
  code: string
  message: string
  conflictingOptions: string[]
}

export interface ValidationWarning {
  code: string
  message: string
  affectedOptions: string[]
}

export interface Recommendation {
  code: string
  message: string
  suggestedOption: string
  reason: string
}

// ============================================
// INFRASTRUCTURE CONFLICTS
// ============================================

const INFRASTRUCTURE_CONFLICTS: Record<InfrastructureOption, InfrastructureOption[]> = {
  local: [],                    // Local is always compatible
  microsd: [],                  // Compatible with everything
  shamir: ['multisig_config'],  // Two distribution models conflict
  nostr: ['ipfs'],              // Redundant - pick one
  ipfs: ['nostr'],              // Redundant - pick one
  multisig_config: ['shamir']   // Two distribution models conflict
}

const INFRASTRUCTURE_REDUNDANCIES: [InfrastructureOption, InfrastructureOption, string][] = [
  ['nostr', 'ipfs', 'Both Nostr and IPFS serve the same off-site backup purpose. Choose based on your preference: Nostr for censorship resistance, IPFS for content addressing.']
]

// ============================================
// LOGIC REQUIREMENTS
// ============================================

interface LogicRequirement {
  requires: InfrastructureOption[]
  requiresAny?: InfrastructureOption[]
  incompatibleWith?: InheritanceLogic[]
  description: string
}

const LOGIC_REQUIREMENTS: Record<InheritanceLogic, LogicRequirement> = {
  timelock: {
    requires: [],
    description: 'No special infrastructure required. Works with any configuration.'
  },
  dead_man_switch: {
    requiresAny: ['nostr'],
    description: 'Requires network layer for heartbeat broadcast. Nostr recommended.'
  },
  multisig_decay: {
    requires: ['multisig_config'],
    incompatibleWith: ['timelock'], // Redundant - decay IS a timelock
    description: 'Requires multisig infrastructure for key structure.'
  },
  challenge: {
    requires: [],
    description: 'Challenge data stored in vault config. Works with any infrastructure.'
  },
  oracle: {
    requiresAny: ['nostr', 'ipfs'],
    incompatibleWith: ['timelock'], // Philosophical conflict
    description: 'Requires network layer for oracle attestation.'
  },
  duress: {
    requires: [],
    description: 'Encoded in spending script. Compatible with everything.'
  }
}

// ============================================
// LOGIC REDUNDANCIES
// ============================================

const LOGIC_REDUNDANCIES: [InheritanceLogic, InheritanceLogic, string][] = [
  ['timelock', 'dead_man_switch', 'Both are time-based triggers. Pure timelock is immutable; dead man\'s switch requires active maintenance. Choose one.'],
  ['timelock', 'multisig_decay', 'Multisig decay already includes timelock functionality. Using both is redundant.']
]

// ============================================
// MODIFIER CONSTRAINTS
// ============================================

interface ModifierConstraint {
  incompatibleInfra?: InfrastructureOption[]
  incompatibleLogic?: InheritanceLogic[]
  description: string
}

const MODIFIER_CONSTRAINTS: Record<Modifier, ModifierConstraint> = {
  staggered: {
    description: 'Creates multiple UTXOs with different timelocks. Compatible with all configurations.'
  },
  multi_beneficiary: {
    description: 'Increases complexity of every other choice. No hard conflicts.'
  },
  decoy: {
    incompatibleInfra: ['multisig_config'],
    description: 'Decoy needs simple structure. Incompatible with complex multisig configurations.'
  }
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate infrastructure option combinations
 */
function validateInfrastructure(
  options: InfrastructureOption[]
): { errors: ValidationError[], warnings: ValidationWarning[] } {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Check for conflicts
  for (const option of options) {
    const conflicts = INFRASTRUCTURE_CONFLICTS[option]
    for (const conflict of conflicts) {
      if (options.includes(conflict)) {
        errors.push({
          code: 'INFRA_CONFLICT',
          message: `${formatOption(option)} conflicts with ${formatOption(conflict)}. These use incompatible distribution models.`,
          conflictingOptions: [option, conflict]
        })
      }
    }
  }

  // Check for redundancies
  for (const [optA, optB, message] of INFRASTRUCTURE_REDUNDANCIES) {
    if (options.includes(optA) && options.includes(optB)) {
      warnings.push({
        code: 'INFRA_REDUNDANT',
        message,
        affectedOptions: [optA, optB]
      })
    }
  }

  return { errors, warnings }
}

/**
 * Validate that selected logic has required infrastructure
 */
function validateLogicRequirements(
  logic: InheritanceLogic,
  infrastructure: InfrastructureOption[]
): ValidationError[] {
  const errors: ValidationError[] = []
  const req = LOGIC_REQUIREMENTS[logic]

  // Check hard requirements
  for (const required of req.requires) {
    if (!infrastructure.includes(required)) {
      errors.push({
        code: 'LOGIC_MISSING_INFRA',
        message: `${formatOption(logic)} requires ${formatOption(required)} infrastructure.`,
        conflictingOptions: [logic, required]
      })
    }
  }

  // Check "any of" requirements
  if (req.requiresAny && req.requiresAny.length > 0) {
    const hasAny = req.requiresAny.some(r => infrastructure.includes(r))
    if (!hasAny) {
      errors.push({
        code: 'LOGIC_MISSING_ANY_INFRA',
        message: `${formatOption(logic)} requires one of: ${req.requiresAny.map(formatOption).join(', ')}`,
        conflictingOptions: [logic, ...req.requiresAny]
      })
    }
  }

  return errors
}

/**
 * Validate logic combinations (primary + gates)
 */
function validateLogicCombinations(
  primary: InheritanceLogic,
  gates: InheritanceLogic[]
): { errors: ValidationError[], warnings: ValidationWarning[] } {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const allLogic = [primary, ...gates]

  // Check for incompatibilities
  for (const logic of allLogic) {
    const req = LOGIC_REQUIREMENTS[logic]
    if (req.incompatibleWith) {
      for (const incompatible of req.incompatibleWith) {
        if (allLogic.includes(incompatible)) {
          errors.push({
            code: 'LOGIC_CONFLICT',
            message: `${formatOption(logic)} is incompatible with ${formatOption(incompatible)}.`,
            conflictingOptions: [logic, incompatible]
          })
        }
      }
    }
  }

  // Check for redundancies
  for (const [logicA, logicB, message] of LOGIC_REDUNDANCIES) {
    if (allLogic.includes(logicA) && allLogic.includes(logicB)) {
      warnings.push({
        code: 'LOGIC_REDUNDANT',
        message,
        affectedOptions: [logicA, logicB]
      })
    }
  }

  return { errors, warnings }
}

/**
 * Validate modifiers against infrastructure and logic
 */
function validateModifiers(
  modifiers: Modifier[],
  infrastructure: InfrastructureOption[],
  logic: InheritanceLogic[]
): ValidationError[] {
  const errors: ValidationError[] = []

  for (const modifier of modifiers) {
    const constraint = MODIFIER_CONSTRAINTS[modifier]

    // Check infrastructure incompatibilities
    if (constraint.incompatibleInfra) {
      for (const infra of constraint.incompatibleInfra) {
        if (infrastructure.includes(infra)) {
          errors.push({
            code: 'MODIFIER_INFRA_CONFLICT',
            message: `${formatOption(modifier)} modifier is incompatible with ${formatOption(infra)} infrastructure.`,
            conflictingOptions: [modifier, infra]
          })
        }
      }
    }

    // Check logic incompatibilities
    if (constraint.incompatibleLogic) {
      for (const l of constraint.incompatibleLogic) {
        if (logic.includes(l)) {
          errors.push({
            code: 'MODIFIER_LOGIC_CONFLICT',
            message: `${formatOption(modifier)} modifier is incompatible with ${formatOption(l)} logic.`,
            conflictingOptions: [modifier, l]
          })
        }
      }
    }
  }

  return errors
}

/**
 * Generate recommendations based on configuration
 */
function generateRecommendations(
  config: VaultConfiguration
): Recommendation[] {
  const recommendations: Recommendation[] = []

  // Recommend Shamir if using local only
  if (
    config.infrastructure.includes('local') &&
    !config.infrastructure.includes('shamir') &&
    !config.infrastructure.includes('nostr') &&
    !config.infrastructure.includes('ipfs')
  ) {
    recommendations.push({
      code: 'RECOMMEND_REDUNDANCY',
      message: 'Your vault has a single point of failure. Consider adding backup redundancy.',
      suggestedOption: 'shamir',
      reason: 'Shamir splits protect against device failure without requiring network access.'
    })
  }

  // Recommend Nostr if using dead man's switch without it
  if (
    config.primaryLogic === 'dead_man_switch' &&
    !config.infrastructure.includes('nostr')
  ) {
    recommendations.push({
      code: 'RECOMMEND_NOSTR_HEARTBEAT',
      message: 'Dead man\'s switch works best with Nostr infrastructure.',
      suggestedOption: 'nostr',
      reason: 'Nostr provides censorship-resistant heartbeat broadcasting.'
    })
  }

  // Recommend challenge-response for high-value vaults
  if (
    !config.additionalGates.includes('challenge') &&
    config.primaryLogic !== 'challenge'
  ) {
    recommendations.push({
      code: 'RECOMMEND_CHALLENGE',
      message: 'Consider adding a challenge-response gate for additional security.',
      suggestedOption: 'challenge',
      reason: 'Requires heirs to prove knowledge, preventing key theft from triggering inheritance.'
    })
  }

  // Recommend duress for hostile environment setups
  if (
    config.modifiers.includes('decoy') &&
    !config.additionalGates.includes('duress')
  ) {
    recommendations.push({
      code: 'RECOMMEND_DURESS',
      message: 'Decoy vaults pair well with duress routing.',
      suggestedOption: 'duress',
      reason: 'If coerced, wrong PIN routes funds to burn/donate rather than attacker.'
    })
  }

  return recommendations
}

// ============================================
// MAIN VALIDATION FUNCTION
// ============================================

/**
 * Validate a complete vault configuration
 */
export function validateConfiguration(config: VaultConfiguration): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Ensure local is always included
  if (!config.infrastructure.includes('local')) {
    config.infrastructure = ['local', ...config.infrastructure]
  }

  // Validate infrastructure
  const infraResult = validateInfrastructure(config.infrastructure)
  errors.push(...infraResult.errors)
  warnings.push(...infraResult.warnings)

  // Validate logic requirements
  const allLogic = [config.primaryLogic, ...config.additionalGates]
  for (const logic of allLogic) {
    errors.push(...validateLogicRequirements(logic, config.infrastructure))
  }

  // Validate logic combinations
  const logicResult = validateLogicCombinations(config.primaryLogic, config.additionalGates)
  errors.push(...logicResult.errors)
  warnings.push(...logicResult.warnings)

  // Validate modifiers
  errors.push(...validateModifiers(config.modifiers, config.infrastructure, allLogic))

  // Generate recommendations
  const recommendations = generateRecommendations(config)

  // Deduplicate errors (same conflict might be detected twice)
  const uniqueErrors = deduplicateByCode(errors)
  const uniqueWarnings = deduplicateByCode(warnings)

  return {
    valid: uniqueErrors.length === 0,
    errors: uniqueErrors,
    warnings: uniqueWarnings,
    recommendations
  }
}

/**
 * Check if a specific option can be added to current configuration
 */
export function canAddOption(
  config: VaultConfiguration,
  optionType: 'infrastructure' | 'logic' | 'gate' | 'modifier',
  option: InfrastructureOption | InheritanceLogic | Modifier
): { canAdd: boolean, reason?: string } {
  // Create a hypothetical config with the new option
  const testConfig: VaultConfiguration = JSON.parse(JSON.stringify(config))

  switch (optionType) {
    case 'infrastructure':
      testConfig.infrastructure.push(option as InfrastructureOption)
      break
    case 'logic':
      testConfig.primaryLogic = option as InheritanceLogic
      break
    case 'gate':
      testConfig.additionalGates.push(option as InheritanceLogic)
      break
    case 'modifier':
      testConfig.modifiers.push(option as Modifier)
      break
  }

  const result = validateConfiguration(testConfig)

  if (result.valid) {
    return { canAdd: true }
  }

  // Find the error related to this option
  const relevantError = result.errors.find(e => 
    e.conflictingOptions.includes(option)
  )

  return {
    canAdd: false,
    reason: relevantError?.message || 'Incompatible with current configuration'
  }
}

/**
 * Get all available options that can be added to current configuration
 */
export function getAvailableOptions(config: VaultConfiguration): {
  infrastructure: { option: InfrastructureOption, canAdd: boolean, reason?: string }[]
  logic: { option: InheritanceLogic, canAdd: boolean, reason?: string }[]
  gates: { option: InheritanceLogic, canAdd: boolean, reason?: string }[]
  modifiers: { option: Modifier, canAdd: boolean, reason?: string }[]
} {
  const allInfra: InfrastructureOption[] = ['local', 'microsd', 'shamir', 'nostr', 'ipfs', 'multisig_config']
  const allLogic: InheritanceLogic[] = ['timelock', 'dead_man_switch', 'multisig_decay', 'challenge', 'oracle', 'duress']
  const allModifiers: Modifier[] = ['staggered', 'multi_beneficiary', 'decoy']

  return {
    infrastructure: allInfra.map(opt => ({
      option: opt,
      ...canAddOption(config, 'infrastructure', opt)
    })),
    logic: allLogic.map(opt => ({
      option: opt,
      ...canAddOption(config, 'logic', opt)
    })),
    gates: allLogic
      .filter(opt => opt !== config.primaryLogic) // Can't add primary as gate
      .map(opt => ({
        option: opt,
        ...canAddOption(config, 'gate', opt)
      })),
    modifiers: allModifiers.map(opt => ({
      option: opt,
      ...canAddOption(config, 'modifier', opt)
    }))
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatOption(option: string): string {
  const names: Record<string, string> = {
    local: 'Local Storage',
    microsd: 'MicroSD/Steel Export',
    shamir: 'Shamir Splits',
    nostr: 'Nostr Relay',
    ipfs: 'IPFS Pinning',
    multisig_config: 'Multisig Config',
    timelock: 'Pure Timelock',
    dead_man_switch: 'Dead Man\'s Switch',
    multisig_decay: 'Multisig Decay',
    challenge: 'Challenge-Response',
    oracle: 'Oracle-Assisted',
    duress: 'Duress Routing',
    staggered: 'Staggered Release',
    multi_beneficiary: 'Multi-Beneficiary',
    decoy: 'Decoy Vault'
  }
  return names[option] || option
}

function deduplicateByCode<T extends { code: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter(item => {
    if (seen.has(item.code)) return false
    seen.add(item.code)
    return true
  })
}

// ============================================
// PRESET BUNDLES
// ============================================

export interface PresetBundle {
  id: string
  name: string
  tagline: string
  description: string
  bestFor: string[]
  config: VaultConfiguration
}

export const PRESET_BUNDLES: PresetBundle[] = [
  {
    id: 'simple_sovereign',
    name: 'Simple Sovereign',
    tagline: 'Local backup, timelock unlock',
    description: 'Minimal complexity, maximum self-reliance. Everything stays on your device with a simple time-based inheritance.',
    bestFor: ['< 0.5 BTC', 'Getting started', 'Learning the system'],
    config: {
      infrastructure: ['local', 'microsd'],
      primaryLogic: 'timelock',
      additionalGates: [],
      modifiers: []
    }
  },
  {
    id: 'resilient_sovereign',
    name: 'Resilient Sovereign',
    tagline: 'Survives fire, survives you',
    description: 'Geographic redundancy with Shamir splits plus off-site encrypted backup. Multisig decay means no maintenance required.',
    bestFor: ['Most users', 'Set and forget', '0.5-10 BTC'],
    config: {
      infrastructure: ['local', 'shamir', 'nostr'],
      primaryLogic: 'multisig_decay',
      additionalGates: [],
      modifiers: []
    }
  },
  {
    id: 'active_guardian',
    name: 'Active Guardian',
    tagline: 'You stay in control until you don\'t',
    description: 'Maximum control with periodic check-ins. Heirs must prove knowledge and funds release gradually over time.',
    bestFor: ['Large holdings', 'Active Bitcoiner', '10+ BTC'],
    config: {
      infrastructure: ['local', 'shamir', 'nostr'],
      primaryLogic: 'dead_man_switch',
      additionalGates: ['challenge'],
      modifiers: ['staggered']
    }
  },
  {
    id: 'hostile_environment',
    name: 'Hostile Environment',
    tagline: 'Coercion resistant, plausibly deniable',
    description: 'Optimized for adversarial conditions. Decoy wallet with duress routing. Real vault hidden behind alternate derivation.',
    bestFor: ['High threat model', 'Geographic instability', 'Privacy critical'],
    config: {
      infrastructure: ['local', 'microsd', 'shamir'],
      primaryLogic: 'timelock',
      additionalGates: ['challenge', 'duress'],
      modifiers: ['decoy']
    }
  }
]

/**
 * Get a preset bundle by ID
 */
export function getPresetBundle(id: string): PresetBundle | undefined {
  return PRESET_BUNDLES.find(b => b.id === id)
}
