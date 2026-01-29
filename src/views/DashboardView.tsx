import React from 'react';
import { Wallet, Shield, Users, Plus, Clock, RefreshCw } from 'lucide-react';
import { useVaults } from '../contexts/VaultContext';
import { usePrice } from '../contexts/PriceContext';
import { useUI } from '../contexts/UIContext';
import { getTotalBTC, getTotalBeneficiaries } from '../utils/vault-helpers';

export function DashboardView() {
  const { vaults } = useVaults();
  const { btcPrice, priceLoading, refreshPrice } = usePrice();
  const { setCurrentView, setShowCreateWizard } = useUI();

  const totalBTC = getTotalBTC(vaults);
  const totalUSD = totalBTC * btcPrice;
  const totalBeneficiaries = getTotalBeneficiaries(vaults);

  const handleTileClick = () => {
    setCurrentView('vaults');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Welcome back</h2>
          <p className="text-zinc-500">Your Bitcoin legacy is secure</p>
        </div>
        <button
          onClick={refreshPrice}
          disabled={priceLoading}
          className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white transition-colors"
        >
          <RefreshCw size={16} className={priceLoading ? 'animate-spin' : ''} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={handleTileClick}
          className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6 cursor-pointer hover:border-orange-500/50 hover:bg-zinc-900/80 transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Wallet size={20} className="text-orange-400" />
            </div>
            <span className="text-zinc-500">Total Holdings</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalBTC.toFixed(4)} <span className="text-lg text-zinc-500">BTC</span></p>
          <p className="text-sm text-zinc-500 mt-1">${totalUSD.toLocaleString()} USD</p>
        </div>

        <div
          onClick={handleTileClick}
          className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6 cursor-pointer hover:border-green-500/50 hover:bg-zinc-900/80 transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Shield size={20} className="text-green-400" />
            </div>
            <span className="text-zinc-500">Active Vaults</span>
          </div>
          <p className="text-3xl font-bold text-white">{vaults.length}</p>
          <p className="text-sm text-zinc-500 mt-1">{vaults.length > 0 ? 'All secure & monitored' : 'Create your first vault'}</p>
        </div>

        <div
          onClick={handleTileClick}
          className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6 cursor-pointer hover:border-purple-500/50 hover:bg-zinc-900/80 transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Users size={20} className="text-purple-400" />
            </div>
            <span className="text-zinc-500">Beneficiaries</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalBeneficiaries}</p>
          <p className="text-sm text-zinc-500 mt-1">Across all vaults</p>
        </div>
      </div>

      {vaults.length === 0 && (
        <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Shield size={28} className="text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Get Started</h3>
              <p className="text-zinc-400 text-sm">Create your first inheritance vault to secure your Bitcoin legacy</p>
            </div>
            <button
              onClick={() => setShowCreateWizard(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              <Plus size={18} />
              Create Vault
            </button>
          </div>
        </div>
      )}

      <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        {vaults.length > 0 ? (
          <div className="space-y-3">
            {vaults.slice(0, 3).map((vault, index) => (
              <div key={vault.id || vault.vault_id || `vault-${index}`} className="flex items-center gap-4 py-3 border-b border-zinc-800/50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Shield size={16} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-zinc-300">Vault "{vault.name}" created</p>
                  <p className="text-xs text-zinc-600">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500">
            <Clock size={32} className="mx-auto mb-2 opacity-50" />
            <p>No activity yet</p>
            <p className="text-sm">Create a vault to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
