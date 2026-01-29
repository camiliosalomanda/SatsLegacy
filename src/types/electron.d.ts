// Electron API type definitions

interface TorFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface TorFetchResponse {
  success: boolean;
  status?: number;
  statusText?: string;
  data?: string;
  headers?: Record<string, string>;
  error?: string;
}

interface TorTestResult {
  success: boolean;
  connected: boolean;
  ip?: string;
  isTor?: boolean;
  error?: string;
}

interface TorStatus {
  success: boolean;
  connected: boolean;
  lastError: string | null;
  lastCheck: number | null;
}

interface ElectronAPI {
  vault: {
    list: () => Promise<{ success: boolean; vaults?: Record<string, unknown>[]; error?: string }>;
    create: (data: unknown, password: string) => Promise<{ success: boolean; vaultId?: string; error?: string }>;
    delete: (vaultId: string) => Promise<{ success: boolean; error?: string }>;
    update: (vaultId: string, vault: unknown, password: string) => Promise<{ success: boolean; error?: string }>;
    export: (vaultId: string, password: string) => Promise<{ success: boolean; error?: string }>;
    import: () => Promise<{ success: boolean; encrypted?: boolean; error?: string }>;
  };
  settings: {
    load: () => Promise<{ settings?: Record<string, unknown>; error?: string }>;
    save: (settings: Record<string, unknown>) => Promise<void>;
  };
  license: {
    check: () => Promise<{ licensed: boolean; tier: string; email?: string } | null>;
    purchase: (tier: string) => Promise<void>;
  };
  system: {
    openExternal: (url: string) => Promise<{ success: boolean }>;
    getAppInfo: () => Promise<{ version: string; platform: string; dataPath: string }>;
  };
  notifications: {
    sendCheckInReminder: (toEmail: string, vaultName: string, daysRemaining: number, status: string) => Promise<{ success: boolean; error?: string }>;
    sendHeirNotification: (toEmail: string, vaultName: string, ownerName: string) => Promise<{ success: boolean; error?: string }>;
    testEmail: (toEmail: string) => Promise<{ success: boolean; error?: string }>;
  };
  duress: {
    setPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
    removePassword: () => Promise<{ success: boolean; error?: string }>;
    checkPassword: (password: string) => Promise<{ success: boolean; isDuress?: boolean; error?: string }>;
    getDecoyVaults: () => Promise<{ success: boolean; vaults?: Record<string, unknown>[]; error?: string }>;
    createDecoyVault: (vault: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
    deleteDecoyVault: (vaultId: string) => Promise<{ success: boolean; error?: string }>;
    executeWipe: () => Promise<{ success: boolean; error?: string }>;
    sendSilentAlert: () => Promise<{ success: boolean; error?: string }>;
  };
  tor: {
    fetch: (url: string, options?: TorFetchOptions) => Promise<TorFetchResponse>;
    testConnection: () => Promise<TorTestResult>;
    getStatus: () => Promise<TorStatus>;
  };
}

declare global {
  interface Window {
    isElectron?: boolean;
    electronAPI?: ElectronAPI;
  }
}

export {};
