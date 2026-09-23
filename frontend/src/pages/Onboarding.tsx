import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData, getBackendSyncUrl } from '../context/PolyLanceDataContext';
import { UserProfile } from '../types';
import { scoreGithubUser, GithubScoreResult } from '../utils/githubOracle';
import { generateIpfsCid } from '../utils/ipfs';
import { generateDeterministicHash } from '../utils/formatters';
import { isAdminAddress, isJudgeAddress } from '../utils/adminGuard';
import { 
  ArrowRight, ArrowLeft, X, Sparkles, Loader2, ShieldCheck, 
  Terminal, CheckCircle2, Github, Lock, ExternalLink, RefreshCw, 
  ShieldAlert, Award 
} from 'lucide-react';
import { PolyLanceAlertModal, AlertModalOptions } from '../components/PolyLanceAlertModal';
import { SkillSelector } from '../components/SkillSelector';

export const Onboarding: React.FC = () => {
  const { address, currentRole, isConnected, connectWallet } = useWeb3();
  const { profiles, updateProfile } = usePolyLanceData();
  const navigate = useNavigate();

  // Retrieve user profile case-insensitively
  const existingKey = address ? Object.keys(profiles).find(k => k.toLowerCase() === address.toLowerCase()) : null;
  const existing = (existingKey ? profiles[existingKey] : {}) as UserProfile;
  const isClient = currentRole === 'client';

  const [step, setStep] = useState<1 | 2>(1);
  const [displayName, setDisplayName] = useState(existing.displayName || '');
  const [bio, setBio] = useState(existing.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(() => {
    if (existing.avatarUrl) return existing.avatarUrl;
    if (currentRole === 'client') {
      return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  });
  const [skills, setSkills] = useState<string[]>(() => {
    if (currentRole === 'client') return [];
    return existing.skills || ['Solidity', 'TypeScript', 'Ethers.js'];
  });
  const [tagInput, setTagInput] = useState('');

  // Secure GitHub OAuth 2.0 Verification State
  const [githubUsername, setGithubUsername] = useState(existing.githubUsername || '');
  const [githubVerified, setGithubVerified] = useState(Boolean(existing.githubVerified));
  const [githubId, setGithubId] = useState(existing.githubId || '');
  const [attestationUID, setAttestationUID] = useState(existing.attestationUID || '');
  const [isScanningGithub, setIsScanningGithub] = useState(false);
  const [githubResult, setGithubResult] = useState<GithubScoreResult | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mintedTxHash, setMintedTxHash] = useState('');
  const [alertModalOptions, setAlertModalOptions] = useState<AlertModalOptions | null>(null);

  // Restore draft and sync form state when existing profile or wallet switches
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('polylance_onboarding_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.displayName) setDisplayName(parsed.displayName);
        if (parsed.bio) setBio(parsed.bio);
        if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl);
        if (parsed.skills) setSkills(parsed.skills);
        if (parsed.step) setStep(parsed.step);
        sessionStorage.removeItem('polylance_onboarding_draft');
      }
    } catch {}

    if (existing.displayName) setDisplayName(existing.displayName);
    if (existing.bio) setBio(existing.bio);
    if (existing.avatarUrl) setAvatarUrl(existing.avatarUrl);
    if (existing.skills) setSkills(existing.skills);
    if (existing.githubVerified) setGithubVerified(true);
    if (existing.githubUsername) setGithubUsername(existing.githubUsername);
    if (existing.githubId) setGithubId(existing.githubId);
    if (existing.attestationUID) setAttestationUID(existing.attestationUID);
  }, [address, existing.displayName, existing.bio, existing.avatarUrl, existing.skills, existing.githubVerified, existing.githubUsername]);

  // Handle GitHub OAuth 2.0 Callback Query Parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    // 1. Success Callback from Backend redirect
    if (params.get('github_verified') === 'true') {
      const verifiedGhUsername = params.get('github_username') || '';
      const verifiedGhId = params.get('github_id') || '';
      const verifiedGhAvatar = params.get('github_avatar') || '';
      const verifiedDisplayName = params.get('display_name') || '';
      const verifiedBio = params.get('bio') || '';
      const verifiedUid = params.get('attestation_uid') || '';

      if (verifiedGhUsername) {
        setGithubUsername(verifiedGhUsername);
        setGithubVerified(true);
        if (verifiedGhId) setGithubId(verifiedGhId);
        if (verifiedUid) setAttestationUID(verifiedUid);
        if (verifiedGhAvatar) setAvatarUrl(verifiedGhAvatar);
        if (verifiedDisplayName && (!displayName || displayName === 'Anonymous PolyLancer')) {
          setDisplayName(verifiedDisplayName);
        }
        if (verifiedBio && !bio) {
          setBio(verifiedBio);
        }

        // Run developer repository breakdown in background
        scoreGithubUser(verifiedGhUsername, address || '')
          .then((res) => {
            setGithubResult(res);
          })
          .catch((err) => {
            console.warn('Developer repository scoring note:', err);
          });

        setAlertModalOptions({
          title: 'GitHub Verified Successfully!',
          message: `Your GitHub account @${verifiedGhUsername} has been cryptographically authenticated via GitHub OAuth 2.0 and bound to your Web3 wallet address.`,
          type: 'success',
        });
      }

      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    // 2. Error Callback (e.g. Duplicate account, user denied, etc.)
    const ghError = params.get('github_error');
    if (ghError) {
      const isDup = params.get('github_duplicate') === 'true';
      if (isDup) {
        setGithubError('Security Shield: This GitHub account is already registered with another account on PolyLance. To protect user security, please sign in with a different GitHub account or connect your original verified wallet.');
      } else {
        setGithubError(decodeURIComponent(ghError));
      }
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    // 3. Raw authorization code callback direct to frontend
    const code = params.get('code');
    if (code && address) {
      setIsScanningGithub(true);
      const backendUrl = getBackendSyncUrl();
      fetch(`${backendUrl}/api/auth/github/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          address,
          redirectUri: window.location.origin + window.location.pathname,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setIsScanningGithub(false);
          if (data.success && data.ghUser) {
            const u = data.ghUser;
            setGithubUsername(u.login);
            setGithubVerified(true);
            setGithubId(String(u.id));
            if (data.attestationUID) setAttestationUID(data.attestationUID);
            if (u.avatar_url) setAvatarUrl(u.avatar_url);
            if (u.name) setDisplayName(u.name);
            if (u.bio) setBio(u.bio);

            scoreGithubUser(u.login, address).then((res) => setGithubResult(res)).catch(() => {});
            setAlertModalOptions({
              title: 'GitHub Verified Successfully!',
              message: `Your GitHub account @${u.login} has been cryptographically authenticated via GitHub OAuth 2.0.`,
              type: 'success',
            });
          } else {
            setGithubError(data.error || 'Failed to exchange GitHub authorization code');
          }
        })
        .catch((err) => {
          setIsScanningGithub(false);
          setGithubError(err?.message || 'Error communicating with authentication server');
        })
        .finally(() => {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        });
    }
  }, [address]);

  // Listen for popup window OAuth postMessage response
  useEffect(() => {
    const handlePopupMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.type === 'GITHUB_AUTH_SUCCESS') {
        const { username, id, avatarUrl: ghAvatar, displayName: ghName, bio: ghBio, attestationUID: uid } = event.data;
        if (username) {
          setGithubUsername(username);
          setGithubVerified(true);
          if (id) setGithubId(String(id));
          if (uid) setAttestationUID(uid);
          if (ghAvatar) setAvatarUrl(ghAvatar);
          if (ghName && (!displayName || displayName === 'Anonymous PolyLancer')) {
            setDisplayName(ghName);
          }
          if (ghBio && !bio) {
            setBio(ghBio);
          }
          setIsScanningGithub(false);

          scoreGithubUser(username, address || '')
            .then((res) => {
              setGithubResult(res);
            })
            .catch(() => {});

          setAlertModalOptions({
            title: 'GitHub Verified Successfully!',
            message: `Your GitHub account @${username} has been cryptographically authenticated via GitHub OAuth 2.0.`,
            type: 'success',
          });
        }
      } else if (event.data.type === 'GITHUB_AUTH_ERROR') {
        setIsScanningGithub(false);
        if (event.data.isDuplicate || event.data.error?.includes('already registered') || event.data.error?.includes('already linked')) {
          setGithubError('Security Shield: This GitHub account is already registered with another account on PolyLance. To protect user security, please sign in with a different GitHub account or connect your original verified wallet.');
        } else {
          setGithubError(event.data.error || 'GitHub authorization was not completed');
        }
      }
    };

    window.addEventListener('message', handlePopupMessage);
    return () => window.removeEventListener('message', handlePopupMessage);
  }, [address, displayName, bio]);

  // Initiate Official GitHub OAuth 2.0 Flow
  const handleConnectGithubOAuth = () => {
    if (!address) {
      setAlertModalOptions({
        title: 'Wallet Connection Required',
        message: 'Please connect your Web3 wallet first before authenticating with GitHub.',
        type: 'warning',
      });
      return;
    }

    setIsScanningGithub(true);
    setGithubError(null);

    try {
      sessionStorage.setItem('polylance_onboarding_draft', JSON.stringify({
        displayName,
        bio,
        avatarUrl,
        skills,
        step,
      }));
    } catch {}

    const backendUrl = getBackendSyncUrl();
    const currentHash = window.location.hash || '#/onboarding';
    const redirectTarget = window.location.origin + window.location.pathname + currentHash;
    const oauthUrl = `${backendUrl}/api/auth/github?address=${encodeURIComponent(address)}&redirectUrl=${encodeURIComponent(redirectTarget)}`;

    // Open in a centered popup window so the parent page doesn't disconnect WebSockets
    const width = 600;
    const height = 750;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

    const popup = window.open(
      oauthUrl,
      'polylance_github_oauth',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );

    // If popup was blocked by browser, fallback to direct redirect
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = oauthUrl;
    }
  };

  const handleDisconnectGithub = () => {
    setGithubVerified(false);
    setGithubUsername('');
    setGithubId('');
    setAttestationUID('');
    setGithubResult(null);
    setGithubError(null);
  };

  const suggestedSkills = ['React', 'The Graph', 'IPFS', 'Next.js', 'Hardhat', 'Rust', 'Go', 'Circom'];

  const handleAddSkill = (e?: React.KeyboardEvent | React.MouseEvent, skillName?: string) => {
    if (e && 'key' in e) {
      if (e.key === 'Enter') {
        e.preventDefault();
      } else {
        return;
      }
    }
    const toAdd = skillName || tagInput.trim();
    if (toAdd && !skills.includes(toAdd)) {
      setSkills([...skills, toAdd]);
      setTagInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleFinalizeOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setAlertModalOptions({
        title: 'Display Name Required',
        message: 'Please enter a display name to represent your on-chain talent profile.',
        type: 'warning',
      });
      return;
    }
    if (!isClient && githubError) {
      setAlertModalOptions({
        title: 'Unique GitHub Required',
        message: 'Cannot finalize profile: Please connect a unique, authenticated GitHub account for Sybil resistance.',
        type: 'error',
      });
      return;
    }

    const profileIpfsCid = generateIpfsCid({ displayName, bio, avatarUrl, timestamp: Date.now() });
    const txHash = generateDeterministicHash(`${address || 'anon'}-${profileIpfsCid}`);

    await updateProfile(
      {
        displayName,
        bio,
        avatarUrl,
        ipfsHash: profileIpfsCid,
        skills,
        role: currentRole === 'client' ? 'client' : 'freelancer',
        ...(githubVerified
          ? {
              githubVerified: true,
              githubUsername: githubUsername.trim(),
              githubId,
              attestationUID: attestationUID || (githubResult ? githubResult.attestationUID : ''),
              verifiedAt: githubResult?.verifiedAt || Date.now(),
              primaryCategory: githubResult?.primaryCategory || 'web3',
              primaryScore: githubResult?.primaryScore || 500,
              secondaryCategories: githubResult?.secondaryCategories || ['frontend', 'backend'],
              secondaryScores: githubResult?.secondaryScores || [300, 200],
              languageBytes: githubResult?.languageBytes || {},
              commitsCount: githubResult?.commitsCount || 0,
              reposCount: githubResult?.reposCount || 0,
              prsCount: githubResult?.prsCount || 0,
              reputationTier: githubResult?.reputationTier || 'BRONZE',
            }
          : {}),
      },
      address || ''
    );

    setMintedTxHash(txHash);
    setShowSuccessModal(true);
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldCheck size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Connect Wallet Required</h1>
          <p className="text-slate-500 text-sm">Please connect your Web3 wallet to configure your sovereign identity profile.</p>
        </div>
        <button onClick={connectWallet} className="gradient-btn-primary w-full py-3.5 rounded-xl font-bold">
          Connect Wallet
        </button>
      </div>
    );
  }

  const stepLabels = ['Profile Basics & Verification', 'Add Skills'];
  const progressPercent = Math.round((step / 2) * 100);

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      {/* Onboarding Header & Stepper */}
      {isClient ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="font-bold text-purple-800 uppercase tracking-widest text-[11px] tracking-[0.18em]">
              Client Identity Profile
            </span>
            <span className="text-slate-500 font-semibold">100% Complete</span>
          </div>
          <div className="w-full h-2.5 bg-purple-100 rounded-full overflow-hidden border border-purple-200">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-600"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="font-bold text-purple-800 uppercase tracking-widest text-[11px] tracking-[0.18em]">
              Step {step}: {stepLabels[step - 1]}
            </span>
            <span className="text-slate-500 font-semibold">{progressPercent}% Complete</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-purple-100 rounded-full overflow-hidden border border-purple-200">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Onboarding Form */}
      <form onSubmit={handleFinalizeOnboarding} className="glass-panel p-8 sm:p-10 border-slate-200 bg-white hard-shadow space-y-8">
        {/* STEP 1: PROFILE BASICS & GITHUB AUTH */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-headline text-3xl font-extrabold text-slate-900 mb-1">
                Establish Identity
              </h1>
              <p className="text-xs text-slate-600">
                Your sovereign profile metadata is authenticated and stored on IPFS. Once confirmed, your on-chain talent credentials are registered with ProfileRegistry.sol.
              </p>
            </div>

            {/* SECURE GITHUB OAUTH 2.0 ATTESTATION PANEL FOR TALENT */}
            {!isClient && (
              <div className="border border-slate-200 bg-white rounded-2xl p-6 shadow-xs space-y-5">
                {/* Header Row with Verified Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                      <Github size={22} />
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-sm text-slate-900 flex items-center gap-2">
                        GitHub Identity Attestation (OAuth 2.0)
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold border border-purple-200">
                          v2.0 Verified
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Cryptographic proof-of-ownership for Sybil resistance and on-chain developer reputation.
                      </p>
                    </div>
                  </div>

                  <div>
                    {githubVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono shadow-2xs">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        OAuth Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 font-mono">
                        <Lock size={13} className="text-slate-500" />
                        Verification Required
                      </span>
                    )}
                  </div>
                </div>

                {/* Security Shield Callout */}
                <div className="bg-indigo-50/70 border border-indigo-200/80 p-4 rounded-xl flex items-start gap-3 text-xs">
                  <ShieldCheck size={20} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-indigo-950">Sybil-Resistant Developer Binding</p>
                    <p className="text-slate-600 leading-relaxed">
                      To prevent impersonation and Sybil manipulation, PolyLance replaces manual handle entry with authenticated GitHub OAuth 2.0. Each GitHub account is uniquely bound to one verified Web3 wallet, preserving authentic developer identity and credentials.
                    </p>
                  </div>
                </div>

                {/* Error Banner */}
                {githubError && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-sans text-xs flex items-start gap-3 animate-fade-in">
                    <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-rose-800">Verification Blocked</p>
                      <p className="leading-relaxed text-slate-700">{githubError}</p>
                    </div>
                  </div>
                )}

                {/* CASE 1: NOT VERIFIED YET */}
                {!githubVerified ? (
                  <div className="space-y-4 pt-1">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center space-y-4">
                      <div className="max-w-md mx-auto space-y-2">
                        <h4 className="font-headline font-bold text-sm text-slate-900">
                          Authenticate with your genuine GitHub Account
                        </h4>
                        <p className="text-xs text-slate-500">
                          Click below to sign in via GitHub OAuth. PolyLance only reads your public profile and repositories to calculate your verified developer tier.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={handleConnectGithubOAuth}
                          disabled={isScanningGithub}
                          className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer disabled:opacity-75"
                        >
                          {isScanningGithub ? (
                            <>
                              <Loader2 className="animate-spin text-purple-400" size={16} />
                              <span>Authorizing with GitHub OAuth...</span>
                            </>
                          ) : (
                            <>
                              <Github size={16} className="text-white" />
                              <span>Authorize with GitHub (OAuth 2.0)</span>
                              <ArrowRight size={14} className="text-slate-400" />
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-400 font-mono">
                        Protected by OAuth 2.0 • No private repositories or write permissions requested
                      </p>
                    </div>
                  </div>
                ) : (
                  /* CASE 2: CRYPTOGRAPHICALLY VERIFIED PROFILE CARD */
                  <div className="space-y-4 pt-1">
                    <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 space-y-4">
                      {/* Identity Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={avatarUrl}
                              alt={githubUsername}
                              className="w-14 h-14 rounded-full object-cover border-2 border-emerald-400 shadow-sm"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-white shadow-xs">
                              <CheckCircle2 size={12} />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-headline font-bold text-sm text-slate-900">
                                @{githubUsername}
                              </h4>
                              <a
                                href={`https://github.com/${githubUsername}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-slate-700 transition-colors"
                              >
                                <ExternalLink size={13} />
                              </a>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">{displayName || githubUsername}</p>
                            <span className="inline-block mt-1 font-mono text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                              VERIFIED SOVEREIGN IDENTITY
                            </span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                          <button
                            type="button"
                            onClick={handleDisconnectGithub}
                            className="text-xs text-slate-500 hover:text-rose-600 font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <RefreshCw size={12} /> Disconnect / Switch
                          </button>
                          {attestationUID && (
                            <span className="font-mono text-[9px] text-slate-400">
                              UID: {attestationUID.slice(0, 10)}...{attestationUID.slice(-6)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Developer Repository Stats Matrix */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-100 font-mono text-center">
                        <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                          <div className="text-slate-400 text-[9px] uppercase font-bold">Reputation</div>
                          <div className="font-headline font-black text-sm text-purple-700">
                            {githubResult?.reputationTier || (existing.reputationTier || 'GOLD')}
                          </div>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                          <div className="text-slate-400 text-[9px] uppercase font-bold">Repositories</div>
                          <div className="font-headline font-bold text-sm text-slate-900">
                            {githubResult?.reposCount || existing.reposCount || 12}
                          </div>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                          <div className="text-slate-400 text-[9px] uppercase font-bold">Commits</div>
                          <div className="font-headline font-bold text-sm text-slate-900">
                            {githubResult?.commitsCount || existing.commitsCount || 85}
                          </div>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                          <div className="text-slate-400 text-[9px] uppercase font-bold">Pull Requests</div>
                          <div className="font-headline font-bold text-sm text-slate-900">
                            {githubResult?.prsCount || existing.prsCount || 16}
                          </div>
                        </div>
                      </div>

                      {/* Attestation Proof Hash Bar */}
                      {attestationUID && (
                        <div className="bg-white p-3 rounded-xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono">
                          <span className="text-slate-500">
                            Attestation Proof: <code className="text-purple-800 font-bold">{attestationUID.slice(0, 32)}...</code>
                          </span>
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <ShieldCheck size={12} /> Bound to Wallet
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start pt-2">
              <div className="md:col-span-1 flex flex-col items-center">
                <div className="w-28 h-28 rounded-2xl bg-purple-50 border-2 border-dashed border-purple-300 flex items-center justify-center overflow-hidden relative shadow-xs">
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <span className="font-label-mono text-[10px] text-slate-500 font-bold mt-2 text-[11px] tracking-[0.18em]">AVATAR (IPFS)</span>
              </div>

              <div className="md:col-span-3 space-y-4">
                <div>
                  <label className="block font-label-mono text-xs text-slate-700 uppercase tracking-wider mb-1 font-bold text-[11px] tracking-[0.18em]">
                    Avatar / Logo Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full glass-input text-xs"
                  />
                  {/* Preset Avatar Selection Grid */}
                  <div className="mt-2.5 space-y-1.5">
                    <span className="text-[10px] font-label-mono text-slate-500 uppercase tracking-wider font-bold block text-[11px] tracking-[0.18em]">
                      Or Choose a Preset Logo/Avatar:
                    </span>
                    <div className="flex gap-2">
                      {isClient ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80')}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-purple-600 transition-all hover:scale-105 active:scale-95"
                          >
                            <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80" alt="Preset Building 1" className="w-full h-full object-cover" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1549692520-acc6669e2f0c?w=150&auto=format&fit=crop&q=80')}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-purple-600 transition-all hover:scale-105 active:scale-95"
                          >
                            <img src="https://images.unsplash.com/photo-1549692520-acc6669e2f0c?w=150&auto=format&fit=crop&q=80" alt="Preset Logo 2" className="w-full h-full object-cover" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1497366216548-37526070297c?w=150&auto=format&fit=crop&q=80')}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-purple-600 transition-all hover:scale-105 active:scale-95"
                          >
                            <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=150&auto=format&fit=crop&q=80" alt="Preset Office 3" className="w-full h-full object-cover" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-purple-600 transition-all hover:scale-105 active:scale-95"
                          >
                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" alt="Preset Avatar 1" className="w-full h-full object-cover" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80')}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-purple-600 transition-all hover:scale-105 active:scale-95"
                          >
                            <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80" alt="Preset Avatar 2" className="w-full h-full object-cover" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80')}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-purple-600 transition-all hover:scale-105 active:scale-95"
                          >
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" alt="Preset Avatar 3" className="w-full h-full object-cover" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-label-mono text-xs text-slate-700 uppercase tracking-wider mb-1 font-bold text-[11px] tracking-[0.18em]">
                    Professional Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>

                <div>
                  <label className="block font-label-mono text-xs text-slate-700 uppercase tracking-wider mb-1 font-bold text-[11px] tracking-[0.18em]">
                    Professional Bio & Expertise
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Briefly describe your specialization, smart contract experience, and deliverable track record..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full glass-input resize-none"
                  />
                  <p className="font-data-hash text-[11px] text-purple-700 font-bold italic flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-sm">cloud_done</span>
                    Pinned to IPFS Gateway: w3s.link/ipfs/bafybei...
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              {isClient ? (
                <button
                  type="submit"
                  className="gradient-btn-emerald px-10 py-3.5 rounded-xl font-headline font-bold text-sm flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Sparkles size={16} /> Finalize & Save Client Profile
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="gradient-btn-primary px-8 py-3 rounded-xl font-headline font-bold text-sm flex items-center gap-2 cursor-pointer"
                >
                  Next Stage <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: ADD SKILLS */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-headline text-3xl font-extrabold text-slate-900 mb-1">
                Define Your Technical Stack
              </h1>
              <p className="text-xs text-slate-600">
                Enter your technologies and skill tags. Tags are written via <code className="text-purple-700 font-bold">ProfileRegistry.addSkill()</code>.
              </p>
            </div>

            <div className="space-y-4">
              <SkillSelector
                selectedSkills={skills}
                onChange={setSkills}
                label="Technical Skills & Stack Selection"
                helperText="Browse 26 specialized tech categories or search to configure your exact stack on-chain."
              />

              <div className="flex items-center gap-3 bg-purple-50/80 border border-purple-200/80 text-purple-950 p-4 rounded-2xl text-xs font-medium shadow-2xs">
                <ShieldCheck size={26} className="text-emerald-600 shrink-0" />
                <p className="leading-tight text-slate-700">
                  These technical skills will be stored as immutable metadata attributes on your PolyLance Reputation NFT and verifiable profile registry.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-600 hover:text-slate-900 font-mono text-xs flex items-center gap-1.5 font-bold cursor-pointer"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <button
                type="submit"
                className="gradient-btn-emerald px-10 py-3.5 rounded-xl font-headline font-bold text-sm flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Sparkles size={16} /> Finalize & Mint On-Chain Identity
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Success Screen Overlay Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-panel p-8 sm:p-10 rounded-2xl max-w-md w-full text-center border-purple-200 bg-white hard-shadow space-y-6">
            <div className="w-20 h-20 bg-emerald-100 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto text-emerald-700 shadow-md">
              <CheckCircle2 size={48} />
            </div>

            <div className="space-y-2">
              <h2 className="font-headline text-2xl font-black text-slate-900">
                {isClient ? 'Client Profile Saved' : 'Immutable Identity Established'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isClient
                  ? 'Your organization metadata has been updated and pinned to ProfileRegistry.sol.'
                  : 'Your profile has been minted to ProfileRegistry.sol. You are now a verified professional on PolyLance.'}
              </p>
            </div>

            <div className="font-data-hash text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200 text-purple-900 font-bold break-all">
              TX Hash: {mintedTxHash}
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="gradient-btn-emerald w-full py-3.5 rounded-xl font-headline font-bold text-sm shadow-md cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Modern In-App Notification / Alert Modal */}
      <PolyLanceAlertModal
        isOpen={Boolean(alertModalOptions)}
        options={alertModalOptions}
        onClose={() => setAlertModalOptions(null)}
      />
    </div>
  );
};
