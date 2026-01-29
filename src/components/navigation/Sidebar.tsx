import React from 'react';
import { ChevronRight, Home, Lock, FileText, PieChart, BookOpen, Settings } from 'lucide-react';
import { NavItem } from './NavItem';
import { useVaults } from '../../contexts/VaultContext';
import { useSettings } from '../../contexts/SettingsContext';
import { usePrice } from '../../contexts/PriceContext';
import { useUI } from '../../contexts/UIContext';

const isElectron = typeof window !== 'undefined' && window.isElectron;

export function Sidebar() {
  const { vaults } = useVaults();
  const { settings } = useSettings();
  const { btcPrice, priceLoading } = usePrice();
  const { openModal } = useUI();

  return (
    <div className="w-64 bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-800 p-4 flex flex-col">
      {/* Back to Landing (web only) */}
      {!isElectron && (
        <button
          onClick={() => { localStorage.removeItem('SatsLegacy:visited'); window.location.reload(); }}
          className="flex items-center gap-2 px-2 py-2 mb-4 text-zinc-500 hover:text-white transition-colors text-sm"
        >
          <ChevronRight size={16} className="rotate-180" />
          Back to Home
        </button>
      )}

      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <img src="./logo.jpg" alt="SatsLegacy" className="w-10 h-10 rounded-full" />
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">SatsLegacy</h1>
          <p className="text-xs text-zinc-500">Sovereign Inheritance</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 flex-1">
        <NavItem icon={Home} label="Dashboard" view="dashboard" />
        <NavItem icon={Lock} label="Vaults" view="vaults" badge={vaults.length} />
        <NavItem icon={FileText} label="Legal Docs" view="legal" />
        <NavItem icon={PieChart} label="Simulator" view="simulator" />
        <NavItem icon={BookOpen} label="Learn" view="learn" />
      </nav>

      {/* Network Status */}
      <div className="mt-auto pt-4 border-t border-zinc-800">
        <div className="px-2 py-3 rounded-lg bg-zinc-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">Network</span>
            <span className={`text-xs font-medium ${settings.torEnabled ? 'text-purple-400' : 'text-green-400'}`}>
              {settings.torEnabled ? '🧅 Tor Active' : '● Connected'}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">BTC Price</span>
            <span className="text-xs text-zinc-300 font-mono">
              {priceLoading ? '...' : `$${btcPrice.toLocaleString()}`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Mode</span>
            <span className="text-xs text-zinc-300 capitalize">{settings.network}</span>
          </div>
        </div>
        <button
          onClick={() => openModal({ type: 'settings' })}
          className="w-full mt-2 flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Settings size={18} />
          <span className="text-sm">Settings</span>
        </button>
      </div>
    </div>
  );
}
