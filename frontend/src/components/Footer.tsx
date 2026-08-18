import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PolyLanceLogo } from './PolyLanceLogo';
import { ShieldCheck, Lock, FileText, Scale, ExternalLink, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const location = useLocation();
  if (location.pathname.startsWith('/audit/')) {
    return null;
  }
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-md pt-12 pb-8 px-4 md:px-8 font-sans text-slate-600 select-none relative z-10">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Top Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">

          {/* Brand Column (Col 1-5) */}
          <div className="md:col-span-5 space-y-4 text-left">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="p-1 rounded-xl bg-purple-50 border border-purple-100 group-hover:scale-105 transition-transform duration-300 shadow-3xs">
                <PolyLanceLogo size={32} />
              </div>
              <span className="font-headline font-black text-xl tracking-tight bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                PolyLance Zenith
              </span>
            </Link>

            <p className="text-xs text-slate-500 leading-relaxed font-sans max-w-sm font-medium">
              Decentralized freelance clearinghouse. Anchoring project escrows, dispute resolution, and soulbound work history to the Polygon blockchain.
            </p>

            {/* Live On-Chain Network Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-full text-[11px] font-mono text-slate-600 shadow-4xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-4" />
              <span className="font-bold">Polygon Amoy Testnet (80002)</span>
            </div>
          </div>

          {/* Navigation Links Column (Col 6-8) */}
          <div className="md:col-span-3 space-y-3 text-left">
            <h4 className="font-mono text-xs font-black text-slate-900 uppercase tracking-widest">
              Ecosystem & Apps
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link to="/jobs" className="hover:text-purple-600 transition-colors inline-flex items-center gap-1.5">
                  Find Jobs (Marketplace)
                </Link>
              </li>
              <li>
                <Link to="/reputation" className="hover:text-purple-600 transition-colors inline-flex items-center gap-1.5">
                  SBT Leaderboard
                </Link>
              </li>
              <li>
                <Link to="/dao" className="hover:text-purple-600 transition-colors inline-flex items-center gap-1.5">
                  DAO Governance
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="hover:text-purple-600 transition-colors inline-flex items-center gap-1.5">
                  Platform Analytics
                </Link>
              </li>
              <li>
                <Link to="/manifesto" className="hover:text-purple-600 transition-colors inline-flex items-center gap-1.5 font-bold text-purple-700">
                  <Sparkles size={13} className="text-purple-600 animate-pulse" />
                  Protocol Manifesto & Team
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Trust Column (Col 9-12) */}
          <div className="md:col-span-4 space-y-3 text-left">
            <h4 className="font-mono text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-purple-600" />
              Legal, Security & Compliance
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link to="/terms" className="hover:text-purple-600 transition-colors inline-flex items-center gap-1.5">
                  <FileText size={13} className="text-purple-500" />
                  Terms & Conditions (Smart Escrow)
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-purple-600 transition-colors inline-flex items-center gap-1.5">
                  <Lock size={13} className="text-blue-500" />
                  Privacy Policy & Data Sovereignty
                </Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-purple-600 transition-colors inline-flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  Security & Audits
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="hover:text-purple-600 transition-colors inline-flex items-center gap-1.5">
                  <Scale size={13} className="text-amber-500" />
                  Protocol Disclaimer & Risk Notice
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright Strip */}
        <div className="pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span>© {currentYear} PolyLance Protocol. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">Non-Custodial • Immutable • ERC-5192 SBT</span>
            <a
              href="https://amoy.polygonscan.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-purple-600 inline-flex items-center gap-1 font-bold text-purple-700"
            >
              Polygonscan <ExternalLink size={10} />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
