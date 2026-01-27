import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Unlock, Shield, Clock, Users, FileText, Key, Wallet, ChevronRight, ChevronDown, Plus, Copy, Check, AlertTriangle, Eye, EyeOff, QrCode, Download, Settings, Home, PieChart, BookOpen, ArrowRight, Zap, Globe, RefreshCw, Timer, UserPlus, Trash2, Edit3, Save, X, Package, Send, Loader } from 'lucide-react';

// Import the new Vault Creation Wizard
import { VaultCreationWizard } from './src/vault/creation/wizard/VaultCreationWizard';

// Import the Heir Kit Generator
import HeirKitGenerator from './src/components/HeirKitGenerator';

// ============================================
// SatsLegacy - SOVEREIGN BITCOIN INHERITANCE
// ============================================

// Check if running in Electron
const isElectron = window.isElectron || false;
const electronAPI = window.electronAPI || null;

// ============================================
// API UTILITIES
// ============================================

// Fetch BTC price from multiple sources with fallback
const fetchBTCPrice = async () => {
  const sources = [
    {
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      parse: (data) => data.bitcoin.usd
    },
    {
      url: 'https://api.coinbase.com/v2/prices/BTC-USD/spot',
      parse: (data) => parseFloat(data.data.amount)
    },
    {
      url: 'https://blockchain.info/ticker',
      parse: (data) => data.USD.last
    }
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source.url);
      if (response.ok) {
        const data = await response.json();
        return source.parse(data);
      }
    } catch (e) {
      console.warn(`Price fetch failed from ${source.url}:`, e);
    }
  }
  
  // Fallback price if all APIs fail
  console.warn('All price APIs failed, using fallback');
  return 100000;
};

// Fetch address balance from blockchain
const fetchAddressBalance = async (address, network = 'mainnet') => {
  if (!address || address.startsWith('bc1qtest') || address.startsWith('bc1qsimple') || address.startsWith('bc1qresilient') || address.startsWith('bc1qguardian') || address.startsWith('bc1qhostile')) {
    // Skip fake test addresses
    return 0;
  }

  const apis = network === 'mainnet' ? [
    `https://blockstream.info/api/address/${address}`,
    `https://mempool.space/api/address/${address}`
  ] : [
    `https://blockstream.info/testnet/api/address/${address}`,
    `https://mempool.space/testnet/api/address/${address}`
  ];

  for (const url of apis) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Balance in satoshis, convert to BTC
        const funded = data.chain_stats?.funded_txo_sum || 0;
        const spent = data.chain_stats?.spent_txo_sum || 0;
        return (funded - spent) / 100000000;
      }
    } catch (e) {
      console.warn(`Balance fetch failed from ${url}:`, e);
    }
  }
  
  return 0;
};

// ============================================
// MAIN COMPONENT
// ============================================

