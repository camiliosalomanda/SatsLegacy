import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { useVaults } from '../contexts/VaultContext';
import { useUI } from '../contexts/UIContext';

export function ExportModal() {
  const { exportVault } = useVaults();
  const { closeModal } = useUI();

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleExport = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      await exportVault(password);
      alert('Vault exported successfully');
      closeModal();
    } catch (e) {
      setError('Export failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Download size={20} className="text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Export Vault</h2>
          </div>
          <button onClick={closeModal} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-zinc-400 text-sm">
            Enter your vault password to export an encrypted backup file. This file can be imported on another device.
          </p>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Vault Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter your vault password"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleExport}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Export Encrypted Backup
          </button>
        </div>
      </div>
    </div>
  );
}
