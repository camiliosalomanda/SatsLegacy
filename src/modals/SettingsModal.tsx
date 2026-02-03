import React, { useState, useEffect } from 'react';
import { X, Bell, Mail, Loader2, Check, AlertCircle, Shield, AlertTriangle, Eye, EyeOff, Trash2, Globe, Wifi, WifiOff } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useUI } from '../contexts/UIContext';
import type { DuressAction, TorSettings } from '../types/settings';
import { testTorConnection, clearTorSettingsCache } from '../utils/api/tor-fetch';

const electronAPI = typeof window !== 'undefined' ? window.electronAPI : null;

export function SettingsModal() {
  const { settings, licenseInfo, updateSettings } = useSettings();
  const { closeModal, openModal } = useUI();
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  // Tor state
  const [testingTor, setTestingTor] = useState(false);
  const [torTestResult, setTorTestResult] = useState<{ success: boolean; message: string; ip?: string } | null>(null);
  const [showTorConfig, setShowTorConfig] = useState(false);

  // Duress protection state
  const [showDuressSetup, setShowDuressSetup] = useState(false);
  const [duressPassword, setDuressPassword] = useState('');
  const [duressPasswordConfirm, setDuressPasswordConfirm] = useState('');
  const [duressError, setDuressError] = useState<string | null>(null);
  const [duressSuccess, setDuressSuccess] = useState<string | null>(null);
  const [savingDuress, setSavingDuress] = useState(false);
  const [showDuressPassword, setShowDuressPassword] = useState(false);

  // Initialize tor settings if not present
  useEffect(() => {
    if (!settings.tor) {
      updateSettings({
        ...settings,
        tor: {
          enabled: settings.torEnabled || false,
          host: '127.0.0.1',
          port: 9050
        }
      });
    }
  }, []);

  const handleSave = async () => {
    await updateSettings(settings);
    closeModal();
  };

  const handleSettingChange = (key: string, value: unknown) => {
    updateSettings({ ...settings, [key]: value });
  };

  const handleNotificationChange = (key: string, value: unknown) => {
    updateSettings({
      ...settings,
      notifications: { ...settings.notifications, [key]: value }
    });
  };

  const handleTorChange = (key: keyof TorSettings, value: unknown) => {
    const newTorSettings = {
      ...settings.tor,
      [key]: value
    };
    updateSettings({
      ...settings,
      tor: newTorSettings,
      torEnabled: key === 'enabled' ? value as boolean : newTorSettings.enabled
    });
    // Clear cache so next fetch uses new settings
    clearTorSettingsCache();
    // Clear test result when settings change
    setTorTestResult(null);
  };

  const handleTestTor = async () => {
    setTestingTor(true);
    setTorTestResult(null);
    try {
      const result = await testTorConnection();
      if (result.success && result.connected) {
        setTorTestResult({
          success: true,
          message: 'Connected to Tor network!',
          ip: result.ip
        });
      } else if (result.success && !result.connected) {
        setTorTestResult({
          success: false,
          message: 'Connected but traffic is NOT going through Tor',
          ip: result.ip
        });
      } else {
        setTorTestResult({
          success: false,
          message: result.error || 'Failed to connect to Tor'
        });
      }
    } catch (e) {
      setTorTestResult({
        success: false,
        message: e instanceof Error ? e.message : 'Connection test failed'
      });
    } finally {
      setTestingTor(false);
    }
  };

  const handleTestEmail = async () => {
    const email = settings.notifications?.ownerEmail;
    if (!email) {
      setTestEmailResult({ success: false, message: 'Please enter your email address first' });
      return;
    }
    setTestingEmail(true);
    setTestEmailResult(null);
    try {
      const result = await electronAPI?.notifications.testEmail(email);
      if (result?.success) {
        setTestEmailResult({ success: true, message: 'Test email sent! Check your inbox.' });
      } else {
        setTestEmailResult({ success: false, message: result?.error || 'Failed to send test email' });
      }
    } catch {
      setTestEmailResult({ success: false, message: 'Failed to send test email' });
    } finally {
      setTestingEmail(false);
    }
  };

  // Duress handlers
  const handleDuressChange = (key: string, value: unknown) => {
    updateSettings({
      ...settings,
      duress: { ...settings.duress, [key]: value }
    });
  };

  const handleSetDuressPassword = async () => {
    setDuressError(null);
    setDuressSuccess(null);

    if (duressPassword.length < 8) {
      setDuressError('Duress password must be at least 8 characters');
      return;
    }

    if (duressPassword !== duressPasswordConfirm) {
      setDuressError('Passwords do not match');
      return;
    }

    setSavingDuress(true);
    try {
      const result = await electronAPI?.duress.setPassword(duressPassword);
      if (result?.success) {
        setDuressSuccess('Duress password set successfully');
        setDuressPassword('');
        setDuressPasswordConfirm('');
        setShowDuressSetup(false);
        // Update local settings state
        updateSettings({
          ...settings,
          duress: { ...settings.duress, enabled: true }
        });
      } else {
        setDuressError(result?.error || 'Failed to set duress password');
      }
    } catch {
      setDuressError('Failed to set duress password');
    } finally {
      setSavingDuress(false);
    }
  };

  const handleRemoveDuressPassword = async () => {
    setSavingDuress(true);
    try {
      const result = await electronAPI?.duress.removePassword();
      if (result?.success) {
        setDuressSuccess('Duress protection disabled');
        updateSettings({
          ...settings,
          duress: { ...settings.duress, enabled: false }
        });
      }
    } catch {
      setDuressError('Failed to remove duress password');
    } finally {
      setSavingDuress(false);
    }
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

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Tor Network Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-purple-400" />
                <div>
                  <p className="text-white font-medium">Tor Network</p>
                  <p className="text-sm text-zinc-500">Route blockchain queries through Tor</p>
                </div>
              </div>
              <button
                onClick={() => handleTorChange('enabled', !settings.tor?.enabled)}
                className={`w-12 h-6 rounded-full transition-colors ${settings.tor?.enabled ? 'bg-purple-500' : 'bg-zinc-700'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${settings.tor?.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {settings.tor?.enabled && (
              <div className="ml-6 space-y-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                {/* SOCKS Proxy Configuration */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTorConfig(!showTorConfig)}
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {showTorConfig ? '▼' : '▶'} Proxy Settings
                  </button>
                </div>

                {showTorConfig && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">SOCKS5 Host</label>
                      <input
                        type="text"
                        value={settings.tor?.host || '127.0.0.1'}
                        onChange={(e) => handleTorChange('host', e.target.value)}
                        placeholder="127.0.0.1"
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">SOCKS5 Port</label>
                      <input
                        type="number"
                        value={settings.tor?.port || 9050}
                        onChange={(e) => handleTorChange('port', parseInt(e.target.value) || 9050)}
                        placeholder="9050"
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                      />
                      <p className="text-xs text-zinc-600 mt-1">
                        Default: 9050 (Tor daemon) or 9150 (Tor Browser)
                      </p>
                    </div>
                  </div>
                )}

                {/* Connection Test */}
                <div className="pt-2">
                  <button
                    onClick={handleTestTor}
                    disabled={testingTor}
                    className="w-full py-2 bg-purple-500/20 border border-purple-500/50 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {testingTor ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Testing Connection...
                      </>
                    ) : (
                      <>
                        <Wifi size={16} />
                        Test Tor Connection
                      </>
                    )}
                  </button>

                  {torTestResult && (
                    <div className={`mt-2 p-3 rounded-lg flex items-start gap-2 ${
                      torTestResult.success
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                      {torTestResult.success ? (
                        <Check size={16} className="text-green-400 mt-0.5" />
                      ) : (
                        <WifiOff size={16} className="text-red-400 mt-0.5" />
                      )}
                      <div>
                        <p className={`text-sm ${torTestResult.success ? 'text-green-300' : 'text-red-300'}`}>
                          {torTestResult.message}
                        </p>
                        {torTestResult.ip && (
                          <p className="text-xs text-zinc-500 mt-1">
                            Exit IP: <span className="font-mono">{torTestResult.ip}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Help Text */}
                <p className="text-xs text-zinc-500">
                  Requires Tor daemon or Tor Browser running. Install from{' '}
                  <a
                    href="https://www.torproject.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      electronAPI?.system.openExternal('https://www.torproject.org');
                    }}
                  >
                    torproject.org
                  </a>
                </p>
              </div>
            )}
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

          {/* Notifications Section */}
          <div className="pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={18} className="text-orange-400" />
              <p className="text-white font-medium">Notifications</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-300 text-sm">Enable Email Notifications</p>
                  <p className="text-xs text-zinc-500">Get check-in reminders for Dead Man's Switch vaults</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('enabled', !settings.notifications?.enabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${settings.notifications?.enabled ? 'bg-orange-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${settings.notifications?.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {settings.notifications?.enabled && (
                <>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Your Email</label>
                    <input
                      type="email"
                      value={settings.notifications?.ownerEmail || ''}
                      onChange={(e) => handleNotificationChange('ownerEmail', e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                    <p className="text-xs text-zinc-600 mt-1">Where to send check-in reminders</p>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">From Email (optional)</label>
                    <input
                      type="email"
                      value={settings.notifications?.fromEmail || ''}
                      onChange={(e) => handleNotificationChange('fromEmail', e.target.value)}
                      placeholder="notifications@satslegacy.io"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                    <p className="text-xs text-zinc-600 mt-1">Defaults to notifications@satslegacy.io</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Warning (days before)</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={settings.notifications?.warningDays || 7}
                        onChange={(e) => handleNotificationChange('warningDays', parseInt(e.target.value) || 7)}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Critical (days before)</label>
                      <input
                        type="number"
                        min="1"
                        max="14"
                        value={settings.notifications?.criticalDays || 2}
                        onChange={(e) => handleNotificationChange('criticalDays', parseInt(e.target.value) || 2)}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {electronAPI && (
                    <div>
                      <button
                        onClick={handleTestEmail}
                        disabled={testingEmail || !settings.notifications?.ownerEmail}
                        className="w-full py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {testingEmail ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail size={16} />
                            Send Test Email
                          </>
                        )}
                      </button>
                      {testEmailResult && (
                        <div className={`mt-2 flex items-center gap-2 text-sm ${testEmailResult.success ? 'text-green-400' : 'text-red-400'}`}>
                          {testEmailResult.success ? <Check size={14} /> : <AlertCircle size={14} />}
                          {testEmailResult.message}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Duress Protection Section */}
          {electronAPI && (
            <div className="pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={18} className="text-red-400" />
                <p className="text-white font-medium">Duress Protection</p>
              </div>

              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-400 mt-0.5" />
                  <p className="text-sm text-zinc-400">
                    Duress protection creates a secondary password that shows decoy vaults when entered under coercion.
                    The attacker sees fake vaults while your real assets remain hidden.
                  </p>
                </div>
              </div>

              {settings.duress?.enabled ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span className="text-green-400 font-medium">Duress protection enabled</span>
                    </div>
                    <button
                      onClick={handleRemoveDuressPassword}
                      disabled={savingDuress}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      {savingDuress ? 'Removing...' : 'Remove'}
                    </button>
                  </div>

                  {/* Duress Action */}
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">When duress password is entered</label>
                    <div className="grid grid-cols-1 gap-2">
                      {([
                        { value: 'show_decoy', label: 'Show Decoy Vaults', desc: 'Display fake vaults only' },
                        { value: 'show_decoy_and_wipe', label: 'Show Decoy & Wipe Real', desc: 'Show fake, permanently delete real vaults' },
                        { value: 'wipe_only', label: 'Wipe Everything', desc: 'Delete all vault data immediately' }
                      ] as { value: DuressAction; label: string; desc: string }[]).map(action => (
                        <button
                          key={action.value}
                          onClick={() => handleDuressChange('action', action.value)}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            settings.duress?.action === action.value
                              ? 'bg-red-500/20 border-red-500/50'
                              : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                          }`}
                        >
                          <p className={`font-medium ${settings.duress?.action === action.value ? 'text-red-400' : 'text-white'}`}>
                            {action.label}
                          </p>
                          <p className="text-xs text-zinc-500">{action.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Silent Alert */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-zinc-300 text-sm">Silent Alert</p>
                      <p className="text-xs text-zinc-500">Send email when duress password is used</p>
                    </div>
                    <button
                      onClick={() => handleDuressChange('silentAlert', !settings.duress?.silentAlert)}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.duress?.silentAlert ? 'bg-red-500' : 'bg-zinc-700'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${settings.duress?.silentAlert ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  {settings.duress?.silentAlert && (
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Alert Email</label>
                      <input
                        type="email"
                        value={settings.duress?.alertEmail || ''}
                        onChange={(e) => handleDuressChange('alertEmail', e.target.value)}
                        placeholder="trusted-contact@example.com"
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
                      />
                      <p className="text-xs text-zinc-600 mt-1">This email will receive a silent alert if duress password is used</p>
                    </div>
                  )}

                  {/* Manage Decoy Vaults Button */}
                  <button
                    onClick={() => {
                      closeModal();
                      setTimeout(() => openModal({ type: 'decoyVaults' }), 100);
                    }}
                    className="w-full py-3 bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye size={18} />
                    Manage Decoy Vaults
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {!showDuressSetup ? (
                    <button
                      onClick={() => setShowDuressSetup(true)}
                      className="w-full py-3 bg-red-500/20 border border-red-500/30 text-red-400 font-medium rounded-xl hover:bg-red-500/30 transition-colors"
                    >
                      Set Up Duress Password
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-zinc-400 mb-2">Duress Password</label>
                        <div className="relative">
                          <input
                            type={showDuressPassword ? 'text' : 'password'}
                            value={duressPassword}
                            onChange={(e) => setDuressPassword(e.target.value)}
                            placeholder="Enter duress password"
                            className="w-full px-4 py-3 pr-10 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDuressPassword(!showDuressPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                          >
                            {showDuressPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-zinc-400 mb-2">Confirm Duress Password</label>
                        <input
                          type={showDuressPassword ? 'text' : 'password'}
                          value={duressPasswordConfirm}
                          onChange={(e) => setDuressPasswordConfirm(e.target.value)}
                          placeholder="Confirm duress password"
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
                        />
                      </div>

                      {duressError && (
                        <div className="flex items-center gap-2 text-sm text-red-400">
                          <AlertCircle size={14} />
                          {duressError}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowDuressSetup(false);
                            setDuressPassword('');
                            setDuressPasswordConfirm('');
                            setDuressError(null);
                          }}
                          className="flex-1 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSetDuressPassword}
                          disabled={savingDuress || duressPassword.length < 8}
                          className="flex-1 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {savingDuress ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Setting...
                            </>
                          ) : (
                            'Enable Duress Protection'
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-zinc-600 text-center">
                        Choose a password you can remember under stress but is different from your main password
                      </p>
                    </div>
                  )}
                </div>
              )}

              {duressSuccess && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
                  <Check size={14} />
                  {duressSuccess}
                </div>
              )}
            </div>
          )}

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
                <div className="mt-3">
                  <button
                    onClick={() => electronAPI?.license.purchase('standard')}
                    className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-medium rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Upgrade Now
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
