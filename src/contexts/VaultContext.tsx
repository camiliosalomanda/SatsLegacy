import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Vault, Beneficiary, PendingVaultData } from '../types/vault';
import { fetchAddressBalance } from '../utils/api/blockchain';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.isElectron;
const electronAPI = typeof window !== 'undefined' ? window.electronAPI : null;

interface VaultContextValue {
  // State
  vaults: Vault[];
  selectedVault: Vault | null;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  pendingVaultData: PendingVaultData | null;

  // Vault selection
  selectVault: (vault: Vault | null) => void;

  // Vault CRUD
  loadVaults: () => Promise<void>;
  createVault: (config: unknown, name: string, description: string) => void;
  saveVaultWithPassword: (password: string) => Promise<void>;
  deleteVault: (vaultId: string) => Promise<void>;
  saveVaultChanges: (password: string) => Promise<void>;
  exportVault: (password: string) => Promise<void>;
  importVault: () => Promise<void>;

  // Vault modifications
  updateSelectedVault: (updates: Partial<Vault>) => void;
  addBeneficiary: (beneficiary: Beneficiary) => void;
  removeBeneficiary: (index: number) => void;
  setOwnerKey: (pubkey: string) => void;

  // State setters
  setHasUnsavedChanges: (value: boolean) => void;
  setPendingVaultData: (data: PendingVaultData | null) => void;

