/**
 * SatsLegacy - Backup Strategies
 */
import React from 'react';
import { Database, ChevronLeft, CheckCircle, AlertTriangle, HardDrive, Cloud, Usb } from 'lucide-react';

const BackupsPage = () => {
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Database size={24} className="text-white" />
            </div>
            <div>
              <p className="text-orange-500 text-sm font-medium">Security</p>
              <h1 className="text-3xl font-bold text-white">Backup Strategies</h1>
            </div>
          </div>
          <p className="text-xl text-zinc-400">Ensure your inheritance plan survives hardware failure, theft, and natural disasters.</p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">What to Back Up</h2>
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Vault Configuration</h3>
              <p className="text-sm text-zinc-400 mb-3">Miniscript policies, public keys, timelock parameters. Export via SatsLegacy.</p>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Safe to store digitally (encrypted)</span>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Heir Kits</h3>
              <p className="text-sm text-zinc-400 mb-3">Everything heirs need to claim inheritance. Store separately from your main backup.</p>
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Distribute to heirs</span>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Seed Phrases</h3>
              <p className="text-sm text-zinc-400 mb-3">Master keys for your hardware wallet. NEVER store digitally.</p>
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Physical only - steel plates recommended</span>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Backup Methods</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <HardDrive size={24} className="text-blue-500 mb-3" />
              <h3 className="font-semibold text-white mb-2">Encrypted USB</h3>
              <p className="text-sm text-zinc-400">Store encrypted vault configs. Use hardware-encrypted drives.</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <Usb size={24} className="text-orange-500 mb-3" />
              <h3 className="font-semibold text-white mb-2">MicroSD</h3>
              <p className="text-sm text-zinc-400">Works with Coldcard. Small, easy to hide in multiple locations.</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <Database size={24} className="text-purple-500 mb-3" />
              <h3 className="font-semibold text-white mb-2">Steel Plates</h3>
              <p className="text-sm text-zinc-400">For seed phrases only. Fire and water resistant.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">3-2-1 Rule</h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold">3</span>
                <span className="text-zinc-300">Keep at least 3 copies of important data</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold">2</span>
                <span className="text-zinc-300">Store on 2 different types of media</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold">1</span>
                <span className="text-zinc-300">Keep 1 copy offsite (safe deposit box, trusted location)</span>
              </div>
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

export default BackupsPage;
