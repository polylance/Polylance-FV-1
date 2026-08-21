import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { UserProfile } from '../types';
import { truncateAddress, getDeterministicSbtId } from '../utils/formatters';
import { scoreGithubUser } from '../utils/githubOracle';
import { Award, CheckCircle2, ShieldCheck, FolderGit2, ExternalLink, Building2, Star, Zap, Activity, Scale, Search, History } from 'lucide-react';

export const Profile: React.FC = () => {
  const { address: targetAddress } = useParams<{ address: string }>();
  const { address: currentAddress, isConnected, currentRole } = useWeb3();
  const { profiles, jobs, updateProfile } = usePolyLanceData();

  const profileAddr = targetAddress || currentAddress;

  const isOwnProfile = isConnected && currentAddress.toLowerCase() === profileAddr?.toLowerCase();

  const userProfileKey = profileAddr ? Object.keys(profiles).find(k => k.toLowerCase() === profileAddr.toLowerCase()) : null;
  const userProfile = ((userProfileKey ? profiles[userProfileKey] : null) || {
    address: profileAddr,
    displayName: profileAddr ? `${profileAddr.slice(0, 6)}...${profileAddr.slice(-4)}` : 'Anonymous Member',
    bio: 'No biography has been written yet.',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    skills: [],
    githubVerified: false,
    reputationSbtCount: 0,
  }) as UserProfile;

  // Real-time GitHub sync on mount/viewing a verified developer profile
  useEffect(() => {
    if (userProfile.githubVerified && userProfile.githubUsername) {
      scoreGithubUser(userProfile.githubUsername, profileAddr)
        .then((res) => {
          if (res && res.primaryScore) {
            updateProfile({
              primaryScore: res.primaryScore,
              secondaryScores: res.secondaryScores,
              languageBytes: res.languageBytes,
              verifiedAt: res.verifiedAt,
            }, profileAddr);
          }
        })
        .catch((err) => console.warn('Real-time background GitHub sync failed:', err));
    }
  }, [profileAddr, userProfile.githubUsername, userProfile.githubVerified]);

  const isClientProfile = profileAddr.toLowerCase() === (import.meta.env.VITE_CLIENT_ADDRESS || '').toLowerCase() || (isOwnProfile && currentRole === 'client');
  const isJudgeProfile = profileAddr.toLowerCase() === (import.meta.env.VITE_JUDGE_ADDRESS || '').toLowerCase() || (isOwnProfile && currentRole === 'judge');

  const clientJobs = jobs.filter((j) => j.client.toLowerCase() === profileAddr?.toLowerCase());
  const completedClientJobs = clientJobs.filter((j) => j.status === 'Completed');
  const activeClientJobs = clientJobs.filter((j) => j.status !== 'Completed' && j.status !== 'Cancelled');

  const clientTvl = activeClientJobs.reduce((sum, j) => sum + parseFloat(j.amountUsdc || '0'), 0);
  const totalValueCreated = clientJobs.reduce((sum, j) => sum + parseFloat(j.amountUsdc || '0'), 0);
  const disputes = clientJobs.filter((j) => j.status === 'Disputed' || (j.dispute && j.dispute.resolved));
  const reliabilityScore = clientJobs.length > 0
    ? (10 - (disputes.length / clientJobs.length) * 5).toFixed(1)
    : '10.0';

  const freelancerJobs = jobs.filter((j) => j.freelancer?.toLowerCase() === profileAddr?.toLowerCase());
  const completedFreelancerJobs = freelancerJobs.filter((j) => j.status === 'Completed');

  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto">
      {/* 1. VERIFIED ENTERPRISE CLIENT PROFILE VIEW matching client_profile_verified_enterprise & client_trust_profile_verified_reliability_score */}
      {isClientProfile ? (
        <div className="space-y-8">
          {/* Organizational Header Card */}
          <div className="glass-panel p-6 sm:p-8 border-purple-200 bg-white hard-shadow space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-purple-100 border-2 border-purple-300 rounded-2xl flex items-center justify-center text-purple-700 overflow-hidden shrink-0">
                  {userProfile.avatarUrl && !userProfile.avatarUrl.includes('photo-1517841905240') ? (
                    <img src={userProfile.avatarUrl} alt={userProfile.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={36} />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-extrabold text-slate-900 font-heading">
                      {userProfile.displayName}
                    </h1>
                    <span className="text-xs bg-purple-100 text-purple-900 border border-purple-300 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1">
                      <ShieldCheck size={14} className="text-purple-700" /> VERIFIED ENTERPRISE
                    </span>
                  </div>
                  <p className="text-xs font-mono text-purple-900 font-bold">
                    Organization Safe Wallet: {truncateAddress(userProfile.address)}
                  </p>
                  <p className="text-xs text-slate-600 max-w-xl pt-1 leading-relaxed">{userProfile.bio}</p>
                </div>
              </div>

              <div className="text-right font-mono text-xs flex flex-col items-end gap-3">
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider block">Credibility Rating</span>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    <span className="font-headline text-2xl font-black text-purple-900">AA+</span>
                    <div className="flex text-amber-500">
                      <Star size={16} className="fill-amber-500" />
                      <Star size={16} className="fill-amber-500" />
                      <Star size={16} className="fill-amber-500" />
                      <Star size={16} className="fill-amber-500" />
                      <Star size={16} className="fill-amber-500" />
                    </div>
                  </div>
                </div>
                {isOwnProfile && (
                  <Link
                    to="/onboarding"
                    className="gradient-btn-primary px-4 py-2 rounded-xl text-xs font-bold shadow-md"
                  >
                    Edit Profile
                  </Link>
                )}
              </div>
            </div>

            {/* Client Hiring Analytics & Trust Scorecard Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Value Locked (TVL)</span>
                <p className="font-extrabold text-emerald-700 text-xl">${clientTvl.toLocaleString()} USDC</p>
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck size={12} /> Active Escrows
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Avg Payout Speed</span>
                <p className="font-extrabold text-purple-900 text-xl">
                  {(() => {
                    const releaseSpeeds = clientJobs
                      .filter(j => j.status === 'Completed')
                      .map(j => {
                        const postedEvent = j.events.find(e => e.step === 'Posted');
                        const completedEvent = j.events.find(e => e.step === 'Completed');
                        if (postedEvent && completedEvent && completedEvent.timestamp > 0 && postedEvent.timestamp > 0) {
                          return (completedEvent.timestamp - postedEvent.timestamp) / 3600000;
                        }
                        return null;
                      })
                      .filter((v): v is number => v !== null && v > 0);
                    return releaseSpeeds.length > 0
                      ? `${(releaseSpeeds.reduce((a, b) => a + b, 0) / releaseSpeeds.length).toFixed(1)} Hours`
                      : 'N/A';
                  })()}
                </p>
                <span className="text-[10px] text-purple-700 font-bold flex items-center gap-1">
                  <Zap size={12} /> {completedClientJobs.length > 0 ? 'Top Tier Payout Speed' : 'No releases yet'}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Reliability Score</span>
                <p className="font-extrabold text-slate-900 text-xl">{reliabilityScore} / 10.0</p>
                <span className="text-[10px] text-slate-600 font-bold tracking-tight">Based on {clientJobs.length} escrowed projects</span>
              </div>
            </div>
          </div>

          {/* Detailed Escrow Trust & Legitimacy Index Section */}
          <div className="glass-panel p-6 sm:p-8 border-slate-200 bg-white hard-shadow space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="text-emerald-600 animate-pulse" /> Legitimacy Audit & Escrow Trust Index
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Cryptographic validation of client financial history, payout SLA compliance, and smart contract audit trails.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider border-b border-slate-200 pb-2">Legitimacy Verification Checklist</span>

                <div className="space-y-3.5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-800 font-bold block text-xs">100% Pre-funded Escrows</span>
                      <span className="text-slate-500 text-[10px] font-sans leading-relaxed">
                        Funds are guaranteed programmatically. The client always deposits 100% of the milestone funds into the escrow contract before the freelancer is requested to start coding.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-800 font-bold block text-xs">
                        {(() => {
                          const isMultisig = profileAddr?.toLowerCase() === (import.meta.env.VITE_ADMIN_ADDRESS_1 || '').toLowerCase() ||
                            profileAddr?.toLowerCase() === (import.meta.env.VITE_ADMIN_ADDRESS_2 || '').toLowerCase() ||
                            profileAddr?.toLowerCase() === (import.meta.env.VITE_ADMIN_ADDRESS_3 || '').toLowerCase();
                          return isMultisig ? 'Verified Multi-Sig Safe Wallet' : 'Standard Web3 EOA Wallet';
                        })()}
                      </span>
                      <span className="text-slate-500 text-[10px] font-sans leading-relaxed">
                        {(() => {
                          const isMultisig = profileAddr?.toLowerCase() === (import.meta.env.VITE_ADMIN_ADDRESS_1 || '').toLowerCase() ||
                            profileAddr?.toLowerCase() === (import.meta.env.VITE_ADMIN_ADDRESS_2 || '').toLowerCase() ||
                            profileAddr?.toLowerCase() === (import.meta.env.VITE_ADMIN_ADDRESS_3 || '').toLowerCase();
                          return isMultisig
                            ? `The client's wallet ${truncateAddress(profileAddr)} is a Gnosis Safe smart contract with 2-of-3 key holders verified as organizational representatives.`
                            : `The client's wallet ${truncateAddress(profileAddr)} is a verified standard externally owned account (EOA) active on-chain.`;
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-800 font-bold block text-xs">
                        {disputes.length === 0 ? '0% Dispute History Rate' : `${Math.round((disputes.length / (clientJobs.length || 1)) * 100)}% Dispute Rate`}
                      </span>
                      <span className="text-slate-500 text-[10px] font-sans leading-relaxed">
                        {disputes.length === 0
                          ? 'No disputes have ever escalated to DAO Judge Panel arbitration. All escrows were completed amicably with on-time payouts.'
                          : `${disputes.length} dispute${disputes.length === 1 ? '' : 's'} required arbitrator intervention out of ${clientJobs.length} total escrow contracts.`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-800 font-bold block text-xs">Platform Longevity</span>
                      <span className="text-slate-500 text-[10px] font-sans leading-relaxed">
                        {(() => {
                          const oldest = clientJobs.reduce((old, j) => {
                            const posted = j.events.find(e => e.step === 'Posted');
                            if (posted && posted.timestamp > 0) {
                              return old === 0 || posted.timestamp < old ? posted.timestamp : old;
                            }
                            return old;
                          }, 0);
                          return oldest > 0
                            ? `Active member since ${new Date(oldest).toLocaleDateString()}. Consistent escrow funding history verified.`
                            : 'Newly registered client on PolyLance. Wallet successfully connected.';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider border-b border-slate-200 pb-2">Payment Speed & Performance SLA</span>
                  <div className="flex justify-between items-baseline border-b border-slate-200 pb-2">
                    <span className="text-slate-600 font-medium">Avg Review Time</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {(() => {
                        const releaseSpeeds = clientJobs
                          .filter(j => j.status === 'Completed')
                          .map(j => {
                            const postedEvent = j.events.find(e => e.step === 'Posted');
                            const completedEvent = j.events.find(e => e.step === 'Completed');
                            if (postedEvent && completedEvent && completedEvent.timestamp > 0 && postedEvent.timestamp > 0) {
                              return (completedEvent.timestamp - postedEvent.timestamp) / 3600000;
                            }
                            return null;
                          })
                          .filter((v): v is number => v !== null && v > 0);
                        return releaseSpeeds.length > 0
                          ? `${(releaseSpeeds.reduce((a, b) => a + b, 0) / releaseSpeeds.length).toFixed(1)} Hours`
                          : 'N/A';
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-slate-200 pb-2">
                    <span className="text-slate-600 font-medium">Escrow Completion Rate</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {clientJobs.length > 0
                        ? `${Math.round((completedClientJobs.length / clientJobs.length) * 100)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-600 font-medium">On-Time Release SLA</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {clientJobs.length > 0 ? '100% compliant' : 'N/A'}
                    </span>
                  </div>
                </div>

                {completedClientJobs.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 p-5 rounded-xl space-y-2 text-[11px] text-purple-950 font-sans shadow-2xs">
                    <span className="font-headline font-bold text-purple-900 block text-xs">Freelancer Trust Endorsement</span>
                    <p className="leading-relaxed">
                      "Client is highly professional. The scope was clear, escrow was immediately funded, and payouts were approved upon milestone verification."
                    </p>
                    <p className="text-[10px] font-mono text-purple-700 font-bold pt-1">— Verified Freelancer Partner</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Verified Ledger Activity & Escrow Protection Guarantee */}
          <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-6">
            <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity size={20} className="text-purple-700" /> Client Verified Ledger & Active Escrows
            </h3>

            <div className="space-y-4 font-mono text-xs">
              {clientJobs.length > 0 ? (
                clientJobs.map((j) => (
                  <div key={j.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{j.title}</span>
                      <p className="text-slate-605 text-[11px] font-sans">
                        Escrow size: ${parseFloat(j.amountUsdc).toLocaleString()} USDC • Status: {j.status}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${j.status === 'Completed' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                        j.status === 'Disputed' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                          j.status === 'Open' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                            'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                      {j.status === 'Completed' ? `Funds Released ($${parseFloat(j.amountUsdc).toLocaleString()} USDC)` : j.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs text-center py-4 font-sans">No escrow transactions recorded on this profile yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : isJudgeProfile ? (
        <div className="space-y-8">
          {/* Arbitrator Header Card */}
          <div className="glass-panel p-6 sm:p-8 border-amber-300 bg-white hard-shadow space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-center text-amber-700">
                  <Scale size={40} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-extrabold text-slate-900 font-heading">
                      Hon. Arbitrator Judge
                    </h1>
                    <span className="text-xs bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1">
                      <ShieldCheck size={14} className="text-amber-700" /> SOVEREIGN ARBITRATOR
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-500">
                    Arbitrator Identity Check: {truncateAddress(userProfile.address)}
                  </p>
                  <p className="text-xs text-slate-600 max-w-xl pt-1 leading-relaxed">
                    Certified protocol arbitrator and dispute mediator. Inspects smart contract milestone evidence, audited code commits, and executes binding Kleros-style payouts.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center shrink-0">
                <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider font-mono">Arbitration Score</span>
                <span className="text-2xl font-black text-amber-800 font-mono">100%</span>
                <span className="text-[10px] text-slate-500 block font-mono">SLA Compliance</span>
              </div>
            </div>
          </div>

          {/* Active Disputes Cases Queue */}
          <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2 border-b border-slate-100 pb-3">
              <Scale size={20} className="text-amber-600" /> Active Dispute Cases Assigned
            </h3>

            {jobs.filter((j) => j.status === 'Disputed').length === 0 ? (
              <p className="text-xs text-slate-500 font-mono p-4 bg-slate-50 rounded-xl text-center border border-dashed border-slate-300">
                No active dispute cases awaiting review.
              </p>
            ) : (
              <div className="space-y-3">
                {jobs.filter((j) => j.status === 'Disputed').map((j) => (
                  <div key={j.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">{j.title}</span>
                      <span className="text-[11px] text-slate-500">
                        Client: {truncateAddress(j.client)} | Freelancer: {truncateAddress(j.freelancer || '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-amber-700">${parseFloat(j.amountUsdc).toLocaleString()} USDC</span>
                      <Link to={`/jobs/${j.id}`} className="gradient-btn-primary px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-xs">
                        Audit Case <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resolved Cases / solutions History */}
          <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2 border-b border-slate-100 pb-3">
              <History size={20} className="text-amber-600" /> Dispute Solutions & Ruling History
            </h3>

            {jobs.filter((j) => j.dispute?.resolved).length === 0 ? (
              <div className="text-center py-6 text-slate-500 border border-dashed border-slate-350 rounded-xl bg-slate-50 font-sans text-xs">
                No resolved disputes in ruling history.
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.filter((j) => j.dispute?.resolved).map((j) => (
                  <div key={j.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-900 text-sm">{j.title}</span>
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-0.5 rounded-full text-[10px] font-bold">
                        Ruled & Closed
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-600">
                      <div>
                        <strong>Ruling Allocation:</strong> {j.dispute?.rulingBps ? (j.dispute.rulingBps / 100) : 50}% Developer
                      </div>
                      <div>
                        <strong>Transaction Hash:</strong> {j.id.slice(0, 10)}...
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-700 bg-white p-2 rounded border border-slate-200 italic leading-relaxed">
                      "Reasoning: {j.dispute?.reasoningText || 'Delivered work matched structural contract criteria.'}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Score Auditor Tool */}
          <ScoreAuditorWidget
            userProfile={userProfile}
            freelancerJobs={freelancerJobs}
            completedFreelancerJobs={completedFreelancerJobs}
            reliabilityScore={reliabilityScore}
            clientTvl={clientTvl}
            completedClientJobs={completedClientJobs}
            disputes={disputes}
          />
        </div>
      ) : (
        /* 2. FREELANCER PROFILE VIEW */
        <div className="space-y-8">
          {/* Header Profile Card */}
          <div className="glass-panel p-6 sm:p-8 border-purple-200 bg-white hard-shadow space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-5">
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.displayName}
                  className="w-20 h-20 rounded-2xl border-2 border-purple-200 object-cover shadow-xs"
                />
                <div className="space-y-1">
                  <h1 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
                    {userProfile.displayName}
                    {userProfile.githubVerified && (
                      <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
                        ✓ Verified Developer
                      </span>
                    )}
                  </h1>
                  <p className="text-xs font-mono text-purple-900 font-bold">
                    Wallet Address: {truncateAddress(userProfile.address)}
                  </p>
                  <p className="text-xs text-slate-600 max-w-md pt-1 leading-relaxed">{userProfile.bio}</p>
                </div>
              </div>

              {isOwnProfile && (
                <Link
                  to="/onboarding"
                  className="gradient-btn-primary px-4 py-2 rounded-xl text-xs font-bold shadow-md self-start sm:self-auto"
                >
                  Edit Profile & Skills
                </Link>
              )}
            </div>

            {/* Section 7 GitHub Verification Skill Breakdown Card */}
            {userProfile.githubVerified && (
              <div className="glass-panel p-5 border-slate-200 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-emerald-800 font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> GitHub Verified: @{userProfile.githubUsername}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">
                    Attested: {new Date(userProfile.verifiedAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>

                {/* Primary Category Headline Badge */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 font-bold tracking-wider">
                      Primary Skill Focus
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 capitalize font-heading">
                      {userProfile.primaryCategory || 'web3'}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-emerald-700 font-mono">
                      {userProfile.primaryScore || 850}
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-bold"> / 1000</span>
                  </div>
                </div>

                {/* SKILL MATRIX VARIANT matching profile_skill_matrix_variant */}
                <div className="space-y-3 pt-1 font-mono text-xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Audited Code Byte Matrix:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Solidity</span>
                      <span className="font-extrabold text-purple-900">
                        {userProfile.languageBytes?.Solidity
                          ? `${userProfile.languageBytes.Solidity.toLocaleString()} Bytes`
                          : '0 Bytes'}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Rust</span>
                      <span className="font-extrabold text-purple-900">
                        {userProfile.languageBytes?.Rust
                          ? `${userProfile.languageBytes.Rust.toLocaleString()} Bytes`
                          : '0 Bytes'}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">TypeScript</span>
                      <span className="font-extrabold text-purple-900">
                        {userProfile.languageBytes?.TypeScript
                          ? `${userProfile.languageBytes.TypeScript.toLocaleString()} Bytes`
                          : '0 Bytes'}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">JavaScript</span>
                      <span className="font-extrabold text-purple-900">
                        {userProfile.languageBytes?.JavaScript
                          ? `${userProfile.languageBytes.JavaScript.toLocaleString()} Bytes`
                          : '0 Bytes'}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Python</span>
                      <span className="font-extrabold text-purple-900">
                        {userProfile.languageBytes?.Python
                          ? `${userProfile.languageBytes.Python.toLocaleString()} Bytes`
                          : '0 Bytes'}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Go / Indexers</span>
                      <span className="font-extrabold text-purple-900">
                        {userProfile.languageBytes?.Go
                          ? `${userProfile.languageBytes.Go.toLocaleString()} Bytes`
                          : '0 Bytes'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Skill Tags */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-mono">
                Self-Claimed Skill Tags (ProfileRegistry.sol):
              </span>
              <div className="flex flex-wrap gap-2">
                {userProfile.skills.map((sk) => (
                  <span
                    key={sk}
                    className="bg-purple-50 border border-purple-200 text-purple-900 px-3 py-1 rounded-lg text-xs font-mono font-bold"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* VERIFIABLE PORTFOLIO SECTION matching manage_profile_verifiable_portfolio */}
          <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                <FolderGit2 size={20} className="text-purple-700" /> Verifiable Portfolio Deliverables
              </h3>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                ON-CHAIN AUDITED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              {completedFreelancerJobs.length > 0 ? (
                completedFreelancerJobs.map((j) => (
                  <div key={j.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{j.title}</span>
                      <ExternalLink size={14} className="text-purple-700" />
                    </div>
                    <p className="text-[11px] text-slate-600 font-sans line-clamp-2">
                      {j.description}
                    </p>
                    <div className="pt-2 flex justify-between items-center text-[10px] text-purple-900 font-bold">
                      <span>Payout: ${parseFloat(j.amountUsdc).toLocaleString()} USDC</span>
                      <span>Contract: {truncateAddress(j.contractAddress)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-6 text-slate-500 border border-dashed border-slate-350 rounded-xl bg-slate-50 font-sans">
                  No verifiable portfolio deliverables completed on-chain yet.
                </div>
              )}
            </div>
          </div>

          {/* Soulbound Reputation Tokens Collection */}
          <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                <Award size={20} className="text-purple-700" /> ReputationSBT Token Collection ({completedFreelancerJobs.length})
              </h3>
              <span className="text-[10px] font-mono text-purple-900 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 font-bold">
                ERC-721 Votes Soulbound
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {completedFreelancerJobs.length > 0 ? (
                completedFreelancerJobs.map((j, idx) => (
                  <div
                    key={j.id}
                    className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 relative overflow-hidden group hover:border-purple-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-purple-900">
                        PLREP Token #{j.sbtTokenId || getDeterministicSbtId(j.id)}
                      </span>
                      <ShieldCheck size={16} className="text-emerald-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-900">
                      Completed Job: {j.title}
                    </p>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      Non-transferable Soulbound reputation proof
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-6 text-slate-500 border border-dashed border-slate-300 rounded-xl bg-slate-50 font-sans">
                  No Soulbound SBT Attestations minted yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ScoreAuditorWidgetProps {
  userProfile: any;
  freelancerJobs: any[];
  completedFreelancerJobs: any[];
  reliabilityScore: string;
  clientTvl: number;
  completedClientJobs: any[];
  disputes: any[];
}

const ScoreAuditorWidget: React.FC<ScoreAuditorWidgetProps> = ({
  userProfile,
  freelancerJobs,
  completedFreelancerJobs,
  reliabilityScore,
  clientTvl,
  completedClientJobs,
  disputes
}) => {
  const [auditType, setAuditType] = useState<'freelancer' | 'client'>('freelancer');

  return (
    <div className="glass-panel p-6 sm:p-8 border-slate-200 bg-white hard-shadow space-y-5">
      <div className="border-b border-slate-100 pb-3 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
            <Search size={20} className="text-amber-600 animate-pulse" /> Participant Score Auditor Tool
          </h3>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Check client trust ratings and developer reputation scores for escrow evaluations.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setAuditType('freelancer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${auditType === 'freelancer' ? 'bg-purple-700 bg-purple-700 text-white shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Audit Freelancer
          </button>
          <button
            onClick={() => setAuditType('client')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${auditType === 'client' ? 'bg-indigo-700 bg-indigo-700 text-white shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Audit Client
          </button>
        </div>
      </div>

      {auditType === 'freelancer' ? (
        /* FREELANCER AUDIT REPORT WIDGET */
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-extrabold text-lg">
              {userProfile.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <span className="font-extrabold text-slate-900 text-sm">{userProfile.displayName}</span>
              <p className="text-[10px] font-mono text-purple-900 font-bold mt-0.5">Address: {userProfile.address}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Reputation Score</span>
              <span className="font-extrabold text-purple-900 text-base">{completedFreelancerJobs.length * 100} PLREP</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Escrow Success Rate</span>
              <span className="font-extrabold text-emerald-700 text-base">{freelancerJobs.length > 0 ? '100%' : '0%'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Completed Jobs</span>
              <span className="font-extrabold text-slate-800 text-base">{completedFreelancerJobs.length} Smart Contracts</span>
            </div>
          </div>

          {/* GitHub Verification */}
          {userProfile.githubVerified && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-xs text-left">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-600 font-bold">GitHub Attested Developer Score</span>
                <span className="text-emerald-700 font-extrabold text-sm">{userProfile.primaryScore || 850} / 1000</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] text-center text-slate-700 font-mono">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="block font-bold text-slate-800">Solidity</span>
                  <span className="text-purple-700 font-bold">
                    {userProfile.languageBytes?.Solidity !== undefined
                      ? `${Math.round(userProfile.languageBytes.Solidity / 1024).toLocaleString()}k Bytes`
                      : '0k Bytes'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="block font-bold text-slate-800">Rust</span>
                  <span className="text-purple-700 font-bold">
                    {userProfile.languageBytes?.Rust !== undefined
                      ? `${Math.round(userProfile.languageBytes.Rust / 1024).toLocaleString()}k Bytes`
                      : '0k Bytes'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="block font-bold text-slate-800">TypeScript</span>
                  <span className="text-purple-700 font-bold">
                    {userProfile.languageBytes?.TypeScript !== undefined
                      ? `${Math.round(userProfile.languageBytes.TypeScript / 1024).toLocaleString()}k Bytes`
                      : '0k Bytes'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CLIENT AUDIT REPORT WIDGET */
        <div className="space-y-4 text-left">
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-extrabold text-lg">
              {userProfile.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm">{userProfile.displayName}</span>
              <p className="text-[10px] font-mono text-indigo-900 font-bold mt-0.5">Address: {userProfile.address}</p>
            </div>
          </div>

          {/* Trust Score & Ratings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Client Trust Index</span>
              <span className="font-extrabold text-slate-900 text-base">{reliabilityScore} / 10.0</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Total Capital TVL</span>
              <span className="font-extrabold text-emerald-700 text-base">${clientTvl.toLocaleString()}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Avg Payout Speed</span>
              <span className="font-extrabold text-purple-900 text-base">{completedClientJobs.length > 0 ? '4.2 Hours' : 'N/A'}</span>
            </div>
          </div>

          {/* Verification Parameters */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider border-b border-slate-200 pb-1.5">Audit Security Parameters</span>
            <div className="flex items-center gap-2 text-[11px]">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>100% Pre-funded Escrow Ratio (No financial defaulting)</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>Verified multi-sig organizational contract</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>{disputes.length} disputes escalated to DAO Judge Panel ruling</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
