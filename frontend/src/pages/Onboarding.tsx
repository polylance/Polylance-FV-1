import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { scoreGithubUser, GithubScoreResult } from '../utils/githubOracle';
import { generateIpfsCid } from '../utils/ipfs';
import { ArrowRight, ArrowLeft, X, Sparkles, Loader2, ShieldCheck, Terminal, CheckCircle2 } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { address } = useWeb3();
  const { profiles, updateProfile } = usePolyLanceData();
  const navigate = useNavigate();

  const existing = profiles[address] || {};

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [displayName, setDisplayName] = useState(existing.displayName || '');
  const [bio, setBio] = useState(existing.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(
    existing.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );
  const [skills, setSkills] = useState<string[]>(existing.skills || ['Solidity', 'TypeScript', 'Ethers.js']);
  const [tagInput, setTagInput] = useState('');

  const [githubUsername, setGithubUsername] = useState('');
  const [isScanningGithub, setIsScanningGithub] = useState(false);
  const [githubResult, setGithubResult] = useState<GithubScoreResult | null>(null);
  const [commitToChain, setCommitToChain] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mintedTxHash, setMintedTxHash] = useState('');

  const suggestedSkills = ['React', 'The Graph', 'IPFS', 'Next.js', 'Hardhat', 'Rust', 'Go', 'Circom'];

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent, skillName?: string) => {
    if (e) e.preventDefault();
    const toAdd = skillName || tagInput.trim();
    if (toAdd && !skills.includes(toAdd)) {
      setSkills([...skills, toAdd]);
      if (!skillName) setTagInput('');
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
        ...(githubResult && commitToChain
          ? {
              githubVerified: true,
              githubUsername: githubResult.username,
              verifiedAt: githubResult.verifiedAt,
              primaryCategory: githubResult.primaryCategory,
              primaryScore: githubResult.primaryScore,
              secondaryCategories: githubResult.secondaryCategories,
              secondaryScores: githubResult.secondaryScores,
              attestationUID: githubResult.attestationUID,
            }
          : {}),
      },
      address
    );

    setMintedTxHash(txHash);
    setShowSuccessModal(true);
  };

  const stepLabels = ['Profile Basics', 'Add Skills', 'GitHub Verify'];
  const progressPercent = Math.round((step / 3) * 100);

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      {/* Onboarding Header & Stepper matching reference HTML */}
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
              <button
                type="button"
                onClick={() => setStep(2)}
                className="gradient-btn-primary px-8 py-3 rounded-xl font-headline font-bold text-sm flex items-center gap-2"
              >
                Next Stage <ArrowRight size={16} />
              </button>
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
                type="button"
                onClick={() => setStep(3)}
                className="gradient-btn-primary px-8 py-3 rounded-xl font-headline font-bold text-sm flex items-center gap-2"
              >
                Next Stage <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GITHUB VERIFICATION & REPOSITORY AUDIT */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-headline text-3xl font-extrabold text-slate-900 mb-1">
                Verified Proof-of-Work Audit
              </h1>
              <p className="text-xs text-slate-600">
                Synchronize your GitHub repositories to generate verified performance scores audited by the Oracle engine.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block font-label-mono text-xs text-slate-700 uppercase tracking-wider mb-2 font-bold">
                  GitHub Handle / Username *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. polycoder-dev"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    className="flex-grow glass-input text-xs"
                  />
                  <button
                    type="button"
                    disabled={isScanningGithub}
                    onClick={handleSimulateGithubSync}
                    className="gradient-btn-primary px-6 py-3 rounded-xl font-mono text-xs font-bold flex items-center gap-2"
                  >
                    {isScanningGithub ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Scanning Repos...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">sync</span> Sync GitHub
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* GitHub Repository Audit Results matching reference HTML */}
              {githubResult && (
                <div className="border border-purple-200 rounded-xl overflow-hidden bg-slate-50 space-y-4">
                  <div className="bg-white px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Terminal size={16} className="text-purple-700" />
                      <h3 className="font-headline font-bold text-sm text-slate-900">Repository Audit Results</h3>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded border border-emerald-300 font-bold">
                      SCAN COMPLETE
                    </span>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Skill Bars matching reference spec */}
                    <div className="space-y-3 font-mono text-xs">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-700 font-medium">Web3 & Smart Contracts</span>
                          <span className="text-purple-700 font-bold">88%</span>
                        </div>
                        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-600" style={{ width: '88%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-700 font-medium">Frontend (React/Next)</span>
                          <span className="text-purple-700 font-bold">72%</span>
                        </div>
                        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-500" style={{ width: '72%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-700 font-medium">Backend Systems</span>
                          <span className="text-purple-700 font-bold">45%</span>
                        </div>
                        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: '45%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-700 font-medium">Mobile Apps</span>
                          <span className="text-purple-700 font-bold">15%</span>
                        </div>
                        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-400" style={{ width: '15%' }} />
                        </div>
                      </div>
                    </div>

                    {/* Aggregated Reputation Tier Card matching reference HTML */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-center text-center shadow-xs">
                      <span className="font-label-mono text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">
                        AGGREGATED REPUTATION
                      </span>
                      <div className="font-headline text-3xl font-black gradient-text-purple-pink">
                        PLATINUM
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-3 mt-3 font-mono text-xs">
                        <div>
                          <div className="font-bold text-slate-900">4.2k</div>
                          <div className="text-[10px] text-slate-500">COMMITS</div>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">12</div>
                          <div className="text-[10px] text-slate-500">DAPPS</div>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">98</div>
                          <div className="text-[10px] text-slate-500">PRs</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <span className="text-slate-600">
                      SHA256 Proof: <code className="text-purple-800 font-bold">{githubResult.attestationUID.slice(0, 20)}...</code>
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer text-purple-900 font-bold">
                      <input
                        type="checkbox"
                        checked={commitToChain}
                        onChange={(e) => setCommitToChain(e.target.checked)}
                        className="rounded border-slate-300 text-purple-700 focus:ring-purple-600"
                      />
                      <span>Commit these scores to on-chain profile</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-panel p-8 sm:p-10 rounded-2xl max-w-md w-full text-center border-purple-200 bg-white hard-shadow space-y-6">
            <div className="w-20 h-20 bg-emerald-100 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto text-emerald-700 shadow-md">
              <CheckCircle2 size={48} />
            </div>

            <div className="space-y-2">
              <h2 className="font-headline text-2xl font-black text-slate-900">
                Immutable Identity Established
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your profile has been minted to ProfileRegistry.sol. You are now a verified professional on PolyLance.
              </p>
            </div>

            <div className="font-data-hash text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200 text-purple-900 font-bold break-all">
              TX Hash: {mintedTxHash}
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="gradient-btn-emerald w-full py-3.5 rounded-xl font-headline font-bold text-sm shadow-md"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
