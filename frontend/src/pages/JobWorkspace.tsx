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
  Award,
} from 'lucide-react';
import { truncateAddress, getDeterministicSbtId } from '../utils/formatters';
import { getJobInactivityStatus } from '../utils/inactivity';
import { DeliverableWorkSubmissionPanel } from '../components/DeliverableWorkSubmissionPanel';
import { ModifyJobModal } from '../components/ModifyJobModal';
import { EmptyState } from '../components/UIStates';
import { PolyLanceAlertModal, AlertModalOptions } from '../components/PolyLanceAlertModal';
import { Job } from '../types';
import { TokenIcon } from '../components/TokenIcon';
import { PageContainer } from '../components/layout/PageContainer';
import { StatusBadge } from '../components/common/StatusBadge';
import { TokenAmount } from '../components/common/TokenAmount';
import { getJobAmounts, ViewerRole } from '../lib/amounts/getJobAmounts';
import { Stepper, StepItem } from '../components/common/Stepper';
import { areAddressesEqual } from '../utils/accountMode';
import { RequestExtensionModal } from '../components/RequestExtensionModal';
import { getEngagementDisplayState } from '../types/lifecycle';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { backdropVariants, popoverVariants, reducedMotionVariants } from '../styles/popupMotion';
import { usePlatformFeeDues } from '../hooks/usePlatformFeeDues';
import { WalletBalanceModal } from '../components/WalletBalanceModal';

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
  const prefersReducedMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { address, currentRole, isConnected, connectWallet, isArbitrator } = useWeb3();
  const { jobs, profiles, deleteJob, requestTimeExtension, sendChatMessage } = usePolyLanceData();
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);

  const userAddr = (address || '').toLowerCase();
  const isClientRole = currentRole === 'client';

  // Filter jobs strictly relevant to connected user:
  // - Client who posted the job: ALWAYS has full access to their posted job in workspace.
  // - Hired freelancer: has full access to their active/completed contracts.
  // - Applicants/negotiators: can access jobs where they have an active proposal/negotiation.
  // STRICT DATA PROTECTION: Contracts of other unrelated parties are NEVER shown.
  const myJobs = useMemo(() => {
    if (!userAddr) return [];

    return jobs.filter((job) => {
      if (isDemoOrMockJob(job)) return false;

      const isClientOfJob = Boolean(job.client && areAddressesEqual(job.client, userAddr));
      const isFreelancerOfJob = Boolean(job.freelancer && areAddressesEqual(job.freelancer, userAddr));

      // 1. If user posted this job as client OR is the assigned/selected freelancer, ALWAYS permit full access
      if (isClientOfJob || isFreelancerOfJob) {
        return true;
      }

      // 2. If user is explicitly in Client Role (and did not post this job), do not show other freelance applications
      if (isClientRole) {
        return false;
      }

      // 3. If the contract has already been awarded to another freelancer, unselected applicants must NEVER see it
      if (job.freelancer && !areAddressesEqual(job.freelancer, userAddr)) {
        return false;
      }

      // 5. For jobs that are still Open or in candidate review (no freelancer selected yet):
      // Show only if the user has an active application or negotiation
      const hasApplied = Boolean(
        job.applications &&
        job.applications.some((a) => areAddressesEqual(a.applicant, userAddr))
      );
      const hasNegotiated = Boolean(
        (job.negotiationProposals &&
          job.negotiationProposals.some(
            (p: any) =>
              areAddressesEqual(p.sender, userAddr) ||
              areAddressesEqual(p.applicantAddress, userAddr)
          )) ||
        (job.preAcceptMessages &&
          job.preAcceptMessages.some(
            (m: any) =>
              areAddressesEqual(m.sender, userAddr) ||
              areAddressesEqual(m.senderAddress, userAddr) ||
              areAddressesEqual(m.applicantAddress, userAddr)
          ))
      );

      return (job.status === 'Open' || job.status === 'Selected') && (hasApplied || hasNegotiated);
    });
  }, [jobs, userAddr, isClientRole]);

  const [alertModalOptions, setAlertModalOptions] = useState<AlertModalOptions | null>(null);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);

  const handleDeleteActiveJob = () => {
    if (!activeJob) return;
    setAlertModalOptions({
      title: 'Remove Job Posting (Free & Gasless)',
      message: `Are you sure you want to remove the job "${activeJob.title}"? Deleting an unescrowed job is 100% free with no fee charged to the client.`,
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
      if (selectedJobId !== queryJobId) {
        setSelectedJobId(queryJobId);
      }
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

  const isClientOfActive = Boolean(activeJob && userAddr && activeJob.client && areAddressesEqual(activeJob.client, userAddr));
  const isFreelancerOfActive = Boolean(activeJob && userAddr && activeJob.freelancer && areAddressesEqual(activeJob.freelancer, userAddr));
  const activeViewerRole: ViewerRole = isClientOfActive ? 'client' : (isFreelancerOfActive ? 'freelancer' : 'visitor');

  // Persist active job to localStorage so returning visitors resume this exact workspace
  useEffect(() => {
    if (activeJob?.id) {
      try {
        localStorage.setItem('polylance_last_opened_job', activeJob.id);
      } catch {}
    }
  }, [activeJob?.id]);

  // Fee dues state for contextual notice on active job card
  const { dues: feeDues, enabled: feeDuesEnabled } = usePlatformFeeDues();
  const [feeNoticeDismissed, setFeeNoticeDismissed] = useState(false);
  const [isFeeDuesBalanceModalOpen, setIsFeeDuesBalanceModalOpen] = useState(false);

  const activeJobFeeDue = useMemo(() => {
    if (!feeDuesEnabled || !activeJob || !userAddr) return null;
    return feeDues.find(
      (d) =>
        (d.jobId === activeJob.id || (activeJob.contractAddress && d.jobId?.toLowerCase() === activeJob.contractAddress.toLowerCase())) &&
        d.wallet.toLowerCase() === userAddr.toLowerCase() &&
        d.status === 'DUE'
    );
  }, [feeDues, feeDuesEnabled, activeJob, userAddr]);

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
      list = list.filter((j) => j.status === 'Funded' || (j.status === 'Selected' && Boolean(j.clientAgreedTerms && j.freelancerAgreedTerms)));
    } else if (selectedCategoryFilter === 'awaiting_release') {
      list = list.filter((j) => j.status === 'Submitted');
    } else if (selectedCategoryFilter === 'disputed') {
      list = list.filter((j) => j.status === 'Disputed');
    } else if (selectedCategoryFilter === 'negotiating') {
      list = list.filter((j) => isJobUnderNegotiation(j) || (j.status === 'Selected' && !j.freelancerAgreedTerms));
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
  const isUnauthorizedQueryJob = useMemo(() => {
    if (!queryJobId || !userAddr) return false;
    const targetJob = jobs.find(
      (j) =>
        (j.id === queryJobId ||
          j.contractAddress?.toLowerCase() === queryJobId.toLowerCase()) &&
        !isDemoOrMockJob(j)
    );
    if (!targetJob) return false;

    // Authorized parties: client who posted it, hired freelancer, applicant/negotiator, or arbitrator
    const isClient = Boolean(targetJob.client && areAddressesEqual(targetJob.client, userAddr));
    const isFreelancer = Boolean(targetJob.freelancer && areAddressesEqual(targetJob.freelancer, userAddr));
    const isApplicant = Boolean(
      targetJob.applications &&
      targetJob.applications.some((a) => areAddressesEqual(a.applicant, userAddr))
    );
    const isNegotiator = Boolean(
      (targetJob.negotiationProposals &&
        targetJob.negotiationProposals.some(
          (p: any) =>
            areAddressesEqual(p.sender, userAddr) ||
            areAddressesEqual(p.applicantAddress, userAddr)
        )) ||
      (targetJob.preAcceptMessages &&
        targetJob.preAcceptMessages.some(
          (m: any) =>
            areAddressesEqual(m.sender, userAddr) ||
            areAddressesEqual(m.senderAddress, userAddr) ||
            areAddressesEqual(m.applicantAddress, userAddr)
        ))
    );

    if (isClient || isFreelancer || isApplicant || isNegotiator || isArbitrator) {
      return false;
    }

    return !myJobs.some(
      (j) => j.id === queryJobId || j.contractAddress?.toLowerCase() === queryJobId.toLowerCase()
    );
  }, [queryJobId, userAddr, jobs, myJobs, isArbitrator]);

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white rounded-[10px] border border-[#E2E6EC] shadow-xs text-center space-y-5">
        <div className="w-14 h-14 rounded-[8px] bg-[#F4F6F9] text-[#0047AB] mx-auto flex items-center justify-center border border-[#E2E6EC]">
          <ShieldAlert size={28} className="text-[#0047AB]" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono font-medium px-3 py-1 rounded-[6px] bg-[#F6F7F9] text-[#0B0B0F] border border-[#E5E7EB]">
            Authentication required
          </span>
          <h2 className="font-sans text-2xl font-semibold text-[#0B0B0F]">
            Connect wallet to access workspace
          </h2>
          <p className="text-xs text-[#4B5563] font-sans leading-relaxed">
            Project escrows, private work deliverables, milestone dispute evidence, and encrypted communications are protected. Connect your Web3 wallet to authenticate as an authorized participant.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={connectWallet}
            className="w-full py-2.5 px-4 rounded-[8px] bg-[#0047AB] hover:bg-[#003882] text-white font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Connect wallet</span>
          </button>
        </div>
      </div>
    );
  }

  if (isUnauthorizedQueryJob) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white rounded-[12px] border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.06)] text-center space-y-5">
        <div className="w-14 h-14 rounded-[8px] bg-[#FFF9E6] text-[#8C6B00] mx-auto flex items-center justify-center border border-[#F0D58C]">
          <Lock size={24} className="text-[#8C6B00]" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono font-medium px-3 py-1 rounded-[6px] bg-[#FFF9E6] text-[#8C6B00] border border-[#F0D58C]">
            Access restricted
          </span>
          <h2 className="font-sans text-2xl font-semibold text-[#0B0B0F]">
            Unauthorized contract access
          </h2>
          <p className="text-xs text-[#4B5563] font-sans leading-relaxed">
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
            className="w-full py-3 px-4 rounded-[8px] bg-[#0047AB] hover:bg-[#003A8C] text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Return to My Escrows
          </button>
        </div>
      </div>
    );
  }

  if (!activeJob) {
    return (
      <div className="w-full my-12 p-6 space-y-6">
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
    <PageContainer className="py-6 space-y-6 text-[#0B0B0F]">

      {/* ── TOP HEADER & INTERACTIVE MULTI-JOB SWITCHER ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* Job Switcher Trigger Area */}
          <div className="flex-1 min-w-0">
            {/* Label row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-2">
              <span className="text-xs font-medium text-[#4B5563] flex items-center gap-1.5">
                <Layers size={13} className="text-[#0047AB] shrink-0" />
                <span>{isClient ? 'Client project workspace' : 'Freelancer deliverable workspace'}</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-[#F6F7F9] text-[#0B0B0F] text-xs font-medium px-2 py-0.5 rounded-[6px] border border-[#E5E7EB]">
                  {myJobs.length} {isClient ? 'Project' : 'Job'}{myJobs.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Contextual Fee Due Notice */}
            {activeJobFeeDue && !feeNoticeDismissed && (
              <div className="mb-3 p-3 rounded-[10px] bg-[#EAF1FB] border border-[#C9DAF2] text-xs text-[#0B0B0F] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-[#0047AB] text-white flex items-center justify-center shrink-0 text-[10px] font-bold">
                    !
                  </div>
                  <span className="truncate text-xs font-medium text-[#0B0B0F]">
                    A platform fee of {activeJobFeeDue.outstanding} {activeJobFeeDue.token} for &apos;{activeJob.title}&apos; is still open. Pay it in Payments.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsFeeDuesBalanceModalOpen(true)}
                    className="px-2.5 py-1 rounded-[6px] bg-[#0047AB] hover:bg-[#003A8C] text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Pay in Payments
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeeNoticeDismissed(true)}
                    className="text-[#6B7280] hover:text-[#0B0B0F] p-1 cursor-pointer"
                    title="Dismiss notice"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* Trigger button */}
            <button
              ref={triggerBtnRef}
              type="button"
              onClick={toggleDropdown}
              className={`relative overflow-hidden w-full flex items-center justify-between gap-3 p-3 sm:p-4 rounded-[10px] border text-left transition-all cursor-pointer group ${
                isJobDropdownOpen
                  ? 'bg-[#F6F7F9] border-[#0047AB]'
                  : 'bg-white hover:bg-[#F6F7F9] border-[#E5E7EB] hover:border-[#0047AB]'
              }`}
              title="Click to switch active project workspace"
            >
              <div className="relative z-10 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 flex-1 w-full">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] text-[#0B0B0F] flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-[#0B0B0F]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#0B0B0F] line-clamp-1 group-hover:text-[#0047AB] transition-colors">
                        {activeJob.title}
                      </span>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 text-xs font-mono mt-0.5 text-[#4B5563]">
                      <span className="font-semibold text-[#10B981]">
                        {(() => {
                          const ja = getJobAmounts(activeJob, undefined, undefined, activeViewerRole);
                          return `${ja.effectiveAmount} ${ja.token}`;
                        })()}
                      </span>
                      <span className="text-[#D1D5DB] hidden sm:inline">•</span>
                      <span className="inline-flex items-center gap-1 text-[#4B5563]">
                        <User size={11} className="text-[#9CA3AF]" />
                        <span className="truncate max-w-[140px] font-sans">{counterpartName}</span>
                      </span>
                      <span className="text-[#D1D5DB] hidden sm:inline">•</span>
                      <span className="text-[#9CA3AF]">
                        #{truncateAddress(activeJob.contractAddress || activeJob.id)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 self-stretch sm:self-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E5E7EB]">
                  {(() => {
                    const disp = getEngagementDisplayState(activeJob);
                    return <StatusBadge status={disp.isCompleted ? 'Completed' : disp.displayLabel || activeJob.status} />;
                  })()}
                  <div className="w-7 h-7 rounded-[6px] bg-[#F6F7F9] text-[#0B0B0F] flex items-center justify-center shrink-0">
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isJobDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
            {(() => {
              const isJobFunded = (activeJob.status as string) === 'Funded' || (activeJob.status as string) === 'Submitted' || (activeJob.status as string) === 'Completed' || (activeJob as any).escrowStatus === 'RELEASED' || Boolean(activeJob.events?.some((e: any) => (e.step === 'Funded' || e.step === 'Completed' || e.step === 'Paid' || e.step === 'PaymentReleased') && e.status === 'completed'));
              const isJobCompleted = (activeJob.status as string) === 'Completed' || (activeJob as any).escrowStatus === 'RELEASED' || Boolean(activeJob.events?.some((e: any) => (e.step === 'Completed' || e.step === 'Paid' || e.step === 'PaymentReleased') && e.status === 'completed'));
              const canModifyOrDelete = isClient && !isJobFunded && !isJobCompleted;

              if (!canModifyOrDelete) return null;

              return (
                <>
                  <button
                    type="button"
                    onClick={() => setIsModifyModalOpen(true)}
                    className="px-3 py-2 rounded-[8px] bg-white hover:bg-[#F6F7F9] text-[#0B0B0F] border border-[#E5E7EB] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Modify job title, description, budget"
                  >
                    <Edit3 size={13} className="shrink-0 text-[#0047AB]" />
                    <span>Modify job</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteActiveJob}
                    className="px-3 py-2 rounded-[8px] bg-white hover:bg-rose-50 text-[#DC2626] border border-[#FECACA] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Delete this job posting"
                  >
                    <Trash2 size={13} className="shrink-0 text-[#DC2626]" />
                    <span>Delete</span>
                  </button>
                </>
              );
            })()}

            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams({ jobId: activeJob.id });
                if (counterpartAddress) params.set('applicant', counterpartAddress);
                navigate(`/chat?${params.toString()}`);
              }}
              className="px-3 py-2 rounded-[8px] bg-white hover:bg-[#F6F7F9] text-[#0B0B0F] border border-[#E5E7EB] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Open dedicated chat for this job"
            >
              <MessageSquare size={13} className="shrink-0 text-[#0047AB]" />
              <span>Messages</span>
              <ArrowUpRight size={12} className="shrink-0" />
            </button>

            {(() => {
              const display = getEngagementDisplayState(activeJob);
              if (!display.isCompleted) return null;
              return (
                <Link
                  to={`/attestation/${activeJob.id}`}
                  className="px-3 py-2 rounded-[8px] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] text-[#0047AB] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  title="View soulbound work certificate"
                >
                  <Award size={13} className="shrink-0 text-[#0047AB]" />
                  <span>Certificate</span>
                </Link>
              );
            })()}

            <Link
              to={`/jobs/${activeJob.id}`}
              className="px-3 py-2 rounded-[8px] bg-white hover:bg-[#F6F7F9] border border-[#E5E7EB] text-[#0B0B0F] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>{getEngagementDisplayState(activeJob).isCompleted ? 'View job' : 'Listing'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 5-STEP MILESTONE TIMELINE (Funded -> In progress -> Submitted -> Approved -> Paid) ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] text-left space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#0B0B0F]">Milestone timeline</span>
            {(() => {
              const disp = getEngagementDisplayState(activeJob);
              return <StatusBadge status={disp.isCompleted ? 'Completed' : disp.displayLabel || activeJob.status} size="sm" />;
            })()}
          </div>
          <Link
            to={`/chat?jobId=${activeJob.id}${counterpartAddress ? `&applicant=${counterpartAddress}` : ''}`}
            className="text-xs text-[#0047AB] font-medium hover:underline inline-flex items-center gap-1"
          >
            <MessageSquare size={13} />
            <span>Open message thread</span>
          </Link>
        </div>

        {(() => {
          const display = getEngagementDisplayState(activeJob);
          const isJobFunded = (activeJob.status as string) === 'Funded' || (activeJob.status as string) === 'Submitted' || (activeJob.status as string) === 'Completed' || (activeJob as any).escrowStatus === 'RELEASED' || Boolean(activeJob.events?.some((e: any) => (e.step === 'Funded' || e.step === 'Completed' || e.step === 'Paid' || e.step === 'PaymentReleased') && e.status === 'completed'));
          const isJobCompleted = display.isCompleted || display.isPaid || (activeJob.status as string) === 'Completed' || (activeJob as any).escrowStatus === 'RELEASED' || Boolean(activeJob.events?.some((e: any) => (e.step === 'Completed' || e.step === 'Paid' || e.step === 'PaymentReleased') && e.status === 'completed'));
          const isFunded = isJobFunded || isJobCompleted || activeJob.status === 'Funded' || (activeJob.status as string) === 'Submitted';

          const getStepStatus = (idx: number): 'complete' | 'current' | 'upcoming' => {
            if (isJobCompleted) return 'complete';
            if (display.isApproved) {
              if (idx < 4) return 'complete';
              if (idx === 4) return 'current';
              return 'upcoming';
            }
            if (display.state === 'UNDER_REVIEW' || display.state === 'SUBMITTED_LATE' || display.state === 'REVIEW_WINDOW_ENDED' || (activeJob.status as string) === 'Submitted') {
              if (idx < 3) return 'complete';
              if (idx === 3) return 'current';
              return 'upcoming';
            }
            if (isFunded || activeJob.status === 'Funded') {
              if (idx < 2) return 'complete';
              if (idx === 2) return 'current';
              return 'upcoming';
            }
            if (activeJob.status === 'Selected') {
              if (!activeJob.freelancerAgreedTerms) {
                if (idx === 0) return 'current';
                return 'upcoming';
              } else {
                if (idx === 0) return 'complete';
                if (idx === 1) return 'current';
                return 'upcoming';
              }
            }
            if (idx === 0) return 'current';
            return 'upcoming';
          };

          const steps: StepItem[] = [
            { 
              id: 1, 
              label: 'Terms & Offer', 
              caption: activeJob.status === 'Selected' 
                ? (activeJob.freelancerAgreedTerms ? 'Offer accepted' : 'Awaiting acceptance') 
                : (isFunded ? 'Terms agreed' : 'Negotiating'), 
              status: getStepStatus(0) 
            },
            { 
              id: 2, 
              label: 'Escrow Deposit', 
              caption: isFunded 
                ? 'Escrow funded' 
                : (activeJob.freelancerAgreedTerms ? 'Ready to fund' : 'Pending agreement'), 
              status: getStepStatus(1) 
            },
            { 
              id: 3, 
              label: 'In progress', 
              caption: display.isOverdue ? 'Overdue' : (display.state === 'DUE_SOON' ? 'Due soon' : 'Work underway'), 
              status: getStepStatus(2) 
            },
            { 
              id: 4, 
              label: display.isLate ? 'Submitted (Late)' : 'Submitted', 
              caption: isJobCompleted ? 'Approved' : (display.isApproved ? 'Approved' : 'In review'), 
              status: getStepStatus(3) 
            },
            { 
              id: 5, 
              label: 'Completed', 
              caption: isJobCompleted ? 'Funds released' : (display.isApproved ? 'Release pending' : 'Pending release'), 
              status: getStepStatus(4) 
            },
          ];

          return <Stepper steps={steps} className="pt-1" />;
        })()}
      </div>

      {/* ── CONTEXTUAL DEADLINE, OVERDUE & LATE SUBMISSION BANNER ── */}
      {(() => {
        const display = getEngagementDisplayState(activeJob);
        const isJobCompleted = display.isCompleted || display.isPaid || (activeJob.status as string) === 'Completed' || (activeJob as any).escrowStatus === 'RELEASED' || Boolean(activeJob.events?.some((e: any) => (e.step === 'Completed' || e.step === 'Paid' || e.step === 'PaymentReleased') && e.status === 'completed'));
        if (
          isJobCompleted ||
          display.state === 'COMPLETED' ||
          display.state === 'CANCELLED' ||
          display.state === 'OFFER_SENT' ||
          display.state === 'TERMS_AGREED'
        ) {
          return null;
        }

        const isClient = areAddressesEqual(activeJob.client, address);
        const isFreelancer = areAddressesEqual(activeJob.freelancer, address);
        const roleNotice = isClient ? display.whatHappensNext.client : display.whatHappensNext.freelancer;

        let bannerStyle = "bg-blue-50/80 border-blue-200 text-blue-950";
        if (display.badgeVariant === "destructive") {
          bannerStyle = "bg-rose-50 border-rose-200 text-rose-950";
        } else if (display.badgeVariant === "warning") {
          bannerStyle = "bg-amber-50 border-amber-200 text-amber-950";
        } else if (display.badgeVariant === "purple") {
          bannerStyle = "bg-purple-50 border-purple-200 text-purple-950";
        }

        return (
          <div className={`rounded-[12px] border p-4 text-xs space-y-2.5 transition-all text-left shadow-xs ${bannerStyle}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{display.displayLabel}</span>
                {display.isLate && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                    Late by {Math.round(display.lateByMs / 3600000)}h
                  </span>
                )}
                {display.isOverdue && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 border border-rose-300">
                    Overdue
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isFreelancer && display.allowedActions.canRequestExtension && (
                  <button
                    onClick={() => setIsExtensionModalOpen(true)}
                    className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-slate-50 font-medium text-xs text-[#0B0B0F] transition-colors cursor-pointer"
                  >
                    Request Extension
                  </button>
                )}
                {isClient && display.state === 'EXPIRED_NO_SUBMISSION' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setAlertModalOptions({
                          title: "Keep Waiting for Deliverables",
                          message: "The delivery deadline has expired, but the freelancer is still permitted to submit work while escrow remains locked. You can cancel or request review at any time.",
                          type: "info",
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-slate-50 font-medium text-xs text-[#0B0B0F] transition-colors cursor-pointer"
                    >
                      Keep Waiting
                    </button>
                    <button
                      onClick={() => {
                        setAlertModalOptions({
                          title: "Request Escrow Refund Review",
                          message: "Because the job delivery deadline and grace period expired without deliverables, your refund request requires JudgeDAO arbitrator review or mutual agreement. Funds will remain safely locked in escrow until confirmed.",
                          type: "confirm",
                          showCancel: true,
                          confirmText: "Open Dispute / Review",
                          onConfirm: () => {
                            navigate(`/workspace?jobId=${activeJob.id}&action=dispute`);
                          },
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-[8px] bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors cursor-pointer"
                    >
                      Cancel & Refund Review
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs leading-relaxed opacity-90">{roleNotice}</p>
          </div>
        );
      })()}

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <div id="deliverable-workspace" className="space-y-6">
        {activeJob.status === 'Funded' || (activeJob.status as string) === 'Submitted' || activeJob.status === 'Disputed' || (activeJob.status as string) === 'Completed' || activeJob.status === 'Selected' || Boolean(activeJob.freelancer) || (activeJob.clientAgreedTerms && activeJob.freelancerAgreedTerms) ? (
          <DeliverableWorkSubmissionPanel job={activeJob} />
        ) : (
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 sm:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-6 text-left">
            {/* Header & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] text-[#0B0B0F] flex items-center justify-center shrink-0">
                  <Scale size={24} className="text-[#0047AB]" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={activeJob.status} />
                    <span className="text-xs text-[#4B5563]">
                      Candidate review & terms discussion
                    </span>
                  </div>
                  <h3 className="font-sans font-semibold text-lg text-[#0B0B0F]">
                    Terms negotiation in progress
                  </h3>
                  <p className="text-xs text-[#4B5563] max-w-2xl leading-relaxed">
                    {isClient
                      ? 'This project escrow is currently in the negotiation stage. Deliverable uploads and milestone verification will become available once you finalize agreed terms and fund escrow.'
                      : 'You have not yet been confirmed on-chain for this project. The client and applicants are discussing scope and timeline. Use messages to coordinate.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <StatusBadge status={activeJob.status} />
              </div>
            </div>

            {/* Negotiation Overview Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 sm:p-4 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] space-y-1">
                <span className="text-xs font-medium text-[#6B7280]">
                  Current listed budget
                </span>
                <div className="text-xl font-semibold text-[#0B0B0F] tabular-nums">
                  {(() => {
                    const ja = getJobAmounts(activeJob, undefined, undefined, activeViewerRole);
                    return (
                      <TokenAmount amount={ja.effectiveAmount} token={ja.token} />
                    );
                  })()}
                </div>
                <span className="text-xs text-[#0047AB] block">
                  {(() => {
                    const ja = getJobAmounts(activeJob, undefined, undefined, activeViewerRole);
                    return ja.agreed ? `Agreed: ${ja.agreed} ${ja.token}` : (ja.proposed ? `Proposed: ${ja.proposed} ${ja.token}` : 'Standard listing price');
                  })()}
                </span>
              </div>

              <div className="p-3 sm:p-4 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] space-y-1">
                <span className="text-xs font-medium text-[#6B7280]">
                  Target review period
                </span>
                <p className="text-xl font-semibold text-[#0B0B0F] tabular-nums">
                  {activeJob.reviewPeriodDays || 7} <span className="text-xs font-semibold text-[#4B5563]">days</span>
                </p>
                <span className="text-xs text-[#6B7280] block">
                  Client review SLA window
                </span>
              </div>

              <div className="p-3 sm:p-4 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] space-y-1">
                <span className="text-xs font-medium text-[#6B7280]">
                  Candidates & proposals
                </span>
                <p className="text-xl font-semibold text-[#0B0B0F] tabular-nums">
                  {activeJob.applications?.length || 0} <span className="text-xs font-semibold text-[#4B5563]">applicants</span>
                </p>
                <span className="text-xs text-[#0047AB] block">
                  {activeJob.negotiationProposals?.length || 0} proposal term sheet{activeJob.negotiationProposals?.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <Sparkles size={14} className="text-[#0047AB] shrink-0" />
                <span>Submit price & deadline counter-offers directly in encrypted chat.</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {(() => {
                  const isJobFunded = (activeJob.status as string) === 'Funded' || (activeJob.status as string) === 'Submitted' || (activeJob.status as string) === 'Completed' || (activeJob as any).escrowStatus === 'RELEASED' || Boolean(activeJob.events?.some((e: any) => (e.step === 'Funded' || e.step === 'Completed' || e.step === 'Paid' || e.step === 'PaymentReleased') && e.status === 'completed'));
                  const isJobCompleted = (activeJob.status as string) === 'Completed' || (activeJob as any).escrowStatus === 'RELEASED' || Boolean(activeJob.events?.some((e: any) => (e.step === 'Completed' || e.step === 'Paid' || e.step === 'PaymentReleased') && e.status === 'completed'));
                  const canModifyOrDelete = isClient && !isJobFunded && !isJobCompleted;

                  if (!canModifyOrDelete) return null;

                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsModifyModalOpen(true)}
                        className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-[#0B0B0C] border border-[#E2E6EC] font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <Edit3 size={14} className="text-[#0047AB]" />
                        <span>Modify Job Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDeleteActiveJob}
                        className="px-4 py-2.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <Trash2 size={14} className="text-rose-600" />
                        <span>Delete Posting</span>
                      </button>
                    </>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams({ jobId: activeJob.id });
                    if (counterpartAddress) params.set('applicant', counterpartAddress);
                    navigate(`/chat?${params.toString()}`);
                  }}
                  className="px-5 py-2.5 rounded-lg bg-[#0047AB] hover:bg-[#003A8C] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>Open Messages & Negotiations</span>
                  <ArrowUpRight size={13} />
                </button>

                <Link
                  to={`/jobs/${activeJob.id}`}
                  className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-[#0B0B0C] border border-[#E2E6EC] font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
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
      <AnimatePresence>
        {isJobDropdownOpen && dropdownPos && (
          <>
            <motion.div
              variants={prefersReducedMotion ? reducedMotionVariants : backdropVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed inset-0 bg-black/20 z-[9998]"
              onClick={closeDropdown}
            />
            <motion.div
              ref={dropdownRef}
              variants={prefersReducedMotion ? reducedMotionVariants : popoverVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                position: 'fixed',
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
                zIndex: 9999,
                transformOrigin: 'top center',
              }}
              className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xl overflow-hidden"
            >
          {/* Top Search Bar with ⌘ K */}
          <div className="p-4 pb-3 border-b border-[#E2E6EC] bg-white">
            <label className="relative flex items-center gap-3 bg-white border border-[#E2E6EC] rounded-xl px-4 py-3 focus-within:border-[#0047AB] focus-within:ring-1 focus-within:ring-[#0047AB] transition-all shadow-2xs cursor-text">
              <Search size={18} className="shrink-0 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by title, ID, amount, counterpart, status..."
                value={jobSearchQuery}
                onChange={(e) => setJobSearchQuery(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm font-sans text-[#0B0B0C] placeholder:text-slate-400 outline-none pr-10"
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
                  <kbd className="text-[11px] font-mono text-slate-400 bg-slate-100 border border-[#E2E6EC] px-2 py-0.5 rounded-md shadow-2xs font-semibold">
                    ⌘ K
                  </kbd>
                </div>
              )}
            </label>
          </div>

          {/* Filter Pills and Sort Dropdown Row */}
          <div className="px-4 py-2.5 border-b border-[#E2E6EC] bg-slate-50 flex items-center justify-between gap-3">
            {/* Category filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 flex-1 py-0.5">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-[#0B0B0C] text-white border border-[#0B0B0C]'
                    : 'bg-white hover:bg-slate-50 text-[#0B0B0C] border border-[#E2E6EC]'
                }`}
              >
                <span>All</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[17px] text-center ${
                  selectedCategoryFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
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
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E6EC]'
                  }`}
                >
                  <CheckCircle2 size={13} className={selectedCategoryFilter === 'completed' ? 'text-emerald-700' : 'text-slate-400'} />
                  <span>Completed</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[17px] text-center ${
                    selectedCategoryFilter === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
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
                      ? 'bg-blue-100 text-[#0047AB] border border-blue-300'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E6EC]'
                  }`}
                >
                  <Zap size={13} className={selectedCategoryFilter === 'ongoing' ? 'text-[#0047AB]' : 'text-slate-400'} />
                  <span>Ongoing</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[17px] text-center ${
                    selectedCategoryFilter === 'ongoing' ? 'bg-[#0047AB] text-white' : 'bg-slate-100 text-slate-700'
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
                      ? 'bg-slate-200 text-[#0B0B0C] border border-slate-300'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E6EC]'
                  }`}
                >
                  <Clock size={13} className={selectedCategoryFilter === 'awaiting_release' ? 'text-[#0047AB]' : 'text-slate-400'} />
                  <span>Awaiting Release</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[17px] text-center ${
                    selectedCategoryFilter === 'awaiting_release' ? 'bg-[#0B0B0C] text-white' : 'bg-slate-100 text-slate-700'
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
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E6EC]'
                  }`}
                >
                  <MessageSquare size={13} className={selectedCategoryFilter === 'negotiating' ? 'text-amber-700' : 'text-slate-400'} />
                  <span>Negotiating</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[17px] text-center ${
                    selectedCategoryFilter === 'negotiating' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
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
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E6EC]'
                  }`}
                >
                  <Scale size={13} className={selectedCategoryFilter === 'disputed' ? 'text-rose-700' : 'text-slate-400'} />
                  <span>Disputed</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold min-w-[17px] text-center ${
                    selectedCategoryFilter === 'disputed' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {categoryCounts.disputed}
                  </span>
                </button>
              )}
            </div>

            {/* Right: Interactive Sorting Dropdown */}
            <div className="relative shrink-0 z-30" ref={sortMenuRef}>
              <button
                type="button"
                onClick={() => setIsSortMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#E2E6EC] bg-white hover:bg-slate-50 text-[#0B0B0C] text-xs font-semibold shadow-2xs transition-all select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0047AB]"
                title="Change sorting order"
              >
                <SlidersHorizontal size={13} className="text-[#0047AB]" />
                <span className="font-mono text-[11px] font-bold text-[#0B0B0C]">{SORT_LABELS[sortOption]}</span>
                <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isSortMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Sort Options Menu */}
              {isSortMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl border border-[#E2E6EC] shadow-xl p-1.5 z-50 animate-fadeIn">
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
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-100 text-[#0047AB] font-bold'
                            : 'text-[#0B0B0C] hover:bg-slate-50'
                        }`}
                      >
                        <span>{SORT_LABELS[key]}</span>
                        {isCurrent && <Check size={13} className="text-[#0047AB] stroke-[2.5]" />}
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
              <h3 className="font-serif font-bold text-[#0B0B0C] text-xs sm:text-sm tracking-tight">
                {isClientRole ? 'My Project Escrows' : 'My Working Contracts'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#0B0B0C] border border-[#E2E6EC] text-[10.5px] font-mono font-bold">
                {filteredMyJobs.length}
              </span>
              {selectedCategoryFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('all')}
                  className="text-[11px] text-[#0047AB] font-semibold hover:underline cursor-pointer ml-1"
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

          {/* Scrollable job list */}
          <div
            data-lenis-prevent="true"
            className="overflow-y-auto overscroll-contain max-h-[480px] sm:max-h-[540px] min-h-0 p-3 pt-1 space-y-2 custom-scrollbar"
          >
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
                  badgeStyle = 'bg-slate-100 text-[#0B0B0C] border-[#E2E6EC]';
                  dotStyle = 'bg-[#0047AB]';
                  statusBadgeText = 'AWAITING RELEASE';
                } else if (j.status === 'Disputed') {
                  badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200/80';
                  dotStyle = 'bg-rose-500';
                  statusBadgeText = 'DISPUTED';
                } else if (j.status === 'Completed') {
                  badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
                  dotStyle = 'bg-emerald-500';
                  statusBadgeText = 'COMPLETED';
                } else if (j.status === 'Funded') {
                  badgeStyle = 'bg-blue-50 text-[#0047AB] border-blue-200';
                  dotStyle = 'bg-[#0047AB]';
                  statusBadgeText = 'FUNDED';
                }

                const ja = getJobAmounts(j, undefined, undefined, isClientJob ? 'client' : (isFreelancerJob ? 'freelancer' : 'visitor'));
                const sym = ja.token;
                const amountDisplay = `${ja.effectiveAmount} ${ja.token}`;
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
                        ? 'bg-slate-50 border-2 border-[#0047AB]'
                        : 'bg-white hover:bg-slate-50 border border-[#E2E6EC] hover:border-slate-300'
                    }`}
                  >
                    {/* Left Document Icon Badge */}
                    <div className="relative z-10 flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-lg bg-slate-100 border border-[#E2E6EC] text-[#0B0B0C] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileText size={17} className="text-[#0B0B0C] stroke-[2.2]" />
                      </div>

                      {/* Center Information */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <h4 className="font-bold text-xs sm:text-[13.5px] text-[#0B0B0C] tracking-tight truncate group-hover:text-[#0047AB] transition-colors">
                            {j.title}
                          </h4>
                          {isClientJob && (
                            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold tracking-wider uppercase bg-slate-100 text-[#0B0B0C] border border-[#E2E6EC] shadow-2xs shrink-0">
                              MY POSTING
                            </span>
                          )}
                          {!isClientJob && isFreelancerJob && (
                            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold tracking-wider uppercase bg-blue-50 text-[#0047AB] border border-blue-200 shadow-2xs shrink-0">
                              FREELANCER
                            </span>
                          )}
                          {!isClientJob && !isFreelancerJob && isApplicantJob && (
                            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold tracking-wider uppercase bg-slate-100 text-slate-700 border border-[#E2E6EC] shadow-2xs shrink-0">
                              APPLICANT
                            </span>
                          )}
                        </div>

                        {/* Meta row with Amount, Counterpart, Contract, and Relative Date */}
                        <div className="flex items-center flex-wrap gap-2 text-[10.5px] font-mono mt-0.5 text-slate-500">
                          {/* Amount in Emerald */}
                          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                            <TokenIcon token={sym} size={13} />
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
                      <StatusBadge status={j.status} size="sm" />

                      {/* Chevron action button */}
                      <div className="w-7 h-7 rounded-[6px] bg-[#F6F7F9] border border-[#E5E7EB] text-[#4B5563] flex items-center justify-center">
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-[#4B5563] font-mono space-y-1">
                <p>No project escrows match the selected filter.</p>
                {selectedCategoryFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter('all')}
                    className="text-[#0047AB] font-semibold hover:underline cursor-pointer text-xs block mx-auto mt-1"
                  >
                    View All Projects ({categoryCounts.all})
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
        </>
      )}
      </AnimatePresence>

      {/* Client Modify Job Details Modal */}
      <ModifyJobModal
        isOpen={isModifyModalOpen}
        job={activeJob}
        onClose={() => setIsModifyModalOpen(false)}
      />

      {/* Request Extension Modal */}
      {activeJob && (
        <RequestExtensionModal
          isOpen={isExtensionModalOpen}
          onClose={() => setIsExtensionModalOpen(false)}
          jobTitle={activeJob.title}
          onRequestExtension={(days, reason) => {
            requestTimeExtension(activeJob.id, days, reason);
            sendChatMessage(activeJob.id, `⏳ Extension Request: +${days} Days\n\nReason: ${reason}`, 'Freelancer');
          }}
        />
      )}

      {/* PolyLance Alert & Confirmation Modal */}
      <PolyLanceAlertModal
        isOpen={Boolean(alertModalOptions)}
        options={alertModalOptions}
        onClose={() => setAlertModalOptions(null)}
      />

      {/* Platform Fees / Balance Modal */}
      <WalletBalanceModal
        isOpen={isFeeDuesBalanceModalOpen}
        onClose={() => setIsFeeDuesBalanceModalOpen(false)}
      />
    </PageContainer>
  );
};
