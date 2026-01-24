import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Shield, Clock, Users, FileText, Key, Wallet, ChevronRight, ChevronDown, Plus, Copy, Check, AlertTriangle, Eye, EyeOff, QrCode, Download, Settings, Home, PieChart, BookOpen, ArrowRight, Zap, Globe, RefreshCw, Timer, UserPlus, Trash2, Edit3, Save, X } from 'lucide-react';

// Import the new Vault Creation Wizard
import { VaultCreationWizard } from './src/vault/creation/wizard/VaultCreationWizard';

// ============================================
// BITTRUST - SOVEREIGN BITCOIN INHERITANCE
// ============================================

const BitTrust = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [vaults, setVaults] = useState([
    {
      id: 1,
      name: 'Family Legacy Vault',
      balance: 2.5,
      balanceUSD: 250000,
      scriptType: 'timelock',
      lockDate: new Date('2027-01-01'),
      beneficiaries: [
        { name: 'Sarah (Daughter)', percentage: 50, pubkey: 'xpub6D4B...kL9m' },
        { name: 'Michael (Son)', percentage: 50, pubkey: 'xpub6E5C...nM2p' }
      ],
      status: 'active',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      lastActivity: new Date('2024-12-15'),
      inactivityTrigger: 730, // days
      // New fields from sovereign vault config
      infrastructure: ['local', 'microsd'],
      logic: { primary: 'timelock', gates: [] },
      modifiers: {}
    }
  ]);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [selectedVault, setSelectedVault] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    torEnabled: false,
    network: 'mainnet',
    electrumServer: 'electrum.blockstream.info:50002',
    theme: 'dark'
  });
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [simulatorData, setSimulatorData] = useState({
    btcAmount: 1,
    years: 25,
    generations: 2,
    heirs: 2
  });

  // Simulated BTC price
  const btcPrice = 100000;

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

  // Handle new vault creation from the sovereign wizard
  const handleCreateVault = (config, name, description) => {
    const newVault = {
      id: Date.now(),
      name: name,
      description: description,
      balance: 0,
      balanceUSD: 0,
      scriptType: config.primaryLogic,
      lockDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
      beneficiaries: [],
      status: 'active',
      address: 'bc1q' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      lastActivity: new Date(),
      inactivityTrigger: 365,
      // Sovereign config
      infrastructure: config.infrastructure,
      logic: {
        primary: config.primaryLogic,
        gates: config.additionalGates
      },
      modifiers: {
        staggered: config.modifiers.includes('staggered'),
        multiBeneficiary: config.modifiers.includes('multi_beneficiary'),
        decoy: config.modifiers.includes('decoy')
      }
    };
    
    setVaults(prev => [...prev, newVault]);
    setShowCreateWizard(false);
  };

  // Navigation
  const NavItem = ({ icon: Icon, label, view, badge }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        currentView === view
          ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-orange-400 border border-orange-500/30'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
      {badge && (
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
    {!window.isElectron && (
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 px-2 py-2 mb-4 text-zinc-500 hover:text-white transition-colors text-sm"
      >
        <ChevronRight size={16} className="rotate-180" />
        Back to Home
      </button>
    )}
    
    {/* Logo */}
    <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
          <Shield size={24} className="text-black" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">BitTrust</h1>
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
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Block Height</span>
            <span className="text-xs text-zinc-300 font-mono">878,234</span>
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

  // Vault Card Component
  const VaultCard = ({ vault }) => {
    const daysUntil = getDaysUntilUnlock(vault);
    const progress = vault.scriptType === 'timelock'
      ? Math.min(100, ((730 - daysUntil) / 730) * 100)
      : Math.min(100, ((vault.inactivityTrigger - daysUntil) / vault.inactivityTrigger) * 100);

    // Get infrastructure badges
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
      <div
        onClick={() => setSelectedVault(vault)}
        className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6 cursor-pointer hover:border-orange-500/50 transition-all duration-300 group"
      >
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
          <ChevronRight size={20} className="text-zinc-600 group-hover:text-orange-400 transition-colors" />
        </div>

        {/* Balance */}
        <div className="mb-4">
          <p className="text-3xl font-bold text-white">{vault.balance} <span className="text-lg text-zinc-500">BTC</span></p>
          <p className="text-sm text-zinc-500">${vault.balanceUSD.toLocaleString()} USD</p>
        </div>

        {/* Time Lock Progress */}
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

        {/* Beneficiaries Preview */}
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
    );
  };

  // Dashboard View
  const DashboardView = () => {
    const totalBTC = vaults.reduce((sum, v) => sum + v.balance, 0);
    const totalUSD = totalBTC * btcPrice;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-zinc-500">Your Bitcoin legacy is secure</p>
          </div>
          <button
            onClick={() => setShowCreateWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            New Vault
          </button>
        </div>

        {/* Stats Grid */}
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
            <p className="text-sm text-zinc-500 mt-1">All secure & monitored</p>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users size={20} className="text-purple-400" />
              </div>
              <span className="text-zinc-500">Beneficiaries</span>
            </div>
            <p className="text-3xl font-bold text-white">{vaults.reduce((sum, v) => sum + v.beneficiaries.length, 0)}</p>
            <p className="text-sm text-zinc-500 mt-1">Across all vaults</p>
          </div>
        </div>

        {/* Vaults */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Your Vaults</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vaults.map(vault => (
              <VaultCard key={vault.id} vault={vault} />
            ))}

            {/* Empty State / Add New */}
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

        {/* Recent Activity */}
        <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { icon: Shield, text: 'Vault "Family Legacy" created', time: '2 days ago', color: 'text-green-400' },
              { icon: Key, text: 'Hardware wallet connected (Coldcard)', time: '2 days ago', color: 'text-orange-400' },
              { icon: Users, text: '2 beneficiaries added', time: '2 days ago', color: 'text-purple-400' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-zinc-800/50 last:border-0">
                <div className={`w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center`}>
                  <item.icon size={16} className={item.color} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-zinc-300">{item.text}</p>
                  <p className="text-xs text-zinc-600">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Vault Detail View
  const VaultDetailView = ({ vault }) => {
    const [showPrivateData, setShowPrivateData] = useState(false);
    const daysUntil = getDaysUntilUnlock(vault);

    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setSelectedVault(null)}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
        >
          <ChevronRight size={16} className="rotate-180" />
          Back to Vaults
        </button>

        {/* Vault Header */}
        <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 flex items-center justify-center">
                <Lock size={32} className="text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{vault.name}</h2>
                <p className="text-zinc-500 capitalize">{vault.logic?.primary || vault.scriptType} Script • {vault.status}</p>
                {vault.description && (
                  <p className="text-sm text-zinc-400 mt-1">{vault.description}</p>
                )}
              </div>
            </div>
            <button className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
              <Edit3 size={18} className="text-zinc-400" />
            </button>
          </div>

          {/* Balance */}
          <div className="grid grid-cols-2 gap-6 p-4 bg-zinc-800/50 rounded-xl">
            <div>
              <p className="text-zinc-500 text-sm mb-1">Balance</p>
              <p className="text-3xl font-bold text-white">{vault.balance} BTC</p>
              <p className="text-zinc-500">${vault.balanceUSD.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-sm mb-1">Time Until Unlock</p>
              <p className="text-3xl font-bold text-orange-400">{daysUntil} days</p>
              <p className="text-zinc-500">{new Date(vault.lockDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Infrastructure & Logic Config */}
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
            {vault.modifiers && Object.values(vault.modifiers).some(v => v) && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-sm text-zinc-500 mb-2">Modifiers</p>
                <div className="flex flex-wrap gap-2">
                  {vault.modifiers.staggered && (
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm">Staggered Release</span>
                  )}
                  {vault.modifiers.multiBeneficiary && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">Multi-Beneficiary</span>
                  )}
                  {vault.modifiers.decoy && (
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm">Decoy Vault</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Address */}
        <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Vault Address</h3>
          <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl">
            <code className="flex-1 text-sm text-zinc-300 font-mono break-all">{vault.address}</code>
            <button
              onClick={() => copyToClipboard(vault.address)}
              className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors"
            >
              {copiedAddress ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-zinc-400" />}
            </button>
            <button className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors">
              <QrCode size={18} className="text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Script Details */}
        <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Trust Script</h3>
            <button
              onClick={() => setShowPrivateData(!showPrivateData)}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
            >
              {showPrivateData ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPrivateData ? 'Hide' : 'Show'} Details
            </button>
          </div>

          <div className="p-4 bg-zinc-950 rounded-xl font-mono text-sm">
            <code className="text-green-400">
              {showPrivateData
                ? `or(\n  pk(owner_key),\n  and(\n    thresh(1,\n      pk(heir1_${vault.beneficiaries[0]?.name.split(' ')[0].toLowerCase() || 'unknown'}),\n      pk(heir2_${vault.beneficiaries[1]?.name.split(' ')[0].toLowerCase() || 'unknown'})\n    ),\n    after(${Math.floor(new Date(vault.lockDate).getTime() / 1000)})\n  )\n)`
                : 'or(pk(...), and(thresh(...), after(...)))'}
            </code>
          </div>

          <p className="text-xs text-zinc-600 mt-3">
            This Miniscript allows you to spend at any time, or beneficiaries can spend after the timelock expires.
          </p>
        </div>

        {/* Beneficiaries */}
        <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Beneficiaries</h3>
            <button className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors">
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
                  <p className="text-xs text-zinc-500">{(vault.balance * beneficiary.percentage / 100).toFixed(4)} BTC</p>
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

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 p-4 bg-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-700 transition-colors">
            <Download size={18} />
            Export PSBT
          </button>
          <button className="flex items-center justify-center gap-2 p-4 bg-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-700 transition-colors">
            <FileText size={18} />
            Generate Legal Docs
          </button>
        </div>
      </div>
    );
  };

  // Legacy Simulator View
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
          if (year < simulatorData.years) {
            value = value;
          }
        }

        return {
          scenario,
          data: yearlyData,
          finalUSD: yearlyData[yearlyData.length - 1].usd
        };
      });

      setProjections(results);
    };

    useEffect(() => {
      calculateProjections();
    }, [simulatorData]);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Legacy Simulator</h2>
          <p className="text-zinc-500">Visualize your Bitcoin wealth across generations</p>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <label className="text-sm text-zinc-500 block mb-2">BTC Amount</label>
            <input
              type="number"
              value={simulatorData.btcAmount}
              onChange={(e) => setSimulatorData(prev => ({ ...prev, btcAmount: parseFloat(e.target.value) || 0 }))}
              step="0.1"
              min="0"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xl font-bold focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <label className="text-sm text-zinc-500 block mb-2">Time Horizon (Years)</label>
            <input
              type="number"
              value={simulatorData.years}
              onChange={(e) => setSimulatorData(prev => ({ ...prev, years: parseInt(e.target.value) || 0 }))}
              min="1"
              max="100"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xl font-bold focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <label className="text-sm text-zinc-500 block mb-2">Generations</label>
            <input
              type="number"
              value={simulatorData.generations}
              onChange={(e) => setSimulatorData(prev => ({ ...prev, generations: parseInt(e.target.value) || 1 }))}
              min="1"
              max="5"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xl font-bold focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <label className="text-sm text-zinc-500 block mb-2">Heirs per Gen</label>
            <input
              type="number"
              value={simulatorData.heirs}
              onChange={(e) => setSimulatorData(prev => ({ ...prev, heirs: parseInt(e.target.value) || 1 }))}
              min="1"
              max="10"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xl font-bold focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Projections */}
        {projections && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projections.map((p, i) => (
              <div
                key={p.scenario}
                className={`bg-zinc-900/60 border rounded-xl p-6 ${
                  p.scenario === 'moderate' ? 'border-orange-500/50' : 'border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-zinc-500 capitalize">{p.scenario}</span>
                  {p.scenario === 'moderate' && (
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">Recommended</span>
                  )}
                </div>
                <p className="text-3xl font-bold text-white mb-2">
                  ${(p.finalUSD / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-zinc-500">
                  After {simulatorData.years} years
                </p>
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-sm text-zinc-400">
                    Per heir (Gen {simulatorData.generations}):
                    <span className="text-white font-medium ml-2">
                      ${(p.finalUSD / Math.pow(simulatorData.heirs, simulatorData.generations) / 1000000).toFixed(2)}M
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Family Tree Visualization */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Generational Distribution</h3>

          <div className="flex flex-col items-center">
            {/* You */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-2">
                <span className="text-2xl">👤</span>
              </div>
              <p className="text-white font-medium">You</p>
              <p className="text-sm text-orange-400">{simulatorData.btcAmount} BTC</p>
            </div>

            {/* Connector */}
            <div className="w-0.5 h-8 bg-zinc-700 my-2" />

            {/* Generation 1 */}
            <div className="flex gap-8">
              {Array.from({ length: Math.min(simulatorData.heirs, 4) }).map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/50 to-purple-600/50 flex items-center justify-center mb-2">
                    <span className="text-xl">👤</span>
                  </div>
                  <p className="text-zinc-400 text-sm">Heir {i + 1}</p>
                  <p className="text-xs text-zinc-500">{(simulatorData.btcAmount / simulatorData.heirs).toFixed(4)} BTC</p>
                </div>
              ))}
            </div>

            {simulatorData.generations > 1 && (
              <>
                <div className="w-0.5 h-8 bg-zinc-700 my-2" />
                <p className="text-zinc-600 text-sm">+ {simulatorData.generations - 1} more generation(s)...</p>
              </>
            )}
          </div>
        </div>

        {/* Education */}
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Why Bitcoin for Generational Wealth?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Lock, title: 'Immutable', desc: 'Cannot be confiscated or altered by any authority' },
              { icon: Zap, title: 'Scarce', desc: 'Only 21 million will ever exist—no inflation' },
              { icon: Globe, title: 'Portable', desc: 'Cross any border with just 12 words' },
              { icon: Shield, title: 'Self-Sovereign', desc: 'No banks, no intermediaries, no permission needed' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <item.icon size={18} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{item.title}</p>
                  <p className="text-sm text-zinc-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Legal Documents View
  const LegalView = () => {
    const [selectedState, setSelectedState] = useState('TX');

    const documents = [
      { id: 'will', name: 'Bitcoin-Specific Will', desc: 'Testamentary disposition with digital asset provisions', status: 'draft' },
      { id: 'trust', name: 'Revocable Living Trust', desc: 'Inter vivos trust for Bitcoin with successor trustee', status: 'not_started' },
      { id: 'memo', name: 'Digital Asset Memo', desc: 'Confidential instructions for accessing your Bitcoin', status: 'not_started' },
      { id: 'letter', name: 'Letter of Instruction', desc: 'Step-by-step guide for your heirs', status: 'not_started' },
      { id: 'fiduciary', name: 'Fiduciary Agreement', desc: 'Appointment of digital asset executor', status: 'not_started' },
    ];

    const states = [
      { code: 'TX', name: 'Texas', property: 'Community', tax: 'None' },
      { code: 'CA', name: 'California', property: 'Community', tax: 'None (State)' },
      { code: 'NY', name: 'New York', property: 'Equitable', tax: '$6.94M threshold' },
      { code: 'WY', name: 'Wyoming', property: 'Common Law', tax: 'None' },
      { code: 'FL', name: 'Florida', property: 'Common Law', tax: 'None' },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Legal Documents</h2>
          <p className="text-zinc-500">Bitcoin-specific estate planning templates</p>
        </div>

        {/* Disclaimer */}
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-200 font-medium">Legal Disclaimer</p>
              <p className="text-sm text-yellow-200/70 mt-1">
                These templates are for informational purposes only and do not constitute legal advice.
                Consult with a qualified attorney in your jurisdiction before executing any legal documents.
              </p>
            </div>
          </div>
        </div>

        {/* State Selection */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Your Jurisdiction</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {states.map(state => (
              <button
                key={state.code}
                onClick={() => setSelectedState(state.code)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedState === state.code
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <p className="text-white font-medium">{state.code}</p>
                <p className="text-xs text-zinc-500">{state.name}</p>
              </button>
            ))}
          </div>

          {selectedState && (
            <div className="mt-4 p-4 bg-zinc-800/50 rounded-xl">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500">Property Type</p>
                  <p className="text-white">{states.find(s => s.code === selectedState)?.property} Property</p>
                </div>
                <div>
                  <p className="text-zinc-500">Estate Tax</p>
                  <p className="text-white">{states.find(s => s.code === selectedState)?.tax}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="space-y-4">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-orange-500/10 transition-colors">
                    <FileText size={24} className="text-zinc-500 group-hover:text-orange-400 transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium group-hover:text-orange-400 transition-colors">{doc.name}</h4>
                    <p className="text-sm text-zinc-500">{doc.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    doc.status === 'draft'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {doc.status === 'draft' ? 'Draft' : 'Not Started'}
                  </span>
                  <ChevronRight size={20} className="text-zinc-600 group-hover:text-orange-400 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Generate Button */}
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
          { title: 'Why Bitcoin for Inheritance', desc: 'Understand the unique properties that make BTC ideal for generational wealth', duration: '10 min' },
          { title: 'Self-Custody Basics', desc: 'Learn the fundamentals of holding your own keys', duration: '15 min' },
          { title: 'Hardware Wallet Guide', desc: 'Compare Coldcard, Trezor, Ledger and more', duration: '20 min' },
        ]
      },
      {
        category: 'Technical',
        items: [
          { title: 'Understanding Time Locks (CLTV)', desc: 'How Bitcoin scripts enforce time-based conditions', duration: '12 min' },
          { title: 'Multi-Signature Explained', desc: 'Distribute trust across multiple keys', duration: '15 min' },
          { title: 'Miniscript Deep Dive', desc: 'Advanced scripting for complex inheritance', duration: '25 min' },
        ]
      },
      {
        category: 'Privacy',
        items: [
          { title: 'Running Tor with BitTrust', desc: 'Protect your network privacy', duration: '8 min' },
          { title: 'Silent Payments for Heirs', desc: 'Give beneficiaries unlinkable addresses', duration: '12 min' },
          { title: 'PayJoin for Family Transfers', desc: 'Break transaction heuristics', duration: '15 min' },
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
                <div
                  key={i}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 hover:border-orange-500/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-orange-500/10 transition-colors">
                      <BookOpen size={18} className="text-zinc-500 group-hover:text-orange-400 transition-colors" />
                    </div>
                    <span className="text-xs text-zinc-500">{item.duration}</span>
                  </div>
                  <h4 className="text-white font-medium mb-2 group-hover:text-orange-400 transition-colors">{item.title}</h4>
                  <p className="text-sm text-zinc-500">{item.desc}</p>
                </div>
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
          <button
            onClick={() => setShowSettings(false)}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tor Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">🧅 Tor Network</p>
              <p className="text-sm text-zinc-500">Route all traffic through Tor for privacy</p>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, torEnabled: !prev.torEnabled }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.torEnabled ? 'bg-purple-500' : 'bg-zinc-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                settings.torEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Network */}
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

          {/* Electrum Server */}
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
        </div>

        <div className="p-6 border-t border-zinc-800">
          <button
            onClick={() => setShowSettings(false)}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );

  // Main App
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Background Pattern */}
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
            <DashboardView />
          ) : currentView === 'simulator' ? (
            <SimulatorView />
          ) : currentView === 'legal' ? (
            <LegalView />
          ) : currentView === 'learn' ? (
            <LearnView />
          ) : null}
        </div>
      </main>

      {/* Modals */}
      {showCreateWizard && (
        <VaultCreationWizard
          onComplete={handleCreateVault}
          onCancel={() => setShowCreateWizard(false)}
        />
      )}
      {showSettings && <SettingsModal />}
    </div>
  );
};

export default BitTrust;
