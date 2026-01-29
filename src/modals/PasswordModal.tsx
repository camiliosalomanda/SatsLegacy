import React, { useState } from 'react';
import { Key, X, AlertTriangle } from 'lucide-react';

interface PasswordModalProps {
  mode: 'create' | 'unlock';
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

export function PasswordModal({ mode, onSubmit, onCancel }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (mode === 'create') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }
    onSubmit(password);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Key size={20} className="text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {mode === 'create' ? 'Encrypt Vault' : 'Unlock Vault'}
            </h2>
          </div>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-zinc-400 text-sm">
            {mode === 'create'
              ? 'Choose a strong password to encrypt your vault. This password will be required to access or modify your vault.'
              : 'Enter your password to unlock this vault.'}
          </p>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {mode === 'create' && (
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-orange-400 mt-0.5" />
              <p className="text-sm text-zinc-300">
                <strong className="text-orange-400">Important:</strong> There is no password recovery.
                If you forget this password, your vault data cannot be recovered.
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            {mode === 'create' ? 'Create Encrypted Vault' : 'Unlock'}
          </button>
        </div>
      </div>
    </div>
  );
}
