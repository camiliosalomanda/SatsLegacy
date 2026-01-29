import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useUI } from '../../contexts/UIContext';
import { useVaults } from '../../contexts/VaultContext';
import type { ViewName } from '../../types/ui';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  view: ViewName;
  badge?: number;
}

export function NavItem({ icon: Icon, label, view, badge }: NavItemProps) {
  const { currentView, setCurrentView } = useUI();
  const { selectVault } = useVaults();

  const handleClick = () => {
    setCurrentView(view);
    selectVault(null);
  };

  const isActive = currentView === view;

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-orange-400 border border-orange-500/30'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
      {badge !== undefined && (
        <span className="ml-auto bg-orange-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}
