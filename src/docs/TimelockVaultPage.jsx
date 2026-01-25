/**
 * SatsLegacy - Timelock Vaults
 * 
 * Deep dive into timelock-based inheritance vaults
 */
import React from 'react';
import { 
  Clock, Shield, AlertTriangle, CheckCircle, ChevronLeft,
  RefreshCw, Calendar, Bell, Lock, Unlock, ArrowRight
} from 'lucide-react';

const TimelockVaultPage = () => {
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
              <Clock size={24} className="text-black" />
            </div>
            <div>
              <p className="text-orange-500 text-sm font-medium">Vault Types</p>
              <h1 className="text-3xl font-bold text-white">Timelock Vaults</h1>
            </div>
          </div>
          <p className="text-xl text-zinc-400">
            The foundation of trustless inheritance: time-based spending conditions enforced by Bitcoin's consensus rules.
          </p>
        </div>

        {/* What is a Timelock */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">What is a Timelock Vault?</h2>
          <p className="text-zinc-400 mb-6">
            A Timelock Vault uses Bitcoin's native <code className="bg-zinc-800 px-2 py-0.5 rounded text-orange-400">OP_CHECKLOCKTIMEVERIFY</code> (CLTV) opcode to create spending conditions based on time. The vault allows immediate spending by the owner, but restricts heir access until a specific block height or timestamp is reached.
          </p>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-white mb-4">The Miniscript Policy</h3>
            <code className="text-green-400 font-mono block bg-zinc-800 p-4 rounded-lg mb-4">
              or(pk(owner), and(pk(heir), after(locktime)))
            </code>
            <p className="text-zinc-400 text-sm">
              <strong className="text-white">Translation:</strong> The owner can spend at any time with their key, OR the heir can spend after the locktime using their key. This is enforced by Bitcoin's consensus rules — no third party involved.
            </p>
          </div>
        </section>

        {/* How it Works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
          
          <div className="space-y-6">
            {/* Normal Operation */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-white">Normal Operation (You're Active)</h3>
              </div>
              <div className="ml-13 space-y-3">
                <p className="text-zinc-400">
                  While you're alive and well, you periodically "refresh" the vault by moving funds to a new vault with a reset timer. This can be as simple as sending to yourself with a new timelock.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Lock size={16} className="text-orange-500" />
                    <span>Vault created</span>
                  </div>
                  <ArrowRight size={16} className="text-zinc-600" />
                  <div className="flex items-center gap-2 text-zinc-300">
                    <RefreshCw size={16} className="text-blue-500" />
                    <span>Refresh at 6 months</span>
                  </div>
                  <ArrowRight size={16} className="text-zinc-600" />
                  <div className="flex items-center gap-2 text-zinc-300">
                    <RefreshCw size={16} className="text-blue-500" />
                    <span>Refresh at 12 months</span>
                  </div>
                  <ArrowRight size={16} className="text-zinc-600" />
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span>∞</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inheritance Scenario */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Unlock size={20} className="text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold text-white">Inheritance Scenario (Timelock Expires)</h3>
              </div>
              <div className="ml-13 space-y-3">
                <p className="text-zinc-400">
                  If you become incapacitated or pass away, you stop refreshing. The timelock continues counting down. Once expired, your heir can spend using their key.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Lock size={16} className="text-orange-500" />
                    <span>Last refresh</span>
                  </div>
                  <ArrowRight size={16} className="text-zinc-600" />
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Clock size={16} className="text-yellow-500" />
                    <span>Timer counting...</span>
                  </div>
                  <ArrowRight size={16} className="text-zinc-600" />
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Unlock size={16} className="text-green-500" />
                    <span>Heir can claim</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timelock Types */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Timelock Types</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400 text-xs font-mono">#</span>
                </div>
                <h3 className="font-semibold text-white">Block Height</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-3">
                Unlock at a specific Bitcoin block number. More predictable on-chain, but requires converting to approximate dates.
              </p>
              <code className="text-xs text-green-400 bg-zinc-800 px-2 py-1 rounded">after(840000)</code>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center">
                  <Calendar size={16} className="text-purple-400" />
                </div>
                <h3 className="font-semibold text-white">Unix Timestamp</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-3">
                Unlock at a specific date/time. More intuitive but depends on miner timestamps.
              </p>
              <code className="text-xs text-green-400 bg-zinc-800 px-2 py-1 rounded">after(1735689600)</code>
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 mt-4">
            <p className="text-sm text-zinc-400">
              <strong className="text-white">Note:</strong> SatsLegacy defaults to block height for precision. At ~10 minutes per block, 52,560 blocks ≈ 1 year. The app handles this conversion automatically.
            </p>
          </div>
        </section>

        {/* Refresh Strategies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Refresh Strategies</h2>
          
          <p className="text-zinc-400 mb-6">
            The refresh process is crucial — it's your proof of life. Here are the recommended approaches:
          </p>
          
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Calendar size={20} className="text-orange-500" />
                <h3 className="font-semibold text-white">Calendar-Based Refresh</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-3">
                Set calendar reminders for 1-2 months before expiration. On the reminder date, move funds to a new vault with a reset timer.
              </p>
              <div className="flex gap-2">
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Simple</span>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Recommended</span>
              </div>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Bell size={20} className="text-blue-500" />
                <h3 className="font-semibold text-white">Active Monitoring</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-3">
                Use SatsLegacy's built-in notifications to track vault status. The app will alert you when refresh is due.
              </p>
              <div className="flex gap-2">
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Automated</span>
              </div>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield size={20} className="text-purple-500" />
                <h3 className="font-semibold text-white">Trusted Contact Alert</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-3">
                Designate a trusted contact who knows to check on you if notified. They don't need keys — just awareness.
              </p>
              <div className="flex gap-2">
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Advanced</span>
              </div>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Best Practices</h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Choose appropriate duration</p>
                <p className="text-sm text-zinc-400">6-12 months is ideal for most users. Too short = stress. Too long = heirs wait unnecessarily.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Test the full cycle</p>
                <p className="text-sm text-zinc-400">Before funding with large amounts, test vault creation, refresh, and heir claiming on testnet or with small amounts.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Document the refresh process</p>
                <p className="text-sm text-zinc-400">Include refresh instructions in your Heir Kit so trusted contacts understand the system.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Consider multiple vaults</p>
                <p className="text-sm text-zinc-400">Split holdings across vaults with different timelocks for staged inheritance or risk distribution.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Warnings */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Important Warnings</h2>
          
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3">
              <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-200 font-medium">Missing a refresh is irreversible</p>
                <p className="text-sm text-red-200/70 mt-1">If the timelock expires, your heir CAN spend. There's no undo. This is by design — but it means you must be diligent about refreshing.</p>
              </div>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
              <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-200 font-medium">Heir keys must be distributed beforehand</p>
                <p className="text-sm text-yellow-200/70 mt-1">Your heir needs their key BEFORE you become incapacitated. You cannot distribute keys from beyond the grave.</p>
              </div>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
              <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-200 font-medium">Network fees at refresh time</p>
                <p className="text-sm text-yellow-200/70 mt-1">Each refresh requires an on-chain transaction. During high-fee periods, this cost can be significant for many small vaults.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Related Docs */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Related Documentation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="#/docs/vault-deadman" className="bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/50 rounded-xl p-6 transition-colors group">
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors">Dead Man's Switch</h3>
              <p className="text-sm text-zinc-400">Alternative proof-of-life mechanism with activity monitoring.</p>
            </a>
            <a href="#/docs/vault-multisig" className="bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/50 rounded-xl p-6 transition-colors group">
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors">Multisig Inheritance</h3>
              <p className="text-sm text-zinc-400">Combine timelocks with multisig for additional security.</p>
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

export default TimelockVaultPage;
