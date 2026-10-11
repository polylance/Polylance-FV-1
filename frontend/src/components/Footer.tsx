import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PolyLanceLogo } from './PolyLanceLogo';
import { PolygonLogo } from './brand/PolygonLogo';
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
    <footer className="w-full bg-[#0B0B0F] text-[#FFFFFF] pt-12 pb-10 font-sans border-t border-[#1F2937]">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 space-y-10">
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
              <span className="text-[#9CA3AF]">Platform fee: 2.5%</span>
            </div>
          </div>

          {/* Column 1: Product (Col 5-6) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/jobs" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Find Jobs
                </Link>
              </li>
              <li>
                <Link to="/jobs/post" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link to="/workspace" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Workspace
                </Link>
              </li>
              <li>
                <Link to="/chat" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Messages
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Protocol (Col 7-8) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
              Protocol
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/reputation" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Reputation
                </Link>
              </li>
              <li>
                <Link to="/dao" className="text-[#D1D5DB] hover:text-white transition-colors">
                  DAO Governance
                </Link>
              </li>
              <li>
                <Link to="/judge" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Judge Panel
                </Link>
              </li>
              <li>
                <Link to="/treasury" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Safe Treasury
                </Link>
              </li>
              <li>
                <Link to="/attestation" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Attestations
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources (Col 9-10) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/help" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Help &amp; FAQ
                </Link>
              </li>
              <li>
                <Link to="/demo" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Watch demo
                </Link>
              </li>
              <li>
                <Link to="/security" className="text-[#D1D5DB] hover:text-white transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link to="/certifiedpass" className="text-[#D1D5DB] hover:text-white transition-colors">
                  CertifiedPass
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
          <div>
            © {currentYear} PolyLance Protocol. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
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
