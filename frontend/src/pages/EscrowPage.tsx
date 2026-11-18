import React from 'react';
import { ShieldCheck, Lock, ExternalLink, CheckCircle2, AlertTriangle, FileCode } from 'lucide-react';
import { Seo } from '../components/seo/Seo';
import { FaqSection } from '../components/faq/FaqSection';

export const EscrowPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B0B0C] flex flex-col">
      <Seo routeKey="/escrow" />

      {/* Header */}
      <header className="w-full bg-white border-b border-[#E2E6EC] py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7EEF9] text-[#0047AB] text-xs font-bold tracking-wide">
            <Lock size={14} />
            <span>SMART CONTRACT ESCROW</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B0B0C] tracking-tight">
            Non-Custodial Escrow on Polygon PoS
          </h1>
          <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
            Funds are locked in verified smart contracts, not bank accounts. Milestone payments release automatically upon approved deliverables or JudgeDAO arbitration.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1540px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
        {/* Verified Protocol Card */}
        <section className="bg-white rounded-3xl border border-[#E2E6EC] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <FileCode size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0B0B0C]">Non-Custodial Escrow Architecture</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Autonomous bytecode deployed and verified on Polygon PoS (Chain ID: 137)
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold shrink-0">
            <span>Verified Bytecode</span>
          </span>
        </section>

        {/* Escrow State Safeguards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-[#E2E6EC] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#E7EEF9] text-[#0047AB] flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="text-base font-bold text-[#0B0B0C]">No Unilateral Withdrawals</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Once an escrow is funded, neither client nor platform can withdraw tokens unilaterally. Funds only move through mutual cancellation, approved completion, or an arbitrator ruling.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E2E6EC] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#E7EEF9] text-[#0047AB] flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="text-base font-bold text-[#0B0B0C]">Automated Review Timeout</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Clients have a 7-day review window. If a client goes silent after work is submitted, freelancers can invoke <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">claimAutoRelease()</code> directly on-chain.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E2E6EC] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#E7EEF9] text-[#0047AB] flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="text-base font-bold text-[#0B0B0C]">Decentralized JudgeDAO</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              In disputes, designated arbitrators evaluate IPFS evidence hashes and can split or release funds without central platform custody.
            </p>
          </div>
        </div>

        {/* Escrow FAQs */}
        <FaqSection pageId="/escrow" />
      </main>
    </div>
  );
};

export default EscrowPage;
