// Electron API type definitions

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
    load: () => Promise<Record<string, unknown> | null>;
    save: (settings: Record<string, unknown>) => Promise<void>;
  };
  license: {
    check: () => Promise<{ licensed: boolean; tier: string; email?: string } | null>;
    purchase: (tier: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    isElectron?: boolean;
    electronAPI?: ElectronAPI;
  }
}

export {};
