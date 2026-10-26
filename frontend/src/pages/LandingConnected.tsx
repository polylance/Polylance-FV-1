import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  MessageSquare, 
  PlusCircle, 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Award,
  Wallet,
  Sparkles,
  HelpCircle,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { truncateAddress } from '../utils/formatters';
import { WatchButton } from '../components/video';
import { Button } from '../components/common/Button';
import { TokenAmount } from '../components/common/TokenAmount';
import { getJobAmounts } from '../lib/amounts/getJobAmounts';

interface LandingConnectedProps {
  address: string;
  jobs: any[];
  profiles: Record<string, any>;
  balanceNative?: string;
  balanceUsdc?: string;
  onOpenVideo?: (id: string) => void;
}

export const LandingConnected: React.FC<LandingConnectedProps> = ({
  address,
  jobs,
  profiles,
  balanceNative = '0.00',
  balanceUsdc = '0.00',
  onOpenVideo,
}) => {
  const [role, setRole] = useState<'work' | 'hire'>('work');

  const userAddr = (address || '').toLowerCase();
  const profileKey = Object.keys(profiles || {}).find((k) => k.toLowerCase() === userAddr);
  const currentProfile = profileKey ? profiles[profileKey] : null;

  const displayName = currentProfile?.displayName || truncateAddress(address);

  // Real user jobs
  const userJobs = (jobs || []).filter((j) => {
    if (j.isDemo) return false;
    const clientMatch = j.client && j.client.toLowerCase() === userAddr;
    const freelancerMatch = j.freelancer && j.freelancer.toLowerCase() === userAddr;
    return role === 'hire' ? clientMatch : freelancerMatch;
  });

  const activeJobs = userJobs.filter((j) => j.status !== 'Completed' && j.status !== 'Cancelled');
  const completedJobs = userJobs.filter((j) => j.status === 'Completed');

  // Spend or Earnings calculation
  const totalVolume = completedJobs.reduce((acc, j) => {
    const val = parseFloat(getJobAmounts(j).effectiveAmount || '0') || 0;
    return acc + val;
  }, 0);

  // Profile completeness calculation
  const hasAvatar = Boolean(currentProfile?.avatarUrl || currentProfile?.githubUsername);
  const hasBio = Boolean(currentProfile?.bio);
  const hasSkills = Boolean(currentProfile?.skills && currentProfile.skills.length > 0);
  const completenessSteps = [hasAvatar, hasBio, hasSkills];
  const completedStepsCount = completenessSteps.filter(Boolean).length;
  const completenessPercent = Math.round((completedStepsCount / completenessSteps.length) * 100);

  // "Needs your attention"
  const attentionItems = [];
  if (role === 'work') {
    const inProgressJobs = activeJobs.filter((j) => j.status === 'Funded' || j.status === 'In progress');
    if (inProgressJobs.length > 0) {
      attentionItems.push({
        title: 'Work to submit',
        desc: `${inProgressJobs.length} active milestone awaiting deliverable submission.`,
        link: '/workspace',
        cta: 'Open workspace',
      });
    }
  } else {
    const reviewJobs = activeJobs.filter((j) => j.status === 'Submitted');
    if (reviewJobs.length > 0) {
      attentionItems.push({
        title: 'Deliverables to review',
        desc: `${reviewJobs.length} milestone submitted for your review. Approve to release escrow.`,
        link: '/workspace',
        cta: 'Review deliverables',
      });
    }
  }

  // Recommended open jobs
  const openJobs = (jobs || []).filter((j) => !j.isDemo && j.status === 'Open').slice(0, 4);

  return (
    <div className="w-full text-[#0B0B0F] font-sans">
      <div className="bg-white border-b border-[#E5E7EB] py-8 sm:py-10">
        <PageContainer>
          
          {/* 1. Greeting Header & Role Switch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span className="text-xs font-semibold text-[#0047AB] uppercase tracking-wider">
                  Connected on Polygon
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0B0B0F] mt-1 tracking-tight">
                Welcome back, {displayName}
              </h1>
              <p className="text-xs sm:text-sm text-[#4B5563] mt-0.5">
                Wallet address: <span className="font-mono text-[#0B0B0F]">{truncateAddress(address)}</span>
              </p>
            </div>

            {/* Role Switcher & Actions */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="inline-flex p-1 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setRole('work')}
                  className={`px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
                    role === 'work'
                      ? 'bg-white text-[#0047AB] shadow-xs'
                      : 'text-[#4B5563] hover:text-[#0B0B0F]'
                  }`}
                >
                  Freelancer Mode
                </button>
                <button
                  type="button"
                  onClick={() => setRole('hire')}
                  className={`px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
                    role === 'hire'
                      ? 'bg-white text-[#0047AB] shadow-xs'
                      : 'text-[#4B5563] hover:text-[#0B0B0F]'
                  }`}
                >
                  Client Mode
                </button>
              </div>

              {role === 'hire' ? (
                <Button
                  as="Link"
                  to="/jobs/post"
                  variant="primary"
                  size="sm"
                  leadingIcon={<PlusCircle size={14} />}
                >
                  Post a job
                </Button>
              ) : (
                <Button
                  as="Link"
                  to="/jobs"
                  variant="primary"
                  size="sm"
                  leadingIcon={<Search size={14} />}
                >
                  Find jobs
                </Button>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <Link
              to="/workspace"
              className="px-3 py-1.5 bg-[#F6F7F9] hover:bg-[#E5E7EB] border border-[#E5E7EB] text-xs font-medium text-[#0B0B0F] rounded-[6px] inline-flex items-center gap-1.5 transition-colors"
            >
              <Briefcase size={14} className="text-[#0047AB]" />
              <span>Continue workspace</span>
            </Link>
            <Link
              to="/chat"
              className="px-3 py-1.5 bg-[#F6F7F9] hover:bg-[#E5E7EB] border border-[#E5E7EB] text-xs font-medium text-[#0B0B0F] rounded-[6px] inline-flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare size={14} className="text-[#0047AB]" />
              <span>Messages</span>
            </Link>
            <Link
              to="/profile"
              className="px-3 py-1.5 bg-[#F6F7F9] hover:bg-[#E5E7EB] border border-[#E5E7EB] text-xs font-medium text-[#0B0B0F] rounded-[6px] inline-flex items-center gap-1.5 transition-colors"
            >
              <Award size={14} className="text-[#0047AB]" />
              <span>View credentials</span>
            </Link>
          </div>

        </PageContainer>
      </div>

      {/* Main Connected Dashboard Body */}
      <div className="bg-[#F6F7F9] py-10 min-h-[500px]">
        <PageContainer className="space-y-8">
          
          {/* Onboarding Checklist for incomplete profiles */}
          {completenessPercent < 100 && (
            <div className="p-4 bg-white border border-[#E5E7EB] rounded-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#0047AB]" />
                  <span className="font-semibold text-sm text-[#0B0B0F]">Complete your on-chain profile</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#E7EEF9] text-[#0047AB] font-bold">
                    {completenessPercent}%
                  </span>
                </div>
                <p className="text-xs text-[#4B5563]">
                  Add your skills, bio, and GitHub verification to unlock trusted client matching.
                </p>
              </div>
              <Button
                as="Link"
                to="/profile"
                variant="primary"
                size="sm"
                trailingIcon={<ArrowRight size={14} />}
                className="self-start sm:self-auto shrink-0"
              >
                Complete profile
              </Button>
            </div>
          )}

          {/* 2. Real Data Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className="p-5 bg-white border border-[#E5E7EB] rounded-[10px] space-y-1">
              <span className="text-xs text-[#4B5563] block">Active contracts</span>
              <div className="text-2xl font-bold text-[#0B0B0F] tabular-nums">
                {activeJobs.length}
              </div>
              <span className="text-[11px] text-[#0047AB] font-medium">In escrow</span>
            </div>

            <div className="p-5 bg-white border border-[#E5E7EB] rounded-[10px] space-y-1">
              <span className="text-xs text-[#4B5563] block">
                {role === 'work' ? 'Total earnings' : 'Total spent'}
              </span>
              <div className="text-2xl font-bold text-[#0B0B0F] tabular-nums">
                ${totalVolume.toLocaleString()}
              </div>
              <span className="text-[11px] text-[#10B981] font-medium">Settled on-chain</span>
            </div>

            <div className="p-5 bg-white border border-[#E5E7EB] rounded-[10px] space-y-1">
              <span className="text-xs text-[#4B5563] block">Reputation score</span>
              <div className="text-2xl font-bold text-[#0B0B0F] tabular-nums">
                {currentProfile?.rating ? `${currentProfile.rating} / 5.0` : '5.0 / 5.0'}
              </div>
              <span className="text-[11px] text-[#4B5563]">Verified on Polygon</span>
            </div>

            <div className="p-5 bg-white border border-[#E5E7EB] rounded-[10px] space-y-1">
              <span className="text-xs text-[#4B5563] block">Completed projects</span>
              <div className="text-2xl font-bold text-[#0B0B0F] tabular-nums">
                {completedJobs.length}
              </div>
              <span className="text-[11px] text-[#4B5563]">Issued certificates</span>
            </div>
          </div>

          {/* 3. "Needs your attention" section */}
          {attentionItems.length > 0 && (
            <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 text-left space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-[#0047AB]" />
                <h3 className="text-sm font-bold text-[#0B0B0F]">Needs your attention</h3>
              </div>
              <div className="space-y-3">
                {attentionItems.map((item, i) => (
                  <div key={i} className="p-3.5 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-[#0B0B0F]">{item.title}</div>
                      <div className="text-xs text-[#4B5563]">{item.desc}</div>
                    </div>
                    <Link
                      to={item.link}
                      className="px-3 py-1.5 bg-[#0047AB] text-white rounded-[6px] text-xs font-semibold hover:bg-[#003882] shrink-0"
                    >
                      {item.cta}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. New Jobs for You / Quick Opportunities */}
          <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 text-left space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0B0B0F]">Available Opportunities</h3>
                <p className="text-xs text-[#4B5563]">Open escrow contracts ready for proposals</p>
              </div>
              <Link to="/jobs" className="text-xs font-semibold text-[#0047AB] hover:underline">
                View all &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {openJobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="p-3.5 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] hover:border-[#0047AB] transition-colors flex flex-col justify-between space-y-2"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-[#0B0B0F] line-clamp-1">{job.title}</h4>
                    <p className="text-[11px] text-[#4B5563] line-clamp-1 mt-0.5">{job.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E5E7EB]">
                    {(() => {
                      const ja = getJobAmounts(job);
                      return <TokenAmount amount={ja.effectiveAmount} token={ja.token} />;
                    })()}
                    <span className="text-[11px] text-[#4B5563]">{job.category || 'Web3'}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 5. What's New & Help Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-5 bg-white border border-[#E5E7EB] rounded-[10px] space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-[#0047AB]" />
                <h3 className="text-sm font-bold text-[#0B0B0F]">What's New in PolyLance</h3>
              </div>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Platform fees are fixed at a flat 2.5% on milestone release. Contracts are audited and verified on Polygon Mainnet.
              </p>
              <div className="pt-2">
                <WatchButton
                  id="walkthrough"
                  label="Watch Product Walkthrough"
                  onOpen={onOpenVideo}
                />
              </div>
            </div>

            <div className="p-5 bg-white border border-[#E5E7EB] rounded-[10px] space-y-3">
              <div className="flex items-center gap-2">
                <FileCheck size={16} className="text-[#0047AB]" />
                <h3 className="text-sm font-bold text-[#0B0B0F]">Protocol Guides</h3>
              </div>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Learn how milestone deposits, deliverable review windows, and decentralized dispute resolutions function.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <Link to="/help" className="text-xs font-semibold text-[#0047AB] hover:underline">
                  Visit Help Center &rarr;
                </Link>
                <Link to="/audit" className="text-xs font-semibold text-[#4B5563] hover:underline">
                  Smart Contract Audit &rarr;
                </Link>
              </div>
            </div>
          </div>

        </PageContainer>
      </div>

      {/* Footer */}
      <footer className="w-full bg-[#0B0B0F] text-white py-12 border-t border-black text-xs text-left">
        <PageContainer>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-400">
            <div>PolyLance Protocol. Decentralized Escrow on Polygon.</div>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="hover:text-white">Terms</Link>
              <Link to="/privacy" className="hover:text-white">Privacy</Link>
              <Link to="/audit" className="hover:text-white">Audit</Link>
              <Link to="/help" className="hover:text-white">Help</Link>
            </div>
          </div>
        </PageContainer>
      </footer>
    </div>
  );
};
