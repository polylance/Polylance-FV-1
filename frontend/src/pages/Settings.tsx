import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData, getBackendSyncUrl, getSyncEndpoints } from '../context/PolyLanceDataContext';
import { useReducedMotion, setReducedMotionPreference, getMotionMode, setMotionMode, MotionMode } from '../media/useDataSaver';
import {
  User,
  Settings as SettingsIcon,
  Shield,
  Briefcase,
  Scale,
  Crown,
  Sparkles,
  CheckCircle2,
  Plus,
  X,
  Save,
  Github,
  DollarSign,
  RefreshCw,
  Zap,
  Pencil,
  Eye,
  Tag,
  Code2,
  Check,
  Camera,
  Image as ImageIcon,
  DownloadCloud,
  Trash2,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Send,
  Bell
} from 'lucide-react';
import { scrollReveal } from '../lib/motion';
import { PolyLanceAlertModal, AlertModalOptions } from '../components/PolyLanceAlertModal';
import { PolyLanceSelect, SelectOption } from '../components/PolyLanceSelect';
import { scoreGithubUser } from '../utils/githubOracle';
import { SkillSelector } from '../components/SkillSelector';
import { findSkillByIdOrName, formatSkillDisplayName } from '../data/skillsData';
import { UsdcIcon } from '../components/TokenIcon';

