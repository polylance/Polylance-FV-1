import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { truncateAddress } from '../utils/formatters';
import { 
  Scale, Gavel, FileText, CheckCircle2, TrendingUp, Clock, CreditCard, 
  UserCheck, UserMinus, Plus, ShieldAlert, Award, AlertTriangle, Users 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EmptyState, PermissionDeniedState } from '../components/UIStates';

export const Judge: React.FC = () => {
  const { address, currentRole } = useWeb3();
  const { jobs, resolveDispute, judges, addJudge, removeJudge, toggleJudgeStatus } = usePolyLanceData();

  const disputedJobs = jobs.filter((j) => j.status === 'Disputed');
  
  // Filter resolved disputes: if Judge role, filter to their cases only.
  const resolvedDisputes = jobs.filter((j) => 
    j.dispute && 
    j.dispute.resolved && 
    (currentRole === 'admin' ? true : j.dispute.judge?.toLowerCase() === address?.toLowerCase())
  );
  
  const totalResolved = resolvedDisputes.length;
  const avgSla = totalResolved > 0 ? '3.2 Days' : '0.0 Days';
  const arbitratorFeeEarned = resolvedDisputes.reduce(
    (sum, j) => sum + parseFloat(j.amountUsdc || '0') * 0.025,
    0
  );

  const [selectedJobId, setSelectedJobId] = useState<string | null>(disputedJobs.length > 0 ? disputedJobs[0].id : null);
  const [freelancerBps, setFreelancerBps] = useState<number>(5000);
  const [reasoning, setReasoning] = useState('');

  // Admin Tab State
  const [activeTab, setActiveTab] = useState<'disputes' | 'judges'>('disputes');
  const [newJudgeAddress, setNewJudgeAddress] = useState('');
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newJudgeNotes, setNewJudgeNotes] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  if (currentRole !== 'admin' && currentRole !== 'judge') {
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
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      {/* Top Restricted Header matching judge_panel_dispute_resolution/code.html */}
      <div className="glass-panel p-6 sm:p-8 border-purple-200 bg-white hard-shadow flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              <Gavel className="text-purple-700" /> Judge Dispute Panel
            </h1>
            <span className="bg-rose-100 text-rose-800 border border-rose-300 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
              Restricted Access
            </span>
          </div>
          <p className="text-xs text-slate-600 font-mono">
            {currentRole === 'admin' ? 'ADMIN_ROLE' : 'ARBITRATOR_ROLE'}: <span className="text-purple-900 font-bold">{truncateAddress(address)}</span> (Verified Identity)
          </p>
        </div>

        <div className="text-right font-mono text-xs">
          <span className="text-slate-500 font-bold">Pending Disputes: </span>
          <span className="font-bold text-amber-700 text-sm">{disputedJobs.length} Active</span>
        </div>
      </div>

      {/* Tab Switcher for Admin only */}
      {currentRole === 'admin' && (
        <div className="flex gap-2 border-b border-slate-200 pb-px font-mono text-xs">
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-4 py-2 border-b-2 font-bold transition-all -mb-px cursor-pointer ${
              activeTab === 'disputes'
                ? 'border-purple-600 text-purple-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Disputed Cases Queue
          </button>
          <button
            onClick={() => setActiveTab('judges')}
            className={`px-4 py-2 border-b-2 font-bold transition-all -mb-px cursor-pointer ${
              activeTab === 'judges'
                ? 'border-purple-600 text-purple-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Manage Arbitrators
          </button>
        </div>
      )}

      {/* DISPUTES TAB CONTENT */}
      {(activeTab === 'disputes' || currentRole !== 'admin') && (
        <>
          {/* Helpful Stats Grid matching reference HTML */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 border-slate-200 bg-white space-y-2">
              <p className="font-label-mono text-xs text-slate-500 font-bold">Total Resolved ({currentRole === 'admin' ? 'Platform' : 'You'})</p>
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
              <p className="font-label-mono text-xs text-slate-500 font-bold">Fees Earned</p>
              <h4 className="font-headline text-3xl font-black text-emerald-700">
                ${arbitratorFeeEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
              </h4>
              <div className="flex items-center text-xs text-slate-600 gap-1 font-mono pt-1 font-medium">
                <CreditCard size={14} /> 2.5% protocol resolution fee
              </div>
            </div>
          </div>

          {/* Open Disputes Table matching reference HTML */}
          <div className="glass-panel border-slate-200 bg-white overflow-hidden hard-shadow space-y-4">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
                <Gavel size={18} className="text-purple-700" /> Open Dispute Queue
              </h3>
              <span className="font-mono text-xs text-slate-500 font-bold">{disputedJobs.length} Pending Cases</span>
            </div>

            {disputedJobs.length === 0 ? (
              <div className="py-6">
                <EmptyState
                  title="No Open Disputes"
                  description="All smart contract escrows are in good standing with zero pending arbitration cases."
                  actionText=""
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="p-4 uppercase">Job Contract ID</th>
                      <th className="p-4 uppercase">Dispute Category</th>
                      <th className="p-4 uppercase">Escrow Value</th>
                      <th className="p-4 uppercase">Status</th>
                      <th className="p-4 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {disputedJobs.map((j) => (
                      <tr
                        key={j.id}
                        onClick={() => setSelectedJobId(j.id)}
                        className={`cursor-pointer hover:bg-purple-50/50 transition-colors ${selectedJobId === j.id ? 'bg-purple-50 border-l-4 border-purple-700' : ''
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
                          <button className="gradient-btn-primary px-3 py-1 rounded text-xs font-bold">
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

          {/* Selected Dispute Resolution Section matching reference HTML */}
          {activeJob && activeJob.dispute && (
            <div className="glass-panel p-6 sm:p-8 border-purple-200 bg-white hard-shadow space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-headline text-xl font-bold text-slate-900">
                    Dispute Review & Verdict: {activeJob.id}
                  </h3>
                  <span className="bg-purple-100 text-purple-900 border border-purple-200 px-3 py-1 rounded-full font-mono text-xs font-bold">
                    {activeJob.title}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Client Evidence Card */}
                <div className="border border-slate-200 rounded-xl bg-slate-50 p-6 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <FileText size={16} className="text-rose-600" /> Client Claim Statement
                    </h4>
                    <span className="font-mono text-[11px] text-slate-500 font-bold">{truncateAddress(activeJob.client)}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{activeJob.dispute.evidenceText}</p>
                </div>

                {/* Freelancer Evidence Card */}
                <div className="border border-slate-200 rounded-xl bg-slate-50 p-6 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <FileText size={16} className="text-purple-700" /> Freelancer Response
                    </h4>
                    <span className="font-mono text-[11px] text-slate-500 font-bold">{truncateAddress(activeJob.freelancer)}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {activeJob.dispute.responseText || 'No response submitted yet.'}
                  </p>
                </div>
              </div>

              {/* Issue Formal Judicial Verdict Form matching reference code */}
              <form onSubmit={handleRulingsubmit} className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
                <h4 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Scale size={20} className="text-purple-700" /> Issue Formal Judicial Verdict
                </h4>

                {/* 4 Ruling Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(0)}
                    className={`p-4 border rounded-xl font-mono text-xs text-center transition-all cursor-pointer ${freelancerBps === 0 ? 'bg-rose-100 border-rose-400 text-rose-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                  >
                    <div className="font-bold text-rose-700 mb-1">100% Client</div>
                    <div className="text-[10px]">Full Refund to Client</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(5000)}
                    className={`p-4 border rounded-xl font-mono text-xs text-center transition-all cursor-pointer ${freelancerBps === 5000 ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                  >
                    <div className="font-bold text-amber-700 mb-1">50 / 50 Split</div>
                    <div className="text-[10px]">Equal Distribution</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(10000)}
                    className={`p-4 border rounded-xl font-mono text-xs text-center transition-all cursor-pointer ${freelancerBps === 10000 ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                  >
                    <div className="font-bold text-emerald-700 mb-1">100% Freelancer</div>
                    <div className="text-[10px]">Full Release to Freelancer</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(7500)}
                    className={`p-4 border rounded-xl font-mono text-xs text-center transition-all cursor-pointer ${freelancerBps === 7500 ? 'bg-purple-100 border-purple-400 text-purple-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                  >
                    <div className="font-bold text-purple-700 mb-1">75% Freelancer</div>
                    <div className="text-[10px]">Custom Split Ratio</div>
                  </button>
                </div>

                <div>
                  <label className="block font-label-mono text-xs text-slate-700 uppercase tracking-wider mb-2 font-bold">
                    Required Judicial Reasoning *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Detail the contractual evidence, GitHub commit records, and rationale leading to this ruling..."
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="gradient-btn-emerald px-8 py-3 rounded-xl font-headline font-bold text-sm shadow-md cursor-pointer"
                  >
                    Submit Final Verdict On-Chain
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* MANAGE ARBITRATORS TAB CONTENT */}
      {activeTab === 'judges' && currentRole === 'admin' && (
        <div className="space-y-6">
          <div className="glass-panel border-slate-200 bg-white overflow-hidden hard-shadow space-y-4">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users size={18} className="text-purple-700" /> Platform Arbitrator Directory
              </h3>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="gradient-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Add Arbitrator
              </button>
            </div>

            {judges.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2 font-mono text-xs">
                <ShieldAlert size={36} className="text-amber-600 mx-auto" />
                <h4 className="font-bold text-slate-900">No Arbitrators Registered</h4>
                <p>Register trusted members of the community to handle disputes.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="p-4 uppercase">Arbitrator</th>
                      <th className="p-4 uppercase">Status</th>
                      <th className="p-4 uppercase">Registered Date</th>
                      <th className="p-4 uppercase">Notes</th>
                      <th className="p-4 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {judges.map((j) => (
                      <tr key={j.address} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-purple-900">{j.name}</div>
                          <div className="text-[10px] text-slate-400">{j.address}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${
                            j.status === 'Active'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-extrabold'
                              : 'bg-rose-50 border-rose-200 text-rose-800 font-extrabold'
                          }`}>
                            {j.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">
                          {new Date(j.addedAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-slate-500 font-sans max-w-xs truncate" title={j.notes}>
                          {j.notes}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleJudgeStatus(j.address)}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                                j.status === 'Active'
                                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                                  : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                              }`}
                            >
                              {j.status === 'Active' ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to remove arbitrator ${j.name}?`)) {
                                  removeJudge(j.address);
                                }
                              }}
                              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Arbitrator Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl max-w-md w-full border-purple-200 bg-white hard-shadow space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
                <Scale size={18} className="text-purple-700" /> Register Arbitrator
              </h3>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewJudgeAddress('');
                  setNewJudgeName('');
                  setNewJudgeNotes('');
                }} 
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newJudgeAddress.startsWith('0x') || newJudgeAddress.length !== 42) {
                  alert('Invalid Ethereum Address. Must start with 0x and be 42 characters.');
                  return;
                }
                addJudge(newJudgeAddress, newJudgeName, newJudgeNotes, address);
                setIsAddModalOpen(false);
                setNewJudgeAddress('');
                setNewJudgeName('');
                setNewJudgeNotes('');
              }} 
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-label-mono text-slate-700 uppercase tracking-wider mb-1 font-bold">
                  Ethereum Wallet Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={newJudgeAddress}
                  onChange={(e) => setNewJudgeAddress(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div>
                <label className="block font-label-mono text-slate-700 uppercase tracking-wider mb-1 font-bold">
                  Arbitrator Display Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Judge Blackstone"
                  value={newJudgeName}
                  onChange={(e) => setNewJudgeName(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div>
                <label className="block font-label-mono text-slate-700 uppercase tracking-wider mb-1 font-bold">
                  Administrative Notes / Rationale
                </label>
                <textarea
                  rows={3}
                  placeholder="Reason for nominating or professional background..."
                  value={newJudgeNotes}
                  onChange={(e) => setNewJudgeNotes(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setNewJudgeAddress('');
                    setNewJudgeName('');
                    setNewJudgeNotes('');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-4 py-2 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gradient-btn-primary px-6 py-2 rounded-xl font-bold text-white cursor-pointer"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
