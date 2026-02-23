/**
 * Shared types for the SatsLegacy miniscript/address stack.
 *
 * Both miniscript.ts and bitcoin-address.ts re-export from here
 * so that consumers get a single canonical definition.
 */

// ============================================
// SPEND PATH (superset of both old definitions)
// ============================================

/** Describes a single spending path for a vault script */
export interface SpendPath {
  name: string;
  description: string;
  /** Human-readable witness stack layout, e.g. "<signature> TRUE <witnessScript>" */
  witness?: string;
  /** nSequence value required for this path (CSV) */
  sequence?: number;
  /** Whether this path is currently available */
  availableNow?: boolean;
  /** Block height after which this path becomes available */
  availableAfterBlock?: number;
  /** Key combinations that satisfy this path */
  combinations?: string[][];
  /** Additional notes about this path */
  note?: string;
  /** Human-readable list of requirements (keys, timelocks, challenges) */
  requirements?: string[];
  /** Estimated date when path becomes available */
  availableAfter?: Date;
}

// ============================================
// MULTISIG DECAY CONFIG
// ============================================

export interface MultisigDecayConfig {
  initialThreshold: number;   // e.g., 2 (need 2 sigs initially)
  initialTotal: number;       // e.g., 3 (out of 3 keys)
  decayedThreshold: number;   // e.g., 1 (need 1 sig after decay)
  decayedTotal: number;       // e.g., 2 (out of 2 heir keys)
  decayAfterBlocks: number;   // Block height when decay activates
}