export const Settings: React.FC = () => {
  const { address, currentRole, isConnected } = useWeb3();
  const { 
    profiles, 
    updateProfile,
    accountDeletionRequests,
    requestAccountDeletion,
    cancelAccountDeletion,
    purgeAccountData
  } = usePolyLanceData();

  // Find user's current profile from context
  const userProfileKey = address ? Object.keys(profiles).find(k => k.toLowerCase() === address.toLowerCase()) : null;
  const currentProfile = userProfileKey ? profiles[userProfileKey] : null;

  // View / Edit Toggle Mode (Default is Saved View Mode)
  const [isEditing, setIsEditing] = useState(false);

  const fallbackDefaultAvatar = address
    ? (currentProfile?.githubUsername
        ? `https://github.com/${currentProfile.githubUsername}.png`
        : `https://api.dicebear.com/7.x/identicon/svg?seed=${address.toLowerCase()}`)
    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

  // Form State
  const [displayName, setDisplayName] = useState(currentProfile?.displayName || '');
  const [title, setTitle] = useState(currentProfile?.title || '');
  const [bio, setBio] = useState(currentProfile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentProfile?.avatarUrl || fallbackDefaultAvatar);
  const [hourlyRateUsdc, setHourlyRateUsdc] = useState(currentProfile?.hourlyRateUsdc || '75');
  const [githubUsername, setGithubUsername] = useState(currentProfile?.githubUsername || '');
  const [skills, setSkills] = useState<string[]>(currentProfile?.skills || ['Solidity', 'React', 'TypeScript', 'Smart Contracts']);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);
  const [alertModalOptions, setAlertModalOptions] = useState<AlertModalOptions | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Role Settings Specific State
  const [clientEscrowWindowDays, setClientEscrowWindowDays] = useState('7');
  const [preferredToken, setPreferredToken] = useState<'USDC' | 'MATIC'>('USDC');
  const [freelancerAutoClaim, setFreelancerAutoClaim] = useState(true);
  const [judgeNotificationsActive, setJudgeNotificationsActive] = useState(true);
  const [judgeAvailability, setJudgeAvailability] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  // User-level Animation & Motion Mode (Follow system / Reduced / Full)
  const [motionMode, setMotionModeState] = useState<MotionMode>(getMotionMode);
  const handleSelectMotionMode = (mode: MotionMode) => {
    setMotionModeState(mode);
    setMotionMode(mode);
  };

  // Developer Media Diagnostics State
  const [mediaDiagnostics, setMediaDiagnostics] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('polylance_media_diagnostics') === 'true';
  });
  const handleToggleDiagnostics = (enabled: boolean) => {
    setMediaDiagnostics(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('polylance_media_diagnostics', String(enabled));
      window.dispatchEvent(new Event('polylance_diagnostics_changed'));
    }
  };

  // Telegram Bot Live Alerts State
  const [isTelegramBound, setIsTelegramBound] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);

  // Check Telegram status on wallet change across sync endpoints
  useEffect(() => {
    if (!address) {
      setIsTelegramBound(false);
      return;
    }
    let isCancelled = false;
    const checkTelegram = async () => {
      const endpoints = getSyncEndpoints();
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(`${endpoint}/api/telegram/status/${address}`);
          if (res.ok) {
            const data = await res.json();
            if (!isCancelled) {
              setIsTelegramBound(Boolean(data.isBound));
            }
            return;
          }
        } catch {
          // Fallback to next endpoint
        }
      }
    };
    checkTelegram();
    return () => { isCancelled = true; };
  }, [address]);

  const handleConnectTelegram = async () => {
    if (!address) return;
    setTelegramLoading(true);
    const endpoints = getSyncEndpoints();
    let connected = false;

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(`${endpoint}/api/telegram/pair-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.deepLink) {
            window.open(data.deepLink, '_blank');
            setAlertModalOptions({
              title: 'Opening Telegram...',
              message: 'Telegram is opening. Tap "Start" in the chat to verify your wallet and activate 1-on-1 private contract notifications!',
              type: 'info'
            });
            connected = true;
            break;
          }
        }
      } catch {
        // Try next endpoint
      }
    }

    if (!connected) {
      setAlertModalOptions({
        title: 'Connection Notice',
        message: 'Could not connect to Telegram alert service right now. Please ensure the backend is running.',
        type: 'warning'
      });
    }
    setTelegramLoading(false);
  };

  const handleUnlinkTelegram = async () => {
    if (!address) return;
    setTelegramLoading(true);
    const endpoints = getSyncEndpoints();
    let unlinked = false;

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(`${endpoint}/api/telegram/unlink`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        });
        if (res.ok) {
          setIsTelegramBound(false);
          setAlertModalOptions({
            title: 'Telegram Disconnected',
            message: 'Your wallet has been unlinked from Telegram notifications. You can reconnect anytime.',
            type: 'success'
          });
          unlinked = true;
          break;
        }
      } catch {
        // Try next endpoint
      }
    }

    if (!unlinked) {
      setAlertModalOptions({
        title: 'Notice',
        message: 'Failed to unlink Telegram. Please try again.',
        type: 'warning'
      });
    }
    setTelegramLoading(false);
  };

  // Sync state if profile loads asynchronously (ONLY when not actively editing)
  useEffect(() => {
    if (currentProfile && !isEditing) {
      setDisplayName(currentProfile.displayName || '');
      setTitle(currentProfile.title || '');
      setBio(currentProfile.bio || '');
      if (currentProfile.avatarUrl) {
        setAvatarUrl(currentProfile.avatarUrl);
      } else if (currentProfile.githubUsername) {
        setAvatarUrl(`https://github.com/${currentProfile.githubUsername}.png`);
      }
      if (currentProfile.skills && currentProfile.skills.length > 0) {
        setSkills(currentProfile.skills);
      }
      if (currentProfile.hourlyRateUsdc) setHourlyRateUsdc(currentProfile.hourlyRateUsdc);
      if (currentProfile.githubUsername) setGithubUsername(currentProfile.githubUsername);
    }
  }, [currentProfile, isEditing]);

  // Auto-fetch profile basics from GitHub
  const handleFetchFromGithub = async (explicitUsername?: string) => {
    const rawTarget = explicitUsername || githubUsername;
    let clean = rawTarget.trim();
    if (clean.includes('github.com/')) {
      const parts = clean.split('github.com/');
      clean = parts[parts.length - 1].split('/')[0];
    }
    clean = clean.replace(/^@/, '').replace(/\/$/, '').trim();

    if (!clean) {
      setAlertModalOptions({
        title: 'GitHub Handle Required',
        message: 'Please enter a valid GitHub username first to fetch profile information.',
        type: 'warning',
      });
      return;
    }

    setIsFetchingGithub(true);
    try {
      const res = await scoreGithubUser(clean, address || '');
      if (res) {
        if (res.fetchedAvatarUrl) setAvatarUrl(res.fetchedAvatarUrl);
        if (res.fetchedDisplayName && (!displayName || displayName === 'Anonymous PolyLancer' || displayName === 'Lead Developer')) {
          setDisplayName(res.fetchedDisplayName);
        }
        if (res.fetchedBio && (!bio || bio.includes('PolyLance Arbitrator'))) {
          setBio(res.fetchedBio);
        }
        setGithubUsername(clean);
      }
    } catch (err) {
      console.warn('Failed to fetch profile details from GitHub:', err);
    } finally {
      setIsFetchingGithub(false);
    }
  };

  // Save Profile Updates to Context / Ledger and Lock Form back to Saved Mode
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setIsSaving(true);

    try {
      let githubMetrics = {};
      let trimmedGithub = githubUsername.trim();
      if (trimmedGithub.includes('github.com/')) {
        const parts = trimmedGithub.split('github.com/');
        trimmedGithub = parts[parts.length - 1].split('/')[0];
      }
      trimmedGithub = trimmedGithub.replace(/^@/, '').replace(/\/$/, '').trim();

      if (trimmedGithub) {
        try {
          const res = await scoreGithubUser(trimmedGithub, address);
          if (res && res.primaryScore) {
            githubMetrics = {
              primaryScore: res.primaryScore,
              secondaryScores: res.secondaryScores,
              primaryCategory: res.primaryCategory,
              languageBytes: res.languageBytes,
              verifiedAt: res.verifiedAt,
            };
          }
        } catch (syncErr) {
          console.warn('Background GitHub scoring during settings save:', syncErr);
        }
      }

      const finalAvatar = avatarUrl.trim() || (trimmedGithub ? `https://github.com/${trimmedGithub}.png` : fallbackDefaultAvatar);

      await updateProfile(
        {
          displayName: displayName.trim() || 'Anonymous PolyLancer',
          title: title.trim(),
          bio: bio.trim(),
          avatarUrl: finalAvatar,
          skills,
          hourlyRateUsdc: parseFloat(String(hourlyRateUsdc)) || 0,
          githubUsername: trimmedGithub,
          githubVerified: Boolean(trimmedGithub),
          ...githubMetrics,
        },
        address
      );

      setSaveSuccess(true);
      setIsEditing(false); // Lock back to saved read-only view
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update profile settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-6 pb-24 w-full">
      
      {/* Header Banner */}
      <motion.div {...scrollReveal} className="space-y-2 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0B0F]">
              Settings & Identity Studio
            </h1>
            <p className="text-sm text-[#4B5563] mt-1">
              Configure your profile credentials, skill stack, and Web3 role preferences.
            </p>
          </div>

          {/* Role Badge Indicator */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {currentRole === 'client' && (
              <div className="px-3 py-1.5 rounded-[8px] bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] flex items-center gap-1.5 text-xs font-medium">
                <Briefcase size={14} className="text-[#0047AB]" />
                <span>Client role</span>
              </div>
            )}

            {currentRole === 'freelancer' && (
              <div className="px-3 py-1.5 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] text-[#0B0B0F] flex items-center gap-1.5 text-xs font-medium">
                <Zap size={14} className="text-[#0047AB]" />
                <span>Freelancer role</span>
              </div>
            )}

            {currentRole === 'judge' && (
              <div className="px-3 py-1.5 rounded-[8px] bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] flex items-center gap-1.5 text-xs font-medium">
                <Scale size={14} className="text-[#B45309]" />
                <span>DAO judge</span>
              </div>
            )}

            {currentRole === 'admin' && (
              <div className="px-3 py-1.5 rounded-[8px] bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] flex items-center gap-1.5 text-xs font-medium">
                <Crown size={14} className="text-[#10B981]" />
                <span>Protocol admin</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Profile View / Edit Mode (7 cols) */}
        <div className="lg:col-span-7 space-y-8 text-left">
          
          <div className="bg-white p-5 sm:p-6 rounded-[12px] border border-[#E5E7EB] shadow-xs space-y-5">
            
            {/* Header: Title + Mode Switch */}
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center text-[#0B0B0F] shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#0B0B0F]">
                    {isEditing ? 'Edit Profile & Bio' : 'Saved Profile Overview'}
                  </h3>
                  <p className="text-xs text-[#4B5563]">
                    {isEditing ? 'Update your display credentials and save changes' : 'Your active Web3 freelancer/client profile'}
                  </p>
                </div>
              </div>

              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 bg-[#0047AB] hover:bg-[#00388A] text-white rounded-[8px] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Pencil size={13} />
                  <span>Edit profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-[#F6F7F9] hover:bg-[#E5E7EB] text-[#4B5563] border border-[#E5E7EB] rounded-[8px] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye size={13} />
                  <span>View details</span>
                </button>
              )}
            </div>

            {saveSuccess && (
              <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[8px] text-[#166534] text-xs font-medium flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#10B981]" />
                <span>Profile details successfully updated and saved to PolyLance!</span>
              </div>
            )}

            {/* ── MODE 1: SAVED PROFILE DETAILS VIEW MODE (READ-ONLY) ── */}
            {!isEditing ? (
              <div className="space-y-5">
                
                {/* Main Card Overview with Avatar */}
                <div className="p-4 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-3.5">
                    <div className="flex items-center gap-3.5">
                      {/* Avatar Image */}
                      <div className="relative w-14 h-14 rounded-[8px] overflow-hidden bg-white border border-[#E5E7EB] shrink-0">
                        <img
                          src={avatarUrl || fallbackDefaultAvatar}
                          alt={displayName || 'User Avatar'}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = fallbackDefaultAvatar;
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-semibold text-[#0B0B0F]">
                            {displayName || 'Anonymous PolyLancer'}
                          </h2>
                          {githubUsername && (
                            <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#0047AB] border border-[#BFDBFE] rounded-[6px] text-[10px] font-medium">
                              VERIFIED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#4B5563] mt-0.5">
                          {title || 'Senior Web3 Developer'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="px-3 py-1 bg-white border border-[#E5E7EB] text-[#0B0B0F] text-xs font-semibold rounded-[8px] flex items-center gap-1.5 shadow-2xs">
                        <UsdcIcon size={14} />
                        <span>{hourlyRateUsdc || '75'} USDC/hr</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio Paragraph */}
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[#4B5563]">Bio & summary</span>
                    <p className="text-xs sm:text-sm text-[#0B0B0F] leading-relaxed">
                      {bio || 'No bio summary added yet. Click "Edit profile" above to update your professional experience.'}
                    </p>
                  </div>

                  {/* GitHub Handle */}
                  {githubUsername && (
                    <div className="flex items-center gap-2 text-xs text-[#4B5563] pt-1 border-t border-[#E5E7EB]">
                      <Github size={14} className="text-[#0B0B0F]" />
                      <span>Linked GitHub:</span>
                      <a
                        href={`https://github.com/${githubUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0047AB] hover:underline font-medium inline-flex items-center gap-1"
                      >
                        @{githubUsername}
                      </a>
                    </div>
                  )}
                </div>

                {/* Skills Tags Badges */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#4B5563] block">
                      Saved skill stack ({skills.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {skills.length > 0 ? (
                      skills.map((skill, idx) => {
                        const matched = findSkillByIdOrName(skill);
                        return (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-[8px] bg-[#F6F7F9] text-[#0B0B0F] border border-[#E5E7EB] text-xs font-normal flex items-center gap-1.5 hover:border-[#D1D5DB] transition-colors"
                          >
                            <Tag size={11} className="text-[#0047AB] shrink-0" />
                            <span>{formatSkillDisplayName(skill)}</span>
                            {matched?.subcategory && (
                              <span className="text-[10px] text-[#6B7280] bg-white px-1.5 py-0.2 rounded border border-[#E5E7EB]">
                                {matched.subcategory}
                              </span>
                            )}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-[#6B7280]">No skills added yet.</span>
                    )}
                  </div>
                </div>

                {/* Action Prompt */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full py-2.5 bg-[#0047AB] hover:bg-[#00388A] text-white rounded-[8px] text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Pencil size={14} />
                    <span>Edit profile & skills</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ── MODE 2: EDIT PROFILE FORM MODE ── */
              <form onSubmit={handleSaveProfile} className="space-y-5">
                
                {/* Avatar Image Controls */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Camera size={14} className="text-[#0047AB]" />
                      Profile Avatar & Photo
                    </label>
                    <span className="text-[11px] text-slate-600 font-sans font-semibold">
                      Auto-syncs with GitHub
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Avatar Preview */}
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white border-2 border-slate-300 shadow-sm shrink-0">
                      <img
                        src={avatarUrl || fallbackDefaultAvatar}
                        alt="Avatar Preview"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = fallbackDefaultAvatar;
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Avatar URL Input & Quick Actions */}
                    <div className="flex-1 w-full space-y-2">
                      <input
                        type="text"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://... image URL or avatar"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-mono focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-all"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        {githubUsername && (
                          <button
                            type="button"
                            onClick={() => setAvatarUrl(`https://github.com/${githubUsername.trim().replace(/^@/, '')}.png`)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#0047AB] border border-slate-200 rounded-lg text-[11px] font-bold font-sans flex items-center gap-1 transition-all cursor-pointer shadow-3xs"
                          >
                            <Github size={12} />
                            Use GitHub Avatar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setAvatarUrl(`https://api.dicebear.com/7.x/identicon/svg?seed=${address || 'polylance'}`)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold font-sans flex items-center gap-1 transition-all cursor-pointer shadow-3xs"
                        >
                          <Sparkles size={12} className="text-amber-500" />
                          Use Web3 Identicon
                        </button>
                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('')}
                            className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-bold font-sans transition-all cursor-pointer shadow-3xs"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Display Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 block">
                    Display Name / Alias
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Satoshi Nakamoto or Alex Developer"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-sans focus:bg-white focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-all"
                  />
                </div>

                {/* Title / Headline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 block">
                    Professional Title / Headline
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior Smart Contract Auditor & Fullstack Engineer"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-sans focus:bg-white focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-all"
                  />
                </div>

                {/* Hourly Rate & GitHub Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Hourly Rate */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 block">
                      Target Hourly Rate (USDC)
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
                        <UsdcIcon size={18} />
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={hourlyRateUsdc}
                        onChange={(e) => setHourlyRateUsdc(e.target.value)}
                        placeholder="75"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-mono focus:bg-white focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-all"
                        style={{ paddingLeft: '2.75rem' }}
                      />
                    </div>
                  </div>

                  {/* GitHub Handle Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 block">
                        GitHub Username
                      </label>
                      {githubUsername && (
                        <button
                          type="button"
                          onClick={() => handleFetchFromGithub()}
                          disabled={isFetchingGithub}
                          className="text-[11px] text-[#0047AB] hover:text-[#003A8C] font-bold font-sans flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          {isFetchingGithub ? <RefreshCw size={11} className="animate-spin" /> : <DownloadCloud size={11} />}
                          <span>Sync GitHub Details</span>
                        </button>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center text-slate-400">
                        <Github size={18} />
                      </div>
                      <input
                        type="text"
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                        placeholder="e.g. octocat or web3dev"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-sans focus:bg-white focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-all"
                        style={{ paddingLeft: '2.75rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bio / Summary */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 block">
                    Bio / Summary
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your expertise, past projects, or freelancing background..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-sans focus:bg-white focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-all resize-none"
                  />
                </div>

                {/* Comprehensive Categorized Skill Selector */}
                <div className="pt-2">
                  <SkillSelector
                    selectedSkills={skills}
                    onChange={setSkills}
                    label="Technical & Domain Skills"
                    helperText="Browse 26 specialized tech categories or search to configure your exact stack."
                  />
                </div>

                {/* Save & Cancel Action Buttons */}
                <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-[#0047AB] hover:bg-[#00388A] text-white px-5 py-2 rounded-[8px] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Save profile settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-white hover:bg-[#F6F7F9] text-[#0B0B0F] border border-[#E5E7EB] rounded-[8px] text-xs font-medium transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Role Differentiated Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-6 text-left">
          
          {/* Role Differentiated Settings Panel */}
          <div className="bg-white p-5 sm:p-6 rounded-[12px] border border-[#E5E7EB] shadow-xs space-y-5">
            
            {/* CLIENT Specific Role Settings */}
            {currentRole === 'client' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-[#E5E7EB] pb-3.5">
                  <div className="w-8 h-8 rounded-[8px] bg-[#EFF6FF] text-[#0047AB] border border-[#BFDBFE] flex items-center justify-center shrink-0">
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#0B0B0F]">Client escrow preferences</h3>
                    <p className="text-xs text-[#4B5563]">Tailored defaults for hiring freelancers</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-medium text-[#0B0B0F] block">Default review period window</label>
                    <PolyLanceSelect
                      value={clientEscrowWindowDays}
                      onChange={(val) => setClientEscrowWindowDays(val)}
                      options={[
                        { value: '3', label: '3 Days', sublabel: 'Fast Track Approval' },
                        { value: '7', label: '7 Days', sublabel: 'Standard Review' },
                        { value: '14', label: '14 Days', sublabel: 'Extended Audit' },
                      ]}
                      variant="standard"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="font-medium text-[#0B0B0F] block">Preferred escrow currency</label>
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPreferredToken('USDC')}
                        className={`flex-1 p-2 rounded-[8px] border text-xs font-medium text-center transition-colors cursor-pointer ${
                          preferredToken === 'USDC'
                            ? 'border-[#0047AB] bg-[#EFF6FF] text-[#0047AB]'
                            : 'border-[#E5E7EB] bg-[#F6F7F9] text-[#4B5563]'
                        }`}
                      >
                        USDC (Stable)
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreferredToken('MATIC')}
                        className={`flex-1 p-2 rounded-[8px] border text-xs font-medium text-center transition-colors cursor-pointer ${
                          preferredToken === 'MATIC'
                            ? 'border-[#0047AB] bg-[#EFF6FF] text-[#0047AB]'
                            : 'border-[#E5E7EB] bg-[#F6F7F9] text-[#4B5563]'
                        }`}
                      >
                        POL Native
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FREELANCER Specific Role Settings */}
            {currentRole === 'freelancer' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-[#E5E7EB] pb-3.5">
                  <div className="w-8 h-8 rounded-[8px] bg-[#F6F7F9] text-[#0047AB] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                    <Zap size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#0B0B0F]">Freelancer payout & attestation</h3>
                    <p className="text-xs text-[#4B5563]">Proof-of-work auto-claiming setup</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB]">
                    <div>
                      <span className="font-medium text-[#0B0B0F] block">Auto-claim approved milestones</span>
                      <span className="text-[#4B5563] text-[11px]">Trigger immediate smart contract fund release upon client approval</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={freelancerAutoClaim}
                      onChange={(e) => setFreelancerAutoClaim(e.target.checked)}
                      className="w-4 h-4 accent-[#0047AB] rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* JUDGE Specific Role Settings */}
            {currentRole === 'judge' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-[#E5E7EB] pb-3.5">
                  <div className="w-8 h-8 rounded-[8px] bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] flex items-center justify-center shrink-0">
                    <Scale size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#0B0B0F]">DAO jury duty settings</h3>
                    <p className="text-xs text-[#4B5563]">Arbitration alert & voting preferences</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-[8px] bg-[#FFFBEB] border border-[#FDE68A]">
                    <div>
                      <span className="font-medium text-[#92400E] block">Arbitrator availability</span>
                      <span className="text-[#B45309] text-[11px]">Receive active dispute voting assignments</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={judgeAvailability}
                      onChange={(e) => setJudgeAvailability(e.target.checked)}
                      className="w-4 h-4 accent-[#B45309] rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN Specific Role Settings */}
            {currentRole === 'admin' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-[#E5E7EB] pb-3.5">
                  <div className="w-8 h-8 rounded-[8px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] flex items-center justify-center shrink-0">
                    <Crown size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#0B0B0F]">Protocol admin controls</h3>
                    <p className="text-xs text-[#4B5563]">Sovereign configuration parameters</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-[8px] bg-[#F0FDF4] border border-[#BBF7D0] text-xs space-y-1.5">
                  <div className="font-semibold text-[#166534] flex items-center justify-between">
                    <span>Protocol fee rate</span>
                    <span className="font-mono font-medium">0.0%</span>
                  </div>
                  <p className="text-[#166534] text-[11px]">
                    Peer-to-peer 0% sovereign fee model is enforced across all PolyLance escrow smart contracts.
                  </p>
                </div>
              </div>
            )}

            {/* Audit Report Certificate Card */}
            {address && (
              <div className="space-y-3 pt-3.5 border-t border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-[#F6F7F9] text-[#0B0B0F] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#0B0B0F]">Trust & audit certificate</h3>
                    <p className="text-xs text-[#4B5563]">Official on-chain performance and reputation report</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] text-xs space-y-3">
                  <p className="text-[#4B5563] leading-relaxed">
                    Generate an official audit document containing your verified wallet details, Soulbound Reputation Tokens (SBT), completed escrow history, and platform metrics formatted for PDF export & printing.
                  </p>
                  <div>
                    <Link
                      to={`/audit-report/${address}`}
                      className="inline-flex items-center gap-1.5 bg-[#0047AB] hover:bg-[#00388A] text-white font-medium px-3.5 py-2 rounded-[8px] text-xs transition-colors"
                    >
                      <FileText size={14} />
                      <span>View & download audit report (PDF)</span>
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Telegram Live Contract Notifications Card */}
            {address && (
              <div className="space-y-3 pt-3.5 border-t border-[#E5E7EB]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[#EFF6FF] text-[#0047AB] border border-[#BFDBFE] flex items-center justify-center shrink-0">
                      <Send size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#0B0B0F]">Telegram live alerts</h3>
                        {isTelegramBound ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-medium bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                            LINKED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-medium bg-[#F6F7F9] text-[#6B7280] border border-[#E5E7EB]">
                            OPTIONAL
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#4B5563]">Instant 1-on-1 private escrow & milestone updates</p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] text-xs space-y-3">
                  <p className="text-[#4B5563] leading-relaxed">
                    Receive instantaneous, encrypted direct messages whenever a client funds your milestone, deliverables are submitted, or funds are released to your wallet on Polygon.
                  </p>

                  <div className="bg-white p-2.5 rounded-[6px] border border-[#E5E7EB] space-y-1 text-[11px] text-[#4B5563]">
                    <div className="flex items-center gap-1.5 font-medium text-[#0B0B0F]">
                      <Shield size={12} className="text-[#0047AB]" />
                      <span>Strict 1-to-1 privacy guarantee</span>
                    </div>
                    <p className="text-[10.5px] text-[#6B7280]">
                      Your address and contracts are strictly isolated. The bot never shares or broadcasts your data to other users or public channels.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {!isTelegramBound ? (
                      <button
                        type="button"
                        onClick={handleConnectTelegram}
                        disabled={telegramLoading}
                        className="bg-[#0047AB] hover:bg-[#00388A] text-white font-medium px-3.5 py-2 rounded-[8px] text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Send size={13} />
                        <span>{telegramLoading ? 'Generating link...' : 'Connect Telegram alerts'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleUnlinkTelegram}
                        disabled={telegramLoading}
                        className="bg-white hover:bg-[#FEF2F2] text-[#991B1B] hover:border-[#FCA5A5] border border-[#E5E7EB] font-medium px-3 py-1.5 rounded-[8px] text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                        <span>Disconnect Telegram</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* GDPR Data Sovereignty & Account Deletion (30-Day Buffer) */}
            {address && (
              <div className="space-y-4 pt-4 border-t border-rose-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center shrink-0">
                    <Trash2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-headline text-base font-extrabold text-slate-900">Data Sovereignty & Account Deletion</h3>
                    <p className="text-xs text-slate-500 font-sans">GDPR Article 17 Right to be Forgotten compliance</p>
                  </div>
                </div>

                {(() => {
                  const lowerAddr = address.toLowerCase();
                  const deletionReq = accountDeletionRequests[lowerAddr];
                  const isDeletionPending = Boolean(deletionReq && deletionReq.executeAfter && Date.now() < deletionReq.executeAfter);

                  if (isDeletionPending) {
                    const timeLeftMs = Math.max(0, deletionReq.executeAfter - Date.now());
                    const daysLeft = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
                    const hoursLeft = Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const scheduledDate = new Date(deletionReq.executeAfter).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    });

                    return (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 space-y-3 font-sans">
                        <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                          <Clock size={16} className="text-rose-600 animate-pulse shrink-0" />
                          <span>Deletion Scheduled • 30-Day Buffer Window Active</span>
                        </div>
                        <p className="text-xs text-rose-800 leading-relaxed">
                          Your request to delete your account and personal data is currently in the <strong>30-day grace period</strong>. Your data will be permanently purged on <strong>{scheduledDate}</strong> ({daysLeft} days, {hoursLeft} hours remaining). You can cancel anytime, or delete immediately right now.
                        </p>
                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={async () => {
                              await cancelAccountDeletion(address);
                              setAlertModalOptions({
                                title: 'Account Deletion Cancelled',
                                message: 'Your account deletion request has been cancelled and your profile remains active with full sovereign access.',
                                type: 'success'
                              });
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 size={14} />
                            <span>Cancel Deletion Request (Keep Account)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAlertModalOptions({
                                title: 'Confirm Immediate Permanent Deletion',
                                message: 'Are you sure you want to skip the remaining buffer window and permanently erase your account, off-chain messages, and database records right now? This cannot be undone.',
                                type: 'error',
                                confirmText: 'Erase All Data Immediately',
                                onConfirm: async () => {
                                  await purgeAccountData(address);
                                  setAlertModalOptions({
                                    title: 'Account Data Erased',
                                    message: 'Your account profile, off-chain messages, and database records have been permanently erased from the network.',
                                    type: 'info'
                                  });
                                }
                              });
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Trash2 size={13} />
                            <span>Erase Immediately Now</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="p-4 rounded-xl bg-white border border-[#FECACA] text-xs space-y-4">
                      <div className="space-y-1">
                        <span className="font-semibold text-[#B91C1C] block text-sm">Danger Zone</span>
                        <p className="text-[#4B5563] leading-relaxed">
                          Request permanent removal of your account. Profile and off-chain database records will be erased. Public blockchain transactions, smart contract escrows, and soulbound credentials cannot be modified or deleted.
                        </p>
                      </div>

                      <div className="space-y-2 pt-1 border-t border-[#FEE2E2]">
                        <label className="text-xs font-medium text-[#0B0B0F] block">
                          Type <span className="font-mono font-bold text-[#B91C1C]">DELETE</span> to confirm immediate account removal:
                        </label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Type DELETE to confirm"
                            className="px-3 py-2 text-xs bg-[#F6F7F9] border border-[#D1D5DB] focus:bg-white focus:border-[#B91C1C] rounded-lg font-mono outline-none text-[#0B0B0F] placeholder:text-[#9CA3AF] w-full sm:w-56"
                          />
                          <button
                            type="button"
                            disabled={deleteConfirmText !== 'DELETE'}
                            onClick={() => {
                              setAlertModalOptions({
                                title: 'Confirm Immediate Permanent Deletion',
                                message: 'Are you sure you want to permanently delete your account right now? Your profile, off-chain messages, and database records will be erased immediately from the database.',
                                type: 'error',
                                confirmText: 'Delete Account Immediately',
                                onConfirm: async () => {
                                  await purgeAccountData(address);
                                  setDeleteConfirmText('');
                                  setAlertModalOptions({
                                    title: 'Account Deleted',
                                    message: 'Your profile, off-chain chat history, and database records have been permanently erased.',
                                    type: 'info'
                                  });
                                }
                              });
                            }}
                            className="bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-40 disabled:pointer-events-none text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Trash2 size={13} />
                            <span>Delete account immediately</span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#FEE2E2] flex items-center justify-between">
                        <span className="text-[#6B7280]">Prefer a safety buffer?</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAlertModalOptions({
                              title: 'Confirm Account Deletion Request',
                              message: 'Are you sure you want to request account deletion? A 30-day buffer window will activate. You can cancel this request at any time within 30 days before permanent data erasure.',
                              type: 'error',
                              confirmText: 'Schedule Deletion (30-Day Buffer)',
                              onConfirm: async () => {
                                await requestAccountDeletion(address);
                                setAlertModalOptions({
                                  title: 'Deletion Scheduled',
                                  message: 'Your 30-day account deletion buffer has started. You can cancel this request anytime in your Settings.',
                                  type: 'info'
                                });
                              }
                            });
                          }}
                          className="bg-white hover:bg-[#F6F7F9] text-[#374151] border border-[#D1D5DB] font-medium px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Clock size={13} className="text-[#6B7280]" />
                          <span>Schedule with 30-day cooldown</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Appearance & Motion Preferences */}
            <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-[#F6F7F9] text-[#0047AB] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                  <Zap size={18} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#0B0B0F]">Appearance & Animations</h3>
                  <p className="text-xs text-[#4B5563]">Control scroll-linked transitions and animation intensity</p>
                </div>
              </div>

              <div className="p-4 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] text-xs space-y-3">
                <div className="space-y-2">
                  <span className="font-semibold text-[#0B0B0F] block">Animations</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectMotionMode('system')}
                      className={`p-2 rounded-[8px] border text-xs font-semibold text-center transition-colors cursor-pointer ${
                        motionMode === 'system'
                          ? 'border-[#0047AB] bg-white text-[#0047AB] shadow-xs'
                          : 'border-[#E5E7EB] bg-white/60 text-[#4B5563] hover:text-[#0B0B0F]'
                      }`}
                    >
                      Follow system
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectMotionMode('reduced')}
                      className={`p-2 rounded-[8px] border text-xs font-semibold text-center transition-colors cursor-pointer ${
                        motionMode === 'reduced'
                          ? 'border-[#0047AB] bg-white text-[#0047AB] shadow-xs'
                          : 'border-[#E5E7EB] bg-white/60 text-[#4B5563] hover:text-[#0B0B0F]'
                      }`}
                    >
                      Reduced
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectMotionMode('full')}
                      className={`p-2 rounded-[8px] border text-xs font-semibold text-center transition-colors cursor-pointer ${
                        motionMode === 'full'
                          ? 'border-[#0047AB] bg-white text-[#0047AB] shadow-xs'
                          : 'border-[#E5E7EB] bg-white/60 text-[#4B5563] hover:text-[#0B0B0F]'
                      }`}
                    >
                      Full
                    </button>
                  </div>
                  <p className="text-[11px] text-[#4B5563] pt-1">
                    {motionMode === 'system' && 'Following your operating system preference. Opacity fades and transitions respect OS setting.'}
                    {motionMode === 'reduced' && 'Motion disabled. Content appears with smooth opacity-only fades without movement.'}
                    {motionMode === 'full' && 'Full animations enabled (overrides system preference for this site only).'}
                  </p>
                </div>
              </div>
            </div>

            {/* Developer Diagnostics */}
            <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-[#F6F7F9] text-[#0047AB] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                  <Code2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#0B0B0F]">Developer Diagnostics</h3>
                  <p className="text-xs text-[#4B5563]">Tools and live monitoring for local testing</p>
                </div>
              </div>

              <div className="p-4 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#0B0B0F] block">Show media diagnostics</span>
                    <span className="text-[#4B5563] text-[11px]">
                      Displays VideoManager HUD in bottom corner to monitor active decoders and downloaded bytes.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={mediaDiagnostics}
                    onChange={(e) => handleToggleDiagnostics(e.target.checked)}
                    className="w-4 h-4 accent-[#0047AB] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Modern Dialog Modal */}
      <PolyLanceAlertModal
        isOpen={Boolean(alertModalOptions)}
        options={alertModalOptions}
        onClose={() => setAlertModalOptions(null)}
      />
    </div>
  );
};
