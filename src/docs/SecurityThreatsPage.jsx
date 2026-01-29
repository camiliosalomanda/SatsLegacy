/**
 * SatsLegacy - Security Threat Model
 */
import React from 'react';
import { Shield, ChevronLeft, AlertTriangle, CheckCircle, Lock, Eye, Wifi, Server, Key } from 'lucide-react';

const SecurityThreatsPage = () => {
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <p className="text-orange-500 text-sm font-medium">Security</p>
              <h1 className="text-3xl font-bold text-white">Threat Model</h1>
            </div>
          </div>
          <p className="text-xl text-zinc-400">Understanding the attack vectors and how SatsLegacy protects against them.</p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Threats We Protect Against</h2>
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Server size={20} className="text-red-500" />
                <h3 className="font-semibold text-white">Third-Party Compromise</h3>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Eliminated</span>
              </div>
              <p className="text-sm text-zinc-400">No third party ever holds your keys. SatsLegacy is a tool, not a custodian. Your keys stay on your hardware wallet.</p>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Lock size={20} className="text-orange-500" />
                <h3 className="font-semibold text-white">Premature Heir Access</h3>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Prevented</span>
              </div>
              <p className="text-sm text-zinc-400">Timelocks enforced by Bitcoin consensus. Heirs possess keys but cannot spend until timelock expires.</p>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Eye size={20} className="text-blue-500" />
                <h3 className="font-semibold text-white">Software Supply Chain</h3>
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Mitigated</span>
              </div>
              <p className="text-sm text-zinc-400">Open source and reproducibly built. Hardware wallet signing ensures malicious software cannot steal funds.</p>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Key size={20} className="text-purple-500" />
                <h3 className="font-semibold text-white">Single Heir Collusion</h3>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Prevented</span>
              </div>
              <p className="text-sm text-zinc-400">Multisig configurations require multiple heirs to cooperate. No single party can access funds alone.</p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Wifi size={20} className="text-blue-500" />
                <h3 className="font-semibold text-white">Network Surveillance</h3>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Mitigated</span>
              </div>
              <p className="text-sm text-zinc-400">Optional Tor routing hides your IP from blockchain APIs. ISP cannot see which addresses you query.</p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle size={20} className="text-red-500" />
                <h3 className="font-semibold text-white">Physical Coercion ($5 Wrench)</h3>
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Mitigated</span>
              </div>
              <p className="text-sm text-zinc-400">Duress protection with decoy vaults provides plausible deniability. Cannot eliminate physical threats but reduces incentive.</p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Server size={20} className="text-yellow-500" />
                <h3 className="font-semibold text-white">Malware / Keyloggers</h3>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Mitigated</span>
              </div>
              <p className="text-sm text-zinc-400">Hardware wallet signing means even compromised computers cannot steal funds. PSBT workflow keeps private keys isolated.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">User Responsibilities</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <AlertTriangle size={20} className="text-yellow-500 mt-0.5" />
              <div>
                <p className="text-white font-medium">Secure your own keys</p>
                <p className="text-sm text-zinc-400">Hardware wallet seed phrases must be stored securely. SatsLegacy cannot recover lost keys.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <AlertTriangle size={20} className="text-yellow-500 mt-0.5" />
              <div>
                <p className="text-white font-medium">Refresh vaults on time</p>
                <p className="text-sm text-zinc-400">Timelock vaults must be refreshed before expiration. Missing a refresh enables heir access.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <AlertTriangle size={20} className="text-yellow-500 mt-0.5" />
              <div>
                <p className="text-white font-medium">Verify everything</p>
                <p className="text-sm text-zinc-400">Check addresses on hardware wallet. Verify Miniscript policies. Test recovery procedures.</p>
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

export default SecurityThreatsPage;
