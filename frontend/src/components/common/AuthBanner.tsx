import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWeb3 } from '../../context/Web3Context';
import { ShieldCheck, LogIn, Loader2, X } from 'lucide-react';

export const AuthBanner: React.FC = () => {
  const { authState, signIn, isSigning, isAuthenticated, isAuthLoading } = useAuth();
  const { isConnected, address, isWrongNetwork } = useWeb3();

  // Initialize dismissed state from sessionStorage to persist across page navigations in current session
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('polylance_auth_banner_dismissed') === 'true';
    }
    return false;
  });

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('polylance_auth_banner_dismissed', 'true');
    }
  };

  // 1. Hide immediately if loading auth check, not connected, no address, wrong network, already authenticated, or dismissed
  if (isAuthLoading || !isConnected || !address || isWrongNetwork || isAuthenticated || dismissed) {
    return null;
  }

  const isExpired = authState === 'expired';

  return (
    <div
      role="status"
      aria-live="polite"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 transition-all w-full"
    >
      <div className="bg-[#0A1120] text-white border border-[#1E293B] rounded-xl shadow-md px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-950/60 text-blue-400 p-2 rounded-lg shrink-0 border border-blue-900/40">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-white flex items-center gap-2">
              <span>{isExpired ? 'Session expired on Polygon' : 'Wallet connected on Polygon'}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1E3A8A] text-blue-200 border border-blue-700/50">
                Polygon
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isExpired
                ? 'Your session has expired. Sign one message to restore secure notifications and syncing.'
                : 'Sign one message to enable secure notifications and sync your data.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={() => signIn()}
            disabled={isSigning}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0047AB] hover:bg-[#00388A] text-white text-xs font-medium shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSigning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Signing...</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In with Wallet</span>
              </>
            )}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Dismiss notice for this session"
            aria-label="Dismiss notice for this session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthBanner;
