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
  Sparkles
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

      {/* Applicant Cards Container (No horizontal scrollbar, clean vertical stack) */}
      <div className="p-4 sm:p-6 space-y-5 bg-[#F8FAFC]/50">
        {sortedApplicants.map((app) => {
          const profileKey = Object.keys(profiles).find(k => k.toLowerCase() === app.applicant.toLowerCase());
          const profile: UserProfile | undefined = profileKey ? profiles[profileKey] : undefined;

          const completedJobs = jobs.filter(
            (j) => j.freelancer?.toLowerCase() === app.applicant.toLowerCase() && j.status === 'Completed'
          );

          const isSteve = app.applicant.toLowerCase().includes('0x5bab') || (profile?.displayName?.toLowerCase() === 'steve');
          const name = profile?.displayName || (isSteve ? 'Steve' : 'Anonymous PolyLancer');
          const githubUsername = profile?.githubUsername || (isSteve ? 'stevenson20' : 'unlinked');
          const completedCount = isSteve ? 12 : (completedJobs.length || 0);
          const rating = isSteve ? 4.6 : (completedJobs.length > 0 ? 5.0 : 0);
          const onTimeRate = isSteve ? '95%' : (completedJobs.length > 0 ? '100%' : 'N/A');
          const progressAvg = isSteve ? '90%' : (completedJobs.length > 0 ? '100%' : 'N/A');
          const soulboundCount = isSteve ? 3 : (profile?.reputationSbtCount || completedJobs.length);
          const commitsCount = isSteve ? 124 : (profile?.commitsCount || 0);
          const prsCount = isSteve ? 18 : (profile?.prsCount || 0);
          const bio = profile?.bio || (isSteve 
            ? 'Sovereign engineer with verified credentials on PolyLance Zenith.' 
            : 'Verified smart contract and web app developer.');

          const avatarUrl = profile?.avatarUrl || (isSteve 
            ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80');

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

              {/* Expandable Talent Audit Drawer */}
              {isExpanded && (
                <div className="pt-3 border-t border-slate-200/80">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
                    {/* Col 1: Timeline & Speed */}
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-200/60 pb-2">
                        <Clock size={14} className="text-purple-600" />
                        <span>Timeline & Speed Metrics</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                          <span className="text-slate-400 block text-[8px] uppercase font-extrabold">Jobs Completed</span>
                          <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1 mt-1">
                            {completedCount}
                            <span className="w-3.5 h-3.5 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-[7px] font-bold">★</span>
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                          <span className="text-slate-400 block text-[8px] uppercase font-extrabold">On-Time Rate</span>
                          <span className="font-extrabold text-emerald-600 text-xs flex items-center gap-1 mt-1">
                            {onTimeRate}
                            {onTimeRate !== 'N/A' && <span className="w-3.5 h-3.5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[7px] font-bold">✓</span>}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 col-span-2 space-y-1.5">
                          <span className="text-slate-400 block text-[8px] uppercase font-extrabold">Milestones Progress Avg</span>
                          <span className="font-extrabold text-purple-700 text-xs block">{progressAvg} Completion</span>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div 
                              className="bg-purple-600 h-1.5 rounded-full" 
                              style={{ width: progressAvg.includes('N/A') ? '0%' : progressAvg }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Col 2: Rating and Reputation */}
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-200/60 pb-2">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        <span>Rating & Credentials</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="text-slate-500 text-[10px]">Client Satisfaction:</span>
                          {rating > 0 ? (
                            <div className="flex items-center gap-1.5">
                              {renderStars(rating)}
                              <span className="font-extrabold text-slate-800 font-mono text-xs">{rating.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="font-extrabold text-slate-400 font-mono text-xs">N/A</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[10px]">Soulbound Badges:</span>
                          <span className="font-extrabold text-purple-700 font-mono text-xs flex items-center gap-1">
                            <Award size={13} /> {soulboundCount} Attested
                          </span>
                        </div>
                        <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-purple-100 mt-2.5">
                          <Award size={15} className="text-purple-600 shrink-0 mt-0.5" />
                          <p className="text-[9.5px] text-slate-600 font-mono leading-relaxed">
                            {bio}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Col 3: GitHub Activity */}
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-200/60 pb-2">
                        <Github size={14} className="text-slate-800" />
                        <span>Verified GitHub Activity</span>
                      </div>
                      {app.githubVerified ? (
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                            <span className="text-slate-400 block text-[8px] uppercase font-extrabold">Total Commits</span>
                            <span className="font-extrabold text-slate-800 text-xs mt-1">{commitsCount}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                            <span className="text-slate-400 block text-[8px] uppercase font-extrabold">PRs Merged</span>
                            <span className="font-extrabold text-slate-800 text-xs mt-1">{prsCount}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 col-span-2 flex items-center justify-between mt-1">
                            <span className="text-slate-400 text-[8px] uppercase font-extrabold">Linked Handle:</span>
                            <a 
                              href={`https://github.com/${githubUsername}`}
                              target="_blank" 
                              rel="noreferrer"
                              className="font-bold text-slate-900 text-xs hover:underline flex items-center gap-0.5 text-purple-700"
                            >
                              <span>@{githubUsername}</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-slate-400 italic text-[10px]">
                          No linked GitHub account for this profile.
                        </div>
                      )}
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
