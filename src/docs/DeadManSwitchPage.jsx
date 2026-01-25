/**
 * SatsLegacy - Dead Man's Switch Vaults
 */
import React from 'react';
import { 
  Activity, Shield, AlertTriangle, CheckCircle, ChevronLeft,
  Clock, Bell, Heart, Smartphone, Mail
} from 'lucide-react';

const DeadManSwitchPage = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <a href="#/docs" className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-500 transition-colors">
            <ChevronLeft size={16} />
            Back to Documentation
          </a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <p className="text-orange-500 text-sm font-medium">Vault Types</p>
              <h1 className="text-3xl font-bold text-white">Dead Man's Switch</h1>
            </div>
          </div>
          <p className="text-xl text-zinc-400">
            Activity-based inheritance that triggers when you stop checking in, providing a more natural proof-of-life mechanism.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">How It Differs From Timelock</h2>
          <p className="text-zinc-400 mb-6">
            While both use Bitcoin's timelock capabilities under the hood, a Dead Man's Switch emphasizes <strong className="text-white">activity monitoring</strong> rather than manual refresh. The concept: if you stop performing regular activities, inheritance triggers.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={20} className="text-orange-500" />
                <h3 className="font-semibold text-white">Timelock Vault</h3>
              </div>
              <p className="text-sm text-zinc-400">
                You manually refresh on a schedule. Explicit action required. Calendar-based.
              </p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={20} className="text-red-500" />
                <h3 className="font-semibold text-white">Dead Man's Switch</h3>
              </div>
              <p className="text-sm text-zinc-400">
                Activity is monitored passively. If no activity detected for period X, switch triggers.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Activity Signals</h2>
          <p className="text-zinc-400 mb-4">
            The "switch" resets when SatsLegacy detects activity. This can include:
          </p>
          
          <div className="space-y-3">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex items-center gap-4">
              <Smartphone size={24} className="text-blue-500" />
              <div>
                <p className="font-medium text-white">App Login</p>
                <p className="text-sm text-zinc-400">Opening the SatsLegacy app resets the timer</p>
              </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex items-center gap-4">
              <Heart size={24} className="text-red-500" />
              <div>
                <p className="font-medium text-white">Heartbeat Check-in</p>
                <p className="text-sm text-zinc-400">One-click "I'm alive" button in the app</p>
              </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex items-center gap-4">
              <Mail size={24} className="text-green-500" />
              <div>
                <p className="font-medium text-white">Email Response</p>
                <p className="text-sm text-zinc-400">Responding to periodic check-in emails (optional)</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Configuration Options</h2>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-4">
            <h3 className="font-semibold text-white mb-4">Inactivity Period</h3>
            <p className="text-zinc-400 mb-4">How long without activity before the switch triggers:</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm py-2 border-b border-zinc-700">
                <span className="text-zinc-300">30 days</span>
                <span className="text-zinc-500">High activity requirement</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-zinc-700">
                <span className="text-zinc-300">90 days</span>
                <span className="text-green-400">Recommended</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-zinc-700">
                <span className="text-zinc-300">180 days</span>
                <span className="text-zinc-500">Low maintenance</span>
              </div>
              <div className="flex justify-between text-sm py-2">
                <span className="text-zinc-300">365 days</span>
                <span className="text-zinc-500">Minimal activity</span>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
            <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-200">
              <strong>Note:</strong> Under the hood, this still uses Bitcoin timelocks. The "activity monitoring" triggers a vault refresh transaction. This means on-chain fees apply when the timer resets.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">When to Use</h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">You want passive monitoring rather than scheduled refreshes</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">You regularly use the SatsLegacy app for other features</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">You prefer a "set it and forget it" approach</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">You want early warning notifications before trigger</span>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Related Documentation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="#/docs/vault-timelock" className="bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/50 rounded-xl p-6 transition-colors group">
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-500">Timelock Vaults</h3>
              <p className="text-sm text-zinc-400">Manual refresh-based inheritance.</p>
            </a>
            <a href="#/docs/vault-hybrid" className="bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/50 rounded-xl p-6 transition-colors group">
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-500">Hybrid Vaults</h3>
              <p className="text-sm text-zinc-400">Combine multiple conditions.</p>
            </a>
          </div>
        </section>

        <div className="border-t border-zinc-800 pt-8">
          <p className="text-zinc-500 text-sm text-center">
            Not your keys, not your coins. Not your script, not your inheritance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeadManSwitchPage;
