/**
 * SatsLegacy - Tor Integration
 */
import React from 'react';
import { Shield, ChevronLeft, CheckCircle, Eye, Globe, Lock } from 'lucide-react';

const TorPage = () => {
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center">
              <Globe size={24} className="text-white" />
            </div>
            <div>
              <p className="text-orange-500 text-sm font-medium">Infrastructure</p>
              <h1 className="text-3xl font-bold text-white">Tor Integration</h1>
            </div>
          </div>
          <p className="text-xl text-zinc-400">Privacy-preserving network connections to hide your IP address when querying the blockchain.</p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Why Use Tor?</h2>
          <p className="text-zinc-400 mb-6">When SatsLegacy queries Electrum servers or checks blockchain data, your IP address could be linked to your vault addresses. Tor routing hides your network identity.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Eye size={20} className="text-red-500" />
                <h3 className="font-semibold text-white">Without Tor</h3>
              </div>
              <p className="text-sm text-zinc-400">ISP and Electrum server can see which addresses you query, potentially linking your identity to your Bitcoin.</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Lock size={20} className="text-green-500" />
                <h3 className="font-semibold text-white">With Tor</h3>
              </div>
              <p className="text-sm text-zinc-400">Your queries are routed through multiple relays. Server sees Tor exit node IP, not yours.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Enabling Tor</h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <ol className="space-y-3">
              <li className="flex gap-3"><span className="text-orange-500 font-medium">1.</span><span className="text-zinc-300">Install Tor Browser or run Tor daemon</span></li>
              <li className="flex gap-3"><span className="text-orange-500 font-medium">2.</span><span className="text-zinc-300">Open SatsLegacy Settings</span></li>
              <li className="flex gap-3"><span className="text-orange-500 font-medium">3.</span><span className="text-zinc-300">Enable "Route through Tor"</span></li>
              <li className="flex gap-3"><span className="text-orange-500 font-medium">4.</span><span className="text-zinc-300">Configure SOCKS5 proxy (default: 127.0.0.1:9050)</span></li>
            </ol>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">What Gets Routed</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Blockchain queries to Electrum servers</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Nostr relay connections (if enabled)</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Transaction broadcasts</span></div>
          </div>
        </section>

        <div className="border-t border-zinc-800 pt-8">
          <p className="text-zinc-500 text-sm text-center">Not your keys, not your coins. Not your script, not your inheritance.</p>
        </div>
      </div>
    </div>
  );
};

export default TorPage;
