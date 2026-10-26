import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ShieldCheck, CheckCircle2, ArrowRight, Code, Terminal } from 'lucide-react';
import { Seo } from '../components/seo/Seo';
import { FaqSection } from '../components/faq/FaqSection';

export const ForClientsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B0B0C] flex flex-col">
      <Seo routeKey="/for-clients" />

      {/* Hero */}
      <header className="w-full bg-white border-b border-[#E2E6EC] py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7EEF9] text-[#0047AB] text-xs font-bold tracking-wide">
            <Users size={14} />
            <span>FOR WEB3 FOUNDERS & CLIENTS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B0B0C] tracking-tight">
            Hire Top Web3 Developers with Milestone Escrow
          </h1>
          <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
            Source vetted Solidity, Rust, and frontend Web3 engineers. Fund milestones safely and release payment only after you review verified code deliverables.
          </p>
          <div className="pt-2">
            <Link
              to="/post-job"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0047AB] hover:bg-[#003A8C] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <span>Post a Project</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-14 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#0B0B0C]">Zero Custody Risk</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Your deposited funds remain in the smart contract until you inspect deliverables and click approve. Full control over milestone releases.
            </p>
          </div>

          <div className="p-7 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Terminal size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#0B0B0C]">Verifiable GitHub Track Records</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Review on-chain work certificates and GitHub reputation attestations linked to developer wallet addresses before selecting.
            </p>
          </div>

          <div className="p-7 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Code size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#0B0B0C]">Decentralized Arbitration</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              If deliverables fail to meet agreed specifications, open a dispute with JudgeDAO for fair, technical evidence adjudication.
            </p>
          </div>
        </div>

        <FaqSection pageId="/for-clients" />
      </main>
    </div>
  );
};

export default ForClientsPage;
