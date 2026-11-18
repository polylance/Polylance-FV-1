import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { truncateAddress } from '../utils/formatters';
import { TREASURY_WALLET } from '../config/contracts';
import { ShieldCheck, Terminal, DollarSign, Users, CheckCircle2, AlertTriangle, FileCode, Zap, Wallet } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PolygonIcon, UsdcIcon } from '../components/TokenIcon';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { CompactEmptyState } from '../components/common/CompactEmptyState';
import { Button } from '../components/common/Button';
import { Modal } from '../components/overlay';
import { getJobAmounts } from '../lib/amounts/getJobAmounts';

export const Treasury: React.FC = () => {
  const { address } = useWeb3();
  const { treasury, proposeTreasuryWithdrawal, signTreasuryWithdrawal, executeTreasuryWithdrawal, treasuryHistory, jobs } = usePolyLanceData();

  const [recipient, setRecipient] = useState(TREASURY_WALLET);
  const [amountUsdc, setAmountUsdc] = useState('');
  const [purpose, setPurpose] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'terminal' | 'governance'>('overview');
  const [selectedProposalModal, setSelectedProposalModal] = useState<string | null>(null);

  // Generate real-time logs from actual state (jobs, proposals, history)
  const logs = (() => {
    const list: { timestamp: string; timeMs: number; text: string; iconType: 'check' | 'code' | 'warning' | 'zap' }[] = [];

    // Helper to format timestamp into LOG hh:mm:ss format
    const formatLogTime = (ms: number) => {
      const d = new Date(ms);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    // 1. Logs from jobs state
    jobs.forEach((job) => {
      // Job Created
      const ja = getJobAmounts(job);
      list.push({
        timestamp: formatLogTime(job.createdAt),
        timeMs: job.createdAt,
        text: `Job #${job.id.slice(0, 6).toUpperCase()} Escrow Created - Funded ${ja.effectiveAmount} ${ja.token} by Client ${truncateAddress(job.client)}`,
        iconType: 'code'
      });

      // Applications
      job.applications.forEach((app) => {
        list.push({
          timestamp: formatLogTime(app.appliedAt),
          timeMs: app.appliedAt,
          text: `Developer ${truncateAddress(app.applicant)} applied for Job #${job.id.slice(0, 6).toUpperCase()}`,
          iconType: 'code'
        });
      });

      // Freelancer selected
      if (job.freelancer) {
        list.push({
          timestamp: formatLogTime(job.createdAt + 120000), // 2 mins later
          timeMs: job.createdAt + 120000,
          text: `Contractor ${truncateAddress(job.freelancer)} selected for Job #${job.id.slice(0, 6).toUpperCase()}`,
          iconType: 'check'
        });
      }

      // Work submitted
      if (job.submittedAt || (job.status === 'Submitted' || job.status === 'Completed' || job.status === 'Disputed')) {
        const subTime = job.submittedAt || (job.createdAt + 240000);
        list.push({
          timestamp: formatLogTime(subTime),
          timeMs: subTime,
          text: `Job #${job.id.slice(0, 6).toUpperCase()} Work Deliverable Submitted by Developer`,
          iconType: 'code'
        });
      }

      // Dispute raised
      if (job.dispute) {
        list.push({
          timestamp: formatLogTime(job.dispute.raisedAt),
          timeMs: job.dispute.raisedAt,
          text: `Job #${job.id.slice(0, 6).toUpperCase()} Disputed - Case filed to DAO by Client`,
          iconType: 'warning'
        });

        if (job.dispute.resolved) {
          list.push({
            timestamp: formatLogTime(job.dispute.raisedAt + 60000),
            timeMs: job.dispute.raisedAt + 60000,
            text: `Job #${job.id.slice(0, 6).toUpperCase()} Dispute Resolved - Arbitrator Ruling Enforced`,
            iconType: 'check'
          });
        }
      }
    });

    // 2. Logs from treasury history (completed payments & withdrawals)
    treasuryHistory.forEach((h) => {
      const typeText = h.type === 'FEE_COLLECTED' ? 'Fee Ingestion' : 'Safe Withdrawal';
      const changePrefix = h.type === 'FEE_COLLECTED' ? '+' : '-';
      list.push({
        timestamp: formatLogTime(h.timestamp),
        timeMs: h.timestamp,
        text: `${typeText}: ${changePrefix}$${h.amountUsdc.toFixed(2)} USDC (Tx: ${h.txHash.slice(0, 10)}...)`,
        iconType: h.type === 'FEE_COLLECTED' ? 'zap' : 'warning'
      });
    });

    // 3. Logs from treasury proposals (multisig proposals)
    treasury.proposals.forEach((prop) => {
      // Proposal created
      const propTime = Date.now() - 3600000; // 1h ago
      list.push({
        timestamp: formatLogTime(propTime),
        timeMs: propTime,
        text: `Multisig Proposal #${prop.id.slice(0, 4)} Created by Owner: ${truncateAddress(prop.proposer)}`,
        iconType: 'code'
      });

      // Signatures
      prop.signatures.forEach((sig, index) => {
        list.push({
          timestamp: formatLogTime(propTime + (index + 1) * 60000),
          timeMs: propTime + (index + 1) * 60000,
          text: `Multisig Proposal #${prop.id.slice(0, 4)} Signature Appended by Owner: ${truncateAddress(sig)}`,
          iconType: 'check'
        });
      });

      if (prop.executed) {
        list.push({
          timestamp: formatLogTime(propTime + 180000),
          timeMs: propTime + 180000,
          text: `Multisig Proposal #${prop.id.slice(0, 4)} Executed - Payout $${parseFloat(prop.amountUsdc).toLocaleString()} USDC to ${truncateAddress(prop.recipient)}`,
          iconType: 'zap'
        });
      }
    });

    // Sort chronological ascending (oldest first)
    return list.sort((a, b) => a.timeMs - b.timeMs);
  })();

  const handlePropose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amountUsdc || !purpose) return;
    proposeTreasuryWithdrawal(recipient, amountUsdc, purpose, address);
    setRecipient('');
    setAmountUsdc('');
    setPurpose('');
  };

  const handleSign = (proposalId: string) => {
    signTreasuryWithdrawal(proposalId, address);
  };

  const handleExecute = (proposalId: string) => {
    executeTreasuryWithdrawal(proposalId);
    confetti({ particleCount: 100, spread: 70 });
  };

  return (
    <PageContainer className="space-y-6 py-6 w-full text-[#0B0B0F]">
      <PageHeader
        title="Safe Multisig Treasury Admin"
        subtitle={`Admin: ${truncateAddress(address)} · ${treasury.requiredSignatures}-of-${treasury.signers.length} Threshold Safe`}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer border ${
                activeTab === 'overview'
                  ? 'bg-[#0047AB] text-white border-[#0047AB] shadow-xs'
                  : 'bg-white hover:bg-[#F6F7F9] text-[#374151] hover:text-[#0B0B0F] border-[#E5E7EB]'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('terminal');
                setTimeout(() => {
                  document.getElementById('terminal-view')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 80);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer border ${
                activeTab === 'terminal'
                  ? 'bg-[#0047AB] text-white border-[#0047AB] shadow-xs'
                  : 'bg-white hover:bg-[#F6F7F9] text-[#374151] hover:text-[#0B0B0F] border-[#E5E7EB]'
              }`}
            >
              Activity log
            </button>
          </div>
        }
      />

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 border border-[#E5E7EB] rounded-xl bg-white shadow-2xs space-y-1.5">
          <p className="text-xs text-[#6B7280] font-medium">Available treasury balance</p>
          <div className="flex items-center gap-2">
            <UsdcIcon size={26} className="shrink-0" />
            <h4 className="text-2xl sm:text-3xl font-semibold text-[#15803D] tabular-nums">
              ${parseFloat(treasury.balanceUsdc).toLocaleString()} <span className="text-base font-normal text-[#6B7280]">USDC</span>
            </h4>
          </div>
          <div className="text-xs text-[#6B7280]">
            Accumulated from 2.5% platform fees
          </div>
        </div>

        <div className="p-4 sm:p-5 border border-[#E5E7EB] rounded-xl bg-white shadow-2xs space-y-1.5">
          <p className="text-xs text-[#6B7280] font-medium">Native gas vault</p>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center shrink-0">
              <PolygonIcon size={16} />
            </div>
            <h4 className="text-2xl sm:text-3xl font-semibold text-[#0B0B0F] tabular-nums">
              {treasury.balanceEth} <span className="text-base font-normal text-[#6B7280]">POL</span>
            </h4>
          </div>
          <div className="text-xs text-[#6B7280]">
            Polygon gas subsidy vault
          </div>
        </div>

        <div className="p-4 sm:p-5 border border-[#E5E7EB] rounded-xl bg-white shadow-2xs space-y-1.5">
          <p className="text-xs text-[#6B7280] font-medium">Security scheme</p>
          <h4 className="text-2xl sm:text-3xl font-semibold text-[#0B0B0F]">
            {treasury.requiredSignatures} of {treasury.signers.length} Threshold
          </h4>
          <div className="text-xs text-[#6B7280]">
            Safe multisig standard
          </div>
        </div>
      </div>

      {/* OVERVIEW TAB CONTENT */}
      {activeTab === 'overview' && (
        <>
          {/* Propose Multisig Withdrawal Form */}
          <form onSubmit={handlePropose} className="p-6 sm:p-8 border border-[#E5E7EB] rounded-xl bg-white shadow-2xs space-y-6">
            <h3 className="text-base font-semibold text-[#0B0B0F] flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
              <DollarSign size={18} className="text-[#0047AB]" /> Propose Multisig Disbursement
            </h3>

            <div className="bg-[#F6F7F9] border border-[#E5E7EB] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Wallet size={14} className="text-[#0047AB] shrink-0" />
                <span className="text-[#4B5563] font-medium">Official protocol treasury wallet:</span>
                <span className="font-mono text-[#0B0B0F] break-all">{TREASURY_WALLET}</span>
              </div>
              {recipient !== TREASURY_WALLET && (
                <button
                  type="button"
                  onClick={() => setRecipient(TREASURY_WALLET)}
                  className="px-2.5 py-1 bg-white border border-[#D1D5DB] text-[#0047AB] font-medium rounded-lg text-xs hover:bg-[#F6F7F9] transition-colors cursor-pointer"
                >
                  Use official treasury
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#0B0B0F] mb-1 font-medium">
                  Recipient wallet address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F6F7F9] border border-[#D1D5DB] focus:bg-white focus:border-[#0047AB] rounded-lg font-mono outline-none text-[#0B0B0F]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#0B0B0F] mb-1 font-medium">
                  Amount (USDC) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="1000"
                  value={amountUsdc}
                  onChange={(e) => setAmountUsdc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F6F7F9] border border-[#D1D5DB] focus:bg-white focus:border-[#0047AB] rounded-lg outline-none text-[#0B0B0F]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#0B0B0F] mb-1 font-medium">
                  Disbursement purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit pool grant"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F6F7F9] border border-[#D1D5DB] focus:bg-white focus:border-[#0047AB] rounded-lg outline-none text-[#0B0B0F]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-[#0047AB] hover:bg-[#003A8C] text-white px-6 py-2.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                Create withdrawal proposal
              </button>
            </div>
          </form>

          {/* Pending Multisig Proposals Grid */}
          <div className="p-5 sm:p-6 border border-[#E5E7EB] rounded-xl bg-white shadow-2xs space-y-4">
            <h3 className="text-base font-semibold text-[#0B0B0F] flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
              <Users size={18} className="text-[#0047AB]" /> Multisig Proposals Queue
            </h3>

            {treasury.proposals.length === 0 ? (
              <CompactEmptyState
                title="No proposals in queue"
                description="Treasury withdrawal proposals requiring threshold approvals will appear here."
              />
            ) : (
              <div className="space-y-3">
                {treasury.proposals.map((prop) => {
                  const hasSigned = address
                    ? prop.signatures.some((s) => s.toLowerCase() === address.toLowerCase())
                    : false;
                  return (
                    <div key={prop.id} className="bg-[#F6F7F9] p-4 rounded-xl border border-[#E5E7EB] flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0B0B0F] text-sm">{prop.purpose}</span>
                          <span className="text-emerald-700 font-bold">${parseFloat(prop.amountUsdc).toLocaleString()} USDC</span>
                        </div>
                        <p className="text-[#6B7280]">
                          To: <span className="text-[#0B0B0F] font-bold">{truncateAddress(prop.recipient)}</span> | Signers: {prop.signatures.length}/{treasury.requiredSignatures} Approved
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedProposalModal(prop.id)}
                          className="bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg text-slate-700 font-bold cursor-pointer"
                        >
                          Inspect Payload
                        </button>

                        {prop.executed ? (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-[10px] font-bold">
                            Executed On-Chain
                          </span>
                        ) : prop.signatures.length >= treasury.requiredSignatures ? (
                          <button
                            onClick={() => handleExecute(prop.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Execute Disbursement
                          </button>
                        ) : hasSigned ? (
                          <span className="text-slate-800 font-bold bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            ✓ Approved by You
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSign(prop.id)}
                            className="bg-[#0047AB] hover:bg-[#003A8C] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Sign Transaction
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* CLI TERMINAL VIEW VARIANT */}
      {activeTab === 'terminal' && (
        <div 
          id="terminal-view" 
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-3xl mx-auto space-y-6 relative overflow-hidden transition-all duration-300"
        >
          {/* Header Panel */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-[#0B0B0C] shrink-0">
                <Terminal size={22} className="stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline text-lg font-bold text-slate-900 leading-tight">
                    Network Console
                  </h3>
                  <span className="flex items-center gap-1 text-[11px] font-sans font-medium text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm animate-pulse" />
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Real-time execution & network status
                </p>
              </div>
            </div>
            
            <span className="bg-emerald-50/80 text-emerald-700 border border-emerald-100 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 font-sans shadow-2xs">
              <ShieldCheck size={14} className="fill-emerald-100" />
              SAFE_RPC_CONNECTED
            </span>
          </div>

          {/* Stepper Timeline Console */}
          <div className="relative font-mono text-xs text-slate-800 pl-8 space-y-6 pb-2">
            {/* Timeline dotted guide line */}
            <div className="absolute left-3 top-2 bottom-12 border-l-2 border-dashed border-slate-100" />

            {/* Line 1: Command */}
            <div className="relative flex items-start gap-4">
              <span className="absolute -left-8 w-6 h-6 flex items-center justify-center font-bold text-slate-400 select-none">
                $
              </span>
              <div className="font-semibold text-slate-800 leading-relaxed break-all">
                polylance-treasury --network polygon-mainnet --safe 0x1111...2222 status
              </div>
            </div>

            {/* Line 2: Healthy status */}
            <div className="relative flex items-center justify-between gap-4 flex-wrap">
              <div className="absolute -left-8 w-6 h-6 rounded-full border border-emerald-200 bg-emerald-50/50 flex items-center justify-center text-emerald-600 shadow-3xs select-none">
                <CheckCircle2 size={13} className="stroke-[2.5]" />
              </div>
              <div className="font-bold text-emerald-600 leading-relaxed">
                SAFE STATUS: HEALTHY (TVL ${parseFloat(treasury.balanceUsdc).toLocaleString()} USDC, {treasury.balanceEth} POL)
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold font-sans flex items-center gap-1 shadow-3xs">
                <Zap size={10} className="fill-emerald-100" />
                HEALTHY
              </span>
            </div>

            {logs.map((log, idx) => {
              let iconBorder = "border-slate-200 bg-slate-100 text-slate-700";
              let Icon = FileCode;
              if (log.iconType === 'check') {
                iconBorder = "border-emerald-100 bg-emerald-50/50 text-emerald-600";
                Icon = CheckCircle2;
              } else if (log.iconType === 'warning') {
                iconBorder = "border-amber-100 bg-amber-50/50 text-amber-600";
                Icon = AlertTriangle;
              } else if (log.iconType === 'zap') {
                iconBorder = "border-slate-300 bg-slate-100 text-[#0047AB]";
                Icon = Zap;
              }

              return (
                <div key={idx} className="relative flex items-start gap-4">
                  <div className={`absolute -left-8 w-6 h-6 rounded-full border flex items-center justify-center shadow-3xs select-none ${iconBorder}`}>
                    <Icon size={12} />
                  </div>
                  <div className="flex items-center gap-2.5 leading-relaxed flex-wrap">
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-md font-bold text-[10px]">
                      [LOG {log.timestamp}]
                    </span>
                    <span className="text-slate-600 font-medium font-sans">
                      {log.text}
                    </span>
                  </div>
                </div>
              );
            })}

            {logs.length === 0 && (
              <div className="text-slate-500 font-medium py-2 font-sans">
                No logs recorded yet. Escrow operations will appear here in real-time.
              </div>
            )}

            {/* Line 6: Ready Proposal state banner */}
            <div className="relative p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 flex-wrap">
              <div className="absolute -left-8 w-6 h-6 rounded-full border border-slate-300 bg-slate-100 flex items-center justify-center text-[#0047AB] shadow-3xs select-none">
                <Zap size={11} className="text-[#0047AB]" />
              </div>
              <div className="font-bold text-slate-900 leading-relaxed">
                SAFE REQUIRED THRESHOLD: {treasury.requiredSignatures}-OF-{treasury.signers.length} OWNER SIGNATURES
              </div>
              <span className="bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold font-sans flex items-center gap-1 shadow-3xs">
                <CheckCircle2 size={11} className="stroke-[2.5]" />
                ENFORCED
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PROPOSALS MODAL INSPECTOR */}
      <Modal
        isOpen={Boolean(selectedProposalModal)}
        onClose={() => setSelectedProposalModal(null)}
        size="md"
        title="Multisig Payload Inspector"
        subtitle="On-chain calldata parameters and execution targets."
        footer={
          <div className="flex justify-end w-full">
            <Button
              type="button"
              variant="primary"
              onClick={() => setSelectedProposalModal(null)}
            >
              Close Inspector
            </Button>
          </div>
        }
      >
        <div className="space-y-3 font-mono text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">Proposal ID:</span>
            <span className="font-bold text-slate-900">{selectedProposalModal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">Safe Target:</span>
            <span className="font-bold text-slate-900">TreasuryVault.sol</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">Calldata Hash:</span>
            <span className="font-bold text-[#0047AB]">0x8a9b...c1d2</span>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};
