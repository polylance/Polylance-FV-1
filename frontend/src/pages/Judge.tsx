import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { truncateAddress } from '../utils/formatters';
import { Scale, Gavel, FileText, CheckCircle2, TrendingUp, Clock, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Judge: React.FC = () => {
  const { address } = useWeb3();
  const { jobs, resolveDispute } = usePolyLanceData();

  const disputedJobs = jobs.filter((j) => j.status === 'Disputed');
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
            ARBITRATOR_ROLE: <span className="text-purple-900 font-bold">{truncateAddress(address)}</span> (Verified Identity)
          </p>
        </div>

        <div className="text-right font-mono text-xs">
          <span className="text-slate-500 font-bold">Pending Disputes: </span>
          <span className="font-bold text-amber-700 text-sm">{disputedJobs.length} Active</span>
        </div>
      </div>

      {/* Helpful Stats Grid matching reference HTML */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 border-slate-200 bg-white space-y-2">
          <p className="font-label-mono text-xs text-slate-500 font-bold">Total Resolved (30d)</p>
          <h4 className="font-headline text-3xl font-black text-purple-900">142</h4>
          <div className="flex items-center text-xs text-emerald-700 gap-1 font-mono pt-1 font-bold">
            <TrendingUp size={14} /> +12% from last month
          </div>
        </div>

        <div className="glass-panel p-6 border-slate-200 bg-white space-y-2">
          <p className="font-label-mono text-xs text-slate-500 font-bold">Average Resolution SLA</p>
          <h4 className="font-headline text-3xl font-black text-purple-900">3.2 Days</h4>
          <div className="flex items-center text-xs text-slate-600 gap-1 font-mono pt-1 font-medium">
            <Clock size={14} /> Within SLA threshold
          </div>
        </div>

        <div className="glass-panel p-6 border-slate-200 bg-white space-y-2">
          <p className="font-label-mono text-xs text-slate-500 font-bold">Arbitrator Fee Earned</p>
          <h4 className="font-headline text-3xl font-black text-emerald-700">$840.50 USDC</h4>
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
          <div className="p-12 text-center text-slate-500 space-y-2">
            <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
            <h4 className="font-bold text-slate-900">No Open Disputes</h4>
            <p className="text-xs">All smart contract escrows are in good standing.</p>
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
                className={`p-4 border rounded-xl font-mono text-xs text-center transition-all cursor-pointer ${
                  freelancerBps === 0 ? 'bg-rose-100 border-rose-400 text-rose-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-rose-700 mb-1">100% Client</div>
                <div className="text-[10px]">Full Refund to Client</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(5000)}
                className={`p-4 border rounded-xl font-mono text-xs text-center transition-all cursor-pointer ${
                  freelancerBps === 5000 ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-amber-700 mb-1">50 / 50 Split</div>
                <div className="text-[10px]">Equal Distribution</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(10000)}
                className={`p-4 border rounded-xl font-mono text-xs text-center transition-all cursor-pointer ${
                  freelancerBps === 10000 ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-emerald-700 mb-1">100% Freelancer</div>
                <div className="text-[10px]">Full Release to Freelancer</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(7500)}
                className={`p-4 border rounded-xl font-mono text-xs text-center transition-all cursor-pointer ${
                  freelancerBps === 7500 ? 'bg-purple-100 border-purple-400 text-purple-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
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
                className="gradient-btn-emerald px-8 py-3 rounded-xl font-headline font-bold text-sm shadow-md"
              >
                Submit Final Verdict On-Chain
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
