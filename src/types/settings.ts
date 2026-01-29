// Settings-related type definitions

export type NetworkType = 'mainnet' | 'testnet' | 'signet';

export interface NotificationSettings {
  enabled: boolean;
  resendApiKey?: string;
  fromEmail?: string;
  ownerEmail?: string;  // Email for check-in reminders
  warningDays: number;  // Days before due to send warning (default: 7)
  criticalDays: number; // Days before due for urgent warning (default: 2)
}

export type DuressAction = 'show_decoy' | 'show_decoy_and_wipe' | 'wipe_only';

export interface DuressSettings {
  enabled: boolean;
  // Hash of duress password (never store plaintext)
  passwordHash?: string;
  salt?: string;
  // What happens when duress password is entered
  action: DuressAction;
  // Decoy vault IDs to show under duress
  decoyVaultIds: string[];
  // Optional: silent alert (future: send location, notify contact)
  silentAlert: boolean;
  alertEmail?: string;
}

export interface TorSettings {
  enabled: boolean;
  host: string;
  port: number;
  // Connection status (runtime only, not persisted)
  connected?: boolean;
  lastError?: string;
}

export interface Settings {
  torEnabled: boolean; // Legacy - use tor.enabled instead
  tor: TorSettings;
  network: NetworkType;
  electrumServer: string;
  theme: 'dark' | 'light';
  notifications: NotificationSettings;
  duress: DuressSettings;
}

export interface LicenseInfo {
  licensed: boolean;
  tier: 'free' | 'standard' | 'pro';
  email?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  torEnabled: false,
  tor: {
    enabled: false,
    host: '127.0.0.1',
    port: 9050, // Default Tor SOCKS5 port
  },
  network: 'mainnet',
  electrumServer: 'electrum.blockstream.info:50002',
  theme: 'dark',
  notifications: {
    enabled: false,
    warningDays: 7,
    criticalDays: 2,
  },
  duress: {
    enabled: false,
    action: 'show_decoy',
    decoyVaultIds: [],
    silentAlert: false,
  },
};
