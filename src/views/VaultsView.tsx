import React from 'react';
import { Plus, Download } from 'lucide-react';
import { useVaults } from '../contexts/VaultContext';
import { useUI } from '../contexts/UIContext';
import { VaultCard } from '../components/vault/VaultCard';

export function VaultsView() {
  const { vaults, importVault } = useVaults();
  const { setShowCreateWizard } = useUI();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Your Vaults</h2>
          <p className="text-zinc-500">Manage your inheritance vaults</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            New Vault
          </button>
          <button
            onClick={() => importVault()}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 font-medium rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <Download size={18} />
            Import Vault
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vaults.map(vault => (
          <VaultCard key={vault.id || vault.vault_id} vault={vault} showDelete={true} />
        ))}

        <div
          onClick={() => setShowCreateWizard(true)}
          className="bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-2xl p-6 cursor-pointer hover:border-orange-500/50 transition-all duration-300 flex flex-col items-center justify-center min-h-[250px] group"
        >
          <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4 group-hover:bg-orange-500/10 transition-colors">
            <Plus size={32} className="text-zinc-600 group-hover:text-orange-400 transition-colors" />
          </div>
          <p className="text-zinc-500 group-hover:text-zinc-300 transition-colors">Create New Vault</p>
          <p className="text-xs text-zinc-600 mt-1">Set up your inheritance plan</p>
        </div>
      </div>
    </div>
  );
}
