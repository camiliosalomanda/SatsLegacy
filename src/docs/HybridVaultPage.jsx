/**
 * SatsLegacy - Hybrid Vaults
 */
import React from 'react';
import { Layers, ChevronLeft, Clock, Users, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

const HybridVaultPage = () => {
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
              <Layers size={24} className="text-white" />
            </div>
            <div>
              <p className="text-orange-500 text-sm font-medium">Vault Types</p>
              <h1 className="text-3xl font-bold text-white">Hybrid Vaults</h1>
            </div>
          </div>
          <p className="text-xl text-zinc-400">Combine multiple inheritance conditions with fallback mechanisms for complex family situations.</p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">What is a Hybrid Vault?</h2>
          <p className="text-zinc-400 mb-6">Hybrid vaults combine timelocks, multisig, and fallback conditions into a single sophisticated inheritance structure. They allow for tiered access based on time and cooperation requirements.</p>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Example: Tiered Family Inheritance</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3"><Clock size={16} className="text-blue-400 mt-1" /><span className="text-zinc-300"><strong className="text-white">Immediately:</strong> Owner can spend</span></div>
              <div className="flex gap-3"><Clock size={16} className="text-green-400 mt-1" /><span className="text-zinc-300"><strong className="text-white">After 6 months:</strong> Spouse can spend alone</span></div>
              <div className="flex gap-3"><Clock size={16} className="text-yellow-400 mt-1" /><span className="text-zinc-300"><strong className="text-white">After 1 year:</strong> Any 2 of 3 children can spend</span></div>
              <div className="flex gap-3"><Clock size={16} className="text-red-400 mt-1" /><span className="text-zinc-300"><strong className="text-white">After 2 years:</strong> Any single child (emergency fallback)</span></div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Use Cases</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Complex family structures with spouse and children</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Business succession with multiple stakeholders</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Emergency fallbacks if primary heirs become unavailable</span></div>
          </div>
        </section>

        <section className="mb-12">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
            <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-200 font-medium">Complexity Warning</p>
              <p className="text-sm text-yellow-200/70 mt-1">Hybrid vaults are powerful but complex. Test thoroughly and ensure all heirs understand their access conditions.</p>
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

export default HybridVaultPage;
