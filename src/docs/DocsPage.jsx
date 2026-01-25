/**
 * SatsLegacy Documentation Hub
 * 
 * Central documentation index with links to all guides and resources
 */

import React from 'react';
import { 
  Shield, BookOpen, AlertTriangle, Lock, Key, Clock, Users, 
  FileText, ArrowRight, ExternalLink, Github, Zap, Globe,
  ChevronRight, Search
} from 'lucide-react';

const DocsPage = ({ onNavigate }) => {
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

  const getColorClasses = (color) => {
    const colors = {
      orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      green: 'bg-green-500/10 text-green-400 border-green-500/30',
      pink: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
      yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      red: 'bg-red-500/10 text-red-400 border-red-500/30',
    };
    return colors[color] || colors.orange;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="#/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Shield size={24} className="text-black" />
              </div>
              <span className="text-xl font-bold">SatsLegacy</span>
            </a>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Documentation</span>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/camiliosalomanda/SatsLegacy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <Github size={20} />
            </a>
            <a 
              href="#/"
              className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Back to App
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            SatsLegacy Documentation
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
            Learn how to create trustless Bitcoin inheritance using native scripting. 
            No custody, no third parties, no compromise.
          </p>
          
          {/* Search placeholder */}
          <div className="max-w-xl mx-auto">
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
        </div>
      </section>

      {/* Quick Links */}
      <section className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a 
              href="#/docs/quick-start"
              className="flex items-center gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-orange-500/30 transition-colors group"
            >
              <Zap size={20} className="text-orange-400" />
              <span className="font-medium group-hover:text-orange-400 transition-colors">Quick Start</span>
            </a>
            <a 
              href="#/whitepaper"
              className="flex items-center gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-orange-500/30 transition-colors group"
            >
              <FileText size={20} className="text-orange-400" />
              <span className="font-medium group-hover:text-orange-400 transition-colors">Whitepaper</span>
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
              href="/SatsLegacy-Whitepaper.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-orange-500/30 transition-colors group"
            >
              <ArrowRight size={20} className="text-orange-400" />
              <span className="font-medium group-hover:text-orange-400 transition-colors">Download PDF</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {categories.map((category, i) => (
            <div key={i} className="p-6 bg-zinc-800/30 border border-zinc-800 rounded-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(category.color).split(' ').slice(0, 1).join(' ')}`}>
                  <category.icon size={20} className={getColorClasses(category.color).split(' ').slice(1, 2).join(' ')} />
                </div>
                <h2 className="text-xl font-bold">{category.title}</h2>
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
                        <h3 className="font-medium text-white group-hover:text-orange-400 transition-colors">
                          {doc.title}
                          {doc.featured && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">Featured</span>
                          )}
                        </h3>
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
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-800 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to secure your legacy?</h2>
          <p className="text-zinc-400 mb-8">Download SatsLegacy and create your first inheritance vault.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/#download"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Download SatsLegacy
            </a>
            <a 
              href="#/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 text-white font-semibold rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Try Web Demo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-zinc-600">
          <p>Not your keys, not your coins. Not your script, not your inheritance.</p>
          <p className="mt-2">© 2025 SatsLegacy. Open source under MIT License.</p>
        </div>
      </footer>
    </div>
  );
};

export default DocsPage;
