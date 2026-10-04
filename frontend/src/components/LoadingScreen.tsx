import React from 'react';
import { Loader2 } from 'lucide-react';
import { PolyLanceLogo } from './PolyLanceLogo';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#F8FAFC] flex flex-col items-center justify-center z-50">
      <div className="relative flex flex-col items-center space-y-6">
        {/* Logo Icon */}
        <div className="relative w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-xs">
          <PolyLanceLogo size={36} />
        </div>

        {/* Loading details */}
        <div className="text-center space-y-2">
          <h3 className="font-headline text-lg font-bold text-slate-900 tracking-tight">Syncing Sovereign Protocol</h3>
          <p className="text-xs text-slate-500 font-mono">Connecting to Filebase IPFS Database...</p>
        </div>

        {/* Spinner */}
        <Loader2 className="w-6 h-6 text-[#0047AB] animate-spin" />
      </div>
    </div>
  );
};
