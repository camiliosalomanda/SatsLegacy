import React, { useState } from 'react';
import { Clock, X, Calendar } from 'lucide-react';
import { useVaults } from '../contexts/VaultContext';
import { useUI } from '../contexts/UIContext';

export function EditTimelockModal() {
  const { selectedVault, updateSelectedVault } = useVaults();
  const { closeModal } = useUI();

  const currentDate = selectedVault?.lockDate
    ? new Date(selectedVault.lockDate).toISOString().split('T')[0]
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [lockDate, setLockDate] = useState(currentDate);
  const [error, setError] = useState('');

  if (!selectedVault) return null;

  const handleSubmit = () => {
    const selectedDate = new Date(lockDate);
    const now = new Date();

    if (selectedDate <= now) {
      setError('Lock date must be in the future');
      return;
    }

    updateSelectedVault({ lockDate: selectedDate.toISOString() });
    closeModal();
  };

  // Calculate days from now
  const daysFromNow = Math.ceil((new Date(lockDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  // Quick select options
  const quickOptions = [
    { label: '6 months', days: 180 },
    { label: '1 year', days: 365 },
    { label: '2 years', days: 730 },
    { label: '5 years', days: 1825 },
  ];

  const setQuickDate = (days: number) => {
    const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setLockDate(date.toISOString().split('T')[0]);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Clock size={20} className="text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Edit Timelock</h2>
          </div>
          <button onClick={closeModal} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-zinc-400 text-sm">
            Set when heirs can claim the vault. The owner can always spend, but heirs must wait until this date.
          </p>

          {/* Quick select buttons */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Quick Select</label>
            <div className="grid grid-cols-4 gap-2">
              {quickOptions.map(({ label, days }) => (
                <button
                  key={days}
                  onClick={() => setQuickDate(days)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date picker */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Lock Until Date</label>
            <div className="relative">
              <input
                type="date"
                value={lockDate}
                onChange={(e) => { setLockDate(e.target.value); setError(''); }}
                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
              />
              <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          {/* Days summary */}
          <div className="p-4 bg-zinc-800/50 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Time until unlock:</span>
              <span className="text-2xl font-bold text-orange-400">{daysFromNow > 0 ? daysFromNow : 0} days</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Heirs will be able to claim after {new Date(lockDate).toLocaleDateString()}
            </p>
          </div>

          {/* Warning for dead man's switch */}
          {selectedVault.logic?.primary === 'dead_man_switch' && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-300">
                <strong>Note:</strong> For Dead Man's Switch vaults, the inactivity period is more relevant than a fixed date.
                The heir can claim after {selectedVault.inactivityTrigger || 90} days of owner inactivity.
              </p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Clock size={18} />
            Update Timelock
          </button>
        </div>
      </div>
    </div>
  );
}
