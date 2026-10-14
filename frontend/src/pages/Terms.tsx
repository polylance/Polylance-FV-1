import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scale, Award, Lock, CheckCircle2, 
  ChevronRight, Sparkles, ArrowRight, Cpu, ArrowUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';

export const Terms: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const sections = [
    {
      id: 'escrow',
      title: '1. Non-Custodial Smart Escrow Mechanics',
      icon: Lock,
      badge: 'EIP-1167 Proxy Clone',
      summary: 'All project funds deposited by Clients are locked directly into individual EIP-1167 Minimal Proxy Clone contracts deployed on the Polygon blockchain.',
      details: [
        'No centralized entity, exchange, or team member holds custody of user funds at any point.',
        'Funds can only be disbursed via cryptographic signatures from the Client (milestone approval), mutual cancellation agreement, or automated dispute resolution by an appointed Arbitrator.',
        'Smart contracts operate autonomously according to open-source bytecode deployed on Polygon Mainnet.'
      ]
    },
    {
      id: 'milestones',
      title: '2. Review Periods & Auto-Release SLA',
      icon: CheckCircle2,
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
      badge: 'Platform Fee Enforced',
      summary: 'PolyLance operates with transparent on-chain execution rules.',
      details: [
        'Users are responsible for standard Polygon network gas fees when broadcasting transactions.',
        'Platform maintenance fees are enforced directly by the JobFactory contract during fee collection.',
        'Users must comply with global laws regarding remote contract labor, anti-money laundering, and digital asset regulation.'
      ]
    }
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageContainer className="py-6 space-y-6 text-[#0B0B0F]">
      {/* Header with 720px reading column */}
      <div className="max-w-[720px] mx-auto text-left">
        <PageHeader
          title="Terms of Service & Escrow Protocol"
          subtitle="Please read these terms carefully. Interacting with PolyLance smart contracts binds your address to these autonomous rules."
        />
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#6B7280]">
          <span className="bg-[#F6F7F9] px-2.5 py-1 rounded-md border border-[#E5E7EB] font-medium">
            Last updated: August 2026
          </span>
          <span className="bg-[#F6F7F9] text-[#374151] px-2.5 py-1 rounded-md border border-[#E5E7EB] font-medium">
            Protocol version: V1.0-Mainnet
          </span>
        </div>
      </div>

      {/* Main Layout: Sticky Index + 720px Content Card */}
      <div className="max-w-[1080px] mx-auto space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        {/* Mobile Horizontal Selector */}
        <div className="lg:hidden space-y-2 max-w-[720px] mx-auto w-full">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold text-[#6B7280]">
              Contract terms index
            </h3>
            <span className="text-[11px] text-[#374151] font-medium bg-[#F6F7F9] px-2.5 py-0.5 rounded-full border border-[#E5E7EB]">
              {activeTab + 1} of {sections.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-0.5">
            {sections.map((sec, idx) => {
              const Icon = sec.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#EAF1FB] text-[#0047AB] border border-[#0047AB]/30 font-semibold'
                      : 'bg-white border border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7F9]'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-[#0047AB]' : 'text-[#6B7280]'} />
                  <span>
                    {sec.id === 'escrow' ? '1. Escrow' : 
                     sec.id === 'milestones' ? '2. SLA release' : 
                     sec.id === 'disputes' ? '3. Disputes' : 
                     sec.id === 'sbt' ? '4. SBT tokens' : 
                     '5. Gas & rules'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Sticky Index (left side) */}
        <div className="hidden lg:block lg:col-span-5 sticky top-24 space-y-3 text-left">
          <h3 className="text-xs font-semibold text-[#6B7280] px-2">
            Contract terms index
          </h3>
          
          <div className="space-y-2">
            {sections.map((sec, idx) => {
              const Icon = sec.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-[#EAF1FB] text-[#0047AB] border-l-4 border-l-[#0047AB] border-y-[#0047AB]/20 border-r-[#0047AB]/20 shadow-xs'
                      : 'bg-white border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7F9]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-[#0047AB] text-white' : 'bg-[#F6F7F9] text-[#6B7280] border border-[#E5E7EB]'
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 text-left">
                      <span className={`text-sm block truncate ${isActive ? 'font-bold text-[#0047AB]' : 'font-medium text-[#0B0B0F]'}`}>
                        {sec.title}
                      </span>
                      <span className={`text-[11px] ${isActive ? 'text-[#0047AB]/80 font-medium' : 'text-[#6B7280]'}`}>
                        {sec.badge}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={15} className={`shrink-0 transition-transform ${isActive ? 'text-[#0047AB] translate-x-0.5' : 'text-[#9CA3AF]'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail View Window (720px max column) */}
        <div className="lg:col-span-7 max-w-[720px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs text-left space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center text-[#0047AB] shrink-0">
                    {React.createElement(sections[activeTab].icon, { size: 18 })}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0B0B0F] leading-tight">
                    {sections[activeTab].title}
                  </h2>
                </div>
                <span className="px-2.5 py-1 bg-[#F6F7F9] border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-full shrink-0 self-start sm:self-auto">
                  {sections[activeTab].badge}
                </span>
              </div>

              <div className="p-4 bg-[#F6F7F9] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#374151] font-normal leading-relaxed">
                {sections[activeTab].summary}
              </div>

              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-semibold text-[#6B7280]">
                  Specific enforced rules & protocol behaviors
                </h4>
                <ul className="space-y-3">
                  {sections[activeTab].details.map((detail, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-3 text-xs sm:text-sm text-[#374151] leading-relaxed">
                      <div className="w-5 h-5 rounded-full bg-[#EAF1FB] text-[#0047AB] flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                        ✓
                      </div>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#6B7280]">
                <span>Autonomous smart contract logic on Polygon</span>
                <div className="flex items-center gap-4">
                  <button 
                    type="button" 
                    onClick={scrollToTop}
                    className="text-[#6B7280] hover:text-[#0B0B0F] inline-flex items-center gap-1 cursor-pointer font-medium"
                  >
                    Back to top <ArrowUp size={12} />
                  </button>
                  <Link to="/security" className="text-[#0047AB] font-semibold hover:underline inline-flex items-center gap-1">
                    View security audits <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </PageContainer>
  );
};

export default Terms;
