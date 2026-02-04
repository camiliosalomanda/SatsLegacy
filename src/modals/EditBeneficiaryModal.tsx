import React, { useState } from 'react';
import { Edit3, X } from 'lucide-react';
import { useVaults } from '../contexts/VaultContext';
import { useUI } from '../contexts/UIContext';
import { validatePublicKey, validateBeneficiaryName, validatePercentage } from '../utils/validation';

interface EditBeneficiaryModalProps {
  index: number;
}

export function EditBeneficiaryModal({ index }: EditBeneficiaryModalProps) {
  const { selectedVault, updateBeneficiary } = useVaults();
  const { closeModal } = useUI();

  const beneficiary = selectedVault?.beneficiaries[index];

  const [name, setName] = useState(beneficiary?.name || '');
  const [percentage, setPercentage] = useState(beneficiary?.percentage.toString() || '');
  const [pubkey, setPubkey] = useState(beneficiary?.pubkey || '');
  const [error, setError] = useState('');

  if (!beneficiary || !selectedVault) {
    return null;
  }

  // Calculate max percentage (current total minus this beneficiary's percentage + 100)
  const otherBeneficiariesTotal = selectedVault.beneficiaries
    .filter((_, i) => i !== index)
    .reduce((sum, b) => sum + b.percentage, 0);
  const maxPercentage = 100 - otherBeneficiariesTotal;

  const handleSubmit = () => {
    // Validate name
    const nameValidation = validateBeneficiaryName(name);
    if (!nameValidation.valid) {
      setError(nameValidation.error || 'Invalid name');
      return;
    }

    // Validate percentage
    const pctValidation = validatePercentage(percentage, maxPercentage);
    if (!pctValidation.valid) {
      setError(pctValidation.error || 'Invalid percentage');
      return;
    }

    // Validate public key format
    const keyValidation = validatePublicKey(pubkey);
    if (!keyValidation.valid) {
      setError(keyValidation.error || 'Invalid public key');
      return;
    }

    updateBeneficiary(index, {
      name: name.trim(),
      percentage: pctValidation.parsed!,
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
              <Edit3 size={20} className="text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Edit Beneficiary</h2>
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
            <label className="block text-sm text-zinc-400 mb-2">Percentage ({maxPercentage}% max)</label>
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
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Edit3 size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