  // Balance updates
  updateVaultBalances: (btcPrice: number, network: 'mainnet' | 'testnet') => Promise<void>;
  updateVaultUSDValues: (btcPrice: number) => void;
}

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingVaultData, setPendingVaultData] = useState<PendingVaultData | null>(null);

  const selectVault = useCallback((vault: Vault | null) => {
    setSelectedVault(vault);
  }, []);

  const loadVaults = useCallback(async () => {
    setIsLoading(true);

    if (isElectron && electronAPI) {
      try {
        const result = await electronAPI.vault.list();
        if (result.success && result.vaults) {
          const loadedVaults = result.vaults.map((meta: Record<string, unknown>) => ({
            id: meta.id,
            vault_id: meta.id,
            name: meta.name || 'Unnamed Vault',
            description: meta.description || '',
            balance: 0,
            balanceUSD: 0,
            address: meta.address || '',
            status: meta.status || 'pending',
            scriptType: meta.scriptType || 'timelock',
            lockDate: meta.lockDate || new Date().toISOString(),
            beneficiaries: meta.beneficiaries || [],
            ownerPubkey: meta.ownerPubkey || '',
            inactivityTrigger: meta.inactivityTrigger || 365,
            infrastructure: meta.infrastructure || ['local'],
            logic: meta.logic || { primary: 'timelock', gates: [] },
            modifiers: meta.modifiers || {}
          }));
          setVaults(loadedVaults);
        }
      } catch (e) {
        console.error('Failed to load vaults:', e);
      }
    }

    setIsLoading(false);
  }, []);

  const createVault = useCallback((config: unknown, name: string, description: string) => {
    const newVault: PendingVaultData = {
      vault_id: crypto.randomUUID(),
      name: name,
      description: description,
      balance: 0,
      balanceUSD: 0,
      scriptType: (config as { primaryLogic: string }).primaryLogic,
      lockDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      beneficiaries: [],
      status: 'pending',
      inactivityTrigger: 365,
      infrastructure: (config as { infrastructure: string[] }).infrastructure,
      logic: {
        primary: (config as { primaryLogic: 'timelock' | 'dead_man_switch' | 'multisig_decay' }).primaryLogic,
        gates: (config as { additionalGates: string[] }).additionalGates
      },
      modifiers: {
        staggered: (config as { modifiers: string[] }).modifiers.includes('staggered'),
        multiBeneficiary: (config as { modifiers: string[] }).modifiers.includes('multi_beneficiary'),
        decoy: (config as { modifiers: string[] }).modifiers.includes('decoy')
      }
    };

    if (isElectron && electronAPI) {
      setPendingVaultData(newVault);
    } else {
      // Web mode - just add to state
      setVaults(prev => [...prev, { ...newVault, id: newVault.vault_id } as Vault]);
    }
  }, []);

  const saveVaultWithPassword = useCallback(async (password: string) => {
    if (!pendingVaultData || !isElectron || !electronAPI) return;

    try {
      const result = await electronAPI.vault.create(pendingVaultData, password);
      if (result.success) {
        setVaults(prev => [...prev, {
          ...pendingVaultData,
          id: result.vaultId,
          vault_id: result.vaultId
        } as Vault]);
        setPendingVaultData(null);
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      console.error('Save error:', e);
      throw e;
    }
  }, [pendingVaultData]);

  const deleteVault = useCallback(async (vaultId: string) => {
    if (isElectron && electronAPI) {
      try {
        const result = await electronAPI.vault.delete(vaultId);
        if (result.success) {
          setVaults(prev => prev.filter(v => v.id !== vaultId && v.vault_id !== vaultId));
          setSelectedVault(null);
        } else {
          throw new Error(result.error);
        }
      } catch (e) {
        console.error('Delete error:', e);
        throw e;
      }
    } else {
      setVaults(prev => prev.filter(v => v.id !== vaultId));
      setSelectedVault(null);
    }
  }, []);

  const saveVaultChanges = useCallback(async (password: string) => {
    if (!selectedVault || !isElectron || !electronAPI) return;

    try {
      const result = await electronAPI.vault.update(
        selectedVault.vault_id || selectedVault.id,
        selectedVault,
        password
      );
      if (result.success) {
        setHasUnsavedChanges(false);
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      console.error('Save changes error:', e);
      throw e;
    }
  }, [selectedVault]);

  const exportVault = useCallback(async (password: string) => {
    if (!selectedVault || !isElectron || !electronAPI) return;

    try {
      const result = await electronAPI.vault.export(selectedVault.vault_id || selectedVault.id, password);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (e) {
      console.error('Export error:', e);
      throw e;
    }
  }, [selectedVault]);

  const importVault = useCallback(async () => {
    if (!isElectron || !electronAPI) return;

    try {
      const result = await electronAPI.vault.import();
      if (result.success) {
        await loadVaults();
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      console.error('Import error:', e);
      throw e;
    }
  }, [loadVaults]);

  const updateSelectedVault = useCallback((updates: Partial<Vault>) => {
    if (!selectedVault) return;

    const updatedVault = { ...selectedVault, ...updates };
    setVaults(prev => prev.map(v =>
      (v.id === selectedVault.id || v.vault_id === selectedVault.vault_id) ? updatedVault : v
    ));
    setSelectedVault(updatedVault);
    setHasUnsavedChanges(true);
  }, [selectedVault]);

  const addBeneficiary = useCallback((beneficiary: Beneficiary) => {
    if (!selectedVault) return;

    const updatedVault = {
      ...selectedVault,
      beneficiaries: [...selectedVault.beneficiaries, beneficiary]
    };
    setVaults(prev => prev.map(v =>
      (v.id === selectedVault.id || v.vault_id === selectedVault.vault_id) ? updatedVault : v
    ));
    setSelectedVault(updatedVault);
    setHasUnsavedChanges(true);
  }, [selectedVault]);

  const removeBeneficiary = useCallback((index: number) => {
    if (!selectedVault) return;

    const updatedBeneficiaries = selectedVault.beneficiaries.filter((_, i) => i !== index);
    const updatedVault = {
      ...selectedVault,
      beneficiaries: updatedBeneficiaries
    };
    setVaults(prev => prev.map(v =>
      (v.id === selectedVault.id || v.vault_id === selectedVault.vault_id) ? updatedVault : v
    ));
    setSelectedVault(updatedVault);
    setHasUnsavedChanges(true);
  }, [selectedVault]);

  const setOwnerKey = useCallback((pubkey: string) => {
    if (!selectedVault) return;

    const updatedVault = {
      ...selectedVault,
      ownerPubkey: pubkey,
      status: 'active' as const
    };
    setVaults(prev => prev.map(v =>
      (v.id === selectedVault.id || v.vault_id === selectedVault.vault_id) ? updatedVault : v
    ));
    setSelectedVault(updatedVault);
    setHasUnsavedChanges(true);
  }, [selectedVault]);

  const updateVaultBalances = useCallback(async (btcPrice: number, network: 'mainnet' | 'testnet') => {
    const updatedVaults = await Promise.all(
      vaults.map(async (vault) => {
        if (vault.address) {
          const balance = await fetchAddressBalance(vault.address, network);
          return {
            ...vault,
            balance,
            balanceUSD: balance * btcPrice
          };
        }
        return vault;
      })
    );
    setVaults(updatedVaults);
  }, [vaults]);

  const updateVaultUSDValues = useCallback((btcPrice: number) => {
    setVaults(prev => prev.map(v => ({
      ...v,
      balanceUSD: v.balance * btcPrice
    })));
  }, []);

  // Load vaults on mount
  useEffect(() => {
    loadVaults();
  }, [loadVaults]);

  return (
    <VaultContext.Provider value={{
      vaults,
      selectedVault,
      isLoading,
      hasUnsavedChanges,
      pendingVaultData,
      selectVault,
      loadVaults,
      createVault,
      saveVaultWithPassword,
      deleteVault,
      saveVaultChanges,
      exportVault,
      importVault,
      updateSelectedVault,
      addBeneficiary,
      removeBeneficiary,
      setOwnerKey,
      setHasUnsavedChanges,
      setPendingVaultData,
      updateVaultBalances,
      updateVaultUSDValues
    }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVaults() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVaults must be used within a VaultProvider');
  }
  return context;
}
