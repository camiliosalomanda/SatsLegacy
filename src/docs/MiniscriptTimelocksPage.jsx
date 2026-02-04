/**
 * Miniscript & Timelocks
 * 
 * Technical deep-dive on Bitcoin scripting for inheritance
 */

import React from 'react';
import { 
  Shield, Lock, ArrowLeft, ArrowRight, Clock, Code,
  CheckCircle, AlertTriangle, Terminal, Cpu, Zap
} from 'lucide-react';

const MiniscriptTimelocksPage = () => {
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
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Lock size={24} className="text-orange-400" />
            </div>
            <span className="text-sm text-orange-400 font-medium">Core Concepts</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Miniscript & Timelocks</h1>
          <p className="text-xl text-zinc-400">
            How Bitcoin's native scripting capabilities enable trustless inheritance without 
            any third-party involvement. A technical deep-dive into the building blocks.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="mb-12 p-6 bg-zinc-800/30 border border-zinc-800 rounded-xl">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">On This Page</h2>
          <ul className="space-y-2">
            <li><a href="#bitcoin-script" className="text-zinc-300 hover:text-orange-400 transition-colors">Bitcoin Script Basics</a></li>
            <li><a href="#miniscript" className="text-zinc-300 hover:text-orange-400 transition-colors">What is Miniscript?</a></li>
            <li><a href="#timelocks" className="text-zinc-300 hover:text-orange-400 transition-colors">Understanding Timelocks</a></li>
            <li><a href="#inheritance-policies" className="text-zinc-300 hover:text-orange-400 transition-colors">Inheritance Policies</a></li>
            <li><a href="#dead-man-switch" className="text-zinc-300 hover:text-orange-400 transition-colors">Dead Man's Switch</a></li>
            <li><a href="#examples" className="text-zinc-300 hover:text-orange-400 transition-colors">Real-World Examples</a></li>
          </ul>
        </div>

        {/* Content Sections */}
        <div className="prose prose-invert prose-zinc max-w-none">
          
          {/* Section 1 */}
          <section id="bitcoin-script" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-sm font-bold">1</span>
              Bitcoin Script Basics
            </h2>
            
            <p className="text-zinc-300 leading-relaxed mb-6">
              Bitcoin transactions aren't simply "send X coins to address Y." Under the hood, every Bitcoin 
              output is locked by a <strong className="text-white">script</strong>—a small program that defines 
              the conditions under which that output can be spent.
            </p>
            
            <p className="text-zinc-300 leading-relaxed mb-6">
              The most common script is Pay-to-Public-Key-Hash (P2PKH), which says: "This output can be spent 
              by anyone who can provide a valid signature from the private key corresponding to this public key hash."
            </p>

            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg font-mono text-sm mb-6 overflow-x-auto">
              <div className="text-zinc-500 mb-2"># Standard P2PKH Script</div>
              <div className="text-green-400">OP_DUP OP_HASH160 &lt;pubKeyHash&gt; OP_EQUALVERIFY OP_CHECKSIG</div>
            </div>

            <p className="text-zinc-300 leading-relaxed mb-6">
              But Bitcoin Script is far more powerful than simple signature checks. It includes opcodes for:
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {[
                { title: 'Time Conditions', desc: 'OP_CHECKLOCKTIMEVERIFY, OP_CHECKSEQUENCEVERIFY' },
                { title: 'Multiple Signatures', desc: 'OP_CHECKMULTISIG, OP_CHECKMULTISIGVERIFY' },
                { title: 'Hash Conditions', desc: 'OP_HASH160, OP_SHA256, OP_EQUAL' },
                { title: 'Logic Operations', desc: 'OP_IF, OP_ELSE, OP_ENDIF, OP_NOTIF' },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  <p className="text-zinc-500 text-xs font-mono">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2 */}
          <section id="miniscript" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-sm font-bold">2</span>
              What is Miniscript?
            </h2>
            
            <p className="text-zinc-300 leading-relaxed mb-6">
              Raw Bitcoin Script is powerful but dangerous. It's easy to create scripts that are 
              unspendable, inefficient, or have subtle security bugs. Enter <strong className="text-white">Miniscript</strong>.
            </p>

            <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
              <Code size={24} className="text-blue-400 mb-3" />
              <p className="text-zinc-300">
                <strong className="text-white">Miniscript</strong> is a structured representation of Bitcoin Script 
                that enables composition, analysis, and optimization of spending conditions while guaranteeing 
                correctness and efficiency.
              </p>
            </div>

            <p className="text-zinc-300 leading-relaxed mb-6">
              Instead of writing raw opcodes, you express spending policies in a human-readable format:
            </p>

            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg font-mono text-sm mb-6 overflow-x-auto">
              <div className="text-zinc-500 mb-2"># Miniscript Policy: Owner OR (Heir AND Timelock)</div>
              <div className="text-orange-400">or(pk(owner), and(pk(heir), after(52560)))</div>
            </div>

            <p className="text-zinc-300 leading-relaxed mb-6">
              This policy says: "The owner can spend anytime, OR the heir can spend after block 52560."
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">Why Miniscript Matters</h3>

            <div className="space-y-3 mb-6">
              {[
                { title: 'Analyzable', desc: 'Tools can verify scripts are spendable under intended conditions' },
                { title: 'Composable', desc: 'Combine simple policies into complex multi-condition scripts' },
                { title: 'Optimizable', desc: 'Compilers generate the most efficient Script representation' },
                { title: 'Standardized', desc: 'Wallet interoperability through consistent policy language' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-white">{item.title}:</span>
                    <span className="text-zinc-400 ml-1">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 */}
          <section id="timelocks" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-sm font-bold">3</span>
              Understanding Timelocks
            </h2>
            
            <p className="text-zinc-300 leading-relaxed mb-6">
              Timelocks are Bitcoin's native mechanism for making outputs unspendable until a future time. 
              They're enforced by the network consensus—no trusted timekeeper required.
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">OP_CHECKLOCKTIMEVERIFY (CLTV)</h3>

            <p className="text-zinc-300 leading-relaxed mb-6">
              CLTV (BIP-65) makes an output unspendable until a specific:
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <Clock size={20} className="text-purple-400 mb-2" />
                <h4 className="font-semibold text-white mb-1">Block Height</h4>
                <p className="text-zinc-400 text-sm">Unlocks after block N is mined (e.g., block 900,000)</p>
                <div className="mt-2 p-2 bg-zinc-900 rounded font-mono text-xs text-purple-400">
                  after(900000)
                </div>
              </div>
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <Clock size={20} className="text-purple-400 mb-2" />
                <h4 className="font-semibold text-white mb-1">Unix Timestamp</h4>
                <p className="text-zinc-400 text-sm">Unlocks after specific date/time (e.g., Jan 1, 2027)</p>
                <div className="mt-2 p-2 bg-zinc-900 rounded font-mono text-xs text-purple-400">
                  after(1798761600)
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-zinc-300 text-sm">
                    <strong className="text-white">Important:</strong> Block height timelocks are more predictable 
                    (~10 min/block), while timestamp timelocks may vary with mining difficulty. For inheritance, 
                    block heights are generally preferred.
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-4">Converting Time to Blocks</h3>

            <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-orange-400">144</p>
                  <p className="text-xs text-zinc-500">blocks/day</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-400">1,008</p>
                  <p className="text-xs text-zinc-500">blocks/week</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-400">4,320</p>
                  <p className="text-xs text-zinc-500">blocks/month</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-400">52,560</p>
                  <p className="text-xs text-zinc-500">blocks/year</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="inheritance-policies" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-sm font-bold">4</span>
              Inheritance Policies
            </h2>
            
            <p className="text-zinc-300 leading-relaxed mb-6">
              By combining keys, timelocks, and logic operators, we can express sophisticated 
              inheritance conditions. Here are the core patterns SatsLegacy uses:
            </p>

            <h3 className="text-xl font-semibold text-white mb-4">Simple Timelock Inheritance</h3>
            
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg font-mono text-sm mb-4 overflow-x-auto">
              <div className="text-zinc-500 mb-2"># Owner can spend anytime, heir can spend after 1 year</div>
              <div className="text-orange-400">or(pk(owner), and(pk(heir), after(52560)))</div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-4 mt-8">Multisig with Timelock Decay</h3>
            
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg font-mono text-sm mb-4 overflow-x-auto">
              <div className="text-zinc-500 mb-2"># 2-of-3 multisig, decays to 1-of-3 after 1 year</div>
              <div className="text-orange-400">or(</div>
              <div className="text-orange-400 pl-4">thresh(2, pk(heir1), pk(heir2), pk(heir3)),</div>
              <div className="text-orange-400 pl-4">and(thresh(1, pk(heir1), pk(heir2), pk(heir3)), after(52560))</div>
              <div className="text-orange-400">)</div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-4 mt-8">Tiered Access</h3>
            
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg font-mono text-sm mb-4 overflow-x-auto">
              <div className="text-zinc-500 mb-2"># Owner anytime, spouse after 6mo, children 2-of-3 after 1yr</div>
              <div className="text-orange-400">or(</div>
              <div className="text-orange-400 pl-4">pk(owner),</div>
              <div className="text-orange-400 pl-4">or(</div>
              <div className="text-orange-400 pl-8">and(pk(spouse), after(26280)),</div>
              <div className="text-orange-400 pl-8">and(thresh(2, pk(child1), pk(child2), pk(child3)), after(52560))</div>
              <div className="text-orange-400 pl-4">)</div>
              <div className="text-orange-400">)</div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="dead-man-switch" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-sm font-bold">5</span>
              Dead Man's Switch
            </h2>
            
            <p className="text-zinc-300 leading-relaxed mb-6">
              The "dead man's switch" is the cornerstone of trustless inheritance. It works by requiring 
              the owner to periodically "check in" by moving funds to a new vault with a refreshed timelock.
            </p>

            <div className="p-6 bg-zinc-800/30 border border-zinc-700 rounded-xl mb-6">
              <h4 className="font-semibold text-white mb-4">How It Works:</h4>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-sm flex-shrink-0">1</span>
                  <p className="text-zinc-300">Create vault with 1-year timelock allowing heir access</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-sm flex-shrink-0">2</span>
                  <p className="text-zinc-300">Every 6 months, owner moves funds to new vault (resets timer)</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-sm flex-shrink-0">3</span>
                  <p className="text-zinc-300">If owner fails to check in (death/incapacity), timer expires</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-sm flex-shrink-0">4</span>
                  <p className="text-zinc-300">Heir can now spend using their key + expired timelock</p>
                </li>
              </ol>
            </div>

            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Zap size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-zinc-300 text-sm">
                    <strong className="text-white">Key insight:</strong> The heir has their key the entire time, 
                    but the timelock prevents spending. No key distribution happens at inheritance time—it's 
                    all set up in advance.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section id="examples" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-sm font-bold">6</span>
              Real-World Examples
            </h2>
            
            <div className="space-y-6">
              <div className="p-6 bg-zinc-800/30 border border-zinc-700 rounded-xl">
                <h4 className="font-semibold text-white mb-2">Single Parent, One Child</h4>
                <p className="text-zinc-400 text-sm mb-4">
                  Simple timelock: parent can spend anytime, child inherits after 1 year of inactivity.
                </p>
                <div className="p-3 bg-zinc-900 rounded font-mono text-xs text-orange-400 overflow-x-auto">
                  or(pk(parent), and(pk(child), after(52560)))
                </div>
              </div>

              <div className="p-6 bg-zinc-800/30 border border-zinc-700 rounded-xl">
                <h4 className="font-semibold text-white mb-2">Married Couple, Three Children</h4>
                <p className="text-zinc-400 text-sm mb-4">
                  Spouse gets immediate access after 6 months, children need 2-of-3 after 1 year.
                </p>
                <div className="p-3 bg-zinc-900 rounded font-mono text-xs text-orange-400 overflow-x-auto">
                  or(pk(owner), or(and(pk(spouse), after(26280)), and(thresh(2, pk(c1), pk(c2), pk(c3)), after(52560))))
                </div>
              </div>

              <div className="p-6 bg-zinc-800/30 border border-zinc-700 rounded-xl">
                <h4 className="font-semibold text-white mb-2">High Security with Lawyer Backup</h4>
                <p className="text-zinc-400 text-sm mb-4">
                  Owner normal access, heirs + lawyer 2-of-3 after 6 months, heirs-only 2-of-3 after 2 years.
                </p>
                <div className="p-3 bg-zinc-900 rounded font-mono text-xs text-orange-400 overflow-x-auto">
                  or(pk(owner), or(and(thresh(2, pk(h1), pk(h2), pk(lawyer)), after(26280)), and(thresh(2, pk(h1), pk(h2), pk(h3)), after(105120))))
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Navigation */}
        <div className="mt-16 pt-8 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <a 
              href="#/docs/sovereignty-problem"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Previous: Sovereignty Problem
            </a>
            <a 
              href="#/docs/key-distribution"
              className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/20 transition-colors"
            >
              Next: Key Distribution
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

export default MiniscriptTimelocksPage;
