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
          <h2 className="text-2xl font-bold text-white mb-6">🔐 PSBT Security Model</h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <p className="text-zinc-400 mb-4">Why PSBT export is more secure than direct device integration:</p>
            <div className="space-y-4">
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="text-green-400 font-medium mb-2">✓ Air-Gap Capable</h4>
                <p className="text-xs text-zinc-400">PSBT can be transferred via SD card or QR code - no USB connection required. Coldcard's SD card workflow is fully supported.</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="text-green-400 font-medium mb-2">✓ No Driver Dependencies</h4>
                <p className="text-xs text-zinc-400">No special drivers or software. Works with any device that supports BIP-174 PSBT standard.</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="text-green-400 font-medium mb-2">✓ Malware Resistant</h4>
                <p className="text-xs text-zinc-400">Even if SatsLegacy were compromised, it cannot steal keys. Worst case: creates malicious transaction that you would verify and reject on device.</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="text-green-400 font-medium mb-2">✓ Device Agnostic</h4>
                <p className="text-xs text-zinc-400">Same workflow works with any hardware wallet. No vendor lock-in or proprietary protocols.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">PSBT Workflow</h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <ol className="space-y-4 text-zinc-300">
              <li className="flex gap-3">
                <span className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold flex-shrink-0">1</span>
                <div>
                  <p className="font-medium">Create PSBT in SatsLegacy</p>
                  <p className="text-xs text-zinc-500">Unsigned transaction with all required metadata</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold flex-shrink-0">2</span>
                <div>
                  <p className="font-medium">Export to Hardware Wallet</p>
                  <p className="text-xs text-zinc-500">Via file (.psbt), QR code, or SD card</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold flex-shrink-0">3</span>
                <div>
                  <p className="font-medium">Review on Device</p>
                  <p className="text-xs text-zinc-500">Verify addresses, amounts, and fees on hardware wallet screen</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold flex-shrink-0">4</span>
                <div>
                  <p className="font-medium">Sign on Device</p>
                  <p className="text-xs text-zinc-500">Physical button press required - cannot be done remotely</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold flex-shrink-0">5</span>
                <div>
                  <p className="font-medium">Import Signed PSBT</p>
                  <p className="text-xs text-zinc-500">Back to SatsLegacy for broadcast</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold flex-shrink-0">6</span>
                <div>
                  <p className="font-medium">Broadcast to Network</p>
                  <p className="text-xs text-zinc-500">Optionally through Tor for privacy</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="mb-12">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-200 font-medium">Critical: Always Verify on Device</p>
              <p className="text-sm text-red-200/70 mt-1">Never trust addresses shown only on your computer. A compromised computer could display a different address than what's in the transaction. Your hardware wallet screen is the source of truth.</p>
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
