import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Vault, Beneficiary, PendingVaultData } from '../types/vault';
import type { NetworkType } from '../types/settings';
import { fetchAddressBalance } from '../utils/api/blockchain';
import { generateVaultAddress, dateToBlockHeight } from '../vault/scripts/bitcoin-address';
import type { VaultConfiguration } from '../vault/creation/validation/compatibility';
import { useSettings } from './SettingsContext';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.isElectron;
const electronAPI = typeof window !== 'undefined' ? window.electronAPI : null;

// Helper to get the canonical vault ID (handles id/vault_id confusion)
function getVaultId(vault: Vault | { id?: string; vault_id?: string }): string {
  return vault.vault_id || vault.id || '';
}

// Helper to check if two vaults have the same ID
function isSameVault(a: Vault | null, b: Vault | { id?: string; vault_id?: string }): boolean {
  if (!a) return false;
  const aId = getVaultId(a);
  const bId = getVaultId(b);
  return aId !== '' && aId === bId;
}

interface VaultContextValue {
  // State
  vaults: Vault[];
  selectedVault: Vault | null;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  pendingVaultData: PendingVaultData | null;
  isDuressMode: boolean;

  // Vault selection
  selectVault: (vault: Vault | null) => void;

  // Vault CRUD
  loadVaults: () => Promise<void>;
  loadVaultsWithPassword: (password: string) => Promise<{ isDuress: boolean }>;
  createVault: (config: VaultConfiguration, name: string, description: string) => void;
  saveVaultWithPassword: (password: string) => Promise<void>;
  deleteVault: (vaultId: string) => Promise<void>;
  saveVaultChanges: (password: string) => Promise<void>;
  exportVault: (password: string) => Promise<void>;
  importVault: () => Promise<void>;

  // Vault modifications
  updateSelectedVault: (updates: Partial<Vault>) => void;
  addBeneficiary: (beneficiary: Beneficiary) => void;
  updateBeneficiary: (index: number, beneficiary: Beneficiary) => void;
  removeBeneficiary: (index: number) => void;
  setOwnerKey: (pubkey: string) => void;

  // State setters
  setHasUnsavedChanges: (value: boolean) => void;
  setPendingVaultData: (data: PendingVaultData | null) => void;

  // Balance updates
  updateVaultBalances: (btcPrice: number, network: NetworkType) => Promise<void>;
  updateVaultUSDValues: (btcPrice: number) => void;

