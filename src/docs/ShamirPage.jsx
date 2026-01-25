/**
 * SatsLegacy - Shamir's Secret Sharing
 */
import React from 'react';
import { Split, ChevronLeft, CheckCircle, AlertTriangle, Puzzle } from 'lucide-react';

const ShamirPage = () => {
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Puzzle size={24} className="text-white" />
            </div>
            <div>
              <p className="text-orange-500 text-sm font-medium">Infrastructure</p>
              <h1 className="text-3xl font-bold text-white">Shamir's Secret Sharing</h1>
            </div>
          </div>
          <p className="text-xl text-zinc-400">Split secrets into shares for redundant backup without single points of failure.</p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-zinc-400 mb-6">Shamir's Secret Sharing (SSS) splits a secret into N shares, where any K shares can reconstruct it. For example, a 3-of-5 split means any 3 of 5 shares recover the secret, but 2 shares reveal nothing.</p>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Example: 3-of-5 Split</h3>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="bg-zinc-800 rounded-lg p-3 text-center">
                  <span className="text-orange-500 font-mono">Share {i}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-zinc-400">Any 3 of these 5 shares can reconstruct the original secret. Losing 2 shares is acceptable.</p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">When to Use SSS</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Backup redundancy for vault configuration</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Distributing heir kit decryption keys</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Geographic distribution (different locations)</span></div>
          </div>
        </section>

        <section className="mb-12">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
            <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-200 font-medium">SSS vs Multisig</p>
              <p className="text-sm text-yellow-200/70 mt-1">SSS is for backup redundancy, not spending conditions. For inheritance logic, use native Bitcoin multisig which keeps keys separate and never requires reconstruction.</p>
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

export default ShamirPage;
