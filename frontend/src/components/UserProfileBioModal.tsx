import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award, CheckCircle2,
  Github, ExternalLink, ArrowRight
} from 'lucide-react';
import { UserProfile, Application } from '../types';
import { truncateAddress } from '../utils/formatters';
import { getUserBytecodeMatrix } from '../utils/githubOracle';
import { GithubEkycCard } from './GithubEkycCard';
import { scrollToSection } from '../utils/scroll';
import { Modal } from './overlay';
import { Button } from './common/Button';

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
  commitsCount = 0,
  prsCount = 0,
  soulboundCount = 0,
}) => {
  const navigate = useNavigate();

  const displayName = profile?.displayName || truncateAddress(applicantAddress);
  const bio = profile?.bio || applicantData?.proposalText || 'No biography provided for this candidate.';
  const skills: string[] = profile?.skills && profile.skills.length > 0 ? profile.skills : (applicantData?.applicantSkills || ['Solidity', 'React', 'Smart Contracts']);
  const isVerified = Boolean(profile?.githubVerified || applicantData?.githubVerified);
  const githubUsername = profile?.githubUsername || 'verified-dev';

  const bytecodeMatrix = getUserBytecodeMatrix(
    profile || { address: applicantAddress, skills, githubVerified: isVerified },
    completedCount
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B0B0F] border border-slate-800 text-white font-bold text-sm flex items-center justify-center uppercase shrink-0">
            {displayName.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-base truncate">{displayName}</span>
              {isVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EAF1FB] text-[#0047AB] border border-[#C9DAF2]">
                  <CheckCircle2 size={11} /> Verified
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-slate-500 truncate">{applicantAddress}</p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              onClose();
              navigate(`/profile/${applicantAddress}?section=reputation-overview`);
              scrollToSection('reputation-overview');
            }}
          >
            <span>View Full Profile</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-xs font-sans">
        {/* Tier and Score Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium font-sans text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
            {bytecodeMatrix.primaryScore}/1,000 Score
          </span>
          <span className="text-[11px] font-medium font-sans text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
            {bytecodeMatrix.reputationTier}
          </span>
          <span className="text-[11px] font-medium font-sans text-[#0047AB] bg-[#EAF1FB] border border-[#C9DAF2] px-2.5 py-0.5 rounded-md">
            {soulboundCount} Badges
          </span>
        </div>

        {/* Full Bio Section */}
        <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs tracking-wide">
            <Award size={14} className="text-[#0047AB]" />
            <span>Biography & Attestations</span>
          </div>
          <p className="font-sans text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {bio}
          </p>
        </div>

        {/* Skills & Tech Stack */}
        {skills.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="font-semibold text-xs text-slate-700">
              Skills & Technical Expertise
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="space-y-1.5">
          <h4 className="font-semibold text-xs text-slate-700">
            Track Record
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">Jobs Completed</span>
              <span className="font-semibold text-slate-900 text-base block mt-0.5 font-sans tabular-nums">{completedCount}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">On-Time Rate</span>
              <span className="font-semibold text-slate-900 text-base block mt-0.5 font-sans tabular-nums">{onTimeRate}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">GitHub Commits</span>
              <span className="font-semibold text-slate-900 text-base block mt-0.5 font-sans tabular-nums">{commitsCount}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">PRs Merged</span>
              <span className="font-semibold text-slate-900 text-base block mt-0.5 font-sans tabular-nums">{prsCount}</span>
            </div>
          </div>
        </div>

        {/* Audited Code Byte Matrix */}
        <GithubEkycCard
          bytecodeMatrix={bytecodeMatrix}
          userProfile={profile}
          onboardingLink={false}
        />

        {/* Linked GitHub & Social Attestation */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Github size={18} className="text-slate-900 shrink-0" />
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">
                Verified GitHub Identity
              </span>
              <a
                href={`https://github.com/${githubUsername}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-[#0047AB] hover:underline flex items-center gap-1"
              >
                <span>@{githubUsername}</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded text-xs font-medium bg-[#EAF1FB] text-[#0047AB] border border-[#C9DAF2]">
            Identity Verified
          </span>
        </div>
      </div>
    </Modal>
  );
};
