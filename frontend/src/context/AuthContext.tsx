import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './Web3Context';
import { apiClient, onAuthEvent } from '../utils/apiClient';
import { toast } from '../utils/toast';
import { CHAIN_ID } from '../config/contracts';

export type AuthState = 'disconnected' | 'connected-unsigned' | 'signing' | 'authenticated' | 'expired';

export interface AuthSession {
  wallet: string | null;
  isAdmin: boolean;
  isJudge: boolean;
  expiresAt: number | null;
}

interface AuthContextType {
  authState: AuthState;
  session: AuthSession;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isSigning: boolean;
  isAdmin: boolean;
  isJudge: boolean;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  promptSignIn: () => void;
}

const defaultSession: AuthSession = {
  wallet: null,
  isAdmin: false,
  isJudge: false,
  expiresAt: null,
};

const getInitialAuthState = (): { authState: AuthState; session: AuthSession } => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('polylance_auth_token');
    const wallet = localStorage.getItem('polylance_auth_wallet');
    if (token && wallet && ethers.isAddress(wallet)) {
      return {
        authState: 'authenticated',
        session: {
          wallet: ethers.getAddress(wallet).toLowerCase(),
          isAdmin: false,
          isJudge: false,
          expiresAt: null,
        },
      };
    }
  }
  return { authState: 'disconnected', session: defaultSession };
};

