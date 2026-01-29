// Vault calculation helpers
import type { Vault } from '../types/vault';

export function getDaysUntilUnlock(vault: Vault): number {
  if (vault.scriptType === 'timelock' || vault.logic?.primary === 'timelock') {
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
  const daysUntil = getDaysUntilUnlock(vault);
  const totalDays = vault.inactivityTrigger || 365;
  return Math.min(100, Math.max(0, ((totalDays - daysUntil) / totalDays) * 100));
}
