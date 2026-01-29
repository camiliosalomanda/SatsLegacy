// UI-related type definitions
import type { Vault } from './vault';

export type ViewName = 'dashboard' | 'vaults' | 'simulator' | 'legal' | 'learn';

export type ModalType =
  | { type: 'password'; mode: 'create' | 'unlock' }
  | { type: 'addBeneficiary' }
  | { type: 'export' }
  | { type: 'ownerKey' }
  | { type: 'delete'; vault: Vault }
  | { type: 'edit' }
  | { type: 'settings' }
  | null;

export interface EditFormData {
  name: string;
  description: string;
}
