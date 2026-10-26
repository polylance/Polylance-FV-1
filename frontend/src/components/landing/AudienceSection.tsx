import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  Clock,
  ArrowRight,
  CheckCircle2,
  Lock,
  Search,
  PlusCircle,
  FileCode,
  DollarSign,
} from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { REVIEW_WINDOW_DAYS, PLATFORM_FEE_PERCENT } from '../../seo/site.config';
import { trackLandingEvent } from '../../utils/analytics';

export const AudienceSection: React.FC = () => {
  return (
    <section className="w-full bg-white border-b border-[#E5E7EB] py-16 sm:py-20 lg:py-24">
      <PageContainer noVerticalPadding>
        <div className="space-y-12 text-left">
          
          {/* Section Header */}
          <div className="max-w-2xl space-y-3">
            <div className="text-eyebrow text-[#0047AB]">Two Sides, One Sovereign Standard</div>
            <h2 className="text-landing-h2 text-[#0B0B0F]">
              Engineered for both sides of the contract.
            </h2>
            <p className="text-lead text-[#4B5563]">
              Whether you are delivering technical deliverables or hiring verified talent, PolyLance gives you cryptographic protection with zero intermediary control.
            </p>
          </div>

          {/* 2-Panel Statement Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Panel 1: For Freelancers */}
            <div className="bg-[#F6F7F9] border border-[#E5E7EB] rounded-[16px] p-8 sm:p-10 flex flex-col justify-between shadow-2xs hover:border-[#0047AB]/50 transition-all space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#EAF1FB] text-[#0047AB]">
                    For Freelancers
                  </span>
                  <span className="text-xs text-[#6B7280]">Guaranteed Milestone Collateral</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold text-[#0B0B0F] tracking-tight">
                    Never chase an invoice again.
                  </h3>
                  <p className="text-sm text-[#4B5563] leading-relaxed">
                    Client funds are deposited into isolated Polygon smart contracts before you write code. Deliver milestones with confidence knowing your payment is secured.
                  </p>
                </div>

                {/* 3 Distinct Value Bullets */}
                <ul className="space-y-3.5 pt-2">
                  <li className="flex items-start gap-3 text-xs text-[#374151]">
                    <div className="w-5 h-5 rounded-full bg-[#EAF1FB] text-[#0047AB] flex items-center justify-center shrink-0 mt-0.5">
                      <Lock size={12} />
                    </div>
                    <div>
                      <strong className="text-[#0B0B0F] block">Upfront Collateral in Escrow:</strong>
                      Verify committed client funds on Polygonscan before starting any milestone.
                    </div>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-[#374151]">
                    <div className="w-5 h-5 rounded-full bg-[#EAF1FB] text-[#0047AB] flex items-center justify-center shrink-0 mt-0.5">
                      <Clock size={12} />
                    </div>
                    <div>
                      <strong className="text-[#0B0B0F] block">{REVIEW_WINDOW_DAYS}-Day Auto-Release Protection:</strong>
                      Clients have {REVIEW_WINDOW_DAYS} days to inspect work. If unresponsive, you can claim auto-release directly.
                    </div>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-[#374151]">
                    <div className="w-5 h-5 rounded-full bg-[#EAF1FB] text-[#0047AB] flex items-center justify-center shrink-0 mt-0.5">
                      <Award size={12} />
                    </div>
                    <div>
                      <strong className="text-[#0B0B0F] block">Soulbound Work Credentials:</strong>
                      Every completed project mints an ERC-721 CertifiedPass token owned by your wallet forever.
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-[#E5E7EB]">
                <Link
                  to="/jobs"
                  onClick={() => trackLandingEvent('landing_cta_click', { audience: 'freelancer', target: '/jobs' })}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-[8px] bg-[#0047AB] hover:bg-[#00388A] text-white text-xs font-semibold transition-colors shadow-2xs"
                >
                  <Search size={15} />
                  <span>Find open jobs</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Panel 2: For Clients */}
            <div className="bg-[#F6F7F9] border border-[#E5E7EB] rounded-[16px] p-8 sm:p-10 flex flex-col justify-between shadow-2xs hover:border-[#0047AB]/50 transition-all space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#F3F4F6] text-[#374151]">
                    For Clients & Sponsors
                  </span>
                  <span className="text-xs text-[#6B7280]">Zero Downside Risk</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold text-[#0B0B0F] tracking-tight">
                    Pay only when code passes review.
                  </h3>
                  <p className="text-sm text-[#4B5563] leading-relaxed">
                    Commit project milestones into escrow and inspect deliverables before releasing funds. If deliverables fall short, peer arbitration protects your deposit.
                  </p>
                </div>

                {/* 3 Distinct Value Bullets */}
                <ul className="space-y-3.5 pt-2">
                  <li className="flex items-start gap-3 text-xs text-[#374151]">
                    <div className="w-5 h-5 rounded-full bg-[#F3F4F6] text-[#374151] flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck size={12} />
                    </div>
                    <div>
                      <strong className="text-[#0B0B0F] block">Full Inspection Control:</strong>
                      Funds stay locked until you review test suites, demo deployments, and deliverable quality.
                    </div>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-[#374151]">
                    <div className="w-5 h-5 rounded-full bg-[#F3F4F6] text-[#374151] flex items-center justify-center shrink-0 mt-0.5">
                      <DollarSign size={12} />
                    </div>
                    <div>
                      <strong className="text-[#0B0B0F] block">Transparent {PLATFORM_FEE_PERCENT}% Client Fee:</strong>
                      No subscription fees, no wire transfer fees, and no hidden currency spreads. Only {PLATFORM_FEE_PERCENT}% upon funding.
                    </div>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-[#374151]">
                    <div className="w-5 h-5 rounded-full bg-[#F3F4F6] text-[#374151] flex items-center justify-center shrink-0 mt-0.5">
                      <FileCode size={12} />
                    </div>
                    <div>
                      <strong className="text-[#0B0B0F] block">Audited Reputation Verification:</strong>
                      Review prospective talent's real on-chain CertifiedPass credentials verified on Polygon Mainnet.
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-[#E5E7EB]">
                <Link
                  to="/jobs/post"
                  onClick={() => trackLandingEvent('landing_cta_click', { audience: 'client', target: '/jobs/post' })}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-[8px] bg-[#0B0B0F] hover:bg-[#1F2937] text-white text-xs font-semibold transition-colors shadow-2xs"
                >
                  <PlusCircle size={15} />
                  <span>Post a project</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </PageContainer>
    </section>
  );
};
