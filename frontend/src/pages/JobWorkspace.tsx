import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import {
  Briefcase,
  Layers,
  Search,
  ChevronDown,
  ArrowUpRight,
  MessageSquare,
  Check,
  X,
  ExternalLink,
  Scale,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  Filter,
  AlertTriangle,
  FileText,
  SlidersHorizontal,
  User,
  Link2,
  ChevronRight
} from 'lucide-react';
import { truncateAddress } from '../utils/formatters';
import { getJobInactivityStatus } from '../utils/inactivity';
import { DeliverableWorkSubmissionPanel } from '../components/DeliverableWorkSubmissionPanel';
import { EmptyState } from '../components/UIStates';

export type JobCategoryFilter = 'all' | 'ongoing' | 'awaiting_release' | 'disputed' | 'negotiating' | 'completed';

// Priority sorting helper:
// 1. Awaiting fund release (Submitted - urgent review & release)
// 2. Ongoing & In Progress (Funded, Selected)
// 3. Disputed (Escrow arbitration)
// 4. Negotiating / Terms (Open)
// 5. Completed & Settled
// 6. Cancelled
const getJobPriorityScore = (status: string): number => {
  switch (status) {
    case 'Submitted':
      return 1; // 1st priority: Awaiting Fund Release / Review
    case 'Funded':
      return 2; // Ongoing active escrow
    case 'Selected':
      return 3; // Talent selected / working
    case 'Disputed':
      return 4; // Dispute case under review
    case 'Open':
      return 5; // Terms discussion & negotiation
    case 'Completed':
      return 6; // Settled archive
    default:
      return 7;
  }
};

