/**
 * SatsLegacy - Hardware Wallet Integration
 */
import React from 'react';
import { Usb, ChevronLeft, CheckCircle, AlertTriangle, Shield, Key } from 'lucide-react';

const HardwareWalletsPage = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <a href="#/docs" className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-500 transition-colors">
            <ChevronLeft size={16} />Back to Documentation
          </a>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Usb size={24} className="text-white" />
            </div>
            <div>
              <p className="text-orange-500 text-sm font-medium">Security</p>
              <h1 className="text-3xl font-bold text-white">Hardware Wallet Integration</h1>
            </div>
          </div>
          <p className="text-xl text-zinc-400">SatsLegacy works with your hardware wallet to keep private keys secure.</p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Supported Devices</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800 mx-auto mb-3 flex items-center justify-center">
                <Key size={20} className="text-orange-500" />
              </div>
              <p className="font-medium text-white">Coldcard</p>
              <p className="text-xs text-green-400">Recommended</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800 mx-auto mb-3 flex items-center justify-center">
                <Key size={20} className="text-blue-500" />
              </div>
              <p className="font-medium text-white">Trezor</p>
              <p className="text-xs text-zinc-400">Supported</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800 mx-auto mb-3 flex items-center justify-center">
                <Key size={20} className="text-purple-500" />
              </div>
              <p className="font-medium text-white">Ledger</p>
              <p className="text-xs text-zinc-400">Supported</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800 mx-auto mb-3 flex items-center justify-center">
                <Key size={20} className="text-green-500" />
              </div>
              <p className="font-medium text-white">BitBox02</p>
              <p className="text-xs text-zinc-400">Supported</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <p className="text-zinc-400 mb-4">SatsLegacy uses PSBT (Partially Signed Bitcoin Transactions) to communicate with your hardware wallet:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-green-500 mt-0.5" />
                <span className="text-zinc-300">Private keys never leave the hardware device</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-green-500 mt-0.5" />
                <span className="text-zinc-300">All transactions displayed on device screen for verification</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-green-500 mt-0.5" />
                <span className="text-zinc-300">Malicious software cannot sign transactions without physical confirmation</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Best Practices</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <Shield size={20} className="text-orange-500 mt-0.5" />
              <div>
                <p className="text-white font-medium">Always verify on device</p>
                <p className="text-sm text-zinc-400">Never trust addresses shown only on your computer screen.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <Shield size={20} className="text-orange-500 mt-0.5" />
              <div>
                <p className="text-white font-medium">Update firmware</p>
                <p className="text-sm text-zinc-400">Keep your hardware wallet firmware up to date for security patches.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <Shield size={20} className="text-orange-500 mt-0.5" />
              <div>
                <p className="text-white font-medium">Secure seed backup</p>
                <p className="text-sm text-zinc-400">Store seed phrases offline in multiple secure locations.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-zinc-800 pt-8">
          <p className="text-zinc-500 text-sm text-center">Not your keys, not your coins. Not your script, not your inheritance.</p>
        </div>
      </div>
    </div>
  );
};

export default HardwareWalletsPage;