const AuthContext = createContext<AuthContextType>({
  authState: 'disconnected',
  session: defaultSession,
  isAuthenticated: false,
  isAuthLoading: true,
  isSigning: false,
  isAdmin: false,
  isJudge: false,
  signIn: async () => false,
  signOut: async () => {},
  checkSession: async () => false,
  promptSignIn: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isConnected, getSigner, targetChainId, isWrongNetwork, switchToTargetNetwork } = useWeb3();
  
  const initial = useRef(getInitialAuthState());
  const [authState, setAuthState] = useState<AuthState>(initial.current.authState);
  const [session, setSession] = useState<AuthSession>(initial.current.session);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const isCheckingSessionRef = useRef(false);
  const prevAddressRef = useRef<string | null>(null);
  const promptShownRef = useRef(false);
  const hasAutoPromptedRef = useRef<string | null>(null);

  const checkSession = useCallback(async (): Promise<boolean> => {
    if (isCheckingSessionRef.current) return false;
    isCheckingSessionRef.current = true;
    try {
      const res = await apiClient.get('/api/auth/me', { skipAuthRedirect: true });
      if (res && res.authenticated && res.wallet && ethers.isAddress(res.wallet)) {
        const serverWallet = ethers.getAddress(res.wallet).toLowerCase();
        const currentAddr = (address && ethers.isAddress(address)) ? ethers.getAddress(address).toLowerCase() : '';

        // If a wallet is connected, verify it matches the session wallet
        if (currentAddr && serverWallet !== currentAddr) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('polylance_auth_token');
            localStorage.removeItem('polylance_auth_wallet');
          }
          setSession(defaultSession);
          setAuthState('connected-unsigned');
          return false;
        }

        // Verify session expiration
        if (res.expiresAt && Date.now() >= res.expiresAt) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('polylance_auth_token');
            localStorage.removeItem('polylance_auth_wallet');
          }
          setSession(defaultSession);
          setAuthState('expired');
          return false;
        }

        setSession({
          wallet: serverWallet,
          isAdmin: Boolean(res.isAdmin),
          isJudge: Boolean(res.isJudge),
          expiresAt: res.expiresAt || null,
        });
        setAuthState('authenticated');
        return true;
      } else {
        // If server says unauthenticated, clear local token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('polylance_auth_token');
          localStorage.removeItem('polylance_auth_wallet');
        }
        setSession(defaultSession);
        setAuthState(isConnected && address ? 'connected-unsigned' : 'disconnected');
        return false;
      }
    } catch {
      // If network fails but local token exists, preserve session unless explicitly 401
      if (typeof window !== 'undefined' && !localStorage.getItem('polylance_auth_token')) {
        setSession(defaultSession);
        setAuthState(isConnected && address ? 'connected-unsigned' : 'disconnected');
      }
      return false;
    } finally {
      isCheckingSessionRef.current = false;
      setIsAuthLoading(false);
    }
  }, [address, isConnected]);

  // Initial session restoration on mount and on wallet connection change
  useEffect(() => {
    const currentAddr = (address && ethers.isAddress(address)) ? ethers.getAddress(address).toLowerCase() : null;
    const prevAddr = prevAddressRef.current;

    if (!isConnected || !currentAddr) {
      prevAddressRef.current = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('polylance_auth_token');
        localStorage.removeItem('polylance_auth_wallet');
      }
      setSession(defaultSession);
      setAuthState('disconnected');
      setIsAuthLoading(false);
      return;
    }

    // Wallet switched
    if (prevAddr && prevAddr !== currentAddr) {
      prevAddressRef.current = currentAddr;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('polylance_auth_token');
        localStorage.removeItem('polylance_auth_wallet');
      }
      apiClient.post('/api/auth/logout').catch(() => {});
      setSession(defaultSession);
      setAuthState('connected-unsigned');
      promptShownRef.current = false;
      setIsAuthLoading(false);
      return;
    }

    prevAddressRef.current = currentAddr;
    checkSession();
  }, [address, isConnected, checkSession]);

  // Listen to 401 events from apiClient
  useEffect(() => {
    return onAuthEvent((evt) => {
      if (evt.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('polylance_auth_token');
          localStorage.removeItem('polylance_auth_wallet');
        }
        setAuthState((curr) => {
          if (curr === 'authenticated') {
            if (!promptShownRef.current) {
              promptShownRef.current = true;
              toast.info('Session Expired', 'Please sign in with your Polygon wallet to continue.');
            }
            return 'expired';
          }
          return curr === 'signing' ? curr : (address ? 'connected-unsigned' : 'disconnected');
        });
        setSession(defaultSession);
      }
    });
  }, [address]);

  const signIn = useCallback(async (): Promise<boolean> => {
    if (!address || !ethers.isAddress(address)) {
      toast.error('Polygon Wallet Required', 'Please connect a valid Polygon (EVM) wallet.');
      return false;
    }

    // 1. Ensure user is on Polygon before requesting signature
    if (isWrongNetwork) {
      try {
        toast.info('Network Switch', 'Please switch your wallet to Polygon to continue.');
        await switchToTargetNetwork();
      } catch {
        toast.error('Network Switch Failed', 'Please connect your wallet to Polygon to sign in.');
        return false;
      }
    }

    setAuthState('signing');
    try {
      // 2. Request single-use 5-minute cryptographic nonce for Polygon chain
      const checksumAddr = ethers.getAddress(address);
      const normAddr = checksumAddr.toLowerCase();
      const effectiveChainId = targetChainId || CHAIN_ID;
      const nonceRes = await apiClient.get(
        `/api/auth/nonce?wallet=${encodeURIComponent(normAddr)}&chainId=${effectiveChainId}`
      );

      if (!nonceRes || !nonceRes.message) {
        throw new Error(nonceRes?.error || 'Failed to obtain SIWE challenge from server.');
      }

      // 3. Request exactly ONE cryptographic signature from user wallet
      const signer = await getSigner();
      if (!signer) {
        throw new Error('Wallet signer unavailable. Please check your browser wallet.');
      }

      const signature = await signer.signMessage(nonceRes.message);

      // 4. Cryptographically verify signature on server
      const verifyRes = await apiClient.post('/api/auth/verify', {
        wallet: normAddr,
        signature,
        message: nonceRes.message,
      });

      if (!verifyRes || !verifyRes.success) {
        throw new Error(verifyRes?.error || 'Signature verification failed.');
      }

      // Persist auth token to localStorage
      if (verifyRes.token && typeof window !== 'undefined') {
        localStorage.setItem('polylance_auth_token', verifyRes.token);
        localStorage.setItem('polylance_auth_wallet', normAddr);
      }

      const newSession: AuthSession = {
        wallet: normAddr,
        isAdmin: Boolean(verifyRes.isAdmin),
        isJudge: Boolean(verifyRes.isJudge),
        expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      };

      setSession(newSession);
      setAuthState('authenticated');
      promptShownRef.current = false;
      toast.success('Signed In', 'Signed in successfully on Polygon.');

      // Dispatch event to trigger initial sync once
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('polylance:authenticated', { detail: { wallet: normAddr } }));
      }

      return true;
    } catch (err: any) {
      const isRejected =
        err?.code === 4001 ||
        err?.code === 'ACTION_REJECTED' ||
        err?.message?.includes('user rejected') ||
        err?.message?.includes('User rejected');

      if (isRejected) {
        toast.info('Sign-in Cancelled', 'Wallet signature was declined. You can sign in anytime from this banner.');
      } else {
        toast.error('Sign-in Error', err?.message || 'Authentication could not be completed.');
      }
      setAuthState(address ? 'connected-unsigned' : 'disconnected');
      return false;
    }
  }, [address, isWrongNetwork, switchToTargetNetwork, getSigner, targetChainId]);

  // Auto-prompt at most once per connected wallet
  useEffect(() => {
    if (!isAuthLoading && isConnected && address && ethers.isAddress(address) && !isWrongNetwork && authState === 'connected-unsigned') {
      const currentAddr = ethers.getAddress(address).toLowerCase();
      const dismissed = typeof window !== 'undefined' ? sessionStorage.getItem('polylance_auth_banner_dismissed') === 'true' : false;
      if (hasAutoPromptedRef.current !== currentAddr && !dismissed) {
        hasAutoPromptedRef.current = currentAddr;
        signIn().catch(() => {});
      }
    }
  }, [isAuthLoading, isConnected, address, isWrongNetwork, authState, signIn]);

  const signOut = useCallback(async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('polylance_auth_token');
      localStorage.removeItem('polylance_auth_wallet');
    }
    setSession(defaultSession);
    setAuthState(isConnected && address ? 'connected-unsigned' : 'disconnected');
    promptShownRef.current = false;
    toast.info('Signed Out', 'Your session has ended.');
  }, [address, isConnected]);

  const promptSignIn = useCallback(() => {
    if (authState === 'connected-unsigned' || authState === 'expired') {
      signIn();
    }
  }, [authState, signIn]);

  return (
    <AuthContext.Provider
      value={{
        authState,
        session,
        isAuthenticated: authState === 'authenticated',
        isAuthLoading,
        isSigning: authState === 'signing',
        isAdmin: session.isAdmin,
        isJudge: session.isJudge,
        signIn,
        signOut,
        checkSession,
        promptSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
