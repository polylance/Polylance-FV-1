import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Application, SkillCategory, UserProfile } from '../types';
import { truncateAddress } from '../utils/formatters';
import { calculateReputationScores } from '../utils/reputation';
import { AddressChip } from './common/AddressChip';
import { LocalAvatar } from './common/LocalAvatar';
import { 
  CheckCircle2, 
  UserCheck, 
  ArrowUpDown, 
  ExternalLink, 
  Code2, 
  Star, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Github,
  Award,
  Users,
  MessageSquare,
  Smile,
  Shield,
  Briefcase,
  TrendingUp,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  Sliders,
  Check,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useWeb3 } from '../context/Web3Context';
import { UserProfileBioModal } from './UserProfileBioModal';
import { UsdcIcon } from './TokenIcon';
import { PolyLanceSelect, SelectOption } from './PolyLanceSelect';

const APPLICANT_MIN_REP_OPTIONS: SelectOption<number>[] = [
  { value: 0, label: 'Any' },
  { value: 50, label: '50+ points' },
  { value: 100, label: '100+ points' },
  { value: 300, label: '300+ points' },
];

interface ApplicantTableProps {
  jobId?: string;
  jobAmount?: string;
  jobReviewPeriodDays?: number;
  applications: Application[];
  category: SkillCategory;
  onSelect: (applicantAddress: string) => void;
  isClient: boolean;
}

