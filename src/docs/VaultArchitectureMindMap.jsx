import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

const VaultArchitectureMindMap = () => {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);

  const presets = {
    simple: {
      name: 'Simple Sovereign',
      desc: '< 0.5 BTC, beginners',
      nodes: ['local', 'microsd', 'timelock']
    },
    resilient: {
      name: 'Resilient Sovereign',
      desc: '0.5-10 BTC, most users',
      nodes: ['local', 'shamir', 'nostr', 'multisig-decay']
    },
    active: {
      name: 'Active Guardian',
      desc: '10+ BTC, active management',
      nodes: ['local', 'shamir', 'nostr', 'deadman', 'challenge', 'staggered']
    },
    hostile: {
      name: 'Hostile Environment',
      desc: 'High threat model',
      nodes: ['local', 'microsd', 'shamir', 'timelock', 'challenge', 'duress', 'decoy']
    }
  };

  const isHighlighted = (nodeId) => {
    if (!selectedPreset) return true;
    return presets[selectedPreset].nodes.includes(nodeId);
  };

  const getNodeOpacity = (nodeId) => {
    if (!selectedPreset) return 1;
    return isHighlighted(nodeId) ? 1 : 0.2;
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <a href="#/docs" className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-500 transition-colors">
            <ChevronLeft size={16} />
            Back to Documentation
          </a>
        </div>
      </div>

      <div className="p-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-orange-500 text-2xl font-bold tracking-wider mb-2">
            SATSLEGACY VAULT ARCHITECTURE
          </h1>
          <p className="text-zinc-500 text-sm">
            Sovereign Bitcoin Inheritance Configuration
          </p>
        </div>

      {/* Preset Selector */}
      <div className="flex justify-center gap-3 mb-8 flex-wrap">
        <button
          onClick={() => setSelectedPreset(null)}
          className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all border border-orange-500 ${
            !selectedPreset
              ? 'bg-orange-500 text-black'
              : 'bg-transparent text-orange-500 hover:bg-orange-500/10'
          }`}
        >
          All Options
        </button>
        {Object.entries(presets).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => setSelectedPreset(selectedPreset === key ? null : key)}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all border border-orange-500 ${
              selectedPreset === key
                ? 'bg-orange-500 text-black'
                : 'bg-transparent text-orange-500 hover:bg-orange-500/10'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {selectedPreset && (
        <div className="text-center mb-6 p-3 bg-orange-500/10 rounded-lg">
          <span className="text-orange-500 font-semibold">
            {presets[selectedPreset].name}
          </span>
          <span className="text-zinc-500 ml-3">
            {presets[selectedPreset].desc}
          </span>
        </div>
      )}

      {/* Main Mind Map */}
      <div className="flex flex-col gap-12 max-w-5xl mx-auto">

        {/* Central Node */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-10 py-5 rounded-2xl shadow-lg shadow-orange-500/40 text-center">
            <div className="text-black font-extrabold text-xl">VAULT</div>
            <div className="text-black/70 text-xs mt-1">Configuration Center</div>
          </div>
        </div>

        {/* Branch connector */}
        <div className="flex justify-center">
          <div className="w-0.5 h-10 border-l-2 border-dashed border-orange-500"></div>
        </div>

        {/* Layer 1: Infrastructure */}
        <div style={{ opacity: getNodeOpacity('infrastructure'), transition: 'opacity 0.3s' }}>
          <div className="text-center mb-5 text-teal-400 text-xs font-bold tracking-widest">
            INFRASTRUCTURE LAYER
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            {[
              { id: 'local', name: 'LOCAL', desc: 'Always on', icon: '💾', required: true },
              { id: 'microsd', name: 'MICROSD/STEEL', desc: 'Physical backup', icon: '📀' },
              { id: 'shamir', name: 'SHAMIR SPLITS', desc: 'Distributed shards', icon: '🔀' },
              { id: 'nostr', name: 'NOSTR RELAYS', desc: 'Decentralized sync', icon: '📡' },
              { id: 'ipfs', name: 'IPFS PINNING', desc: 'Content addressed', icon: '🌐' },
              { id: 'multisig-config', name: 'MULTISIG CONFIG', desc: 'Key coordination', icon: '🔐' }
            ].map(node => (
              <div
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`relative rounded-xl p-4 min-w-[130px] text-center cursor-pointer transition-all border-2 ${
                  hoveredNode === node.id ? 'bg-teal-400/20' : 'bg-teal-400/5'
                } ${node.required ? 'border-teal-400' : 'border-teal-400/40'}`}
                style={{ opacity: getNodeOpacity(node.id) }}
              >
                <div className="text-2xl mb-2">{node.icon}</div>
                <div className="text-teal-400 font-bold text-xs">{node.name}</div>
                <div className="text-zinc-500 text-[10px] mt-1">{node.desc}</div>
                {node.required && (
                  <div className="absolute -top-2 -right-2 bg-teal-400 text-black text-[8px] px-1.5 py-0.5 rounded font-bold">
                    ALWAYS
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center">
          <div className="w-0.5 h-8 border-l border-dashed border-zinc-600"></div>
        </div>

        {/* Layer 2: Primary Logic */}
        <div>
          <div className="text-center mb-5 text-red-400 text-xs font-bold tracking-widest">
            PRIMARY INHERITANCE LOGIC
          </div>
          <div className="flex justify-center gap-6 flex-wrap">
            {[
              { id: 'timelock', name: 'TIMELOCK', desc: 'No deps, immutable', icon: '⏰', requires: null },
              { id: 'deadman', name: "DEAD MAN'S SWITCH", desc: 'Requires Nostr', icon: '💀', requires: ['nostr'] },
              { id: 'multisig-decay', name: 'MULTISIG DECAY', desc: 'Requires Multisig Config', icon: '🔑', requires: ['multisig-config'] }
            ].map(node => (
              <div
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`rounded-xl p-5 min-w-[160px] text-center cursor-pointer transition-all border-2 border-red-400/60 ${
                  hoveredNode === node.id ? 'bg-red-400/20' : 'bg-red-400/5'
                }`}
                style={{ opacity: getNodeOpacity(node.id) }}
              >
                <div className="text-3xl mb-2.5">{node.icon}</div>
                <div className="text-red-400 font-bold text-sm">{node.name}</div>
                <div className="text-zinc-500 text-[10px] mt-1.5">{node.desc}</div>
                {node.requires && (
                  <div className="mt-2 bg-red-400/20 px-2 py-1 rounded text-[9px] text-red-400">
                    → {node.requires.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center">
          <div className="w-0.5 h-8 border-l border-dashed border-zinc-600"></div>
        </div>

        {/* Layer 3: Security Gates */}
        <div>
          <div className="text-center mb-5 text-purple-400 text-xs font-bold tracking-widest">
            ADDITIONAL SECURITY GATES
          </div>
          <div className="flex justify-center gap-6 flex-wrap">
            {[
              { id: 'challenge', name: 'CHALLENGE', desc: 'Passphrase gate', icon: '🔒' },
              { id: 'oracle', name: 'ORACLE', desc: 'Requires Nostr/IPFS', icon: '🔮' },
              { id: 'duress', name: 'DURESS', desc: 'Coercion protection', icon: '🚨' }
            ].map(node => (
              <div
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`rounded-xl p-4 min-w-[140px] text-center cursor-pointer transition-all border-2 border-purple-400/60 ${
                  hoveredNode === node.id ? 'bg-purple-400/20' : 'bg-purple-400/5'
                }`}
                style={{ opacity: getNodeOpacity(node.id) }}
              >
                <div className="text-2xl mb-2">{node.icon}</div>
                <div className="text-purple-400 font-bold text-xs">{node.name}</div>
                <div className="text-zinc-500 text-[10px] mt-1">{node.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center">
          <div className="w-0.5 h-8 border-l border-dashed border-zinc-600"></div>
        </div>

        {/* Layer 4: Modifiers */}
        <div>
          <div className="text-center mb-5 text-green-400 text-xs font-bold tracking-widest">
            MODIFIERS
          </div>
          <div className="flex justify-center gap-6 flex-wrap">
            {[
              { id: 'staggered', name: 'STAGGERED RELEASE', desc: '25%→25%→50% over time', icon: '📊' },
              { id: 'multi-beneficiary', name: 'MULTI BENEFICIARY', desc: 'Split among heirs', icon: '👥' },
              { id: 'decoy', name: 'DECOY VAULT', desc: 'Incompatible w/ Multisig', icon: '🎭' }
            ].map(node => (
              <div
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`rounded-xl p-4 min-w-[140px] text-center cursor-pointer transition-all border-2 border-green-400/60 ${
                  hoveredNode === node.id ? 'bg-green-400/20' : 'bg-green-400/5'
                }`}
                style={{ opacity: getNodeOpacity(node.id) }}
              >
                <div className="text-2xl mb-2">{node.icon}</div>
                <div className="text-green-400 font-bold text-xs">{node.name}</div>
                <div className="text-zinc-500 text-[10px] mt-1">{node.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-10 p-6 bg-white/[0.02] rounded-xl border border-white/10">
          <div className="text-white font-bold mb-4 text-sm">DEPENDENCY RULES</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-orange-500 font-semibold text-xs mb-2">REQUIRES (must have)</div>
              <div className="text-zinc-500 text-xs leading-relaxed">
                Dead Man's Switch → Nostr<br/>
                Multisig Decay → Multisig Config<br/>
                Oracle → Nostr OR IPFS
              </div>
            </div>
            <div>
              <div className="text-red-400 font-semibold text-xs mb-2">CONFLICTS (cannot combine)</div>
              <div className="text-zinc-500 text-xs leading-relaxed">
                Shamir ✕ Multisig Config<br/>
                Decoy ✕ Multisig Config<br/>
                Oracle ✕ Timelock<br/>
                Multisig Decay ✕ Timelock
              </div>
            </div>
            <div>
              <div className="text-teal-400 font-semibold text-xs mb-2">REDUNDANT (pick one)</div>
              <div className="text-zinc-500 text-xs leading-relaxed">
                Nostr ~ IPFS<br/>
                Timelock ~ Dead Man's Switch<br/>
                Timelock ~ Multisig Decay
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default VaultArchitectureMindMap;
