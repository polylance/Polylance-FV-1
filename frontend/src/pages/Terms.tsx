import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scale, Award, Lock, CheckCircle2, 
  ChevronRight, Sparkles, ArrowRight, Cpu
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Terms: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const sections = [
    {
      id: 'escrow',
      title: '1. Non-Custodial Smart Escrow Mechanics',
      icon: Lock,
      color: 'from-purple-600 to-indigo-600',
      badge: 'EIP-1167 Proxy Clone',
      summary: 'All project funds deposited by Clients are locked directly into individual EIP-1167 Minimal Proxy Clone contracts deployed on the Polygon blockchain.',
      details: [
        'No centralized entity, exchange, or team member holds custody of user funds at any point.',
        'Funds can only be disbursed via cryptographic signatures from the Client (milestone approval), mutual cancellation agreement, or automated dispute resolution by an appointed Arbitrator.',
        'Smart contracts operate autonomously according to open-source bytecode deployed on Polygon Amoy testnet (and mainnet).'
      ]
    },
    {
      id: 'milestones',
      title: '2. Review Periods & Auto-Release SLA',
      icon: CheckCircle2,
      color: 'from-blue-600 to-cyan-600',
      badge: '7-Day SLA Default',
      summary: 'Developers submit proof of deliverable (code PRs, IPFS hashes, or documentation) which triggers a timed review window for the Client.',
      details: [
        'By default, Clients have a 7-day review period to verify delivered work against initial project specifications.',
        'If the Client takes no action (neither approving nor raising a dispute) within the review window, the claimAutoRelease() function can be called on-chain by the Developer to automatically release funds.',
        'Clients can grant immediate approval at any time to instantly trigger fund disbursement.'
      ]
    },
    {
      id: 'disputes',
      title: '3. Decentralized Dispute Arbitration',
      icon: Scale,
      color: 'from-rose-600 to-pink-600',
      badge: 'JudgeDAO Governance',
      summary: 'When a Client or Freelancer raises a dispute on a funded escrow, arbitration is delegated to verified Arbitrators holding the ARBITRATOR_ROLE.',
      details: [
        'Arbitrators review on-chain claim statements, submitted IPFS evidence hashes, and GitHub commit records.',
        'Rulings are issued directly on-chain specifying a basis-point split (from 0% to 10,000 bps) between Client and Freelancer.',
        'Arbitrator rulings are final and executed automatically by the smart contract upon submission.'
      ]
    },
    {
      id: 'sbt',
      title: '4. Soulbound Reputation (ERC-5192)',
      icon: Award,
      color: 'from-amber-600 to-orange-600',
      badge: 'Non-Transferable Token',
      summary: 'Successful project completion automatically mints an ERC-5192 Soulbound Token (SBT) to the Developer’s wallet address.',
      details: [
        'SBTs are permanently tied to the recipient’s public key and cannot be sold, transferred, or transferred via transferFrom().',
        'Reputation badges serve as immutable cryptographic proof of professional competence and completed volume.',
        'Any attempt to manipulate or mint unauthorized SBTs outside authorized job contracts is blocked at the smart contract level.'
      ]
    },
    {
      id: 'fees',
      title: '5. Gas Fees & Protocol Operating Rules',
      icon: Cpu,
      color: 'from-emerald-600 to-teal-600',
      badge: '0% Platform Fee on Beta',
      summary: 'PolyLance operates with transparent on-chain execution rules.',
      details: [
        'Users are responsible for standard Polygon network gas fees when broadcasting transactions.',
        'Platform maintenance fees (if applicable) are enforced directly by the JobFactory contract during fee collection.',
        'Users must comply with global laws regarding remote contract labor, anti-money laundering, and digital asset regulation.'
      ]
    }
  ];

  return (
    <div className="space-y-12 py-8 max-w-6xl mx-auto px-4 font-sans text-slate-900 select-none">
      
      {/* 3D Glassmorphic Header */}
      <section className="relative overflow-hidden rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-white/90 via-purple-50/40 to-slate-50 border border-purple-100/80 shadow-md text-left">
        {/* Decorative 3D Floating Ornaments */}
        <div className="hidden lg:block absolute -right-6 -top-6 w-36 h-36 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl rotate-12 opacity-15 blur-sm pointer-events-none" />
        <div className="hidden lg:block absolute right-12 bottom-4 w-28 h-28 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full opacity-20 blur-md pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white border border-purple-200 text-purple-700 rounded-full shadow-3xs text-[11px] font-mono font-black uppercase tracking-wider">
            <Sparkles size={12} className="text-purple-600 animate-pulse" />
            <span>Legal Framework & Smart Contracts</span>
          </div>

          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Terms of Service &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600">
              Escrow Protocol Rules
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed font-medium">
            Please read these terms carefully. By interacting with PolyLance smart contracts on the Polygon blockchain, you agree to bound yourself to the autonomous code execution rules below.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-slate-500">
            <span className="bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 font-bold">
              Last Updated: August 2026
            </span>
            <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-lg border border-purple-100 font-bold">
              Protocol Version: V1.0-Amoy
            </span>
          </div>
        </div>
      </section>

      {/* Interactive 3D Section Selector & Accordion */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive 3D Tab Buttons */}
        <div className="lg:col-span-5 space-y-3 text-left">
          <h3 className="font-mono text-xs font-black uppercase tracking-widest text-slate-400 px-2">
            Contract Terms Index
          </h3>
          
          {sections.map((sec, idx) => {
            const Icon = sec.icon;
            const isActive = activeTab === idx;
            return (
              <motion.div
                key={sec.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(idx)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 shadow-3xs ${
                  isActive
                    ? 'bg-white border-purple-500 ring-2 ring-purple-500/15 shadow-md'
                    : 'bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${sec.color} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="font-satoshi font-bold text-slate-900 text-sm block truncate">
                      {sec.title}
                    </span>
                    <span className="text-[10px] font-mono text-purple-600 font-bold uppercase tracking-wider">
                      {sec.badge}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className={`text-slate-400 transition-transform ${isActive ? 'translate-x-1 text-purple-600' : ''}`} />
              </motion.div>
            );
          })}
        </div>

        {/* Right Column: Dynamic Section Details Window */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md text-left space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${sections[activeTab].color} flex items-center justify-center text-white shadow-sm`}>
                    {React.createElement(sections[activeTab].icon, { size: 20 })}
                  </div>
                  <h3 className="font-headline font-black text-xl text-slate-900">
                    {sections[activeTab].title}
                  </h3>
                </div>
                <span className="px-3 py-1 bg-purple-50 border border-purple-100 text-purple-700 font-mono text-[10px] font-bold rounded-full uppercase">
                  {sections[activeTab].badge}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700 font-medium leading-relaxed">
                {sections[activeTab].summary}
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Specific Enforced Rules & Protocol Behaviors:
                </h4>
                <ul className="space-y-3">
                  {sections[activeTab].details.map((detail, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-3 text-xs text-slate-700 font-sans leading-relaxed font-medium">
                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5 font-bold font-mono text-[10px]">
                        ✓
                      </div>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Autonomous Smart Contract Logic</span>
                <Link to="/security" className="text-purple-600 font-bold hover:underline inline-flex items-center gap-1">
                  View Contract Audits <ArrowRight size={12} />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </section>

    </div>
  );
};
