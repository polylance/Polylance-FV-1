import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PolyLanceLogo } from './PolyLanceLogo';
import { ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  const location = useLocation();
  if (location.pathname.startsWith('/audit/')) {
    return null;
  }
  const isCertifiedPassDomain = typeof window !== 'undefined' && 
    (window.location.hostname === 'certifiedpass.polylance.codes' || window.location.hostname.startsWith('certifiedpass.'));
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#0B0B0C] text-[#FFFFFF] pt-14 pb-12 px-4 sm:px-6 lg:px-8 font-sans border-t border-[#1C1D20] relative z-10">
      <div className="max-w-[1200px] mx-auto space-y-12">
        {/* Main 3-Column Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 text-left">
          
          {/* Column 1: Brand & Purpose (Col 1-5) */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <PolyLanceLogo size={28} />
              <span className="font-serif font-semibold text-xl tracking-tight text-[#FFFFFF]">
                {isCertifiedPassDomain ? 'CertifiedPass' : 'PolyLance'}
              </span>
            </Link>

            <p className="text-sm text-[#8892A0] leading-relaxed max-w-sm font-normal">
              {isCertifiedPassDomain
                ? 'Verification oracle and verifiable credential protocol for PolyLance deliverables and milestone proof of work.'
                : 'Decentralized freelance marketplace on Polygon. Smart contract escrow, dispute arbitration, and Soulbound reputation.'}
            </p>

            <div className="pt-1 flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-[#18191B] border border-[#2B2D31] text-xs font-mono text-[#FFFFFF]">
                <span className="w-2 h-2 rounded-full bg-[#1E8449]" />
                <span className="font-medium text-[#FFFFFF]">Polygon Mainnet (137)</span>
              </span>
              <span className="text-xs text-[#8892A0] font-mono">2.5% platform fee</span>
            </div>
          </div>

          {/* Column 2: Platform & Ecosystem (Col 6-8) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold text-white/50 tracking-wider uppercase">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/jobs" className="text-white/70 hover:text-white transition-colors duration-150 block font-normal">
                  Find Jobs
                </Link>
              </li>
              <li>
                <Link to="/reputation" className="text-white/70 hover:text-white transition-colors duration-150 block font-normal">
                  SBT Leaderboard
                </Link>
              </li>
              <li>
                <Link to="/dao" className="text-white/70 hover:text-white transition-colors duration-150 block font-normal">
                  DAO Governance
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="text-white/70 hover:text-white transition-colors duration-150 block font-normal">
                  Analytics
                </Link>
              </li>
              <li>
                <Link to="/certifiedpass" className="text-white/70 hover:text-white transition-colors duration-150 block font-normal">
                  CertifiedPass
                </Link>
              </li>
              <li>
                <Link to="/auditx" className="text-white/70 hover:text-white transition-colors duration-150 block font-normal">
                  AuditX Security
                </Link>
              </li>
              <li>
                <Link to="/manifesto" className="text-white/70 hover:text-white transition-colors duration-150 block font-normal">
                  Manifesto &amp; Team
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust, Legal & Smart Escrows (Col 9-12) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold text-white/50 tracking-wider uppercase">
              Legal &amp; Security
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/terms" className="text-white/70 hover:text-white transition-colors duration-150 block font-normal">
                  Terms of Service (Smart Escrow)
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-white/70 hover:text-white transition-colors duration-150 block font-normal">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/security" className="text-white/70 hover:text-white transition-colors duration-150 block font-normal">
                  Security &amp; Audits
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-white/70 hover:text-white transition-colors duration-150 block font-normal">
                  Risk Notice &amp; Disclaimer
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright & Protocol Notes Strip */}
        <div className="pt-8 border-t border-[#1C1D20] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8892A0]">
          <div className="flex items-center gap-2">
            <span>© {currentYear} PolyLance Protocol. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="font-mono text-[#8892A0]">Non-custodial • ERC-5192 SBT</span>
            <a
              href="https://polygonscan.com"
              target="_blank"
              rel="noreferrer"
              className="text-white/70 hover:text-white inline-flex items-center gap-1 transition-colors duration-150 underline decoration-[#2B2D31] underline-offset-4"
            >
              <span>Polygonscan</span>
              <ExternalLink size={11} strokeWidth={1.5} />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
