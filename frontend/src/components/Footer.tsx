import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PolyLanceLogo } from './PolyLanceLogo';
import { PolygonLogo } from './brand/PolygonLogo';
import { ExternalLink, Instagram, Linkedin } from 'lucide-react';
import { CLIENT_FEE_PERCENT, TOTAL_PLATFORM_FEE_PERCENT } from '../utils/fees';
import { FOOTER_HIDDEN_ROUTES } from '../App';

export const Footer: React.FC = () => {
  const location = useLocation();
  if (location.pathname.startsWith('/audit/') || FOOTER_HIDDEN_ROUTES.includes(location.pathname)) {
    return null;
  }
  const isCertifiedPassDomain = typeof window !== 'undefined' && 
    (window.location.hostname === 'certifiedpass.polylance.codes' || window.location.hostname.startsWith('certifiedpass.'));
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#0B0B0F] text-[#FFFFFF] pt-12 pb-10 font-sans border-t border-[#1F2937]">
      <div className="w-full max-w-[1440px] mx-auto px-[clamp(20px,3vw,48px)] space-y-10">
        {/* Main Grid: Brand col + 4 link columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 text-left">
          
          {/* Brand & Mission (Col 1-4) */}
          <div className="md:col-span-4 space-y-3.5">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <PolyLanceLogo size={28} className="shrink-0" />
              <span className="font-sans font-bold text-xl tracking-tight text-white">
                {isCertifiedPassDomain ? 'CertifiedPass' : 'PolyLance'}
              </span>
            </Link>

            <p className="text-sm text-[#9CA3AF] leading-relaxed max-w-sm">
              {isCertifiedPassDomain
                ? 'Verification oracle and verifiable credential protocol for PolyLance deliverables and milestone proof of work.'
                : 'Decentralized freelance marketplace on Polygon. Smart contract escrow, decentralized arbitration, and Soulbound work certificates.'}
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-[#9CA3AF]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#1F2937] text-white font-mono text-[11px]">
                <PolygonLogo size={13} />
                <span>Polygon (137)</span>
              </div>
              <span className="text-[#9CA3AF]">Fee: {CLIENT_FEE_PERCENT}% per side ({TOTAL_PLATFORM_FEE_PERCENT}% total)</span>
            </div>

            {/* Social Channels */}
            <div className="flex items-center gap-2.5 pt-1 text-gray-400">
              <a
                href="https://x.com/PolyLance26"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="PolyLance on X"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/polylance/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="PolyLance on Instagram"
              >
                <Instagram size={14} />
              </a>
              <a
                href="https://www.linkedin.com/in/polylance-zenith-5727113ba/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="PolyLance on LinkedIn"
              >
                <Linkedin size={14} />
              </a>
            </div>
          </div>

          {/* Column 1: Jobs & Product (Col 5-6) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
              Jobs &amp; Talent
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/find-jobs" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Find Jobs
                </Link>
              </li>
              <li>
                <Link to="/post-job" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Solutions (Col 7-8) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
              Solutions
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/how-it-works" className="text-[#D1D5DB] hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/escrow" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Smart Escrow
                </Link>
              </li>
              <li>
                <Link to="/escrow-simulator" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Escrow Simulator
                </Link>
              </li>
              <li>
                <Link to="/fees" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Transparent Fees (2.5% per side)
                </Link>
              </li>
              <li>
                <Link to="/for-freelancers" className="text-[#D1D5DB] hover:text-white transition-colors">
                  For Freelancers
                </Link>
              </li>
              <li>
                <Link to="/for-clients" className="text-[#D1D5DB] hover:text-white transition-colors">
                  For Clients
                </Link>
              </li>
              <li>
                <Link to="/get-paid-in-usdc" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Get Paid in USDC
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources & Protocol (Col 9-10) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/blog" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Blog &amp; Guides
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-[#D1D5DB] hover:text-white transition-colors">
                  FAQ Hub
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link to="/security" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Security &amp; Audit
                </Link>
              </li>
              <li>
                <Link to="/auditx" className="text-[#D1D5DB] hover:text-white transition-colors">
                  AuditX
                </Link>
              </li>
              <li>
                <Link to="/certifiedpass" className="text-[#D1D5DB] hover:text-white transition-colors">
                  CertifiedPass
                </Link>
              </li>
              <li>
                <Link to="/dao" className="text-[#D1D5DB] hover:text-white transition-colors">
                  DAO Governance
                </Link>
              </li>
              <li>
                <a
                  href="https://polygonscan.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#D1D5DB] hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>Polygonscan</span>
                  <ExternalLink size={12} strokeWidth={2} />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal (Col 11-12) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Risk Notice
                </Link>
              </li>
              <li>
                <Link to="/manifesto" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Manifesto
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#1F2937] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9CA3AF]">
          <div className="font-medium text-gray-300">
            PolyLance Protocol
          </div>

          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#9CA3AF]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Network: Normal</span>
            </div>
            <span className="text-[#6B7280]">·</span>
            <span className="font-sans text-[#9CA3AF]">Verified Work Certificates</span>
            <span className="text-[#6B7280]">·</span>
            <span>Smart Contract Escrow</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
