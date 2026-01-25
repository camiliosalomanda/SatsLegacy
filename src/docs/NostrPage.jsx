/**
 * SatsLegacy - Nostr Relay Backup
 */
import React from 'react';
import { Radio, ChevronLeft, CheckCircle, AlertTriangle, Globe, Lock } from 'lucide-react';

const NostrPage = () => {
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Radio size={24} className="text-white" />
            </div>
            <div>
              <p className="text-orange-500 text-sm font-medium">Infrastructure</p>
              <h1 className="text-3xl font-bold text-white">Nostr Relay Backup</h1>
            </div>
          </div>
          <p className="text-xl text-zinc-400">Censorship-resistant storage for vault metadata using the Nostr protocol.</p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">What is Nostr?</h2>
          <p className="text-zinc-400 mb-6">Nostr is a decentralized, censorship-resistant protocol for publishing and subscribing to data. SatsLegacy can use Nostr relays to back up encrypted vault metadata, ensuring heirs can find inheritance information even if your local data is lost.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">How SatsLegacy Uses Nostr</h2>
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Lock size={20} className="text-green-500" />
                <h3 className="font-semibold text-white">Encrypted Storage</h3>
              </div>
              <p className="text-sm text-zinc-400">Vault data is encrypted locally before publishing. Relay operators cannot read your inheritance plans.</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Globe size={20} className="text-blue-500" />
                <h3 className="font-semibold text-white">Multi-Relay Redundancy</h3>
              </div>
              <p className="text-sm text-zinc-400">Publish to multiple relays for redundancy. If one relay goes offline, others still have your data.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Benefits</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">No single point of failure — data on multiple relays</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Censorship resistant — no single entity can delete your data</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Heirs can retrieve data using your Nostr public key</span></div>
          </div>
        </section>

        <section className="mb-12">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
            <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-200 font-medium">Optional Feature</p>
              <p className="text-sm text-yellow-200/70 mt-1">Nostr backup is optional. You can use SatsLegacy entirely offline with local-only storage.</p>
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

export default NostrPage;
