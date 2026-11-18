import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  Award,
  Scale,
  ShieldCheck,
  MessageSquare,
  Percent,
  ArrowRight,
  Check,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import { Job, UserProfile } from '../../types';

export interface FeaturesSectionProps {
  jobs?: Job[];
  profiles?: Record<string, UserProfile>;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = () => {
  // Interactive mini-stepper state for Escrow card
  const [escrowStep, setEscrowStep] = useState<number>(0);
  const [isEscrowHovered, setIsEscrowHovered] = useState<boolean>(false);

  useEffect(() => {
    if (isEscrowHovered) return;
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const timer = setInterval(() => {
      setEscrowStep((prev) => (prev + 1) % 3);
    }, 2800);
    return () => clearInterval(timer);
  }, [isEscrowHovered]);

  const cards = [
    {
      id: 'escrow',
      icon: Lock,
      tag: 'Smart Contract',
      title: 'Autonomous Escrow',
      description: 'Milestone collateral is locked in non-custodial bytecode on Polygon PoS and released only when you approve.',
      href: '/escrow-simulator',
      linkText: 'Simulate escrow flow',
      customVisual: (
        <div
          className="w-full h-9 rounded-xl bg-slate-50 border border-slate-200/80 px-2.5 flex items-center justify-between text-xs cursor-pointer select-none"
          onClick={() => setEscrowStep((prev) => (prev + 1) % 3)}
          title="Click to advance escrow step"
        >
          <div className="flex items-center gap-1.5">
            {[
              { idx: 0, label: 'Locked' },
              { idx: 1, label: 'In Review' },
              { idx: 2, label: 'Released' },
            ].map((s) => (
              <span
                key={s.idx}
                className={`px-2 py-0.5 rounded-md text-[10.5px] font-semibold transition-all duration-200 ${
                  escrowStep === s.idx
                    ? 'bg-[#0047AB] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {s.label}
              </span>
            ))}
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 inline-flex items-center gap-1">
            <Check size={10} className="stroke-[3]" /> Non-Custodial
          </span>
        </div>
      ),
    },
    {
      id: 'certs',
      icon: Award,
      tag: 'Reputation',
      title: 'Verified Work Certificates',
      description: 'Finished projects mint non-transferable ERC-5192 Soulbound credentials directly to recipient wallets.',
      href: '/certifiedpass',
      linkText: 'CertifiedPass Registry',
      customVisual: (
        <div className="w-full h-9 rounded-xl bg-gradient-to-r from-blue-50/60 via-slate-50 to-emerald-50/40 border border-slate-200/80 px-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[10.5px] font-bold text-[#0047AB] tracking-tight">CertifiedPass™</span>
            <span className="text-[9.5px] font-mono font-semibold px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200">
              ERC-5192
            </span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 inline-flex items-center gap-1">
            <Sparkles size={11} className="text-[#0047AB]" /> Sealed On-Chain
          </span>
        </div>
      ),
    },
    {
      id: 'disputes',
      icon: Scale,
      tag: 'Governance',
      title: 'Peer Arbitration',
      description: 'Contested milestones are evaluated by a 3-judge decentralized peer panel with transparent evidence windows.',
      href: '/how-it-works#disputes',
      linkText: 'Read dispute rules',
      customVisual: (
        <div className="w-full h-9 rounded-xl bg-slate-50 border border-slate-200/80 px-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
            <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-[#0047AB] flex items-center justify-center text-[10px] font-bold">
              3
            </span>
            <span>Juror Panel</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
            <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">72h Window</span>
            <span className="text-[#0047AB] font-semibold">On-Chain Verdict</span>
          </div>
        </div>
      ),
    },
    {
      id: 'reputation',
      icon: ShieldCheck,
      tag: 'Ownership',
      title: 'Self-Sovereign Identity',
      description: 'Ratings and verified credentials belong to your wallet address. Take your career reputation anywhere on web3.',
      href: '/reputation',
      linkText: 'Reputation Leaderboard',
      customVisual: (
        <div className="w-full h-9 rounded-xl bg-slate-50 border border-slate-200/80 px-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Shield size={13} className="text-[#0047AB]" />
            <span className="text-[11px] font-semibold text-slate-800">Wallet-Linked Proof</span>
          </div>
          <span className="text-[10px] font-semibold text-[#0047AB] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
            Polygon PoS
          </span>
        </div>
      ),
    },
    {
      id: 'messaging',
      icon: MessageSquare,
      tag: 'Privacy',
      title: 'Encrypted Communication',
      description: 'Direct project communication protected by TLS 1.3 and wallet signatures. Zero phone numbers or email stored.',
      href: '/privacy#messaging-privacy',
      linkText: 'Data Protection Policy',
      customVisual: (
        <div className="w-full h-9 rounded-xl bg-slate-50 border border-slate-200/80 px-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>TLS 1.3 Encrypted</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
            EIP-4361 Auth
          </span>
        </div>
      ),
    },
    {
      id: 'fees',
      icon: Percent,
      tag: 'Transparent',
      title: 'Symmetric 5% Protocol Fee',
      description: 'Flat 2.5% client deposit fee and 2.5% freelancer payout fee. Zero withdrawal deductions or hidden currency spreads.',
      href: '/fees',
      linkText: 'Fee Schedule & Simulator',
      customVisual: (
        <div className="w-full h-9 rounded-xl bg-slate-50 border border-slate-200/80 px-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] font-semibold text-slate-700">Client 2.5%</span>
            <span className="text-slate-300">/</span>
            <span className="text-[10.5px] font-semibold text-slate-700">Freelancer 2.5%</span>
          </div>
          <span className="text-[10px] font-bold text-[#0047AB] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
            5% Total · $0 Exit Fee
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Refined Apple-Style 3-Column Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
        {cards.map((card) => {
          const IconComponent = card.icon;
          return (
            <article
              key={card.id}
              className="bg-white border border-slate-200/90 rounded-[20px] p-5 sm:p-5.5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(0,71,171,0.08)] hover:-translate-y-1 hover:border-[#0047AB]/40 transition-all duration-200 ease-out flex flex-col justify-between text-left group active:scale-[0.985]"
              onMouseEnter={() => card.id === 'escrow' && setIsEscrowHovered(true)}
              onMouseLeave={() => card.id === 'escrow' && setIsEscrowHovered(false)}
            >
              <div>
                {/* Header: Icon + Category Pill */}
                <div className="flex items-center justify-between gap-3 mb-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] border border-[#D0DEF2] text-[#0047AB] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                    <IconComponent size={17} strokeWidth={2.2} />
                  </div>
                  <span className="text-[11px] font-semibold tracking-wide text-[#0047AB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#D0DEF2]">
                    {card.tag}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-[17px] leading-[1.3] font-bold text-[#0B0B0F] tracking-tight mb-1.5">
                  {card.title}
                </h3>
                <p className="text-[13px] leading-[1.5] text-[#4B5563] line-clamp-2 mb-3.5">
                  {card.description}
                </p>

                {/* Compact Apple Micro-Visual (Height 36px) */}
                <div className="mb-4">
                  {card.customVisual}
                </div>
              </div>

              {/* Pinned Action Link */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={card.href}
                  className="text-[12.5px] font-semibold text-[#0047AB] hover:text-[#00388A] inline-flex items-center gap-1 group/link transition-colors focus:outline-none focus:underline"
                >
                  <span>{card.linkText}</span>
                  <ArrowRight size={13} className="transition-transform group-hover/link:translate-x-1 duration-150" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
