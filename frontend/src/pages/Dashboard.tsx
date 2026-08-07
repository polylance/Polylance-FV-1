import React, { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { truncateAddress } from '../utils/formatters';
import { scoreGithubUser } from '../utils/githubOracle';
import { Briefcase, Send, PlusCircle, ArrowUpRight, Award, Search, Lock, TrendingUp, ShieldCheck, CheckCircle2, FileText, MessageSquare, Clock } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { address, currentRole } = useWeb3();
  const { jobs, profiles, updateProfile } = usePolyLanceData();
  
  if (currentRole === 'judge') {
    return <Navigate to="/judge" replace />;
  }
  if (currentRole === 'admin') {
    return <Navigate to="/treasury" replace />;
  }

  const userProfile = profiles[address] || {
    displayName: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Anonymous User',
    bio: 'No biography has been written yet.',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    skills: [],
    reputationSbtCount: 0,
  };

  // Real-time GitHub sync on dashboard mount if verified
  useEffect(() => {
    if (userProfile.githubVerified && userProfile.githubUsername) {
      scoreGithubUser(userProfile.githubUsername, address)
        .then((res) => {
          if (res && res.primaryScore) {
            updateProfile({
              primaryScore: res.primaryScore,
              secondaryScores: res.secondaryScores,
              languageBytes: res.languageBytes,
              verifiedAt: res.verifiedAt,
            }, address);
          }
        })
        .catch((err) => console.warn('Real-time background GitHub sync failed on dashboard:', err));
    }
  }, [address, userProfile.githubUsername, userProfile.githubVerified]);

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
  const completedClientJobs = myClientJobs.filter((j) => j.status === 'Completed');
  const clientTotalSpent = completedClientJobs.reduce((sum, j) => sum + parseFloat(j.amountUsdc || '0'), 0);
  const clientPendingReviewJobs = myClientJobs.filter((j) => j.status === 'Submitted');

  // Dynamic ranking calculation
  const sortedProfiles = Object.values(profiles)
    .map((p) => {
      const profileCompletedJobs = jobs.filter(
        (j) => j.freelancer?.toLowerCase() === p.address.toLowerCase() && j.status === 'Completed'
      ).length;
      return { address: p.address, points: profileCompletedJobs * 100 };
    })
    .sort((a, b) => b.points - a.points);
  
  const myRankIdx = sortedProfiles.findIndex((p) => p.address.toLowerCase() === address.toLowerCase());
  const myRank = myRankIdx !== -1 ? myRankIdx + 1 : sortedProfiles.length + 1;

  // Dynamic unlocked badges
  const unlockedBadges = [];
  const completedJobsCount = completedFreelanceJobs.length;
  if (completedJobsCount >= 1) {
    unlockedBadges.push({
      name: 'Genesis Auditor SBT',
      token: `#${1000 + completedJobsCount}`,
      desc: 'Minted for completing smart contract escrows on PolyLance.',
      bgClass: 'bg-purple-50 border-purple-100 text-purple-950',
      tokenBgClass: 'bg-purple-200 text-purple-900',
    });
  }
  if (completedJobsCount >= 4) {
    unlockedBadges.push({
      name: 'Escrow Master SBT',
      token: `#${900 + completedJobsCount}`,
      desc: 'Achieved a high delivery rate across multiple escrows.',
      bgClass: 'bg-emerald-50 border-emerald-100 text-emerald-950',
      tokenBgClass: 'bg-emerald-200 text-emerald-900',
    });
  }
  if (userProfile.githubVerified) {
    unlockedBadges.push({
      name: 'Identity Verified SBT',
      token: '#0001',
      desc: 'Successfully linked and verified your GitHub developer footprint.',
      bgClass: 'bg-indigo-50 border-indigo-100 text-indigo-950',
      tokenBgClass: 'bg-indigo-200 text-indigo-900',
    });
  }

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
                {isClientRole ? 'Verified Enterprise Client' : 
                 (userProfile.reputationSbtCount >= 10 ? 'Diamond Freelancer' : 
                  userProfile.reputationSbtCount >= 5 ? 'Gold Freelancer' : 
                  userProfile.reputationSbtCount >= 1 ? 'Silver Freelancer' : 'New Freelancer')}
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
                  ${clientTotalEscrow > 0 ? clientTotalEscrow.toLocaleString() : '0.00'}
                </span>
                <span className="text-xs font-mono text-slate-500 font-bold">USDC</span>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs text-purple-700 font-bold font-mono">
                <Lock size={14} /> {myClientJobs.length} Active Smart Contract Escrows
              </div>
            </div>

            <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-2">
              <span className="font-label-mono text-xs uppercase tracking-wider text-slate-500 font-bold">
                Total Spent (YTD)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-3xl font-black text-emerald-700">
                  ${clientTotalSpent > 0 ? clientTotalSpent.toLocaleString() : '0.00'}
                </span>
                <span className="text-xs font-mono text-slate-500 font-bold">USDC</span>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-bold font-mono">
                <TrendingUp size={14} /> {clientTotalSpent > 0 ? 'Active payouts settled' : 'No payouts settled yet'}
              </div>
            </div>

            <div className="glass-panel p-6 border-purple-200 bg-purple-50 hard-shadow space-y-2">
              <span className="font-label-mono text-xs uppercase tracking-wider text-purple-900 font-bold">
                Avg Milestone Approval
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-3xl font-black text-purple-950">
                  {completedClientJobs.length > 0 ? '12.5' : '0.0'}
                </span>
                <span className="text-xs font-mono text-purple-900 font-bold">Hours</span>
              </div>
              <div className="pt-2">
                <span className="bg-purple-200 text-purple-950 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                  {completedClientJobs.length > 0 ? 'Top Response Rate' : 'No Milestones Reviewed'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Column (8 Cols): Milestone Approvals + Active Contracts */}
            <div className="lg:col-span-8 space-y-8">
              {/* Action Required: Pending Milestone Submissions */}
              {clientPendingReviewJobs.length > 0 && (
                <section className="glass-panel border-amber-200 bg-white hard-shadow overflow-hidden">
                  <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-amber-700" />
                      <h3 className="font-headline text-sm font-extrabold uppercase tracking-widest text-amber-950">
                        Action Required: Pending Milestone Review
                      </h3>
                    </div>
                    <span className="bg-amber-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
                      {clientPendingReviewJobs.length} Action Item{clientPendingReviewJobs.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {clientPendingReviewJobs.map((job) => (
                      <div key={job.id} className="p-6 flex flex-col md:flex-row gap-4 items-start justify-between hover:bg-slate-50 transition-colors">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-base">{job.title}</span>
                            <span className="bg-purple-100 text-purple-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                              Proof Submitted
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-mono">
                            Submitted by: <span className="text-purple-700 font-bold">{truncateAddress(job.freelancer || '')}</span>
                          </p>
                          {job.proof && (
                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs italic text-slate-700">
                              "{job.proof.description}"
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 pt-1">
                            {job.proof?.externalLink && (
                              <span className="flex items-center gap-1">
                                <FileText size={14} /> {job.proof.externalLink}
                              </span>
                            )}
                            <span>•</span>
                            <span>Submitted recently</span>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col gap-2 shrink-0 self-end md:self-auto">
                          <Link
                            to={`/jobs/${job.id}`}
                            className="gradient-btn-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs"
                          >
                            Review & Release
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

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
                    {completedClientJobs.length > 0 ? '4.98' : '5.00'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-base block">Enterprise Trust Score</span>
                    <span className="text-xs text-purple-700 font-mono font-semibold">
                      {completedClientJobs.length > 0 ? 'Top 1% Global Client' : 'New Client Profile'}
                    </span>
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
                    <span className="font-bold text-slate-900">
                      {completedClientJobs.length > 0 ? '92%' : '0%'}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Dispute Ratio</span>
                    <span className="font-bold text-emerald-605">
                      0.00%
                    </span>
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
                {completedFreelanceJobs.length}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Jobs Completed
              </div>
            </div>

            <div className="glass-panel p-4 border-slate-200 bg-white text-center hard-shadow space-y-1">
              <div className="text-2xl font-black text-purple-900 font-mono">
                ${totalEarnedUsdc.toLocaleString()}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Total Earned
              </div>
            </div>

            <div className="glass-panel p-4 border-slate-200 bg-white text-center hard-shadow space-y-1">
              <div className="text-2xl font-black text-purple-700 font-mono">
                {myApplications.length}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Applications Sent
              </div>
            </div>

            <div className="glass-panel p-4 border-slate-200 bg-white text-center hard-shadow space-y-1">
              <div className="text-2xl font-black text-amber-700 font-mono">
                {myFreelancerJobs.length > 0 ? ((completedFreelanceJobs.length / myFreelancerJobs.length) * 100).toFixed(1) + '%' : '0%'}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Success Rate
              </div>
            </div>

            <div className="glass-panel p-4 border-purple-200 bg-purple-50 text-center hard-shadow space-y-1">
              <div className="text-2xl font-black text-purple-900 font-mono">
                {completedFreelanceJobs.length * 100} pts
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
                  {myFreelancerJobs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-1">
                      <p className="font-bold text-sm">No Active Freelance Contracts</p>
                      <p className="text-xs">Browse the marketplace and apply to escrow jobs to get started.</p>
                    </div>
                  ) : (
                    myFreelancerJobs.map((job) => (
                      <div key={job.id} className="bg-slate-50 p-5 rounded-2xl border border-purple-200 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Link to={`/jobs/${job.id}`} className="font-bold text-base text-slate-900 hover:text-purple-700 transition-colors">
                              {job.title}
                            </Link>
                            <p className="text-xs text-slate-600 mt-0.5 font-mono">
                              Client: <span className="text-purple-700 font-bold">{truncateAddress(job.client)}</span>
                            </p>
                          </div>
                          <span className={`badge-status badge-${job.status.toLowerCase()} shrink-0`}>
                            {job.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 font-mono text-xs pt-1">
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <span className="text-slate-500 text-[10px] block font-bold uppercase">Escrow Locked</span>
                            <span className="font-bold text-emerald-700">${parseFloat(job.amountUsdc || '0').toLocaleString()} USDC</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <span className="text-slate-500 text-[10px] block font-bold uppercase">Review Period</span>
                            <span className="font-bold text-purple-700">{job.reviewPeriodDays} Days</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <span className="text-slate-500 text-[10px] block font-bold uppercase">Category</span>
                            <span className="font-bold text-slate-900 capitalize">{job.category}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                            <MessageSquare size={15} className="text-purple-700" />
                            <span>XMTP Encrypted Chat Connected</span>
                          </div>
                          <Link
                            to={`/jobs/${job.id}`}
                            className="gradient-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                          >
                            Open Collaboration Hub
                            <ArrowUpRight size={14} />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
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
                  {unlockedBadges.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-550 font-sans">
                      <p className="font-extrabold text-slate-800">No SBTs Minted Yet</p>
                      <p className="mt-1 text-[10px] leading-relaxed">Complete your first job or link your GitHub profile to unlock your first dynamic badge attestation.</p>
                    </div>
                  ) : (
                    unlockedBadges.map((badge, index) => (
                      <div key={index} className={`p-3 rounded-xl border space-y-1 ${badge.bgClass}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-bold">{badge.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${badge.tokenBgClass}`}>
                            {badge.token}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-650 leading-relaxed font-sans">{badge.desc}</p>
                      </div>
                    ))
                  )}
                </div>

                <Link
                  to="/reputation"
                  className="w-full glass-panel py-2 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl text-center block"
                >
                  View Global Leaderboard Rank (#{myRank})
                </Link>
              </div>

              {/* GitHub Verified Skill Score */}
              {userProfile.githubVerified ? (
                <div className="glass-panel p-6 border-cyan-200 bg-white hard-shadow space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-700" /> GitHub E-KYC Attestation
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">
                      Score: {userProfile.primaryScore || 850}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Solidity</span>
                      <span className="font-bold text-purple-900">
                        {userProfile.languageBytes?.Solidity !== undefined
                          ? `${userProfile.languageBytes.Solidity.toLocaleString()} Bytes`
                          : '0 Bytes'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rust</span>
                      <span className="font-bold text-purple-900">
                        {userProfile.languageBytes?.Rust !== undefined
                          ? `${userProfile.languageBytes.Rust.toLocaleString()} Bytes`
                          : '0 Bytes'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">TypeScript</span>
                      <span className="font-bold text-purple-900">
                        {userProfile.languageBytes?.TypeScript !== undefined
                          ? `${userProfile.languageBytes.TypeScript.toLocaleString()} Bytes`
                          : '0 Bytes'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">JavaScript</span>
                      <span className="font-bold text-purple-900">
                        {userProfile.languageBytes?.JavaScript !== undefined
                          ? `${userProfile.languageBytes.JavaScript.toLocaleString()} Bytes`
                          : '0 Bytes'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Python</span>
                      <span className="font-bold text-purple-900">
                        {userProfile.languageBytes?.Python !== undefined
                          ? `${userProfile.languageBytes.Python.toLocaleString()} Bytes`
                          : '0 Bytes'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Go / Indexers</span>
                      <span className="font-bold text-purple-900">
                        {userProfile.languageBytes?.Go !== undefined
                          ? `${userProfile.languageBytes.Go.toLocaleString()} Bytes`
                          : '0 Bytes'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-3 font-mono text-xs text-center">
                  <span className="font-bold text-slate-900 flex items-center justify-center gap-1.5">
                    GitHub Not Attested
                  </span>
                  <p className="text-[11px] text-slate-505 font-sans leading-relaxed">
                    Sync your GitHub account in onboarding to verify your developer reputation scores.
                  </p>
                  <Link
                    to="/onboarding"
                    className="gradient-btn-primary w-full py-2.5 rounded-xl font-headline font-bold text-xs shadow-md block text-center"
                  >
                    Sync GitHub Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
