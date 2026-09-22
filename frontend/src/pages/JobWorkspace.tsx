import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData, isDemoOrMockJob } from '../context/PolyLanceDataContext';
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
  ChevronRight,
  Trash2,
  Edit3,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { truncateAddress } from '../utils/formatters';
import { getJobInactivityStatus } from '../utils/inactivity';
import { DeliverableWorkSubmissionPanel } from '../components/DeliverableWorkSubmissionPanel';
import { ModifyJobModal } from '../components/ModifyJobModal';
import { EmptyState } from '../components/UIStates';
import { PolyLanceAlertModal, AlertModalOptions } from '../components/PolyLanceAlertModal';
import { Job } from '../types';

export type JobCategoryFilter = 'all' | 'ongoing' | 'awaiting_release' | 'disputed' | 'negotiating' | 'completed';
export type JobSortOption = 'latest' | 'priority' | 'oldest' | 'highest_budget' | 'lowest_budget' | 'title_az';

export const SORT_LABELS: Record<JobSortOption, string> = {
  latest: 'Latest First',
  priority: 'Sorted by Priority',
  oldest: 'Oldest First',
  highest_budget: 'Highest Budget',
  lowest_budget: 'Lowest Budget',
  title_az: 'Title (A-Z)',
};

export const formatJobDate = (createdAt?: number | string): string => {
  if (!createdAt) return '';
  const time = typeof createdAt === 'string' ? new Date(createdAt).getTime() : Number(createdAt);
  if (!time || isNaN(time)) return '';
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - time) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Priority sorting helper:
// 1. Awaiting fund release (Submitted - urgent review & release)
// 2. Ongoing & In Progress (Funded, Selected)
// 3. Disputed (Escrow arbitration)
// 4. Negotiating / Terms (Open)
// 5. Completed & Settled
export const isJobUnderNegotiation = (j: Job): boolean => {
  if (j.status === 'Completed' || j.status === 'Disputed' || j.status === 'Submitted' || j.status === 'Cancelled') {
    return false;
  }
  if (j.status === 'Open') return true;
  if (j.status === 'Selected') {
    const isFunded = (j.events || []).some((e: any) => e.step === 'Funded' && e.status === 'completed');
    const bothAgreed = Boolean(j.clientAgreedTerms && j.freelancerAgreedTerms);
    return !isFunded || !bothAgreed;
  }
  return false;
};

// Priority sorting helper:
// 1. Awaiting fund release (Submitted - urgent review & release)
// 2. Ongoing & In Progress (Funded)
// 3. Disputed (Escrow arbitration)
// 4. Negotiating / Terms (Open or Selected before funding)
// 5. Completed & Settled
// 6. Cancelled
const getJobPriorityScore = (status: string, isNegotiating: boolean): number => {
  if (status === 'Submitted') return 1;
  if (status === 'Funded') return 2;
  if (status === 'Disputed') return 3;
  if (isNegotiating || status === 'Open' || status === 'Selected') return 4;
  if (status === 'Completed') return 5;
  return 6;
};

