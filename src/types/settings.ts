// Settings-related type definitions

export interface Settings {
  torEnabled: boolean;
  network: 'mainnet' | 'testnet';
  electrumServer: string;
  theme: 'dark' | 'light';
}

export interface LicenseInfo {
  licensed: boolean;
  tier: 'free' | 'standard' | 'pro';
  email?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  torEnabled: false,
  network: 'mainnet',
  electrumServer: 'electrum.blockstream.info:50002',
  theme: 'dark'
};
