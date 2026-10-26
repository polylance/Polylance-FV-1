import React from 'react';
import { Link } from 'react-router-dom';
import { Award, ArrowRight, ExternalLink, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Button } from '../common/Button';
import { MAINNET_CONTRACTS, POLYGONSCAN_BASE_URL } from '../../seo/site.config';
import { Job } from '../../types';
import { isRealPublicJob, sanitizeText } from '../../config/testDataFilter';

interface CertificatesShowcaseProps {
  jobs?: Job[];
}

export const CertificatesShowcase: React.FC<CertificatesShowcaseProps> = ({ jobs = [] }) => {
  // Find real completed jobs (non-test, non-demo)
  const completedJobsWithCert = (jobs || [])
    .filter((j) => isRealPublicJob(j) && j.status === 'Completed')
    .slice(0, 3);

  return (
    <section className="w-full bg-white border-b border-[#E5E7EB] py-16 sm:py-20">
      <PageContainer noVerticalPadding>
        <div className="space-y-10 text-left">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="text-eyebrow text-[#0047AB]">Verified Proof of Work</div>
              <h2 className="text-landing-h2 text-[#0B0B0F]">
                Soulbound work certificates you actually own.
              </h2>
              <p className="text-sm sm:text-base text-[#4B5563] max-w-2xl">
                When an escrow milestone is approved and released, an ERC-721 credential is permanently minted to the freelancer's wallet. Non-transferable, tamper-proof, and verifiable by any future employer.
              </p>
            </div>

            <Button
              as="Link"
              to="/certifiedpass"
              variant="secondary"
              size="md"
              trailingIcon={<ArrowRight size={15} />}
            >
              CertifiedPass Registry
            </Button>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {completedJobsWithCert.length > 0 ? (
              completedJobsWithCert.map((job) => (
                <div
                  key={job.id}
                  className="bg-[#F6F7F9] border border-[#E5E7EB] rounded-[12px] p-6 shadow-2xs space-y-4 text-left flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#EAF1FB] text-[#0047AB] text-xs font-bold">
                        <Award size={14} />
                        <span>CertifiedPass Verified</span>
                      </span>
                      <span className="text-[11px] text-[#6B7280]">ERC-721 SBT</span>
                    </div>

                    <h3 className="text-base font-bold text-[#0B0B0F] line-clamp-2">
                      {sanitizeText(job.title)}
                    </h3>

                    <p className="text-xs text-[#4B5563] line-clamp-3">
                      {sanitizeText(job.description) || 'Milestone deliverable verified and authorized on Polygon smart contract.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                    <span className="text-[#047857] font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>Completed & Released</span>
                    </span>

                    <Link
                      to={`/jobs/${job.id}`}
                      className="text-[#0047AB] font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>View</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              // Neutral, honest explainer cards with Example certificate design
              <>
                {/* Example Certificate Card */}
                <div className="bg-white border-2 border-[#0047AB]/20 rounded-[14px] p-6 shadow-xs space-y-4 text-left relative flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#EAF1FB] text-[#0047AB] text-xs font-bold">
                        <Award size={14} />
                        <span>CertifiedPass Credential</span>
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
                        Example
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#0B0B0F]">
                        Full Stack Web3 Escrow Integration
                      </h3>
                      <div className="text-xs text-[#0047AB] font-semibold mt-0.5">
                        Settled Value: 1,500.00 USDC
                      </div>
                    </div>

                    <p className="text-xs text-[#4B5563] leading-relaxed">
                      Soulbound ERC-721 token permanently linked to the recipient wallet. Cryptographically verifies milestone completion and client approval.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-xs">
                    <span className="text-[#047857] font-medium flex items-center gap-1 text-[11px]">
                      <CheckCircle2 size={12} />
                      <span>Polygon Verified</span>
                    </span>
                    <Link to="/certifiedpass" className="text-xs font-semibold text-[#0047AB] hover:underline">
                      Explore SBTs →
                    </Link>
                  </div>
                </div>

                <div className="bg-[#F6F7F9] border border-[#E5E7EB] rounded-[14px] p-6 shadow-2xs space-y-3 text-left flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[#EAF1FB] text-[#0047AB] flex items-center justify-center">
                      <ShieldCheck size={18} />
                    </div>
                    <h3 className="text-base font-bold text-[#0B0B0F]">
                      Soulbound to Your Wallet
                    </h3>
                    <p className="text-xs text-[#4B5563] leading-relaxed">
                      Credentials cannot be bought, sold, or transferred. Your work history stays with your cryptographic keys forever with zero risk of platform loss.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E5E7EB] text-xs text-[#6B7280]">
                    Non-transferable ERC-721
                  </div>
                </div>

                <div className="bg-[#F6F7F9] border border-[#E5E7EB] rounded-[14px] p-6 shadow-2xs space-y-3 text-left flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[#EAF1FB] text-[#0047AB] flex items-center justify-center">
                      <ExternalLink size={18} />
                    </div>
                    <h3 className="text-base font-bold text-[#0B0B0F]">
                      Zero Platform Lock-In
                    </h3>
                    <p className="text-xs text-[#4B5563] leading-relaxed">
                      Anyone can verify your track record directly on Polygonscan without needing an account, login, or permission from PolyLance.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E5E7EB] text-xs text-[#6B7280]">
                    Open public registry on Chain 137
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Polygonscan SBT Contract Link */}
          <div className="pt-2 flex items-center justify-between text-xs text-[#6B7280]">
            <span>Reputation Registry contract on Polygon Mainnet</span>
            <a
              href={`${POLYGONSCAN_BASE_URL}/address/${MAINNET_CONTRACTS.reputationSBT}#code`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0047AB] hover:underline inline-flex items-center gap-1 font-semibold"
            >
              <span>View SBT Registry on Polygonscan</span>
              <ExternalLink size={12} />
            </a>
          </div>

        </div>
      </PageContainer>
    </section>
  );
};