  // Duress mode
  exitDuressMode: () => void;
}

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingVaultData, setPendingVaultData] = useState<PendingVaultData | null>(null);
  const [isDuressMode, setIsDuressMode] = useState(false);

  const selectVault = useCallback((vault: Vault | null) => {
    setSelectedVault(vault);
    // When a vault is unlocked/selected with full data, update it in the list
    // and fetch its balance immediately
    if (vault && vault.address) {
      const vaultId = getVaultId(vault);
      const network = settings.network || 'mainnet';
      fetchAddressBalance(vault.address, network).then(balance => {
        // Guard: only update if this vault is still selected (prevents race condition
        // when user rapidly selects different vaults)
        setSelectedVault(current => {
          if (current && getVaultId(current) === vaultId) {
            return { ...vault, balance };
          }
          return current;
        });
        setVaults(prev => prev.map(v =>
          getVaultId(v) === vaultId ? { ...v, ...vault, balance } : v
        ));
      }).catch(() => {
        setVaults(prev => prev.map(v =>
          getVaultId(v) === vaultId ? { ...v, ...vault } : v
        ));
      });
    }
  }, [settings.network]);

  const loadVaults = useCallback(async () => {
    setIsLoading(true);

    if (isElectron && electronAPI) {
      try {
        const result = await electronAPI.vault.list();
        if (result.success && result.vaults) {
          // Meta now contains minimal data - sensitive fields require unlock
          const loadedVaults = result.vaults.map((meta: Record<string, unknown>) => ({
            id: meta.vault_id,
            vault_id: meta.vault_id,
            name: meta.name || 'Unnamed Vault',
            description: meta.description || '',
            balance: 0,
            balanceUSD: 0,
            address: '', // Requires unlock
            status: meta.status || 'pending',
            scriptType: (meta.logic as { primary?: string })?.primary || 'timelock',
            lockDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            beneficiaries: [], // Requires unlock - meta only has count
            ownerPubkey: '', // Requires unlock
            inactivityTrigger: 365,
            infrastructure: ['local'],
            logic: meta.logic || { primary: 'timelock', gates: [] },
            modifiers: {},
            // Flags from meta for UI display
            _hasOwnerKey: meta.hasOwnerKey || false,
            _hasAddress: meta.hasAddress || false,
            _beneficiaryCount: meta.beneficiaryCount || 0,
            _needsUnlock: true
          }));
          setVaults(loadedVaults);
        }
      } catch (e) {
        console.error('Failed to load vaults:', e);
      }
    }

    setIsLoading(false);
  }, []);

  // Load vaults with duress password check
  const loadVaultsWithPassword = useCallback(async (password: string): Promise<{ isDuress: boolean }> => {
    if (!isElectron || !electronAPI) {
      await loadVaults();
      return { isDuress: false };
    }

    setIsLoading(true);

    try {
      // Check if this is a duress password
      const duressCheck = await electronAPI.duress.checkPassword(password);

      if (duressCheck.success && duressCheck.isDuress) {
        // Load settings to check duress action
        const settingsResult = await electronAPI.settings.load();
        const settings = settingsResult.settings;
        const duressAction = settings?.duress?.action || 'show_decoy';

        // Execute duress action
        if (duressAction === 'wipe_only') {
          // Wipe all vaults and show empty state
          await electronAPI.duress.executeWipe();
          setVaults([]);
          setIsDuressMode(true);
        } else if (duressAction === 'show_decoy_and_wipe') {
          // Wipe real vaults and show decoy
          await electronAPI.duress.executeWipe();
          const decoyResult = await electronAPI.duress.getDecoyVaults();
          if (decoyResult.success && decoyResult.vaults) {
            const decoyVaults = decoyResult.vaults.map((meta: Record<string, unknown>) => ({
              id: meta.vault_id,
              vault_id: meta.vault_id,
              name: meta.name || 'Vault',
              description: meta.description || '',
              balance: meta.balance || 0,
              balanceUSD: meta.balanceUSD || 0,
              address: meta.address || '',
              status: 'active',
              scriptType: 'timelock',
              lockDate: meta.lockDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              beneficiaries: meta.beneficiaries || [],
              ownerPubkey: '',
              isDecoy: true
            }));
            setVaults(decoyVaults as Vault[]);
          }
          setIsDuressMode(true);
        } else {
          // Just show decoy vaults (default)
          const decoyResult = await electronAPI.duress.getDecoyVaults();
          if (decoyResult.success && decoyResult.vaults) {
            const decoyVaults = decoyResult.vaults.map((meta: Record<string, unknown>) => ({
              id: meta.vault_id,
              vault_id: meta.vault_id,
              name: meta.name || 'Vault',
              description: meta.description || '',
              balance: meta.balance || 0,
              balanceUSD: meta.balanceUSD || 0,
              address: meta.address || '',
              status: 'active',
              scriptType: 'timelock',
              lockDate: meta.lockDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              beneficiaries: meta.beneficiaries || [],
              ownerPubkey: '',
              isDecoy: true
            }));
            setVaults(decoyVaults as Vault[]);
          }
          setIsDuressMode(true);
        }

        // Send silent alert if configured
        if (settings?.duress?.silentAlert) {
          electronAPI.duress.sendSilentAlert().catch(() => {
            // Silent failure - don't alert attacker
          });
        }

        setIsLoading(false);
        return { isDuress: true };
      }

      // Normal password - load real vaults
      await loadVaults();
      setIsDuressMode(false);
      return { isDuress: false };
    } catch (e) {
      console.error('Failed to check duress password:', e);
      await loadVaults();
      setIsLoading(false);
      return { isDuress: false };
    }
  }, [loadVaults]);

  const exitDuressMode = useCallback(() => {
    setIsDuressMode(false);
    setVaults([]);
    setSelectedVault(null);
  }, []);

  const createVault = useCallback((config: VaultConfiguration, name: string, description: string) => {
    const newVault: PendingVaultData = {
      vault_id: crypto.randomUUID(),
      name: name,
      description: description,
      balance: 0,
      balanceUSD: 0,
      scriptType: config.primaryLogic,
      lockDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      beneficiaries: [],
      status: 'pending',
      inactivityTrigger: 365,
      infrastructure: config.infrastructure,
      logic: {
        primary: config.primaryLogic,
        gates: config.additionalGates
      },
      modifiers: {
        staggered: config.modifiers.includes('staggered'),
        multiBeneficiary: config.modifiers.includes('multi_beneficiary'),
        decoy: config.modifiers.includes('decoy')
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
          setVaults(prev => prev.filter(v => getVaultId(v) !== vaultId));
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
        getVaultId(selectedVault),
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
      const result = await electronAPI.vault.export(getVaultId(selectedVault), password);
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

  // Helper to generate vault address when keys are available
  // Returns { address, witnessScript } or null if can't generate
  // Uses network from settings context
  const tryGenerateVaultScript = useCallback((vault: Vault): { address: string; witnessScript?: string } | null => {
    if (!vault.ownerPubkey || vault.beneficiaries.length === 0) {
      return null;
    }

    // Get network from settings, default to mainnet
    const network = settings.network || 'mainnet';

    try {
      const heirPubkeys = vault.beneficiaries.map(b => b.pubkey);

      const result = generateVaultAddress(
        {
          logic: vault.logic || { primary: 'timelock' },
          ownerPubkey: vault.ownerPubkey,
          heirPubkeys,
          locktime: vault.lockDate ? dateToBlockHeight(vault.lockDate) : undefined,
          inactivityDays: vault.inactivityTrigger,
        },
        network
      );
      return { address: result.address, witnessScript: result.script };
    } catch (e) {
      console.error('[tryGenerateVaultScript] Failed:', e);
      return null;
    }
  }, [settings.network]);

  const addBeneficiary = useCallback((beneficiary: Beneficiary) => {
    if (!selectedVault) return;

    const updatedBeneficiaries = [...selectedVault.beneficiaries, beneficiary];
    const tempVault = { ...selectedVault, beneficiaries: updatedBeneficiaries };
    const scriptResult = tryGenerateVaultScript(tempVault);

    const updatedVault = {
      ...selectedVault,
      beneficiaries: updatedBeneficiaries,
      address: scriptResult?.address || selectedVault.address,
      witnessScript: scriptResult?.witnessScript || selectedVault.witnessScript
    };
    setVaults(prev => prev.map(v =>
      isSameVault(selectedVault, v) ? updatedVault : v
    ));
    setSelectedVault(updatedVault);
    setHasUnsavedChanges(true);
  }, [selectedVault, tryGenerateVaultScript]);

  const updateBeneficiary = useCallback((index: number, beneficiary: Beneficiary) => {
    if (!selectedVault) return;

    const updatedBeneficiaries = selectedVault.beneficiaries.map((b, i) =>
      i === index ? beneficiary : b
    );
    const tempVault = { ...selectedVault, beneficiaries: updatedBeneficiaries };
    const scriptResult = tryGenerateVaultScript(tempVault);

    const updatedVault = {
      ...selectedVault,
      beneficiaries: updatedBeneficiaries,
      address: scriptResult?.address || selectedVault.address,
      witnessScript: scriptResult?.witnessScript || selectedVault.witnessScript
    };
    setVaults(prev => prev.map(v =>
      isSameVault(selectedVault, v) ? updatedVault : v
    ));
    setSelectedVault(updatedVault);
    setHasUnsavedChanges(true);
  }, [selectedVault, tryGenerateVaultScript]);

  const removeBeneficiary = useCallback((index: number) => {
    if (!selectedVault) return;

    const updatedBeneficiaries = selectedVault.beneficiaries.filter((_, i) => i !== index);
    const tempVault = { ...selectedVault, beneficiaries: updatedBeneficiaries };
    const scriptResult = updatedBeneficiaries.length > 0 ? tryGenerateVaultScript(tempVault) : null;

    const updatedVault = {
      ...selectedVault,
      beneficiaries: updatedBeneficiaries,
      address: scriptResult?.address || '',
      witnessScript: scriptResult?.witnessScript
    };
    setVaults(prev => prev.map(v =>
      isSameVault(selectedVault, v) ? updatedVault : v
    ));
    setSelectedVault(updatedVault);
    setHasUnsavedChanges(true);
  }, [selectedVault, tryGenerateVaultScript]);

  const setOwnerKey = useCallback((pubkey: string) => {
    if (!selectedVault) return;

    const tempVault = { ...selectedVault, ownerPubkey: pubkey };
    const scriptResult = tryGenerateVaultScript(tempVault);

    const updatedVault = {
      ...selectedVault,
      ownerPubkey: pubkey,
      status: 'active' as const,
      address: scriptResult?.address || selectedVault.address,
      witnessScript: scriptResult?.witnessScript || selectedVault.witnessScript
    };
    setVaults(prev => prev.map(v =>
      isSameVault(selectedVault, v) ? updatedVault : v
    ));
    setSelectedVault(updatedVault);
    setHasUnsavedChanges(true);
  }, [selectedVault, tryGenerateVaultScript]);

  const updateSelectedVault = useCallback((updates: Partial<Vault>) => {
    if (!selectedVault) return;

    const updatedVault = { ...selectedVault, ...updates };

    // Regenerate address if lockDate or inactivityTrigger changed
    if (updates.lockDate !== undefined || updates.inactivityTrigger !== undefined) {
      const scriptResult = tryGenerateVaultScript(updatedVault);
      if (scriptResult) {
        updatedVault.address = scriptResult.address;
        updatedVault.witnessScript = scriptResult.witnessScript;
      }
    }

    setVaults(prev => prev.map(v =>
      isSameVault(selectedVault, v) ? updatedVault : v
    ));
    setSelectedVault(updatedVault);
    setHasUnsavedChanges(true);
  }, [selectedVault, tryGenerateVaultScript]);

  const updateVaultBalances = useCallback(async (btcPrice: number, network: NetworkType) => {
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
      isDuressMode,
      selectVault,
      loadVaults,
      loadVaultsWithPassword,
      createVault,
      saveVaultWithPassword,
      deleteVault,
      saveVaultChanges,
      exportVault,
      importVault,
      updateSelectedVault,
      addBeneficiary,
      updateBeneficiary,
      removeBeneficiary,
      setOwnerKey,
      setHasUnsavedChanges,
      setPendingVaultData,
      updateVaultBalances,
      updateVaultUSDValues,
      exitDuressMode
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
