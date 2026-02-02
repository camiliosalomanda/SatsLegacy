import React from 'react';
import {
  BookOpen, Zap, Lock, Shield, Globe, FileText,
  ChevronRight, Search, Github, Network
} from 'lucide-react';

const categories = [
  {
    title: 'Getting Started',
    icon: Zap,
    color: 'orange',
    docs: [
      { title: 'Quick Start Guide', href: '#/docs/quick-start', desc: 'Get up and running in 10 minutes' },
      { title: 'Installation', href: '#/docs/installation', desc: 'Download and install SatsLegacy' },
      { title: 'Your First Vault', href: '#/docs/first-vault', desc: 'Create your first inheritance vault' },
    ]
  },
  {
    title: 'Core Concepts',
    icon: BookOpen,
    color: 'blue',
    docs: [
      { title: 'Vault Architecture', href: '#/docs/vault-architecture', desc: 'Interactive map of all vault options', featured: true },
      { title: 'The Sovereignty Problem', href: '#/docs/sovereignty-problem', desc: 'Why custodial inheritance fails', featured: true },
      { title: 'Miniscript & Timelocks', href: '#/docs/miniscript-timelocks', desc: 'Bitcoin scripting for inheritance', featured: true },
      { title: 'Key Distribution', href: '#/docs/key-distribution', desc: 'Securely distribute keys to heirs', featured: true },
    ]
  },
  {
    title: 'Vault Types',
    icon: Lock,
    color: 'purple',
    docs: [
      { title: 'Timelock Vaults', href: '#/docs/vault-timelock', desc: 'Time-based inheritance release' },
      { title: 'Dead Man\'s Switch', href: '#/docs/vault-deadman', desc: 'Proof-of-life based inheritance' },
      { title: 'Multisig Decay', href: '#/docs/vault-multisig', desc: 'Decaying quorum requirements' },
      { title: 'Hybrid Vaults', href: '#/docs/vault-hybrid', desc: 'Combine multiple conditions' },
    ]
  },
  {
    title: 'Security',
    icon: Shield,
    color: 'green',
    docs: [
      { title: 'Threat Model', href: '#/docs/security-threats', desc: 'Understanding attack vectors' },
      { title: 'Hardware Wallet Integration', href: '#/docs/hardware-wallets', desc: 'Coldcard, Trezor, Ledger setup' },
      { title: 'Backup Strategies', href: '#/docs/backups', desc: 'Redundancy and recovery' },
      { title: 'Duress Protection', href: '#/docs/duress', desc: 'Coercion-resistant features' },
    ]
  },
  {
    title: 'Infrastructure',
    icon: Globe,
    color: 'pink',
    docs: [
      { title: 'Shamir\'s Secret Sharing', href: '#/docs/shamir', desc: 'Split keys into shares' },
      { title: 'Nostr Relay Backup', href: '#/docs/nostr', desc: 'Censorship-resistant storage' },
      { title: 'Tor Integration', href: '#/docs/tor', desc: 'Privacy-preserving connections' },
    ]
  },
  {
    title: 'Legal & Planning',
    icon: FileText,
    color: 'yellow',
    docs: [
      { title: 'Estate Planning Integration', href: '#/docs/estate-planning', desc: 'Working with traditional planning' },
      { title: 'Legal Document Templates', href: '#/docs/legal-templates', desc: 'State-specific templates' },
      { title: 'Heir Communication', href: '#/docs/heir-communication', desc: 'Preparing your beneficiaries' },
    ]
  },
];

const getColorClasses = (color: string) => {
  const colors: Record<string, string> = {
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
    pink: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  };
  return colors[color] || colors.orange;
};

export function LearnView() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Learn</h2>
        <p className="text-zinc-400 mt-1">
          Master trustless Bitcoin inheritance using native scripting.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-xl">
        <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg">
          <Search size={20} className="text-zinc-500" />
          <input
            type="text"
            placeholder="Search documentation..."
            className="flex-1 bg-transparent text-white placeholder-zinc-500 outline-none"
          />
          <span className="text-xs text-zinc-600 px-2 py-1 bg-zinc-700 rounded">⌘K</span>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a
          href="#/docs/quick-start"
          className="flex items-center gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-orange-500/30 transition-colors group"
        >
          <Zap size={20} className="text-orange-400" />
          <span className="font-medium group-hover:text-orange-400 transition-colors">Quick Start</span>
        </a>
        <a
          href="#/docs/vault-architecture"
          className="flex items-center gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-orange-500/30 transition-colors group"
        >
          <Network size={20} className="text-orange-400" />
          <span className="font-medium group-hover:text-orange-400 transition-colors">Architecture Map</span>
        </a>
        <a
          href="https://github.com/camiliosalomanda/SatsLegacy"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-orange-500/30 transition-colors group"
        >
          <Github size={20} className="text-orange-400" />
          <span className="font-medium group-hover:text-orange-400 transition-colors">Source Code</span>
        </a>
        <a
          href="#/whitepaper"
          className="flex items-center gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-orange-500/30 transition-colors group"
        >
          <FileText size={20} className="text-orange-400" />
          <span className="font-medium group-hover:text-orange-400 transition-colors">Whitepaper</span>
        </a>
      </div>

      {/* Categories Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {categories.map((category, i) => (
          <div key={i} className="p-6 bg-zinc-800/30 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(category.color).split(' ').slice(0, 1).join(' ')}`}>
                <category.icon size={20} className={getColorClasses(category.color).split(' ').slice(1, 2).join(' ')} />
              </div>
              <h3 className="text-xl font-bold text-white">{category.title}</h3>
            </div>

            <div className="space-y-3">
              {category.docs.map((doc, j) => (
                <a
                  key={j}
                  href={doc.href}
                  className={`block p-3 rounded-lg hover:bg-zinc-800 transition-colors group ${doc.featured ? 'border border-orange-500/20 bg-orange-500/5' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white group-hover:text-orange-400 transition-colors">
                        {doc.title}
                        {doc.featured && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">Featured</span>
                        )}
                      </h4>
                      <p className="text-sm text-zinc-500">{doc.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-zinc-600 group-hover:text-orange-400 transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
