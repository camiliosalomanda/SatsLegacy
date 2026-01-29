import React from 'react';
import { Lock, Unlock, ChevronRight, Users, Trash2 } from 'lucide-react';
import { useVaults } from '../../contexts/VaultContext';
import { useUI } from '../../contexts/UIContext';
import { getDaysUntilUnlock } from '../../utils/vault-helpers';
import type { Vault } from '../../types/vault';

interface VaultCardProps {
  vault: Vault;
  showDelete?: boolean;
}

export function VaultCard({ vault, showDelete = false }: VaultCardProps) {
  const { selectVault } = useVaults();
  const { openModal } = useUI();

  const daysUntil = getDaysUntilUnlock(vault);
  const progress = vault.scriptType === 'timelock'
    ? Math.min(100, ((730 - daysUntil) / 730) * 100)
    : Math.min(100, ((vault.inactivityTrigger || 365 - daysUntil) / (vault.inactivityTrigger || 365)) * 100);

  const getInfraBadges = () => {
    if (!vault.infrastructure) return null;
    return (
      <div className="flex gap-1 mt-2">
        {vault.infrastructure.includes('shamir') && (
          <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">Shamir</span>
        )}
        {vault.infrastructure.includes('nostr') && (
          <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">Nostr</span>
        )}
        {vault.logic?.gates?.includes('challenge') && (
          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Challenge</span>
        )}
        {vault.logic?.gates?.includes('duress') && (
          <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">Duress</span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/50 transition-all duration-300 group relative">
      {showDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); openModal({ type: 'delete', vault }); }}
          className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-800/80 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
          title="Delete vault"
        >
          <Trash2 size={16} />
        </button>
      )}

      <div onClick={() => selectVault(vault)} className="cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 flex items-center justify-center">
              {vault.status === 'active' ? <Lock size={24} className="text-orange-400" /> : <Unlock size={24} className="text-green-400" />}
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">{vault.name}</h3>
              <p className="text-xs text-zinc-500 capitalize">{vault.logic?.primary || vault.scriptType} Script</p>
              {getInfraBadges()}
            </div>
          </div>
          <ChevronRight size={20} className="text-zinc-600 group-hover:text-orange-400 transition-colors mt-2" />
        </div>

        <div className="mb-4">
          <p className="text-3xl font-bold text-white">{vault.balance.toFixed(8)} <span className="text-lg text-zinc-500">BTC</span></p>
          <p className="text-sm text-zinc-500">${vault.balanceUSD.toLocaleString()} USD</p>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-zinc-500">Time Lock Progress</span>
            <span className="text-orange-400 font-medium">{daysUntil} days remaining</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Users size={14} className="text-zinc-500" />
          <span className="text-xs text-zinc-500">{vault.beneficiaries.length} beneficiaries</span>
          <div className="flex -space-x-2 ml-auto">
            {vault.beneficiaries.slice(0, 3).map((b, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border-2 border-zinc-900 flex items-center justify-center">
                <span className="text-[10px] text-zinc-400">{b.name.charAt(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
