/**
 * SatsLegacy - Estate Planning Integration
 */
import React from 'react';
import { FileText, ChevronLeft, CheckCircle, AlertTriangle, Scale, Users } from 'lucide-react';

const EstatePlanningPage = () => {
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Scale size={24} className="text-white" />
            </div>
            <div>
              <p className="text-orange-500 text-sm font-medium">Legal & Planning</p>
              <h1 className="text-3xl font-bold text-white">Estate Planning Integration</h1>
            </div>
          </div>
          <p className="text-xl text-zinc-400">How SatsLegacy works alongside traditional estate planning tools.</p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">SatsLegacy + Traditional Planning</h2>
          <p className="text-zinc-400 mb-6">SatsLegacy doesn't replace your estate plan — it complements it. Your will, trusts, and legal documents handle the legal transfer of assets. SatsLegacy handles the technical transfer of Bitcoin.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">What Goes Where</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">In Your Will/Trust</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>• Reference that Bitcoin exists</li>
                <li>• Name beneficiaries legally</li>
                <li>• Mention SatsLegacy Heir Kits exist</li>
                <li>• DO NOT include seed phrases or private keys</li>
              </ul>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">In SatsLegacy</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>• Actual vault configuration</li>
                <li>• Technical inheritance logic</li>
                <li>• Heir public keys</li>
                <li>• Encrypted Heir Kits</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Working With Attorneys</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Find an attorney familiar with digital assets</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Explain that Bitcoin uses cryptographic keys, not accounts</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Clarify that heirs already have keys — they just need time to pass</span></div>
          </div>
        </section>

        <section className="mb-12">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
            <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-200 font-medium">Not Legal Advice</p>
              <p className="text-sm text-yellow-200/70 mt-1">This documentation is educational. Consult a qualified estate planning attorney for your specific situation.</p>
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

export default EstatePlanningPage;
