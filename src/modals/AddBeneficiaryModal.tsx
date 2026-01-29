import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { useVaults } from '../contexts/VaultContext';
import { useUI } from '../contexts/UIContext';

export function AddBeneficiaryModal() {
  const { selectedVault, addBeneficiary } = useVaults();
  const { closeModal } = useUI();

  const [name, setName] = useState('');
  const [percentage, setPercentage] = useState('');
  const [pubkey, setPubkey] = useState('');
  const [error, setError] = useState('');

  const currentTotal = selectedVault?.beneficiaries.reduce((sum, b) => sum + b.percentage, 0) || 0;
  const maxPercentage = 100 - currentTotal;

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    const pct = parseInt(percentage);
    if (isNaN(pct) || pct <= 0 || pct > maxPercentage) {
      setError('Percentage must be between 1 and ' + maxPercentage);
      return;
    }
    if (!pubkey.trim()) {
      setError('Public key or xpub is required');
      return;
    }

    addBeneficiary({
      name: name.trim(),
      percentage: pct,
      pubkey: pubkey.trim()
    });
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <UserPlus size={20} className="text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Add Beneficiary</h2>
          </div>
          <button onClick={closeModal} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g., Sarah (Daughter)"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Percentage ({maxPercentage}% remaining)</label>
            <input
              type="number"
              value={percentage}
              onChange={(e) => { setPercentage(e.target.value); setError(''); }}
              placeholder="e.g., 50"
              min="1"
              max={maxPercentage}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Public Key or xpub</label>
            <input
              type="text"
              value={pubkey}
              onChange={(e) => { setPubkey(e.target.value); setError(''); }}
              placeholder="xpub6..."
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-orange-500"
            />
            <p className="text-xs text-zinc-600 mt-2">Get this from the beneficiary's hardware wallet</p>
          </div>

          {/* Security Notes */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-300 font-medium mb-1">🔐 HEIR KEY SECURITY</p>
            <ul className="text-xs text-blue-300/70 space-y-1">
              <li>• Heir's xpub gives them spending rights <strong>after timelock expires</strong></li>
              <li>• Heir cannot spend before the timelock - enforced by Bitcoin consensus</li>
              <li>• Verify the public key belongs to the intended beneficiary</li>
              <li>• Include this key in their heir kit for inheritance claim</li>
            </ul>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <UserPlus size={18} />
            Add Beneficiary
          </button>
        </div>
      </div>
    </div>
  );
}
