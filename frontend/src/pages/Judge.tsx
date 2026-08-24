import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { truncateAddress } from '../utils/formatters';
import { 
  Scale, Gavel, FileText, CheckCircle2, TrendingUp, Clock, CreditCard,
  Users, UserPlus, ShieldCheck, Check, X, MessageSquare, AlertTriangle,
  UserCheck, ShieldAlert, Sparkles, ExternalLink, Trash2, Power
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EmptyState, PermissionDeniedState } from '../components/UIStates';

export const Judge: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { address, currentRole } = useWeb3();
  const { 
    jobs, resolveDispute, judges, addJudge, removeJudge, toggleJudgeStatus 
  } = usePolyLanceData();

  const isAdmin = currentRole === 'admin';
  const isJudgeRole = currentRole === 'judge';

  // Navigation tab state
  const initialTab = searchParams.get('tab') === 'manage' || searchParams.get('action') === 'invite' ? 'manage' : 'disputes';
  const [activeTab, setActiveTab] = useState<'disputes' | 'manage'>(initialTab);

  // Invite Judge Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(searchParams.get('action') === 'invite');
  const [newJudgeAddress, setNewJudgeAddress] = useState('');
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newJudgeNotes, setNewJudgeNotes] = useState('');

  const disputedJobs = jobs.filter((j) => j.status === 'Disputed');
  const resolvedDisputes = jobs.filter((j) => j.dispute && j.dispute.resolved);
  const totalResolved = resolvedDisputes.length;
  const avgSla = totalResolved > 0 ? '3.2 Days' : '0.0 Days';
  const arbitratorFeeEarned = resolvedDisputes.reduce(
    (sum, j) => sum + parseFloat(j.amountUsdc || '0') * 0.025,
    0
  );

  const [selectedJobId, setSelectedJobId] = useState<string | null>(disputedJobs.length > 0 ? disputedJobs[0].id : null);
  const [freelancerBps, setFreelancerBps] = useState<number>(5000);
  const [reasoning, setReasoning] = useState('');

  const activeJob = jobs.find((j) => j.id === selectedJobId);

  const handleApplyPreset = (bps: number) => {
    setFreelancerBps(bps);
  };

  const handleRulingsubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJob || !reasoning.trim()) return;
    resolveDispute(activeJob.id, freelancerBps, reasoning, address);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } });
    setSelectedJobId(null);
    setReasoning('');
  };

  const handleAddJudgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudgeAddress.trim() || !newJudgeAddress.startsWith('0x')) {
      alert('Please enter a valid Ethereum/Polygon address starting with 0x.');
      return;
    }

    addJudge(
      newJudgeAddress.trim(),
      newJudgeName.trim() || `Judge ${newJudgeAddress.slice(0, 6)}...`,
      newJudgeNotes.trim() || 'Accredited dispute resolution arbitrator.',
      address || 'Admin Governance'
    );

    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    setIsInviteModalOpen(false);
    setNewJudgeAddress('');
    setNewJudgeName('');
    setNewJudgeNotes('');
    setActiveTab('manage');
  };

  if (!isAdmin && !isJudgeRole) {
    return (
      <div className="max-w-xl mx-auto py-16">
        <PermissionDeniedState
          title="Access Restricted"
          description="Only appointed Arbitrators and DAO Governors have permission to access the dispute arbitration panel."
          onBack={() => window.history.back()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 max-w-6xl mx-auto font-sans">
      {/* Top Restricted Header */}
      <div className="glass-panel p-6 sm:p-8 border-purple-200 bg-white hard-shadow flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              <Gavel className="text-purple-700" /> Judge Governance & Dispute Panel
            </h1>
            <span className="bg-purple-100 text-purple-900 border border-purple-300 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
              {isAdmin ? 'Admin Governance' : 'Arbitrator Access'}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-mono">
            CONNECTED_ROLE: <span className="text-purple-900 font-bold">{truncateAddress(address)}</span> ({isAdmin ? 'DAO Administrator' : 'Accredited Judge'})
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="gradient-btn-primary px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105"
            >
              <UserPlus size={15} />
              <span>Invite / Appoint Judge</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-headline flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'disputes'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Scale size={14} />
          <span>Dispute Queue & Verdicts</span>
          {disputedJobs.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono font-bold ${
              activeTab === 'disputes' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
            }`}>
              {disputedJobs.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manage')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-headline flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'manage'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Users size={14} />
          <span>Appointed Judges Roster</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono font-bold ${
            activeTab === 'manage' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-900'
          }`}>
            {judges.length}
          </span>
        </button>
      </div>

      {/* TAB 1: DISPUTES & VERDICTS */}
      {activeTab === 'disputes' && (
        <div className="space-y-6">
          {/* Helpful Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 border-slate-200 bg-white space-y-2">
              <p className="font-label-mono text-xs text-slate-500 font-bold">Total Resolved (30d)</p>
              <h4 className="font-headline text-3xl font-black text-purple-900">{totalResolved}</h4>
              <div className="flex items-center text-xs text-slate-500 gap-1 font-mono pt-1 font-medium">
                <TrendingUp size={14} /> Active arbitrator track record
              </div>
            </div>

            <div className="glass-panel p-6 border-slate-200 bg-white space-y-2">
              <p className="font-label-mono text-xs text-slate-500 font-bold">Average Resolution SLA</p>
              <h4 className="font-headline text-3xl font-black text-purple-900">{avgSla}</h4>
              <div className="flex items-center text-xs text-slate-600 gap-1 font-mono pt-1 font-medium">
                <Clock size={14} /> Within SLA threshold
              </div>
            </div>

            <div className="glass-panel p-6 border-slate-200 bg-white space-y-2">
              <p className="font-label-mono text-xs text-slate-500 font-bold">Arbitrator Fee Earned</p>
              <h4 className="font-headline text-3xl font-black text-emerald-700">
                ${arbitratorFeeEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
              </h4>
              <div className="flex items-center text-xs text-slate-600 gap-1 font-mono pt-1 font-medium">
                <CreditCard size={14} /> 2.5% protocol resolution fee
              </div>
            </div>
          </div>

          {/* Open Disputes Table */}
          <div className="glass-panel border-slate-200 bg-white overflow-hidden hard-shadow space-y-4">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
                <Gavel size={18} className="text-purple-700" /> Open Dispute Queue
              </h3>
              <span className="font-mono text-xs text-slate-500 font-bold">{disputedJobs.length} Pending Cases</span>
            </div>

            {disputedJobs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-900">No Open Disputes</h4>
                <p className="text-xs">All smart contract escrows are in good standing.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Job ID</th>
                      <th className="p-4">Category / Reason</th>
                      <th className="p-4">Escrow Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {disputedJobs.map((j) => (
                      <tr
                        key={j.id}
                        onClick={() => setSelectedJobId(j.id)}
                        className={`cursor-pointer hover:bg-purple-50/50 transition-colors ${
                          selectedJobId === j.id ? 'bg-purple-50 border-l-4 border-purple-700' : ''
                        }`}
                      >
                        <td className="p-4 font-bold text-purple-900">{j.id}</td>
                        <td className="p-4 text-slate-700">{j.dispute?.reason || 'QUALITY'}</td>
                        <td className="p-4 font-bold text-emerald-700">${parseFloat(j.amountUsdc).toLocaleString()} USDC</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] uppercase font-bold">
                            Waiting for Judge
                          </span>
                        </td>
                        <td className="p-4">
                          <button className="gradient-btn-primary px-3 py-1 rounded text-xs font-bold cursor-pointer">
                            Review Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Case Review Detail */}
          {activeJob && activeJob.dispute && (
            <div className="space-y-6 pt-2 animate-fadeIn">
              <div className="glass-panel p-6 border-slate-200 bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-purple-700 uppercase">Case: #{activeJob.id}</span>
                    <h3 className="font-headline text-xl font-bold text-slate-900">{activeJob.title}</h3>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700 text-lg font-mono">
                      ${parseFloat(activeJob.amountUsdc).toLocaleString()} USDC
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono">Under Contractual Arbitration</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Client Evidence Card */}
                  <div className="border border-slate-200 rounded-xl bg-slate-50 p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        <FileText size={15} className="text-rose-600" /> Client Claim Statement
                      </h4>
                      <span className="font-mono text-[10px] text-slate-500 font-bold">{truncateAddress(activeJob.client)}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans">{activeJob.dispute.evidenceText}</p>
                  </div>

                  {/* Freelancer Evidence Card */}
                  <div className="border border-slate-200 rounded-xl bg-slate-50 p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        <FileText size={15} className="text-purple-700" /> Freelancer Response
                      </h4>
                      <span className="font-mono text-[10px] text-slate-500 font-bold">{truncateAddress(activeJob.freelancer)}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans">
                      {activeJob.dispute.responseText || 'No response submitted yet.'}
                    </p>
                  </div>
                </div>

                {/* Verdict Form */}
                <form onSubmit={handleRulingsubmit} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-5 mt-4">
                  <h4 className="font-headline text-base font-bold text-slate-900 flex items-center gap-2">
                    <Scale size={18} className="text-purple-700" /> Issue Formal Judicial Verdict
                  </h4>

                  {/* Presets */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(0)}
                      className={`p-3 border rounded-xl font-mono text-xs text-center transition-all cursor-pointer ${
                        freelancerBps === 0 ? 'bg-rose-100 border-rose-400 text-rose-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-rose-700 mb-0.5">100% Client</div>
                      <div className="text-[9.5px]">Full Refund to Client</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset(5000)}
                      className={`p-3 border rounded-xl font-mono text-xs text-center transition-all cursor-pointer ${
                        freelancerBps === 5000 ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-amber-700 mb-0.5">50 / 50 Split</div>
                      <div className="text-[9.5px]">Equal Distribution</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset(10000)}
                      className={`p-3 border rounded-xl font-mono text-xs text-center transition-all cursor-pointer ${
                        freelancerBps === 10000 ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-emerald-700 mb-0.5">100% Freelancer</div>
                      <div className="text-[9.5px]">Full Payout Release</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset(7500)}
                      className={`p-3 border rounded-xl font-mono text-xs text-center transition-all cursor-pointer ${
                        freelancerBps === 7500 ? 'bg-purple-100 border-purple-400 text-purple-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-purple-700 mb-0.5">75% Freelancer</div>
                      <div className="text-[9.5px]">25% Client Refund</div>
                    </button>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5 uppercase tracking-wider">
                      Required Judicial Reasoning *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Detail the contractual evidence, GitHub commit records, and rationale leading to this ruling..."
                      value={reasoning}
                      onChange={(e) => setReasoning(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="gradient-btn-emerald px-6 py-2.5 rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all hover:scale-105"
                    >
                      Submit Final Verdict On-Chain
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: JUDGES ROSTER & GOVERNANCE MANAGEMENT */}
      {activeTab === 'manage' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel border-slate-200 bg-white overflow-hidden hard-shadow space-y-4">
            <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users size={18} className="text-purple-700" /> Appointed Protocol Arbitrators
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Decentralized jury and dispute arbiters authorized by DAO Governance
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="gradient-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105"
                >
                  <UserPlus size={14} />
                  <span>Add New Judge</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Judge & Title</th>
                    <th className="p-4">Wallet Address</th>
                    <th className="p-4">Specialization / Notes</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {judges.map((judge, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-bold font-headline text-xs shrink-0">
                            {judge.name ? judge.name.slice(0, 2).toUpperCase() : 'JD'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{judge.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Appointed: {new Date(judge.addedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono font-bold text-purple-900 text-xs">
                        {truncateAddress(judge.address)}
                      </td>

                      <td className="p-4 text-slate-600 text-xs max-w-xs truncate">
                        {judge.notes || 'General Smart Contract & Escrow Arbitration'}
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                          judge.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {judge.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/chat?judge=${judge.address}`}
                            className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors inline-flex items-center gap-1 font-bold text-[11px]"
                            title="Open Direct Message"
                          >
                            <MessageSquare size={13} />
                            <span>Message</span>
                          </Link>

                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => toggleJudgeStatus(judge.address)}
                                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                                title={judge.status === 'Active' ? 'Suspend Judge' : 'Activate Judge'}
                              >
                                <Power size={13} className={judge.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'} />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Revoke appointment for ${judge.name}?`)) {
                                    removeJudge(judge.address);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                                title="Revoke Judge Appointment"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* APPOINT / INVITE JUDGE MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-purple-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-headline">
                    Appoint Protocol Arbitrator
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Authorize a new Judge address for DAO dispute arbitration
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddJudgeSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[9.5px] tracking-wider">
                  Judge Ethereum / Polygon Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={newJudgeAddress}
                  onChange={(e) => setNewJudgeAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-xs focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-bold">Quick Presets:</span>
                  {[
                    { label: 'Arbitrator Candidate 1', addr: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc' },
                    { label: 'Arbitrator Candidate 2', addr: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewJudgeAddress(p.addr);
                        setNewJudgeName(p.label);
                        setNewJudgeNotes('Accredited DeFi & smart contract auditor.');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-mono text-[9.5px] cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[9.5px] tracking-wider">
                  Judge Display Name / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arbitrator Dr. Elena Vance"
                  value={newJudgeName}
                  onChange={(e) => setNewJudgeName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-sans text-xs focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[9.5px] tracking-wider">
                  Arbitration Specialization & Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Smart Contract Security, DeFi protocols, Zero-Knowledge proofs..."
                  value={newJudgeNotes}
                  onChange={(e) => setNewJudgeNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-sans text-xs focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-md cursor-pointer transition-all hover:scale-105"
                >
                  Appoint & Authorize Judge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
