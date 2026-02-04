import React from 'react';
import {
  Lock, ChevronRight, Save, Key, Users, Trash2, UserPlus, Download, Upload, FileText, Package,
  Edit3, Check, Copy, QrCode, AlertTriangle, Heart, Clock, RefreshCw
} from 'lucide-react';
import { useVaults } from '../contexts/VaultContext';
import { useUI } from '../contexts/UIContext';
import { usePrice } from '../contexts/PriceContext';
import { useSettings } from '../contexts/SettingsContext';
import { getDaysUntilUnlock } from '../utils/vault-helpers';
import { copyToClipboard } from '../utils/clipboard';
import type { Vault } from '../types/vault';

interface VaultDetailViewProps {
  vault: Vault;
}

export function VaultDetailView({ vault }: VaultDetailViewProps) {
  const { selectVault, hasUnsavedChanges, removeBeneficiary } = useVaults();
  const { setCurrentView, openModal, setEditFormData, setShowHeirKitGenerator } = useUI();
  const { copiedAddress, setCopiedAddress } = usePrice();
  const { settings } = useSettings();

  const daysUntil = getDaysUntilUnlock(vault);

  // Truncate address for display: tb1qxyz...abc123
  const truncateAddress = (addr: string) => {
    if (addr.length <= 20) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
  };

  const handleCopyAddress = async () => {
    if (vault.address) {
      await copyToClipboard(vault.address);
      setCopiedAddress(true);
    }
  };

  const handleSave = () => {
    openModal({ type: 'password', mode: 'save' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => selectVault(null)}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
        >
          <ChevronRight size={16} className="rotate-180" />
          Back to Vaults
        </button>
        {hasUnsavedChanges && (
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-black font-medium rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Save size={16} />
            Save Changes
          </button>
        )}
      </div>

      <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 flex items-center justify-center">
              <Lock size={32} className="text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{vault.name}</h2>
              <p className="text-zinc-500 capitalize">{vault.logic?.primary || vault.scriptType} Script • {vault.status}</p>
              {vault.description && <p className="text-sm text-zinc-400 mt-1">{vault.description}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditFormData({ name: vault.name, description: vault.description || '' });
                openModal({ type: 'edit' });
              }}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              <Edit3 size={18} className="text-zinc-400" />
            </button>
            <button
              onClick={() => openModal({ type: 'delete', vault })}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 size={18} className="text-zinc-400 hover:text-red-400" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 p-4 bg-zinc-800/50 rounded-xl">
          <div>
            <p className="text-zinc-500 text-sm mb-1">Balance</p>
            <p className="text-3xl font-bold text-white">{vault.balance.toFixed(8)} BTC</p>
            <p className="text-zinc-500">${vault.balanceUSD.toLocaleString()}</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-zinc-500 text-sm">Time Until Unlock</p>
              <button
                onClick={() => openModal({ type: 'editTimelock' })}
                className="p-1 rounded hover:bg-zinc-700 transition-colors"
                title="Edit timelock"
              >
                <Edit3 size={14} className="text-zinc-500 hover:text-orange-400" />
              </button>
            </div>
            <p className="text-3xl font-bold text-orange-400">{daysUntil} days</p>
            <p className="text-zinc-500">{new Date(vault.lockDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Owner Key Section */}
      <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Owner Key</h3>
          {!vault.ownerPubkey && (
            <button
              onClick={() => openModal({ type: 'ownerKey' })}
              className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors"
            >
              <Key size={16} />
              Add Key
            </button>
          )}
        </div>
        {vault.ownerPubkey ? (
          <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl">
            <Key size={20} className="text-green-400" />
            <code className="flex-1 text-sm text-zinc-300 font-mono" title={vault.ownerPubkey}>
              {truncateAddress(vault.ownerPubkey)}
            </code>
            <Check size={18} className="text-green-400" />
          </div>
        ) : (
          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-orange-400" />
              <div>
                <p className="text-orange-400 font-medium">Owner key required</p>
                <p className="text-sm text-zinc-400">Add your hardware wallet xpub to generate a receiving address</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vault Address Section */}
      <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Vault Address</h3>
          {vault.address && (
            <span className={`text-xs px-2 py-1 rounded font-medium ${
              settings.network === 'mainnet'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : settings.network === 'testnet'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            }`}>
              {settings.network}
            </span>
          )}
        </div>
        {vault.address ? (
          <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl">
            <code
              className="flex-1 text-sm text-zinc-300 font-mono cursor-help"
              title={vault.address}
            >
              {truncateAddress(vault.address)}
            </code>
            <button onClick={handleCopyAddress} className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors" title="Copy full address">
              {copiedAddress ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-zinc-400" />}
            </button>
            <button className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors" title="Show QR code">
              <QrCode size={18} className="text-zinc-400" />
            </button>
          </div>
        ) : (
          <div className="p-4 bg-zinc-800/50 rounded-xl">
            <p className="text-zinc-500 text-sm">
              Add owner key and beneficiaries to generate address
            </p>
          </div>
        )}
      </div>

      {/* Check-In Section - Only for Dead Man's Switch vaults */}
      {vault.logic?.primary === 'dead_man_switch' && (
        <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                vault.checkIn?.status === 'critical' ? 'bg-red-500/20' :
                vault.checkIn?.status === 'warning' ? 'bg-yellow-500/20' :
                'bg-green-500/20'
              }`}>
                <Heart size={20} className={
                  vault.checkIn?.status === 'critical' ? 'text-red-400' :
                  vault.checkIn?.status === 'warning' ? 'text-yellow-400' :
                  'text-green-400'
                } />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Dead Man's Switch</h3>
                <p className="text-sm text-zinc-500">Periodic check-in required</p>
              </div>
            </div>
            <button
              onClick={() => openModal({ type: 'checkIn', vault })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                vault.checkIn?.status === 'critical'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : vault.checkIn?.status === 'warning'
                  ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                  : 'bg-green-500 text-black hover:bg-green-600'
              }`}
            >
              <RefreshCw size={16} />
              Check In
            </button>
          </div>

          <div className={`p-4 rounded-xl border ${
            vault.checkIn?.status === 'critical' ? 'bg-red-500/10 border-red-500/30' :
            vault.checkIn?.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
            'bg-green-500/10 border-green-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {vault.checkIn?.status === 'critical' ? (
                  <AlertTriangle size={24} className="text-red-400" />
                ) : vault.checkIn?.status === 'warning' ? (
                  <Clock size={24} className="text-yellow-400" />
                ) : (
                  <Check size={24} className="text-green-400" />
                )}
                <div>
                  <p className={`font-medium ${
                    vault.checkIn?.status === 'critical' ? 'text-red-400' :
                    vault.checkIn?.status === 'warning' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {vault.checkIn?.status === 'critical' ? 'Check-in Urgently Required!' :
                     vault.checkIn?.status === 'warning' ? 'Check-in Due Soon' :
                     vault.checkIn?.status === 'expired' ? 'Check-in Expired - Heirs Can Claim' :
                     'Vault Healthy'}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {vault.checkIn?.daysRemaining !== undefined
                      ? `${vault.checkIn.daysRemaining} days until heir can claim`
                      : `${vault.inactivityTrigger || 90} day inactivity period`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {vault.checkIn?.daysRemaining ?? vault.inactivityTrigger ?? 90}
                </p>
                <p className="text-xs text-zinc-500">days remaining</p>
              </div>
            </div>
          </div>

          {vault.checkIn?.lastCheckIn && (
            <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
              <Clock size={14} />
              <span>Last check-in: {new Date(vault.checkIn.lastCheckIn).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Beneficiaries Section */}
      <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Beneficiaries</h3>
          <button
            onClick={() => openModal({ type: 'addBeneficiary' })}
            className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors"
          >
            <UserPlus size={16} />
            Add
          </button>
        </div>
        <div className="space-y-3">
          {vault.beneficiaries.length > 0 ? vault.beneficiaries.map((beneficiary, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-purple-500/20 flex items-center justify-center">
                <span className="text-sm font-medium text-white">{beneficiary.name.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{beneficiary.name}</p>
                <p className="text-xs text-zinc-500 font-mono" title={beneficiary.pubkey}>
                  {truncateAddress(beneficiary.pubkey)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-orange-400">{beneficiary.percentage}%</p>
                <p className="text-xs text-zinc-500">{(vault.balance * beneficiary.percentage / 100).toFixed(8)} BTC</p>
              </div>
              <button
                onClick={() => openModal({ type: 'editBeneficiary', index: i })}
                className="p-2 rounded-lg hover:bg-zinc-700 transition-colors"
                title="Edit beneficiary"
              >
                <Edit3 size={16} className="text-zinc-500 hover:text-orange-400" />
              </button>
              <button
                onClick={() => removeBeneficiary(i)}
                className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                title="Remove beneficiary"
              >
                <Trash2 size={16} className="text-zinc-500 hover:text-red-400" />
              </button>
            </div>
          )) : (
            <div className="text-center py-8 text-zinc-500">
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p>No beneficiaries configured yet</p>
              <p className="text-sm">Add heirs to complete your inheritance plan</p>
            </div>
          )}
        </div>
      </div>

      {/* PSBT Actions */}
      <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Transactions</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => openModal({ type: 'psbt', vault })}
            className="flex items-center justify-center gap-2 p-4 bg-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            <Download size={18} />
            Create PSBT
          </button>
          <button
            onClick={() => openModal({ type: 'psbtImport', vault })}
            className="flex items-center justify-center gap-2 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-500/30 transition-colors"
          >
            <Upload size={18} />
            Import & Broadcast
          </button>
        </div>
        <p className="text-xs text-zinc-500 mt-3">
          Create a PSBT to sign with your hardware wallet, then import the signed PSBT to broadcast.
        </p>
      </div>

      {/* Other Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <button
          onClick={() => openModal({ type: 'export' })}
          className="flex items-center justify-center gap-2 p-4 bg-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          <Download size={18} />
          Export Vault
        </button>
        <button
          onClick={() => setShowHeirKitGenerator(true)}
          className="flex items-center justify-center gap-2 p-4 bg-orange-500 rounded-xl text-black font-medium hover:bg-orange-600 transition-colors"
        >
          <Package size={18} />
          Generate Heir Kit
        </button>
        <button
          onClick={() => { setCurrentView('legal'); selectVault(null); }}
          className="flex items-center justify-center gap-2 p-4 bg-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          <FileText size={18} />
          Legal Docs
        </button>
      </div>
    </div>
  );
}
