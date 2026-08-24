import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
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
  DownloadCloud
} from 'lucide-react';
import { scrollReveal } from '../lib/motion';
import { scoreGithubUser } from '../utils/githubOracle';

// Comprehensive Tech Skills Database for Predictive Autocomplete
const TECH_SKILLS_DATABASE = [
  'Solidity', 'Vyper', 'Rust', 'Anchor Framework', 'Solana', 'Ethereum', 'Polygon', 'CosmWasm',
  'Zero-Knowledge Proofs (ZK)', 'Circom', 'SnarkJS', 'Noir', 'Substrate', 'Move', 'Aptos', 'Sui',
  'Hardhat', 'Foundry', 'Truffle', 'Ethers.js', 'Viem', 'Wagmi', 'Web3.js', 'IPFS', 'The Graph', 'Chainlink',
  'Smart Contract Security', 'Slither', 'Mythril', 'Echidna', 'DeFi Protocols', 'NFT Standards (ERC-721/1155)',
  'EIP-5192 Soulbound Tokens', 'Tokenomics', 'DAO Governance', 'Cross-Chain (CCIP/LayerZero)',
  'React', 'React Native', 'Next.js', 'TypeScript', 'JavaScript', 'Vue.js', 'Nuxt.js', 'Svelte',
  'TailwindCSS', 'Redux', 'Zustand', 'GraphQL', 'HTML5/CSS3', 'Framer Motion', 'Three.js', 'WebGPU',
  'Node.js', 'Express.js', 'NestJS', 'Python', 'Django', 'FastAPI', 'Flask', 'Go (Golang)', 'Gin',
  'C++', 'C#', '.NET', 'Java', 'Spring Boot', 'Ruby on Rails', 'PHP', 'Laravel', 'REST API', 'gRPC',
  'PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'SQLite', 'Prisma ORM', 'TypeORM', 'DynamoDB',
  'Elasticsearch', 'Supabase', 'Firebase', 'BigQuery', 'Apache Kafka', 'Vector DB (Pinecone)',
  'Docker', 'Kubernetes', 'AWS', 'Google Cloud Platform (GCP)', 'Microsoft Azure', 'Terraform',
  'CI/CD Pipelines', 'GitHub Actions', 'Linux Sysadmin', 'Nginx', 'Cybersecurity', 'Penetration Testing',
  'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'OpenAI API', 'LangChain', 'LlamaIndex',
  'Computer Vision', 'NLP', 'Data Science', 'Pandas', 'NumPy', 'Solidity Auditing'
];