export const JobWorkspace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { address, currentRole, isConnected, connectWallet } = useWeb3();
  const { jobs, profiles, deleteJob } = usePolyLanceData();
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);

  const userAddr = (address || '').toLowerCase();
  const isClientRole = currentRole === 'client';

  // Filter jobs strictly relevant to current user:
  // Shows jobs where connected user is Client (posted), Freelancer (assigned), Applicant, or active Negotiator.
  // Note: We do NOT hide user's own contracts due to inactivity expiration so clients and freelancers can always access their jobs.
  const myJobs = useMemo(() => {
    if (!userAddr) return [];

    return jobs.filter((job) => {
      if (isDemoOrMockJob(job)) return false;

      const isClientOfJob = Boolean(job.client && job.client.toLowerCase() === userAddr);
      const isFreelancerOfJob = Boolean(job.freelancer && job.freelancer.toLowerCase() === userAddr);
      const hasApplied = Boolean(job.applications && job.applications.some((a) => a.applicant && a.applicant.toLowerCase() === userAddr));
      const hasNegotiated = Boolean(
        (job.negotiationProposals && job.negotiationProposals.some((p: any) => p.sender?.toLowerCase() === userAddr || p.applicantAddress?.toLowerCase() === userAddr)) ||
        (job.preAcceptMessages && job.preAcceptMessages.some((m: any) => m.sender?.toLowerCase() === userAddr || m.senderAddress?.toLowerCase() === userAddr || m.applicantAddress?.toLowerCase() === userAddr))
      );

      return isClientOfJob || isFreelancerOfJob || hasApplied || hasNegotiated;
    });
  }, [jobs, userAddr]);

  const [alertModalOptions, setAlertModalOptions] = useState<AlertModalOptions | null>(null);

  const handleDeleteActiveJob = () => {
    if (!activeJob) return;
    setAlertModalOptions({
      title: 'Remove Job Posting',
      message: `Are you sure you want to delete/remove the job "${activeJob.title}"?`,
      type: 'confirm',
      showCancel: true,
      isDestructive: true,
      confirmText: 'Delete Job',
      onConfirm: async () => {
        const deletingId = activeJob.id;
        const deletingContract = activeJob.contractAddress;
        const ok = await deleteJob(deletingId);
        if (ok) {
          try {
            localStorage.removeItem('polylance_last_opened_job');
          } catch {}
          const remaining = myJobs.filter(j => j.id !== deletingId && j.contractAddress !== deletingContract);
          if (remaining.length > 0) {
            setSelectedJobId(remaining[0].id);
            setSearchParams({ jobId: remaining[0].id });
          } else {
            setSelectedJobId(null);
            setSearchParams({});
          }
        }
      },
    });
  };


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

  // ── Job Switcher Dropdown & Sorting State ──
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<JobCategoryFilter>('all');
  const [sortOption, setSortOption] = useState<JobSortOption>('latest');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Position for fixed dropdown
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const calculateDropdownPos = useCallback(() => {
    if (triggerBtnRef.current) {
      const rect = triggerBtnRef.current.getBoundingClientRect();
      const targetWidth = Math.min(Math.max(rect.width, 620), window.innerWidth - 32);
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
    setIsSortMenuOpen(false);
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

  // Close on click outside dropdown
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

  // Close on click outside sort menu
  useEffect(() => {
    const handleClickOutsideSort = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    if (isSortMenuOpen) {
      document.addEventListener('mousedown', handleClickOutsideSort);
    }
    return () => document.removeEventListener('mousedown', handleClickOutsideSort);
  }, [isSortMenuOpen]);

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

  // Base jobs: Strictly user's own relevant escrows (client, freelancer, applicant, arbitrator)
  const displayedBaseJobs = myJobs;

  // Category counts across the active scope
  const categoryCounts = useMemo(() => {
    let ongoing = 0;
    let awaitingRelease = 0;
    let disputed = 0;
    let negotiating = 0;
    let completed = 0;

    displayedBaseJobs.forEach((j) => {
      if (j.status === 'Submitted') {
        awaitingRelease++;
      } else if (j.status === 'Completed') {
        completed++;
      } else if (j.status === 'Disputed') {
        disputed++;
      } else if (isJobUnderNegotiation(j)) {
        negotiating++;
      } else if (j.status === 'Funded' || j.status === 'Selected') {
        ongoing++;
      }
    });

    return {
      all: displayedBaseJobs.length,
      ongoing,
      awaiting_release: awaitingRelease,
      disputed,
      negotiating,
      completed,
    };
  }, [displayedBaseJobs]);

  // Priority-Sorted and Filtered projects list
  const filteredMyJobs = useMemo(() => {
    let list = displayedBaseJobs;

    // 1. Category Filter
    if (selectedCategoryFilter === 'ongoing') {
      list = list.filter((j) => !isJobUnderNegotiation(j) && (j.status === 'Funded' || j.status === 'Selected'));
    } else if (selectedCategoryFilter === 'awaiting_release') {
      list = list.filter((j) => j.status === 'Submitted');
    } else if (selectedCategoryFilter === 'disputed') {
      list = list.filter((j) => j.status === 'Disputed');
    } else if (selectedCategoryFilter === 'negotiating') {
      list = list.filter((j) => isJobUnderNegotiation(j));
    } else if (selectedCategoryFilter === 'completed') {
      list = list.filter((j) => j.status === 'Completed');
    }

    // 2. Search Query Filter
    const q = jobSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((j) => {
        const titleMatch = j.title.toLowerCase().includes(q);
        const idMatch = j.id.toLowerCase().includes(q);
        const amountMatch = (j.amountUsdc || j.amountEth || '').toLowerCase().includes(q);
        const statusMatch = j.status.toLowerCase().includes(q);
        const categoryMatch = Boolean(j.category && j.category.toLowerCase().includes(q));
        const contractMatch = Boolean(j.contractAddress && j.contractAddress.toLowerCase().includes(q));
        const clientMatch = Boolean(j.client && j.client.toLowerCase().includes(q));
        const freelancerMatch = Boolean(j.freelancer && j.freelancer.toLowerCase().includes(q));
        const applicantMatch = Boolean(j.applications && j.applications.some((a) => a.applicant?.toLowerCase().includes(q)));
        return titleMatch || idMatch || amountMatch || statusMatch || categoryMatch || contractMatch || clientMatch || freelancerMatch || applicantMatch;
      });
    }

    // 3. User-Selected Sorting (Default: Latest First!)
    return [...list].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() || Number(a.createdAt) : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() || Number(b.createdAt) : 0;

      if (sortOption === 'latest') {
        if (timeB !== timeA) return timeB - timeA;
        return String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
      }

      if (sortOption === 'oldest') {
        if (timeA !== timeB) return timeA - timeB;
        return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
      }

      if (sortOption === 'priority') {
        const scoreA = getJobPriorityScore(a.status, isJobUnderNegotiation(a));
        const scoreB = getJobPriorityScore(b.status, isJobUnderNegotiation(b));
        if (scoreA !== scoreB) return scoreA - scoreB;
        return timeB - timeA;
      }

      if (sortOption === 'highest_budget') {
        const budgetA = parseFloat(a.amountUsdc || a.amountEth || '0') || 0;
        const budgetB = parseFloat(b.amountUsdc || b.amountEth || '0') || 0;
        return budgetB - budgetA;
      }

      if (sortOption === 'lowest_budget') {
        const budgetA = parseFloat(a.amountUsdc || a.amountEth || '0') || 0;
        const budgetB = parseFloat(b.amountUsdc || b.amountEth || '0') || 0;
        return budgetA - budgetB;
      }

      if (sortOption === 'title_az') {
        return (a.title || '').localeCompare(b.title || '');
      }

      return timeB - timeA;
    });
  }, [displayedBaseJobs, selectedCategoryFilter, jobSearchQuery, sortOption]);

  // Security Guard: Check if user attempted direct URL access to another user's private contract escrow
  const isUnauthorizedQueryJob = Boolean(
    queryJobId &&
    jobs.some((j) => (j.id === queryJobId || j.contractAddress?.toLowerCase() === queryJobId.toLowerCase()) && !isDemoOrMockJob(j)) &&
    !myJobs.some((j) => j.id === queryJobId || j.contractAddress?.toLowerCase() === queryJobId.toLowerCase())
  );

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white rounded-3xl border border-purple-200/80 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 mx-auto flex items-center justify-center shadow-inner border border-purple-200">
          <ShieldAlert size={32} className="text-purple-700 animate-pulse" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            POLYLANCE SECURITY GATEWAY • NON-MEMBER ACCESS RESTRICTED
          </span>
          <h2 className="font-headline text-2xl font-black text-slate-900">
            Connect Wallet to Access Workspace
          </h2>
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            Decentralized escrows, private work deliverables, milestone dispute evidence, and encrypted communications are strictly protected. Connect your Web3 wallet to authenticate as an authorized participant.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={connectWallet}
            className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-mono font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap size={15} />
            <span>Connect Polylancer Wallet</span>
          </button>
        </div>
      </div>
    );
  }

  if (isUnauthorizedQueryJob) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-200 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center shadow-inner border border-rose-200">
          <Lock size={30} className="text-rose-600" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            CONFIDENTIAL ESCROW • ACCESS RESTRICTED
          </span>
          <h2 className="font-headline text-2xl font-black text-slate-900">
            Unauthorized Contract Access
          </h2>
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            This project escrow belongs to another client and freelancer. Under PolyLance security standards, workspace deliverables, communication logs, and milestone submissions are strictly restricted to authorized contract participants.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => {
              setSearchParams({});
              if (myJobs.length > 0) {
                setSelectedJobId(myJobs[0].id);
              }
            }}
            className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-mono font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Return to My Escrows
          </button>
        </div>
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
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">

          {/* Job Switcher Trigger Area */}
          <div className="flex-1 min-w-0">
            {/* Label row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-2">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                <Layers size={13} className="text-purple-600 shrink-0" />
                <span>{isClient ? 'Client Project Workspace' : 'Freelancer Deliverable Workspace'}</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-purple-50 text-purple-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-purple-200/60 whitespace-nowrap">
                  {myJobs.length} {isClient ? 'Project' : 'Job'}{myJobs.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Trigger button */}
            <button
              ref={triggerBtnRef}
              type="button"
              onClick={toggleDropdown}
              className={`relative overflow-hidden w-full flex items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer group shadow-2xs hover:shadow-sm ${
                isJobDropdownOpen
                  ? 'bg-gradient-to-r from-blue-50/70 via-white to-blue-50/30 border-purple-300 ring-2 ring-purple-100'
                  : 'bg-gradient-to-r from-blue-50/40 via-white to-blue-50/20 hover:bg-slate-50 border-slate-200 hover:border-purple-300'
              }`}
              title="Click to switch active project workspace"
            >
              {/* Ambient top-right soft glow */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-blue-100/40 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 flex-1 w-full">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  {/* Blue squircle icon badge */}
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-100/70 border border-blue-200/60 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <FileText size={18} className="text-blue-600 stroke-[2.2] sm:hidden" />
                    <FileText size={22} className="text-blue-600 stroke-[2.2] hidden sm:block" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-headline font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-purple-700 transition-colors">
                        {activeJob.title}
                      </span>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 text-[11px] sm:text-xs font-mono mt-0.5 text-slate-500">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shadow-2xs">
                          {activeJob.paymentTokenSymbol === 'POL' || activeJob.paymentTokenSymbol === 'MATIC' ? '⬡' : '$'}
                        </span>
                        <span>
                          {(() => {
                            const sym = (activeJob.paymentTokenSymbol || 'USDC').toUpperCase();
                            const isCrypto = sym === 'POL' || sym === 'MATIC' || sym === 'ETH' || sym === 'BTC';
                            const amt = isCrypto ? (activeJob.amountEth || activeJob.amountUsdc) : activeJob.amountUsdc;
                            return isCrypto ? `${amt} ${sym}` : `$${amt} USDC`;
                          })()}
                        </span>
                      </span>
                      <span className="text-slate-300 hidden sm:inline">|</span>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <User size={11} className="text-slate-400" />
                        <span className="truncate max-w-[120px]">{counterpartName}</span>
                      </span>
                      <span className="text-slate-300 hidden sm:inline">|</span>
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Link2 size={11} className="text-slate-400" />
                        <span>#{truncateAddress(activeJob.contractAddress || activeJob.id)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 self-stretch sm:self-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-mono font-bold text-[9.5px] sm:text-[10.5px] uppercase tracking-wider shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>ACTIVE</span>
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-50/80 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors shadow-2xs shrink-0">
                    <ChevronDown size={13} className={`stroke-[2.5] transition-transform duration-200 ${isJobDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
            {isClient && (
              <>
                <button
                  type="button"
                  onClick={() => setIsModifyModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer truncate"
                  title="Modify job title, description, budget, and review requirements"
                >
                  <Edit3 size={13} className="shrink-0 text-purple-600" />
                  <span className="truncate">Modify Job</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteActiveJob}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer truncate"
                  title="Delete this job posting"
                >
                  <Trash2 size={13} className="shrink-0 text-rose-600" />
                  <span className="truncate">Delete</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams({ jobId: activeJob.id });
                if (counterpartAddress) params.set('applicant', counterpartAddress);
                navigate(`/chat?${params.toString()}`);
              }}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer truncate"
              title="Open dedicated chat for this job"
            >
              <MessageSquare size={13} className="shrink-0 text-slate-500" />
              <span className="truncate">Messages</span>
              <ArrowUpRight size={12} className="shrink-0" />
            </button>

            <Link
              to={`/jobs/${activeJob.id}`}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs truncate"
            >
              <span className="truncate">Contract</span>
              <ExternalLink size={12} className="shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <div id="deliverable-workspace" className="space-y-6">
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
                <div className="text-lg font-black text-slate-900 font-headline">
                  {(() => {
                    const sym = (activeJob.paymentTokenSymbol || 'USDC').toUpperCase();
                    const isCrypto = sym === 'POL' || sym === 'MATIC' || sym === 'ETH' || sym === 'BTC';
                    const amt = isCrypto ? (activeJob.amountEth || activeJob.amountUsdc) : activeJob.amountUsdc;
                    return isCrypto ? (
                      <>
                        <span>{amt}</span> <span className="text-xs font-bold text-slate-500 font-sans">{sym}</span>
                        <span className="text-[11px] font-normal text-slate-400 block font-mono">≈ ${activeJob.amountUsdc} USDC</span>
                      </>
                    ) : (
                      <>
                        ${amt} <span className="text-xs font-bold text-slate-500 font-sans">USDC</span>
                      </>
                    );
                  })()}
                </div>
                <span className="text-[10px] font-mono text-purple-700 block">
                  {activeJob.negotiatedAmount ? `Negotiated: ${activeJob.negotiatedAmount} ${activeJob.paymentTokenSymbol || 'USDC'}` : 'Standard listing price'}
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
                {isClient && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsModifyModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Edit3 size={14} className="text-purple-600" />
                      <span>Modify Job Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteActiveJob}
                      className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Trash2 size={14} className="text-rose-600" />
                      <span>Delete Posting</span>
                    </button>
                  </>
                )}

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

          {/* Filter Pills and Sort Dropdown Row */}
          <div className="px-4 py-2.5 border-b border-slate-100/80 bg-slate-50/40 flex items-center justify-between gap-3">
            {/* Category filter pills - scrollable horizontally on smaller viewports */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 flex-1 py-0.5">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200/80'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
                }`}
              >
                <span>All</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[17px] text-center ${
                  selectedCategoryFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}>
                  {categoryCounts.all}
                </span>
              </button>

              {categoryCounts.completed > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('completed')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                    selectedCategoryFilter === 'completed'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200/80'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  <CheckCircle2 size={13} className={selectedCategoryFilter === 'completed' ? 'text-purple-600' : 'text-slate-400'} />
                  <span>Completed</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[17px] text-center ${
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
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                    selectedCategoryFilter === 'ongoing'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  <Zap size={13} className={selectedCategoryFilter === 'ongoing' ? 'text-emerald-700' : 'text-emerald-500'} />
                  <span>Ongoing</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[17px] text-center ${
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
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                    selectedCategoryFilter === 'awaiting_release'
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  <Clock size={13} className={selectedCategoryFilter === 'awaiting_release' ? 'text-indigo-700' : 'text-indigo-500'} />
                  <span>Awaiting Release</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[17px] text-center ${
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
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                    selectedCategoryFilter === 'negotiating'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  <MessageSquare size={13} className={selectedCategoryFilter === 'negotiating' ? 'text-amber-700' : 'text-amber-500'} />
                  <span>Negotiating</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[17px] text-center ${
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
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                    selectedCategoryFilter === 'disputed'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  <Scale size={13} className={selectedCategoryFilter === 'disputed' ? 'text-rose-700' : 'text-rose-500'} />
                  <span>Disputed</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[17px] text-center ${
                    selectedCategoryFilter === 'disputed' ? 'bg-rose-600 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {categoryCounts.disputed}
                  </span>
                </button>
              )}
            </div>

            {/* Right: Interactive Sorting Dropdown (Floating Unclipped, z-50) */}
            <div className="relative shrink-0 z-30" ref={sortMenuRef}>
              <button
                type="button"
                onClick={() => setIsSortMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-200"
                title="Change sorting order"
              >
                <SlidersHorizontal size={13} className="text-purple-600" />
                <span className="font-mono text-[11px] font-bold text-slate-800">{SORT_LABELS[sortOption]}</span>
                <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isSortMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Sort Options Menu */}
              {isSortMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-50 animate-fadeIn">
                  <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                    Sort Contracts By
                  </div>
                  {(Object.keys(SORT_LABELS) as JobSortOption[]).map((key) => {
                    const isCurrent = sortOption === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSortOption(key);
                          setIsSortMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-left transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-purple-50 text-purple-700 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{SORT_LABELS[key]}</span>
                        {isCurrent && <Check size={13} className="text-purple-600 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section Header: Title, Count & Active Sort Label */}
          <div className="px-4 pt-3 pb-1.5 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <h3 className="font-headline font-bold text-slate-900 text-xs sm:text-sm tracking-tight">
                {isClientRole ? 'My Project Escrows' : 'My Working Contracts'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10.5px] font-mono font-bold">
                {filteredMyJobs.length}
              </span>
              {selectedCategoryFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('all')}
                  className="text-[11px] text-purple-600 font-semibold hover:underline cursor-pointer ml-1"
                >
                  Show all ({displayedBaseJobs.length})
                </button>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-mono font-medium flex items-center gap-1">
              <span>Sorted by:</span>
              <span className="font-bold text-slate-600">{SORT_LABELS[sortOption]}</span>
            </span>
          </div>

          {/* Scrollable job list with redesigned compact typography and full details */}
          <div className="overflow-y-auto max-h-[480px] sm:max-h-[540px] p-3 pt-1 space-y-2">
            {filteredMyJobs.length > 0 ? (
              filteredMyJobs.map((j) => {
                const isSelected = j.id === activeJob.id;
                const isClientJob = Boolean(j.client && j.client.toLowerCase() === userAddr);
                const isFreelancerJob = Boolean(j.freelancer && j.freelancer.toLowerCase() === userAddr);
                const isApplicantJob = Boolean(j.applications && j.applications.some((a) => a.applicant && a.applicant.toLowerCase() === userAddr));
                const counterpart = isClientJob ? (j.freelancer || j.applications?.[0]?.applicant || '') : j.client;
                const counterpartProfileKey = Object.keys(profiles || {}).find((k) => k.toLowerCase() === counterpart.toLowerCase());
                const counterpartProfile = counterpartProfileKey ? profiles[counterpartProfileKey] : null;
                const counterpartLabel = counterpartProfile?.displayName || (counterpart ? truncateAddress(counterpart) : (isClientJob ? 'Awaiting Applicants' : 'Unassigned'));

                const isNegotiating = isJobUnderNegotiation(j);
                let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
                let dotStyle = 'bg-emerald-500';
                let statusBadgeText = j.status.toUpperCase();

                if (isNegotiating) {
                  badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200/80';
                  dotStyle = 'bg-amber-500';
                  statusBadgeText = j.status === 'Selected' ? 'SELECTED • NEGOTIATING' : 'UNDER NEGOTIATION';
                } else if (j.status === 'Submitted') {
                  badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
                  dotStyle = 'bg-indigo-500';
                  statusBadgeText = 'AWAITING RELEASE';
                } else if (j.status === 'Disputed') {
                  badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200/80';
                  dotStyle = 'bg-rose-500';
                  statusBadgeText = 'DISPUTED';
                } else if (j.status === 'Completed') {
                  badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200/80';
                  dotStyle = 'bg-purple-500';
                  statusBadgeText = 'COMPLETED';
                } else if (j.status === 'Funded') {
                  badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
                  dotStyle = 'bg-emerald-500';
                  statusBadgeText = 'FUNDED';
                }

                const sym = (j.paymentTokenSymbol || 'USDC').toUpperCase();
                const isCrypto = sym === 'POL' || sym === 'MATIC' || sym === 'ETH' || sym === 'BTC';
                const amt = isCrypto ? (j.amountEth || j.amountUsdc) : j.amountUsdc;
                const amountDisplay = isCrypto ? `${amt} ${sym}` : `$${amt} USDC`;
                const dateDisplay = formatJobDate(j.createdAt);

                return (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => {
                      setSelectedJobId(j.id);
                      setSearchParams({ jobId: j.id });
                      closeDropdown();
                    }}
                    className={`relative w-full p-2.5 sm:p-3 rounded-xl text-left flex items-center justify-between gap-3 transition-all cursor-pointer overflow-hidden group shadow-2xs hover:shadow-xs ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-50/40 via-white to-blue-50/20 border-2 border-purple-300 ring-2 ring-purple-100/60'
                        : 'bg-white hover:bg-slate-50/80 border border-slate-200/70 hover:border-purple-200'
                    }`}
                  >
                    {/* Left Document Icon Badge */}
                    <div className="relative z-10 flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-xl bg-blue-50/90 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <FileText size={17} className="text-blue-600 stroke-[2.2]" />
                      </div>

                      {/* Center Information */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <h4 className="font-headline font-bold text-xs sm:text-[13.5px] text-slate-900 tracking-tight truncate group-hover:text-purple-700 transition-colors">
                            {j.title}
                          </h4>
                          {isClientJob && (
                            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold tracking-wider uppercase bg-purple-100 text-purple-700 border border-purple-200/60 shadow-2xs shrink-0">
                              MY POSTING
                            </span>
                          )}
                          {!isClientJob && isFreelancerJob && (
                            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold tracking-wider uppercase bg-blue-100 text-blue-700 border border-blue-200/60 shadow-2xs shrink-0">
                              FREELANCER
                            </span>
                          )}
                          {!isClientJob && !isFreelancerJob && isApplicantJob && (
                            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold tracking-wider uppercase bg-slate-100 text-slate-700 border border-slate-200/60 shadow-2xs shrink-0">
                              APPLICANT
                            </span>
                          )}
                        </div>

                        {/* Meta row with Amount, Counterpart, Contract, and Relative Date */}
                        <div className="flex items-center flex-wrap gap-2 text-[10.5px] font-mono mt-0.5 text-slate-500">
                          {/* Amount in Emerald */}
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8.5px] font-bold shadow-2xs">
                              {sym === 'POL' || sym === 'MATIC' ? '⬡' : '$'}
                            </span>
                            <span>{amountDisplay}</span>
                          </span>

                          {/* Divider */}
                          <span className="text-slate-200">|</span>

                          {/* Counterpart / Client with User icon */}
                          <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                            <User size={11} className="text-slate-400" />
                            <span className="truncate max-w-[130px] sm:max-w-[170px]">{counterpartLabel}</span>
                          </span>

                          {/* Divider */}
                          <span className="text-slate-200">|</span>

                          {/* Contract / Hash with Link icon */}
                          <span className="inline-flex items-center gap-1 text-slate-400 font-mono">
                            <Link2 size={11} className="text-slate-400" />
                            <span>#{truncateAddress(j.contractAddress || j.id)}</span>
                          </span>

                          {/* Creation Time (Prefer Latest) */}
                          {dateDisplay && (
                            <>
                              <span className="text-slate-200">|</span>
                              <span className="text-[10px] text-slate-400 font-sans">{dateDisplay}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Section: Status Pill & Action Chevron */}
                    <div className="relative z-10 flex items-center gap-2 shrink-0">
                      {/* Active status pill */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border font-mono font-bold text-[9.5px] sm:text-[10px] uppercase tracking-wider shadow-2xs ${badgeStyle}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotStyle} animate-pulse`}></span>
                        <span>{statusBadgeText}</span>
                      </span>

                      {/* Chevron action button in rounded circle */}
                      <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/60 group-hover:bg-purple-50 group-hover:border-purple-200 text-slate-400 group-hover:text-purple-600 flex items-center justify-center transition-all shadow-2xs">
                        <ChevronRight size={14} className="stroke-[2.2]" />
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

      {/* Client Modify Job Details Modal */}
      <ModifyJobModal
        isOpen={isModifyModalOpen}
        job={activeJob}
        onClose={() => setIsModifyModalOpen(false)}
      />

      {/* PolyLance Alert & Confirmation Modal */}
      <PolyLanceAlertModal
        isOpen={Boolean(alertModalOptions)}
        options={alertModalOptions}
        onClose={() => setAlertModalOptions(null)}
      />
    </div>
  );
};
