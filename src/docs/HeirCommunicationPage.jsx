/**
 * SatsLegacy - Heir Communication
 */
import React from 'react';
import { MessageCircle, ChevronLeft, CheckCircle, AlertTriangle, Users, BookOpen } from 'lucide-react';

const HeirCommunicationPage = () => {
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
              <MessageCircle size={24} className="text-white" />
            </div>
            <div>
              <p className="text-orange-500 text-sm font-medium">Legal & Planning</p>
              <h1 className="text-3xl font-bold text-white">Heir Communication</h1>
            </div>
          </div>
          <p className="text-xl text-zinc-400">Preparing your beneficiaries to receive and manage their Bitcoin inheritance.</p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Why Communication Matters</h2>
          <p className="text-zinc-400 mb-6">A technically perfect inheritance plan fails if your heirs don't know it exists or can't execute it. Proactive communication ensures your Bitcoin reaches the intended recipients.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">What Heirs Need to Know</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">That Bitcoin inheritance exists and uses special technology</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Where to find their Heir Kit when the time comes</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">How to set up and secure their own hardware wallet</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">That they must wait for the timelock to expire</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">How to contact other heirs if multisig is required</span></div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Communication Approaches</h2>
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Full Disclosure</h3>
              <p className="text-sm text-zinc-400">Tell heirs everything now. They receive their keys, know the vault details, and understand the system. Most secure but requires trust.</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Partial Disclosure</h3>
              <p className="text-sm text-zinc-400">Tell heirs Bitcoin exists and where to find instructions. Full details revealed only after your passing.</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Trusted Third Party</h3>
              <p className="text-sm text-zinc-400">An attorney or trusted friend holds sealed instructions to give heirs when needed.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
            <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-200 font-medium">Education is Key</p>
              <p className="text-sm text-yellow-200/70 mt-1">Non-technical heirs may need education about Bitcoin basics. Consider giving them resources and time to learn before you're gone.</p>
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

export default HeirCommunicationPage;
