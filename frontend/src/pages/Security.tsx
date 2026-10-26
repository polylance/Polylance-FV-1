import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, Lock, ExternalLink, Cpu, Sparkles, CheckCircle2, Award, ShieldAlert,
  Layers, Check
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Seo } from '../components/seo/Seo';
import { FaqSection } from '../components/faq/FaqSection';

export const Security: React.FC = () => {
  const securityStandards = [
    { name: 'Job Factory (Proxy Creator)', spec: 'EIP-1167 Minimal Proxy Standard', desc: 'Isolates escrow state so projects never share contract storage or funds.' },
    { name: 'Escrow Vault Bytecode', spec: 'Non-Custodial Lock & Auto-Release', desc: 'Funds release only on client milestone approval or 7-day inactivity rule.' },
    { name: 'Reputation Credentials', spec: 'ERC-5192 Soulbound Token Standard', desc: 'Immutable work history tied permanently to recipient wallet addresses.' },
    { name: 'Decentralized Arbitration', spec: '3-Juror Quorum Review DAO', desc: 'Independent evidence evaluation with on-chain cryptographic signatures.' },
    { name: 'Protocol Governance', spec: 'Multi-Sig Timelock Architecture', desc: 'Zero unilateral administrative backdoors or emergency drainage functions.' },
  ];

  return (
    <PageContainer className="space-y-6 py-6 w-full text-[#0B0B0F]">
      <Seo routeKey="/security" />
      <PageHeader
        title="Security, Audit Status & Protocol Architecture"
        subtitle="PolyLance smart contracts are built using OpenZeppelin primitives, protected against reentrancy attacks, and deployed with zero administrative backdoors."
        actions={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md border border-amber-200 font-semibold flex items-center gap-1">
              <ShieldAlert size={13} className="text-amber-600" /> Independent Audit Pending
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-100 font-semibold flex items-center gap-1">
              <CheckCircle2 size={13} /> 34 Hardhat Tests Passing
            </span>
            <span className="bg-[#F6F7F9] text-[#4B5563] px-2.5 py-1 rounded-md border border-[#E5E7EB] font-medium font-mono">
              Solidity 0.8.28
            </span>
          </div>
        }
      />

      {/* Truthful Audit Status & Advisory Banner */}
      <section className="bg-white border-2 border-amber-200/90 rounded-3xl p-6 sm:p-7 shadow-xs text-left space-y-3">
        <div className="flex items-center gap-2 text-amber-800 font-bold text-sm sm:text-base">
          <ShieldAlert size={20} className="text-amber-600 shrink-0" />
          <span>Audit Status & Advisory Notice</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed font-normal">
          PolyLance&apos;s escrow contracts operate on non-custodial bytecode deployed on Polygon PoS. An external audit by an independent third-party firm is scheduled. Until an external audit is completed, we advise users to start with smaller contracts and fund milestones incrementally.
        </p>
      </section>

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

      {/* Verified Smart Contract Standards Card (Confidential & Protected) */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs text-left space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0047AB] flex items-center justify-center shrink-0 border border-blue-100">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="font-headline font-bold text-xl text-slate-900">
                Verified On-Chain Architecture & Standards
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Engineered with OpenZeppelin security contracts on Polygon PoS
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check size={12} className="stroke-[3]" /> Polygon PoS · Chain ID 137
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {securityStandards.map((std) => (
            <div
              key={std.name}
              className="p-4 rounded-2xl bg-[#F6F7F9] border border-[#E5E7EB] space-y-2 hover:border-[#0047AB]/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-slate-900">{std.name}</span>
              </div>
              <div className="text-[11px] font-mono font-semibold text-[#0047AB] bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100 inline-block">
                {std.spec}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {std.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Security FAQ */}
      <FaqSection pageId="/security" title="Security & Escrow FAQ" className="py-6" />

    </PageContainer>
  );
};
