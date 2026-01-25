/**
 * The Sovereignty Problem
 * 
 * Why custodial inheritance betrays Bitcoin's core promise
 */

import React from 'react';
import { 
  Shield, AlertTriangle, ArrowLeft, ArrowRight, ExternalLink,
  XCircle, CheckCircle, Lock, Users, Building, Scale, Eye
} from 'lucide-react';

const SovereigntyProblemPage = () => {
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
              <span className="text-xl font-bold">BitTrust</span>
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
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <span className="text-sm text-red-400 font-medium">Core Concepts</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">The Sovereignty Problem</h1>
          <p className="text-xl text-zinc-400">
            Why custodial inheritance solutions betray Bitcoin's fundamental promise—and why 
            the traditional estate planning industry is fundamentally incompatible with self-sovereignty.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="mb-12 p-6 bg-zinc-800/30 border border-zinc-800 rounded-xl">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">On This Page</h2>
          <ul className="space-y-2">
            <li><a href="#paradox" className="text-zinc-300 hover:text-orange-400 transition-colors">The Sovereignty Paradox</a></li>
            <li><a href="#custodial-trap" className="text-zinc-300 hover:text-orange-400 transition-colors">The Custodial Trap</a></li>
            <li><a href="#traditional-failure" className="text-zinc-300 hover:text-orange-400 transition-colors">Traditional Estate Planning Failure</a></li>
            <li><a href="#lost-bitcoin" className="text-zinc-300 hover:text-orange-400 transition-colors">The Scale of Lost Bitcoin</a></li>
            <li><a href="#solution" className="text-zinc-300 hover:text-orange-400 transition-colors">The Trustless Solution</a></li>
          </ul>
        </div>

        {/* Content Sections */}
        <div className="prose prose-invert prose-zinc max-w-none">
          
          {/* Section 1 */}
          <section id="paradox" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-sm font-bold">1</span>
              The Sovereignty Paradox
            </h2>
            
            <p className="text-zinc-300 leading-relaxed mb-6">
              Bitcoin's fundamental value proposition is <strong className="text-white">self-sovereignty</strong>: 
              the ability to hold and transfer wealth without permission from any intermediary. This is achieved 
              through cryptographic key pairs—whoever controls the private key controls the Bitcoin.
            </p>
            
            <p className="text-zinc-300 leading-relaxed mb-6">
              Simple. Elegant. Revolutionary.
            </p>
            
            <p className="text-zinc-300 leading-relaxed mb-6">
              But this same property creates what we call the <strong className="text-white">Sovereignty Paradox</strong>: 
              the mechanisms that protect your Bitcoin during your lifetime become obstacles to transferring it after your death. 
              A private key that dies with its owner locks away that Bitcoin forever.
            </p>

            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
              <p className="text-red-300 font-medium">
                The very security that makes Bitcoin valuable becomes a liability when you need to pass it to the next generation.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="custodial-trap" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-sm font-bold">2</span>
              The Custodial Trap
            </h2>
            
            <p className="text-zinc-300 leading-relaxed mb-6">
              The most common "solution" offered by the industry is custodial inheritance services. Companies offer to 
              hold your keys (or portions of them) and release Bitcoin to your heirs upon your death.
            </p>

            <p className="text-zinc-300 leading-relaxed mb-6">
              This approach has several fatal flaws:
            </p>

            <div className="space-y-4 mb-8">
              {[
                {
                  icon: Building,
                  title: 'Counterparty Risk',
                  desc: 'Any entity holding your keys can be compromised, coerced, or corrupted. Exchanges have been hacked. Custodians have committed fraud. The history of financial custodians is a history of failures.',
                  color: 'red'
                },
                {
                  icon: Scale,
                  title: 'Regulatory Capture',
                  desc: 'Custodians operate under legal jurisdictions. They can be compelled to freeze assets, report holdings, or deny access. Your Bitcoin becomes subject to the same state control you sought to escape.',
                  color: 'red'
                },
                {
                  icon: Users,
                  title: 'Ongoing Dependency',
                  desc: 'Custodial services require ongoing relationships and recurring fees. If the company fails, pivots, or is acquired, your inheritance plan fails with it.',
                  color: 'red'
                },
                {
                  icon: XCircle,
                  title: 'Philosophical Betrayal',
                  desc: '"Not your keys, not your coins" doesn\'t include an asterisk for inheritance. If you\'re willing to give up custody to plan for death, why not give it up for convenience during life?',
                  color: 'red'
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <item.icon size={20} className="text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-zinc-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 */}
          <section id="traditional-failure" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-sm font-bold">3</span>
              Traditional Estate Planning Failure
            </h2>
            
            <p className="text-zinc-300 leading-relaxed mb-6">
              Traditional estate planning instruments—wills, trusts, powers of attorney—were designed for a world of 
              physical assets and institutional intermediaries. They fail catastrophically when applied to Bitcoin:
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {[
                {
                  title: 'Probate Exposure',
                  desc: 'Wills are public documents. A seed phrase in a will becomes visible to courts, clerks, and potentially anyone.'
                },
                {
                  title: 'Executor Risk',
                  desc: 'Giving an executor access to your seed phrase gives them the ability to steal your Bitcoin before distribution.'
                },
                {
                  title: 'Timing Mismatch',
                  desc: 'Probate can take months or years. Your Bitcoin sits vulnerable—inaccessible to heirs who may need funds immediately.'
                },
                {
                  title: 'Jurisdictional Complexity',
                  desc: 'Bitcoin exists outside jurisdictions. Courts struggle to apply property law designed for physical assets.'
                }
              ].map((item, i) => (
                <div key={i} className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-zinc-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
              <Eye size={24} className="text-yellow-400 mb-3" />
              <p className="text-zinc-300">
                <strong className="text-white">The fundamental problem:</strong> Traditional estate planning requires 
                exposing your private keys to third parties—lawyers, courts, executors—who may not understand Bitcoin 
                security, may be vulnerable to coercion, or may simply steal your funds.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="lost-bitcoin" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-sm font-bold">4</span>
              The Scale of Lost Bitcoin
            </h2>
            
            <p className="text-zinc-300 leading-relaxed mb-6">
              The inheritance problem isn't theoretical. It's happening right now, at massive scale:
            </p>

            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <p className="text-4xl font-bold text-orange-400 mb-2">3-4M</p>
                <p className="text-sm text-zinc-500">Bitcoin permanently lost</p>
              </div>
              <div className="text-center p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <p className="text-4xl font-bold text-orange-400 mb-2">~20%</p>
                <p className="text-sm text-zinc-500">Of all Bitcoin supply</p>
              </div>
              <div className="text-center p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <p className="text-4xl font-bold text-orange-400 mb-2">$B+</p>
                <p className="text-sm text-zinc-500">Value lost to failed inheritance</p>
              </div>
            </div>

            <p className="text-zinc-300 leading-relaxed">
              As early adopters age and the value of Bitcoin holdings grows, this problem will only accelerate. 
              Without a solution, generational wealth transfer—one of humanity's oldest institutions—becomes 
              impossible for Bitcoin holders.
            </p>
          </section>

          {/* Section 5 */}
          <section id="solution" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 text-sm font-bold">5</span>
              The Trustless Solution
            </h2>
            
            <p className="text-zinc-300 leading-relaxed mb-6">
              The solution isn't to find a "trustworthy" custodian. The solution is to eliminate the need for trust entirely.
            </p>

            <p className="text-zinc-300 leading-relaxed mb-6">
              Bitcoin's scripting language includes powerful primitives that can enforce inheritance rules without 
              any third party:
            </p>

            <div className="space-y-4 mb-8">
              {[
                {
                  icon: Lock,
                  title: 'Timelocks (OP_CHECKLOCKTIMEVERIFY)',
                  desc: 'Make outputs unspendable until a specific block height or timestamp. No trusted timekeeper needed.',
                  color: 'green'
                },
                {
                  icon: Users,
                  title: 'Multisignature (OP_CHECKMULTISIG)',
                  desc: 'Require multiple keys to authorize a transaction. Distribute control without single points of failure.',
                  color: 'green'
                },
                {
                  icon: Shield,
                  title: 'Miniscript Policies',
                  desc: 'Compose complex spending conditions that are both human-readable and machine-verifiable.',
                  color: 'green'
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <item.icon size={20} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-zinc-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 rounded-xl">
              <p className="text-lg text-zinc-200">
                <strong className="text-orange-400">BitTrust</strong> leverages these Bitcoin-native capabilities to create 
                inheritance vaults that execute automatically—no custodians, no lawyers, no trust required.
              </p>
            </div>
          </section>

        </div>

        {/* Navigation */}
        <div className="mt-16 pt-8 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <a 
              href="#/docs"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Docs
            </a>
            <a 
              href="#/docs/miniscript-timelocks"
              className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/20 transition-colors"
            >
              Next: Miniscript & Timelocks
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center text-sm text-zinc-600">
          <p>© 2025 BitTrust. Open source under MIT License.</p>
        </div>
      </footer>
    </div>
  );
};

export default SovereigntyProblemPage;
