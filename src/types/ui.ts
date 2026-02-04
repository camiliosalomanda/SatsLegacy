// UI-related type definitions
import type { Vault } from './vault';

export type ViewName = 'dashboard' | 'vaults' | 'simulator' | 'legal' | 'learn';

export type ModalType =
  | { type: 'password'; mode: 'create' | 'unlock' | 'save' }
  | { type: 'addBeneficiary' }
  | { type: 'editBeneficiary'; index: number }
  | { type: 'export' }
  | { type: 'ownerKey' }
  | { type: 'delete'; vault: Vault }
  | { type: 'edit' }
  | { type: 'editTimelock' }
  | { type: 'settings' }
  | { type: 'psbt'; vault: Vault }
  | { type: 'psbtImport'; vault: Vault }
  | { type: 'checkIn'; vault: Vault }
  | { type: 'decoyVaults' }
  | null;

export interface EditFormData {
  name: string;
  description: string;
}
