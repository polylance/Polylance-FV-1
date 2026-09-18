import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, Lock, ExternalLink, Cpu, Sparkles, CheckCircle2, Award, ShieldAlert, Terminal,
  Copy, Check
} from 'lucide-react';
import { CONTRACTS } from '../config/contracts';

export const Security: React.FC = () => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const verifiedContracts = [
    { name: 'JobFactory (Proxy Factory)', address: CONTRACTS.JobFactory, spec: 'EIP-1167 Proxy Creator' },
    { name: 'ReputationSBT', address: CONTRACTS.ReputationSBT, spec: 'ERC-5192 Soulbound' },
    { name: 'ProfileRegistry', address: CONTRACTS.ProfileRegistry, spec: 'On-Chain Bio & Skills' },
    { name: 'GitHubRegistry', address: CONTRACTS.GithubReputationRegistry, spec: 'Ed25519 Oracle Attestation' },
    { name: 'JudgeDAO', address: CONTRACTS.JudgeDAO, spec: 'Governance Arbitration' },
    { name: 'TimelockController', address: CONTRACTS.TimelockController, spec: 'Multisig Timelock' },
  ];

  return (
    <div className="space-y-12 py-8 max-w-6xl mx-auto px-4 font-sans text-slate-900 select-none">
      
      {/* 3D Glassmorphic Header */}
      <section className="relative overflow-hidden rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-white/90 via-emerald-50/40 to-slate-50 border border-emerald-100/80 shadow-md text-left">
        <div className="hidden lg:block absolute -right-6 -top-6 w-36 h-36 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl rotate-12 opacity-15 blur-sm pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white border border-emerald-200 text-emerald-700 rounded-full shadow-3xs text-[11px] font-mono font-black uppercase tracking-wider">
            <Sparkles size={12} className="text-emerald-600 animate-pulse" />
            <span>Audited Smart Contract Architecture</span>
          </div>

          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Security &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600">
              Contract Audits
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed font-medium">
            PolyLance smart contracts are built using OpenZeppelin v5.0 primitives, protected against reentrancy attacks, and deployed with zero administrative backdoor functions.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-slate-500">
            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-100 font-bold flex items-center gap-1">
              <CheckCircle2 size={13} /> 34 Hardhat Unit Tests Passing
            </span>
            <span className="bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 font-bold">
              Solidity 0.8.28 (Cancun EVM)
            </span>
          </div>
        </div>
      </section>

      {/* Security Architecture Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        
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
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-3xs">
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
                  <td className="p-3.5 text-purple-700 font-semibold">{c.spec}</td>
                  <td className="p-3.5 text-slate-600 font-mono text-[11px]">{c.address}</td>
                  <td className="p-3.5">
                    <a
                      href={`https://polygonscan.com/address/${c.address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
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
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap shrink-0">
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

    </div>
  );
};
