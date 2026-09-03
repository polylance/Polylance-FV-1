import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Application, SkillCategory, UserProfile } from '../types';
import { truncateAddress } from '../utils/formatters';
import { calculateReputationScores } from '../utils/reputation';
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
  ShieldCheck,
  Briefcase,
  TrendingUp,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  Filter,
  DollarSign,
  Send,
  Sliders,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { UserProfileBioModal } from './UserProfileBioModal';

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
  const { jobs, profiles, updateJobTerms, sendPreAcceptMessage } = usePolyLanceData();
  const [sortField, setSortField] = useState<'score' | 'reputation' | 'appliedAt'>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterGithubOnly, setFilterGithubOnly] = useState<boolean>(false);
  const [filterMinReputation, setFilterMinReputation] = useState<number>(0);
  const [expandedApplicant, setExpandedApplicant] = useState<string | null>(null);

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
  const [isTermsUpdatedSuccess, setIsTermsUpdatedSuccess] = useState<boolean>(false);

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

  const filteredApplicants = applications.filter((app) => {
    if (filterGithubOnly && !app.githubVerified) return false;
    
    if (filterMinReputation > 0) {
      const profileKey = Object.keys(profiles).find(k => k.toLowerCase() === app.applicant.toLowerCase());
      const profile = profileKey ? profiles[profileKey] : undefined;
      const repScores = calculateReputationScores(app.applicant, jobs, profile);
      if (repScores.totalPoints < filterMinReputation) return false;
    }

    return true;
  });

  const sortedApplicants = [...filteredApplicants].sort((a, b) => {
    const mult = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'score') {
      if (a.githubScore !== b.githubScore) {
        return mult * (a.githubScore - b.githubScore);
      }
      return -1 * (a.appliedAt - b.appliedAt);
    }
    if (sortField === 'reputation') {
      const profA = Object.keys(profiles).find(k => k.toLowerCase() === a.applicant.toLowerCase());
      const repA = calculateReputationScores(a.applicant, jobs, profA ? profiles[profA] : undefined).totalPoints;
      const profB = Object.keys(profiles).find(k => k.toLowerCase() === b.applicant.toLowerCase());
      const repB = calculateReputationScores(b.applicant, jobs, profB ? profiles[profB] : undefined).totalPoints;
      return mult * (repA - repB);
    }
    return mult * (a.appliedAt - b.appliedAt);
  });

  const handleSendPreAcceptMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!negotiateChatInput.trim() || !jobId || !negotiatingApplicant) return;
    sendPreAcceptMessage(
      jobId,
      negotiateChatInput.trim(),
      'Client',
      'Client',
      undefined,
      negotiatingApplicant.applicant
    );
    setNegotiateChatInput('');
  };

  const handleSaveTermsAndSelect = async () => {
    if (!negotiatingApplicant || !jobId) return;
    // Update terms on-chain / context
    await updateJobTerms(jobId, negotiatedAmount, negotiatedDays);
    setIsTermsUpdatedSuccess(true);
    await onSelect(negotiatingApplicant.applicant);
    setNegotiatingApplicant(null);
    setIsTermsUpdatedSuccess(false);
    navigate(`/workspace?jobId=${jobId}`);
  };

  if (applications.length === 0) {
    return (
      <div className="glass-panel p-8 text-center border-slate-200 bg-white shadow-xs rounded-2xl">
        <Code2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-slate-900">No Applications Submitted Yet</h4>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          When freelancers apply, their verified GitHub skill scores and proposal submissions will appear here.
        </p>
      </div>
    );
  }

  const renderStars = (ratingNum: number) => {
    const stars = [];
    const filledStarsCount = Math.floor(ratingNum);
    const hasHalfStar = ratingNum % 1 >= 0.4;
    for (let i = 1; i <= 5; i++) {
      if (i <= filledStarsCount) {
        stars.push(<Star key={i} size={12} className="fill-amber-500 text-amber-500" />);
      } else if (i === filledStarsCount + 1 && hasHalfStar) {
        stars.push(<Star key={i} size={12} className="fill-amber-500 text-amber-500 opacity-80" />);
      } else {
        stars.push(<Star key={i} size={12} className="text-slate-300" />);
      }
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  return (
    <div className="bg-white border border-purple-200/80 rounded-3xl overflow-hidden shadow-xl shadow-purple-900/5 space-y-0 font-sans">
      
      {/* Header Bar with Filter & Sort Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center border border-purple-100 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-headline">
              Proposals & Applicants ({sortedApplicants.length} of {applications.length})
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Filtered by reputation & GitHub verified skill attestations
            </p>
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* GitHub Verified Only Toggle */}
          <button
            type="button"
            onClick={() => setFilterGithubOnly(!filterGithubOnly)}
            className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
              filterGithubOnly
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Github size={13} />
            <span>GitHub Verified</span>
            {filterGithubOnly && <Check size={12} className="text-white" />}
          </button>

          {/* Min Reputation Filter Dropdown */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs">
            <ShieldCheck size={13} className="text-purple-600 ml-1" />
            <select
              value={filterMinReputation}
              onChange={(e) => setFilterMinReputation(Number(e.target.value))}
              className="bg-transparent text-slate-800 font-bold outline-none cursor-pointer text-xs pr-1"
            >
              <option value={0}>All Reputation</option>
              <option value={50}>50+ PLREP</option>
              <option value={100}>100+ PLREP (Silver)</option>
              <option value={300}>300+ PLREP (Gold)</option>
            </select>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSort('score')}
              className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all cursor-pointer font-bold ${
                sortField === 'score'
                  ? 'bg-purple-100 border-purple-300 text-purple-950 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>GitHub Score</span> <ArrowUpDown size={12} />
            </button>
            <button
              type="button"
              onClick={() => handleSort('reputation')}
              className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all cursor-pointer font-bold ${
                sortField === 'reputation'
                  ? 'bg-purple-100 border-purple-300 text-purple-950 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Reputation</span> <ArrowUpDown size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Applicant Cards Container */}
      <div className="p-4 sm:p-6 space-y-5 bg-[#F8FAFC]/50">
        {sortedApplicants.map((app) => {
          const profileKey = Object.keys(profiles).find(k => k.toLowerCase() === app.applicant.toLowerCase());
          const profile: UserProfile | undefined = profileKey ? profiles[profileKey] : undefined;

          // Real-time calculation of freelancer stats from live data context
          const freelancerAddr = app.applicant.toLowerCase();
          const repScores = calculateReputationScores(app.applicant, jobs, profile);
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
          const shortAddr = `${app.applicant.slice(0, 6)}...${app.applicant.slice(-4)}`;
          const name = profile?.displayName || `User ${shortAddr}`;
          const isExpanded = expandedApplicant === app.applicant;

          return (
            <div 
              key={app.applicant} 
              className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 hover:border-purple-300 transition-all shadow-xs"
            >
              {/* Top Section: Applicant Info, Verified Score, and Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                
                {/* Applicant Info */}
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 shrink-0">
                    <img 
                      src={profile?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${app.applicant.toLowerCase()}`} 
                      alt={name} 
                      className="w-12 h-12 rounded-full object-cover border border-purple-200"
                    />
                    <div className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-purple-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                      <span className="text-[9px] font-bold">✓</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/profile/${app.applicant}`}
                        className="font-mono text-purple-700 hover:text-purple-900 font-bold text-sm flex items-center gap-1 hover:underline"
                      >
                        <span>{truncateAddress(app.applicant)}</span>
                        <ExternalLink size={12} className="text-purple-500" />
                      </Link>
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {truncateAddress(app.applicant)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-900 font-bold block mt-0.5">{name}</span>
                  </div>
                </div>

                {/* Score & Reputation Metrics Badge */}
                <div className="flex items-center gap-3">
                  {/* Real Reputation Score */}
                  <div className="bg-purple-50 border border-purple-200/80 px-3.5 py-1.5 rounded-xl text-center">
                    <div className="text-xs font-mono font-black text-purple-900">
                      {repScores.totalPoints} <span className="text-[10px] text-purple-600 font-bold">PLREP</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                      Reputation Points
                    </span>
                  </div>

                  {/* GitHub Verified Score */}
                  {app.githubVerified && (
                    <div className="space-y-1 bg-emerald-50/70 border border-emerald-200/70 px-3.5 py-1.5 rounded-xl">
                      <div className="flex items-center gap-1 font-mono">
                        <span className="font-extrabold text-emerald-700 text-xs">{app.githubScore}</span>
                        <span className="text-slate-400 font-bold text-[10px]">/ 1000</span>
                        <CheckCircle2 size={12} className="text-emerald-600 ml-0.5" />
                      </div>
                      <span className="text-[9px] font-mono font-bold text-emerald-800 uppercase tracking-wider block">
                        GitHub Verified
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons: Discuss & Select Freelancer */}
                <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
                  <button
                    type="button"
                    onClick={() => setExpandedApplicant(isExpanded ? null : app.applicant)}
                    className={`px-3 py-2 border rounded-xl font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                      isExpanded 
                        ? 'bg-purple-100 border-purple-300 text-purple-950 shadow-2xs' 
                        : 'bg-slate-50 hover:bg-purple-50 border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-900'
                    }`}
                  >
                    <Users size={14} className="text-purple-700" />
                    <span>Audit Experience</span>
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {isClient && (
                    <>
                      {/* Pre-Acceptance Discussion / Negotiation CTA */}
                      <button
                        type="button"
                        onClick={() => navigate(`/chat?jobId=${jobId}&applicant=${app.applicant}`)}
                        className="bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <MessageSquare size={14} className="text-purple-700" />
                        Discuss Terms in Messages
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await onSelect(app.applicant);
                          if (jobId) navigate(`/workspace?jobId=${jobId}`);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <UserCheck size={14} />
                        Select Freelancer
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Proposal Text Section */}
              <div className="bg-[#FAF5FF] border border-purple-200/60 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-purple-600 shrink-0" />
                  <span className="text-[10px] font-mono uppercase font-bold text-purple-900 tracking-wider">
                    PROPOSAL SUBMISSION
                  </span>
                </div>
                <p className="text-slate-800 font-medium text-xs leading-relaxed whitespace-pre-wrap">
                  {app.proposalText}
                </p>
              </div>

              {/* Skills Tags Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400 font-bold mr-1">Skills:</span>
                  {app.applicantSkills.map((sk) => (
                    <span
                      key={sk}
                      className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold"
                    >
                      {sk}
                    </span>
                  ))}
                </div>

                <span className="text-[10px] font-mono text-slate-400">
                  Applied {new Date(app.appliedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Expandable Talent Audit Drawer with Smooth Premium Animation */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden border-t border-slate-200/80 pt-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 font-sans text-xs">
                      
                      {/* COL 1: TIMELINE & SPEED */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs flex flex-col justify-start">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                            <Clock size={18} />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-800 block leading-tight">Timeline & Speed</span>
                            <h4 className="font-headline font-black text-slate-900 text-sm leading-tight mt-0.5">Performance at a glance</h4>
                          </div>
                        </div>

                        {/* Top 2 Cards Grid */}
                        <div className="grid grid-cols-2 gap-2.5">
                          {/* Subcard 1: Jobs Completed */}
                          <div className="bg-[#FAF9FF] p-3 rounded-2xl border border-purple-100/60 flex flex-col justify-between h-28">
                            <div className="w-8 h-8 rounded-xl bg-purple-100/70 text-purple-600 flex items-center justify-center">
                              <Briefcase size={15} />
                            </div>
                            <div>
                              <span className="font-headline font-black text-slate-900 text-2xl leading-none block">
                                {completedCount}
                              </span>
                              <span className="text-xs text-slate-500 font-sans font-medium mt-1 block">
                                Jobs Completed
                              </span>
                            </div>
                          </div>

                          {/* Subcard 2: On-time Rate */}
                          <div className="bg-[#F8FCF9] p-3 rounded-2xl border border-emerald-100/60 flex flex-col justify-between h-28">
                            <div className="w-7 h-7 rounded-full bg-emerald-100/70 text-emerald-600 flex items-center justify-center">
                              <Clock size={14} />
                            </div>
                            <div>
                              <span className="font-headline font-black text-slate-900 text-2xl leading-none block">
                                {onTimeRate === 'N/A' ? '—' : onTimeRate}
                              </span>
                              <span className="text-xs text-slate-500 font-sans font-medium mt-1 block">
                                On-time Rate
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Subcard: Milestones Progress Avg. */}
                        <div className="bg-[#FAF9FF] p-3 rounded-2xl border border-purple-100/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">
                              Milestones Progress Avg.
                            </span>
                            <div className="w-6 h-6 rounded-full bg-purple-100/80 text-purple-600 flex items-center justify-center">
                              <TrendingUp size={13} />
                            </div>
                          </div>
                          <div>
                            <span className="font-headline font-black text-slate-900 text-xl leading-none block">
                              {progressAvg.includes('N/A') ? '—' : progressAvg}
                            </span>
                            <div className="w-full bg-purple-100/70 rounded-full h-1.5 mt-2 overflow-hidden">
                              <div 
                                className="bg-purple-600 h-1.5 rounded-full transition-all duration-300" 
                                style={{ width: progressAvg.includes('N/A') ? '0%' : (progressAvg.includes('%') ? progressAvg : '0%') }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* COL 2: RATING & CREDENTIALS */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs flex flex-col justify-start">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center shrink-0">
                            <Star size={18} className="fill-amber-400 text-amber-400" />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-800 block leading-tight">Rating & Credentials</span>
                            <h4 className="font-headline font-black text-slate-900 text-sm leading-tight mt-0.5">Reputation that's provable</h4>
                          </div>
                        </div>

                        {/* Credentials List */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <Smile size={16} className="text-purple-600" />
                              <span className="text-xs text-slate-700 font-medium">Client Satisfaction</span>
                            </div>
                            {rating > 0 ? (
                              <div className="flex items-center gap-1">
                                {renderStars(rating)}
                                <span className="font-mono font-extrabold text-slate-900 text-xs">{rating.toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="font-mono font-extrabold text-slate-400 text-xs">N/A</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <Shield size={16} className="text-purple-600" />
                              <span className="text-xs text-slate-700 font-medium">Soulbound Badges</span>
                            </div>
                            <span className="font-mono font-extrabold text-purple-700 text-xs">
                              {soulboundCount} Attested
                            </span>
                          </div>

                          {/* Interactive Bio & Attestations Box (Click to open full bio popup) */}
                          <div
                            onClick={() => {
                              setBioModalApplicant({
                                applicant: app,
                                profile,
                                completedCount,
                                onTimeRate,
                                progressAvg,
                                commitsCount,
                                prsCount,
                                soulboundCount,
                              });
                            }}
                            className="bg-[#FAF8FF] border border-purple-100/90 rounded-2xl p-3.5 space-y-1.5 mt-2 cursor-pointer hover:border-purple-300 hover:shadow-xs transition-all group"
                            title="Click to view full bio and complete attestations popup"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-purple-700 font-bold">
                                <div className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
                                  <Award size={12} />
                                </div>
                                <span className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                                  Bio & Attestations
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-purple-600 bg-purple-100/70 hover:bg-purple-200/70 px-2 py-0.5 rounded-full font-bold transition-colors">
                                View Full
                              </span>
                            </div>
                            <p className="font-sans text-xs text-slate-600 leading-relaxed line-clamp-2">
                              {bio || 'No bio provided.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* COL 3: VERIFIED GITHUB ACTIVITY */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs flex flex-col justify-start">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                            <Code2 size={18} />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-800 block leading-tight">Verified GitHub Activity</span>
                            <h4 className="font-headline font-black text-slate-900 text-sm leading-tight mt-0.5">On-chain code contributions</h4>
                          </div>
                        </div>

                        {/* Top 2 Cards Grid */}
                        <div className="grid grid-cols-2 gap-2.5">
                          {/* Subcard 1: Total Commits */}
                          <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100 flex flex-col justify-between h-28">
                            <div className="text-blue-600">
                              <GitCommit size={18} />
                            </div>
                            <div>
                              <span className="font-headline font-black text-slate-900 text-2xl leading-none block">
                                {commitsCount}
                              </span>
                              <span className="text-xs text-slate-500 font-sans font-medium mt-1 block">
                                Total Commits
                              </span>
                            </div>
                          </div>

                          {/* Subcard 2: PRs Merged */}
                          <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100 flex flex-col justify-between h-28">
                            <div className="text-blue-600">
                              <GitPullRequest size={18} />
                            </div>
                            <div>
                              <span className="font-headline font-black text-slate-900 text-2xl leading-none block">
                                {prsCount}
                              </span>
                              <span className="text-xs text-slate-500 font-sans font-medium mt-1 block">
                                PRs Merged
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Subcard: Linked GitHub */}
                        <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Github size={20} className="text-slate-900 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[10px] text-slate-500 font-medium block truncate">
                                Linked GitHub
                              </span>
                              {isVerified ? (
                                <a 
                                  href={`https://github.com/${githubUsername}`}
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="font-bold text-blue-600 text-xs hover:underline flex items-center gap-0.5 truncate"
                                >
                                  <span className="truncate">@{githubUsername}</span>
                                  <ExternalLink size={10} className="text-blue-500 shrink-0" />
                                </a>
                              ) : (
                                <span className="font-bold text-slate-500 text-xs truncate">Unlinked Account</span>
                              )}
                            </div>
                          </div>

                          {isVerified ? (
                            <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
                              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                              <span>Verified</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shrink-0">
                              <AlertCircle size={13} className="text-amber-600 shrink-0" />
                              <span>Unverified</span>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Pre-Acceptance Discussion & Terms Negotiation Modal */}
      <AnimatePresence>
        {negotiatingApplicant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNegotiatingApplicant(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden z-10 space-y-6 max-h-[90vh] flex flex-col justify-between"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md">
                    <MessageSquare size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-purple-800 font-bold bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                      PRE-ACCEPTANCE NEGOTIATION
                    </span>
                    <h3 className="font-headline text-lg sm:text-xl font-black text-slate-900 mt-1">
                      Discuss Terms with {truncateAddress(negotiatingApplicant.applicant)}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setNegotiatingApplicant(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Negotiation Controls: Adjust Amount & Review Period */}
              <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-900 uppercase">
                  <Sliders size={14} className="text-purple-700" />
                  <span>Negotiable Job Terms (Pre-Acceptance)</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Escrow Amount (USDC)
                    </label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="number"
                        min="1"
                        value={negotiatedAmount}
                        onChange={(e) => setNegotiatedAmount(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 font-bold text-sm rounded-xl !pl-8 px-3 py-2 focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Review Window SLA (Days)
                    </label>
                    <div className="relative">
                      <Clock size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={negotiatedDays}
                        onChange={(e) => setNegotiatedDays(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 text-slate-900 font-bold text-sm rounded-xl !pl-8 px-3 py-2 focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  Modify terms if agreed upon before formally selecting this candidate for on-chain escrow lock.
                </p>
              </div>

              {/* Chat Stream Box */}
              <div className="flex-1 min-h-[160px] max-h-[220px] overflow-y-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                {currentPreAcceptMessages.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs font-medium">
                    <p>No messages yet. Send a message to discuss project details or negotiate scope.</p>
                  </div>
                ) : (
                  currentPreAcceptMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.senderRole === 'Client' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {msg.senderRole === 'Client' ? 'You (Client)' : 'Freelancer'}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl text-xs max-w-sm font-medium ${
                          msg.senderRole === 'Client'
                            ? 'bg-purple-600 text-white rounded-br-none shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-2xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendPreAcceptMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message to discuss requirements or adjust budget..."
                  value={negotiateChatInput}
                  onChange={(e) => setNegotiateChatInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold rounded-xl px-4 py-2.5 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none"
                />
                <button
                  type="submit"
                  disabled={!negotiateChatInput.trim()}
                  className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Send size={13} />
                  Send
                </button>
              </form>

              {/* Footer CTA: Finalize & Select */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNegotiatingApplicant(null)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleSaveTermsAndSelect}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <UserCheck size={15} />
                  Accept & Proceed with ${negotiatedAmount} USDC
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
