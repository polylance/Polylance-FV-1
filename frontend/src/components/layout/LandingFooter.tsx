import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Instagram, Linkedin } from 'lucide-react';
import { PageContainer } from './PageContainer';
import { PolyLanceLogo } from '../PolyLanceLogo';
import { PolygonIcon } from '../TokenIcon';
import { ScrollRevealGroup } from '../common/MotionPrimitives';
import {
  MAINNET_CONTRACTS,
  POLYGONSCAN_BASE_URL,
  POLYGON_CHAIN_ID,
} from '../../seo/site.config';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#0A0D14] text-white border-t border-slate-900 pt-16 pb-12 text-left">
      <PageContainer size="wide" noVerticalPadding>
        <div className="space-y-12">
          
          {/* Main 4-Column Grid with Staggered Reveal */}
          <ScrollRevealGroup staggerSec={0.08} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            
            {/* Brand Column (Span 2 on lg) */}
            <div className="col-span-2 space-y-4">
              <Link to="/" className="inline-flex items-center gap-2.5 select-none" aria-label="PolyLance Home">
                <PolyLanceLogo size={32} />
                <span className="font-extrabold text-xl tracking-tight text-white">PolyLance</span>
              </Link>

              <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                Autonomous smart contract escrow on Polygon. Protecting freelancers and clients with milestone funding, peer arbitration, and Soulbound work certificates.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-2 text-gray-400">
                <a
                  href="https://x.com/PolyLance26"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-[#60A5FA] transition-colors"
                  aria-label="PolyLance on X"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/polylance/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-[#60A5FA] transition-colors"
                  aria-label="PolyLance on Instagram"
                >
                  <Instagram size={15} />
                </a>
                <a
                  href="https://www.linkedin.com/in/polylance-zenith-5727113ba/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-[#60A5FA] transition-colors"
                  aria-label="PolyLance on LinkedIn"
                >
                  <Linkedin size={15} />
                </a>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-200 whitespace-nowrap shrink-0">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#60A5FA] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563EB]" />
                  </span>
                  <PolygonIcon size={12} className="text-[#60A5FA]" />
                  <span>Chain {POLYGON_CHAIN_ID}</span>
                </div>
              </div>
            </div>

            {/* Column 1: Marketplace */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-white">
                Marketplace
              </div>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>
                  <Link to="/jobs" className="hover:text-[#60A5FA] transition-colors">
                    Find Freelance Jobs
                  </Link>
                </li>
                <li>
                  <Link to="/jobs/post" className="hover:text-[#60A5FA] transition-colors">
                    Post a Project
                  </Link>
                </li>
                <li>
                  <Link to="/escrow" className="hover:text-[#60A5FA] transition-colors">
                    Escrow Vaults
                  </Link>
                </li>
                <li>
                  <Link to="/escrow-simulator" className="hover:text-[#60A5FA] transition-colors">
                    Escrow Simulator
                  </Link>
                </li>
                <li>
                  <Link to="/certifiedpass" className="hover:text-[#60A5FA] transition-colors">
                    CertifiedPass SBTs
                  </Link>
                </li>
                <li>
                  <Link to="/auditx" className="hover:text-[#60A5FA] transition-colors">
                    AuditX Security
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Protocol & Governance */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-white">
                Protocol
              </div>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>
                  <Link to="/judge" className="hover:text-[#60A5FA] transition-colors">
                    JudgeDAO Arbitration
                  </Link>
                </li>
                <li>
                  <Link to="/community" className="hover:text-[#60A5FA] transition-colors">
                    Community Hub
                  </Link>
                </li>
                <li>
                  <Link to="/reputation" className="hover:text-[#60A5FA] transition-colors">
                    Reputation Leaderboard
                  </Link>
                </li>
                <li>
                  <Link to="/security" className="hover:text-[#60A5FA] transition-colors">
                    Security &amp; Contracts
                  </Link>
                </li>
                <li>
                  <Link to="/manifesto" className="hover:text-[#60A5FA] transition-colors">
                    Protocol Manifesto
                  </Link>
                </li>
                <li>
                  <a
                    href={`${POLYGONSCAN_BASE_URL}/address/${MAINNET_CONTRACTS.jobFactory}#code`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#60A5FA] transition-colors inline-flex items-center gap-1"
                  >
                    <span>Polygonscan</span>
                    <ExternalLink size={10} />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Trust & Legal */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-white">
                Trust &amp; Legal
              </div>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>
                  <Link to="/fees" className="hover:text-[#60A5FA] transition-colors">
                    Transparent Fees (2.5% per side)
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="hover:text-[#60A5FA] transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-[#60A5FA] transition-colors">
                    Help &amp; FAQs
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-[#60A5FA] transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-[#60A5FA] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/disclaimer" className="hover:text-[#60A5FA] transition-colors">
                    Protocol Disclaimer
                  </Link>
                </li>
              </ul>
            </div>

          </ScrollRevealGroup>

          {/* Bottom Bar: Strictly "PolyLance Protocol" */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-[14px] text-[#D1D5DB]">
            <div className="font-medium text-white">
              PolyLance Protocol
            </div>
          </div>

        </div>
      </PageContainer>
    </footer>
  );
};