const SatsLegacy = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [vaults, setVaults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [selectedVault, setSelectedVault] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHeirKitGenerator, setShowHeirKitGenerator] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showAddBeneficiary, setShowAddBeneficiary] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(null); // For vault creation password
  const [pendingVaultData, setPendingVaultData] = useState(null); // Temp storage for vault being created
  const [settings, setSettings] = useState({
    torEnabled: false,
    network: 'mainnet',
    electrumServer: 'electrum.blockstream.info:50002',
    theme: 'dark'
  });
  const [licenseInfo, setLicenseInfo] = useState({ licensed: false, tier: 'free' });
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [simulatorData, setSimulatorData] = useState({
    btcAmount: 1,
    years: 25,
    generations: 2,
    heirs: 2
  });

  // Real BTC price state
  const [btcPrice, setBtcPrice] = useState(100000);
  const [priceLoading, setPriceLoading] = useState(true);
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null);

  // ============================================
  // INITIALIZATION & DATA LOADING
  // ============================================

  // Load vaults on startup
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      
      // Load BTC price
      try {
        const price = await fetchBTCPrice();
        setBtcPrice(price);
        setLastPriceUpdate(new Date());
      } catch (e) {
        console.error('Failed to fetch BTC price:', e);
      }
      setPriceLoading(false);

      // Load vaults from Electron storage
      if (isElectron && electronAPI) {
        try {
          const result = await electronAPI.vault.list();
          if (result.success && result.vaults) {
            // Load metadata for each vault
            const loadedVaults = result.vaults.map(meta => ({
              id: meta.vault_id,
              vault_id: meta.vault_id,
              name: meta.name,
              description: meta.description || '',
              balance: 0, // Will be updated by balance fetch
              balanceUSD: 0,
              scriptType: meta.logic?.primary || 'timelock',
              lockDate: meta.lockDate ? new Date(meta.lockDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              beneficiaries: meta.beneficiaries || [],
              status: 'active',
              address: meta.address || '',
              lastActivity: meta.updated_at ? new Date(meta.updated_at) : new Date(),
              inactivityTrigger: meta.inactivityTrigger || 365,
              infrastructure: meta.infrastructure || ['local'],
              logic: meta.logic || { primary: 'timelock', gates: [] },
              modifiers: meta.modifiers || {}
            }));
            setVaults(loadedVaults);
            
            // Fetch balances for each vault
            updateVaultBalances(loadedVaults);
          }
        } catch (e) {
          console.error('Failed to load vaults:', e);
        }

        // Load settings
        try {
          const settingsResult = await electronAPI.settings.load();
          if (settingsResult.success && settingsResult.settings) {
            setSettings(prev => ({ ...prev, ...settingsResult.settings }));
          }
        } catch (e) {
          console.error('Failed to load settings:', e);
        }

        // Check license
        try {
          const licenseResult = await electronAPI.license.check();
          if (licenseResult.success) {
            setLicenseInfo({
              licensed: licenseResult.licensed,
              tier: licenseResult.tier || 'free',
              email: licenseResult.email
            });
          }
        } catch (e) {
          console.error('Failed to check license:', e);
        }
      }
      
      setIsLoading(false);
    };

    loadInitialData();
  }, []);

  // Refresh BTC price every 5 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const price = await fetchBTCPrice();
        setBtcPrice(price);
        setLastPriceUpdate(new Date());
        // Update vault USD values
        setVaults(prev => prev.map(v => ({
          ...v,
          balanceUSD: v.balance * price
        })));
      } catch (e) {
        console.error('Failed to refresh BTC price:', e);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Update vault balances from blockchain
  const updateVaultBalances = useCallback(async (vaultList) => {
    const updatedVaults = await Promise.all(
      vaultList.map(async (vault) => {
        if (vault.address) {
          const balance = await fetchAddressBalance(vault.address, settings.network);
          return {
            ...vault,
            balance,
            balanceUSD: balance * btcPrice
          };
        }
        return vault;
      })
    );
    setVaults(updatedVaults);
  }, [btcPrice, settings.network]);

  // Refresh balances manually
  const handleRefreshBalances = useCallback(async () => {
    setPriceLoading(true);
    try {
      const price = await fetchBTCPrice();
      setBtcPrice(price);
      setLastPriceUpdate(new Date());
      await updateVaultBalances(vaults);
    } catch (e) {
      console.error('Failed to refresh:', e);
    }
    setPriceLoading(false);
  }, [vaults, updateVaultBalances]);

  // ============================================
  // VAULT OPERATIONS
  // ============================================

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Calculate days until unlock
  const getDaysUntilUnlock = (vault) => {
    if (vault.scriptType === 'timelock' || vault.logic?.primary === 'timelock') {
      const now = new Date();
      const diff = new Date(vault.lockDate) - now;
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    return vault.inactivityTrigger || 365;
  };

  // Handle vault creation from wizard - step 1: collect config
  const handleCreateVault = (config, name, description) => {
    // Store vault data and show password modal
    const newVault = {
      vault_id: crypto.randomUUID(),
      name: name,
      description: description,
      balance: 0,
      balanceUSD: 0,
      scriptType: config.primaryLogic,
      lockDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      beneficiaries: [],
      status: 'active',
      address: '', // Will be generated from script
      lastActivity: new Date(),
      inactivityTrigger: 365,
      infrastructure: config.infrastructure,
      logic: {
        primary: config.primaryLogic,
        gates: config.additionalGates
      },
      modifiers: {
        staggered: config.modifiers.includes('staggered'),
        multiBeneficiary: config.modifiers.includes('multi_beneficiary'),
        decoy: config.modifiers.includes('decoy')
      },
      created_at: new Date().toISOString()
    };

    if (isElectron && electronAPI) {
      // Show password modal for encryption
      setPendingVaultData(newVault);
      setShowPasswordModal('create');
      setShowCreateWizard(false);
    } else {
      // Web mode - just add to state (no persistence)
      setVaults(prev => [...prev, { ...newVault, id: newVault.vault_id }]);
      setShowCreateWizard(false);
    }
  };

  // Handle vault creation - step 2: save with password
  const handleSaveVaultWithPassword = async (password) => {
    if (!pendingVaultData || !isElectron || !electronAPI) return;

    try {
      const result = await electronAPI.vault.create(pendingVaultData, password);
      if (result.success) {
        // Add to local state
        setVaults(prev => [...prev, { 
          ...pendingVaultData, 
          id: result.vaultId,
          vault_id: result.vaultId 
        }]);
        setPendingVaultData(null);
        setShowPasswordModal(null);
      } else {
        alert('Failed to create vault: ' + result.error);
      }
    } catch (e) {
      console.error('Vault creation error:', e);
      alert('Failed to create vault');
    }
  };

  // Handle vault deletion
  const handleDeleteVault = async (vaultId) => {
    if (isElectron && electronAPI) {
      try {
        const result = await electronAPI.vault.delete(vaultId);
        if (result.success) {
          setVaults(prev => prev.filter(v => v.id !== vaultId && v.vault_id !== vaultId));
        } else {
          alert('Failed to delete vault: ' + result.error);
        }
      } catch (e) {
        console.error('Delete error:', e);
        alert('Failed to delete vault');
      }
    } else {
      // Web mode
      setVaults(prev => prev.filter(v => v.id !== vaultId));
    }
    setShowDeleteModal(null);
    setSelectedVault(null);
  };

  // Save settings
  const handleSaveSettings = async (newSettings) => {
    setSettings(newSettings);
    if (isElectron && electronAPI) {
      try {
        await electronAPI.settings.save(newSettings);
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
    }
  };

  // Add beneficiary to vault
  const handleAddBeneficiary = (beneficiary) => {
    if (!selectedVault) return;
    
    const updatedVault = {
      ...selectedVault,
      beneficiaries: [...selectedVault.beneficiaries, beneficiary]
    };
    
    // Update local state
    setVaults(prev => prev.map(v => 
      (v.id === selectedVault.id || v.vault_id === selectedVault.vault_id) ? updatedVault : v
    ));
    setSelectedVault(updatedVault);
    setShowAddBeneficiary(false);
  };

  // Remove beneficiary from vault
  const handleRemoveBeneficiary = (index) => {
    if (!selectedVault) return;
    
    const updatedBeneficiaries = selectedVault.beneficiaries.filter((_, i) => i !== index);
    const updatedVault = {
      ...selectedVault,
      beneficiaries: updatedBeneficiaries
    };
    
    setVaults(prev => prev.map(v => 
      (v.id === selectedVault.id || v.vault_id === selectedVault.vault_id) ? updatedVault : v
    ));
    setSelectedVault(updatedVault);
  };


  // ============================================
  // UI COMPONENTS
  // ============================================

  // Navigation
  const NavItem = ({ icon: Icon, label, view, badge }) => (
    <button
      onClick={() => { setCurrentView(view); setSelectedVault(null); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        currentView === view
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

  // Sidebar
  const Sidebar = () => (
    <div className="w-64 bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-800 p-4 flex flex-col">
      {/* Back to Landing (web only) */}
      {!isElectron && (
        <button
          onClick={() => { localStorage.removeItem('SatsLegacy:visited'); window.location.reload(); }}
          className="flex items-center gap-2 px-2 py-2 mb-4 text-zinc-500 hover:text-white transition-colors text-sm"
        >
          <ChevronRight size={16} className="rotate-180" />
          Back to Home
        </button>
      )}

      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <img src="./logo.jpg" alt="SatsLegacy" className="w-10 h-10 rounded-full" />
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">SatsLegacy</h1>
          <p className="text-xs text-zinc-500">Sovereign Inheritance</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 flex-1">
        <NavItem icon={Home} label="Dashboard" view="dashboard" />
        <NavItem icon={Lock} label="Vaults" view="vaults" badge={vaults.length} />
        <NavItem icon={FileText} label="Legal Docs" view="legal" />
        <NavItem icon={PieChart} label="Simulator" view="simulator" />
        <NavItem icon={BookOpen} label="Learn" view="learn" />
      </nav>

      {/* Network Status */}
      <div className="mt-auto pt-4 border-t border-zinc-800">
        <div className="px-2 py-3 rounded-lg bg-zinc-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">Network</span>
            <span className={`text-xs font-medium ${settings.torEnabled ? 'text-purple-400' : 'text-green-400'}`}>
              {settings.torEnabled ? '🧅 Tor Active' : '● Connected'}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">BTC Price</span>
            <span className="text-xs text-zinc-300 font-mono">
              {priceLoading ? '...' : `$${btcPrice.toLocaleString()}`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Mode</span>
            <span className="text-xs text-zinc-300 capitalize">{settings.network}</span>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="w-full mt-2 flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Settings size={18} />
          <span className="text-sm">Settings</span>
        </button>
      </div>
    </div>
  );

  // Password Modal for vault encryption
  const PasswordModal = ({ mode, onSubmit, onCancel }) => {
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
  };

  // Vault Card Component
  const VaultCard = ({ vault, showDelete = false }) => {
    const daysUntil = getDaysUntilUnlock(vault);
    const progress = vault.scriptType === 'timelock'
      ? Math.min(100, ((730 - daysUntil) / 730) * 100)
      : Math.min(100, ((vault.inactivityTrigger - daysUntil) / vault.inactivityTrigger) * 100);

    const getInfraBadges = () => {
      if (!vault.infrastructure) return null;
      return (
        <div className="flex gap-1 mt-2">
          {vault.infrastructure.includes('shamir') && (
            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">Shamir</span>
          )}
          {vault.infrastructure.includes('nostr') && (
            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">Nostr</span>
          )}
          {vault.logic?.gates?.includes('challenge') && (
            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Challenge</span>
          )}
          {vault.logic?.gates?.includes('duress') && (
            <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">Duress</span>
          )}
        </div>
      );
    };

    return (
      <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/50 transition-all duration-300 group relative">
        {showDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowDeleteModal(vault); }}
            className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-800/80 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
            title="Delete vault"
          >
            <Trash2 size={16} />
          </button>
        )}

        <div onClick={() => setSelectedVault(vault)} className="cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 flex items-center justify-center">
                {vault.status === 'active' ? <Lock size={24} className="text-orange-400" /> : <Unlock size={24} className="text-green-400" />}
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">{vault.name}</h3>
                <p className="text-xs text-zinc-500 capitalize">{vault.logic?.primary || vault.scriptType} Script</p>
                {getInfraBadges()}
              </div>
            </div>
            <ChevronRight size={20} className="text-zinc-600 group-hover:text-orange-400 transition-colors mt-2" />
          </div>

          <div className="mb-4">
            <p className="text-3xl font-bold text-white">{vault.balance.toFixed(8)} <span className="text-lg text-zinc-500">BTC</span></p>
            <p className="text-sm text-zinc-500">${vault.balanceUSD.toLocaleString()} USD</p>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-zinc-500">Time Lock Progress</span>
              <span className="text-orange-400 font-medium">{daysUntil} days remaining</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users size={14} className="text-zinc-500" />
            <span className="text-xs text-zinc-500">{vault.beneficiaries.length} beneficiaries</span>
            <div className="flex -space-x-2 ml-auto">
              {vault.beneficiaries.slice(0, 3).map((b, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border-2 border-zinc-900 flex items-center justify-center">
                  <span className="text-[10px] text-zinc-400">{b.name.charAt(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
  // Add Beneficiary Modal
  const AddBeneficiaryModal = () => {
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

      handleAddBeneficiary({
        name: name.trim(),
        percentage: pct,
        pubkey: pubkey.trim()
      });
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
            <button onClick={() => setShowAddBeneficiary(false)} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
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
  };


  // Delete Vault Modal
  const DeleteVaultModal = ({ vault }) => {
    const [sweepAddress, setSweepAddress] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const hasFunds = vault.balance > 0;

    const handleSweepAndDelete = () => {
      console.log(`Sweeping ${vault.balance} BTC to ${sweepAddress}`);
      alert(`PSBT generated to sweep ${vault.balance} BTC to ${sweepAddress}. Sign with your hardware wallet, then delete the vault.`);
    };

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Delete Vault</h2>
            </div>
            <button onClick={() => setShowDeleteModal(null)} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
              <X size={20} className="text-zinc-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-4 bg-zinc-800/50 rounded-xl">
              <p className="text-white font-medium">{vault.name}</p>
              <p className="text-sm text-zinc-500 mt-1">
                Balance: <span className={hasFunds ? 'text-orange-400 font-medium' : 'text-zinc-400'}>{vault.balance.toFixed(8)} BTC</span>
              </p>
            </div>

            {hasFunds ? (
              <>
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-orange-400 font-medium">This vault contains Bitcoin</p>
                      <p className="text-sm text-zinc-400 mt-1">
                        You must sweep the funds to another address before deleting this vault.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Sweep funds to address</label>
                  <input
                    type="text"
                    value={sweepAddress}
                    onChange={(e) => setSweepAddress(e.target.value)}
                    placeholder="bc1q..."
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button
                  onClick={handleSweepAndDelete}
                  disabled={!sweepAddress || sweepAddress.length < 20}
                  className="w-full py-3 bg-orange-500 text-black font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Generate Sweep PSBT
                </button>

                <p className="text-xs text-zinc-600 text-center">
                  After sweeping funds and confirming on-chain, return here to delete the vault.
                </p>
              </>
            ) : (
              <>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-400 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-medium">This action cannot be undone</p>
                      <p className="text-sm text-zinc-400 mt-1">
                        The vault configuration, beneficiary data, and all associated files will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Type "{vault.name}" to confirm</label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={vault.name}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
                  />
                </div>

                <button
                  onClick={() => handleDeleteVault(vault.id || vault.vault_id)}
                  disabled={confirmText !== vault.name}
                  className="w-full py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete Vault Permanently
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Dashboard View
  const DashboardView = () => {
    const totalBTC = vaults.reduce((sum, v) => sum + v.balance, 0);
    const totalUSD = totalBTC * btcPrice;
    const totalBeneficiaries = vaults.reduce((sum, v) => sum + v.beneficiaries.length, 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-zinc-500">Your Bitcoin legacy is secure</p>
          </div>
          <button
            onClick={handleRefreshBalances}
            disabled={priceLoading}
            className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw size={16} className={priceLoading ? 'animate-spin' : ''} />
            <span className="text-sm">Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Wallet size={20} className="text-orange-400" />
              </div>
              <span className="text-zinc-500">Total Holdings</span>
            </div>
            <p className="text-3xl font-bold text-white">{totalBTC.toFixed(4)} <span className="text-lg text-zinc-500">BTC</span></p>
            <p className="text-sm text-zinc-500 mt-1">${totalUSD.toLocaleString()} USD</p>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Shield size={20} className="text-green-400" />
              </div>
              <span className="text-zinc-500">Active Vaults</span>
            </div>
            <p className="text-3xl font-bold text-white">{vaults.length}</p>
            <p className="text-sm text-zinc-500 mt-1">{vaults.length > 0 ? 'All secure & monitored' : 'Create your first vault'}</p>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users size={20} className="text-purple-400" />
              </div>
              <span className="text-zinc-500">Beneficiaries</span>
            </div>
            <p className="text-3xl font-bold text-white">{totalBeneficiaries}</p>
            <p className="text-sm text-zinc-500 mt-1">Across all vaults</p>
          </div>
        </div>

        {vaults.length === 0 && (
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Shield size={28} className="text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Get Started</h3>
                <p className="text-zinc-400 text-sm">Create your first inheritance vault to secure your Bitcoin legacy</p>
              </div>
              <button
                onClick={() => setShowCreateWizard(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                <Plus size={18} />
                Create Vault
              </button>
            </div>
          </div>
        )}

        <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          {vaults.length > 0 ? (
            <div className="space-y-3">
              {vaults.slice(0, 3).map((vault) => (
                <div key={vault.id || vault.vault_id} className="flex items-center gap-4 py-3 border-b border-zinc-800/50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Shield size={16} className="text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-300">Vault "{vault.name}" created</p>
                    <p className="text-xs text-zinc-600">{new Date(vault.lastActivity).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              <Clock size={32} className="mx-auto mb-2 opacity-50" />
              <p>No activity yet</p>
              <p className="text-sm">Create a vault to get started</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Vaults View
  const VaultsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Your Vaults</h2>
          <p className="text-zinc-500">Manage your inheritance vaults</p>
        </div>
        <button
          onClick={() => setShowCreateWizard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={18} />
          New Vault
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vaults.map(vault => (
          <VaultCard key={vault.id || vault.vault_id} vault={vault} showDelete={true} />
        ))}

        <div
          onClick={() => setShowCreateWizard(true)}
          className="bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-2xl p-6 cursor-pointer hover:border-orange-500/50 transition-all duration-300 flex flex-col items-center justify-center min-h-[250px] group"
        >
          <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4 group-hover:bg-orange-500/10 transition-colors">
            <Plus size={32} className="text-zinc-600 group-hover:text-orange-400 transition-colors" />
          </div>
          <p className="text-zinc-500 group-hover:text-zinc-300 transition-colors">Create New Vault</p>
          <p className="text-xs text-zinc-600 mt-1">Set up your inheritance plan</p>
        </div>
      </div>
    </div>
  );

  // Vault Detail View
  const VaultDetailView = ({ vault }) => {
    const [showPrivateData, setShowPrivateData] = useState(false);
    const daysUntil = getDaysUntilUnlock(vault);

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedVault(null)}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
        >
          <ChevronRight size={16} className="rotate-180" />
          Back to Vaults
        </button>

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
              <button className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
                <Edit3 size={18} className="text-zinc-400" />
              </button>
              <button onClick={() => setShowDeleteModal(vault)} className="p-2 rounded-lg bg-zinc-800 hover:bg-red-500/20 transition-colors">
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
              <p className="text-zinc-500 text-sm mb-1">Time Until Unlock</p>
              <p className="text-3xl font-bold text-orange-400">{daysUntil} days</p>
              <p className="text-zinc-500">{new Date(vault.lockDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {vault.infrastructure && (
          <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Sovereign Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-500 mb-2">Infrastructure</p>
                <div className="flex flex-wrap gap-2">
                  {vault.infrastructure.map(infra => (
                    <span key={infra} className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-lg text-sm capitalize">
                      {infra.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-zinc-500 mb-2">Security Gates</p>
                <div className="flex flex-wrap gap-2">
                  {vault.logic?.gates?.length > 0 ? vault.logic.gates.map(gate => (
                    <span key={gate} className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-sm capitalize">
                      {gate.replace('_', ' ')}
                    </span>
                  )) : (
                    <span className="text-zinc-500 text-sm">None configured</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Vault Address</h3>
          <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl">
            <code className="flex-1 text-sm text-zinc-300 font-mono break-all">{vault.address || 'Address will be generated'}</code>
            {vault.address && (
              <>
                <button onClick={() => copyToClipboard(vault.address)} className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors">
                  {copiedAddress ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-zinc-400" />}
                </button>
                <button className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors">
                  <QrCode size={18} className="text-zinc-400" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Beneficiaries</h3>
            <button onClick={() => setShowAddBeneficiary(true)} className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors">
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
                  <p className="text-xs text-zinc-500 font-mono">{beneficiary.pubkey}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-400">{beneficiary.percentage}%</p>
                  <p className="text-xs text-zinc-500">{(vault.balance * beneficiary.percentage / 100).toFixed(8)} BTC</p>
                </div>
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

        <div className="grid grid-cols-3 gap-4">
          <button className="flex items-center justify-center gap-2 p-4 bg-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-700 transition-colors">
            <Download size={18} />
            Export PSBT
          </button>
          <button
            onClick={() => setShowHeirKitGenerator(true)}
            className="flex items-center justify-center gap-2 p-4 bg-orange-500 rounded-xl text-black font-medium hover:bg-orange-600 transition-colors"
          >
            <Package size={18} />
            Generate Heir Kit
          </button>
          <button className="flex items-center justify-center gap-2 p-4 bg-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-700 transition-colors">
            <FileText size={18} />
            Generate Legal Docs
          </button>
        </div>
      </div>
    );
  };

  // Simulator View
  const SimulatorView = () => {
    const [projections, setProjections] = useState(null);

    const calculateProjections = () => {
      const scenarios = ['conservative', 'moderate', 'optimistic'];
      const growthRates = { conservative: 0.15, moderate: 0.25, optimistic: 0.40 };

      const results = scenarios.map(scenario => {
        let value = simulatorData.btcAmount;
        const yearlyData = [];

        for (let year = 0; year <= simulatorData.years; year++) {
          yearlyData.push({
            year: 2024 + year,
            btc: value,
            usd: value * btcPrice * Math.pow(1 + growthRates[scenario], year)
          });
        }

        return {
          scenario,
          data: yearlyData,
          finalUSD: yearlyData[yearlyData.length - 1].usd
        };
      });

      setProjections(results);
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Legacy Simulator</h2>
          <p className="text-zinc-500">Project your Bitcoin inheritance across generations</p>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm text-zinc-500 mb-2">BTC Amount</label>
              <input
                type="number"
                value={simulatorData.btcAmount}
                onChange={(e) => setSimulatorData(prev => ({ ...prev, btcAmount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-500 mb-2">Time Horizon (years)</label>
              <input
                type="number"
                value={simulatorData.years}
                onChange={(e) => setSimulatorData(prev => ({ ...prev, years: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-500 mb-2">Generations</label>
              <input
                type="number"
                value={simulatorData.generations}
                onChange={(e) => setSimulatorData(prev => ({ ...prev, generations: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-500 mb-2">Heirs per Generation</label>
              <input
                type="number"
                value={simulatorData.heirs}
                onChange={(e) => setSimulatorData(prev => ({ ...prev, heirs: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
          <button
            onClick={calculateProjections}
            className="mt-6 w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Calculate Projections
          </button>
        </div>

        {projections && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projections.map(proj => (
              <div key={proj.scenario} className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white capitalize mb-2">{proj.scenario}</h3>
                <p className="text-3xl font-bold text-orange-400">${(proj.finalUSD / 1000000).toFixed(1)}M</p>
                <p className="text-sm text-zinc-500 mt-1">After {simulatorData.years} years</p>
                <p className="text-xs text-zinc-600 mt-2">
                  ${(proj.finalUSD / Math.pow(simulatorData.heirs, simulatorData.generations) / 1000000).toFixed(2)}M per heir
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Legal View
  const LegalView = () => {
    const [selectedState, setSelectedState] = useState('Texas');
    const states = ['Texas', 'California', 'New York', 'Florida', 'Wyoming', 'Other'];

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Legal Documents</h2>
          <p className="text-zinc-500">Generate state-compliant inheritance documents</p>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Your State</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {states.map(state => (
              <button
                key={state}
                onClick={() => setSelectedState(state)}
                className={`py-2 px-4 rounded-lg text-sm transition-colors ${
                  selectedState === state
                    ? 'bg-orange-500 text-black font-medium'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Bitcoin-Specific Will Addendum', desc: 'Legal addendum recognizing your Bitcoin inheritance plan', icon: FileText },
            { title: 'Letter of Instruction', desc: 'Detailed guide for heirs on accessing the vault', icon: BookOpen },
            { title: 'Memorandum of Understanding', desc: 'Multi-heir agreement on vault terms', icon: Users },
            { title: 'Digital Asset Declaration', desc: 'Formal declaration of digital asset holdings', icon: Shield },
          ].map((doc, i) => (
            <div key={i} className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/50 transition-colors cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-orange-500/10 transition-colors">
                  <doc.icon size={24} className="text-zinc-500 group-hover:text-orange-400 transition-colors" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium group-hover:text-orange-400 transition-colors">{doc.title}</h4>
                  <p className="text-sm text-zinc-500 mt-1">{doc.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          <FileText size={20} />
          Generate All Documents for {selectedState}
        </button>
      </div>
    );
  };

  // Learn View
  const LearnView = () => {
    const topics = [
      {
        category: 'Fundamentals',
        items: [
          { title: 'The Sovereignty Problem', desc: 'Why custodial inheritance betrays Bitcoin principles', duration: '10 min', href: '#/docs/sovereignty-problem' },
          { title: 'Quick Start Guide', desc: 'Get up and running in 10 minutes', duration: '10 min', href: '#/docs/quick-start' },
          { title: 'Hardware Wallet Integration', desc: 'Coldcard, Trezor, Ledger and more', duration: '15 min', href: '#/docs/hardware-wallets' },
        ]
      },
      {
        category: 'Technical',
        items: [
          { title: 'Timelock Vaults', desc: 'How Bitcoin scripts enforce time-based conditions', duration: '12 min', href: '#/docs/vault-timelock' },
          { title: 'Multisig Inheritance', desc: 'Distribute trust across multiple keys', duration: '15 min', href: '#/docs/vault-multisig' },
          { title: 'Miniscript & Timelocks', desc: 'Advanced scripting for complex inheritance', duration: '20 min', href: '#/docs/miniscript-timelocks' },
        ]
      },
      {
        category: 'Security & Privacy',
        items: [
          { title: 'Threat Model', desc: 'Understanding attack vectors and mitigations', duration: '12 min', href: '#/docs/security-threats' },
          { title: 'Backup Strategies', desc: 'Redundancy and disaster recovery', duration: '10 min', href: '#/docs/backups' },
          { title: 'Tor Integration', desc: 'Protect your network privacy', duration: '8 min', href: '#/docs/tor' },
        ]
      },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Learn</h2>
          <p className="text-zinc-500">Master Bitcoin inheritance and self-custody</p>
        </div>

        {topics.map(category => (
          <div key={category.category}>
            <h3 className="text-lg font-semibold text-white mb-4">{category.category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {category.items.map((item, i) => (
                <a key={i} href={item.href} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 hover:border-orange-500/50 transition-colors cursor-pointer group block">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-orange-500/10 transition-colors">
                      <BookOpen size={18} className="text-zinc-500 group-hover:text-orange-400 transition-colors" />
                    </div>
                    <span className="text-xs text-zinc-500">{item.duration}</span>
                  </div>
                  <h4 className="text-white font-medium mb-2 group-hover:text-orange-400 transition-colors">{item.title}</h4>
                  <p className="text-sm text-zinc-500">{item.desc}</p>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Settings Modal
  const SettingsModal = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button onClick={() => setShowSettings(false)} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
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
              onClick={() => setSettings(prev => ({ ...prev, torEnabled: !prev.torEnabled }))}
              className={`w-12 h-6 rounded-full transition-colors ${settings.torEnabled ? 'bg-purple-500' : 'bg-zinc-700'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${settings.torEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div>
            <p className="text-white font-medium mb-2">Network</p>
            <div className="grid grid-cols-3 gap-2">
              {['mainnet', 'testnet', 'signet'].map(net => (
                <button
                  key={net}
                  onClick={() => setSettings(prev => ({ ...prev, network: net }))}
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
              onChange={(e) => setSettings(prev => ({ ...prev, electrumServer: e.target.value }))}
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
            onClick={() => { handleSaveSettings(settings); setShowSettings(false); }}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading SatsLegacy...</p>
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(247, 147, 26, 0.03) 0%, transparent 50%)`,
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto relative">
        <div className="max-w-6xl mx-auto">
          {selectedVault ? (
            <VaultDetailView vault={selectedVault} />
          ) : currentView === 'dashboard' ? (
            <DashboardView />
          ) : currentView === 'vaults' ? (
            <VaultsView />
          ) : currentView === 'simulator' ? (
            <SimulatorView />
          ) : currentView === 'legal' ? (
            <LegalView />
          ) : currentView === 'learn' ? (
            <LearnView />
          ) : null}
        </div>
      </main>

      {showCreateWizard && (
        <VaultCreationWizard
          onComplete={handleCreateVault}
          onCancel={() => setShowCreateWizard(false)}
        />
      )}

      {showSettings && <SettingsModal />}

      {showDeleteModal && <DeleteVaultModal vault={showDeleteModal} />}

      {showAddBeneficiary && selectedVault && <AddBeneficiaryModal />}

      {showPasswordModal && (
        <PasswordModal
          mode={showPasswordModal}
          onSubmit={handleSaveVaultWithPassword}
          onCancel={() => { setShowPasswordModal(null); setPendingVaultData(null); }}
        />
      )}

      {showHeirKitGenerator && selectedVault && (
        <HeirKitGenerator
          vault={selectedVault}
          beneficiaries={selectedVault.beneficiaries}
          onClose={() => setShowHeirKitGenerator(false)}
        />
      )}
    </div>
  );
};

export default SatsLegacy;




