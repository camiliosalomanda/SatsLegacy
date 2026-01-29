import React from 'react';
import { Loader } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <Loader className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
        <p className="text-zinc-400">Loading SatsLegacy...</p>
      </div>
    </div>
  );
}
