import React from 'react';
import { BookOpen } from 'lucide-react';

const topics = [
  {
    category: 'Fundamentals',
    items: [
      { title: 'Vault Architecture', desc: 'Interactive map of all vault configuration options', duration: '5 min', href: '#/docs/vault-architecture' },
      { title: 'The Sovereignty Problem', desc: 'Why custodial inheritance betrays Bitcoin principles', duration: '10 min', href: '#/docs/sovereignty-problem' },
      { title: 'Quick Start Guide', desc: 'Get up and running in 10 minutes', duration: '10 min', href: '#/docs/quick-start' },
      { title: 'Hardware Wallet Integration', desc: 'Coldcard, Trezor, Ledger and more', duration: '15 min', href: '#/docs/hardware-wallets' },
    ]
  },
  {
    category: 'Technical',
    items: [
      { title: 'Timelock Vaults', desc: 'How Bitcoin scripts enforce time-based conditions', duration: '12 min', href: '#/docs/vault-timelock' },
      { title: 'Multisig Inheritance', desc: 'Distribute trust across multiple keys', duration: '15 min', href: '#/docs/vault-multisig' },
      { title: 'Miniscript & Timelocks', desc: 'Advanced scripting for complex inheritance', duration: '20 min', href: '#/docs/miniscript-timelocks' },
    ]
  },
  {
    category: 'Security & Privacy',
    items: [
      { title: 'Threat Model', desc: 'Understanding attack vectors and mitigations', duration: '12 min', href: '#/docs/security-threats' },
      { title: 'Backup Strategies', desc: 'Redundancy and disaster recovery', duration: '10 min', href: '#/docs/backups' },
      { title: 'Tor Integration', desc: 'Protect your network privacy', duration: '8 min', href: '#/docs/tor' },
    ]
  },
];

export function LearnView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Learn</h2>
        <p className="text-zinc-500">Master Bitcoin inheritance and self-custody</p>
      </div>

      {topics.map(category => (
        <div key={category.category}>
          <h3 className="text-lg font-semibold text-white mb-4">{category.category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {category.items.map((item, i) => (
              <a
                key={i}
                href={item.href}
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 hover:border-orange-500/50 transition-colors cursor-pointer group block"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-orange-500/10 transition-colors">
                    <BookOpen size={18} className="text-zinc-500 group-hover:text-orange-400 transition-colors" />
                  </div>
                  <span className="text-xs text-zinc-500">{item.duration}</span>
                </div>
                <h4 className="text-white font-medium mb-2 group-hover:text-orange-400 transition-colors">{item.title}</h4>
                <p className="text-sm text-zinc-500">{item.desc}</p>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
