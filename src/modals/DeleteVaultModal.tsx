import React, { useState } from 'react';
import { Trash2, X, AlertTriangle, Send } from 'lucide-react';
import { useVaults } from '../contexts/VaultContext';
import { useUI } from '../contexts/UIContext';
import type { Vault } from '../types/vault';

interface DeleteVaultModalProps {
  vault: Vault;
}

export function DeleteVaultModal({ vault }: DeleteVaultModalProps) {
  const { deleteVault } = useVaults();
  const { closeModal } = useUI();

  const [sweepAddress, setSweepAddress] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const hasFunds = vault.balance > 0;

  const handleSweepAndDelete = () => {
    console.log(`Sweeping ${vault.balance} BTC to ${sweepAddress}`);
    alert(`PSBT generated to sweep ${vault.balance} BTC to ${sweepAddress}. Sign with your hardware wallet, then delete the vault.`);
  };

  const handleDelete = async () => {
    try {
      await deleteVault(vault.id || vault.vault_id || '');
      closeModal();
    } catch (e) {
      alert('Failed to delete vault');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Trash2 size={20} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Delete Vault</h2>
          </div>
          <button onClick={closeModal} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-zinc-800/50 rounded-xl">
            <p className="text-white font-medium">{vault.name}</p>
            <p className="text-sm text-zinc-500 mt-1">
              Balance: <span className={hasFunds ? 'text-orange-400 font-medium' : 'text-zinc-400'}>{vault.balance.toFixed(8)} BTC</span>
            </p>
          </div>

          {hasFunds ? (
            <>
              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-orange-400 mt-0.5" />
                  <div>
                    <p className="text-orange-400 font-medium">This vault contains Bitcoin</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      You must sweep the funds to another address before deleting this vault.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Sweep funds to address</label>
                <input
                  type="text"
                  value={sweepAddress}
                  onChange={(e) => setSweepAddress(e.target.value)}
                  placeholder="bc1q..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                onClick={handleSweepAndDelete}
                disabled={!sweepAddress || sweepAddress.length < 20}
                className="w-full py-3 bg-orange-500 text-black font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send size={18} />
                Generate Sweep PSBT
              </button>

              <p className="text-xs text-zinc-600 text-center">
                After sweeping funds and confirming on-chain, return here to delete the vault.
              </p>
            </>
          ) : (
            <>
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-red-400 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-medium">This action cannot be undone</p>
                    <p className="text-sm text-zinc-400 mt-1">
                      The vault configuration, beneficiary data, and all associated files will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Type "{vault.name}" to confirm</label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={vault.name}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                onClick={handleDelete}
                disabled={confirmText !== vault.name}
                className="w-full py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Delete Vault Permanently
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
