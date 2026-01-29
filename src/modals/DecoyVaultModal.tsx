import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Eye, Loader2, AlertTriangle, Check, Wallet } from 'lucide-react';
import { useUI } from '../contexts/UIContext';

const electronAPI = typeof window !== 'undefined' ? window.electronAPI : null;

interface DecoyVault {
  vault_id: string;
  name: string;
  description?: string;
  address?: string;
  balance: number;
  balanceUSD: number;
  lockDate?: string;
  isDecoy: boolean;
}

export function DecoyVaultModal() {
  const { closeModal } = useUI();
  const [decoyVaults, setDecoyVaults] = useState<DecoyVault[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New vault form state
  const [newVaultName, setNewVaultName] = useState('');
  const [newVaultBalance, setNewVaultBalance] = useState('0.05');
  const [newVaultAddress, setNewVaultAddress] = useState('');

  useEffect(() => {
    loadDecoyVaults();
  }, []);

  const loadDecoyVaults = async () => {
    setIsLoading(true);
    try {
      const result = await electronAPI?.duress.getDecoyVaults();
      if (result?.success && result.vaults) {
        setDecoyVaults(result.vaults);
      }
    } catch (e) {
      console.error('Failed to load decoy vaults:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDecoy = async () => {
    if (!newVaultName.trim()) return;

    setIsCreating(true);
    try {
      const vault = {
        vault_id: crypto.randomUUID(),
        name: newVaultName.trim(),
        description: 'Decoy vault for duress protection',
        address: newVaultAddress.trim() || generateFakeAddress(),
        balance: parseFloat(newVaultBalance) || 0.05,
        balanceUSD: (parseFloat(newVaultBalance) || 0.05) * 100000, // Approximate
        lockDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        beneficiaries: [
          { name: 'Heir', percentage: 100, pubkey: '' }
        ]
      };

      const result = await electronAPI?.duress.createDecoyVault(vault);
      if (result?.success) {
        await loadDecoyVaults();
        setShowCreateForm(false);
        setNewVaultName('');
        setNewVaultBalance('0.05');
        setNewVaultAddress('');
      }
    } catch (e) {
      console.error('Failed to create decoy vault:', e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDecoy = async (vaultId: string) => {
    try {
      const result = await electronAPI?.duress.deleteDecoyVault(vaultId);
      if (result?.success) {
        setDecoyVaults(prev => prev.filter(v => v.vault_id !== vaultId));
      }
    } catch (e) {
      console.error('Failed to delete decoy vault:', e);
    }
  };

  // Generate a realistic-looking fake Bitcoin address
  const generateFakeAddress = () => {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let addr = 'bc1q';
    for (let i = 0; i < 38; i++) {
      addr += chars[Math.floor(Math.random() * chars.length)];
    }
    return addr;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Eye size={20} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Decoy Vaults</h2>
              <p className="text-sm text-zinc-500">Fake vaults shown under duress</p>
            </div>
          </div>
          <button onClick={closeModal} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Info box */}
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-yellow-400 mt-0.5" />
              <div className="text-sm text-zinc-400">
                <p className="text-yellow-400 font-medium mb-1">Important</p>
                <p>Decoy vaults should look believable. Use realistic names and small balances that an attacker might believe are your real holdings.</p>
              </div>
            </div>
          </div>

          {/* Security Notes */}
          <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
            <p className="text-xs text-zinc-500 font-medium mb-2">🔐 SECURITY NOTES</p>
            <ul className="text-xs text-zinc-500 space-y-1">
              <li>• Decoy vaults are stored separately from real vault data</li>
              <li>• Displayed when duress password is entered at login</li>
              <li>• Use believable amounts (0.01-0.1 BTC) - too high looks suspicious</li>
              <li>• Keep real backups in secure offsite locations</li>
              <li>• Practice accessing duress mode so it's natural under stress</li>
            </ul>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-zinc-500" />
            </div>
          ) : (
            <>
              {/* Existing decoy vaults */}
              {decoyVaults.length > 0 ? (
                <div className="space-y-3">
                  {decoyVaults.map(vault => (
                    <div
                      key={vault.vault_id}
                      className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl"
                    >
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Wallet size={20} className="text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{vault.name}</p>
                        <p className="text-sm text-zinc-500">{vault.balance.toFixed(8)} BTC</p>
                      </div>
                      <button
                        onClick={() => handleDeleteDecoy(vault.vault_id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={18} className="text-zinc-500 hover:text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  <Eye size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No decoy vaults configured</p>
                  <p className="text-sm">Add decoy vaults to show under duress</p>
                </div>
              )}

              {/* Create new decoy vault */}
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full py-3 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Add Decoy Vault
                </button>
              ) : (
                <div className="p-4 bg-zinc-800/50 rounded-xl space-y-4">
                  <h3 className="text-white font-medium">New Decoy Vault</h3>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Vault Name</label>
                    <input
                      type="text"
                      value={newVaultName}
                      onChange={(e) => setNewVaultName(e.target.value)}
                      placeholder="e.g., Savings, Emergency Fund"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Fake Balance (BTC)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={newVaultBalance}
                      onChange={(e) => setNewVaultBalance(e.target.value)}
                      placeholder="0.05"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                    <p className="text-xs text-zinc-600 mt-1">Use a believable amount (not too high)</p>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Address (optional)</label>
                    <input
                      type="text"
                      value={newVaultAddress}
                      onChange={(e) => setNewVaultAddress(e.target.value)}
                      placeholder="Leave empty to auto-generate"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewVaultName('');
                        setNewVaultBalance('0.05');
                        setNewVaultAddress('');
                      }}
                      className="flex-1 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateDecoy}
                      disabled={isCreating || !newVaultName.trim()}
                      className="flex-1 py-2 bg-orange-500 text-black font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          Create Decoy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-zinc-800">
          <button
            onClick={closeModal}
            className="w-full py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
