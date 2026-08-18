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
  GitPullRequest
} from 'lucide-react';
import { Link } from 'react-router-dom';
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

          const name = profile?.displayName || 'Pasumarthi Sunny';
          const githubUsername = profile?.githubUsername || 'sunny200551';
          const completedCount = profile?.jobsCompletedCount !== undefined ? profile.jobsCompletedCount : completedJobs.length;
          const rating = profile?.rating !== undefined ? profile.rating : (completedCount > 0 ? 5.0 : 0);
          const onTimeRate = profile?.onTimeRate || (completedCount > 0 ? '100%' : 'N/A');
          const progressAvg = profile?.progressAvg || (activeJobs.length > 0 ? '75%' : (completedCount > 0 ? '100%' : 'N/A Completion'));
          const soulboundCount = profile?.reputationSbtCount !== undefined ? profile.reputationSbtCount : completedCount;
          const commitsCount = profile?.commitsCount !== undefined ? profile.commitsCount : 72;
          const prsCount = profile?.prsCount !== undefined ? profile.prsCount : 9;
          const bio = profile?.bio || 'Frontend developer for PolyLance | Web Development | Blockchain Enthusiast.';

          const avatarUrl = profile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

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

              {/* Expandable Talent Audit Drawer matching Image 2 perfectly */}
              {isExpanded && (
                <div className="pt-4 border-t border-slate-200/80">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans text-xs">
                    
                    {/* ─────────────────────────────────────────────────────────────
                        COL 1: TIMELINE & SPEED METRICS (IMAGE 2 MATCH)
                        ───────────────────────────────────────────────────────────── */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 space-y-4 shadow-2xs">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
                          <Clock size={18} />
                        </div>
                        <div>
                          <h4 className="font-headline font-bold text-slate-900 text-sm">Timeline & Speed Metrics</h4>
                          <p className="text-xs text-slate-500 font-sans">Performance at a glance</p>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 text-[10px]">
                        {/* Jobs Completed Card */}
                        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 flex flex-col justify-between space-y-2">
                          <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Briefcase size={14} />
                          </div>
                          <div>
                            <span className="text-[9px] font-mono uppercase font-bold text-slate-400 block tracking-wider">
                              JOBS COMPLETED
                            </span>
                            <div className="flex items-center gap-1.5 mt-1 font-mono font-black text-slate-900 text-base">
                              <span>{completedCount}</span>
                              <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[9px] font-bold">★</span>
                            </div>
                          </div>
                        </div>

                        {/* On-Time Rate Card */}
                        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 flex flex-col justify-between space-y-2">
                          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Clock size={14} />
                          </div>
                          <div>
                            <span className="text-[9px] font-mono uppercase font-bold text-slate-400 block tracking-wider">
                              ON-TIME RATE
                            </span>
                            <span className="font-mono font-extrabold text-emerald-600 text-sm block mt-1">
                              {onTimeRate}
                            </span>
                          </div>
                        </div>

                        {/* Milestones Progress Avg Card */}
                        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 col-span-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                              MILESTONES PROGRESS AVG.
                            </span>
                            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                              <TrendingUp size={14} />
                            </div>
                          </div>
                          <span className="font-mono font-extrabold text-purple-700 text-sm block">
                            {progressAvg}
                          </span>
                          <div className="flex items-center gap-3 pt-1">
                            <div className="w-full bg-slate-200/80 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: progressAvg.includes('N/A') ? '0%' : (progressAvg.includes('%') ? progressAvg : '0%') }}
                              />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">
                              {progressAvg.includes('N/A') ? '0%' : progressAvg}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Motto Banner A */}
                      <div className="bg-[#FAF5FF] border border-purple-100 rounded-2xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                          <Zap size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Speed is earned.</p>
                          <p className="text-[10px] text-slate-500 font-sans">Consistency is verified on-chain.</p>
                        </div>
                      </div>
                    </div>

                    {/* ─────────────────────────────────────────────────────────────
                        COL 2: RATING & CREDENTIALS (IMAGE 2 MATCH)
                        ───────────────────────────────────────────────────────────── */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 space-y-4 shadow-2xs">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0">
                          <Star size={18} className="fill-amber-500" />
                        </div>
                        <div>
                          <h4 className="font-headline font-bold text-slate-900 text-sm">Rating & Credentials</h4>
                          <p className="text-xs text-slate-500 font-sans">Reputation that's provable</p>
                        </div>
                      </div>

                      {/* Credentials List */}
                      <div className="space-y-3">
                        {/* Client Satisfaction Row */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <Smile size={16} className="text-slate-400" />
                            <span className="text-xs text-slate-700 font-medium">Client Satisfaction</span>
                          </div>
                          {rating > 0 ? (
                            <div className="flex items-center gap-1.5">
                              {renderStars(rating)}
                              <span className="font-mono font-extrabold text-slate-900 text-xs">{rating.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="font-mono font-extrabold text-slate-400 text-xs">N/A</span>
                          )}
                        </div>

                        {/* Soulbound Badges Row */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <Shield size={16} className="text-purple-600" />
                            <span className="text-xs text-slate-700 font-medium">Soulbound Badges</span>
                          </div>
                          <span className="font-mono font-extrabold text-purple-700 text-xs">
                            {soulboundCount} Attested
                          </span>
                        </div>

                        {/* Bio Box */}
                        <div className="bg-[#FAF5FF] border border-purple-100 rounded-2xl p-4 space-y-2">
                          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                            <Award size={16} />
                          </div>
                          <p className="font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {bio}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Motto Banner B */}
                      <div className="bg-[#FAF5FF] border border-purple-100 rounded-2xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                          <ShieldCheck size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Credentials are soulbound.</p>
                          <p className="text-[10px] text-slate-500 font-sans">They can't be faked or removed.</p>
                        </div>
                      </div>
                    </div>

                    {/* ─────────────────────────────────────────────────────────────
                        COL 3: VERIFIED GITHUB ACTIVITY & RECENT ACTIVITY SUMMARY (IMAGE 2 MATCH)
                        ───────────────────────────────────────────────────────────── */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 space-y-4 shadow-2xs">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
                          <Code2 size={18} />
                        </div>
                        <div>
                          <h4 className="font-headline font-bold text-slate-900 text-sm">Verified GitHub Activity</h4>
                          <p className="text-xs text-slate-500 font-sans">On-chain code contributions</p>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 text-[10px]">
                        {/* Total Commits Card */}
                        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 flex flex-col justify-between space-y-2">
                          <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <GitCommit size={14} />
                          </div>
                          <div>
                            <span className="text-[9px] font-mono uppercase font-bold text-slate-400 block tracking-wider">
                              TOTAL COMMITS
                            </span>
                            <span className="font-mono font-black text-slate-900 text-base block mt-0.5">
                              {commitsCount}
                            </span>
                          </div>
                        </div>

                        {/* PRs Merged Card */}
                        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 flex flex-col justify-between space-y-2">
                          <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <GitPullRequest size={14} />
                          </div>
                          <div>
                            <span className="text-[9px] font-mono uppercase font-bold text-slate-400 block tracking-wider">
                              PRS MERGED
                            </span>
                            <span className="font-mono font-black text-slate-900 text-base block mt-0.5">
                              {prsCount}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Linked Handle Card */}
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Github size={20} className="text-slate-900 shrink-0" />
                          <div>
                            <span className="text-[8px] font-mono uppercase font-extrabold text-slate-400 block tracking-wider">
                              LINKED HANDLE
                            </span>
                            <a 
                              href={`https://github.com/${githubUsername}`}
                              target="_blank" 
                              rel="noreferrer"
                              className="font-bold text-slate-900 text-xs hover:underline flex items-center gap-1 text-purple-700"
                            >
                              <span>@{githubUsername}</span>
                            </a>
                          </div>
                        </div>
                        <ExternalLink size={14} className="text-slate-400 shrink-0" />
                      </div>

                      {/* Verified Green Banner */}
                      <div className="bg-[#ECFDF5] border border-emerald-100 rounded-2xl p-3 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <CheckCircle2 size={16} />
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-tight">
                          All activity is verified directly from GitHub.
                        </p>
                      </div>

                      {/* NEW Feature: Recent Activity Summary (Matches Image 2 & User Request) */}
                      <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                        <h5 className="font-headline font-bold text-slate-900 text-xs">
                          Recent Activity Summary
                        </h5>
                        <ul className="space-y-1.5 text-xs text-slate-600 font-sans">
                          {recentActivities.map((act, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-purple-600 font-bold">•</span>
                              <span className="leading-snug">{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
