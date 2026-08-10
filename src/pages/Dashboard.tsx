import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { truncateAddress } from '../utils/formatters';
import { Briefcase, Send, PlusCircle, ArrowUpRight, Award, Search, Lock, TrendingUp, ShieldCheck, CheckCircle2, FileText, MessageSquare, Clock } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { address, currentRole } = useWeb3();
  if (currentRole === 'judge') {
    return <Navigate to="/judge" replace />;
  }
  if (currentRole === 'admin') {
    return <Navigate to="/treasury" replace />;
  }
  const { jobs, profiles } = usePolyLanceData();

  const userProfile = profiles[address] || {
    displayName: currentRole === 'client' ? 'GlobalCorp Enterprise' : 'Alex Rivera',
    bio: 'Decentralized RWA Talent & Protocol Engineer',
    avatarUrl: currentRole === 'client'
      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    skills: ['Solidity', 'Rust', 'TypeScript', 'React'],
    reputationSbtCount: 14,
  };

  const isClientRole = currentRole === 'client';

  const myClientJobs = jobs.filter((j) => j.client.toLowerCase() === address.toLowerCase());
  const myFreelancerJobs = jobs.filter((j) => j.freelancer?.toLowerCase() === address.toLowerCase());

  // Collect all applications sent by this address across all jobs
  const myApplications = jobs.flatMap((j) =>
    j.applications
      .filter((app) => app.applicant.toLowerCase() === address.toLowerCase())
      .map((app) => ({ ...app, job: j }))
  );

  const completedFreelanceJobs = myFreelancerJobs.filter((j) => j.status === 'Completed');
  const totalEarnedUsdc = completedFreelanceJobs.reduce((sum, j) => sum + parseFloat(j.amountUsdc || '0'), 0);
  const clientTotalEscrow = myClientJobs.reduce((sum, j) => sum + parseFloat(j.amountUsdc || '0'), 0);

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      {/* Top Banner with Role Context */}
      <div className="glass-panel p-6 sm:p-8 border-purple-200 bg-white hard-shadow flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.displayName}
            className="w-16 h-16 rounded-2xl border-2 border-purple-200 object-cover shadow-xs"
          />
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
              {userProfile.displayName}
              <span className="text-xs bg-purple-100 text-purple-900 border border-purple-200 px-2.5 py-0.5 rounded-full font-mono font-bold capitalize">
                {isClientRole ? 'Verified Enterprise Client' : 'Diamond Freelancer'}
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> On-Chain Verified
              </span>
            </h1>
            <p className="text-xs font-mono text-purple-900 font-bold mt-1">
              Wallet Address: {truncateAddress(address)} • Polygon Mainnet Connected
            </p>
          </div>
        </div>

        {/* ROLE-SPECIFIC HEADER CTA BUTTONS */}
        <div className="flex items-center gap-3">
          {isClientRole ? (
            <Link
              to="/jobs/post"
              className="gradient-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <PlusCircle size={16} />
              Post New Escrow Job
            </Link>
          ) : (
            <Link
              to="/jobs"
              className="gradient-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Search size={16} />
              Browse Job Marketplace
            </Link>
          )}

          <Link
            to={`/profile/${address}`}
            className="glass-panel px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* CLIENT ENTERPRISE OVERVIEW DASHBOARD */}
      {isClientRole ? (
        <div className="space-y-8">
          {/* Financial Overview Cards (High-Integrity Ledger Style from client_dashboard_enterprise_overview) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-2">
              <span className="font-label-mono text-xs uppercase tracking-wider text-slate-500 font-bold">
                Total Value Locked (TVL)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-3xl font-black text-slate-900">
                  ${clientTotalEscrow > 0 ? clientTotalEscrow.toLocaleString() : '42,850.00'}
                </span>
                <span className="text-xs font-mono text-slate-500 font-bold">USDC</span>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs text-purple-700 font-bold font-mono">
                <Lock size={14} /> {myClientJobs.length > 0 ? myClientJobs.length : 12} Active Smart Contract Escrows
              </div>
            </div>

            <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-2">
              <span className="font-label-mono text-xs uppercase tracking-wider text-slate-500 font-bold">
                Total Spent (YTD)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-3xl font-black text-emerald-700">
                  $184,200.00
                </span>
                <span className="text-xs font-mono text-slate-500 font-bold">USDC</span>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-bold font-mono">
                <TrendingUp size={14} /> +14% increase from last quarter
              </div>
            </div>

            <div className="glass-panel p-6 border-purple-200 bg-purple-50 hard-shadow space-y-2">
              <span className="font-label-mono text-xs uppercase tracking-wider text-purple-900 font-bold">
                Avg Milestone Approval
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-3xl font-black text-purple-950">
                  18.4
                </span>
                <span className="text-xs font-mono text-purple-900 font-bold">Hours</span>
              </div>
              <div className="pt-2">
                <span className="bg-purple-200 text-purple-950 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                  Top 5% Response Rate
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Column (8 Cols): Milestone Approvals + Active Contracts */}
            <div className="lg:col-span-8 space-y-8">
              {/* Action Required: Pending Milestone Submissions */}
              <section className="glass-panel border-amber-200 bg-white hard-shadow overflow-hidden">
                <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-amber-700" />
                    <h3 className="font-headline text-sm font-extrabold uppercase tracking-widest text-amber-950">
                      Action Required: Pending Milestone Review
                    </h3>
                  </div>
                  <span className="bg-amber-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
                    2 Action Items
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* Action Item 1 */}
                  <div className="p-6 flex flex-col md:flex-row gap-4 items-start justify-between hover:bg-slate-50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">Blockchain Indexing Engine V2</span>
                        <span className="bg-purple-100 text-purple-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                          Milestone 3/5
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-mono">
                        Submitted by: <span className="text-purple-700 font-bold">Alex Chen (@cryptodev_zero)</span>
                      </p>
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs italic text-slate-700">
                        "Smart contract logic for multi-sig vault implementation completed. Audited against common vulnerabilities. Ready for technical review."
                      </div>
                      <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 pt-1">
                        <span className="flex items-center gap-1"><FileText size={14} /> indexing_logic_final.pdf</span>
                        <span>•</span>
                        <span>Submitted 4 hours ago</span>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 shrink-0 self-end md:self-auto">
                      <Link
                        to="/jobs/1"
                        className="gradient-btn-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs"
                      >
                        Review & Release
                      </Link>
                      <button className="glass-panel px-4 py-2 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-100 rounded-xl">
                        View Proof
                      </button>
                    </div>
                  </div>

                  {/* Action Item 2 */}
                  <div className="p-6 flex flex-col md:flex-row gap-4 items-start justify-between hover:bg-slate-50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">DeFi Liquidity UI Components</span>
                        <span className="bg-purple-100 text-purple-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                          Milestone 1/2
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-mono">
                        Submitted by: <span className="text-purple-700 font-bold">Sarah Vogt (@sarah_ui)</span>
                      </p>
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs italic text-slate-700">
                        "Initial moodboards and 3 logo concepts finalized. Includes typography pairing and secondary color palette for the app."
                      </div>
                      <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 pt-1">
                        <span className="flex items-center gap-1"><FileText size={14} /> figma.com/proto/7z8...</span>
                        <span>•</span>
                        <span>Submitted 1 day ago</span>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 shrink-0 self-end md:self-auto">
                      <Link
                        to="/jobs/2"
                        className="gradient-btn-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs"
                      >
                        Review & Release
                      </Link>
                      <button className="glass-panel px-4 py-2 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-100 rounded-xl">
                        View Proof
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* All Posted Contracts Grid */}
              <section className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900 font-heading flex items-center gap-2">
                    <Briefcase size={18} className="text-purple-700" /> Active Escrow Contracts ({myClientJobs.length > 0 ? myClientJobs.length : 3})
                  </h3>
                  <Link to="/jobs/post" className="text-xs font-mono text-purple-700 font-bold hover:underline flex items-center gap-1">
                    <PlusCircle size={14} /> Post New Escrow
                  </Link>
                </div>

                <div className="space-y-3">
                  {(myClientJobs.length > 0 ? myClientJobs : jobs.slice(0, 3)).map((job) => (
                    <div
                      key={job.id}
                      className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-purple-300 transition-all flex items-center justify-between"
                    >
                      <div className="space-y-1 max-w-md">
                        <Link
                          to={`/jobs/${job.id}`}
                          className="font-bold text-sm text-slate-900 hover:text-purple-700 transition-colors line-clamp-1"
                        >
                          {job.title}
                        </Link>
                        <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono">
                          <span className="font-bold text-emerald-700">${job.amountUsdc} USDC Escrow</span>
                          <span>•</span>
                          <span>{job.applications.length} Proposals</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`badge-status badge-${job.status.toLowerCase()}`}>
                          {job.status}
                        </span>
                        <Link
                          to={`/jobs/${job.id}`}
                          className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200"
                        >
                          <ArrowUpRight size={16} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar Column (4 Cols): Enterprise Profile & Hiring Pipeline */}
            <div className="lg:col-span-4 space-y-6">
              {/* Enterprise Identity Card */}
              <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-6">
                <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-3">
                  Enterprise Identity
                </h3>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-900 border border-purple-200 flex items-center justify-center font-mono font-black text-xl">
                    4.98
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-base block">Enterprise Trust Score</span>
                    <span className="text-xs text-purple-700 font-mono font-semibold">Top 1% Global Client</span>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs border-t border-slate-100 pt-4">
                  <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Verification Level</span>
                    <span className="font-bold text-purple-700 flex items-center gap-1">
                      <ShieldCheck size={14} /> Platinum Verified
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Rehire Rate</span>
                    <span className="font-bold text-slate-900">92%</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Dispute Ratio</span>
                    <span className="font-bold text-emerald-600">0.02%</span>
                  </div>
                </div>

                <button className="w-full glass-panel py-2 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl">
                  Download Audit Report
                </button>
              </div>

              {/* Escrow Guarantee Security Box */}
              <div className="gradient-btn-primary p-6 rounded-2xl hard-shadow text-white space-y-3">
                <ShieldCheck size={28} />
                <div>
                  <h4 className="font-bold text-base">Escrow Protection Active</h4>
                  <p className="text-xs text-purple-100 leading-relaxed mt-1">
                    Your funds are locked in the PolyLance Immutable Vault. Milestones can only be released upon your cryptographic signature.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* FREELANCER PERSONAL OVERVIEW & COLLABORATION HUB */
        <div className="space-y-8">
          {/* Freelancer Performance Stat Cards (matching dashboard_personal_overview_1) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="glass-panel p-4 border-slate-200 bg-white text-center hard-shadow space-y-1">
              <div className="text-2xl font-black text-emerald-700 font-mono">
                {completedFreelanceJobs.length > 0 ? completedFreelanceJobs.length : 14}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Jobs Completed
              </div>
            </div>

            <div className="glass-panel p-4 border-slate-200 bg-white text-center hard-shadow space-y-1">
              <div className="text-2xl font-black text-purple-900 font-mono">
                ${totalEarnedUsdc > 0 ? totalEarnedUsdc.toLocaleString() : '42,500'}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Total Earned
              </div>
            </div>

            <div className="glass-panel p-4 border-slate-200 bg-white text-center hard-shadow space-y-1">
              <div className="text-2xl font-black text-purple-700 font-mono">
                {myApplications.length > 0 ? myApplications.length : 5}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Applications Sent
              </div>
            </div>

            <div className="glass-panel p-4 border-slate-200 bg-white text-center hard-shadow space-y-1">
              <div className="text-2xl font-black text-amber-700 font-mono">
                99.2%
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Success Rate
              </div>
            </div>

            <div className="glass-panel p-4 border-purple-200 bg-purple-50 text-center hard-shadow space-y-1">
              <div className="text-2xl font-black text-purple-900 font-mono">
                982 pts
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-purple-900">
                Reputation Score
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Column (8 Cols): Active Contracts & Collaboration Hub */}
            <div className="lg:col-span-8 space-y-8">
              {/* Active Contracts & Deliverable Proof Submissions */}
              <section className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900 font-heading flex items-center gap-2">
                    <Send size={18} className="text-purple-700" /> Active Freelance Contracts & Collaboration Hub
                  </h3>
                  <Link to="/reputation" className="text-xs font-mono text-purple-700 font-bold hover:underline flex items-center gap-1">
                    <Award size={14} /> View Leaderboard Standings
                  </Link>
                </div>

                <div className="space-y-4">
                  {/* Active Job 1 */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-purple-200 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link to="/jobs/1" className="font-bold text-base text-slate-900 hover:text-purple-700 transition-colors">
                          Zero-Knowledge Circuit & Solidity Verifier for On-Chain Identity
                        </Link>
                        <p className="text-xs text-slate-600 mt-0.5 font-mono">
                          Client: <span className="text-purple-700 font-bold">GlobalCorp (@0x71C...3921)</span>
                        </p>
                      </div>
                      <span className="badge-status badge-submitted shrink-0">
                        Submitted (In Review)
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 font-mono text-xs pt-1">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-500 text-[10px] block font-bold uppercase">Escrow Locked</span>
                        <span className="font-bold text-emerald-700">$5,000 USDC</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-500 text-[10px] block font-bold uppercase">Milestones</span>
                        <span className="font-bold text-purple-700">2 of 3 Approved</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-500 text-[10px] block font-bold uppercase">SBT Reputation</span>
                        <span className="font-bold text-amber-700">+120 pts Pending</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                        <MessageSquare size={15} className="text-purple-700" />
                        <span>XMTP Encrypted Chat Connected</span>
                      </div>
                      <Link
                        to="/jobs/1"
                        className="gradient-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        Open Collaboration Hub
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>

                  {/* Active Job 2 */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link to="/jobs/2" className="font-bold text-base text-slate-900 hover:text-purple-700 transition-colors">
                          High-Throughput Go Indexer for Polygon Event Logs
                        </Link>
                        <p className="text-xs text-slate-600 mt-0.5 font-mono">
                          Client: <span className="text-purple-700 font-bold">LiquidNode Studio (@0x8f2...192a)</span>
                        </p>
                      </div>
                      <span className="badge-status badge-in-progress shrink-0">
                        In Progress
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 font-mono text-xs pt-1">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-500 text-[10px] block font-bold uppercase">Escrow Locked</span>
                        <span className="font-bold text-emerald-700">$6,800 USDC</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-500 text-[10px] block font-bold uppercase">Milestones</span>
                        <span className="font-bold text-purple-700">1 of 5 Approved</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-500 text-[10px] block font-bold uppercase">Due In</span>
                        <span className="font-bold text-slate-900">4 Days</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                        <MessageSquare size={15} className="text-purple-700" />
                        <span>XMTP Encrypted Chat Connected</span>
                      </div>
                      <Link
                        to="/jobs/2"
                        className="gradient-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        Submit Proof of Work
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar Column (4 Cols): On-Chain Reputation & Applications */}
            <div className="lg:col-span-4 space-y-6">
              {/* Soulbound Reputation Badges Card */}
              <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-4">
                <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Award size={16} className="text-purple-700" /> Soulbound SBT Attestations
                </h3>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-purple-950">Genesis Auditor SBT</span>
                      <span className="bg-purple-200 text-purple-900 text-[10px] px-2 py-0.5 rounded font-bold">
                        Token #1042
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600">Minted for 10+ audited smart contract escrows with zero bugs.</p>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-950">Escrow Master SBT</span>
                      <span className="bg-emerald-200 text-emerald-900 text-[10px] px-2 py-0.5 rounded font-bold">
                        Token #0912
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600">100% on-time milestone delivery rate across 14 contracts.</p>
                  </div>
                </div>

                <Link
                  to="/reputation"
                  className="w-full glass-panel py-2 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl text-center block"
                >
                  View Global Leaderboard Rank (#42)
                </Link>
              </div>

              {/* GitHub Verified Skill Score */}
              <div className="glass-panel p-6 border-cyan-200 bg-white hard-shadow space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-cyan-700" /> GitHub E-KYC Attestation
                  </span>
                  <span className="text-[10px] bg-cyan-100 text-cyan-900 px-2 py-0.5 rounded font-bold">
                    Score: 850
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Solidity</span>
                    <span className="font-bold text-purple-900">88,420 Bytes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rust</span>
                    <span className="font-bold text-purple-900">42,100 Bytes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TypeScript</span>
                    <span className="font-bold text-purple-900">120,500 Bytes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
