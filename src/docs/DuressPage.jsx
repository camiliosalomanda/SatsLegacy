/**
 * SatsLegacy - Duress Protection
 */
import React from 'react';
import { AlertOctagon, ChevronLeft, CheckCircle, Shield, Eye, Lock } from 'lucide-react';

const DuressPage = () => {
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
              <AlertOctagon size={24} className="text-white" />
            </div>
            <div>
              <p className="text-orange-500 text-sm font-medium">Security</p>
              <h1 className="text-3xl font-bold text-white">Duress Protection</h1>
            </div>
          </div>
          <p className="text-xl text-zinc-400">Coercion-resistant features to protect against physical threats and $5 wrench attacks.</p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">The $5 Wrench Problem</h2>
          <p className="text-zinc-400 mb-6">No amount of cryptography protects against physical coercion. If someone threatens you with violence, you might be forced to reveal your Bitcoin. Duress protection provides plausible deniability.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Duress Features</h2>
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Lock size={20} className="text-orange-500" />
                <h3 className="font-semibold text-white">Decoy Vault</h3>
              </div>
              <p className="text-sm text-zinc-400">Create a secondary vault with a small amount of Bitcoin. Under duress, reveal this vault instead of your main holdings.</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Eye size={20} className="text-blue-500" />
                <h3 className="font-semibold text-white">Hidden Vault Mode</h3>
              </div>
              <p className="text-sm text-zinc-400">Vaults can be hidden from the main interface. A separate PIN reveals hidden vaults.</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield size={20} className="text-purple-500" />
                <h3 className="font-semibold text-white">Passphrase Wallets</h3>
              </div>
              <p className="text-sm text-zinc-400">BIP39 passphrase creates completely separate wallets from the same seed. Different passphrase = different wallet.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Implementation Security</h2>
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">🔐 Password Security</h3>
              <ul className="text-sm text-zinc-400 space-y-2">
                <li>• Duress password hashed with <span className="text-orange-400 font-mono">PBKDF2-SHA256</span> (600,000 iterations)</li>
                <li>• Unique salt per installation prevents rainbow table attacks</li>
                <li>• Password never stored in plaintext - only hash comparison</li>
                <li>• Same security level as your main vault password</li>
              </ul>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">🗑️ Secure Wipe</h3>
              <ul className="text-sm text-zinc-400 space-y-2">
                <li>• Vault files overwritten with cryptographically random data before deletion</li>
                <li>• Prevents forensic recovery of encrypted vault data</li>
                <li>• Wipe is <span className="text-red-400 font-semibold">irreversible</span> - ensure backups exist elsewhere</li>
              </ul>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">🔔 Silent Alerts</h3>
              <ul className="text-sm text-zinc-400 space-y-2">
                <li>• Optional email notification when duress password used</li>
                <li>• Alert sent asynchronously - no visible delay to attacker</li>
                <li>• Include timestamp for incident documentation</li>
                <li>• Configure via Settings → Duress Protection</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Duress Actions</h2>
          <div className="space-y-3">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-white font-medium mb-2">Show Decoy Only</h3>
              <p className="text-sm text-zinc-400">Displays pre-configured decoy vaults with fake balances. Real vaults remain hidden but intact.</p>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded mt-2 inline-block">Reversible - real vaults preserved</span>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-white font-medium mb-2">Show Decoy + Wipe</h3>
              <p className="text-sm text-zinc-400">Securely destroys real vault data, then shows decoy vaults. Attacker sees only decoys.</p>
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded mt-2 inline-block">Irreversible - real vaults destroyed</span>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-white font-medium mb-2">Wipe Only</h3>
              <p className="text-sm text-zinc-400">Destroys all vault data and shows empty state. Use when you have no decoys configured.</p>
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded mt-2 inline-block">Irreversible - all vaults destroyed</span>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Best Practices</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Keep decoy vault funded with believable amount (0.01-0.1 BTC)</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Practice accessing duress features quickly - muscle memory matters</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Never discuss total holdings with untrusted parties</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Use different password from main password - easy to remember under stress</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Enable silent alerts to document incidents</span></div>
            <div className="flex items-start gap-3"><CheckCircle size={20} className="text-green-500 mt-0.5" /><span className="text-zinc-300">Keep backup of real vaults in secure offsite location</span></div>
          </div>
        </section>

        <section className="mb-12">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-200 font-medium">Security Limitations</p>
              <p className="text-sm text-red-200/70 mt-1">Duress protection provides plausible deniability but cannot guarantee safety. An attacker who knows about this feature may not believe the decoy. Physical security and operational security remain your primary defense.</p>
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

export default DuressPage;
