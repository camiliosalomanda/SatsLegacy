import React from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useUI } from '../contexts/UIContext';

const electronAPI = typeof window !== 'undefined' ? window.electronAPI : null;

export function SettingsModal() {
  const { settings, licenseInfo, updateSettings } = useSettings();
  const { closeModal } = useUI();

  const handleSave = async () => {
    await updateSettings(settings);
    closeModal();
  };

  const handleSettingChange = (key: string, value: unknown) => {
    updateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button onClick={closeModal} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">🧅 Tor Network</p>
              <p className="text-sm text-zinc-500">Route all traffic through Tor for privacy</p>
            </div>
            <button
              onClick={() => handleSettingChange('torEnabled', !settings.torEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${settings.torEnabled ? 'bg-purple-500' : 'bg-zinc-700'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${settings.torEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div>
            <p className="text-white font-medium mb-2">Network</p>
            <div className="grid grid-cols-3 gap-2">
              {(['mainnet', 'testnet', 'signet'] as const).map(net => (
                <button
                  key={net}
                  onClick={() => handleSettingChange('network', net)}
                  className={`py-2 rounded-lg text-sm capitalize transition-colors ${
                    settings.network === net
                      ? 'bg-orange-500 text-black font-medium'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white font-medium mb-2">Electrum Server</p>
            <input
              type="text"
              value={settings.electrumServer}
              onChange={(e) => handleSettingChange('electrumServer', e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-orange-500"
            />
            <p className="text-xs text-zinc-600 mt-2">Use your own node for maximum sovereignty</p>
          </div>

          {/* License Section */}
          <div className="pt-4 border-t border-zinc-800">
            <p className="text-white font-medium mb-2">License</p>
            <div className="p-4 bg-zinc-800/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400">Status</span>
                <span className={`font-medium ${licenseInfo.licensed ? 'text-green-400' : 'text-zinc-400'}`}>
                  {licenseInfo.licensed ? `${licenseInfo.tier.charAt(0).toUpperCase() + licenseInfo.tier.slice(1)} License` : 'Free Tier'}
                </span>
              </div>
              {licenseInfo.email && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400">Email</span>
                  <span className="text-zinc-300">{licenseInfo.email}</span>
                </div>
              )}
              {!licenseInfo.licensed && (
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => electronAPI?.license.purchase('standard')}
                    className="w-full py-2 bg-orange-500 text-black font-medium rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Upgrade to Standard - $99
                  </button>
                  <button
                    onClick={() => electronAPI?.license.purchase('pro')}
                    className="w-full py-2 bg-gradient-to-r from-purple-500 to-orange-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Upgrade to Pro - $299
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800">
          <button
            onClick={handleSave}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
