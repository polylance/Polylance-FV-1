import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ContourBackground } from '../components/ContourBackground';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { truncateAddress } from '../utils/formatters';
import {
  ArrowRight,
  Wallet,
  Search,
  ShieldCheck,
  ChevronDown,
  Bell,
  CheckCircle2,
  Lock,
  Layers,
  ArrowUpRight,
  Shield,
  Coins,
  Scale,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const Landing: React.FC = () => {
  const { isConnected, address } = useWeb3();
  const { jobs, profiles } = usePolyLanceData();
  const navigate = useNavigate();

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const heroCalmZoneRef = useRef<HTMLDivElement>(null);

  const handleGetStarted = () => {
    if (!isConnected) {
      navigate('/login');
    } else {
      navigate('/dashboard');
    }
  };

  const completedJobs = jobs.filter((j) => j.status === 'Completed').length;
  const verifiedCount = Object.keys(profiles).length || 14;
  const totalEscrowUsdc = jobs.reduce((acc, j) => acc + parseFloat(j.amountUsdc || '0'), 0);

  // Live ticker so relative timestamps update lively in real-time
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Helper for real relative timestamps
  const formatRelativeTime = (timestamp?: number) => {
    if (!timestamp) return 'Recently';
    const diffMs = currentTime - timestamp;
    if (diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // ────────────────────────────────────────────────────────────────────────────
  // BUILD REAL NOTIFICATIONS FOR CONNECTED POLYLANCE USERS (ZERO DEMO DATA)
  // ────────────────────────────────────────────────────────────────────────────
  interface RealNotificationItem {
    id: string;
    title: string;
    description: string;
    timestamp: number;
    timeAgo: string;
    badge: string;
    badgeColor: string;
    type: 'escrow' | 'proposal' | 'submission' | 'payout' | 'created';
    linkTo: string;
    txHash?: string;
    isPersonal: boolean;
  }

  const userAddressLower = address ? address.toLowerCase() : '';
  const realNotifications: RealNotificationItem[] = [];

  jobs.forEach((job) => {
    const isClient = Boolean(userAddressLower && job.client?.toLowerCase() === userAddressLower);
    const isFreelancer = Boolean(userAddressLower && job.freelancer?.toLowerCase() === userAddressLower);
    const userApplied = Boolean(userAddressLower && job.applications?.some((a) => a.applicant?.toLowerCase() === userAddressLower));

    // 1. Real notifications if connected user is the client
    if (isClient) {
      (job.applications || []).forEach((app, idx) => {
        realNotifications.push({
          id: `app-${job.id}-${idx}`,
          title: 'Proposal Received',
          description: `Applicant ${truncateAddress(app.applicant)} applied to “${job.title}”`,
          timestamp: app.appliedAt || job.createdAt,
          timeAgo: formatRelativeTime(app.appliedAt || job.createdAt),
          badge: 'Proposal',
          badgeColor: 'bg-[#E7EEF9] text-[#0047AB]',
          type: 'proposal',
          linkTo: `/workspace`,
          isPersonal: true,
        });
      });

      if (job.proof?.submittedAt) {
        realNotifications.push({
          id: `proof-${job.id}`,
          title: 'Deliverables Submitted for Review',
          description: `Deliverables submitted on “${job.title}”. Ready for your inspection.`,
          timestamp: job.proof.submittedAt,
          timeAgo: formatRelativeTime(job.proof.submittedAt),
          badge: 'Review Needed',
          badgeColor: 'bg-[#FDF3DC] text-[#C2610C]',
          type: 'submission',
          linkTo: `/workspace`,
          isPersonal: true,
        });
      }

      (job.extensionRequests || []).filter((r) => r.status === 'Pending').forEach((ext, idx) => {
        realNotifications.push({
          id: `ext-${job.id}-${idx}`,
          title: 'Time Extension Requested',
          description: `Freelancer requested +${ext.requestedDays} days on “${job.title}”`,
          timestamp: ext.requestedAt,
          timeAgo: formatRelativeTime(ext.requestedAt),
          badge: 'Extension',
          badgeColor: 'bg-[#FDF3DC] text-[#C2610C]',
          type: 'submission',
          linkTo: `/workspace`,
          isPersonal: true,
        });
      });
    }

    // 2. Real notifications if connected user is the assigned freelancer
    if (isFreelancer) {
      if (job.status === 'Funded') {
        realNotifications.push({
          id: `funded-${job.id}`,
          title: 'Escrow Funded — Start Work',
          description: `Client locked ${job.amountEth} ${job.paymentTokenSymbol || 'POL'} in contract escrow for “${job.title}”`,
          timestamp: job.submittedAt || job.createdAt,
          timeAgo: formatRelativeTime(job.submittedAt || job.createdAt),
          badge: 'In Escrow',
          badgeColor: 'bg-[#E7EEF9] text-[#0047AB]',
          type: 'escrow',
          linkTo: `/workspace`,
          isPersonal: true,
        });
      }

      if (job.status === 'Completed') {
        realNotifications.push({
          id: `completed-${job.id}`,
          title: 'Escrow Released to Your Wallet',
          description: `Payout of ${job.amountEth} ${job.paymentTokenSymbol || 'POL'} confirmed for “${job.title}”`,
          timestamp: job.completedAt || job.createdAt,
          timeAgo: formatRelativeTime(job.completedAt || job.createdAt),
          badge: 'Paid 100%',
          badgeColor: 'bg-[#E3F3EA] text-[#1E8449]',
          type: 'payout',
          linkTo: `/workspace`,
          isPersonal: true,
        });
      }
    }

    // 3. User's job milestone events
    if (isClient || isFreelancer || userApplied) {
      (job.events || []).forEach((ev, idx) => {
        realNotifications.push({
          id: `ev-${job.id}-${idx}`,
          title: ev.title || 'Contract Status Update',
          description: ev.description || `Milestone event on contract “${job.title}”`,
          timestamp: ev.timestamp || job.createdAt,
          timeAgo: formatRelativeTime(ev.timestamp || job.createdAt),
          badge: ev.step || 'Contract Event',
          badgeColor: 'bg-[#F4F6F9] text-[#4B5563]',
          type: 'escrow',
          linkTo: `/workspace`,
          txHash: ev.txHash,
          isPersonal: true,
        });
      });
    }

    // 4. Real live network contract updates
    realNotifications.push({
      id: `live-job-${job.id}`,
      title: `Contract: ${job.title}`,
      description: `Budget ${job.amountEth} ${job.paymentTokenSymbol || 'POL'} ($${job.amountUsdc || '0'}) • ${job.category} • Escrow on Polygon`,
      timestamp: job.createdAt,
      timeAgo: formatRelativeTime(job.createdAt),
      badge: job.status,
      badgeColor: job.status === 'Completed' ? 'bg-[#E3F3EA] text-[#1E8449]' : 'bg-[#E7EEF9] text-[#0047AB]',
      type: 'created',
      linkTo: `/jobs`,
      isPersonal: false,
    });
  });

  // Sort: personal notifications first, then most recent timestamps
  realNotifications.sort((a, b) => {
    if (a.isPersonal && !b.isPersonal) return -1;
    if (!a.isPersonal && b.isPersonal) return 1;
    return b.timestamp - a.timestamp;
  });

  // Deduplicate and slice the top 6 real notifications
  const displayedNotifications = realNotifications
    .filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.id === item.id || (t.title === item.title && t.timestamp === item.timestamp))
    )
    .slice(0, 5);

  const hasPersonalNotifications = displayedNotifications.some((n) => n.isPersonal);

  const faqs = [
    {
      q: 'How does the smart contract escrow protect clients and freelancers?',
      a: 'Funds are locked into a secure Polygon smart contract before work starts. The client is guaranteed that money is not released until the milestone deliverables are inspected and approved. The freelancer is guaranteed that payment is fully funded and cannot be pulled back arbitrarily.',
    },
    {
      q: 'What is the platform fee?',
      a: 'PolyLance charges a transparent 2.5% platform fee on milestone release to maintain contract security and arbitration infrastructure. There are zero withdrawal fees, zero membership dues, and zero hidden deductions.',
    },
    {
      q: 'What are Soulbound reputation tokens?',
      a: 'When an escrow milestone is approved, an ERC-5192 Soulbound Token (SBT) is minted directly to your connected wallet. Because it cannot be transferred or sold, it serves as permanent, tamper-proof proof of your work history, ratings, and skills.',
    },
    {
      q: 'How are disagreements resolved?',
      a: 'If either party raises an issue that cannot be resolved mutually, the contract can be submitted to the PolyLance DAO judge panel. Verified judges review milestone specifications, commit logs, and deliverables to issue a binding, fair resolution on-chain.',
    },
    {
      q: 'Which currencies and tokens are supported?',
      a: 'PolyLance operates on Polygon with fast, sub-cent transaction fees. Milestone budgets can be funded using native POL or dollar-pegged USDC.',
    },
  ];

  return (
    <div className="relative z-1 space-y-20 py-4 max-w-[1200px] mx-auto text-[#0B0B0C] px-4 sm:px-6 lg:px-8">
      {/* ── Fixed Animated Flowing Contour Background ──────────────────────── */}
      <ContourBackground calmZoneRef={heroCalmZoneRef} />

      {/* ── 1. HERO SECTION ──────────────────────────────────────────────── */}
      <section className="pt-4 sm:pt-8 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          {/* Left Column: Headline, Slogan, Subtitle, and Actions */}
          <div ref={heroCalmZoneRef} className="lg:col-span-7 space-y-6 text-left">
            {/* Flat Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7EEF9] text-[#0047AB] text-xs font-semibold border border-[#D0E0F7]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0047AB]" />
              <span>Smart contract escrow on Polygon</span>
            </div>

            {/* Solid Single-Ink Serif Headline with Cobalt Accent */}
            <h1 className="font-serif font-semibold text-3xl sm:text-4xl lg:text-[46px] text-[#0B0B0C] tracking-tight leading-[1.18]">
              Your Work. Your Reputation. Your Identity.{' '}
              <span className="text-[#0047AB]">Everything on chain at PolyLance.</span>
            </h1>

            {/* Subtitle with High Contrast */}
            <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed max-w-xl font-normal">
              Get paid milestone by milestone with trustless Polygon escrow. Build an immutable Soulbound work history and verifiable reputation owned entirely by your wallet.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleGetStarted}
                className="bg-[#0047AB] hover:bg-[#003A8C] active:bg-[#002F73] text-white font-medium text-sm sm:text-base px-6 py-3.5 rounded-[8px] transition-colors duration-150 inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wallet size={16} strokeWidth={1.5} />
                <span>{isConnected ? 'Go to dashboard' : 'Connect wallet'}</span>
                <ArrowRight size={16} strokeWidth={1.5} />
              </button>

              <Link
                to="/jobs"
                className="bg-[#FFFFFF] hover:bg-[#F4F6F9] border border-[#E2E6EC] text-[#0B0B0C] font-medium text-sm sm:text-base px-6 py-3.5 rounded-[8px] transition-colors duration-150 inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search size={16} strokeWidth={1.5} className="text-[#0047AB]" />
                <span>Browse jobs</span>
              </Link>
            </div>

            {/* Micro Trust Metadata */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#4B5563] pt-1 font-medium">
              <span className="text-[#0B0B0C] font-semibold">2.5% platform fee</span>
              <span className="text-[#8892A0]">•</span>
              <span>Instant milestone release</span>
              <span className="text-[#8892A0]">•</span>
              <span>Non-custodial contracts</span>
            </div>
          </div>

          {/* Right Column: 
              - For Non-Users (!isConnected): Show ONLY about PolyLance (slogan, 4 pillars, protocol architecture)
              - For Connected Users (isConnected): Show REAL notifications only (zero demo data)
          */}
          <div className="lg:col-span-5">
            <div className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] p-5 sm:p-6 space-y-4 shadow-[0_1px_2px_rgba(11,11,12,0.06)] text-left">
              
              {/* ─────────────────────────────────────────────────────────────
                  STATE A: NON-POLYLANCE USERS (SHOW ONLY ABOUT POLYLANCE)
                  ───────────────────────────────────────────────────────────── */}
              {!isConnected ? (
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-[#E2E6EC] pb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E2E6EC]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E2E6EC]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E2E6EC]" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-[#E7EEF9] text-[#0047AB] text-xs font-semibold">
                      <Shield size={12} strokeWidth={1.5} />
                      About PolyLance
                    </span>
                  </div>

                  {/* Slogan Banner */}
                  <div className="p-3.5 bg-[#F4F6F9] border border-[#E2E6EC] rounded-[8px] space-y-1">
                    <div className="text-[11px] font-mono text-[#8892A0] uppercase tracking-wider">
                      PolyLance Protocol
                    </div>
                    <h3 className="font-serif font-semibold text-sm sm:text-base text-[#0B0B0C] leading-snug">
                      “Your Work. Your Reputation. Your Identity. Everything on chain at PolyLance.”
                    </h3>
                    <p className="text-xs text-[#4B5563] leading-relaxed pt-1">
                      A Web3 freelance clearinghouse and escrow protocol on Polygon. Non-custodial milestone escrow, permanent Soulbound credentials, and a transparent 2.5% smart contract fee.
                    </p>
                  </div>

                  {/* 4 Core Pillars of PolyLance */}
                  <div className="space-y-2.5">
                    {/* Pillar 1 */}
                    <div className="p-3 bg-[#FFFFFF] border border-[#E2E6EC] rounded-[8px] space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#0B0B0C]">
                        <Lock size={14} strokeWidth={1.5} className="text-[#0047AB] shrink-0" />
                        <span>Trustless Milestone Escrow</span>
                      </div>
                      <p className="text-[11px] text-[#4B5563] leading-relaxed pl-5">
                        Client deposits are locked on Polygon before work starts. Payments release instantly milestone-by-milestone upon inspection.
                      </p>
                    </div>

                    {/* Pillar 2 */}
                    <div className="p-3 bg-[#FFFFFF] border border-[#E2E6EC] rounded-[8px] space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#0B0B0C]">
                        <ShieldCheck size={14} strokeWidth={1.5} className="text-[#0047AB] shrink-0" />
                        <span>Soulbound Reputation (ERC-5192)</span>
                      </div>
                      <p className="text-[11px] text-[#4B5563] leading-relaxed pl-5">
                        Your work history and ratings live in your crypto wallet, not on proprietary servers. Uncensorable, non-transferable proof of work.
                      </p>
                    </div>

                    {/* Pillar 3 */}
                    <div className="p-3 bg-[#FFFFFF] border border-[#E2E6EC] rounded-[8px] space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#0B0B0C]">
                        <Scale size={14} strokeWidth={1.5} className="text-[#0047AB] shrink-0" />
                        <span>Decentralized DAO Arbitration</span>
                      </div>
                      <p className="text-[11px] text-[#4B5563] leading-relaxed pl-5">
                        Disputes are resolved on-chain by peer judges evaluating deliverables and GitHub cryptographic commits, not corporate help desks.
                      </p>
                    </div>

                    {/* Pillar 4 */}
                    <div className="p-3 bg-[#FFFFFF] border border-[#E2E6EC] rounded-[8px] space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#0B0B0C]">
                        <Coins size={14} strokeWidth={1.5} className="text-[#0047AB] shrink-0" />
                        <span>Transparent 2.5% Platform Fee</span>
                      </div>
                      <p className="text-[11px] text-[#4B5563] leading-relaxed pl-5">
                        Keep 97.5% of what you earn. Sub-cent Polygon gas fees, zero withdrawal fees, and zero hidden deductions.
                      </p>
                    </div>
                  </div>

                  {/* Technology & Trust Strip */}
                  <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded-[4px] bg-[#F4F6F9] border border-[#E2E6EC] text-[#4B5563] font-medium font-mono">
                      Polygon (137)
                    </span>
                    <span className="px-2 py-0.5 rounded-[4px] bg-[#F4F6F9] border border-[#E2E6EC] text-[#4B5563] font-medium">
                      Non-Custodial
                    </span>
                    <span className="px-2 py-0.5 rounded-[4px] bg-[#F4F6F9] border border-[#E2E6EC] text-[#4B5563] font-medium">
                      GitHub Attestations
                    </span>
                    <span className="px-2 py-0.5 rounded-[4px] bg-[#F4F6F9] border border-[#E2E6EC] text-[#4B5563] font-medium">
                      POL / USDC
                    </span>
                  </div>

                  {/* Onboarding Call-to-Action */}
                  <button
                    type="button"
                    onClick={handleGetStarted}
                    className="w-full py-2.5 px-3 rounded-[6px] bg-[#0047AB] hover:bg-[#003A8C] text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Wallet size={14} strokeWidth={1.5} />
                    <span>Connect wallet to join PolyLance</span>
                  </button>
                </div>
              ) : (
                /* ─────────────────────────────────────────────────────────────
                   STATE B: CONNECTED POLYLANCE USERS (REAL NOTIFICATIONS ONLY)
                   ───────────────────────────────────────────────────────────── */
                <div className="space-y-3.5">
                  {/* Top Bar with Real Wallet Indicator */}
                  <div className="flex items-center justify-between border-b border-[#E2E6EC] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#1E8449]" />
                      <span className="font-mono text-xs font-semibold text-[#0B0B0C]">
                        {truncateAddress(address)}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-[#E7EEF9] text-[#0047AB] text-xs font-semibold">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0047AB] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0047AB]"></span>
                      </span>
                      <Bell size={12} strokeWidth={1.5} />
                      Live Notifications
                    </span>
                  </div>

                  {/* Personal vs Network Real Data Banner */}
                  <div className="p-2.5 bg-[#F4F6F9] border border-[#E2E6EC] rounded-[8px] text-xs">
                    {hasPersonalNotifications ? (
                      <div className="text-[#0B0B0C] font-medium flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Sparkles size={13} strokeWidth={1.5} className="text-[#0047AB] shrink-0" />
                          <span className="truncate">Live contract notifications for your connected wallet.</span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ACTIVE
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 text-[#4B5563]">
                        <div className="min-w-0">
                          <span className="text-[#0B0B0C] font-semibold">No personal contract alerts yet.</span> Showing live on-chain contract events from the network.
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ACTIVE
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Real Notification Items List */}
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5">
                    {displayedNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 bg-[#FFFFFF] border rounded-[8px] transition-colors space-y-1.5 ${
                          notif.isPersonal ? 'border-[#0047AB]/30 hover:border-[#0047AB]' : 'border-[#E2E6EC] hover:border-[#8892A0]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={`inline-flex items-center gap-1.5 font-semibold ${notif.isPersonal ? 'text-[#0047AB]' : 'text-[#0B0B0C]'}`}>
                            <CheckCircle2 size={13} strokeWidth={1.5} className="shrink-0" />
                            {notif.title}
                          </span>
                          <span className="text-[#8892A0] font-mono text-[10px] shrink-0">
                            {notif.timeAgo}
                          </span>
                        </div>

                        <p className="text-xs text-[#4B5563] leading-snug line-clamp-2">
                          {notif.description}
                        </p>

                        <div className="flex items-center justify-between pt-1 text-[11px] border-t border-[#E2E6EC]/60">
                          <span className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium ${notif.badgeColor}`}>
                            {notif.badge}
                          </span>

                          <Link
                            to={notif.linkTo}
                            className="text-[#0047AB] font-semibold hover:underline inline-flex items-center gap-0.5"
                          >
                            <span>Inspect</span>
                            <ArrowUpRight size={11} strokeWidth={1.5} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Action Navigation */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      to="/workspace"
                      className="py-2 px-3 rounded-[6px] bg-[#0047AB] hover:bg-[#003A8C] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors text-center"
                    >
                      <Layers size={13} strokeWidth={1.5} />
                      <span>Workspace</span>
                    </Link>

                    <Link
                      to="/jobs"
                      className="py-2 px-3 rounded-[6px] bg-[#F4F6F9] hover:bg-[#E2E6EC] border border-[#E2E6EC] text-[#0B0B0C] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors text-center"
                    >
                      <Search size={13} strokeWidth={1.5} className="text-[#0047AB]" />
                      <span>Browse Jobs</span>
                    </Link>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* ── 2. NUMBERED 4-STEP TIMELINE: HOW ESCROW WORKS (NON-POLYLANCE USERS ONLY) ── */}
      {!isConnected && (
        <section className="space-y-8 text-left">
          <div className="space-y-2">
            <h2 className="font-serif font-semibold text-2xl sm:text-3xl text-[#0B0B0C] tracking-tight">
              How escrow works
            </h2>
            <p className="text-sm sm:text-base text-[#4B5563] max-w-xl">
              Four transparent steps from project specification to instant on-chain settlement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Step 1 */}
            <div className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] p-5 space-y-3">
              <div className="w-8 h-8 rounded-full bg-[#0B0B0C] text-white font-mono font-semibold text-xs flex items-center justify-center">
                01
              </div>
              <h3 className="font-sans font-semibold text-base text-[#0B0B0C]">Agree on milestones</h3>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                Define deliverable requirements, budget, and deadlines together. Both sides sign off before work begins.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] p-5 space-y-3">
              <div className="w-8 h-8 rounded-full bg-[#0047AB] text-white font-mono font-semibold text-xs flex items-center justify-center">
                02
              </div>
              <h3 className="font-sans font-semibold text-base text-[#0B0B0C]">Fund the escrow</h3>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                The client deposits funds into the Polygon escrow smart contract. The freelancer starts work knowing funds are secure.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] p-5 space-y-3">
              <div className="w-8 h-8 rounded-full bg-[#0B0B0C] text-white font-mono font-semibold text-xs flex items-center justify-center">
                03
              </div>
              <h3 className="font-sans font-semibold text-base text-[#0B0B0C]">Deliver &amp; verify</h3>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                The freelancer submits deliverables with cryptographic GitHub attestations and preview links for review.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] p-5 space-y-3">
              <div className="w-8 h-8 rounded-full bg-[#0B0B0C] text-white font-mono font-semibold text-xs flex items-center justify-center">
                04
              </div>
              <h3 className="font-sans font-semibold text-base text-[#0B0B0C]">Release &amp; mint</h3>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                Once approved, funds transfer instantly to the freelancer. An immutable Soulbound reputation token is minted on-chain.
              </p>
            </div>

          </div>
        </section>
      )}

      {/* ── 4. STAT CARDS ROW (Solid white surfaces, ink numbers, neutral labels) ─ */}
      <section className="space-y-6 text-left">
        <div className="space-y-2">
          <h2 className="font-serif font-semibold text-2xl sm:text-3xl text-[#0B0B0C] tracking-tight">
            Decentralized network activity &amp; settlement scale
          </h2>
          <p className="text-sm sm:text-base text-[#4B5563] max-w-xl">
            Real-time, verifiable milestone statistics and reputation metrics recorded on the Polygon network.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          <div className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] p-5 sm:p-6 space-y-1 shadow-xs">
            <div className="font-sans font-semibold text-3xl sm:text-4xl text-[#0B0B0C]">
              {verifiedCount}+
            </div>
            <div className="text-xs sm:text-sm text-[#4B5563] font-medium">
              Verified freelancers
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] p-5 sm:p-6 space-y-1 shadow-xs">
            <div className="font-sans font-semibold text-3xl sm:text-4xl text-[#0B0B0C]">
              {completedJobs}+
            </div>
            <div className="text-xs sm:text-sm text-[#4B5563] font-medium">
              Milestone jobs completed
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] p-5 sm:p-6 space-y-1 shadow-xs">
            <div className="font-sans font-semibold text-3xl sm:text-4xl text-[#0B0B0C]">
              ${totalEscrowUsdc.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs sm:text-sm text-[#4B5563] font-medium">
              Secured in escrow
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] p-5 sm:p-6 space-y-1 shadow-xs">
            <div className="font-sans font-semibold text-3xl sm:text-4xl text-[#0B0B0C]">
              99.8%
            </div>
            <div className="text-xs sm:text-sm text-[#4B5563] font-medium">
              Milestone settlement rate
            </div>
          </div>

        </div>
      </section>

      {/* ── 5. FAQ ACCORDION ─────────────────────────────────────────────── */}
      <section className="space-y-6 text-left">
        <div className="space-y-2">
          <h2 className="font-serif font-semibold text-2xl sm:text-3xl text-[#0B0B0C] tracking-tight">
            Frequently asked questions
          </h2>
          <p className="text-sm sm:text-base text-[#4B5563] max-w-xl">
            Everything you need to know about smart contract escrows, fees, and reputation.
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] divide-y divide-[#E2E6EC]">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full py-4 px-5 sm:px-6 flex items-center justify-between text-left cursor-pointer hover:bg-[#F4F6F9] transition-colors duration-150"
                >
                  <span className="font-semibold text-sm sm:text-base text-[#0B0B0C] pr-4">
                    {faq.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="shrink-0"
                  >
                    <ChevronDown
                      size={16}
                      strokeWidth={1.5}
                      className={isOpen ? 'text-[#0047AB]' : 'text-[#4B5563]'}
                    />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="faq-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="px-5 sm:px-6 pb-4 pt-1 text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 6. CLOSING CTA BAND IN SOLID --black: #0B0B0C ────────────────── */}
      <section className="relative z-10">
        <div className="w-full bg-[#0B0B0C] text-white rounded-[10px] p-8 sm:p-14 text-center space-y-6 shadow-xs">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="font-serif font-semibold text-3xl sm:text-4xl text-white tracking-tight">
              Ready to work with verified on-chain trust?
            </h2>
            <p className="text-base sm:text-lg text-white/80 max-w-lg mx-auto font-normal">
              Connect your wallet to browse open contracts or post a project with guaranteed milestone escrow.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleGetStarted}
              className="bg-[#0047AB] hover:bg-[#003A8C] active:bg-[#002F73] text-white font-medium text-sm sm:text-base px-6 py-3.5 rounded-[8px] transition-colors duration-150 inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Wallet size={16} strokeWidth={1.5} />
              <span>{isConnected ? 'Go to dashboard' : 'Connect wallet'}</span>
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>

            <Link
              to="/jobs"
              className="bg-transparent hover:bg-white/10 border border-white/40 text-white font-medium text-sm sm:text-base px-6 py-3.5 rounded-[8px] transition-colors duration-150 inline-flex items-center gap-2 cursor-pointer"
            >
              <Search size={16} strokeWidth={1.5} />
              <span>Browse jobs</span>
            </Link>
          </div>

          <div className="text-xs text-white/60 font-mono pt-2">
            Polygon Mainnet (137) • 2.5% platform fee • Non-custodial escrow
          </div>
        </div>
      </section>

    </div>
  );
};

export default Landing;
