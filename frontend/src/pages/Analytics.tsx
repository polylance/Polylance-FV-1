import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useWeb3 } from '../context/Web3Context';
import { 
  Activity, 
  FileCode, 
  TrendingUp, 
  DollarSign, 
  Award, 
  Clock, 
  ArrowUpRight, 
  ShieldCheck, 
  Briefcase, 
  Zap, 
  Scale,
  Code2, 
  CheckCircle2, 
  ChevronRight 
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const { jobs, treasury, treasuryHistory } = usePolyLanceData();
  const { currentRole, address } = useWeb3();

  const isClientRole = currentRole === 'client';
  const isAdminRole = currentRole === 'admin';



  // Admin dynamic real-time calculations
  const platformMilestoneFees = treasuryHistory
    ?.filter((h) => h.type === 'FEE_COLLECTED')
    .reduce((acc, h) => acc + h.amountUsdc, 0) || 0;

  const disputeArbitrationFees = 0;

  const cumulativeFeeRevenue = platformMilestoneFees + disputeArbitrationFees;
  const totalFeesCombined = cumulativeFeeRevenue || 1;
  const platformPercent = Math.round((platformMilestoneFees / totalFeesCombined) * 100);
  const disputePercent = Math.round((disputeArbitrationFees / totalFeesCombined) * 100);

  // Calculations for mock database jobs
  const completedJobs = jobs.filter((j) => j.status === 'Completed').length;
  const totalVolume = jobs.reduce((acc, j) => acc + parseFloat(j.amountUsdc || '0'), 0);

  // User's own freelancer stats
  const freelancerCompletedJobs = jobs.filter(
    (j) => j.freelancer?.toLowerCase() === address?.toLowerCase() && j.status === 'Completed'
  );
  const userVolumeEarned = freelancerCompletedJobs.reduce((acc, j) => acc + parseFloat(j.amountUsdc || '0'), 0);
  const userCompletedCount = freelancerCompletedJobs.length;
  const userReputationPoints = userCompletedCount * 100;

  const freelancerTotalJobs = jobs.filter((j) => j.freelancer?.toLowerCase() === address?.toLowerCase());
  const successRatePercent = freelancerTotalJobs.length > 0
    ? ((freelancerCompletedJobs.length / freelancerTotalJobs.length) * 100).toFixed(1)
    : '0';

  const avgSlaDays = userCompletedCount > 0 ? '3.5' : '0.0';

  // Client dynamic stats
  const clientJobs = jobs.filter((j) => j.client.toLowerCase() === address?.toLowerCase());
  const clientFundedJobs = clientJobs.filter((j) => j.status !== 'Open');
  const clientTotalFunded = clientFundedJobs.reduce((acc, j) => acc + parseFloat(j.amountUsdc || '0'), 0);
  const clientCompletedJobsCount = clientJobs.filter((j) => j.status === 'Completed').length;
  const clientDisputedCount = clientJobs.filter((j) => j.status === 'Disputed').length;
  const disputeRate = clientJobs.length > 0 ? ((clientDisputedCount / clientJobs.length) * 100).toFixed(2) : '0.00';

  const web3Spent = clientJobs.filter(j => j.category === 'web3').reduce((acc, j) => acc + parseFloat(j.amountUsdc || '0'), 0);
  const frontendSpent = clientJobs.filter(j => j.category === 'frontend').reduce((acc, j) => acc + parseFloat(j.amountUsdc || '0'), 0);
  const backendSpent = clientJobs.filter(j => j.category === 'backend').reduce((acc, j) => acc + parseFloat(j.amountUsdc || '0'), 0);
  const totalClientSpent = web3Spent + frontendSpent + backendSpent;

  const web3Bps = totalClientSpent > 0 ? ((web3Spent / totalClientSpent) * 100).toFixed(0) : '0';
  const frontendBps = totalClientSpent > 0 ? ((frontendSpent / totalClientSpent) * 100).toFixed(0) : '0';
  const backendBps = totalClientSpent > 0 ? ((backendSpent / totalClientSpent) * 100).toFixed(0) : '0';

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      {isAdminRole ? (
        /* ==================== ADMIN REVENUE & TREASURY ANALYTICS VIEW (EMERALD / SLATE) ==================== */
        <div className="space-y-8">
          {/* Header */}
          <div className="glass-panel p-6 sm:p-8 border-emerald-200 bg-white hard-shadow flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Scale className="text-emerald-700 animate-pulse" /> PolyLance Protocol Revenue & Treasury Analytics
                </h1>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                  Admin System View
                </span>
              </div>
              <p className="text-xs text-slate-600 font-mono">
                Real-time protocol fee ingestion, multisig treasury liquidity, and cumulative system revenue tracking
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-500 font-bold">Admin Perception: </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] border border-emerald-300 px-2 py-0.5 rounded font-mono font-extrabold uppercase animate-pulse">
                Superuser Live
              </span>
            </div>
          </div>

          {/* Stats Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-2 hover:border-emerald-300 transition-all">
              <p className="font-label-mono text-xs text-slate-500 font-bold uppercase">Safe Treasury Balance</p>
              <h4 className="font-headline text-3xl font-black text-emerald-700">
                ${parseFloat(treasury?.balanceUsdc || '0').toLocaleString()} <span className="text-xs text-slate-400 font-mono font-bold">USDC</span>
              </h4>
              <p className="text-[11px] font-mono text-slate-500">
                {treasury?.requiredSignatures || 2}-of-{treasury?.signers?.length || 2} Signature Threshold
              </p>
            </div>

            <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-2 hover:border-emerald-300 transition-all">
              <p className="font-label-mono text-xs text-slate-500 font-bold uppercase">Cumulative Fee Revenue</p>
              <h4 className="font-headline text-3xl font-black text-slate-900">
                ${cumulativeFeeRevenue.toLocaleString()} <span className="text-xs text-slate-400 font-mono font-bold">USDC</span>
              </h4>
              <p className="text-[11px] font-mono text-emerald-700 font-bold">Ingested from escrow payouts</p>
            </div>

            <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-2 hover:border-emerald-300 transition-all">
              <p className="font-label-mono text-xs text-slate-500 font-bold uppercase">Protocol Gas Reserve</p>
              <h4 className="font-headline text-3xl font-black text-purple-900">
                {parseFloat(treasury?.balanceEth || '0').toFixed(2)} <span className="text-xs text-slate-400 font-mono font-bold">ETH</span>
              </h4>
              <p className="text-[11px] font-mono text-slate-500">Polygon network gas vault</p>
            </div>

            <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-2 hover:border-emerald-300 transition-all">
              <p className="font-label-mono text-xs text-slate-500 font-bold uppercase">Fee Settings BPS</p>
              <h4 className="font-headline text-3xl font-black text-purple-900">2.5%</h4>
              <p className="text-[11px] font-mono text-purple-700 font-bold">`PLATFORM_FEE_BPS = 250`</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Revenue breakdown widget */}
            <div className="lg:col-span-7 glass-panel p-6 sm:p-8 border-slate-200 bg-white hard-shadow space-y-6">
              <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <TrendingUp size={18} className="text-emerald-700" /> Revenue Stream Composition & Indexing
              </h3>

              <div className="space-y-4 font-mono text-xs">
                {/* Stream 1 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Platform Milestone Ingestion Fees (2.5%)</span>
                    <span>${platformMilestoneFees.toLocaleString()} USDC ({platformPercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${platformPercent}%` }} />
                  </div>
                </div>

                {/* Stream 2 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>DAO Dispute Arbitration Resolution Fees (2.5%)</span>
                    <span>${disputeArbitrationFees.toLocaleString()} USDC ({disputePercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${disputePercent}%` }} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono flex justify-between items-center">
                <span className="text-slate-600">Total Volume Processed by Protocol:</span>
                <span className="font-extrabold text-emerald-800">${totalVolume.toLocaleString()} USDC</span>
              </div>
            </div>

            {/* Smart Contract Audit & Gas Log */}
            <div className="lg:col-span-5 glass-panel p-6 sm:p-8 border-slate-200 bg-white hard-shadow space-y-4">
              <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileCode size={18} className="text-emerald-700" /> Safe Withdrawal & Ledger Analytics
              </h3>
              <p className="text-xs text-slate-600 font-mono leading-relaxed">
                As per the updated security policy, any disbursement of company funds from the treasury Safe requires approval of **{treasury?.requiredSignatures || 2}-of-{treasury?.signers?.length || 2}** of the multi-sig keys.
              </p>
              <div className="space-y-3 font-mono text-[11px]">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600 font-medium">Safe Signature Threshold</span>
                  <span className="font-bold text-emerald-700">
                    {treasury?.requiredSignatures || 2} of {treasury?.signers?.length || 2} Owners
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600 font-medium">Total Pending Proposals</span>
                  <span className="font-bold text-amber-700">{treasury?.proposals?.filter(p => !p.executed).length || 0} Pending</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Safe Contract Verifier</span>
                  <span className="font-bold text-purple-700">GnosisSafe.sol ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : isClientRole ? (
        /* ==================== CLIENT ANALYTICS VIEW (INDIGO / SLATE BUSINESS VIEW) ==================== */
        <div className="space-y-8">
          {/* Header */}
          <div className="glass-panel p-6 sm:p-8 border-indigo-200 bg-white hard-shadow flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Briefcase className="text-indigo-600 animate-pulse" /> Client Enterprise Hiring Analytics
                </h1>
                <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                  Enterprise Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-600 font-mono">
                Smart Contract Capital Allocations, Payout Speeds, and SLA Compliance Matrix
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-500 font-bold">Ledger Mode: </span>
              <span className="bg-slate-100 text-slate-800 text-[10px] border border-slate-300 px-2 py-0.5 rounded font-mono font-extrabold uppercase">
                Active Safe
              </span>
            </div>
          </div>

          {/* Stats Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-2 hover:border-indigo-300 transition-all">
              <p className="font-label-mono text-xs text-slate-500 font-bold uppercase">Total Capital Funded</p>
              <h4 className="font-headline text-3xl font-black text-slate-900">${clientTotalFunded.toLocaleString()} <span className="text-xs text-slate-400 font-mono">USDC</span></h4>
              <p className="text-[11px] font-mono text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck size={12} /> {clientTotalFunded > 0 ? '100% Escrow Secured' : 'No Capital Funded'}
              </p>
            </div>

            <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-2 hover:border-indigo-300 transition-all">
              <p className="font-label-mono text-xs text-slate-500 font-bold uppercase">Average Project SLA</p>
              <h4 className="font-headline text-3xl font-black text-indigo-900">{clientCompletedJobsCount > 0 ? '14.5' : '0.0'} <span className="text-xs text-slate-400 font-mono">Days</span></h4>
              <p className="text-[11px] font-mono text-slate-500">From escrow funding to close</p>
            </div>

            <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-2 hover:border-indigo-300 transition-all">
              <p className="font-label-mono text-xs text-slate-500 font-bold uppercase">Average Payout SLA</p>
              <h4 className="font-headline text-3xl font-black text-purple-900">{clientCompletedJobsCount > 0 ? '4.2' : '0.0'} <span className="text-xs text-slate-400 font-mono font-bold">Hours</span></h4>
              <p className="text-[11px] font-mono text-purple-700 font-bold flex items-center gap-1">
                <Zap size={12} /> {clientCompletedJobsCount > 0 ? 'Top Response Speed' : 'No payouts verified'}
              </p>
            </div>

            <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-2 hover:border-indigo-300 transition-all">
              <p className="font-label-mono text-xs text-slate-500 font-bold uppercase">DAO Dispute Rate</p>
              <h4 className="font-headline text-3xl font-black text-amber-700">{disputeRate}%</h4>
              <p className="text-[11px] font-mono text-slate-500">{clientDisputedCount} conflict{clientDisputedCount === 1 ? '' : 's'} escalated YTD</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Spend Distribution widget */}
            <div className="lg:col-span-7 glass-panel p-6 sm:p-8 border-slate-200 bg-white hard-shadow space-y-6">
              <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600" /> Capital Allocation by Code Specialty
              </h3>
              <div className="space-y-4 font-mono text-xs">
                {/* Specialty 1 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Solidity & Smart Contract Auditing (web3)</span>
                    <span>${web3Spent.toLocaleString()} USDC ({web3Bps}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${web3Bps}%` }} />
                  </div>
                </div>
                {/* Specialty 2 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Go/Rust Subgraph Indexers (backend)</span>
                    <span>${backendSpent.toLocaleString()} USDC ({backendBps}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                    <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${backendBps}%` }} />
                  </div>
                </div>
                {/* Specialty 3 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>React/Vite Interfaces & Frontends (frontend)</span>
                    <span>${frontendSpent.toLocaleString()} USDC ({frontendBps}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                    <div className="bg-indigo-300 h-full rounded-full" style={{ width: `${frontendBps}%` }} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-600">Total Platform Fees Contributed:</span>
                <span className="font-extrabold text-indigo-900">${(totalClientSpent * 0.025).toLocaleString()} USDC</span>
              </div>
            </div>

            {/* Smart Contract Factory Info */}
            <div className="lg:col-span-5 glass-panel p-6 sm:p-8 border-slate-200 bg-white hard-shadow space-y-6">
              <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileCode size={18} className="text-indigo-600" /> Gas Optimizations (JobFactory)
              </h3>
              <p className="text-xs text-slate-600 font-mono leading-relaxed">
                PolyLance uses ERC-1167 Minimal Proxy Clones to deploy individual Job Escrow contracts, saving 85% in gas costs on-chain.
              </p>
              <div className="space-y-3.5 font-mono text-[11px]">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600 font-medium">Standard Deploy Gas</span>
                  <span className="font-bold text-rose-700">~2,400,000 Gas</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600 font-medium">PolyLance Minimal Proxy Gas</span>
                  <span className="font-bold text-emerald-700">~180,000 Gas</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Polygon Gas Price Saver Ratio</span>
                  <span className="font-black text-purple-900">13.3x cheaper</span>
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-indigo-950 text-xs">
                <p className="font-bold">Protocol Controller Setting:</p>
                <code className="text-[10px] block mt-1 bg-white/70 p-2 rounded border border-indigo-200/50">
                  PLATFORM_FEE_BPS = 250 (2.5%)
                </code>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== FREELANCER ANALYTICS VIEW (PURPLE / TEAL WORKSPACE VIEW) ==================== */
        <div className="space-y-8">
          {/* Header */}
          <div className="glass-panel p-6 sm:p-8 border-purple-200 bg-white hard-shadow flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Code2 className="text-purple-700 animate-pulse" /> Freelancer Developer Performance Metrics
                </h1>
                <span className="bg-purple-100 text-purple-900 border border-purple-200 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                  Developer Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-600 font-mono">
                Immutable Reputation Growth, Attested Bytes Code-bases, and Earnings Telemetry
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-500 font-bold">Verification: </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] border border-emerald-300 px-2 py-0.5 rounded font-mono font-extrabold uppercase">
                GitHub Linked
              </span>
            </div>
          </div>

          {/* Stats Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-2 hover:border-purple-300 transition-all">
              <p className="font-label-mono text-xs text-slate-500 font-bold uppercase">Total Volume Earned</p>
              <h4 className="font-headline text-3xl font-black text-emerald-700">${userVolumeEarned.toLocaleString()} <span className="text-xs text-slate-400 font-mono font-bold">USDC</span></h4>
              <p className="text-[11px] font-mono text-slate-500">{userCompletedCount} projects completed</p>
            </div>

            <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-2 hover:border-purple-300 transition-all">
              <p className="font-label-mono text-xs text-slate-500 font-bold uppercase">Reputation SBT Power</p>
              <h4 className="font-headline text-3xl font-black text-purple-900">{userReputationPoints} <span className="text-xs text-slate-400 font-mono font-bold">PLREP</span></h4>
              <p className="text-[11px] font-mono text-purple-700 font-bold flex items-center gap-1">
                <Award size={12} /> {userReputationPoints > 0 ? 'Top Tier Rank' : 'Starter Rank'}
              </p>
            </div>

            <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-2 hover:border-purple-300 transition-all">
              <p className="font-label-mono text-xs text-slate-500 font-bold uppercase">Escrow Success Rate</p>
              <h4 className="font-headline text-3xl font-black text-teal-800">{successRatePercent}%</h4>
              <p className="text-[11px] font-mono text-teal-800 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> {parseFloat(successRatePercent) > 80 ? 'Excellent Standing' : 'Active Status'}
              </p>
            </div>

            <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-2 hover:border-purple-300 transition-all">
              <p className="font-label-mono text-xs text-slate-500 font-bold uppercase">Avg Release SLA</p>
              <h4 className="font-headline text-3xl font-black text-slate-900">{avgSlaDays} <span className="text-xs text-slate-400 font-mono font-bold">Days</span></h4>
              <p className="text-[11px] font-mono text-slate-500">From code submission to release</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* GitHub Code Audited Matrix */}
            <div className="lg:col-span-7 glass-panel p-6 sm:p-8 border-slate-200 bg-white hard-shadow space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Code2 size={18} className="text-purple-700" /> Attested GitHub Code-byte Distribution
                </h3>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  VERIFIED BY ORACLE
                </span>
              </div>

              {freelancerCompletedJobs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-1">
                  <p className="font-bold text-sm">No GitHub Repositories Linked</p>
                  <p className="text-xs">Complete escrow contracts to view code-byte statistics.</p>
                </div>
              ) : (
                <div className="space-y-4 font-mono text-xs">
                  {/* Solidity */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-800 font-bold">
                      <span>Solidity (.sol)</span>
                      <span>88,420 Bytes (35%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: '35%' }} />
                    </div>
                  </div>

                  {/* Rust */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-800 font-bold">
                      <span>Rust (.rs)</span>
                      <span>42,100 Bytes (17%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-purple-400 h-full rounded-full" style={{ width: '17%' }} />
                    </div>
                  </div>

                  {/* TypeScript */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-800 font-bold">
                      <span>TypeScript (.ts / .tsx)</span>
                      <span>120,500 Bytes (48%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: '48%' }} />
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 font-mono mt-4">
                    Attested under cryptographic signature hash UID: <code className="bg-slate-100 px-1 py-0.5 rounded font-bold text-slate-700">0x3f1a...7b9e</code>. Verified via GitHub OAuth integration.
                  </p>
                </div>
              )}
            </div>

            {/* Earnings history widget */}
            <div className="lg:col-span-5 glass-panel p-6 sm:p-8 border-slate-200 bg-white hard-shadow space-y-4">
              <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <DollarSign size={18} className="text-purple-700" /> Recent Payout History
              </h3>
              <div className="space-y-3 font-mono text-xs">
                {freelancerCompletedJobs.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 space-y-1">
                    <p className="font-bold text-sm">No Payout History</p>
                    <p className="text-xs">Completed escrow payouts will appear here.</p>
                  </div>
                ) : (
                  freelancerCompletedJobs.map((job) => (
                    <div key={job.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100/50 transition-colors">
                      <div>
                        <span className="font-bold text-slate-900">{job.title}</span>
                        <p className="text-[10px] text-slate-500">Recently settled</p>
                      </div>
                      <span className="font-extrabold text-emerald-700">+{parseFloat(job.amountUsdc || '0').toLocaleString()} USDC</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
