import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { scoreGithubUser, GithubScoreResult } from '../utils/githubOracle';
import { generateIpfsCid } from '../utils/ipfs';
import { ArrowRight, ArrowLeft, X, Sparkles, Loader2, ShieldCheck, Terminal, CheckCircle2, Award, Star, Copy, Lock, Shield } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { address, currentRole } = useWeb3();
  const { profiles, updateProfile } = usePolyLanceData();
  const navigate = useNavigate();

  const existing = profiles[address] || {};
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
        return; // Only proceed if Enter is pressed
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
    setIsScanningGithub(true);
    setGithubResult(null);

    try {
      const res = await scoreGithubUser(githubUsername.trim(), address);
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

  const handleFinalizeOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      alert('Please enter a display name.');
      return;
    }

    const profileIpfsCid = generateIpfsCid({ displayName, bio, avatarUrl, timestamp: Date.now() });
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    updateProfile(
      {
        displayName,
        bio,
        avatarUrl,
        ipfsHash: profileIpfsCid,
        skills,
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
      address
    );

    setMintedTxHash(txHash);
    setShowSuccessModal(true);
  };

  const stepLabels = ['Profile Basics & Verification', 'Add Skills'];
  const progressPercent = Math.round((step / 2) * 100);

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      {/* Onboarding Header & Stepper matching reference HTML */}
      {isClient ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="font-bold text-purple-800 uppercase tracking-widest">
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
            <span className="font-bold text-purple-800 uppercase tracking-widest">
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
                  <div className="flex-grow">
                    <label className="block font-label-mono text-xs text-slate-700 uppercase tracking-wider mb-1.5 font-bold">
                      GitHub Handle / Username *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. sunny200551 or https://github.com/sunny200551"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateGithubSync}
                    disabled={isScanningGithub}
                    className="gradient-btn-primary px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md h-[42px]"
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
                          const totalBytes = (githubResult.languageBytes.Solidity || 0) +
                            (githubResult.languageBytes.Rust || 0) +
                            (githubResult.languageBytes.TypeScript || 0) +
                            (githubResult.languageBytes.Go || 0);

                          const web3Percent = totalBytes > 0 ? Math.round(((githubResult.languageBytes.Solidity || 0) + (githubResult.languageBytes.Rust || 0)) / totalBytes * 100) : 0;
                          const frontendPercent = totalBytes > 0 ? Math.round((githubResult.languageBytes.TypeScript || 0) / totalBytes * 100) : 0;
                          const backendPercent = totalBytes > 0 ? Math.round((githubResult.languageBytes.Go || 0) * 0.85 / totalBytes * 100) : 0;
                          const mobilePercent = totalBytes > 0 ? Math.max(0, 100 - web3Percent - frontendPercent - backendPercent) : 0;

                          return (
                            <>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-slate-700 font-medium">Web3 & Smart Contracts</span>
                                  <span className="text-purple-700 font-bold">{web3Percent}%</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-600" style={{ width: `${web3Percent}%` }} />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-slate-700 font-medium">Frontend (React/Next)</span>
                                  <span className="text-purple-700 font-bold">{frontendPercent}%</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-500" style={{ width: `${frontendPercent}%` }} />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-slate-700 font-medium">Backend Systems</span>
                                  <span className="text-purple-700 font-bold">{backendPercent}%</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-500" style={{ width: `${backendPercent}%` }} />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-slate-700 font-medium">Mobile Apps</span>
                                  <span className="text-purple-700 font-bold">{mobilePercent}%</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-slate-400" style={{ width: `${mobilePercent}%` }} />
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Dynamic Aggregated Reputation Tier Card */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-center text-center shadow-2xs">
                        <span className="font-label-mono text-[9px] text-slate-500 uppercase tracking-widest mb-1 font-bold">
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
                <span className="font-label-mono text-[10px] text-slate-500 font-bold mt-2">AVATAR (IPFS)</span>
              </div>

              <div className="md:col-span-3 space-y-4">
                <div>
                  <label className="block font-label-mono text-xs text-slate-700 uppercase tracking-wider mb-1 font-bold">
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
                    <span className="text-[10px] font-label-mono text-slate-500 uppercase tracking-wider font-bold block">
                      Or Choose a Preset Logo/Avatar:
                    </span>
                    <div className="flex gap-2">
                      {isClient ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80')}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-purple-650 transition-all hover:scale-105 active:scale-95"
                          >
                            <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80" alt="Preset Building 1" className="w-full h-full object-cover" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1549692520-acc6669e2f0c?w=150&auto=format&fit=crop&q=80')}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-purple-650 transition-all hover:scale-105 active:scale-95"
                          >
                            <img src="https://images.unsplash.com/photo-1549692520-acc6669e2f0c?w=150&auto=format&fit=crop&q=80" alt="Preset Logo 2" className="w-full h-full object-cover" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1497366216548-37526070297c?w=150&auto=format&fit=crop&q=80')}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-purple-650 transition-all hover:scale-105 active:scale-95"
                          >
                            <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=150&auto=format&fit=crop&q=80" alt="Preset Office 3" className="w-full h-full object-cover" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-purple-650 transition-all hover:scale-105 active:scale-95"
                          >
                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" alt="Preset Avatar 1" className="w-full h-full object-cover" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80')}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-purple-650 transition-all hover:scale-105 active:scale-95"
                          >
                            <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80" alt="Preset Avatar 2" className="w-full h-full object-cover" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80')}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-purple-650 transition-all hover:scale-105 active:scale-95"
                          >
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" alt="Preset Avatar 3" className="w-full h-full object-cover" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-label-mono text-xs text-slate-700 uppercase tracking-wider mb-1 font-bold">
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
                  <label className="block font-label-mono text-xs text-slate-700 uppercase tracking-wider mb-1 font-bold">
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
                  className="gradient-btn-emerald px-10 py-3.5 rounded-xl font-headline font-bold text-sm flex items-center gap-2 shadow-md"
                >
                  <Sparkles size={16} /> Finalize & Save Client Profile
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="gradient-btn-primary px-8 py-3 rounded-xl font-headline font-bold text-sm flex items-center gap-2"
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
                <label className="block font-label-mono text-xs text-slate-700 uppercase tracking-wider mb-2 font-bold">
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
                        className="hover:text-rose-600 transition-colors"
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

              {/* Suggested Skills Pills matching reference HTML */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50">
                  <h3 className="font-label-mono text-xs text-purple-900 font-bold mb-2 uppercase">
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
                className="text-slate-600 hover:text-slate-900 font-mono text-xs flex items-center gap-1.5 font-bold"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <button
                type="submit"
                className="gradient-btn-emerald px-10 py-3.5 rounded-xl font-headline font-bold text-sm flex items-center gap-2 shadow-md"
              >
                <Sparkles size={16} /> Finalize & Mint On-Chain Identity
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Success Screen Overlay Modal matching reference HTML */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-md w-full text-center border-purple-200 bg-white hard-shadow space-y-5 relative overflow-hidden">
            {/* Background design elements to mimic Stripe/Linear style */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.06),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.05),transparent_50%)] pointer-events-none" />
            
            {/* Pulsing Hexagonal Verified Badge */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              {/* Glow */}
              <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
              
              {/* Hexagon shape */}
              <svg className="w-16 h-16 drop-shadow-[0_6px_12px_rgba(99,102,241,0.2)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
                <path d="M50 5 L90 28 L90 72 L50 95 L10 72 L10 28 Z" fill="url(#hexGrad)" />
                <path d="M50 10 L82 29 L82 71 L50 90 L18 71 L18 29 Z" fill="#ffffff" opacity="0.9" />
                <path d="M50 15 L74 30 L74 70 L50 85 L26 70 L26 30 Z" fill="url(#hexGrad)" opacity="0.15" />
              </svg>
              {/* Check Icon centered inside the Hexagon */}
              <div className="absolute inset-0 flex items-center justify-center text-indigo-605">
                <ShieldCheck size={26} className="drop-shadow-[0_2px_4px_rgba(99,102,241,0.4)] animate-pulse" />
              </div>
            </div>

            {/* Title and Description */}
            <div className="space-y-2">
              <h2 className="font-headline text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950">
                Your Reputation Journey Begins
              </h2>
              <p className="text-[11px] text-slate-550 leading-relaxed font-sans max-w-sm mx-auto">
                Your decentralized professional identity is now verified and ready. Start building your on-chain reputation and earn trust with every successful collaboration.
              </p>
            </div>

            {/* On-Chain Verification Section with Clipboard */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left flex items-center gap-3 w-full">
              <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shrink-0 shadow-3xs">
                <ShieldCheck size={18} />
              </div>
              <div className="flex-grow min-w-0 font-mono">
                <span className="text-[10px] font-bold text-slate-900 block leading-tight">On-Chain Verification</span>
                <code className="text-[9px] text-purple-800 font-bold block truncate mt-0.5 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {mintedTxHash}
                </code>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(mintedTxHash);
                  alert('Transaction hash copied to clipboard!');
                }}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shrink-0 text-slate-500 hover:text-indigo-600"
                title="Copy Hash"
              >
                <Copy size={12} />
              </button>
            </div>

            {/* Benefits Cards Section */}
            <div className="grid grid-cols-2 gap-2 text-left w-full">
              {/* Card 1: Verified Identity */}
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-150 flex gap-2 hover:border-purple-200 transition-all">
                <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 shadow-3xs">
                  <Shield size={12} />
                </div>
                <div>
                  <h4 className="font-extrabold text-[10px] text-slate-900 font-heading leading-tight">Verified Profile</h4>
                  <p className="text-[8.5px] text-slate-500 font-sans mt-0.5 leading-tight">Secured on-chain forever.</p>
                </div>
              </div>

              {/* Card 2: On-Chain Reputation */}
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-150 flex gap-2 hover:border-purple-200 transition-all">
                <div className="w-6 h-6 rounded bg-purple-50 text-purple-650 flex items-center justify-center shrink-0 border border-purple-100 shadow-3xs">
                  <Award size={12} />
                </div>
                <div>
                  <h4 className="font-extrabold text-[10px] text-slate-900 font-heading leading-tight">On-Chain Cred</h4>
                  <p className="text-[8.5px] text-slate-500 font-sans mt-0.5 leading-tight">Every completed job builds trust.</p>
                </div>
              </div>

              {/* Card 3: Smart Contract Ready */}
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-150 flex gap-2 hover:border-purple-200 transition-all">
                <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-3xs">
                  <Lock size={12} />
                </div>
                <div>
                  <h4 className="font-extrabold text-[10px] text-slate-900 font-heading leading-tight">Smart Escrow</h4>
                  <p className="text-[8.5px] text-slate-500 font-sans mt-0.5 leading-tight">Secure transparent payments.</p>
                </div>
              </div>

              {/* Card 4: Unlock Better Opportunities */}
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-150 flex gap-2 hover:border-purple-200 transition-all">
                <div className="w-6 h-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 shadow-3xs">
                  <Star size={12} />
                </div>
                <div>
                  <h4 className="font-extrabold text-[10px] text-slate-900 font-heading leading-tight">Get Visibility</h4>
                  <p className="text-[8.5px] text-slate-500 font-sans mt-0.5 leading-tight">Higher ranking, premium clients.</p>
                </div>
              </div>
            </div>

            {/* Launch My Dashboard CTA Button */}
            <div className="max-w-xs mx-auto pt-1 w-full">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-650 text-white rounded-xl font-headline font-black text-xs shadow-md hover:shadow-lg transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Launch My Dashboard ⭐
              </button>
            </div>

            {/* Premium Footer Quote */}
            <p className="text-[9px] font-mono text-purple-700 font-bold tracking-wide border-t border-slate-100 pt-3 w-full">
              ✦ Reputation isn't claimed—it’s earned, verified, and stored on-chain.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
