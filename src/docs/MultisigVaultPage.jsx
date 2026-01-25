/**
 * SatsLegacy - Multisig Inheritance Vaults
 */
import React from 'react';
import { Users, Shield, AlertTriangle, CheckCircle, ChevronLeft, Clock, Key, Lock } from 'lucide-react';

const MultisigVaultPage = () => {
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <p className="text-orange-500 text-sm font-medium">Vault Types</p>
              <h1 className="text-3xl font-bold text-white">Multisig Inheritance</h1>
            </div>
          </div>
          <p className="text-xl text-zinc-400">
            Require multiple heirs to cooperate before spending, preventing any single party from unilaterally claiming the inheritance.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">What is Multisig Inheritance?</h2>
          <p className="text-zinc-400 mb-6">
            Multisig (M-of-N) inheritance requires a threshold of heirs to sign before funds can be spent. For example, in a 2-of-3 setup, any 2 of the 3 designated heirs must cooperate.
          </p>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Example: 2-of-3 Multisig Policy</h3>
            <code className="text-green-400 font-mono block bg-zinc-800 p-4 rounded-lg mb-4 text-sm">
              or(pk(owner), and(thresh(2, pk(heir1), pk(heir2), pk(heir3)), after(locktime)))
            </code>
            <p className="text-zinc-400 text-sm">
              Owner can spend anytime, OR after the timelock, any 2 of 3 heirs can spend together.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Common Configurations</h2>
          
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">2-of-3</h3>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Most Popular</span>
              </div>
              <p className="text-sm text-zinc-400">Two of three heirs must agree. Provides redundancy while preventing unilateral action.</p>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">3-of-5</h3>
              <p className="text-sm text-zinc-400">Higher threshold for larger families. More redundancy but requires more coordination.</p>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">2-of-2</h3>
              <p className="text-sm text-zinc-400">Both parties must agree. Good for spouses or business partners who must cooperate.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Benefits</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">No single heir can steal funds — requires cooperation</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">Key loss protection — if one heir loses their key, others can still claim</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">Family governance — important decisions require consensus</span>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Considerations</h2>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
            <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-200 font-medium">Coordination Required</p>
              <p className="text-sm text-yellow-200/70 mt-1">Heirs must be able to contact each other and coordinate signing. Document communication channels in the Heir Kit.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Related Documentation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="#/docs/vault-hybrid" className="bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/50 rounded-xl p-6 transition-colors group">
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-500">Hybrid Vaults</h3>
              <p className="text-sm text-zinc-400">Combine multisig with timelocks and fallbacks.</p>
            </a>
            <a href="#/docs/key-distribution" className="bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/50 rounded-xl p-6 transition-colors group">
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-500">Key Distribution</h3>
              <p className="text-sm text-zinc-400">Best practices for distributing keys to multiple heirs.</p>
            </a>
          </div>
        </section>

        <div className="border-t border-zinc-800 pt-8">
          <p className="text-zinc-500 text-sm text-center">Not your keys, not your coins. Not your script, not your inheritance.</p>
        </div>
      </div>
    </div>
  );
};

export default MultisigVaultPage;
