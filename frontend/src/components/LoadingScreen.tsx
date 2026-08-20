import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#faf8ff] flex flex-col items-center justify-center z-50">
      <div className="relative flex flex-col items-center space-y-6">
        {/* Glow Effects */}
        <div className="absolute w-64 h-64 bg-purple-200/40 rounded-full blur-3xl -z-10 animate-pulse" />
        
        {/* Logo Icon */}
        <div className="relative w-16 h-16 bg-white rounded-2xl border border-purple-200 flex items-center justify-center shadow-lg animate-bounce-slow">
          <span className="text-2xl font-black text-purple-700">P</span>
        </div>

        {/* Loading details */}
        <div className="text-center space-y-2">
          <h3 className="font-headline text-lg font-bold text-slate-900 tracking-tight">Syncing Sovereign Protocol</h3>
          <p className="text-xs text-slate-500 font-mono">Connecting to Filebase IPFS Database...</p>
        </div>

        {/* Spinner */}
        <Loader2 className="w-6 h-6 text-purple-700 animate-spin" />
      </div>
    </div>
  );
};
