/**
 * BitTrust Electron Hook
 * 
 * Provides access to Electron APIs with fallback for web.
 */

import { useState, useEffect, useCallback } from 'react';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.isElectron;
const api = isElectron ? window.electronAPI : null;

// ============================================
// TYPES
// ============================================

interface VaultMeta {
  vault_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  infrastructure: string[];
  logic: { primary: string; gates: string[] };
}

interface LicenseInfo {
  licensed: boolean;
  tier: 'free' | 'standard' | 'pro';
  email?: string;
  activated_at?: string;
  vault_limit: number;
}

interface Settings {
  torEnabled: boolean;
  network: 'mainnet' | 'testnet' | 'signet';
  electrumServer: string;
  theme: 'dark' | 'light';
}

// ============================================
// MAIN HOOK
// ============================================

export function useBitTrustElectron() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize
  useEffect(() => {
    setIsDesktop(isElectron);
    
    if (isElectron) {
      // Load license and settings
      Promise.all([
        api.license.check(),
        api.settings.load()
      ]).then(([licenseResult, settingsResult]) => {
        if (licenseResult.success) {
          setLicense({
            licensed: licenseResult.licensed,
            tier: licenseResult.tier || 'free',
            email: licenseResult.email,
            activated_at: licenseResult.activated_at,
            vault_limit: licenseResult.vault_limit || 3
          });
        }
        if (settingsResult.success) {
          setSettings(settingsResult.settings);
        }
        setLoading(false);
      });
    } else {
      // Web fallback - free tier
      setLicense({ licensed: false, tier: 'free', vault_limit: 3 });
      setSettings({
        torEnabled: false,
        network: 'mainnet',
        electrumServer: 'electrum.blockstream.info:50002',
        theme: 'dark'
      });
      setLoading(false);
    }
  }, []);

  // ============================================
  // VAULT OPERATIONS
  // ============================================

  const listVaults = useCallback(async (): Promise<VaultMeta[]> => {
    if (!isElectron) {
      // Web fallback - use localStorage
      const stored = localStorage.getItem('bittrust:vaults');
      return stored ? JSON.parse(stored) : [];
    }
    
    const result = await api.vault.list();
    return result.success ? result.vaults : [];
  }, []);

  const createVault = useCallback(async (vault: any, password: string): Promise<{ success: boolean; vaultId?: string; error?: string }> => {
    if (!isElectron) {
      // Web fallback
      const vaultId = crypto.randomUUID();
      const vaults = JSON.parse(localStorage.getItem('bittrust:vaults') || '[]');
      vaults.push({ ...vault, vault_id: vaultId });
      localStorage.setItem('bittrust:vaults', JSON.stringify(vaults));
      return { success: true, vaultId };
    }
    
    return api.vault.create(vault, password);
  }, []);

  const loadVault = useCallback(async (vaultId: string, password: string): Promise<{ success: boolean; vault?: any; error?: string }> => {
    if (!isElectron) {
      const vaults = JSON.parse(localStorage.getItem('bittrust:vaults') || '[]');
      const vault = vaults.find((v: any) => v.vault_id === vaultId);
      return vault ? { success: true, vault } : { success: false, error: 'Vault not found' };
    }
    
    return api.vault.load(vaultId, password);
  }, []);

  const updateVault = useCallback(async (vaultId: string, vault: any, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isElectron) {
      const vaults = JSON.parse(localStorage.getItem('bittrust:vaults') || '[]');
      const index = vaults.findIndex((v: any) => v.vault_id === vaultId);
      if (index >= 0) {
        vaults[index] = { ...vault, vault_id: vaultId };
        localStorage.setItem('bittrust:vaults', JSON.stringify(vaults));
        return { success: true };
      }
      return { success: false, error: 'Vault not found' };
    }
    
    return api.vault.update(vaultId, vault, password);
  }, []);

  const deleteVault = useCallback(async (vaultId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isElectron) {
      const vaults = JSON.parse(localStorage.getItem('bittrust:vaults') || '[]');
      const filtered = vaults.filter((v: any) => v.vault_id !== vaultId);
      localStorage.setItem('bittrust:vaults', JSON.stringify(filtered));
      return { success: true };
    }
    
    return api.vault.delete(vaultId);
  }, []);

  const exportVault = useCallback(async (vaultId: string, password: string): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    if (!isElectron) {
      return { success: false, error: 'Export only available in desktop app' };
    }
    
    return api.vault.export(vaultId, password);
  }, []);

  const importVault = useCallback(async (): Promise<{ success: boolean; encrypted?: any; error?: string }> => {
    if (!isElectron) {
      return { success: false, error: 'Import only available in desktop app' };
    }
    
    return api.vault.import();
  }, []);

  // ============================================
  // LICENSE OPERATIONS
  // ============================================

  const activateLicense = useCallback(async (licenseKey: string): Promise<{ success: boolean; tier?: string; error?: string }> => {
    if (!isElectron) {
      return { success: false, error: 'License activation only available in desktop app' };
    }
    
    const result = await api.license.activate(licenseKey);
    if (result.success) {
      setLicense(prev => prev ? { ...prev, licensed: true, tier: result.tier } : null);
    }
    return result;
  }, []);

  const purchaseLicense = useCallback(async (tier: 'standard' | 'pro'): Promise<void> => {
    if (isElectron) {
      await api.license.purchase(tier);
    } else {
      // Open BTCPay in new tab for web
      const url = tier === 'pro' 
        ? 'https://your-btcpay-server.com/checkout/pro'
        : 'https://your-btcpay-server.com/checkout/standard';
      window.open(url, '_blank');
    }
  }, []);

  // ============================================
  // SETTINGS OPERATIONS
  // ============================================

  const updateSettings = useCallback(async (newSettings: Settings): Promise<{ success: boolean; error?: string }> => {
    if (!isElectron) {
      localStorage.setItem('bittrust:settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      return { success: true };
    }
    
    const result = await api.settings.save(newSettings);
    if (result.success) {
      setSettings(newSettings);
    }
    return result;
  }, []);

  // ============================================
  // SYSTEM OPERATIONS
  // ============================================

  const openExternal = useCallback(async (url: string): Promise<void> => {
    if (isElectron) {
      await api.system.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  }, []);

  const getAppInfo = useCallback(async (): Promise<{ version: string; platform: string; dataPath?: string }> => {
    if (isElectron) {
      return api.system.getAppInfo();
    }
    return { version: '1.0.0-web', platform: 'web' };
  }, []);

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    isDesktop,
    isElectron: isDesktop,
    license,
    settings,
    loading,
    
    // Vault operations
    vault: {
      list: listVaults,
      create: createVault,
      load: loadVault,
      update: updateVault,
      delete: deleteVault,
      export: exportVault,
      import: importVault
    },
    
    // License operations
    license: {
      info: license,
      activate: activateLicense,
      purchase: purchaseLicense,
      canCreateVault: (currentCount: number) => {
        if (!license) return currentCount < 3;
        return currentCount < license.vault_limit;
      }
    },
    
    // Settings
    settings: {
      current: settings,
      update: updateSettings
    },
    
    // System
    system: {
      openExternal,
      getAppInfo
    }
  };
}

export default useBitTrustElectron;
