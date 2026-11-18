/**
 * PolyLance Blog Studio — Security Route Guard
 *
 * Implements a strict three-state guard:
 * 1. Loading: Session restoring or role check in-flight -> renders zero-CLS Skeleton.
 *    Never flashes NotFound or unauthorized state while loading.
 * 2. Unauthenticated (401 or signed out / unsigned):
 *    Renders neutral "Authentication Required" card with wallet Sign-In button.
 *    CRITICAL: Does NOT mention Blog Studio or disclose the route's purpose.
 * 3. Denied (403 or non-team role):
 *    Renders the app's standard NotFound (404) page so unauthorized users cannot detect the studio exists.
 * 4. Error (5xx / network):
 *    Renders an error fallback with Retry button.
 * 5. Allowed (admin, blog_editor, blog_author):
 *    Renders the Studio outlet.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useBlogRole } from '../hooks/useBlogRole';
import { useAuth } from '../../../context/AuthContext';
import { useWeb3 } from '../../../context/Web3Context';
import NotFound from '../../../pages/NotFound';
import { Skeleton } from '../../../components/common/Skeleton';
import { ShieldCheck, LogIn, Loader2, RefreshCw } from 'lucide-react';

export const BlogStudioGuard: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { loading, role, active, hasAccess, status, error, refetch } = useBlogRole();
  const { authState, signIn, isSigning, isAuthenticated, isAuthLoading } = useAuth();
  const { isConnected, connectWallet } = useWeb3();

  // 1. Loading State: Session restoring or role check in flight.
  // Must NEVER flash NotFound during this phase.
  if (loading || isAuthLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8 animate-in fade-in duration-200" data-testid="studio-loading-skeleton">
        <div className="flex items-center justify-between pb-6 border-b border-[#E5E7EB]">
          <div className="space-y-2">
            <Skeleton width={180} height={28} rounded="md" />
            <Skeleton width={260} height={16} rounded="sm" />
          </div>
          <div className="flex gap-3">
            <Skeleton width={100} height={36} rounded="md" />
            <Skeleton width={120} height={36} rounded="md" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-[12px] border border-[#E5E7EB] bg-white space-y-3">
            <Skeleton width={80} height={14} />
            <Skeleton width={140} height={24} />
          </div>
          <div className="p-5 rounded-[12px] border border-[#E5E7EB] bg-white space-y-3">
            <Skeleton width={80} height={14} />
            <Skeleton width={140} height={24} />
          </div>
          <div className="p-5 rounded-[12px] border border-[#E5E7EB] bg-white space-y-3">
            <Skeleton width={80} height={14} />
            <Skeleton width={140} height={24} />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton height={60} rounded="lg" />
          <Skeleton height={60} rounded="lg" />
          <Skeleton height={60} rounded="lg" />
        </div>
      </div>
    );
  }

  // 2. Needs Authentication: Not connected or connected without a valid server session (401)
  // Security rule: Message must NOT disclose Blog Studio or internal authoring details.
  const needsAuth =
    !isConnected ||
    !isAuthenticated ||
    status === 401 ||
    authState === 'connected-unsigned' ||
    authState === 'expired' ||
    authState === 'disconnected';

  if (needsAuth) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12" data-testid="studio-auth-required">
        <div className="max-w-md w-full bg-white border border-[#E5E7EB] rounded-[20px] p-8 shadow-sm text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0047AB]/10 text-[#0047AB] flex items-center justify-center border border-[#0047AB]/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#0B0B0F]">Sign in with your wallet to continue</h2>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Verify your session on the Polygon network with a secure cryptographic signature to proceed.
            </p>
          </div>

          <div className="pt-2">
            {!isConnected ? (
              <button
                type="button"
                onClick={() => connectWallet()}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0047AB] hover:bg-[#00388A] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <span>Connect Wallet</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signIn()}
                disabled={isSigning}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0047AB] hover:bg-[#00388A] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Session...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In with Wallet</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Network or 5xx Server Error State
  if (status && status >= 500 && error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12" data-testid="studio-server-error">
        <div className="max-w-md w-full bg-white border border-[#E5E7EB] rounded-[20px] p-8 shadow-sm text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-[#0B0B0F]">Connection Interrupted</h2>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Unable to reach verification service. Please check your network and retry.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B0B0F] hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Signed in but NOT an authorized active team member (403, or no role, or active === false)
  // Render the generic 404 page so no internal existence leaks.
  if (!hasAccess || !role || !active || status === 403) {
    return <NotFound />;
  }

  // 5. Allowed: active team member (admin, blog_editor, blog_author)
  return children ? <>{children}</> : <Outlet />;
};

export default BlogStudioGuard;