export const JobWorkspace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { address, currentRole, isConnected, connectWallet } = useWeb3();
  const { jobs, profiles } = usePolyLanceData();

  const userAddr = (address || '').toLowerCase();
  const isClientRole = currentRole === 'client';

  // Filter jobs strictly relevant to current user:
  // For Freelancers: ONLY show the jobs where this wallet is assigned or actively selected/working
  // For Clients: ONLY show the client's own created/issued jobs for this wallet
  const myJobs = useMemo(() => {
    if (!userAddr) return [];

    return jobs.filter((job) => {
      const statusInfo = getJobInactivityStatus(job);
      if (statusInfo.isExpired) return false;

      if (isClientRole) {
        // CLIENT: Strict match - ONLY show jobs issued by this connected client wallet
        return Boolean(job.client && job.client.toLowerCase() === userAddr);
      }
      
      // FREELANCER: Strict match - When a freelancer is selected, ONLY that selected freelancer can view the job workspace!
      if (job.freelancer) {
        return job.freelancer.toLowerCase() === userAddr;
      }
      // If no freelancer has been selected yet (open selection), show only to applicants who applied
      return Boolean(job.applications && job.applications.some((a) => a.applicant && a.applicant.toLowerCase() === userAddr));
    });
  }, [jobs, userAddr, isClientRole]);

  // Accurate active platform escrows count (excluding expired jobs)
  const activePlatformJobsCount = useMemo(() => {
    return jobs.filter((j) => !getJobInactivityStatus(j).isExpired).length;
  }, [jobs]);

  // Active Job selection state
  const queryJobId = searchParams.get('jobId');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(() => {
    if (queryJobId) return queryJobId;
    const lastOpened = typeof window !== 'undefined' ? localStorage.getItem('polylance_last_opened_job') : null;
    if (lastOpened && myJobs.some(j => j.id === lastOpened || j.contractAddress?.toLowerCase() === lastOpened.toLowerCase())) {
      return lastOpened;
    }
    if (myJobs.length > 0) return myJobs[0].id;
    return null;
  });

  useEffect(() => {
    if (queryJobId && myJobs.some(j => j.id === queryJobId || j.contractAddress?.toLowerCase() === queryJobId.toLowerCase())) {
      setSelectedJobId(queryJobId);
    } else if (!selectedJobId) {
      const lastOpened = typeof window !== 'undefined' ? localStorage.getItem('polylance_last_opened_job') : null;
      if (lastOpened && myJobs.some(j => j.id === lastOpened || j.contractAddress?.toLowerCase() === lastOpened.toLowerCase())) {
        setSelectedJobId(lastOpened);
      } else if (myJobs.length > 0) {
        setSelectedJobId(myJobs[0].id);
      }
    } else if (selectedJobId && !myJobs.some(j => j.id === selectedJobId || j.contractAddress?.toLowerCase() === selectedJobId?.toLowerCase())) {
      const lastOpened = typeof window !== 'undefined' ? localStorage.getItem('polylance_last_opened_job') : null;
      if (lastOpened && myJobs.some(j => j.id === lastOpened || j.contractAddress?.toLowerCase() === lastOpened.toLowerCase())) {
        setSelectedJobId(lastOpened);
      } else if (myJobs.length > 0) {
        setSelectedJobId(myJobs[0].id);
      } else {
        setSelectedJobId(null);
      }
    }
  }, [queryJobId, myJobs, selectedJobId]);

  const activeJob = useMemo(() => {
    if (myJobs.length === 0) return null;

    const targetId = selectedJobId || queryJobId;
    if (targetId) {
      const matchingJob = myJobs.find(
        (j) => j.id === targetId || j.contractAddress?.toLowerCase() === targetId.toLowerCase()
      );
      if (matchingJob) return matchingJob;
    }
    return myJobs[0];
  }, [myJobs, selectedJobId, queryJobId]);

  // Persist active job to localStorage so returning visitors resume this exact workspace
  useEffect(() => {
    if (activeJob?.id) {
      try {
        localStorage.setItem('polylance_last_opened_job', activeJob.id);
      } catch {}
    }
  }, [activeJob?.id]);

  // ── Job Switcher Dropdown ──
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<JobCategoryFilter>('all');
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Position for fixed dropdown
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const calculateDropdownPos = useCallback(() => {
    if (triggerBtnRef.current) {
      const rect = triggerBtnRef.current.getBoundingClientRect();
      const targetWidth = Math.min(Math.max(rect.width, 580), window.innerWidth - 32);
      let left = rect.left + window.scrollX;
      if (left + targetWidth > window.innerWidth - 16) {
        left = Math.max(16, window.innerWidth - targetWidth - 16);
      }
      return {
        top: rect.bottom + window.scrollY + 8,
        left,
        width: targetWidth,
      };
    }
    return null;
  }, []);

  const openDropdown = useCallback(() => {
    const pos = calculateDropdownPos();
    if (pos) {
      setDropdownPos(pos);
    }
    setIsJobDropdownOpen(true);
  }, [calculateDropdownPos]);

  const closeDropdown = useCallback(() => {
    setIsJobDropdownOpen(false);
    setJobSearchQuery('');
    setSelectedCategoryFilter('all');
  }, []);

  const toggleDropdown = useCallback(() => {
    if (isJobDropdownOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }, [isJobDropdownOpen, openDropdown, closeDropdown]);

  // Keyboard shortcut Cmd/Ctrl + K to toggle/focus search in Job Workspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!isJobDropdownOpen) {
          openDropdown();
        }
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isJobDropdownOpen, openDropdown]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerBtnRef.current && !triggerBtnRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        closeDropdown();
      }
    };
    if (isJobDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isJobDropdownOpen, closeDropdown]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!isJobDropdownOpen) return;
    const reposition = () => {
      const pos = calculateDropdownPos();
      if (pos) {
        setDropdownPos(pos);
      }
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [isJobDropdownOpen, calculateDropdownPos]);

  // Category counts across user's relevant jobs
  const categoryCounts = useMemo(() => {
    let ongoing = 0;
    let awaitingRelease = 0;
    let disputed = 0;
    let negotiating = 0;
    let completed = 0;

    myJobs.forEach((j) => {
      if (j.status === 'Submitted') {
        awaitingRelease++;
      } else if (j.status === 'Funded' || j.status === 'Selected') {
        ongoing++;
      } else if (j.status === 'Disputed') {
        disputed++;
      } else if (j.status === 'Open') {
        negotiating++;
      } else if (j.status === 'Completed') {
        completed++;
      }
    });

    return {
      all: myJobs.length,
      ongoing,
      awaiting_release: awaitingRelease,
      disputed,
      negotiating,
      completed,
    };
  }, [myJobs]);

  // Priority-Sorted and Filtered projects list
  const filteredMyJobs = useMemo(() => {
    let list = myJobs;

    // 1. Category Filter
    if (selectedCategoryFilter === 'ongoing') {
      list = list.filter((j) => j.status === 'Funded' || j.status === 'Selected');
    } else if (selectedCategoryFilter === 'awaiting_release') {
      list = list.filter((j) => j.status === 'Submitted');
    } else if (selectedCategoryFilter === 'disputed') {
      list = list.filter((j) => j.status === 'Disputed');
    } else if (selectedCategoryFilter === 'negotiating') {
      list = list.filter((j) => j.status === 'Open');
    } else if (selectedCategoryFilter === 'completed') {
      list = list.filter((j) => j.status === 'Completed');
    }

    // 2. Search Query Filter
    const q = jobSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((j) => {
        const titleMatch = j.title.toLowerCase().includes(q);
        const idMatch = j.id.toLowerCase().includes(q);
        const amountMatch = j.amountUsdc.includes(q);
        const statusMatch = j.status.toLowerCase().includes(q);
        const categoryMatch = Boolean(j.category && j.category.toLowerCase().includes(q));
        const contractMatch = Boolean(j.contractAddress && j.contractAddress.toLowerCase().includes(q));
        return titleMatch || idMatch || amountMatch || statusMatch || categoryMatch || contractMatch;
      });
    }

    // 3. Priority Sorting: Awaiting Release (1st) -> Ongoing (2nd) -> Disputed (3rd) -> Open (4th) -> Completed (5th)
    return [...list].sort((a, b) => {
      const scoreA = getJobPriorityScore(a.status);
      const scoreB = getJobPriorityScore(b.status);
      if (scoreA !== scoreB) return scoreA - scoreB;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [myJobs, selectedCategoryFilter, jobSearchQuery]);

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 mx-auto flex items-center justify-center shadow-xs">
          <Briefcase size={28} />
        </div>
        <h2 className="font-headline text-xl font-bold text-slate-900">Connect Wallet to Access Workspace</h2>
        <p className="text-xs text-slate-500 font-sans">
          Log in with your Web3 wallet to manage your deliverables, milestone submissions, progress logs, and escrow payouts.
        </p>
        <button
          onClick={connectWallet}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-mono font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (!activeJob) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-6 space-y-6">
        <EmptyState
          title="No Project Escrows Found"
          description={
            isClientRole
              ? 'You have not posted any project escrows yet.'
              : 'You have not been assigned to any active contracts or submitted proposals.'
          }
          actionText={isClientRole ? 'Post a New Job' : 'Browse Marketplace'}
          onAction={() => navigate(isClientRole ? '/jobs/post' : '/jobs')}
        />
      </div>
    );
  }

  const isClient = Boolean(userAddr && activeJob.client && activeJob.client.toLowerCase() === userAddr);
  const counterpartAddress = isClient ? (activeJob.freelancer || activeJob.applications?.[0]?.applicant || '') : activeJob.client;
  const counterpartKey = Object.keys(profiles).find((k) => k.toLowerCase() === counterpartAddress.toLowerCase());
  const counterpartProfile = counterpartKey ? profiles[counterpartKey] : null;
  const counterpartName = counterpartProfile?.displayName || (counterpartAddress ? truncateAddress(counterpartAddress) : 'Unassigned');

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">

      {/* ── TOP HEADER & INTERACTIVE MULTI-JOB SWITCHER ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* Job Switcher Trigger Area */}
          <div className="flex-1 min-w-0">
            {/* Label row */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                <Layers size={13} className="text-purple-600" />
                {isClient ? 'Client Project Workspace' : 'Freelancer Deliverable Workspace'}
              </span>
              <span className="bg-purple-100 text-purple-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-purple-200/60">
                {myJobs.length} {isClient ? 'My Project' : 'Working Job'}{myJobs.length !== 1 ? 's' : ''}
              </span>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-slate-200/60">
                {activePlatformJobsCount} Active Platform Escrows
              </span>
            </div>

            {/* Trigger button */}
            <button
              ref={triggerBtnRef}
              type="button"
              onClick={toggleDropdown}
              className={`relative overflow-hidden w-full flex items-center justify-between gap-4 p-4 rounded-3xl border text-left transition-all cursor-pointer group shadow-xs hover:shadow-md ${
                isJobDropdownOpen
                  ? 'bg-gradient-to-r from-blue-50/70 via-white to-blue-50/30 border-purple-300 ring-2 ring-purple-100'
                  : 'bg-gradient-to-r from-blue-50/40 via-white to-blue-50/20 hover:bg-slate-50 border-slate-200 hover:border-purple-300'
              }`}
              title="Click to switch active project workspace"
            >
              {/* Ambient top-right soft glow */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-blue-100/40 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 min-w-0 flex items-center gap-3.5 flex-1">
                {/* Blue squircle icon badge per Image 2 */}
                <div className="w-12 h-12 rounded-2xl bg-blue-100/70 border border-blue-200/60 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <FileText size={24} className="text-blue-600 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-headline font-bold text-base text-slate-900 truncate group-hover:text-purple-700 transition-colors">
                      {activeJob.title}
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 text-xs font-mono mt-1 text-slate-500">
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">$</span>
                      <span>${activeJob.amountUsdc} USDC</span>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <User size={13} className="text-slate-400" />
                      <span className="truncate">{counterpartName}</span>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="inline-flex items-center gap-1.5 text-slate-500">
                      <Link2 size={13} className="text-slate-400" />
                      <span>#{truncateAddress(activeJob.contractAddress || activeJob.id)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex items-center gap-3 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-mono font-bold text-xs uppercase tracking-wider shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>ACTIVE</span>
                </span>
                <div className="w-8 h-8 rounded-full bg-blue-50/80 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors shadow-2xs">
                  <ChevronDown size={16} className={`stroke-[2.5] transition-transform duration-200 ${isJobDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </button>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams({ jobId: activeJob.id });
                if (counterpartAddress) params.set('applicant', counterpartAddress);
                navigate(`/chat?${params.toString()}`);
              }}
              className="px-4 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              title="Open dedicated chat for this job"
            >
              <MessageSquare size={14} />
              <span>Open Messages Hub</span>
              <ArrowUpRight size={13} />
            </button>

            <Link
              to={`/jobs/${activeJob.id}`}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0"
            >
              <span>Contract Details</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <div className="space-y-6">
        {activeJob.status === 'Funded' || activeJob.status === 'Submitted' || activeJob.status === 'Disputed' || activeJob.status === 'Completed' || activeJob.status === 'Selected' || Boolean(activeJob.freelancer) || (activeJob.clientAgreedTerms && activeJob.freelancerAgreedTerms) ? (
          <DeliverableWorkSubmissionPanel job={activeJob} />
        ) : (
          <div className="bg-white border border-purple-200/80 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
            {/* Header & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0 shadow-inner">
                  <Scale size={28} className="text-purple-600 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Not Confirmed • Under Negotiation
                    </span>
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                      Stage: Candidate Review & Terms Discussion
                    </span>
                  </div>
                  <h3 className="font-headline font-black text-xl text-slate-900">
                    Terms & Milestone Negotiation in Progress
                  </h3>
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                    {isClient
                      ? 'This project escrow is currently in the negotiation stage. Work submission, deliverable proofs, and milestone verification will become available once you finalize agreed terms and fund the on-chain escrow vault.'
                      : 'You have not yet been confirmed or hired on-chain for this project. The client and applicants are currently negotiating budget and delivery timelines. Use the Messages Hub to coordinate with the client.'}
                  </p>
                </div>
              </div>

              {/* Status Badge Pill */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <span className="bg-purple-50 text-purple-800 border border-purple-200 text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
                  <Clock size={14} className="text-purple-600" />
                  <span>Awaiting Confirmation</span>
                </span>
              </div>
            </div>

            {/* Negotiation Overview Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                  Current Listed Budget
                </span>
                <p className="text-lg font-black text-slate-900 font-headline">
                  ${activeJob.amountUsdc} <span className="text-xs font-bold text-slate-500 font-sans">USDC</span>
                </p>
                <span className="text-[10px] font-mono text-purple-700 block">
                  {activeJob.negotiatedAmount ? `Negotiated: $${activeJob.negotiatedAmount} USDC` : 'Standard listing price'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                  Target Review Period
                </span>
                <p className="text-lg font-black text-slate-900 font-headline">
                  {activeJob.reviewPeriodDays || 7} <span className="text-xs font-bold text-slate-500 font-sans">Days</span>
                </p>
                <span className="text-[10px] font-mono text-slate-500 block">
                  Client review SLA window
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                  Candidates & Proposals
                </span>
                <p className="text-lg font-black text-slate-900 font-headline">
                  {activeJob.applications?.length || 0} <span className="text-xs font-bold text-slate-500 font-sans">Applicant(s)</span>
                </p>
                <span className="text-[10px] font-mono text-purple-700 block">
                  {activeJob.negotiationProposals?.length || 0} proposal term sheet(s)
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <Sparkles size={14} className="text-purple-600 shrink-0" />
                <span>Submit price & deadline counter-offers directly in encrypted chat.</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams({ jobId: activeJob.id });
                    if (counterpartAddress) params.set('applicant', counterpartAddress);
                    navigate(`/chat?${params.toString()}`);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>Open Messages & Negotiations</span>
                  <ArrowUpRight size={13} />
                </button>

                <Link
                  to={`/jobs/${activeJob.id}`}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <span>View Full Listing</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── FIXED-POSITION JOB SWITCHER DROPDOWN (escapes stacking context) ── */}
      {isJobDropdownOpen && dropdownPos && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
          }}
          className="bg-white/95 rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden animate-fadeIn backdrop-blur-md"
        >
          {/* Top Search Bar with ⌘ K */}
          <div className="p-4 pb-3 border-b border-slate-100 bg-white">
            <div className="relative flex items-center">
              <Search size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by title, ID, amount, counterpart, status..."
                value={jobSearchQuery}
                onChange={(e) => setJobSearchQuery(e.target.value)}
                className="w-full pl-11 pr-14 py-3 text-xs sm:text-sm bg-white border border-slate-200/90 rounded-2xl focus:border-purple-300 focus:ring-3 focus:ring-purple-100/80 outline-none transition-all font-sans text-slate-800 placeholder:text-slate-400 shadow-2xs"
                autoFocus
              />
              {jobSearchQuery ? (
                <button
                  type="button"
                  onClick={() => setJobSearchQuery('')}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={16} />
                </button>
              ) : (
                <div className="absolute right-3.5 pointer-events-none flex items-center">
                  <kbd className="text-[11px] font-mono text-slate-400 bg-slate-100/90 border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs font-semibold">
                    ⌘ K
                  </kbd>
                </div>
              )}
            </div>
          </div>

          {/* Filter Pills and Sort Row matching Image 2 */}
          <div className="px-4 py-3 border-b border-slate-100/80 bg-slate-50/40 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
            {/* Filter pills */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-purple-100/90 text-purple-700 border border-purple-200/70'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
                }`}
              >
                <span>All</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-bold min-w-[18px] text-center ${
                  selectedCategoryFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}>
                  {categoryCounts.all}
                </span>
              </button>

              {categoryCounts.completed > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('completed')}
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                    selectedCategoryFilter === 'completed'
                      ? 'bg-purple-100/90 text-purple-700 border border-purple-200/70'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  <CheckCircle2 size={14} className={selectedCategoryFilter === 'completed' ? 'text-purple-600' : 'text-slate-500'} />
                  <span>Completed</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-bold min-w-[18px] text-center ${
                    selectedCategoryFilter === 'completed' ? 'bg-purple-600 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {categoryCounts.completed}
                  </span>
                </button>
              )}

              {categoryCounts.ongoing > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('ongoing')}
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                    selectedCategoryFilter === 'ongoing'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  <Zap size={14} className={selectedCategoryFilter === 'ongoing' ? 'text-emerald-700' : 'text-emerald-600'} />
                  <span>Ongoing</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-bold min-w-[18px] text-center ${
                    selectedCategoryFilter === 'ongoing' ? 'bg-emerald-600 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {categoryCounts.ongoing}
                  </span>
                </button>
              )}

              {categoryCounts.awaiting_release > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('awaiting_release')}
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                    selectedCategoryFilter === 'awaiting_release'
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  <Clock size={14} className={selectedCategoryFilter === 'awaiting_release' ? 'text-indigo-700' : 'text-indigo-600'} />
                  <span>Awaiting Release</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-bold min-w-[18px] text-center ${
                    selectedCategoryFilter === 'awaiting_release' ? 'bg-indigo-600 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {categoryCounts.awaiting_release}
                  </span>
                </button>
              )}

              {categoryCounts.negotiating > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('negotiating')}
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                    selectedCategoryFilter === 'negotiating'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  <MessageSquare size={14} className={selectedCategoryFilter === 'negotiating' ? 'text-amber-700' : 'text-amber-600'} />
                  <span>Negotiating</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-bold min-w-[18px] text-center ${
                    selectedCategoryFilter === 'negotiating' ? 'bg-amber-600 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {categoryCounts.negotiating}
                  </span>
                </button>
              )}

              {categoryCounts.disputed > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('disputed')}
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                    selectedCategoryFilter === 'disputed'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  <Scale size={14} className={selectedCategoryFilter === 'disputed' ? 'text-rose-700' : 'text-rose-600'} />
                  <span>Disputed</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-bold min-w-[18px] text-center ${
                    selectedCategoryFilter === 'disputed' ? 'bg-rose-600 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {categoryCounts.disputed}
                  </span>
                </button>
              )}
            </div>

            {/* Sort trigger button matching Image 2 */}
            <div className="shrink-0">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium shadow-2xs transition-all select-none">
                <SlidersHorizontal size={14} className="text-slate-600" />
                <span>Sorted by Priority</span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
            </div>
          </div>

          {/* Section Header: My Working Contracts (X) */}
          <div className="px-5 pt-4 pb-2 flex items-center justify-between select-none">
            <h3 className="font-headline font-bold text-slate-900 text-base sm:text-lg tracking-tight">
              {isClientRole ? 'My Project Escrows' : 'My Working Contracts'} ({filteredMyJobs.length})
            </h3>
            <span className="text-xs text-slate-400 font-sans">
              Sorted by Priority
            </span>
          </div>

          {/* Scrollable job list matching Image 2 */}
          <div className="overflow-y-auto max-h-[380px] p-3 pt-1 space-y-2.5">
            {filteredMyJobs.length > 0 ? (
              filteredMyJobs.map((j) => {
                const isSelected = j.id === activeJob.id;
                const isClientJob = (j.client && j.client.toLowerCase() === userAddr) || isClientRole;
                const counterpart = isClientJob ? (j.freelancer || j.applications?.[0]?.applicant || '') : j.client;
                const counterpartProfileKey = Object.keys(profiles || {}).find(k => k.toLowerCase() === counterpart.toLowerCase());
                const counterpartProfile = counterpartProfileKey ? profiles[counterpartProfileKey] : null;
                const counterpartLabel = counterpartProfile?.displayName || (counterpart ? truncateAddress(counterpart) : 'Unassigned');

                return (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => {
                      setSelectedJobId(j.id);
                      setSearchParams({ jobId: j.id });
                      closeDropdown();
                    }}
                    className={`relative w-full p-4 sm:p-5 rounded-2xl text-left flex items-center justify-between gap-4 transition-all cursor-pointer overflow-hidden group shadow-xs hover:shadow-md ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-50/50 via-white to-blue-50/20 border-2 border-purple-300 ring-2 ring-purple-100/80'
                        : 'bg-white hover:bg-slate-50/80 border border-slate-200/80'
                    }`}
                  >
                    {/* Ambient top-right glow matching Image 2 */}
                    <div className="absolute -top-10 -right-10 w-44 h-44 bg-blue-100/40 rounded-full blur-2xl pointer-events-none" />

                    {/* Left Document Icon Badge */}
                    <div className="relative z-10 flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-100/70 border border-blue-200/60 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <FileText size={26} className="text-blue-600 stroke-[2.2]" />
                      </div>

                      {/* Center Information */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-headline font-bold text-base sm:text-lg text-slate-900 tracking-tight truncate group-hover:text-purple-700 transition-colors">
                            {j.title}
                          </h4>
                        </div>

                        {/* Meta row matching Image 2 */}
                        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 text-xs font-mono mt-1.5">
                          {/* Amount in Emerald */}
                          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                              $
                            </span>
                            <span>${j.amountUsdc} USDC</span>
                          </span>

                          {/* Divider */}
                          <span className="text-slate-300 font-light">|</span>

                          {/* Counterpart / Client with User icon */}
                          <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                            <User size={13} className="text-slate-400" />
                            <span className="truncate">{counterpartLabel}</span>
                          </span>

                          {/* Divider */}
                          <span className="text-slate-300 font-light">|</span>

                          {/* Contract / Hash with Link icon */}
                          <span className="inline-flex items-center gap-1.5 text-slate-500 font-mono">
                            <Link2 size={13} className="text-slate-400" />
                            <span>#{truncateAddress(j.contractAddress || j.id)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Section: Status Pill & Action Chevron */}
                    <div className="relative z-10 flex items-center gap-3 shrink-0">
                      {/* Active status pill per Image 2 */}
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-mono font-bold text-xs uppercase tracking-wider shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{isSelected ? 'ACTIVE' : j.status.toUpperCase()}</span>
                      </span>

                      {/* Chevron action button in rounded circle */}
                      <div className="w-9 h-9 rounded-full bg-blue-50/80 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors shadow-2xs">
                        <ChevronRight size={18} className="stroke-[2.5]" />
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-mono space-y-1">
                <p>No project escrows match the selected filter.</p>
                {selectedCategoryFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter('all')}
                    className="text-purple-600 font-bold hover:underline cursor-pointer text-[11px] block mx-auto mt-1"
                  >
                    View All Projects ({categoryCounts.all})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
