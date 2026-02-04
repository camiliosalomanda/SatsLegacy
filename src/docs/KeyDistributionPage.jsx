/**
 * Key Distribution
 * 
 * Practical strategies for proactive key distribution to heirs
 */

import React from 'react';
import { 
  Shield, Key, ArrowLeft, ArrowRight, Users, Lock,
  CheckCircle, AlertTriangle, Smartphone, HardDrive,
  FileText, Mail, MapPin, Eye, EyeOff, Share2
} from 'lucide-react';

const KeyDistributionPage = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="#/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Shield size={24} className="text-black" />
              </div>
              <span className="text-xl font-bold">SatsLegacy</span>
            </a>
            <span className="text-zinc-600">/</span>
            <a href="#/docs" className="text-zinc-400 hover:text-white transition-colors">Docs</a>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-300">Core Concepts</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-6 py-16">
        {/* Title */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Key size={24} className="text-green-400" />
            </div>
            <span className="text-sm text-green-400 font-medium">Core Concepts</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Key Distribution</h1>
          <p className="text-xl text-zinc-400">
            Practical strategies for proactively distributing keys to your heirs. Hardware wallet 
            ceremonies, Shamir's Secret Sharing, and encrypted heir kits.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="mb-12 p-6 bg-zinc-800/30 border border-zinc-800 rounded-xl">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">On This Page</h2>
          <ul className="space-y-2">
            <li><a href="#imperative" className="text-zinc-300 hover:text-orange-400 transition-colors">The Distribution Imperative</a></li>
            <li><a href="#hardware-ceremony" className="text-zinc-300 hover:text-orange-400 transition-colors">Hardware Wallet Key Ceremony</a></li>
            <li><a href="#shamir" className="text-zinc-300 hover:text-orange-400 transition-colors">Shamir's Secret Sharing</a></li>
            <li><a href="#heir-kits" className="text-zinc-300 hover:text-orange-400 transition-colors">Encrypted Heir Kits</a></li>
            <li><a href="#security" className="text-zinc-300 hover:text-orange-400 transition-colors">Security Considerations</a></li>
            <li><a href="#checklist" className="text-zinc-300 hover:text-orange-400 transition-colors">Distribution Checklist</a></li>
          </ul>
        </div>

        {/* Content Sections */}
        <div className="prose prose-invert prose-zinc max-w-none">
          
          {/* Section 1 */}
          <section id="imperative" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-sm font-bold">1</span>
              The Distribution Imperative
            </h2>
            
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
              <AlertTriangle size={24} className="text-red-400 mb-3" />
              <p className="text-zinc-300 font-medium">
                A trustless inheritance system requires that heirs possess their keys <strong className="text-white">BEFORE</strong> the 
                inheritance event occurs. This is non-negotiable.
              </p>
            </div>
            
            <p className="text-zinc-300 leading-relaxed mb-6">
              You cannot distribute keys from beyond the grave, and any system that promises to do so for you 
              reintroduces the third-party trust you're trying to eliminate. The keys must be in your heirs' 
              hands while you're still alive.
            </p>

            <p className="text-zinc-300 leading-relaxed mb-6">
              This creates what some perceive as a security tradeoff: heirs have keys before you die. However, 
              the <strong className="text-white">timelock mechanism</strong> ensures they cannot spend until the lock expires. 
              As long as you regularly refresh your vaults, possession of heir keys grants no spending power.
            </p>

            <div className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
              <h4 className="font-semibold text-white mb-3">The Sovereignty Tradeoff</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-900 rounded-lg">
                  <EyeOff size={20} className="text-green-400 mb-2" />
                  <p className="text-sm text-zinc-300">
                    <strong className="text-white">What heirs CAN'T do:</strong> Spend your Bitcoin while 
                    the timelock is active (you're alive and refreshing)
                  </p>
                </div>
                <div className="p-4 bg-zinc-900 rounded-lg">
                  <Eye size={20} className="text-yellow-400 mb-2" />
                  <p className="text-sm text-zinc-300">
                    <strong className="text-white">What heirs CAN do:</strong> Know they're beneficiaries, 
                    potentially see vault balances (if xpubs shared)
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section id="hardware-ceremony" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-sm font-bold">2</span>
              Hardware Wallet Key Ceremony
            </h2>
            
            <p className="text-zinc-300 leading-relaxed mb-6">
              The recommended approach for key distribution is a formal <strong className="text-white">Hardware Wallet Ceremony</strong>. 
              This in-person process ensures heirs properly generate and secure their own keys.
            </p>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Prepare the Environment</h4>
                    <p className="text-zinc-400 text-sm">
                      Gather heirs in a secure, private location. No phones. No cameras. No digital devices 
                      except the hardware wallets being configured.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Initialize Hardware Wallets</h4>
                    <p className="text-zinc-400 text-sm">
                      Each heir initializes their own hardware wallet, generating their own seed phrase. 
                      They write down and verify their seed phrase. They <strong>NEVER</strong> share their 
                      seed phrase with anyone, including you.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Export Extended Public Keys</h4>
                    <p className="text-zinc-400 text-sm">
                      Each heir exports their extended public key (xpub). The xpub allows vault creation 
                      but does not enable spending. You collect these xpubs to configure the inheritance vault.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Create the Vault</h4>
                    <p className="text-zinc-400 text-sm">
                      Using SatsLegacy, create the vault with your key and all heir xpubs. The software 
                      generates the Miniscript policy and vault address. Verify on your hardware wallet.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold flex-shrink-0">
                    5
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Fund & Distribute Heir Kits</h4>
                    <p className="text-zinc-400 text-sm">
                      Fund the vault and provide each heir with their Encrypted Heir Kit containing 
                      vault details, spending instructions, and verification information.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-zinc-300 text-sm">
                    <strong className="text-white">Best Practice:</strong> Use hardware wallets from different manufacturers 
                    for you and your heirs. This protects against single-vendor supply chain attacks.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="shamir" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-sm font-bold">3</span>
              Shamir's Secret Sharing
            </h2>
            
            <p className="text-zinc-300 leading-relaxed mb-6">
              For users who cannot conduct in-person ceremonies or who want additional redundancy, 
              SatsLegacy supports <strong className="text-white">Shamir's Secret Sharing (SSS)</strong> for key distribution.
            </p>

            <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
              <Share2 size={24} className="text-blue-400 mb-3" />
              <p className="text-zinc-300">
                <strong className="text-white">Shamir's Secret Sharing</strong> splits a secret into N shares, 
                of which any K are sufficient to reconstruct the original. For example, a 3-of-5 split means 
                any 3 shares can recover the key, but 2 shares reveal nothing.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-white mb-4">Common Configurations</h3>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-400 mb-1">2-of-3</p>
                <p className="text-sm text-zinc-500">Small family, high redundancy</p>
              </div>
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-400 mb-1">3-of-5</p>
                <p className="text-sm text-zinc-500">Balanced security & access</p>
              </div>
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-400 mb-1">4-of-7</p>
                <p className="text-sm text-zinc-500">Large family, max security</p>
              </div>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-zinc-300 text-sm">
                    <strong className="text-white">Important:</strong> SSS should be used for backup redundancy, 
                    not as a replacement for proper multisig. If you split a single key using SSS, heirs must 
                    reconstruct that key before spending—a single point of failure. True multisig keeps keys 
                    separate and never requires reconstruction.
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-4">When to Use SSS</h3>

            <div className="space-y-3">
              {[
                { use: true, text: 'Backup redundancy for vault configuration data' },
                { use: true, text: 'Geographic distribution of recovery information' },
                { use: true, text: 'Protecting against single-location disasters' },
                { use: false, text: 'Replacing true multisig for spending authority' },
                { use: false, text: 'Primary key storage mechanism' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {item.use ? (
                    <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
                  )}
                  <span className={item.use ? 'text-zinc-300' : 'text-zinc-500'}>{item.text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 */}
          <section id="heir-kits" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-sm font-bold">4</span>
              Encrypted Heir Kits
            </h2>
            
            <p className="text-zinc-300 leading-relaxed mb-6">
              Each heir receives an <strong className="text-white">Encrypted Heir Kit</strong>—a package containing 
              everything they need to claim their inheritance when the time comes.
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">Kit Contents</h3>

            <div className="space-y-3 mb-8">
              {[
                { icon: FileText, title: 'Vault Documentation', desc: 'Vault address, Miniscript policy, timelock details' },
                { icon: Key, title: 'Key Information', desc: 'Their role in the multisig, which key is theirs' },
                { icon: HardDrive, title: 'Recovery Instructions', desc: 'Step-by-step guide to claiming inheritance' },
                { icon: Users, title: 'Co-heir Contacts', desc: 'How to coordinate with other beneficiaries if needed' },
                { icon: MapPin, title: 'Backup Locations', desc: 'Where other copies of critical data are stored' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <item.icon size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{item.title}</h4>
                    <p className="text-zinc-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-white mb-4">Distribution Methods</h3>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Physical Delivery</h4>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    USB drive in tamper-evident bag
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    Steel plate backup for critical data
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    Safe deposit box storage
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Digital Delivery</h4>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    AES-256-GCM encrypted file
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    Nostr relay backup (optional)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    Password delivered separately
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="security" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-sm font-bold">5</span>
              Security Considerations
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Never Share Seed Phrases</h4>
                <p className="text-zinc-400 text-sm">
                  Heirs should never share their seed phrases with you or anyone else. You only need their 
                  extended public keys (xpubs) to create the vault.
                </p>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Verify, Don't Trust</h4>
                <p className="text-zinc-400 text-sm">
                  Before funding a vault, verify the receiving address on your hardware wallet display. 
                  Malware can substitute addresses on your computer screen.
                </p>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Test Recovery</h4>
                <p className="text-zinc-400 text-sm">
                  Before funding with significant amounts, test the entire inheritance process with a small 
                  amount. Ensure heirs can actually recover funds when the timelock expires.
                </p>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Regular Updates</h4>
                <p className="text-zinc-400 text-sm">
                  Schedule annual reviews of your inheritance setup. Update heir kits when family situations 
                  change, and ensure all parties still have access to their keys.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section id="checklist" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-sm font-bold">6</span>
              Distribution Checklist
            </h2>
            
            <div className="p-6 bg-zinc-800/30 border border-zinc-700 rounded-xl">
              <h4 className="font-semibold text-white mb-4">Before the Ceremony</h4>
              <div className="space-y-2 mb-6">
                {[
                  'Purchase hardware wallets for all heirs',
                  'Prepare secure location (no cameras/phones)',
                  'Create printed instructions for heirs',
                  'Test SatsLegacy vault creation workflow',
                ].map((item, i) => (
                  <label key={i} className="flex items-center gap-3 text-zinc-300 text-sm">
                    <input type="checkbox" className="rounded bg-zinc-700 border-zinc-600" />
                    {item}
                  </label>
                ))}
              </div>

              <h4 className="font-semibold text-white mb-4">During the Ceremony</h4>
              <div className="space-y-2 mb-6">
                {[
                  'Each heir initializes their hardware wallet',
                  'Each heir securely stores their seed phrase',
                  'Collect extended public keys (xpubs) from each heir',
                  'Create and verify vault in SatsLegacy',
                  'Fund vault with small test amount',
                ].map((item, i) => (
                  <label key={i} className="flex items-center gap-3 text-zinc-300 text-sm">
                    <input type="checkbox" className="rounded bg-zinc-700 border-zinc-600" />
                    {item}
                  </label>
                ))}
              </div>

              <h4 className="font-semibold text-white mb-4">After the Ceremony</h4>
              <div className="space-y-2">
                {[
                  'Generate and encrypt heir kits',
                  'Distribute heir kits through secure channels',
                  'Verify heirs can decrypt their kits',
                  'Create backup copies in separate locations',
                  'Schedule vault refresh reminders',
                  'Document everything for your records',
                ].map((item, i) => (
                  <label key={i} className="flex items-center gap-3 text-zinc-300 text-sm">
                    <input type="checkbox" className="rounded bg-zinc-700 border-zinc-600" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* Navigation */}
        <div className="mt-16 pt-8 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <a 
              href="#/docs/miniscript-timelocks"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Previous: Miniscript & Timelocks
            </a>
            <a 
              href="#/docs"
              className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/20 transition-colors"
            >
              Back to Documentation
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center text-sm text-zinc-600">
          <p>© 2026 SatsLegacy. Open source under MIT License.</p>
        </div>
      </footer>
    </div>
  );
};

export default KeyDistributionPage;
