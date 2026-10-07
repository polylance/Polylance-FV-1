import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { UserProfile } from '../types';
import { truncateAddress, getDeterministicSbtId, getCanonicalCertificateId, getCertifiedPassVerifyUrl } from '../utils/formatters';
import { scoreGithubUser, getUserBytecodeMatrix } from '../utils/githubOracle';
import { Award, CheckCircle2, ShieldCheck, FolderGit2, ExternalLink, Building2, Star, Zap, Activity, Scale, Search, History, Copy, CheckCheck } from 'lucide-react';
import { GithubEkycCard } from '../components/GithubEkycCard';
import { scrollToSection, extractTargetSection } from '../utils/scroll';

export const Profile: React.FC = () => {
  const { address: targetAddress } = useParams<{ address: string }>();
  const { address: currentAddress, isConnected, connectWallet, currentRole } = useWeb3();
  const { profiles, jobs, updateProfile } = usePolyLanceData();

  const profileAddr = targetAddress || currentAddress;

  const isOwnProfile = isConnected && currentAddress.toLowerCase() === profileAddr?.toLowerCase();

  const userProfileKey = profileAddr ? Object.keys(profiles).find(k => k.toLowerCase() === profileAddr.toLowerCase()) : null;
  const userProfile = ((userProfileKey ? profiles[userProfileKey] : null) || {
    address: profileAddr,
    displayName: profileAddr ? `${profileAddr.slice(0, 6)}...${profileAddr.slice(-4)}` : 'Anonymous Member',
    bio: 'No biography has been written yet.',
    avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${profileAddr || 'polylance'}`,
    skills: [],
    githubVerified: false,
    reputationSbtCount: 0,
  }) as UserProfile;

  const location = useLocation();

  useEffect(() => {
    const targetSection = extractTargetSection(location.search, location.hash, location.state);
    if (targetSection) {
      scrollToSection(targetSection, 250);
    }
  }, [location.search, location.hash, location.state]);

  // Real-time GitHub sync on mount/viewing a verified developer profile
  useEffect(() => {
    if (userProfile.githubVerified && userProfile.githubUsername) {
      if (userProfile.primaryScore && userProfile.primaryScore > 0) {
        return;
      }
      scoreGithubUser(userProfile.githubUsername, profileAddr)
        .then((res) => {
          if (res && typeof res.primaryScore === 'number') {
            updateProfile({
              primaryScore: res.primaryScore,
              secondaryScores: res.secondaryScores,
              languageBytes: res.languageBytes || {},
              verifiedAt: res.verifiedAt,
            }, profileAddr);
          }
        })
        .catch((err) => console.warn('Real-time background GitHub sync failed:', err));
    }
  }, [profileAddr, userProfile.githubUsername, userProfile.githubVerified, userProfile.primaryScore]);

  const isClientProfile = profileAddr.toLowerCase() === (import.meta.env.VITE_CLIENT_ADDRESS || '').toLowerCase() || (isOwnProfile && currentRole === 'client');
  const isJudgeProfile = Boolean(isOwnProfile && currentRole === 'judge');

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

  const devVolumeHandled = completedFreelancerJobs.reduce((sum, j) => {
    const earnedFraction = j.dispute?.resolved ? ((j.dispute.rulingBps ?? 0) / 10000) : 1.0;
    return sum + (parseFloat(j.amountUsdc || '0') * earnedFraction);
  }, 0);

  const bytecodeMatrix = getUserBytecodeMatrix(userProfile, completedFreelancerJobs.length, devVolumeHandled);

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white rounded-2xl border border-[#E2E6EC] shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-xl bg-blue-50 text-[#0047AB] mx-auto flex items-center justify-center border border-blue-100">
          <ShieldCheck size={32} className="text-[#0047AB]" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            POLYLANCE SECURITY GATEWAY • NON-MEMBER ACCESS RESTRICTED
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#0B0B0C]">
            Connect Wallet to View Profile
          </h2>
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            Verified developer ratings, soulbound reputation passes, confidential contract volumes, and GitHub audit metrics are strictly restricted to authenticated Polylancers. Please connect your Web3 wallet to inspect member credentials.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={connectWallet}
            className="w-full py-3 px-4 rounded-lg bg-[#0047AB] hover:bg-[#003A8C] text-white font-mono font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap size={15} />
            <span>Connect Polylancer Wallet</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6 w-full">
      {/* 1. VERIFIED ENTERPRISE CLIENT PROFILE VIEW matching client_profile_verified_enterprise & client_trust_profile_verified_reliability_score */}
      {isClientProfile ? (
        <div className="space-y-8">
          {/* Organizational Header Card */}
          <div id="reputation-overview" className="border border-[#E2E6EC] bg-white rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-[#0047AB] overflow-hidden shrink-0">
                  {userProfile.avatarUrl && !userProfile.avatarUrl.includes('photo-1517841905240') ? (
                    <img src={userProfile.avatarUrl} alt={userProfile.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={36} />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-serif font-bold text-[#0B0B0C]">
                      {userProfile.displayName}
                    </h1>
                    <span className="text-xs bg-blue-50 text-[#0047AB] border border-blue-200 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1">
                      <ShieldCheck size={14} className="text-[#0047AB]" /> VERIFIED ENTERPRISE
                    </span>
                    {completedClientJobs.length > 0 && (
                      <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full font-mono font-bold flex items-center gap-1">
                        <Award size={14} className="text-emerald-700" /> {completedClientJobs.length} Patron SBT{completedClientJobs.length === 1 ? '' : 's'} Minted
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-slate-600 font-bold">
                    Organization Safe Wallet: {truncateAddress(userProfile.address)}
                  </p>
                  <p className="text-xs text-slate-600 max-w-xl pt-1 leading-relaxed">{userProfile.bio}</p>
                </div>
              </div>

              <div className="text-right font-mono text-xs flex flex-col items-end gap-3">
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider block">Credibility Rating</span>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    <span className="font-serif text-2xl font-black text-[#0B0B0C]">AA+</span>
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
                    className="bg-[#0047AB] hover:bg-[#003A8C] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors"
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
                <p className="font-extrabold text-[#0B0B0C] text-xl">
                  {(() => {
                    const releaseSpeeds = clientJobs
                      .filter(j => j.status === 'Completed')
                      .map(j => {
                        const postedEvent = (j.events || []).find(e => e.step === 'Posted');
                        const completedEvent = (j.events || []).find(e => e.step === 'Completed');
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
                <span className="text-[10px] text-[#0047AB] font-bold flex items-center gap-1">
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
                            const posted = (j.events || []).find(e => e.step === 'Posted');
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
                            const postedEvent = (j.events || []).find(e => e.step === 'Posted');
                            const completedEvent = (j.events || []).find(e => e.step === 'Completed');
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
                  <div className="bg-slate-50 border border-[#E2E6EC] p-5 rounded-xl space-y-2 text-[11px] text-slate-800 font-sans shadow-2xs">
                    <span className="font-serif font-bold text-[#0B0B0C] block text-xs">Freelancer Trust Endorsement</span>
                    <p className="leading-relaxed">
                      "Client is highly professional. The scope was clear, escrow was immediately funded, and payouts were approved upon milestone verification."
                    </p>
                    <p className="text-[10px] font-mono text-[#0047AB] font-bold pt-1">— Verified Freelancer Partner</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Verified Ledger Activity & Escrow Protection Guarantee */}
          <div className="border border-[#E2E6EC] bg-white rounded-2xl shadow-xs p-6 space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#0B0B0C] flex items-center gap-2">
              <Activity size={20} className="text-[#0047AB]" /> Client Verified Ledger & Active Escrows
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

          {/* Soulbound Escrow Patron Tokens Collection */}
          <div className="border border-[#E2E6EC] bg-white rounded-2xl shadow-xs p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#0B0B0C] flex items-center gap-2">
                  <Award size={20} className="text-[#0047AB]" /> Soulbound Escrow Patron Tokens ({completedClientJobs.length})
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Cryptographically minted, non-transferable on-chain proof of capital funding and payout release
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#0047AB] bg-blue-50 px-3 py-1 rounded-full border border-blue-200 font-bold flex items-center gap-1">
                <ShieldCheck size={12} className="text-[#0047AB]" /> Polygon ERC-721 Soulbound
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {completedClientJobs.length > 0 ? (
                completedClientJobs.map((j) => {
                  const certId = getCanonicalCertificateId(j.id, j.contractAddress);
                  const verifyUrl = getCertifiedPassVerifyUrl(certId);

                  return (
                    <div
                      key={j.id}
                      className="bg-slate-50 p-5 rounded-xl border border-[#E2E6EC] space-y-3 relative overflow-hidden group hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#0047AB] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                          PATRON SBT #{j.sbtTokenId || getDeterministicSbtId(j.id)}
                        </span>
                        <span className="text-xs font-mono font-black text-emerald-700">
                          ${parseFloat(j.amountUsdc || '0').toLocaleString()} USDC
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1 font-headline">
                          {j.title}
                        </h4>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1 text-[11px] font-mono gap-1">
                          <span className="text-slate-500">
                            Talent: {truncateAddress(j.freelancer || '')}
                          </span>
                          <span className="text-[9.5px] sm:text-[10px] text-slate-700 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-full font-mono">
                            {certId}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono flex-wrap gap-2">
                        <Link
                          to={`/jobs/${j.id}/attestation`}
                          className="text-[#0047AB] hover:text-[#003A8C] font-bold flex items-center gap-1 hover:underline"
                        >
                          <span>View Attestation</span>
                          <ExternalLink size={10} />
                        </Link>

                        <a
                          href={verifyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline"
                        >
                          <span>Verify on CertifiedPass</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 font-sans space-y-1">
                  <Award className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                  <p className="font-bold text-slate-700 text-xs">No Soulbound Patron SBT Attestations Minted Yet</p>
                  <p className="text-[11px] text-slate-400 font-mono">Fund and release your first escrow milestone to mint a non-transferable patron reputation credential.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 2. FREELANCER & DEVELOPER PROFILE VIEW */
        <div className="space-y-8">
          {/* If Judge, show arbitrator banner at top of developer profile */}
          {isJudgeProfile && (
            <div className="bg-amber-50 border border-amber-200 p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-4 font-mono text-xs shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                  <Scale size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-amber-950 text-sm">DAO Arbitrator & Sovereign Developer</span>
                    <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                      Protocol Judge Active
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 font-sans mt-0.5">
                    Authorized to freelance, post jobs, and arbitrate smart contract escrow disputes.
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-amber-800 uppercase font-bold block">Arbitration SLA</span>
                <span className="text-lg font-black text-amber-900">100%</span>
              </div>
            </div>
          )}
          {/* Header Profile Card */}
          <div id="reputation-overview" className="border border-[#E2E6EC] bg-white rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 border-b border-slate-100 pb-6">
              <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
                <img
                  src={userProfile.avatarUrl || (userProfile.githubUsername ? `https://github.com/${userProfile.githubUsername}.png` : `https://api.dicebear.com/7.x/identicon/svg?seed=${userProfile.address}`)}
                  alt={userProfile.displayName}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${userProfile.address}`;
                  }}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-slate-200 object-cover shadow-2xs shrink-0"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                    <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#0B0B0C] break-words">
                      {userProfile.displayName}
                    </h1>
                    {userProfile.githubVerified && (
                      <span className="text-[10px] sm:text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-mono font-bold shrink-0 self-start sm:self-auto">
                        ✓ Verified Developer
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-slate-600 font-bold break-words">
                    Wallet Address: {truncateAddress(userProfile.address)}
                  </p>
                  <p className="text-xs text-slate-600 max-w-md pt-1 leading-relaxed">{userProfile.bio}</p>
                </div>
              </div>

              {isOwnProfile && (
                <Link
                  to="/settings"
                  className="bg-[#0047AB] hover:bg-[#003A8C] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-xs w-full sm:w-auto text-center shrink-0 transition-colors"
                >
                  Edit Profile & Skills
                </Link>
              )}
            </div>

            {/* Audited Code Byte Matrix & Reputation Card for ALL Users */}
            <GithubEkycCard
              bytecodeMatrix={bytecodeMatrix}
              userProfile={userProfile}
            />

            {/* Skill Tags */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-mono">
                Self-Claimed Skill Tags (ProfileRegistry.sol):
              </span>
              <div className="flex flex-wrap gap-2">
                {userProfile.skills.map((sk) => (
                  <span
                    key={sk}
                    className="bg-slate-50 border border-[#E2E6EC] text-[#0B0B0C] px-3 py-1 rounded-lg text-xs font-mono font-medium hover:border-slate-300 transition-colors"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* VERIFIABLE PORTFOLIO SECTION matching manage_profile_verifiable_portfolio */}
          <div className="border border-[#E2E6EC] bg-white rounded-2xl shadow-xs p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-serif font-bold text-[#0B0B0C] flex items-center gap-2">
                <FolderGit2 size={20} className="text-[#0047AB]" /> Verifiable Portfolio Deliverables
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
                      <ExternalLink size={14} className="text-[#0047AB]" />
                    </div>
                    <p className="text-[11px] text-slate-600 font-sans line-clamp-2">
                      {j.description}
                    </p>
                    <div className="pt-2 flex justify-between items-center text-[10px] text-slate-800 font-bold">
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
          {/* On-Chain Soulbound Token (SBT) Vault */}
          <div id="soulbound-reputation-vault" className="border border-[#E2E6EC] bg-white rounded-2xl shadow-xs p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#0B0B0C] flex items-center gap-2">
                  <Award size={20} className="text-[#0047AB]" /> Soulbound Reputation Tokens ({completedFreelancerJobs.length})
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Cryptographically minted, non-transferable on-chain escrow credentials
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#0047AB] bg-blue-50 px-3 py-1 rounded-full border border-blue-200 font-bold flex items-center gap-1">
                <ShieldCheck size={12} className="text-[#0047AB]" /> Polygon ERC-721 Soulbound
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {completedFreelancerJobs.length > 0 ? (
                completedFreelancerJobs.map((j) => {
                  const certId = getCanonicalCertificateId(j.id, j.contractAddress);
                  const verifyUrl = getCertifiedPassVerifyUrl(certId);

                  return (
                    <div
                      key={j.id}
                      className="bg-slate-50 p-5 rounded-xl border border-[#E2E6EC] space-y-3 relative overflow-hidden group hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#0047AB] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                          SBT #{j.sbtTokenId || getDeterministicSbtId(j.id)}
                        </span>
                        <span className="text-xs font-mono font-black text-emerald-700">
                          ${parseFloat(j.amountUsdc || '0').toLocaleString()} USDC
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1 font-headline">
                          {j.title}
                        </h4>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1 text-[11px] font-mono gap-1">
                          <span className="text-slate-500">
                            Client: {truncateAddress(j.client)}
                          </span>
                          <span className="text-[9.5px] sm:text-[10px] text-slate-700 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-full font-mono">
                            {certId}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono flex-wrap gap-2">
                        <Link
                          to={`/jobs/${j.id}/attestation`}
                          className="text-[#0047AB] hover:text-[#003A8C] font-bold flex items-center gap-1 hover:underline"
                        >
                          <span>View Attestation</span>
                          <ExternalLink size={10} />
                        </Link>

                        <a
                          href={verifyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline"
                        >
                          <span>Verify on CertifiedPass</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 font-sans space-y-1">
                  <Award className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                  <p className="font-bold text-slate-700 text-xs">No Soulbound SBT Attestations Minted Yet</p>
                  <p className="text-[11px] text-slate-400 font-mono">Complete your first freelance escrow delivery to mint a non-transferable reputation token.</p>
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

  const devVolumeHandled = (completedFreelancerJobs || []).reduce((sum, j) => {
    const earnedFraction = j.dispute?.resolved ? ((j.dispute.rulingBps ?? 0) / 10000) : 1.0;
    return sum + (parseFloat(j.amountUsdc || '0') * earnedFraction);
  }, 0);

  const bytecodeMatrix = getUserBytecodeMatrix(userProfile, (completedFreelancerJobs || []).length, devVolumeHandled);

  return (
    <div className="border border-[#E2E6EC] bg-white rounded-xl shadow-xs p-6 sm:p-8 space-y-5">
      <div className="border-b border-[#E2E6EC] pb-3 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#0B0B0C] font-serif flex items-center gap-2">
            <Search size={20} className="text-[#0047AB]" /> Participant Score Auditor Tool
          </h3>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Check client trust ratings and developer reputation scores for escrow evaluations.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg border border-[#E2E6EC]">
          <button
            onClick={() => setAuditType('freelancer')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${auditType === 'freelancer' ? 'bg-[#0047AB] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Audit Freelancer
          </button>
          <button
            onClick={() => setAuditType('client')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${auditType === 'client' ? 'bg-[#0047AB] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Audit Client
          </button>
        </div>
      </div>

      {auditType === 'freelancer' ? (
        /* FREELANCER AUDIT REPORT WIDGET */
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-[#E2E6EC] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#0B0B0C] border border-slate-700 flex items-center justify-center text-white font-bold text-lg">
              {userProfile.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <span className="font-extrabold text-[#0B0B0C] text-sm">{userProfile.displayName}</span>
              <p className="text-[10px] font-mono text-slate-500 font-bold mt-0.5">Address: {userProfile.address}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-[#E2E6EC] space-y-1">
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Reputation Score</span>
              <span className="font-extrabold text-[#0047AB] text-base">{completedFreelancerJobs.length * 100} PLREP</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-[#E2E6EC] space-y-1">
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Escrow Success Rate</span>
              <span className="font-extrabold text-emerald-700 text-base">{freelancerJobs.length > 0 ? '100%' : '0%'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-[#E2E6EC] space-y-1">
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Completed Jobs</span>
              <span className="font-extrabold text-slate-800 text-base">{completedFreelancerJobs.length} Smart Contracts</span>
            </div>
          </div>

          {/* Audited Developer Score & Bytecode Matrix (Brand Design) */}
          <GithubEkycCard
            bytecodeMatrix={bytecodeMatrix}
            userProfile={userProfile}
          />
        </div>
      ) : (
        /* CLIENT AUDIT REPORT WIDGET */
        <div className="space-y-4 text-left">
          <div className="bg-slate-50 p-4 rounded-xl border border-[#E2E6EC] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#0B0B0C] border border-slate-700 flex items-center justify-center text-white font-bold text-lg">
              {userProfile.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="font-extrabold text-[#0B0B0C] text-sm">{userProfile.displayName}</span>
              <p className="text-[10px] font-mono text-slate-500 font-bold mt-0.5">Address: {userProfile.address}</p>
            </div>
          </div>

          {/* Trust Score & Ratings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-[#E2E6EC] space-y-1">
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Client Trust Index</span>
              <span className="font-extrabold text-[#0B0B0C] text-base">{reliabilityScore} / 10.0</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-[#E2E6EC] space-y-1">
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Total Capital TVL</span>
              <span className="font-extrabold text-emerald-700 text-base">${clientTvl.toLocaleString()}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-[#E2E6EC] space-y-1">
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Avg Payout Speed</span>
              <span className="font-extrabold text-slate-900 text-base">{completedClientJobs.length > 0 ? '4.2 Hours' : 'N/A'}</span>
            </div>
          </div>

          {/* Verification Parameters */}
          <div className="bg-slate-50 p-4 rounded-xl border border-[#E2E6EC] font-mono text-xs space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider border-b border-[#E2E6EC] pb-1.5">Audit Security Parameters</span>
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
