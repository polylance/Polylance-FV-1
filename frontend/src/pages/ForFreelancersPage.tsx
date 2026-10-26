import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, DollarSign, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { Seo } from '../components/seo/Seo';
import { FaqSection } from '../components/faq/FaqSection';

export const ForFreelancersPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B0B0C] flex flex-col">
      <Seo routeKey="/for-freelancers" />

      {/* Hero */}
      <header className="w-full bg-white border-b border-[#E2E6EC] py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7EEF9] text-[#0047AB] text-xs font-bold tracking-wide">
            <Award size={14} />
            <span>BUILT FOR WEB3 FREELANCERS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B0B0C] tracking-tight">
            Earn in Crypto with Guaranteed Smart Contract Escrow
          </h1>
          <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
            Get hired for Solidity, smart contract, and dApp development. Receive instant payouts in USDC and POL with verifiable on-chain work certificates.
          </p>
          <div className="pt-2">
            <Link
              to="/find-jobs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0047AB] hover:bg-[#003A8C] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <span>Explore Open Jobs</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Benefits */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-14 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#0B0B0C]">Guaranteed Payment</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Work only after the client funds the on-chain escrow contract. Eliminate non-payment and chargeback risks forever.
            </p>
          </div>

          <div className="p-7 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#0B0B0C]">Instant Settlement</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              No 5-day security holds or international wire waiting periods. Funds transfer to your wallet the second the client approves.
            </p>
          </div>

          <div className="p-7 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#0B0B0C]">Soulbound Reputation</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Every completed job mints a non-transferable ERC-721 Soulbound Reputation Token proving your track record to future clients.
            </p>
          </div>
        </div>

        <FaqSection pageId="/for-freelancers" />
      </main>
    </div>
  );
};

export default ForFreelancersPage;