export const Settings: React.FC = () => {
  const { address, currentRole, isConnected } = useWeb3();
  const { profiles, updateProfile } = usePolyLanceData();

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
  const [newSkillInput, setNewSkillInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);

  // Role Settings Specific State
  const [clientEscrowWindowDays, setClientEscrowWindowDays] = useState('7');
  const [preferredToken, setPreferredToken] = useState<'USDC' | 'MATIC'>('USDC');
  const [freelancerAutoClaim, setFreelancerAutoClaim] = useState(true);
  const [judgeNotificationsActive, setJudgeNotificationsActive] = useState(true);
  const [judgeAvailability, setJudgeAvailability] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const autocompleteRef = useRef<HTMLDivElement>(null);

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

  // Click Outside Listener for Autocomplete Suggestions Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      alert('Please enter a GitHub username first.');
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

  // Filter Predictive Skill Suggestions
  const matchingSuggestions = newSkillInput.trim()
    ? TECH_SKILLS_DATABASE.filter(
        skill =>
          skill.toLowerCase().includes(newSkillInput.trim().toLowerCase()) &&
          !skills.some(existing => existing.toLowerCase() === skill.toLowerCase())
      ).slice(0, 7)
    : [];

  // Handle Skill Tag Addition from Input or Suggestion Selection
  const handleAddSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (trimmed && !skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkills([...skills, trimmed]);
      setNewSkillInput('');
      setShowSuggestions(false);
    }
  };

  const selectSuggestedSkill = (skillName: string) => {
    if (!skills.some(s => s.toLowerCase() === skillName.toLowerCase())) {
      setSkills([...skills, skillName]);
    }
    setNewSkillInput('');
    setShowSuggestions(false);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
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
    <div className="space-y-12 pt-6 pb-64 max-w-6xl mx-auto px-4 sm:px-6">
      
      {/* Header Banner */}
      <motion.div {...scrollReveal} className="space-y-3 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-800 rounded-full border border-purple-200 text-xs font-mono font-bold uppercase tracking-wider">
          <SettingsIcon size={14} className="text-purple-600 animate-spin" />
          <span>System & Preferences Protocol</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              Settings & <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">Identity Studio</span>
            </h1>
            <p className="text-sm text-slate-600 font-sans mt-1">
              Configure your profile credentials, skill stack, and Web3 role preferences.
            </p>
          </div>

          {/* Role Badge Indicator */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {currentRole === 'client' && (
              <div className="px-4 py-2 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-2 shadow-2xs">
                <Briefcase size={16} className="text-blue-600" />
                <span className="font-headline font-extrabold text-xs uppercase tracking-wider">Client Role</span>
              </div>
            )}

            {currentRole === 'freelancer' && (
              <div className="px-4 py-2 rounded-2xl bg-purple-50 border border-purple-200 text-purple-800 flex items-center gap-2 shadow-2xs">
                <Zap size={16} className="text-purple-600" />
                <span className="font-headline font-extrabold text-xs uppercase tracking-wider">Freelancer Role</span>
              </div>
            )}

            {currentRole === 'judge' && (
              <div className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2 shadow-2xs">
                <Scale size={16} className="text-amber-600" />
                <span className="font-headline font-extrabold text-xs uppercase tracking-wider">DAO Judge</span>
              </div>
            )}

            {currentRole === 'admin' && (
              <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 shadow-2xs">
                <Crown size={16} className="text-emerald-600" />
                <span className="font-headline font-extrabold text-xs uppercase tracking-wider">Protocol Admin</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Profile View / Edit Mode (7 cols) */}
        <div className="lg:col-span-7 space-y-8 text-left">
          
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            
            {/* Header: Title + Mode Switch */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-headline text-lg font-extrabold text-slate-900">
                    {isEditing ? 'Edit Profile & Bio' : 'Saved Profile Overview'}
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    {isEditing ? 'Update your display credentials and save changes' : 'Your active Web3 freelancer/client profile'}
                  </p>
                </div>
              </div>

              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl font-headline font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <Pencil size={14} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-sans font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Eye size={13} />
                  <span>View Details</span>
                </button>
              )}
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-bounce font-sans">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Profile details successfully updated and saved to PolyLance!</span>
              </div>
            )}

            {/* ── MODE 1: SAVED PROFILE DETAILS VIEW MODE (READ-ONLY) ── */}
            {!isEditing ? (
              <div className="space-y-6">
                
                {/* Main Card Overview with Avatar */}
                <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar Image */}
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-purple-100 border-2 border-purple-300 shadow-sm shrink-0">
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
                          <h2 className="font-headline text-xl font-extrabold text-slate-900">
                            {displayName || 'Anonymous PolyLancer'}
                          </h2>
                          {githubUsername && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 rounded-full text-[10px] font-mono font-bold">
                              VERIFIED
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-sans font-semibold text-purple-700 mt-0.5">
                          {title || 'Senior Web3 Developer'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 shadow-2xs">
                        <DollarSign size={14} className="text-emerald-600" />
                        <span>{hourlyRateUsdc || '75'} USDC/hr</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio Paragraph */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Bio & Summary</span>
                    <p className="text-sm font-sans text-slate-700 leading-relaxed">
                      {bio || 'No bio summary added yet. Click "Edit Profile" above to update your professional experience.'}
                    </p>
                  </div>

                  {/* GitHub Handle */}
                  {githubUsername && (
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 pt-1">
                      <Github size={15} className="text-slate-900" />
                      <span>Linked GitHub:</span>
                      <a
                        href={`https://github.com/${githubUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-600 hover:underline inline-flex items-center gap-1"
                      >
                        @{githubUsername}
                      </a>
                    </div>
                  )}
                </div>

                {/* Skills Tags Badges */}
                <div className="space-y-2.5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 block">
                    Saved Skill Stack
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {skills.length > 0 ? (
                      skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-900 border border-purple-200/80 text-xs font-headline font-bold shadow-3xs flex items-center gap-1.5"
                        >
                          <Tag size={12} className="text-purple-600" />
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-sans text-slate-400">No skills added yet.</span>
                    )}
                  </div>
                </div>

                {/* Action Prompt */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-headline font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <Pencil size={15} />
                    <span>Edit Profile & Skills</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ── MODE 2: EDIT PROFILE FORM MODE ── */
              <form onSubmit={handleSaveProfile} className="space-y-5">
                
                {/* Avatar Image Controls */}
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Camera size={14} className="text-purple-600" />
                      Profile Avatar & Photo
                    </label>
                    <span className="text-[11px] text-purple-700 font-sans font-semibold">
                      Auto-syncs with GitHub
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Avatar Preview */}
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white border-2 border-purple-300 shadow-sm shrink-0">
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
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-mono focus:border-purple-400 transition-all"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        {githubUsername && (
                          <button
                            type="button"
                            onClick={() => setAvatarUrl(`https://github.com/${githubUsername.trim().replace(/^@/, '')}.png`)}
                            className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold font-sans flex items-center gap-1 transition-all cursor-pointer shadow-3xs"
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-sans focus:bg-white focus:border-purple-400 transition-all"
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-sans focus:bg-white focus:border-purple-400 transition-all"
                  />
                </div>

                {/* Hourly Rate & GitHub */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 block">
                      Hourly Rate (USDC/hr)
                    </label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        value={hourlyRateUsdc}
                        onChange={(e) => setHourlyRateUsdc(e.target.value)}
                        placeholder="75"
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-mono focus:bg-white focus:border-purple-400 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 block">
                        GitHub Handle
                      </label>
                      {githubUsername && (
                        <button
                          type="button"
                          onClick={() => handleFetchFromGithub()}
                          disabled={isFetchingGithub}
                          className="text-[11px] text-purple-600 hover:text-purple-800 font-bold font-sans flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          {isFetchingGithub ? <RefreshCw size={11} className="animate-spin" /> : <DownloadCloud size={11} />}
                          <span>Sync GitHub Details</span>
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Github size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                        placeholder="e.g. sunny200551 or octocat"
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-sans focus:bg-white focus:border-purple-400 transition-all"
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-sans focus:bg-white focus:border-purple-400 transition-all resize-none"
                  />
                </div>

                {/* Skill Tag Manager with Predictive Tech Autocomplete */}
                <div className="space-y-2 pt-2 relative" ref={autocompleteRef}>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 block">
                      Skills & Expertise Tags
                    </label>
                    <span className="text-[11px] text-purple-600 font-sans font-semibold">
                      Predictive Auto-Suggest Active
                    </span>
                  </div>

                  {/* Active Skill Tags */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1 rounded-full text-xs font-bold font-sans shadow-3xs"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-purple-400 hover:text-purple-900 cursor-pointer transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Input Field + Add Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={newSkillInput}
                        onChange={(e) => {
                          setNewSkillInput(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Type a skill (e.g. Solidity, React, Rust, ZK)..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-sans focus:bg-white focus:border-purple-400 transition-all"
                      />

                      {/* Autocomplete Predictive Dropdown */}
                      <AnimatePresence>
                        {showSuggestions && matchingSuggestions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            className="absolute left-0 right-0 top-full mt-1 bg-white border border-purple-200 rounded-2xl shadow-2xl z-[100] overflow-hidden max-h-56 overflow-y-auto py-1.5"
                          >
                            <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase text-purple-600 tracking-wider bg-purple-50/60 border-b border-purple-100 mb-1">
                              Matching Tech Skills ({matchingSuggestions.length})
                            </div>
                            {matchingSuggestions.map((suggestion, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => selectSuggestedSkill(suggestion)}
                                className="w-full px-4 py-2 text-left text-xs font-headline font-bold text-slate-800 hover:bg-purple-50 hover:text-purple-900 flex items-center justify-between cursor-pointer transition-colors"
                              >
                                <span className="flex items-center gap-2">
                                  <Code2 size={13} className="text-purple-600" />
                                  {suggestion}
                                </span>
                                <Plus size={13} className="text-purple-400" />
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddSkill()}
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                    >
                      <Plus size={14} /> Add Skill
                    </button>
                  </div>
                </div>

                {/* Save & Cancel Action Buttons */}
                <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl px-7 py-3 rounded-xl font-headline font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>Save Profile Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-headline font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Role Differentiated Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-8 text-left">
          
          {/* Role Differentiated Settings Panel */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            
            {/* CLIENT Specific Role Settings */}
            {currentRole === 'client' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <h3 className="font-headline text-base font-extrabold text-slate-900">Client Escrow Preferences</h3>
                    <p className="text-xs text-slate-500 font-sans">Tailored defaults for hiring freelancers</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs font-sans">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Default Review Period Window</label>
                    <select
                      value={clientEscrowWindowDays}
                      onChange={(e) => setClientEscrowWindowDays(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                    >
                      <option value="3">3 Days (Fast Track Approval)</option>
                      <option value="7">7 Days (Standard Review)</option>
                      <option value="14">14 Days (Extended Audit)</option>
                    </select>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="font-bold text-slate-700 block">Preferred Escrow Currency Token</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setPreferredToken('USDC')}
                        className={`flex-1 p-2 rounded-xl border font-bold text-center transition-all ${
                          preferredToken === 'USDC'
                            ? 'border-blue-600 bg-blue-50 text-blue-800'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        USDC (Stable)
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreferredToken('MATIC')}
                        className={`flex-1 p-2 rounded-xl border font-bold text-center transition-all ${
                          preferredToken === 'MATIC'
                            ? 'border-purple-600 bg-purple-50 text-purple-800'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        POL / MATIC
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FREELANCER Specific Role Settings */}
            {currentRole === 'freelancer' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3 className="font-headline text-base font-extrabold text-slate-900">Freelancer Payout & Attestation</h3>
                    <p className="text-xs text-slate-500 font-sans">Proof-of-work auto-claiming setup</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                    <div>
                      <span className="font-bold text-slate-900 block">Auto-Claim Approved Milestones</span>
                      <span className="text-slate-500 text-[11px]">Trigger immediate smart contract fund release upon client approval</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={freelancerAutoClaim}
                      onChange={(e) => setFreelancerAutoClaim(e.target.checked)}
                      className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* JUDGE Specific Role Settings */}
            {currentRole === 'judge' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
                    <Scale size={18} />
                  </div>
                  <div>
                    <h3 className="font-headline text-base font-extrabold text-slate-900">DAO Jury Duty Settings</h3>
                    <p className="text-xs text-slate-500 font-sans">Arbitration alert & voting power preferences</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs font-sans">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                    <div>
                      <span className="font-bold text-amber-900 block">Arbitrator Availability</span>
                      <span className="text-slate-500 text-[11px]">Receive active dispute voting assignments</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={judgeAvailability}
                      onChange={(e) => setJudgeAvailability(e.target.checked)}
                      className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN Specific Role Settings */}
            {currentRole === 'admin' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Crown size={18} />
                  </div>
                  <div>
                    <h3 className="font-headline text-base font-extrabold text-slate-900">Protocol Admin Controls</h3>
                    <p className="text-xs text-slate-500 font-sans">Sovereign configuration parameters</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2">
                  <div className="font-headline font-bold text-emerald-900 flex items-center justify-between">
                    <span>Protocol Fee Rate</span>
                    <span className="text-emerald-700 font-mono">0.0%</span>
                  </div>
                  <p className="text-emerald-800 text-[11px] font-sans">
                    Peer-to-Peer 0% Sovereign Fee model is enforced across all PolyLance escrow smart contracts.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
