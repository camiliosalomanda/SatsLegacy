/**
 * SatsLegacy - Your First Vault Guide
 * 
 * Step-by-step guide to creating your first inheritance vault
 */
import React from 'react';
import { 
  Shield, Lock, Clock, Users, CheckCircle, ArrowRight, 
  ChevronLeft, AlertTriangle, Key, Wallet, Settings, FileText
} from 'lucide-react';

const FirstVaultPage = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <a href="#/docs" className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-500 transition-colors">
            <ChevronLeft size={16} />
            Back to Documentation
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Lock size={24} className="text-black" />
            </div>
            <div>
              <p className="text-orange-500 text-sm font-medium">Getting Started</p>
              <h1 className="text-3xl font-bold text-white">Your First Vault</h1>
            </div>
          </div>
          <p className="text-xl text-zinc-400">
            Walk through creating your first inheritance vault, understanding each option, and testing the setup before funding with real Bitcoin.
          </p>
        </div>

        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">What You'll Create</h2>
          <p className="text-zinc-400 mb-6">
            In this guide, you'll create a simple <strong className="text-white">Timelock Vault</strong> — the most common inheritance pattern. This vault allows you to spend your Bitcoin anytime, but if you become incapacitated or pass away, your designated heir can claim the funds after the timelock expires.
          </p>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">How it works:</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-500 font-medium">1</span>
                </div>
                <div>
                  <p className="text-white font-medium">You control the vault</p>
                  <p className="text-zinc-400 text-sm">As the owner, you can spend from the vault at any time using your hardware wallet.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-500 font-medium">2</span>
                </div>
                <div>
                  <p className="text-white font-medium">Timelock counts down</p>
                  <p className="text-zinc-400 text-sm">A timer runs in the background. If you're active, you refresh it periodically.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-500 font-medium">3</span>
                </div>
                <div>
                  <p className="text-white font-medium">Heir inherits if timer expires</p>
                  <p className="text-zinc-400 text-sm">If you stop refreshing (incapacitation/death), the timelock expires and your heir can spend.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 1: Launch Wizard */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold">1</div>
            <h2 className="text-2xl font-bold text-white">Launch the Vault Creation Wizard</h2>
          </div>
          
          <div className="ml-14">
            <p className="text-zinc-400 mb-4">
              From the SatsLegacy dashboard, click the <strong className="text-white">"Create Vault"</strong> button. This launches the sovereign vault creation wizard.
            </p>
            
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 mb-4">
              <p className="text-sm text-zinc-400 mb-2">The wizard will guide you through:</p>
              <ul className="space-y-1 text-sm text-zinc-300">
                <li>• Infrastructure selection (where keys are stored)</li>
                <li>• Primary inheritance logic (timelock, dead man's switch, etc.)</li>
                <li>• Additional security gates</li>
                <li>• Heir configuration</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Step 2: Choose Infrastructure */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold">2</div>
            <h2 className="text-2xl font-bold text-white">Choose Your Infrastructure</h2>
          </div>
          
          <div className="ml-14">
            <p className="text-zinc-400 mb-4">
              Select where your vault data and keys will be stored. For maximum sovereignty, we recommend local-only storage.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-zinc-900 border-2 border-orange-500 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock size={18} className="text-orange-500" />
                  <span className="font-medium text-white">Local Only</span>
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">Recommended</span>
                </div>
                <p className="text-sm text-zinc-400">Vault data stored only on your machine. Maximum privacy, you manage backups.</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={18} className="text-blue-500" />
                  <span className="font-medium text-white">Local + MicroSD</span>
                </div>
                <p className="text-sm text-zinc-400">Encrypted backup to MicroSD for physical redundancy.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Step 3: Select Logic */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold">3</div>
            <h2 className="text-2xl font-bold text-white">Select Inheritance Logic</h2>
          </div>
          
          <div className="ml-14">
            <p className="text-zinc-400 mb-4">
              Choose the primary mechanism that controls when heirs can access funds.
            </p>
            
            <div className="space-y-4 mb-4">
              <div className="bg-zinc-900 border-2 border-orange-500 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={18} className="text-orange-500" />
                  <span className="font-medium text-white">Timelock (Dead Man's Switch)</span>
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">For this guide</span>
                </div>
                <p className="text-sm text-zinc-400">Funds unlock for heir after a set time unless you refresh. Simple and effective.</p>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={18} className="text-blue-500" />
                  <span className="font-medium text-white">Multisig Inheritance</span>
                </div>
                <p className="text-sm text-zinc-400">Multiple heirs must cooperate. Good for complex family structures.</p>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings size={18} className="text-purple-500" />
                  <span className="font-medium text-white">Hybrid</span>
                </div>
                <p className="text-sm text-zinc-400">Combine multiple conditions with fallbacks. Most flexible but complex.</p>
              </div>
            </div>
            
            <p className="text-zinc-400">
              For your first vault, select <strong className="text-white">Timelock</strong> and click Continue.
            </p>
          </div>
        </section>

        {/* Step 4: Configure Timelock */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold">4</div>
            <h2 className="text-2xl font-bold text-white">Configure Timelock Duration</h2>
          </div>
          
          <div className="ml-14">
            <p className="text-zinc-400 mb-4">
              Set how long the vault stays locked before your heir can claim. Choose a duration that gives you time to refresh but isn't so long that heirs wait unnecessarily.
            </p>
            
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-white mb-3">Recommended durations:</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300">6 months</span>
                  <span className="text-zinc-500 text-sm">Active management, frequent check-ins</span>
                </div>
                <div className="flex justify-between items-center bg-orange-500/10 -mx-2 px-2 py-1 rounded">
                  <span className="text-white font-medium">12 months</span>
                  <span className="text-orange-400 text-sm">Best for most users</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300">24 months</span>
                  <span className="text-zinc-500 text-sm">Set-and-forget approach</span>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
              <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-200">
                <strong>Important:</strong> You must refresh your vault BEFORE the timelock expires, or your heir will be able to spend. Set calendar reminders for 1-2 months before expiration.
              </p>
            </div>
          </div>
        </section>

        {/* Step 5: Add Heir */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold">5</div>
            <h2 className="text-2xl font-bold text-white">Add Your Heir</h2>
          </div>
          
          <div className="ml-14">
            <p className="text-zinc-400 mb-4">
              Enter your heir's extended public key (xpub). This allows them to receive the inheritance but NOT spend until the timelock expires.
            </p>
            
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-white mb-3">How your heir generates an xpub:</h4>
              <ol className="space-y-2 text-sm text-zinc-300">
                <li><span className="text-orange-500">1.</span> Your heir sets up their own hardware wallet</li>
                <li><span className="text-orange-500">2.</span> They navigate to "Export Public Key" or similar</li>
                <li><span className="text-orange-500">3.</span> They share ONLY the xpub (starts with xpub, ypub, or zpub)</li>
                <li><span className="text-orange-500">4.</span> They NEVER share their seed phrase or private keys</li>
              </ol>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 mb-4">
              <p className="text-sm text-zinc-400 mb-2">Enter heir details:</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500">Name</label>
                  <div className="bg-zinc-800 rounded px-3 py-2 text-zinc-300 text-sm">Sarah (Daughter)</div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Extended Public Key (xpub)</label>
                  <div className="bg-zinc-800 rounded px-3 py-2 text-zinc-300 text-sm font-mono truncate">xpub6CUGRUonZSQ4TWt...</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 6: Review & Create */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold">6</div>
            <h2 className="text-2xl font-bold text-white">Review & Create</h2>
          </div>
          
          <div className="ml-14">
            <p className="text-zinc-400 mb-4">
              Review your vault configuration. SatsLegacy will display the Miniscript policy that will govern your vault — this is the actual Bitcoin script that enforces your inheritance rules.
            </p>
            
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 mb-4">
              <p className="text-xs text-zinc-500 mb-2">Generated Miniscript Policy:</p>
              <code className="text-green-400 text-sm font-mono block bg-zinc-800 p-3 rounded">
                or(pk(owner),and(pk(heir),after(blockheight)))
              </code>
              <p className="text-xs text-zinc-500 mt-2">
                Translation: Owner can spend anytime, OR heir can spend after the timelock.
              </p>
            </div>
            
            <p className="text-zinc-400 mb-4">
              Click <strong className="text-white">"Create Vault"</strong> to finalize. Your hardware wallet may prompt you to verify the vault address.
            </p>
          </div>
        </section>

        {/* Step 7: Test & Fund */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-black font-bold">
              <CheckCircle size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white">Test & Fund</h2>
          </div>
          
          <div className="ml-14">
            <p className="text-zinc-400 mb-4">
              Before funding with significant amounts, always test your vault:
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">Send a small test amount (e.g., 10,000 sats)</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">Verify you can spend from the vault as the owner</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">Generate and review the Heir Kit</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">Test the refresh process</span>
              </div>
            </div>
            
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-sm text-green-200">
                <strong>Success!</strong> Once testing is complete, you can fund your vault with your intended inheritance amount. Remember to set reminders to refresh before the timelock expires.
              </p>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="#/docs/key-distribution" className="bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/50 rounded-xl p-6 transition-colors group">
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors">Key Distribution</h3>
              <p className="text-sm text-zinc-400">Learn how to securely distribute heir keys and kits.</p>
            </a>
            <a href="#/docs/backups" className="bg-zinc-900/50 border border-zinc-800 hover:border-orange-500/50 rounded-xl p-6 transition-colors group">
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors">Backup Strategies</h3>
              <p className="text-sm text-zinc-400">Ensure your vault survives any disaster.</p>
            </a>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-zinc-800 pt-8">
          <p className="text-zinc-500 text-sm text-center">
            Not your keys, not your coins. Not your script, not your inheritance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirstVaultPage;
