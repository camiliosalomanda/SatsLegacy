import React, { useState } from 'react';
import { Key, X } from 'lucide-react';
import { useVaults } from '../contexts/VaultContext';
import { useUI } from '../contexts/UIContext';

export function OwnerKeyModal() {
  const { setOwnerKey } = useVaults();
  const { closeModal } = useUI();

  const [pubkey, setPubkey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!pubkey.trim() || pubkey.length < 20) {
      setError('Please enter a valid public key or xpub');
      return;
    }
    setOwnerKey(pubkey.trim());
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Key size={20} className="text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Add Owner Key</h2>
          </div>
          <button onClick={closeModal} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-zinc-400 text-sm">
            Enter your public key (xpub) from your hardware wallet. This allows the vault to generate a receiving address.
          </p>

          <div className="bg-zinc-800/50 rounded-lg p-4 text-sm">
            <p className="text-orange-400 font-medium mb-2">How to get your xpub:</p>
            <ul className="text-zinc-400 space-y-1">
              <li>• Coldcard: Settings → Multisig Wallets → Export XPUB</li>
              <li>• Trezor: Use Trezor Suite → Account → Show xpub</li>
              <li>• Ledger: Use Ledger Live → Account → Advanced</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Public Key / xpub</label>
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
            <Key size={18} />
            Save Owner Key
          </button>
        </div>
      </div>
    </div>
  );
}
