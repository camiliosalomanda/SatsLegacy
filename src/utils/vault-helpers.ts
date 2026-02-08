// Vault calculation helpers
import type { Vault } from '../types/vault';

export function getDaysUntilUnlock(vault: Vault): number {
  if (vault.logic?.primary === 'dead_man_switch' || vault.scriptType === 'dead_man_switch') {
    // Dead Man's Switch: prefer check-in status (tracks actual inactivity),
    // then lockDate (user-set unlock date), then inactivityTrigger as fallback.
    if (vault.checkIn?.daysRemaining !== undefined) {
      return vault.checkIn.daysRemaining;
    }
  }
  // Use lockDate for all vault types when available
  if (vault.lockDate) {
    const now = new Date();
    const lockDate = new Date(vault.lockDate);
    const diff = lockDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
  return vault.inactivityTrigger || 365;
}

export function getTotalBTC(vaults: Vault[]): number {
  return vaults.reduce((sum, v) => sum + v.balance, 0);
}

export function getTotalBeneficiaries(vaults: Vault[]): number {
  return vaults.reduce((sum, v) => sum + v.beneficiaries.length, 0);
}

export function calculateVaultProgress(vault: Vault): number {
  const isDMS = vault.logic?.primary === 'dead_man_switch' || vault.scriptType === 'dead_man_switch';
  const daysUntil = getDaysUntilUnlock(vault);
  const totalDays = isDMS
    ? (vault.inactivityTrigger || 365)
    : 730; // Default 2-year scale for timelock vaults
  return Math.min(100, Math.max(0, ((totalDays - daysUntil) / totalDays) * 100));
}
