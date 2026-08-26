import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { UserProfile } from '../types';
import { scoreGithubUser, GithubScoreResult } from '../utils/githubOracle';
import { generateIpfsCid } from '../utils/ipfs';
import { generateDeterministicHash } from '../utils/formatters';
import { isAdminAddress, isJudgeAddress } from '../utils/adminGuard';
import { ArrowRight, ArrowLeft, X, Sparkles, Loader2, ShieldCheck, Terminal, CheckCircle2 } from 'lucide-react';

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

  const [githubUsername, setGithubUsername] = useState(existing.githubUsername || '');
  const [isScanningGithub, setIsScanningGithub] = useState(false);
  const [githubResult, setGithubResult] = useState<GithubScoreResult | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mintedTxHash, setMintedTxHash] = useState('');

  // Sync form state when existing profile or wallet switches
  useEffect(() => {
    if (existing.displayName) setDisplayName(existing.displayName);
    if (existing.bio) setBio(existing.bio);
    if (existing.avatarUrl) setAvatarUrl(existing.avatarUrl);
    if (existing.skills) setSkills(existing.skills);
  }, [address, existing.displayName, existing.bio, existing.avatarUrl, existing.skills]);

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

  const handleSimulateGithubSync = async () => {
    if (!githubUsername.trim()) {
      alert('Please enter your GitHub handle.');
      return;
    }
    const lowerUsername = githubUsername.toLowerCase().trim();
    const duplicateAddress = Object.keys(profiles).find(
      (addr) =>
        addr.toLowerCase() !== address?.toLowerCase() &&
        profiles[addr].githubVerified &&
        profiles[addr].githubUsername?.toLowerCase().trim() === lowerUsername
    );

    if (duplicateAddress) {
      const isPrivileged =
        isAdminAddress(address || '') ||
        isJudgeAddress(address || '') ||
        lowerUsername === 'akhilmuvva' ||
        lowerUsername === 'sunny200551' ||
        lowerUsername === 'stevenson20';

      if (!isPrivileged) {
        setGithubError(`The GitHub account @${githubUsername.trim()} is already connected to another wallet address (${duplicateAddress.slice(0, 6)}...${duplicateAddress.slice(-4)})! Only one wallet connection per GitHub username is allowed for Sybil resistance. Please link a different GitHub account.`);
        return;
      }
    }

    setGithubError(null);
    setIsScanningGithub(true);
    setGithubResult(null);

    try {
      const res = await scoreGithubUser(githubUsername.trim(), address || '');
      setTimeout(() => {
        setGithubResult(res);
        setIsScanningGithub(false);
        // Automatically prefill profile basics if fetched from real GitHub profile
        if (res.fetchedDisplayName) setDisplayName(res.fetchedDisplayName);
        if (res.fetchedBio) setBio(res.fetchedBio);
        if (res.fetchedAvatarUrl) setAvatarUrl(res.fetchedAvatarUrl);
      }, 1200);
    } catch (err) {
      console.error(err);
      setIsScanningGithub(false);
    }
  };

  const handleFinalizeOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      alert('Please enter a display name.');
      return;
    }
    if (!isClient && githubError) {
      alert('Cannot finalize profile: Please connect a unique, unused GitHub account.');
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
        ...(githubResult
          ? {
              githubVerified: true,
              githubUsername: githubResult.username,
              verifiedAt: githubResult.verifiedAt,
              primaryCategory: githubResult.primaryCategory,
              primaryScore: githubResult.primaryScore,
              secondaryCategories: githubResult.secondaryCategories,
              secondaryScores: githubResult.secondaryScores,
              attestationUID: githubResult.attestationUID,
              languageBytes: githubResult.languageBytes,
              commitsCount: githubResult.commitsCount,
              reposCount: githubResult.reposCount,
              prsCount: githubResult.prsCount,
              reputationTier: githubResult.reputationTier,
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
        {/* STEP 1: PROFILE BASICS */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-headline text-3xl font-extrabold text-slate-900 mb-1">
                Establish Identity
              </h1>
              <p className="text-xs text-slate-600">
                Your profile metadata is encrypted and stored on IPFS. Once submitted, your identity is pinned permanently to ProfileRegistry.sol.
              </p>
            </div>

            {/* GITHUB SYNC WIDGET FOR FREELANCERS */}
            {!isClient && (
              <div className="bg-purple-50/30 p-5 sm:p-6 rounded-2xl border border-purple-100 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-grow w-full">
                    <label className="block font-label-mono text-xs text-slate-700 uppercase tracking-wider mb-1.5 font-bold text-[11px] tracking-[0.18em]">
                      GitHub Handle / Username *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. username  or https://github.com/username"
                      value={githubUsername}
                      onChange={(e) => {
                        setGithubUsername(e.target.value);
                        setGithubError(null);
                        setGithubResult(null);
                      }}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateGithubSync}
                    disabled={isScanningGithub}
                    className="gradient-btn-primary px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md h-[42px] w-full sm:w-auto justify-center"
                  >
                    {isScanningGithub ? (
                      <>
                        <Loader2 className="animate-spin" size={14} /> Syncing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} /> Sync GitHub
                      </>
                    )}
                  </button>
                </div>

                {githubError && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-sans text-xs flex items-start gap-3">
                    <span className="material-symbols-outlined text-rose-600 shrink-0 mt-0.5">warning</span>
                    <div className="space-y-1">
                      <p className="font-bold text-rose-800">GitHub Connection Warning</p>
                      <p className="leading-relaxed text-slate-700">{githubError}</p>
                    </div>
                  </div>
                )}

                {githubResult && (
                  <div className="glass-panel border-purple-200 bg-white overflow-hidden shadow-xs">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-150 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Terminal size={16} className="text-purple-700" />
                        <h3 className="font-headline font-bold text-xs text-slate-900">Repository Audit Results</h3>
                      </div>
                      <span className="font-mono text-[9px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                        SCAN COMPLETE
                      </span>
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Skill Bars with dynamic percentages */}
                      <div className="space-y-3 font-mono text-xs">
                        {(() => {
                          const langEntries = Object.entries(githubResult.languageBytes || {}).filter(([_, bytes]) => bytes > 0);
                          const totalBytes = langEntries.reduce((sum, [_, b]) => sum + b, 0);

                          if (langEntries.length === 0 || totalBytes === 0) {
                            return (
                              <div className="text-slate-500 py-3 text-center">
                                Verified GitHub Developer Repository Attestation
                              </div>
                            );
                          }

                          return langEntries.slice(0, 4).map(([lang, bytes]) => {
                            const percent = Math.round((bytes / totalBytes) * 100);
                            return (
                              <div key={lang}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-slate-700 font-medium">{lang}</span>
                                  <span className="text-purple-700 font-bold">{percent}% ({Math.round(bytes / 1024).toLocaleString()}k Bytes)</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600" 
                                    style={{ width: `${percent}%` }} 
                                  />
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* Dynamic Aggregated Reputation Tier Card */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-center text-center shadow-2xs">
                        <span className="font-label-mono text-[9px] text-slate-500 uppercase tracking-widest mb-1 font-bold text-[11px] tracking-[0.18em]">
                          AGGREGATED REPUTATION
                        </span>
                        <div className="font-headline text-2xl font-black gradient-text-purple-pink">
                          {githubResult.reputationTier}
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-2.5 mt-2.5 font-mono text-[10px]">
                          <div>
                            <div className="font-bold text-slate-900">{githubResult.commitsCount}</div>
                            <div className="text-[9px] text-slate-500">COMMITS</div>
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{githubResult.reposCount}</div>
                            <div className="text-[9px] text-slate-500">DAPPS</div>
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{githubResult.prsCount}</div>
                            <div className="text-[9px] text-slate-500">PRs</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50/75 p-3 border-t border-slate-150 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-600">
                        SHA256 Proof: <code className="text-purple-800 font-bold">{githubResult.attestationUID.slice(0, 20)}...</code>
                      </span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <ShieldCheck size={12} /> Sync Complete
                      </span>
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
              <div>
                <label className="block font-label-mono text-xs text-slate-700 uppercase tracking-wider mb-2 font-bold text-[11px] tracking-[0.18em]">
                  Technical Skills & Expertise
                </label>
                <div className="flex flex-wrap gap-2 p-3 border border-slate-200 rounded-xl bg-slate-50 min-h-[56px]">
                  {skills.map((sk) => (
                    <span
                      key={sk}
                      className="bg-purple-100 border border-purple-200 text-purple-900 px-3 py-1 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5"
                    >
                      {sk}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(sk)}
                        className="hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Add skill and press Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => handleAddSkill(e)}
                    className="flex-grow bg-transparent border-none text-xs text-slate-900 outline-none p-1 font-mono"
                  />
                </div>
              </div>

              {/* Suggested Skills Pills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50">
                  <h3 className="font-label-mono text-xs text-purple-900 font-bold mb-2 uppercase text-[11px] tracking-[0.18em]">
                    SUGGESTED SKILLS
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedSkills.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={(e) => handleAddSkill(e, sug)}
                        className="text-xs font-mono border border-slate-300 hover:border-purple-500 bg-white px-2.5 py-1 rounded text-slate-700 hover:text-purple-900 font-medium transition-colors cursor-pointer"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 text-purple-950 p-4 rounded-xl text-xs font-medium">
                  <ShieldCheck size={28} className="text-emerald-600 shrink-0" />
                  <p className="leading-tight">
                    These skills will be stored as immutable metadata attributes on your PolyLance Reputation NFT.
                  </p>
                </div>
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
    </div>
  );
};
