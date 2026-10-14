import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, Lock, ExternalLink, Cpu, Sparkles, CheckCircle2, Award, ShieldAlert, Terminal,
  Copy, Check
} from 'lucide-react';
import { CONTRACTS } from '../config/contracts';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';

export const Security: React.FC = () => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const verifiedContracts = [
    { name: 'JobFactory (Proxy Factory)', address: CONTRACTS.JobFactory, spec: 'EIP-1167 Proxy Creator' },
    { name: 'ReputationSBT', address: CONTRACTS.ReputationSBT, spec: 'ERC-721 Soulbound' },
    { name: 'ProfileRegistry', address: CONTRACTS.ProfileRegistry, spec: 'On-Chain Bio & Skills' },
    { name: 'GitHubRegistry', address: CONTRACTS.GithubReputationRegistry, spec: 'Ed25519 Oracle Attestation' },
    { name: 'JudgeDAO', address: CONTRACTS.JudgeDAO, spec: 'Governance Arbitration' },
    { name: 'TimelockController', address: CONTRACTS.TimelockController, spec: 'Multisig Timelock' },
  ];

  return (
    <PageContainer className="space-y-6 py-6 w-full text-[#0B0B0F]">
      <PageHeader
        title="Security and contract audits"
        subtitle="PolyLance smart contracts are built using OpenZeppelin primitives, protected against reentrancy attacks, and deployed with zero administrative backdoors."
        actions={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-100 font-semibold flex items-center gap-1">
              <CheckCircle2 size={13} /> 34 Hardhat Unit Tests Passing
            </span>
            <span className="bg-[#F6F7F9] text-[#4B5563] px-2.5 py-1 rounded-md border border-[#E5E7EB] font-medium font-mono">
              Solidity 0.8.28
            </span>
          </div>
        }
      />

      {/* Security Architecture Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        
        {/* Reentrancy Protection */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3 hover:shadow-md transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-3xs">
            <Lock size={20} />
          </div>
          <h3 className="font-headline font-bold text-lg text-slate-900">
            ReentrancyGuard Protection
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            All escrow fund disbursements (`releasePayment()`, `claimAutoRelease()`, `resolveDispute()`) are protected by nonReentrant modifiers.
          </p>
        </motion.div>

        {/* Minimal Proxy Clones */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3 hover:shadow-md transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#0B0B0C] border border-slate-200 flex items-center justify-center shrink-0 shadow-3xs">
            <Cpu size={20} />
          </div>
          <h3 className="font-headline font-bold text-lg text-slate-900">
            Isolated EIP-1167 Clones
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Each project escrow operates as an independent Minimal Proxy Clone contract. A vulnerability in one escrow cannot affect other users.
          </p>
        </motion.div>

        {/* ERC-5192 Soulbound */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3 hover:shadow-md transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-3xs">
            <Award size={20} />
          </div>
          <h3 className="font-headline font-bold text-lg text-slate-900">
            ERC-5192 Soulbound Tokens
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Reputation tokens are non-transferable at the EVM bytecode level (`transferFrom()` reverts unconditionally), preventing reputation buying.
          </p>
        </motion.div>

      </section>

      {/* Verified Smart Contract Registry Table */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md text-left space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <Terminal size={22} className="text-emerald-600" />
            <h3 className="font-headline font-bold text-xl text-slate-900">
              Verified Polygon Mainnet Smart Contracts
            </h3>
          </div>
          <span className="font-mono text-xs text-slate-500 font-bold">
            Chain ID: 137
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <th className="p-3.5">Contract Name</th>
                <th className="p-3.5">Specification Standard</th>
                <th className="p-3.5">Deployed Address</th>
                <th className="p-3.5">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {verifiedContracts.map((c) => (
                <tr key={c.name} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">{c.name}</td>
                  <td className="p-3.5 text-slate-700 font-semibold">{c.spec}</td>
                  <td className="p-3.5 text-slate-600 font-mono text-[11px]">{c.address}</td>
                  <td className="p-3.5">
                    <a
                      href={`https://polygonscan.com/address/${c.address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0047AB] font-bold hover:underline inline-flex items-center gap-1"
                    >
                      Polygonscan <ExternalLink size={12} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Stack (< md) */}
        <div className="md:hidden space-y-2.5 p-1 sm:p-2">
          {verifiedContracts.map((c) => (
            <div key={c.name} className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/70 space-y-2 shadow-3xs">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">{c.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 whitespace-nowrap shrink-0">
                  {c.spec}
                </span>
              </div>
              
              <div className="flex items-center justify-between gap-2 p-1.5 px-2.5 rounded-xl bg-white border border-slate-200/80 font-mono text-[10.5px] sm:text-[11px] text-slate-700">
                <span className="truncate">{c.address}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(c.address)}
                  title="Copy contract address"
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
                >
                  {copiedAddress === c.address ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-[10px] font-mono text-slate-400">Polygon Mainnet (137)</span>
                <a
                  href={`https://polygonscan.com/address/${c.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] inline-flex items-center gap-1 transition-colors shadow-3xs"
                >
                  <span>Polygonscan</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

    </PageContainer>
  );
};
