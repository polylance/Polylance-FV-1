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
    <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-md pt-12 pb-8 pb-safe px-4 md:px-8 font-sans text-slate-600 select-none relative z-10">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Top Main Grid (Desktop & Tablet md+) */}
        <div className="hidden md:grid md:grid-cols-12 gap-8 lg:gap-12">

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
              <span className="font-bold">Polygon Mainnet (137)</span>
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
                <Link to="/certifiedpass" className="hover:text-purple-600 transition-colors inline-flex items-center gap-1.5 font-bold text-indigo-700">
                  <ShieldCheck size={13} className="text-indigo-600" />
                  CertifiedPass (Verification Protocol)
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

        {/* Mobile View (< md) */}
        <div className="md:hidden space-y-6 text-left">
          {/* Brand */}
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="p-1 rounded-xl bg-purple-50 border border-purple-100 shadow-3xs">
                <PolyLanceLogo size={28} />
              </div>
              <span className="font-headline font-black text-lg tracking-tight bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                PolyLance Zenith
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
              Decentralized freelance clearinghouse. Anchoring project escrows, dispute resolution, and soulbound work history to the Polygon blockchain.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-full text-[11px] font-mono text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-bold">Polygon Mainnet (137)</span>
            </div>
          </div>

          {/* Accordion Group */}
          <div className="space-y-2">
            <details className="group border border-slate-200 rounded-xl bg-white/80 overflow-hidden">
              <summary className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between font-mono text-xs font-black text-slate-900 uppercase tracking-wider cursor-pointer list-none select-none">
                <span>Ecosystem & Apps</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="px-4 pb-3 pt-1 border-t border-slate-100 flex flex-col divide-y divide-slate-100">
                <Link to="/jobs" className="min-h-[44px] flex items-center text-xs font-semibold text-slate-700 hover:text-purple-600">
                  Find Jobs (Marketplace)
                </Link>
                <Link to="/reputation" className="min-h-[44px] flex items-center text-xs font-semibold text-slate-700 hover:text-purple-600">
                  SBT Leaderboard
                </Link>
                <Link to="/dao" className="min-h-[44px] flex items-center text-xs font-semibold text-slate-700 hover:text-purple-600">
                  DAO Governance
                </Link>
                <Link to="/analytics" className="min-h-[44px] flex items-center text-xs font-semibold text-slate-700 hover:text-purple-600">
                  Platform Analytics
                </Link>
                <Link to="/certifiedpass" className="min-h-[44px] flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800">
                  <ShieldCheck size={13} className="text-indigo-600" />
                  CertifiedPass (Verification Protocol)
                </Link>
                <Link to="/manifesto" className="min-h-[44px] flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-800">
                  <Sparkles size={13} className="text-purple-600 animate-pulse" />
                  Protocol Manifesto & Team
                </Link>
              </div>
            </details>

            <details className="group border border-slate-200 rounded-xl bg-white/80 overflow-hidden">
              <summary className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between font-mono text-xs font-black text-slate-900 uppercase tracking-wider cursor-pointer list-none select-none">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-purple-600" />
                  Legal & Compliance
                </span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="px-4 pb-3 pt-1 border-t border-slate-100 flex flex-col divide-y divide-slate-100">
                <Link to="/terms" className="min-h-[44px] flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-purple-600">
                  <FileText size={13} className="text-purple-500 shrink-0" />
                  Terms & Conditions
                </Link>
                <Link to="/privacy" className="min-h-[44px] flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-purple-600">
                  <Lock size={13} className="text-blue-500 shrink-0" />
                  Privacy Policy & Data Sovereignty
                </Link>
                <Link to="/security" className="min-h-[44px] flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-purple-600">
                  <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                  Security & Audits
                </Link>
                <Link to="/disclaimer" className="min-h-[44px] flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-purple-600">
                  <Scale size={13} className="text-amber-500 shrink-0" />
                  Protocol Disclaimer & Risk
                </Link>
              </div>
            </details>
          </div>
        </div>

        {/* Bottom Copyright Strip */}
        <div className="pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span>© {currentYear} PolyLance Protocol. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span className="text-slate-400">Non-Custodial • Immutable • ERC-5192 SBT</span>
            <a
              href="https://polygonscan.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-purple-600 inline-flex items-center gap-1 font-bold text-purple-700 min-h-[44px] px-1"
            >
              Polygonscan <ExternalLink size={10} />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
