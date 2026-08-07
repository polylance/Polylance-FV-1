import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { truncateAddress } from '../utils/formatters';
import { ShieldCheck, Terminal, DollarSign, Users, CheckCircle2, AlertTriangle, FileCode, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Treasury: React.FC = () => {
  const { address } = useWeb3();
  const { treasury, proposeTreasuryWithdrawal, signTreasuryWithdrawal, executeTreasuryWithdrawal } = usePolyLanceData();

  const [recipient, setRecipient] = useState('');
  const [amountUsdc, setAmountUsdc] = useState('');
  const [purpose, setPurpose] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'terminal' | 'governance'>('overview');
  const [selectedProposalModal, setSelectedProposalModal] = useState<string | null>(null);

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
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      {/* Restricted Header matching treasury_admin_management/code.html */}
      <div className="glass-panel p-6 sm:p-8 border-purple-200 bg-white hard-shadow space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="text-purple-700" /> Safe Multisig Treasury Admin
              </h1>
              <span className="bg-purple-100 text-purple-900 border border-purple-200 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                Restricted Access
              </span>
            </div>
            <p className="text-xs text-slate-600 font-mono">
              TREASURY_ADMIN_ROLE: <span className="text-purple-900 font-bold">{truncateAddress(address)}</span> ({treasury.requiredSignatures}-of-{treasury.signers.length} Threshold Safe)
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'overview' ? 'bg-purple-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => {
                setActiveTab('terminal');
                setTimeout(() => {
                  document.getElementById('terminal-view')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 80);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'terminal' ? 'bg-purple-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              CLI Terminal Log
            </button>
          </div>
        </div>

        {/* Executive Summary Cards matching reference HTML */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 border-slate-200 bg-white space-y-2">
            <p className="font-label-mono text-xs text-slate-500 font-bold">Available Treasury Balance</p>
            <h4 className="font-headline text-3xl font-black text-emerald-700">
              ${parseFloat(treasury.balanceUsdc).toLocaleString()} USDC
            </h4>
            <div className="text-[11px] font-mono text-slate-500 font-medium pt-1">
              Accumulated from 2.5% platform job fees
            </div>
          </div>

          <div className="glass-panel p-6 border-slate-200 bg-white space-y-2">
            <p className="font-label-mono text-xs text-slate-500 font-bold">Native Gas Vault</p>
            <h4 className="font-headline text-3xl font-black text-purple-900">
              {treasury.balanceEth} ETH
            </h4>
            <div className="text-[11px] font-mono text-slate-500 font-medium pt-1">
              Polygon Gas Subsidy Vault
            </div>
          </div>

          <div className="glass-panel p-6 border-slate-200 bg-white space-y-2">
            <p className="font-label-mono text-xs text-slate-500 font-bold">Required Signatures</p>
            <h4 className="font-headline text-3xl font-black text-purple-900">
              {treasury.requiredSignatures} of {treasury.signers.length} Safe Owners
            </h4>
            <div className="text-[11px] font-mono text-slate-500 font-medium pt-1">
              Gnosis Safe v1.3.0 Standard
            </div>
          </div>
        </div>
      </div>

      {/* OVERVIEW TAB CONTENT */}
      {activeTab === 'overview' && (
        <>
          {/* Propose Multisig Withdrawal Form matching reference HTML */}
          <form onSubmit={handlePropose} className="glass-panel p-6 sm:p-8 border-purple-200 bg-white hard-shadow space-y-6">
            <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
              <DollarSign size={20} className="text-purple-700" /> Propose Multisig Disbursement
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-label-mono text-xs text-slate-700 uppercase tracking-wider mb-1 font-bold">
                  Recipient Wallet Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="block font-label-mono text-xs text-slate-700 uppercase tracking-wider mb-1 font-bold">
                  Amount (USDC) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="1000"
                  value={amountUsdc}
                  onChange={(e) => setAmountUsdc(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="block font-label-mono text-xs text-slate-700 uppercase tracking-wider mb-1 font-bold">
                  Disbursement Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit Pool Grant"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="gradient-btn-primary px-8 py-3 rounded-xl font-headline font-bold text-xs">
                Create Withdrawal Proposal
              </button>
            </div>
          </form>

          {/* Pending Multisig Proposals Grid matching reference HTML */}
          <div className="glass-panel p-6 sm:p-8 border-slate-200 bg-white hard-shadow space-y-4">
            <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-purple-700" /> Multisig Proposals Queue
            </h3>

            <div className="space-y-4">
              {treasury.proposals.map((prop) => {
                const hasSigned = prop.signatures.some((s) => s.toLowerCase() === address.toLowerCase());
                return (
                  <div key={prop.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{prop.purpose}</span>
                        <span className="text-emerald-700 font-bold">${parseFloat(prop.amountUsdc).toLocaleString()} USDC</span>
                      </div>
                      <p className="text-slate-600">
                        To: <span className="text-purple-900 font-bold">{truncateAddress(prop.recipient)}</span> | Signers: {prop.signatures.length}/{treasury.requiredSignatures} Approved
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedProposalModal(prop.id)}
                        className="bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg text-slate-700 font-bold"
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
                          className="gradient-btn-emerald px-4 py-2 rounded-xl text-xs font-bold"
                        >
                          Execute Disbursement
                        </button>
                      ) : hasSigned ? (
                        <span className="text-purple-800 font-bold bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
                          ✓ Approved by You
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSign(prop.id)}
                          className="gradient-btn-primary px-4 py-2 rounded-xl text-xs font-bold"
                        >
                          Sign Transaction
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* CLI TERMINAL VIEW VARIANT matching treasury_terminal_view_variant */}
      {activeTab === 'terminal' && (
        <div 
          id="terminal-view" 
          className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 max-w-3xl mx-auto space-y-6 relative overflow-hidden transition-all duration-300"
        >
          {/* Header Panel */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
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
                SAFE STATUS: HEALTHY (TVL ${parseFloat(treasury.balanceUsdc).toLocaleString()} USDC, {treasury.balanceEth} ETH)
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold font-sans flex items-center gap-1 shadow-3xs">
                <Zap size={10} className="fill-emerald-100" />
                HEALTHY
              </span>
            </div>

            {/* Line 3: Log item 1 */}
            <div className="relative flex items-start gap-4">
              <div className="absolute -left-8 w-6 h-6 rounded-full border border-indigo-100 bg-indigo-50/50 flex items-center justify-center text-indigo-600 shadow-3xs select-none">
                <FileCode size={12} />
              </div>
              <div className="flex items-center gap-2.5 leading-relaxed flex-wrap">
                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md font-bold text-[10px]">
                  [LOG 14:02:18]
                </span>
                <span className="text-slate-600 font-medium">
                  Job #POL-101 Escrow Completed - Fee Ingestion +$112.50 USDC
                </span>
              </div>
            </div>

            {/* Line 4: Log item 2 */}
            <div className="relative flex items-start gap-4">
              <div className="absolute -left-8 w-6 h-6 rounded-full border border-indigo-100 bg-indigo-50/50 flex items-center justify-center text-indigo-600 shadow-3xs select-none">
                <FileCode size={12} />
              </div>
              <div className="flex items-center gap-2.5 leading-relaxed flex-wrap">
                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md font-bold text-[10px]">
                  [LOG 14:15:44]
                </span>
                <span className="text-slate-600 font-medium">
                  Multisig Proposal #1 Created by Owner 0x9999...0000
                </span>
              </div>
            </div>

            {/* Line 5: Log item 3 */}
            <div className="relative flex items-start gap-4">
              <div className="absolute -left-8 w-6 h-6 rounded-full border border-indigo-100 bg-indigo-50/50 flex items-center justify-center text-indigo-600 shadow-3xs select-none">
                <FileCode size={12} />
              </div>
              <div className="flex items-center gap-2.5 leading-relaxed flex-wrap">
                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md font-bold text-[10px]">
                  [LOG 14:16:02]
                </span>
                <span className="text-slate-600 font-medium">
                  EIP-712 Signature Appended by Owner 0x9999...0000
                </span>
              </div>
            </div>

            {/* Line 6: Ready Proposal state banner */}
            <div className="relative p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between gap-4 flex-wrap">
              <div className="absolute -left-8 w-6 h-6 rounded-full border border-purple-200 bg-purple-100/80 flex items-center justify-center text-purple-700 shadow-3xs select-none">
                <Zap size={11} className="fill-purple-300 text-purple-700" />
              </div>
              <div className="font-bold text-purple-700 leading-relaxed">
                SAFE REQUIRED THRESHOLD: {treasury.requiredSignatures}-OF-{treasury.signers.length} OWNER SIGNATURES
              </div>
              <span className="bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1 rounded-full text-[10px] font-bold font-sans flex items-center gap-1 shadow-3xs">
                <CheckCircle2 size={11} className="stroke-[2.5]" />
                ENFORCED
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PROPOSALS MODAL INSPECTOR matching treasury_proposed_changes_approval_modal */}
      {selectedProposalModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl max-w-lg w-full border-purple-200 bg-white hard-shadow space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileCode size={18} className="text-purple-700" /> Multisig Payload Inspector
              </h3>
              <button onClick={() => setSelectedProposalModal(null)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Proposal ID:</span>
                <span className="font-bold text-slate-900">{selectedProposalModal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Safe Target:</span>
                <span className="font-bold text-purple-900">TreasuryVault.sol</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Calldata Hash:</span>
                <span className="font-bold text-purple-700">0x8a9b...c1d2</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedProposalModal(null)}
                className="gradient-btn-primary px-6 py-2 rounded-xl text-xs font-bold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
