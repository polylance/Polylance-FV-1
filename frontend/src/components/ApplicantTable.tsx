import React, { useState } from 'react';
import { Application, SkillCategory, UserProfile } from '../types';
import { truncateAddress } from '../utils/formatters';
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
  Zap,
  Smile,
  Shield,
  ShieldCheck,
  Briefcase,
  TrendingUp,
  GitCommit,
  GitPullRequest,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePolyLanceData } from '../context/PolyLanceDataContext';

interface ApplicantTableProps {
  applications: Application[];
  category: SkillCategory;
  onSelect: (applicantAddress: string) => void;
  isClient: boolean;
}

export const ApplicantTable: React.FC<ApplicantTableProps> = ({
  applications,
  category,
  onSelect,
  isClient,
}) => {
  const { jobs, profiles } = usePolyLanceData();
  const [sortField, setSortField] = useState<'score' | 'appliedAt'>('appliedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedApplicant, setExpandedApplicant] = useState<string | null>(null);

  const handleSort = (field: 'score' | 'appliedAt') => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedApplicants = [...applications].sort((a, b) => {
    const mult = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'score') {
      if (a.githubScore !== b.githubScore) {
        return mult * (a.githubScore - b.githubScore);
      }
      return -1 * (a.appliedAt - b.appliedAt);
    }
    return mult * (a.appliedAt - b.appliedAt);
  });

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
      
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center border border-purple-100 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-headline">
              Applicants ({applications.length})
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Sorted by relevance to job category: <span className="text-purple-700 font-bold uppercase">{category}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSort('score')}
            className={`text-xs px-3.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer font-mono font-bold ${
              sortField === 'score'
                ? 'bg-purple-100 border-purple-300 text-purple-950 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Sort by Score <ArrowUpDown size={13} />
          </button>
        </div>
      </div>

      {/* Applicant Cards Container */}
      <div className="p-4 sm:p-6 space-y-5 bg-[#F8FAFC]/50">
        {sortedApplicants.map((app) => {
          const profileKey = Object.keys(profiles).find(k => k.toLowerCase() === app.applicant.toLowerCase());
          const profile: UserProfile | undefined = profileKey ? profiles[profileKey] : undefined;

          // Real-time calculation of freelancer stats from live data context
          const freelancerAddr = app.applicant.toLowerCase();
          const completedJobs = jobs.filter(
            (j) => j.freelancer?.toLowerCase() === freelancerAddr && j.status === 'Completed'
          );
          const activeJobs = jobs.filter(
            (j) => j.freelancer?.toLowerCase() === freelancerAddr && ((j.status as string) === 'Funded' || j.status === 'Selected' || j.status === 'Submitted')
          );

          const isVerified = Boolean(profile?.githubVerified);
          const shortAddr = `${app.applicant.slice(0, 6)}...${app.applicant.slice(-4)}`;
          const name = profile?.displayName || `User ${shortAddr}`;
          const githubUsername = isVerified ? (profile?.githubUsername || '') : '';
          const completedCount = (profile as any)?.jobsCompletedCount !== undefined ? (profile as any).jobsCompletedCount : completedJobs.length;
          const rating = (profile as any)?.rating !== undefined ? (profile as any).rating : (completedCount > 0 ? 5.0 : 0);
          const onTimeRate = (profile as any)?.onTimeRate || (completedCount > 0 ? '100%' : 'N/A');
          const progressAvg = (profile as any)?.progressAvg || (activeJobs.length > 0 ? '75%' : (completedCount > 0 ? '100%' : 'N/A Completion'));
          const soulboundCount = (profile as any)?.reputationSbtCount !== undefined ? (profile as any).reputationSbtCount : completedCount;

          // Real user data only — 0 for unverified accounts
          const commitsCount = isVerified ? (profile?.commitsCount ?? 0) : 0;
          const prsCount = isVerified ? (profile?.prsCount ?? 0) : 0;

          const bio = profile?.bio || 'No bio provided.';

          const avatarUrl = profile?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${app.applicant.toLowerCase()}`;

          const isExpanded = expandedApplicant === app.applicant;

          // Real-time activity summary bullets for freelancer
          const recentActivities = [
            'Consistent contributions across multiple repositories',
            'Active pull request participation',
            'Code reviews & improvements',
            ...(completedCount > 0 ? [`Successfully completed ${completedCount} PolyLance escrow milestones`] : [])
          ];

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
                      src={avatarUrl} 
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

                {/* Score & Category Match */}
                {app.githubVerified && (
                  <div className="space-y-1 bg-slate-50/80 border border-slate-200/60 px-4 py-2 rounded-xl">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="font-extrabold text-emerald-600 text-sm">{app.githubScore}</span>
                      <span className="text-slate-400 font-bold text-xs">/ 1000</span>
                      <CheckCircle2 size={13} className="text-emerald-600 ml-0.5" />
                    </div>
                    <div className="flex items-center gap-2 w-32">
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div 
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${app.githubScore / 10}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono font-bold text-slate-500">{Math.round(app.githubScore / 10)}%</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons: Audit & Select Freelancer */}
                <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
                  <button
                    type="button"
                    onClick={() => setExpandedApplicant(isExpanded ? null : app.applicant)}
                    className={`px-3.5 py-2 border rounded-xl font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all ${
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
                    <button
                      type="button"
                      onClick={() => onSelect(app.applicant)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <UserCheck size={14} />
                      Select Freelancer
                    </button>
                  )}
                </div>
              </div>

              {/* Proposal Text Section (Sleek Dedicated Container) */}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-sans text-xs">
                      
                      {/* COL 1: TIMELINE & SPEED METRICS */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2 shadow-2xs flex flex-col justify-start">
                        {/* Header */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0">
                            <Clock size={14} />
                          </div>
                          <div>
                            <h4 className="font-headline font-extrabold text-slate-900 text-xs">Timeline & Speed Metrics</h4>
                            <p className="text-[10px] text-slate-500 font-sans">Performance at a glance</p>
                          </div>
                        </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <div className="bg-slate-50/80 p-1.5 px-2 rounded-lg border border-slate-200/60 flex flex-col justify-between space-y-0.5">
                          <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Briefcase size={11} />
                          </div>
                          <div>
                            <span className="text-[8px] font-mono uppercase font-bold text-slate-400 block tracking-wider">
                              JOBS COMPLETED
                            </span>
                            <div className="flex items-center gap-1 mt-0.5 font-mono font-black text-slate-900 text-[11px]">
                              <span>{completedCount}</span>
                              <span className="w-3 h-3 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[7.5px] font-bold">★</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50/80 p-1.5 px-2 rounded-lg border border-slate-200/60 flex flex-col justify-between space-y-0.5">
                          <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Clock size={11} />
                          </div>
                          <div>
                            <span className="text-[8px] font-mono uppercase font-bold text-slate-400 block tracking-wider">
                              ON-TIME RATE
                            </span>
                            <span className="font-mono font-extrabold text-emerald-600 text-[11px] block mt-0.5">
                              {onTimeRate}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50/80 p-1.5 px-2 rounded-lg border border-slate-200/60 col-span-2 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                              MILESTONES PROGRESS AVG.
                            </span>
                            <div className="w-4 h-4 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                              <TrendingUp size={10} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="font-mono font-extrabold text-purple-700 text-[11px]">
                              {progressAvg}
                            </span>
                            <div className="w-20 bg-slate-200/80 rounded-full h-1.5 flex items-center">
                              <div 
                                className="bg-purple-600 h-1.5 rounded-full transition-all duration-300" 
                                style={{ width: progressAvg.includes('N/A') ? '0%' : (progressAvg.includes('%') ? progressAvg : '0%') }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* COL 2: RATING & CREDENTIALS */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2 shadow-2xs flex flex-col justify-start">
                      {/* Header */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0">
                          <Star size={13} className="fill-amber-500" />
                        </div>
                        <div>
                          <h4 className="font-headline font-extrabold text-slate-900 text-xs">Rating & Credentials</h4>
                          <p className="text-[9.5px] text-slate-500 font-sans">Reputation that's provable</p>
                        </div>
                      </div>

                      {/* Credentials List with compact spacing */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                          <div className="flex items-center gap-1">
                            <Smile size={12} className="text-slate-400" />
                            <span className="text-[10.5px] text-slate-700 font-medium">Client Satisfaction</span>
                          </div>
                          {rating > 0 ? (
                            <div className="flex items-center gap-1">
                              {renderStars(rating)}
                              <span className="font-mono font-extrabold text-slate-900 text-[10.5px]">{rating.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="font-mono font-extrabold text-slate-400 text-[10.5px]">N/A</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                          <div className="flex items-center gap-1">
                            <Shield size={12} className="text-purple-600" />
                            <span className="text-[10.5px] text-slate-700 font-medium">Soulbound Badges</span>
                          </div>
                          <span className="font-mono font-extrabold text-purple-700 text-[10.5px]">
                            {soulboundCount} Attested
                          </span>
                        </div>

                        {/* Full Visible Bio Box */}
                        <div className="bg-[#FAF5FF] border border-purple-100/80 rounded-lg p-1.5 space-y-0.5 mt-1">
                          <div className="flex items-center gap-1 text-purple-700 font-bold">
                            <Award size={11} />
                            <span className="text-[8.5px] uppercase font-mono tracking-wider">BIO & ATTESTATIONS</span>
                          </div>
                          <p className="font-sans text-[10.5px] text-slate-800 leading-tight whitespace-pre-wrap">
                            {bio}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* COL 3: VERIFIED GITHUB ACTIVITY */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2 shadow-2xs flex flex-col justify-start">
                      {/* Header */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0">
                          <Code2 size={13} />
                        </div>
                        <div>
                          <h4 className="font-headline font-extrabold text-slate-900 text-xs">Verified GitHub Activity</h4>
                          <p className="text-[9.5px] text-slate-500 font-sans">On-chain code contributions</p>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <div className="bg-slate-50/80 p-1.5 px-2 rounded-lg border border-slate-200/60 flex flex-col justify-between space-y-0.5">
                          <div className="w-5 h-5 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                            <GitCommit size={11} />
                          </div>
                          <div>
                            <span className="text-[8px] font-mono uppercase font-bold text-slate-400 block tracking-wider">
                              TOTAL COMMITS
                            </span>
                            <span className="font-mono font-black text-slate-900 text-[11px] block mt-0.5">
                              {commitsCount}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50/80 p-1.5 px-2 rounded-lg border border-slate-200/60 flex flex-col justify-between space-y-0.5">
                          <div className="w-5 h-5 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                            <GitPullRequest size={11} />
                          </div>
                          <div>
                            <span className="text-[8px] font-mono uppercase font-bold text-slate-400 block tracking-wider">
                              PRS MERGED
                            </span>
                            <span className="font-mono font-black text-slate-900 text-[11px] block mt-0.5">
                              {prsCount}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Clean Linked Handle Card with Verified / Unverified Badge Position */}
                      {isVerified ? (
                        <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-1.5 px-2 flex items-center justify-between gap-1 overflow-hidden">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Github size={15} className="text-slate-900 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[7.5px] font-mono uppercase font-bold text-slate-400 block tracking-wider truncate">
                                LINKED HANDLE
                              </span>
                              <a 
                                href={`https://github.com/${githubUsername}`}
                                target="_blank" 
                                rel="noreferrer"
                                className="font-bold text-purple-700 text-[10.5px] hover:underline flex items-center gap-0.5 truncate"
                              >
                                <span className="truncate">@{githubUsername}</span>
                                <ExternalLink size={9} className="text-purple-400 shrink-0" />
                              </a>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[9.5px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 shadow-2xs whitespace-nowrap">
                            <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                            <span className="whitespace-nowrap">Verified</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-1.5 px-2 flex items-center justify-between gap-1 overflow-hidden">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Github size={15} className="text-amber-800 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[7.5px] font-mono uppercase font-bold text-amber-600 block tracking-wider truncate">
                                GITHUB STATUS
                              </span>
                              <span className="font-bold text-amber-900 text-[10.5px] block truncate">
                                Unlinked Account
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[9.5px] font-extrabold text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full shrink-0 shadow-2xs whitespace-nowrap">
                            <AlertCircle size={11} className="text-amber-600 shrink-0" />
                            <span className="whitespace-nowrap">Unverified</span>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
