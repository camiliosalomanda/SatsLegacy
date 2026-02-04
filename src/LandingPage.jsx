/**
 * SatsLegacy Landing Page
 *
 * Marketing + Download page for the desktop app
 */

import React, { useState } from 'react';
import {
  Shield, Download, Lock, Clock, Users, Key, Zap, Globe,
  CheckCircle, ArrowRight, Github, Monitor, Apple, Terminal,
  ChevronDown, ExternalLink, Star, Quote, FileText, AlertTriangle, BookOpen
} from 'lucide-react';

const LandingPage = ({ onEnterApp }) => {
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const DOWNLOAD_URL_WINDOWS = 'https://github.com/camiliosalomanda/SatsLegacy/releases/download/v1.5.4/SatsLegacy.Setup.1.5.4.exe';
  const DOWNLOAD_URL_WINDOWS_PORTABLE = 'https://github.com/camiliosalomanda/SatsLegacy/releases/download/v1.5.4/SatsLegacy.1.5.4.exe';
  const DOWNLOAD_URL_MAC = 'https://github.com/camiliosalomanda/SatsLegacy/releases/download/v1.5.4/SatsLegacy-1.5.4-arm64.dmg';
  const DOWNLOAD_URL_MAC_INTEL = 'https://github.com/camiliosalomanda/SatsLegacy/releases/download/v1.5.4/SatsLegacy-1.5.4.dmg';
  const DOWNLOAD_URL_LINUX = 'https://github.com/camiliosalomanda/SatsLegacy/releases/download/v1.5.4/SatsLegacy-1.5.4.AppImage';
  const DOWNLOAD_URL_LINUX_DEB = 'https://github.com/camiliosalomanda/SatsLegacy/releases/download/v1.5.4/SatsLegacy_1.5.4_amd64.deb';

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(247, 147, 26, 0.15) 0%, transparent 50%)`,
          }} />
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 70% 80%, rgba(247, 147, 26, 0.1) 0%, transparent 40%)`,
          }} />
        </div>

        {/* Nav */}
        <nav className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="SatsLegacy" className="w-10 h-10" />
            <span className="text-xl font-bold">SatsLegacy</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-zinc-400 hover:text-white transition-colors">Pricing</a>
            <a href="#download" className="text-zinc-400 hover:text-white transition-colors">Download</a>
            <a href="#learn" className="text-zinc-400 hover:text-white transition-colors">Learn</a>
            <button
              onClick={onEnterApp}
              className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Launch Web App
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full mb-8">
            <Zap size={16} className="text-orange-400" />
            <span className="text-sm text-orange-400">100% Self-Sovereign • No Third Parties</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Bitcoin Inheritance<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              Without Trust
            </span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12">
            Create trustless inheritance vaults using Bitcoin's native scripting.
            No custody, no fees, no third parties. Your keys, your rules, your legacy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#download"
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              <Download size={20} />
              Download for Windows
            </a>
            <button
              onClick={onEnterApp}
              className="flex items-center gap-2 px-8 py-4 bg-zinc-800 text-white font-semibold rounded-xl hover:bg-zinc-700 transition-colors"
            >
              Try Web Demo
              <ArrowRight size={20} />
            </button>
          </div>

          <p className="text-sm text-zinc-600 mt-6">
            Free tier available • No signup required • Open source
          </p>

          {/* Heir Claim Link */}
          <div className="mt-8 pt-8 border-t border-zinc-800/50">
            <a 
              href="#/claim" 
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-400 transition-colors"
            >
              <Key size={16} />
              <span>I'm an heir — claim my inheritance</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </header>

      {/* Trust Bar */}
      <section className="border-y border-zinc-800 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-white">100%</p>
              <p className="text-sm text-zinc-500">Self-Custody</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">0</p>
              <p className="text-sm text-zinc-500">Third Parties</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">∞</p>
              <p className="text-sm text-zinc-500">Time Horizon</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-400">₿</p>
              <p className="text-sm text-zinc-500">Bitcoin Only</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">
              The Problem with<br />
              <span className="text-red-400">Traditional Inheritance</span>
            </h2>
            <div className="space-y-4">
              {[
                'Custodial services can rug pull or get hacked',
                'Lawyers and banks add fees and delays',
                'Government can freeze or seize assets',
                'Third parties require trust and KYC',
                'Centralized points of failure'
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-400 text-sm">✕</span>
                  </div>
                  <p className="text-zinc-400">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6">
              The SatsLegacy<br />
              <span className="text-green-400">Solution</span>
            </h2>
            <div className="space-y-4">
              {[
                'Bitcoin scripts enforce inheritance rules trustlessly',
                'No intermediaries - direct peer-to-peer',
                'Censorship resistant and unseizable',
                'No accounts, no KYC, no permission needed',
                'Decentralized with Shamir backups + Nostr'
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle size={14} className="text-green-400" />
                  </div>
                  <p className="text-zinc-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-zinc-900/50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Sovereign Infrastructure</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Choose your own topology. Mix and match infrastructure and inheritance logic independently.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Lock, title: 'Timelock Vaults', desc: 'Funds unlock at a specific block height. Immutable once set.', color: 'orange' },
              { icon: Clock, title: "Dead Man's Switch", desc: 'Requires periodic proof of life. Miss a check-in, heirs can claim.', color: 'purple' },
              { icon: Users, title: 'Multisig Decay', desc: 'Starts 2-of-3, decays to 1-of-2 after timelock. Automatic handoff.', color: 'blue' },
              { icon: Key, title: 'Shamir Backups', desc: 'Split vault keys into shares. Any 2-of-3 reconstructs.', color: 'green' },
              { icon: Globe, title: 'Nostr Relay Backup', desc: 'Censorship-resistant off-site storage. Survives house fires.', color: 'pink' },
              { icon: Shield, title: 'Duress Protection', desc: 'Wrong PIN routes to decoy or burn address. Coercion-resistant.', color: 'red' }
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl hover:border-zinc-600 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-4`}>
                  <feature.icon size={24} className={`text-${feature.color}-400`} style={{ color: feature.color === 'orange' ? '#fb923c' : undefined }} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-zinc-400">Four steps to sovereign inheritance</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: '1', title: 'Create Vault', desc: 'Choose infrastructure and inheritance logic' },
            { step: '2', title: 'Add Heirs', desc: 'Import heir public keys from their hardware wallets' },
            { step: '3', title: 'Fund Vault', desc: 'Sign with your hardware wallet via PSBT' },
            { step: '4', title: 'Distribute Keys', desc: 'Give heirs their keys and instructions' }
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-black">
                {item.step}
              </div>
              <h3 className="font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-zinc-900/50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-zinc-400">One-time purchase. No subscriptions. Pay with Bitcoin.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Standard */}
            <div className="p-8 bg-zinc-800/50 border border-zinc-700 rounded-2xl">
              <h3 className="text-xl font-bold mb-2">Standard</h3>
              <p className="text-4xl font-bold mb-1">$99</p>
              <p className="text-zinc-500 text-sm mb-6">one-time</p>
              <ul className="space-y-3 mb-8">
                {['10 vaults', 'Simple & Resilient Sovereign bundles', 'Timelock & Multisig Decay', 'Shamir backups', 'Nostr sync'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                    <CheckCircle size={16} className="text-green-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <span
                className="block w-full py-3 text-center bg-zinc-700 text-zinc-400 rounded-lg cursor-not-allowed"
              >
                Coming Soon
              </span>
            </div>

            {/* Pro */}
            <div className="p-8 bg-gradient-to-b from-orange-500/10 to-transparent border border-orange-500/30 rounded-2xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-black text-xs font-bold rounded-full">
                BEST VALUE
              </div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <p className="text-4xl font-bold mb-1">$299</p>
              <p className="text-zinc-500 text-sm mb-6">one-time</p>
              <ul className="space-y-3 mb-8">
                {['Unlimited vaults', 'All features & bundles', 'Legal templates', 'Priority support', 'Lifetime updates'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                    <CheckCircle size={16} className="text-orange-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <span
                className="block w-full py-3 text-center bg-zinc-700 text-zinc-400 rounded-lg cursor-not-allowed"
              >
                Coming Soon
              </span>
            </div>
          </div>

          <p className="text-center text-zinc-500 mt-8">
            Download free and upgrade anytime from within the app.
          </p>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Download SatsLegacy</h2>
          <p className="text-zinc-400">Available for Windows, macOS, and Linux.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {/* Windows */}
          <div className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl text-center">
            <Monitor size={48} className="mx-auto mb-4 text-orange-400" />
            <h3 className="font-semibold text-white mb-1">Windows</h3>
            <p className="text-sm text-zinc-500 mb-4">Windows 10/11</p>
            <div className="space-y-2">
              <a
                href={DOWNLOAD_URL_WINDOWS}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-medium rounded-lg transition-colors text-sm"
              >
                <Download size={16} />
                Installer (.exe)
              </a>
              <a
                href={DOWNLOAD_URL_WINDOWS_PORTABLE}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-sm"
              >
                <Download size={16} />
                Portable (.exe)
              </a>
            </div>
          </div>

          {/* Mac */}
          <div className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl text-center">
            <Apple size={48} className="mx-auto mb-4 text-orange-400" />
            <h3 className="font-semibold text-white mb-1">macOS</h3>
            <p className="text-sm text-zinc-500 mb-4">Intel & Apple Silicon</p>
            <div className="space-y-2">
              <a
                href={DOWNLOAD_URL_MAC}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-medium rounded-lg transition-colors text-sm"
              >
                <Download size={16} />
                Apple Silicon (.dmg)
              </a>
              <a
                href={DOWNLOAD_URL_MAC_INTEL}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-sm"
              >
                <Download size={16} />
                Intel (.dmg)
              </a>
            </div>
          </div>

          {/* Linux */}
          <div className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl text-center">
            <Terminal size={48} className="mx-auto mb-4 text-orange-400" />
            <h3 className="font-semibold text-white mb-1">Linux</h3>
            <p className="text-sm text-zinc-500 mb-4">AppImage & Deb</p>
            <div className="space-y-2">
              <a
                href={DOWNLOAD_URL_LINUX}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-medium rounded-lg transition-colors text-sm"
              >
                <Download size={16} />
                AppImage
              </a>
              <a
                href={DOWNLOAD_URL_LINUX_DEB}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-sm"
              >
                <Download size={16} />
                Debian (.deb)
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <a
            href="https://github.com/camiliosalomanda/SatsLegacy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <Github size={20} />
            View Source on GitHub
          </a>
        </div>
      </section>

      {/* Education & Resources */}
      <section id="learn" className="bg-gradient-to-b from-orange-500/10 to-transparent border-t border-orange-500/20">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Understand Trustless Inheritance
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Don't trust, verify. Learn the technical foundations of sovereign Bitcoin inheritance.
            </p>
          </div>

          {/* Whitepaper CTA */}
          <div className="mb-16 p-8 bg-zinc-800/50 border border-zinc-700 rounded-2xl max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                <FileText size={40} className="text-black" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">SatsLegacy Whitepaper</h3>
                <p className="text-zinc-400 mb-4">
                  The complete technical guide to trustless Bitcoin inheritance. Covers Miniscript
                  policies, timelock mechanics, key distribution strategies, and security threat models.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <a
                    href="/SatsLegacy-Whitepaper.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Download size={18} />
                    Download PDF
                  </a>
                  <a
                    href="#/whitepaper"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-700 text-white font-semibold rounded-lg hover:bg-zinc-600 transition-colors"
                  >
                    <ExternalLink size={18} />
                    Read Online
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Deep-Dive Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1: The Sovereignty Problem */}
            <div className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl hover:border-orange-500/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">The Sovereignty Problem</h3>
              <p className="text-zinc-400 text-sm mb-4">
                Why custodial inheritance betrays Bitcoin's core promise. The impossible tradeoffs
                of traditional estate planning and third-party trust.
              </p>
              <a
                href="#/docs/sovereignty-problem"
                className="inline-flex items-center gap-2 text-orange-400 text-sm group-hover:text-orange-300 transition-colors"
              >
                Learn more <ArrowRight size={14} />
              </a>
            </div>

            {/* Card 2: Miniscript & Timelocks */}
            <div className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl hover:border-orange-500/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                <Lock size={24} className="text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Miniscript & Timelocks</h3>
              <p className="text-zinc-400 text-sm mb-4">
                How Bitcoin's native scripting enables trustless inheritance. OP_CHECKLOCKTIMEVERIFY,
                spending policies, and dead man's switches explained.
              </p>
              <a
                href="#/docs/miniscript-timelocks"
                className="inline-flex items-center gap-2 text-orange-400 text-sm group-hover:text-orange-300 transition-colors"
              >
                Learn more <ArrowRight size={14} />
              </a>
            </div>

            {/* Card 3: Key Distribution */}
            <div className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl hover:border-orange-500/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                <Key size={24} className="text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Key Distribution</h3>
              <p className="text-zinc-400 text-sm mb-4">
                Practical strategies for proactive key distribution. Hardware wallet ceremonies,
                Shamir's Secret Sharing, and encrypted heir kits.
              </p>
              <a
                href="#/docs/key-distribution"
                className="inline-flex items-center gap-2 text-orange-400 text-sm group-hover:text-orange-300 transition-colors"
              >
                Learn more <ArrowRight size={14} />
              </a>
            </div>
          </div>

          {/* Documentation Hub Link */}
          <div className="mt-12 text-center">
            <a
              href="#/docs"
              className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:border-zinc-600 hover:text-white transition-colors"
            >
              <BookOpen size={18} />
              View Full Documentation
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/favicon.svg" alt="SatsLegacy" className="w-8 h-8" />
              <span className="font-bold">SatsLegacy</span>
              <span className="text-zinc-600">|</span>
              <span className="text-sm text-zinc-500">Sovereign Bitcoin Inheritance</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <a href="https://github.com/camiliosalomanda/SatsLegacy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
              <a href="#/docs" className="hover:text-white transition-colors">Documentation</a>
              <a href="#/claim" className="hover:text-orange-400 transition-colors">Heir Portal</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-zinc-800 text-center text-sm text-zinc-600">
            <p>Not your keys, not your coins. Not your script, not your inheritance.</p>
            <p className="mt-2">© 2026 SatsLegacy. Open source under MIT License.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
