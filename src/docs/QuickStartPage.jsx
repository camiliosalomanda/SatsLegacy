/**
 * SatsLegacy Quick Start Guide
 * 
 * Get up and running with SatsLegacy in 10 minutes
 */
import React from 'react';
import { 
  Shield, Download, Key, Clock, CheckCircle, ArrowRight, 
  ChevronLeft, Zap, Lock, Users, AlertTriangle, ExternalLink
} from 'lucide-react';

const QuickStartPage = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <a href="#/docs" className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-500 transition-colors">
            <ChevronLeft size={16} />
            Back to Documentation
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Zap size={24} className="text-black" />
            </div>
            <div>
              <p className="text-orange-500 text-sm font-medium">Getting Started</p>
              <h1 className="text-3xl font-bold text-white">Quick Start Guide</h1>
            </div>
          </div>
          <p className="text-xl text-zinc-400">
            Get your first inheritance vault set up in under 10 minutes. This guide walks you through the essential steps to protect your Bitcoin legacy.
          </p>
        </div>

        {/* Time estimate */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-8 flex items-center gap-3">
          <Clock size={20} className="text-orange-500" />
          <span className="text-zinc-300">Estimated time: <strong className="text-white">10 minutes</strong></span>
        </div>

        {/* Prerequisites */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Prerequisites</h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">A hardware wallet (Coldcard, Trezor, or Ledger recommended)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">SatsLegacy desktop app installed on Windows, macOS, or Linux</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">Your heir's public key (xpub) — they can generate this from their own hardware wallet</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Steps */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Step-by-Step Setup</h2>
          
          {/* Step 1 */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold">1</div>
              <h3 className="text-xl font-semibold text-white">Download & Install</h3>
            </div>
            <div className="ml-14">
              <p className="text-zinc-400 mb-4">
                Download the SatsLegacy desktop application for your operating system. The app runs entirely locally — no data ever leaves your machine.
              </p>
              <a
                href="#/docs/installation"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Download size={18} />
                Download SatsLegacy
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold">2</div>
              <h3 className="text-xl font-semibold text-white">Connect Your Hardware Wallet</h3>
            </div>
            <div className="ml-14">
              <p className="text-zinc-400 mb-4">
                Connect your hardware wallet via USB. SatsLegacy uses PSBT (Partially Signed Bitcoin Transactions) to communicate — your private keys never leave the device.
              </p>
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                <p className="text-sm text-zinc-500 mb-2">Supported devices:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-zinc-800 rounded text-sm text-zinc-300">Coldcard</span>
                  <span className="px-3 py-1 bg-zinc-800 rounded text-sm text-zinc-300">Trezor</span>
                  <span className="px-3 py-1 bg-zinc-800 rounded text-sm text-zinc-300">Ledger</span>
                  <span className="px-3 py-1 bg-zinc-800 rounded text-sm text-zinc-300">BitBox02</span>
                  <span className="px-3 py-1 bg-zinc-800 rounded text-sm text-zinc-300">Keystone</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold">3</div>
              <h3 className="text-xl font-semibold text-white">Create Your First Vault</h3>
            </div>
            <div className="ml-14">
              <p className="text-zinc-400 mb-4">
                Click "Create Vault" and select your inheritance type. For beginners, we recommend starting with a simple <strong className="text-white">Timelock Vault</strong> — funds become accessible to your heir after a set period unless you refresh the timer.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={18} className="text-orange-500" />
                    <span className="font-medium text-white">Timelock Vault</span>
                  </div>
                  <p className="text-sm text-zinc-400">Best for single heirs. Simple dead man's switch.</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={18} className="text-blue-500" />
                    <span className="font-medium text-white">Multisig Vault</span>
                  </div>
                  <p className="text-sm text-zinc-400">Multiple heirs must cooperate to spend.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold">4</div>
              <h3 className="text-xl font-semibold text-white">Add Heir Keys</h3>
            </div>
            <div className="ml-14">
              <p className="text-zinc-400 mb-4">
                Enter your heir's extended public key (xpub). This allows them to receive the inheritance but NOT spend until the timelock expires. Your heir should generate this from their own hardware wallet.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
                <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-200">
                  Never share private keys or seed phrases. Only share xpubs (extended public keys). If someone asks for your seed phrase, it's a scam.
                </p>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold">5</div>
              <h3 className="text-xl font-semibold text-white">Set Timelock Duration</h3>
            </div>
            <div className="ml-14">
              <p className="text-zinc-400 mb-4">
                Choose how long before the vault unlocks for your heir. We recommend 6-12 months — long enough you won't forget to refresh, short enough your heirs won't wait years.
              </p>
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                <p className="text-sm text-zinc-400 mb-3">Recommended durations:</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-300">6 months</span>
                    <span className="text-zinc-500">Good for active management</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-300">12 months</span>
                    <span className="text-green-500">Recommended for most users</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-300">24 months</span>
                    <span className="text-zinc-500">For set-and-forget approach</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 6 */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold">6</div>
              <h3 className="text-xl font-semibold text-white">Fund Your Vault</h3>
            </div>
            <div className="ml-14">
              <p className="text-zinc-400 mb-4">
                Send Bitcoin to your vault address. Start with a small test amount to verify everything works before funding with larger amounts.
              </p>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-sm text-green-200">
                  <strong>Pro tip:</strong> Always verify the vault address on your hardware wallet screen before sending funds. Never trust addresses displayed only on your computer screen.
                </p>
              </div>
            </div>
          </div>

          {/* Step 7 */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-black font-bold">
                <CheckCircle size={20} />
              </div>
              <h3 className="text-xl font-semibold text-white">Generate Heir Kit</h3>
            </div>
            <div className="ml-14">
              <p className="text-zinc-400 mb-4">
                Export an encrypted Heir Kit containing everything your heir needs to claim their inheritance: vault details, instructions, and verification information. Store this securely and ensure your heir knows how to access it.
              </p>
            </div>
          </div>
        </section>

        {/* What's Next */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">What's Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="#/docs/vault-timelock" className="bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/50 rounded-xl p-6 transition-colors group">
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors">Timelock Vaults Deep Dive</h3>
              <p className="text-sm text-zinc-400">Learn advanced timelock configurations and refresh strategies.</p>
            </a>
            <a href="#/docs/key-distribution" className="bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/50 rounded-xl p-6 transition-colors group">
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors">Key Distribution</h3>
              <p className="text-sm text-zinc-400">Best practices for securely distributing keys to heirs.</p>
            </a>
            <a href="#/docs/backups" className="bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/50 rounded-xl p-6 transition-colors group">
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors">Backup Strategies</h3>
              <p className="text-sm text-zinc-400">Ensure your inheritance plan survives any disaster.</p>
            </a>
            <a href="#/docs/security-threats" className="bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/50 rounded-xl p-6 transition-colors group">
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors">Security Threat Model</h3>
              <p className="text-sm text-zinc-400">Understand the attack vectors and how SatsLegacy protects you.</p>
            </a>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-zinc-800 pt-8">
          <p className="text-zinc-500 text-sm text-center">
            Not your keys, not your coins. Not your script, not your inheritance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuickStartPage;
