import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ArrowRight, ShieldCheck, Zap, Globe, CheckCircle2 } from 'lucide-react';
import { Seo } from '../components/seo/Seo';
import { FaqSection } from '../components/faq/FaqSection';

export const GetPaidInUsdcPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B0B0C] flex flex-col">
      <Seo routeKey="/get-paid-in-usdc" />

      {/* Header */}
      <header className="w-full bg-white border-b border-[#E2E6EC] py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7EEF9] text-[#0047AB] text-xs font-bold tracking-wide">
            <DollarSign size={14} />
            <span>USDC FREELANCE PAYOUTS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B0B0C] tracking-tight">
            How to Get Paid in USDC for Freelance Work
          </h1>
          <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
            Eliminate cross-border wire delays, bank fees, and currency exchange volatility. Receive fully backed digital dollars on Polygon in seconds.
          </p>
          <div className="pt-2">
            <Link
              to="/find-jobs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0047AB] hover:bg-[#003A8C] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <span>Browse USDC Jobs</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-14 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              1:1
            </div>
            <h3 className="text-lg font-bold text-[#0B0B0C]">Zero Price Volatility</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              USDC is 100% backed by cash and short-dated US Treasuries with monthly attestations. Your earnings remain stable regardless of crypto market swings.
            </p>
          </div>

          <div className="p-7 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              $0.01
            </div>
            <h3 className="text-lg font-bold text-[#0B0B0C]">Sub-Cent Gas Fees</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Transferring USDC on Polygon PoS costs fractions of a cent, avoiding high Ethereum L1 gas or international wire transfer charges.
            </p>
          </div>

          <div className="p-7 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Globe size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#0B0B0C]">Direct Off-Ramp Access</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Convert USDC to local fiat in minutes through global exchanges or direct bank off-ramp providers in over 100 countries.
            </p>
          </div>
        </div>

        <FaqSection pageId="/get-paid-in-usdc" />
      </main>
    </div>
  );
};

export default GetPaidInUsdcPage;
