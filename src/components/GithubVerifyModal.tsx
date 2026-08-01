import React, { useState } from 'react';
import { scoreGithubUser, GithubScoreResult } from '../utils/githubOracle';
import { Github, CheckCircle2, Loader2, Sparkles, X, ShieldCheck } from 'lucide-react';

interface GithubVerifyModalProps {
  userAddress: string;
  isOpen: boolean;
  onClose: () => void;
  onVerified: (res: GithubScoreResult) => void;
}

export const GithubVerifyModal: React.FC<GithubVerifyModalProps> = ({
  userAddress,
  isOpen,
  onClose,
  onVerified,
}) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GithubScoreResult | null>(null);

  if (!isOpen) return null;

  const handleScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      // Runs client-side oracle scoring simulator (mirrors oracle/githubScorer.js)
      const res = await scoreGithubUser(username.trim(), userAddress);
      setTimeout(() => {
        setResult(res);
        setLoading(false);
      }, 700);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleConfirmOnChain = () => {
    if (result) {
      onVerified(result);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel max-w-md w-full p-6 relative border-indigo-500/30 bg-slate-950 shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
            <Github className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-heading">
              GitHub Reputation Verification
            </h3>
            <p className="text-xs text-slate-400">
              Oracle scores language-byte breakdown across public non-fork repos
            </p>
          </div>
        </div>

        {!result ? (
          <form onSubmit={handleScore} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                GitHub Handle / Username *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SatoshiNakamoto"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full glass-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-btn-primary py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Calculating Language Bytes...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Calculate Skill Score Breakdown
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            {/* Real Skill Breakdown Card (Section 7 Spec) */}
            <div className="glass-panel p-5 border-emerald-500/30 bg-slate-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} /> GitHub Verified profile: @{result.username}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(result.verifiedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Primary Focus Headline Badge */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
                    Primary Skill Focus
                  </span>
                  <h4 className="text-base font-bold text-white capitalize font-heading">
                    {result.primaryCategory}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                    {result.primaryScore}
                  </span>
                  <span className="text-xs text-slate-500 font-mono"> / 1000</span>
                </div>
              </div>

              {/* Secondary Skills Breakdown List */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Secondary Skill Breakdown:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {result.secondaryCategories.map((cat, idx) => (
                    <div
                      key={cat}
                      className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-slate-300 capitalize">{cat}</span>
                      <span className="text-indigo-300 font-bold">
                        {result.secondaryScores[idx]} / 1000
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Oracle Attestation Sign details */}
              <div className="text-[10px] font-mono text-slate-500 bg-slate-950 p-2 rounded border border-slate-900 truncate">
                Attestation Hash: {result.attestationUID.slice(0, 24)}...
              </div>
            </div>

            <button
              onClick={handleConfirmOnChain}
              className="w-full gradient-btn-emerald py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
            >
              <ShieldCheck size={18} />
              Submit Signed Attestation On-Chain
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
