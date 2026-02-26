// Vault-related type definitions

export interface Beneficiary {
  name: string;
  percentage: number;
  pubkey: string;
  email?: string; // For notifications
}

export interface VaultLogic {
  primary: 'timelock' | 'dead_man_switch' | 'multisig_decay'
    | 'solo_vault' | 'spouse_plan' | 'family_vault' | 'business_vault' | 'dead_mans_switch';
  gates: string[];
}

/**
 * Dead Man's Switch check-in tracking
 */
export interface CheckInStatus {
  lastCheckIn: string | null;      // ISO timestamp of last check-in
  lastCheckInTxid?: string;        // Transaction ID of last refresh
  nextCheckInDue: string | null;   // ISO timestamp when next check-in is due
  checkInIntervalDays: number;     // Interval between required check-ins
  warningThresholdDays: number;    // Days before due to start warning (default: 7)
  criticalThresholdDays: number;   // Days before due for urgent warning (default: 2)
  status: 'healthy' | 'warning' | 'critical' | 'expired';
  daysRemaining: number;           // Days until check-in required
  notificationsEnabled: boolean;
  notificationEmail?: string;      // Email for check-in reminders
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
  inactivityTrigger?: number;      // Days of inactivity before heir can claim
  infrastructure: string[];
  logic?: VaultLogic;
  modifiers?: Record<string, unknown>;

  // Dead Man's Switch specific fields
  checkIn?: CheckInStatus;
  witnessScript?: string;          // Hex-encoded witness script
  sequence?: number;               // CSV sequence value for DMS vaults
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

  // Dead Man's Switch specific
  checkIn?: CheckInStatus;
  notificationEmail?: string;
}

/**
 * Calculate check-in status based on vault data
 */
export function calculateCheckInStatus(
  lastCheckIn: string | null,
  intervalDays: number,
  warningDays: number = 7,
  criticalDays: number = 2
): Omit<CheckInStatus, 'notificationsEnabled' | 'notificationEmail' | 'lastCheckInTxid'> {
  const now = new Date();

  if (!lastCheckIn) {
    return {
      lastCheckIn: null,
      nextCheckInDue: null,
      checkInIntervalDays: intervalDays,
      warningThresholdDays: warningDays,
      criticalThresholdDays: criticalDays,
      status: 'healthy', // No check-in yet means vault just created
      daysRemaining: intervalDays,
    };
  }

  const lastDate = new Date(lastCheckIn);
  const nextDue = new Date(lastDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.ceil((nextDue.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  let status: CheckInStatus['status'] = 'healthy';
  if (daysRemaining <= 0) {
    status = 'expired';
  } else if (daysRemaining <= criticalDays) {
    status = 'critical';
  } else if (daysRemaining <= warningDays) {
    status = 'warning';
  }

  return {
    lastCheckIn,
    nextCheckInDue: nextDue.toISOString(),
    checkInIntervalDays: intervalDays,
    warningThresholdDays: warningDays,
    criticalThresholdDays: criticalDays,
    status,
    daysRemaining: Math.max(0, daysRemaining),
  };
}