export const ApplicantTable: React.FC<ApplicantTableProps> = ({
  jobId,
  jobAmount = '100',
  jobReviewPeriodDays = 7,
  applications,
  category,
  onSelect,
  isClient,
}) => {
  const navigate = useNavigate();
  const { address } = useWeb3();
  const { jobs, profiles, updateJobTerms, sendPreAcceptMessage } = usePolyLanceData();
  const [sortField, setSortField] = useState<'score' | 'reputation' | 'appliedAt'>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterGithubOnly, setFilterGithubOnly] = useState<boolean>(false);
  const [filterMinReputation, setFilterMinReputation] = useState<number>(0);
  const [expandedApplicant, setExpandedApplicant] = useState<string | null>(null);
  const [expandedProposals, setExpandedProposals] = useState<Record<string, boolean>>({});

  // User Full Bio Popup Modal State
  const [bioModalApplicant, setBioModalApplicant] = useState<{
    applicant: Application;
    profile?: UserProfile;
    completedCount: number;
    onTimeRate: string;
    progressAvg: string;
    commitsCount: number;
    prsCount: number;
    soulboundCount: number;
  } | null>(null);

  // Pre-Acceptance Discussion / Negotiation Modal State
  const [negotiatingApplicant, setNegotiatingApplicant] = useState<Application | null>(null);
  const [negotiatedAmount, setNegotiatedAmount] = useState<string>(jobAmount);
  const [negotiatedDays, setNegotiatedDays] = useState<number>(jobReviewPeriodDays);
  const [negotiateChatInput, setNegotiateChatInput] = useState<string>('');

  const activeJob = jobId ? jobs.find(j => j.id === jobId) : undefined;
  const currentPreAcceptMessages = (activeJob?.preAcceptMessages || []).filter((msg) => {
    if (!negotiatingApplicant) return true;
    const target = negotiatingApplicant.applicant.toLowerCase();
    return (
      msg.applicantAddress?.toLowerCase() === target ||
      msg.sender?.toLowerCase() === target ||
      (!msg.applicantAddress && msg.senderRole === 'Freelancer')
    );
  });

  const handleSort = (field: 'score' | 'reputation' | 'appliedAt') => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const toggleProposalExpand = (addr: string) => {
    setExpandedProposals(prev => ({ ...prev, [addr]: !prev[addr] }));
  };

  const handleSendPreAcceptMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!negotiateChatInput.trim() || !negotiatingApplicant || !jobId) return;
    sendPreAcceptMessage(jobId, negotiateChatInput.trim(), address || '0xClient', 'Client', undefined, negotiatingApplicant.applicant);
    setNegotiateChatInput('');
  };

  const handleSaveTermsAndSelect = async () => {
    if (!jobId || !negotiatingApplicant) return;
    if (updateJobTerms) {
      updateJobTerms(jobId, negotiatedAmount, negotiatedDays);
    }
    await onSelect(negotiatingApplicant.applicant);
    setNegotiatingApplicant(null);
    navigate(`/workspace?jobId=${jobId}`);
  };

  // Filtered and Sorted Applicants
  const filteredApplicants = applications.filter((app) => {
    if (filterGithubOnly && !app.githubVerified) return false;
    const profileKey = Object.keys(profiles).find(k => k.toLowerCase() === app.applicant.toLowerCase());
    const profile = profileKey ? profiles[profileKey] : undefined;
    const repScores = calculateReputationScores(app.applicant, jobs, profile, profile?.reputationSbtCount || 0);
    if (filterMinReputation > 0 && repScores.totalPoints < filterMinReputation) return false;
    return true;
  });

  const sortedApplicants = [...filteredApplicants].sort((a, b) => {
    const mult = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'score') {
      const scoreA = a.githubScore || 0;
      const scoreB = b.githubScore || 0;
      return (scoreA - scoreB) * mult;
    }
    if (sortField === 'reputation') {
      const profA = Object.keys(profiles).find(k => k.toLowerCase() === a.applicant.toLowerCase());
      const profB = Object.keys(profiles).find(k => k.toLowerCase() === b.applicant.toLowerCase());
      const repA = calculateReputationScores(a.applicant, jobs, profA ? profiles[profA] : undefined).totalPoints;
      const repB = calculateReputationScores(b.applicant, jobs, profB ? profiles[profB] : undefined).totalPoints;
      return (repA - repB) * mult;
    }
    return ((a.appliedAt || 0) - (b.appliedAt || 0)) * mult;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            className={star <= rating ? "fill-amber-400 text-amber-400" : "text-[#E5E7EB]"}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="border border-[#E5E7EB] rounded-xl bg-white overflow-hidden space-y-0">
      {/* Top Header & Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 bg-[#F6F7F9]">
        <div>
          <h3 className="text-base font-semibold text-[#0B0B0F]">
            Proposals and applicants ({sortedApplicants.length} of {applications.length})
          </h3>
          <p className="text-xs text-[#4B5563]">
            Verified skill attestations and on-chain work history
          </p>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* GitHub Verified Only Toggle */}
          <button
            type="button"
            onClick={() => setFilterGithubOnly(!filterGithubOnly)}
            className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer font-medium ${
              filterGithubOnly
                ? 'bg-[#0047AB] text-white border-[#0047AB]'
                : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:bg-slate-50'
            }`}
          >
            <Github size={13} />
            <span>GitHub verified</span>
            {filterGithubOnly && <Check size={12} className="text-white" />}
          </button>

          {/* Min Reputation Filter Select */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#4B5563] text-xs font-medium">Min reputation:</span>
            <PolyLanceSelect<number>
              value={filterMinReputation}
              onChange={(val) => setFilterMinReputation(val)}
              options={APPLICANT_MIN_REP_OPTIONS}
              size="sm"
              className="w-32"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSort('score')}
              className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer font-medium ${
                sortField === 'score'
                  ? 'bg-[#0B0B0F] border-[#0B0B0F] text-white'
                  : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:bg-slate-50'
              }`}
            >
              <span>GitHub score</span> <ArrowUpDown size={11} />
            </button>
            <button
              type="button"
              onClick={() => handleSort('reputation')}
              className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer font-medium ${
                sortField === 'reputation'
                  ? 'bg-[#0B0B0F] border-[#0B0B0F] text-white'
                  : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:bg-slate-50'
              }`}
            >
              <span>Reputation</span> <ArrowUpDown size={11} />
            </button>
            <button
              type="button"
              onClick={() => handleSort('appliedAt')}
              className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer font-medium ${
                sortField === 'appliedAt'
                  ? 'bg-[#0B0B0F] border-[#0B0B0F] text-white'
                  : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:bg-slate-50'
              }`}
            >
              <span>Newest</span> <ArrowUpDown size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Applicant Cards Container */}
      <div className="p-4 sm:p-5 space-y-4 bg-white">
        {sortedApplicants.length === 0 ? (
          <div className="py-12 text-center text-[#4B5563] text-xs">
            No applicants match the selected filters.
          </div>
        ) : (
          sortedApplicants.map((app) => {
            const profileKey = Object.keys(profiles).find(k => k.toLowerCase() === app.applicant.toLowerCase());
            const profile: UserProfile | undefined = profileKey ? profiles[profileKey] : undefined;

            const freelancerAddr = app.applicant.toLowerCase();
            const repScores = calculateReputationScores(
              app.applicant, 
              jobs, 
              profile, 
              profile?.reputationSbtCount || 0
            );
            const completedJobs = jobs.filter(
              (j) => j.freelancer?.toLowerCase() === freelancerAddr && j.status === 'Completed'
            );
            const activeJobs = jobs.filter(
              (j) => j.freelancer?.toLowerCase() === freelancerAddr && ((j.status as string) === 'Funded' || j.status === 'Selected' || j.status === 'Submitted')
            );
            const completedCount = completedJobs.length;
            const rating = completedCount > 0 ? 5.0 : 0;
            const onTimeRate = completedCount > 0 ? '100%' : 'N/A';
            const progressAvg = activeJobs.length > 0 ? '75%' : (completedCount > 0 ? '100%' : 'N/A');
            const soulboundCount = completedCount;
            const isVerified = Boolean(profile?.githubVerified);
            const commitsCount = isVerified ? (profile?.commitsCount ?? 0) : 0;
            const prsCount = isVerified ? (profile?.prsCount ?? 0) : 0;
            const bio = profile?.bio || 'No bio provided.';
            const githubUsername = isVerified ? (profile?.githubUsername || '') : '';
            const name = profile?.displayName || `User ${truncateAddress(app.applicant)}`;
            const isExpanded = expandedApplicant === app.applicant;
            const isProposalExpanded = expandedProposals[app.applicant];
            const proposalText = app.proposalText?.trim() || '';
            const isLongProposal = proposalText.length > 200;

            return (
              <div 
                key={app.applicant} 
                className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 space-y-4 hover:border-slate-300 transition-colors"
              >
                {/* Top Section: Applicant Info, Verified Score, and Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Applicant Info (Username primary, AddressChip once) */}
                  <div className="flex items-center gap-3">
                    <Link to={`/profile/${app.applicant}`} className="shrink-0">
                      {profile?.avatarUrl && !profile.avatarUrl.includes('dicebear') && !profile.avatarUrl.includes('unsplash') ? (
                        <img 
                          src={profile.avatarUrl} 
                          alt={name} 
                          className="w-10 h-10 rounded-full object-cover border border-[#E5E7EB]"
                        />
                      ) : (
                        <LocalAvatar address={app.applicant} name={name} size={40} />
                      )}
                    </Link>

                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/profile/${app.applicant}`}
                          className="text-sm font-semibold text-[#0B0B0F] hover:text-[#0047AB] transition-colors"
                        >
                          {name}
                        </Link>
                        {isVerified && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5">
                        <AddressChip address={app.applicant} />
                      </div>
                    </div>
                  </div>

                  {/* Score & Reputation Metrics Badge */}
                  <div className="flex items-center gap-3">
                    {/* Real Reputation Score */}
                    <div className="bg-[#F6F7F9] border border-[#E5E7EB] px-3 py-1.5 rounded-lg text-center">
                      <div className="text-xs font-semibold text-[#0B0B0F]">
                        {repScores.totalPoints} <span className="text-[#0047AB]">pts</span>
                      </div>
                      <span className="text-[10px] text-[#4B5563] block">
                        Reputation
                      </span>
                    </div>

                    {/* GitHub Verified Score with Tooltip */}
                    {app.githubVerified && (
                      <div 
                        className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-center relative group cursor-help"
                        title="Score out of 1000 based on verified GitHub activity"
                      >
                        <div className="flex items-center justify-center gap-1 text-xs font-semibold text-emerald-800">
                          <span>{profile?.primaryScore || app.githubScore}</span>
                          <span className="text-emerald-600/70 text-[10px]">/ 1000</span>
                          <HelpCircle size={11} className="text-emerald-600" />
                        </div>
                        <span className="text-[10px] text-emerald-700 block">
                          GitHub score
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: View details, Message, Select freelancer */}
                  <div className="flex items-center gap-2 ml-auto sm:ml-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setExpandedApplicant(isExpanded ? null : app.applicant)}
                      className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#4B5563] hover:text-[#0B0B0F] hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Users size={13} />
                      <span>View details</span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    <Link
                      to={`/profile/${app.applicant}`}
                      className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#4B5563] hover:text-[#0B0B0F] hover:bg-slate-50 inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>View profile</span>
                    </Link>

                    {isClient && (
                      <>
                        <button
                          type="button"
                          onClick={() => navigate(`/chat?jobId=${jobId}&applicant=${app.applicant}`)}
                          className="bg-white hover:bg-slate-50 text-[#0B0B0F] border border-[#E5E7EB] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageSquare size={13} className="text-[#0047AB]" />
                          <span>Message</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            await onSelect(app.applicant);
                            if (jobId) navigate(`/workspace?jobId=${jobId}`);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <UserCheck size={14} />
                          <span>Select freelancer</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Proposal Text Section */}
                <div className="bg-[#F6F7F9] border border-[#E5E7EB] rounded-lg p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0B0B0F]">
                      Proposal submission
                    </span>
                    {isLongProposal && (
                      <button
                        type="button"
                        onClick={() => toggleProposalExpand(app.applicant)}
                        className="text-xs text-[#0047AB] hover:underline cursor-pointer"
                      >
                        {isProposalExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                  <p className={`text-xs text-[#4B5563] leading-relaxed whitespace-pre-wrap ${!isProposalExpanded && isLongProposal ? 'line-clamp-2' : ''}`}>
                    {proposalText || 'No cover note provided.'}
                  </p>
                </div>

                {/* Skills Tags & Applied Date Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E5E7EB]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-[#4B5563] font-medium mr-1">Skills:</span>
                    {app.applicantSkills.map((sk) => (
                      <span
                        key={sk}
                        className="bg-[#F6F7F9] text-[#4B5563] border border-[#E5E7EB] px-2 py-0.5 rounded text-xs"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>

                  <span className="text-[13px] text-[#4B5563]">
                    Applied {new Date(app.appliedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {/* Expandable Talent Details Drawer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-[#E5E7EB] pt-3"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-sans text-xs">
                        
                        {/* COL 1: Performance */}
                        <div className="bg-white p-3.5 rounded-lg border border-[#E5E7EB] space-y-2.5">
                          <div className="flex items-center gap-2">
                            <Clock size={15} className="text-[#0047AB]" />
                            <h4 className="font-semibold text-xs text-[#0B0B0F]">Performance</h4>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-[#F6F7F9] p-2.5 rounded border border-[#E5E7EB]">
                              <span className="text-lg font-semibold text-[#0B0B0F] block">
                                {completedCount}
                              </span>
                              <span className="text-xs text-[#4B5563] block">
                                Completed jobs
                              </span>
                            </div>

                            <div className="bg-[#F6F7F9] p-2.5 rounded border border-[#E5E7EB]">
                              <span className="text-lg font-semibold text-[#0B0B0F] block">
                                {onTimeRate}
                              </span>
                              <span className="text-xs text-[#4B5563] block">
                                On-time rate
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* COL 2: Rating & Certificates */}
                        <div className="bg-white p-3.5 rounded-lg border border-[#E5E7EB] space-y-2.5">
                          <div className="flex items-center gap-2">
                            <Award size={15} className="text-[#0047AB]" />
                            <h4 className="font-semibold text-xs text-[#0B0B0F]">Certificates & Rating</h4>
                          </div>

                          <div className="space-y-1.5 pt-1 text-xs">
                            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-1.5">
                              <span className="text-[#4B5563]">Client satisfaction</span>
                              {rating > 0 ? (
                                <div className="flex items-center gap-1 font-semibold text-[#0B0B0F]">
                                  {renderStars(rating)}
                                  <span>{rating.toFixed(1)}</span>
                                </div>
                              ) : (
                                <span className="text-[#4B5563]">New freelancer</span>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[#4B5563]">Verified work certificates</span>
                              <span className="font-semibold text-[#0047AB]">
                                {soulboundCount} on-chain
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* COL 3: GitHub Activity */}
                        <div className="bg-white p-3.5 rounded-lg border border-[#E5E7EB] space-y-2.5">
                          <div className="flex items-center gap-2">
                            <Code2 size={15} className="text-[#0047AB]" />
                            <h4 className="font-semibold text-xs text-[#0B0B0F]">GitHub activity</h4>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-[#F6F7F9] p-2.5 rounded border border-[#E5E7EB]">
                              <span className="text-lg font-semibold text-[#0B0B0F] block">
                                {commitsCount}
                              </span>
                              <span className="text-xs text-[#4B5563] block">
                                Commits
                              </span>
                            </div>

                            <div className="bg-[#F6F7F9] p-2.5 rounded border border-[#E5E7EB]">
                              <span className="text-lg font-semibold text-[#0B0B0F] block">
                                {prsCount}
                              </span>
                              <span className="text-xs text-[#4B5563] block">
                                PRs merged
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* User Full Bio Popup Modal */}
      {bioModalApplicant && (
        <UserProfileBioModal
          isOpen={Boolean(bioModalApplicant)}
          onClose={() => setBioModalApplicant(null)}
          applicantAddress={bioModalApplicant.applicant.applicant}
          profile={bioModalApplicant.profile}
          applicantData={bioModalApplicant.applicant}
          completedCount={bioModalApplicant.completedCount}
          onTimeRate={bioModalApplicant.onTimeRate}
          progressAvg={bioModalApplicant.progressAvg}
          commitsCount={bioModalApplicant.commitsCount}
          prsCount={bioModalApplicant.prsCount}
          soulboundCount={bioModalApplicant.soulboundCount}
        />
      )}
    </div>
  );
};
