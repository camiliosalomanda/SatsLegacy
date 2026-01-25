/**
 * SatsLegacy - Legal Document Templates
 */
import React from 'react';
import { FileText, ChevronLeft, Download, AlertTriangle, Lock } from 'lucide-react';

const LegalTemplatesPage = () => {
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
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <p className="text-orange-500 text-sm font-medium">Legal & Planning</p>
              <h1 className="text-3xl font-bold text-white">Legal Document Templates</h1>
            </div>
          </div>
          <p className="text-xl text-zinc-400">Sample language and templates for integrating Bitcoin inheritance into legal documents.</p>
        </div>

        <section className="mb-12">
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex gap-3 mb-6">
            <Lock size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-200 font-medium">Pro Feature</p>
              <p className="text-sm text-orange-200/70 mt-1">Legal document templates are available with a SatsLegacy Pro license.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Available Templates</h2>
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Bitcoin Inheritance Addendum</h3>
              <p className="text-sm text-zinc-400 mb-3">Sample language to add to existing wills referencing Bitcoin holdings and SatsLegacy vaults.</p>
              <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded">Pro Required</span>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Letter of Instruction</h3>
              <p className="text-sm text-zinc-400 mb-3">Non-binding letter explaining Bitcoin inheritance to heirs and executors.</p>
              <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded">Pro Required</span>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Heir Communication Template</h3>
              <p className="text-sm text-zinc-400 mb-3">Guide for explaining Bitcoin and SatsLegacy to non-technical heirs.</p>
              <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded">Pro Required</span>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
            <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-200 font-medium">Not Legal Advice</p>
              <p className="text-sm text-yellow-200/70 mt-1">Templates are starting points only. Have an attorney review all legal documents before signing.</p>
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

export default LegalTemplatesPage;
