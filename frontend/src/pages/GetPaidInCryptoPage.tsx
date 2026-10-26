import React from 'react';
import { Link } from 'react-router-dom';
import { Coins, ArrowRight, ShieldCheck, Zap, Globe, CheckCircle2 } from 'lucide-react';
import { Seo } from '../components/seo/Seo';
import { FaqSection } from '../components/faq/FaqSection';

export const GetPaidInCryptoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B0B0C] flex flex-col">
      <Seo routeKey="/get-paid-in-crypto" />

      {/* Header */}
      <header className="w-full bg-white border-b border-[#E2E6EC] py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7EEF9] text-[#0047AB] text-xs font-bold tracking-wide">
            <Coins size={14} />
            <span>CRYPTO FREELANCE SETTLEMENT</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B0B0C] tracking-tight">
            Get Paid in POL & Crypto for Freelance Services
          </h1>
          <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
            Direct wallet-to-wallet milestone payments. Build real on-chain wealth in native POL and ERC-20 tokens with transparent escrow guarantees.
          </p>
          <div className="pt-2">
            <Link
              to="/find-jobs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0047AB] hover:bg-[#003A8C] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <span>Explore Crypto Jobs</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Benefits */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-14 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              POL
            </div>
            <h3 className="text-lg font-bold text-[#0B0B0C]">Native Polygon Gas Token</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Receive native POL directly from escrow. Use your earnings for network staking, liquidity provision, or instant DeFi interactions.
            </p>
          </div>

          <div className="p-7 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              100%
            </div>
            <h3 className="text-lg font-bold text-[#0B0B0C]">Self-Custodial Ownership</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              No platform holds your tokens in a centralized database account. Payment releases go directly into your cold or hot hardware wallet.
            </p>
          </div>

          <div className="p-7 bg-white rounded-3xl border border-[#E2E6EC] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#0B0B0C]">2-Second Finality</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Enjoy lightning-fast settlement with Polygon PoS 2-second block intervals. Your work is rewarded the instant the milestone is approved.
            </p>
          </div>
        </div>

        <FaqSection pageId="/get-paid-in-crypto" />
      </main>
    </div>
  );
};

export default GetPaidInCryptoPage;
