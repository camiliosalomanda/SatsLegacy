import React, { useState } from 'react';
import { FileText, BookOpen, Users, Shield } from 'lucide-react';
import { generateSingleDoc, generateLegalDocuments } from '../utils/legal-templates';

export function LegalView() {
  const [selectedState, setSelectedState] = useState('Texas');
  const states = ['Texas', 'California', 'New York', 'Florida', 'Wyoming', 'Other'];

  const documents = [
    { title: 'Bitcoin-Specific Will Addendum', desc: 'Legal addendum recognizing your Bitcoin inheritance plan', icon: FileText },
    { title: 'Letter of Instruction', desc: 'Detailed guide for heirs on accessing the vault', icon: BookOpen },
    { title: 'Memorandum of Understanding', desc: 'Multi-heir agreement on vault terms', icon: Users },
    { title: 'Digital Asset Declaration', desc: 'Formal declaration of digital asset holdings', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Legal Documents</h2>
        <p className="text-zinc-500">Generate state-compliant inheritance documents</p>
      </div>

      <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Select Your State</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {states.map(state => (
            <button
              key={state}
              onClick={() => setSelectedState(state)}
              className={`py-2 px-4 rounded-lg text-sm transition-colors ${
                selectedState === state
                  ? 'bg-orange-500 text-black font-medium'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc, i) => (
          <div
            key={i}
            onClick={() => generateSingleDoc(doc.title, selectedState)}
            className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-orange-500/10 transition-colors">
                <doc.icon size={24} className="text-zinc-500 group-hover:text-orange-400 transition-colors" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium group-hover:text-orange-400 transition-colors">{doc.title}</h4>
                <p className="text-sm text-zinc-500 mt-1">{doc.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => generateLegalDocuments(selectedState)}
        className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        <FileText size={20} />
        Generate All Documents for {selectedState}
      </button>
    </div>
  );
}
