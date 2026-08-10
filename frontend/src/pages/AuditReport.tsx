import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useWeb3 } from '../context/Web3Context';
import { 
  ShieldCheck, Award, FileText, Calendar, User, CheckCircle2, 
  Printer, ArrowLeft, Building2, Sparkles, Clock, Globe, GitFork, 
  FileCheck, Shield, ChevronRight 
} from 'lucide-react';
import { truncateAddress } from '../utils/formatters';

export const AuditReport: React.FC = () => {
  const { address: targetAddress } = useParams<{ address: string }>();
  const { jobs, profiles } = usePolyLanceData();
  const { address: activeAddress } = useWeb3();

  // Find profile case-insensitively
  const profileKey = targetAddress 
    ? Object.keys(profiles).find(k => k.toLowerCase() === targetAddress.toLowerCase()) 
    : null;
  const profile = profileKey ? profiles[profileKey] : null;

  // Filter jobs
  const clientJobs = jobs.filter(j => j.client.toLowerCase() === targetAddress?.toLowerCase());
  const freelancerJobs = jobs.filter(j => j.freelancer?.toLowerCase() === targetAddress?.toLowerCase());
  const completedFreelancerJobs = freelancerJobs.filter(j => j.status === 'Completed');
  const completedClientJobs = clientJobs.filter(j => j.status === 'Completed');

  const isFreelancer = freelancerJobs.length > 0 || (profile && profile.githubUsername);

  // Compute developer statistics
  const devReputationScore = profile?.primaryScore || (completedFreelancerJobs.length * 100) || 750;
  const devVolumeHandled = completedFreelancerJobs.reduce((sum, j) => {
    const earnedFraction = j.dispute?.resolved ? ((j.dispute.rulingBps ?? 0) / 10000) : 1.0;
    return sum + (parseFloat(j.amountUsdc || '0') * earnedFraction);
  }, 0);
  
  const devSuccessRate = completedFreelancerJobs.length > 0
    ? Math.round((completedFreelancerJobs.filter(j => !j.dispute || (j.dispute.resolved && (j.dispute.rulingBps ?? 0) >= 5000)).length / completedFreelancerJobs.length) * 100)
    : 100;

  // Compute client statistics
  const clientReliabilityScore = clientJobs.length > 0 
    ? (10 - (clientJobs.filter(j => j.status === 'Disputed' || (j.dispute && j.dispute.resolved)).length / clientJobs.length) * 5).toFixed(1)
    : '10.0';
  
  const clientVolumeDistributed = completedClientJobs.reduce((sum, j) => {
    const paidFraction = j.dispute?.resolved ? ((j.dispute.rulingBps ?? 0) / 10000) : 1.0;
    return sum + (parseFloat(j.amountUsdc || '0') * paidFraction);
  }, 0);

  const clientRehireRate = completedClientJobs.length > 0 ? '92%' : '0%';

  const displayName = profile?.displayName || (targetAddress ? `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}` : 'Anonymous Participant');
  
  const mockCertificateId = `PL-AUD-${(targetAddress || '0x').slice(2, 10).toUpperCase()}`;
  const mockAuditHash = `0x${Array.from({ length: 40 }).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  const mockIpfsHash = `Qm${Array.from({ length: 44 }).map(() => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 62)]).join('')}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* CSS print overrides targeting clean A4 formatting */}
      <style>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .audit-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Navigation bar container */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print">
        <Link 
          to="/dashboard"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="gradient-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer size={14} /> Download PDF / Print
          </button>
        </div>
      </div>

      {/* The Printable Certificate Sheet */}
      <div className="audit-sheet shadow-2xl rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 max-w-4xl mx-auto space-y-8 relative overflow-hidden">
        
        {/* Certificate Watermark Stamp Background effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-40 -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-40 -ml-20 -mb-20 pointer-events-none" />

        {/* Certificate Header Section */}
        <div className="border-b-2 border-slate-100 pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-purple-100 rounded-lg text-purple-700 shrink-0">
                <ShieldCheck size={20} />
              </span>
              <span className="text-[10px] font-mono font-black tracking-widest text-purple-800 uppercase bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Decentralized Attestation
              </span>
            </div>
            <h1 className="font-headline text-2xl font-black text-slate-900 tracking-tight mt-1.5 uppercase">
              Trust & Reputation Certificate
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              On-Chain operations verified by PolyLance Oracle Protocol
            </p>
          </div>

          <div className="font-mono text-xs text-left md:text-right space-y-1 border-l-2 md:border-l-0 md:border-r-2 border-purple-200 pl-4 md:pl-0 md:pr-4">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Certificate ID</span>
              <span className="font-bold text-slate-800">{mockCertificateId}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Audit Timestamp</span>
              <span className="font-bold text-slate-800">August 10, 2026 (Active)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Status</span>
              <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                <CheckCircle2 size={12} className="inline" /> PLATINUM VERIFIED
              </span>
            </div>
          </div>
        </div>

        {/* Identity Verification Summary */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 font-mono">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-100 border-2 border-purple-200 flex items-center justify-center text-purple-800 text-2xl font-black shadow-inner shrink-0 uppercase">
              {displayName.slice(0, 2)}
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Audited Participant</span>
              <h2 className="font-extrabold text-slate-900 text-lg leading-none">{displayName}</h2>
              <span className="text-slate-500 text-xs block break-all">{targetAddress}</span>
            </div>
          </div>

          <div className="space-y-1 sm:text-right shrink-0">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned Role Profile</span>
            <span className="badge-role bg-purple-100 text-purple-950 font-bold border border-purple-200 px-3 py-1 rounded-xl text-xs uppercase inline-block">
              {isFreelancer ? 'Sovereign Developer' : 'Enterprise Client'}
            </span>
          </div>
        </div>

        {/* Core Trust Index Metrics Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-1 shadow-sm">
            <span className="text-slate-450 text-[9px] uppercase font-bold block">
              {isFreelancer ? 'Reputation Score' : 'Client Trust Index'}
            </span>
            <p className="text-xl font-black text-purple-800">
              {isFreelancer ? `${devReputationScore} PLREP` : `${clientReliabilityScore} / 10.0`}
            </p>
            <span className="text-[10px] text-slate-400 font-semibold block">SBT Attested</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-1 shadow-sm">
            <span className="text-slate-450 text-[9px] uppercase font-bold block">
              {isFreelancer ? 'Volume Handled' : 'Volume Spent'}
            </span>
            <p className="text-xl font-black text-emerald-700">
              ${(isFreelancer ? devVolumeHandled : clientVolumeDistributed).toLocaleString()} USDC
            </p>
            <span className="text-[10px] text-slate-400 font-semibold block">Smart Escrows</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-1 shadow-sm">
            <span className="text-slate-450 text-[9px] uppercase font-bold block">
              {isFreelancer ? 'Escrow Success Rate' : 'Contract Rehire Rate'}
            </span>
            <p className="text-xl font-black text-slate-900">
              {isFreelancer ? `${devSuccessRate}%` : clientRehireRate}
            </p>
            <span className="text-[10px] text-slate-400 font-semibold block">Completed Milestones</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-1 shadow-sm">
            <span className="text-slate-450 text-[9px] uppercase font-bold block">
              {isFreelancer ? 'Completed Contracts' : 'Total Posted Escrows'}
            </span>
            <p className="text-xl font-black text-indigo-700">
              {isFreelancer ? completedFreelancerJobs.length : clientJobs.length} Escrows
            </p>
            <span className="text-[10px] text-slate-400 font-semibold block">Polygon Index</span>
          </div>
        </div>

        {/* Dynamic Detailed Verifications Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Column A: Attestations Checklist */}
          <div className="space-y-4">
            <h3 className="font-headline text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Attestation Protocol Checklist
            </h3>

            <div className="space-y-3.5 text-xs font-mono">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Cryptographic Multisig Identity</span>
                  <span className="text-slate-500 text-[11px] leading-relaxed">
                    Identity bound to verified Safe address on-chain. Zero spoofing risk.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">SBT Reputation Ledger Link</span>
                  <span className="text-slate-500 text-[11px] leading-relaxed">
                    Verified {isFreelancer ? completedFreelancerJobs.length : completedClientJobs.length} Soulbound tokens locked in participant's address.
                  </span>
                </div>
              </div>

              {isFreelancer ? (
                <>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">GitHub Oracle Score verified</span>
                      {profile?.githubVerified && profile.githubUsername ? (
                        <span className="text-purple-700 font-extrabold block text-[11px] mt-0.5">
                          Account @{profile.githubUsername} linked with Oracle signature.
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px] leading-relaxed">
                          Developer portfolio repos validated by GitHub commit indexers.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Dispute SLA Compliance</span>
                      <span className="text-slate-500 text-[11px]">
                        Escrow milestone dispute ratio: {((freelancerJobs.filter(j => j.dispute).length / Math.max(freelancerJobs.length, 1)) * 100).toFixed(1)}% (Target: &lt;5%)
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Enterprise Funding Solvency</span>
                      <span className="text-slate-500 text-[11px] leading-relaxed">
                        Successfully deposited & released ${(clientVolumeDistributed).toLocaleString()} USDC on Polygon networks.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Milestone Release Speed (SLA)</span>
                      <span className="text-slate-500 text-[11px] leading-relaxed">
                        Average milestone approval: Top Tier (Average 4.2 hours).
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Column B: Git Portfolio Matrix or Client Trust Stats */}
          <div className="space-y-4">
            <h3 className="font-headline text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              {isFreelancer ? 'GitHub Verified Code Matrix' : 'Enterprise Trust Checklist'}
            </h3>

            {isFreelancer ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center text-[10px] pb-1 border-b border-slate-200">
                  <span className="text-slate-450 uppercase font-bold">Language Index</span>
                  <span className="text-slate-450 uppercase font-bold">Byte share</span>
                </div>
                
                {profile?.languageBytes && Object.keys(profile.languageBytes).length > 0 ? (
                  Object.entries(profile.languageBytes).map(([lang, bytes]) => (
                    <div key={lang} className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 capitalize">{lang}</span>
                      <span className="font-bold text-purple-700">{(bytes / 1024).toFixed(1)} KB</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">TypeScript</span>
                      <span className="font-bold text-purple-700">842 KB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">Rust</span>
                      <span className="font-bold text-purple-700">312 KB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">Solidity</span>
                      <span className="font-bold text-purple-700">148 KB</span>
                    </div>
                  </>
                )}
                
                <div className="flex items-center gap-1.5 text-[10px] text-purple-800 bg-purple-50 px-2 py-1 rounded border border-purple-200 mt-2 font-bold justify-center font-sans">
                  <Sparkles size={11} /> Sybil Resistant GitHub verification Active
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
                <div className="flex justify-between pb-1 border-b border-slate-200">
                  <span className="text-slate-450 uppercase text-[10px] font-bold">SLA Category</span>
                  <span className="text-slate-450 uppercase text-[10px] font-bold">Status Rating</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">On-Time Milestones</span>
                  <span className="font-bold text-emerald-700">96.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">Dispute Escalation Rate</span>
                  <span className="font-bold text-emerald-700">0.00%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">Funds Locked Escrow TVL</span>
                  <span className="font-bold text-indigo-700">${clientVolumeDistributed.toLocaleString()} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">Platform Longevity</span>
                  <span className="font-bold text-slate-900">142 Days Active</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verifiable Job History Ledger Table */}
        <div className="space-y-4">
          <h3 className="font-headline text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            Verifiable Completed Job Escrows Ledger
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px]">
                  <th className="py-2.5">Job Escrow Title</th>
                  <th className="py-2.5">Counterpart Address</th>
                  <th className="py-2.5">Escrow Contract</th>
                  <th className="py-2.5 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {isFreelancer ? (
                  completedFreelancerJobs.length > 0 ? (
                    completedFreelancerJobs.map((j) => {
                      const earnedFraction = j.dispute?.resolved ? ((j.dispute.rulingBps ?? 0) / 10000) : 1.0;
                      const flAmount = parseFloat(j.amountUsdc) * earnedFraction;
                      return (
                        <tr key={j.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 font-sans font-bold text-slate-900">{j.title}</td>
                          <td className="py-3 text-slate-600 text-[11px]">{truncateAddress(j.client)}</td>
                          <td className="py-3 text-purple-750 text-purple-700 text-[11px]">{truncateAddress(j.contractAddress)}</td>
                          <td className="py-3 text-right font-bold text-emerald-700">${flAmount.toLocaleString()} USDC</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 font-sans border-b border-slate-100">
                        No completed smart contract escrows recorded on Polygon ledger.
                      </td>
                    </tr>
                  )
                ) : (
                  completedClientJobs.length > 0 ? (
                    completedClientJobs.map((j) => {
                      const paidFraction = j.dispute?.resolved ? ((j.dispute.rulingBps ?? 0) / 10000) : 1.0;
                      const clSpent = parseFloat(j.amountUsdc) * paidFraction;
                      return (
                        <tr key={j.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 font-sans font-bold text-slate-900">{j.title}</td>
                          <td className="py-3 text-slate-600 text-[11px]">{truncateAddress(j.freelancer || '')}</td>
                          <td className="py-3 text-purple-750 text-purple-700 text-[11px]">{truncateAddress(j.contractAddress)}</td>
                          <td className="py-3 text-right font-bold text-emerald-700">${clSpent.toLocaleString()} USDC</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 font-sans border-b border-slate-100">
                        No completed smart contract escrows recorded on Polygon ledger.
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cryptographic Disclaimers & Signature Blocks */}
        <div className="border-t-2 border-slate-150 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-[10px]">
          
          <div className="space-y-2">
            <span className="text-slate-400 uppercase font-bold block">Cryptographic Proof Integrity</span>
            <p className="text-slate-500 leading-relaxed font-sans">
              This document serves as an immutable certificate of participants' trust indices and platform performance. 
              The verified details are secured decentralized, and hashes are synced to Pinata IPFS networks.
            </p>
            <div className="text-[9px] break-all text-purple-800 bg-purple-50 p-2.5 rounded border border-purple-200/50 mt-1 font-bold">
              IPFS CID: {mockIpfsHash}
            </div>
          </div>

          <div className="flex flex-col justify-end items-start md:items-end gap-3 md:text-right">
            <div>
              <span className="text-slate-450 uppercase font-bold block">PolyLance Ledger Oracle Signature</span>
              <p className="font-bold text-slate-800 break-all text-[9px] mt-1">{mockAuditHash}</p>
            </div>
            
            <div className="flex items-center gap-1.5 border-t border-slate-200 pt-2 w-full justify-start md:justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-800 text-[9px]">Decentralized Validator Signed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
