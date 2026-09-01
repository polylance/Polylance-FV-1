import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, ShieldCheck, Award, Briefcase, Star, Clock, CheckCircle2,
  TrendingUp, Github, ExternalLink, Sparkles, Code2, GitCommit, GitPullRequest,
  Check, FileText, Layers, Trophy
} from 'lucide-react';
import { UserProfile, Application } from '../types';
import { truncateAddress } from '../utils/formatters';
import { transition } from '../lib/motion';

interface UserProfileBioModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicantAddress: string;
  profile?: UserProfile | null;
  applicantData?: Application;
  completedCount?: number;
  onTimeRate?: string;
  progressAvg?: string;
  commitsCount?: number;
  prsCount?: number;
  soulboundCount?: number;
}

export const UserProfileBioModal: React.FC<UserProfileBioModalProps> = ({
  isOpen,
  onClose,
  applicantAddress,
  profile,
  applicantData,
  completedCount = 0,
  onTimeRate = '100%',
  progressAvg = '98%',
  commitsCount = 0,
  prsCount = 0,
  soulboundCount = 0,
}) => {
  const modalContentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (modalContentRef.current) {
        modalContentRef.current.scrollTop = 0;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const displayName = profile?.displayName || truncateAddress(applicantAddress);
  const bio = profile?.bio || applicantData?.proposalText || 'No biography provided for this candidate.';
  const skills: string[] = profile?.skills && profile.skills.length > 0 ? profile.skills : (applicantData?.applicantSkills || ['Solidity', 'React', 'Smart Contracts']);
  const isVerified = Boolean(profile?.githubVerified || applicantData?.githubVerified);
  const githubUsername = profile?.githubUsername || 'verified-dev';
  const score = profile?.primaryScore || applicantData?.githubScore || 85;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          ref={modalContentRef}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={transition.spring}
          className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 z-10 space-y-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Top Header with Avatar and Cancel (X) */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0 uppercase">
                {displayName.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-headline text-lg sm:text-xl font-black text-slate-900 truncate">
                    {displayName}
                  </h3>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <CheckCircle2 size={11} className="text-emerald-600" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-slate-500 mt-0.5 truncate">
                  {applicantAddress}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-bold font-mono text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                    ⭐ {score}/100 Score
                  </span>
                  <span className="text-[11px] font-bold font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    🛡️ {soulboundCount} SBT Badges
                  </span>
                </div>
              </div>
            </div>

            {/* Top Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Close popup"
            >
              <X size={20} />
            </button>
          </div>

          {/* Full Bio Section */}
          <div className="space-y-2 bg-[#FAF8FF] p-4 sm:p-5 rounded-2xl border border-purple-100/90">
            <div className="flex items-center gap-2 text-purple-800 font-headline font-bold text-xs uppercase tracking-wider">
              <Award size={14} className="text-purple-600" />
              <span>Full Biography & Attestations</span>
            </div>
            <p className="font-sans text-xs sm:text-[13px] text-slate-800 leading-relaxed whitespace-pre-wrap">
              {bio}
            </p>
          </div>

          {/* Skills & Tech Stack */}
          {skills.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-headline font-bold text-xs text-slate-700 uppercase tracking-wider">
                Skills & Technical Expertise
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-mono font-bold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* On-Chain Metrics Grid */}
          <div className="space-y-2">
            <h4 className="font-headline font-bold text-xs text-slate-700 uppercase tracking-wider">
              Verified On-Chain Track Record
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block">Jobs Completed</span>
                <span className="font-headline font-black text-slate-900 text-lg block">{completedCount}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block">On-Time Rate</span>
                <span className="font-headline font-black text-emerald-700 text-lg block">{onTimeRate}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block">GitHub Commits</span>
                <span className="font-headline font-black text-slate-900 text-lg block">{commitsCount}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block">PRs Merged</span>
                <span className="font-headline font-black text-slate-900 text-lg block">{prsCount}</span>
              </div>
            </div>
          </div>

          {/* Linked GitHub & Social Attestation */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Github size={20} className="text-slate-900 shrink-0" />
              <div>
                <span className="text-[10.5px] font-mono text-slate-500 font-bold uppercase block">
                  Verified GitHub Identity
                </span>
                <a
                  href={`https://github.com/${githubUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>@{githubUsername}</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Identity Verified
            </span>
          </div>

          {/* Bottom Action Footer with Cancel Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
