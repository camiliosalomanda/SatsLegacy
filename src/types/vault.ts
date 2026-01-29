// Vault-related type definitions

export interface Beneficiary {
  name: string;
  percentage: number;
  pubkey: string;
}

export interface VaultLogic {
  primary: 'timelock' | 'dead_man_switch' | 'multisig_decay';
  gates: string[];
}

export interface Vault {
  id: string;
  vault_id?: string;
  name: string;
  description?: string;
  balance: number;
  balanceUSD: number;
  address?: string;
  status: 'pending' | 'active' | 'unlocked';
  scriptType: string;
  lockDate: string;
  beneficiaries: Beneficiary[];
  ownerPubkey?: string;
  inactivityTrigger?: number;
  infrastructure: string[];
  logic?: VaultLogic;
  modifiers?: Record<string, unknown>;
}

export interface PendingVaultData {
  vault_id: string;
  name: string;
  description: string;
  balance: number;
  balanceUSD: number;
  status: 'pending' | 'active';
  scriptType: string;
  lockDate: string;
  beneficiaries: Beneficiary[];
  inactivityTrigger: number;
  infrastructure: string[];
  logic: VaultLogic;
  modifiers: Record<string, unknown>;
}
