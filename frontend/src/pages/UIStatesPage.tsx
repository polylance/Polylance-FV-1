import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PolyLanceLogo } from '../components/PolyLanceLogo';
import {
  EmptyState,
  LoadingState,
  ErrorState,
  NoInternetState,
  SlowNetworkState,
  NoSearchResultState,
  PermissionDeniedState,
  SessionExpiredState,
  FormValidationCard,
  SuccessState
} from '../components/UIStates';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';

export const UIStatesPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'feedback' | 'network' | 'auth'>('all');

  const palette = [
    { name: 'Primary Purple', hex: '#7C3AED', bg: 'bg-[#7C3AED]' },
    { name: 'Primary Blue', hex: '#2563EB', bg: 'bg-[#2563EB]' },
    { name: 'Accent Cyan', hex: '#06B6D4', bg: 'bg-[#06B6D4]' },
    { name: 'Success Green', hex: '#059669', bg: 'bg-[#059669]' },
    { name: 'Warning Amber', hex: '#F59E0B', bg: 'bg-[#F59E0B]' },
    { name: 'Error Red', hex: '#EF4444', bg: 'bg-[#EF4444]' },
  ];

  const neutrals = [
    { name: 'Bg Light', hex: '#F8FAFC', color: '#F8FAFC' },
    { name: 'Card Bg', hex: '#FFFFFF', color: '#FFFFFF' },
    { name: 'Border', hex: '#E2E8F0', color: '#E2E8F0' },
    { name: 'Muted Text', hex: '#64748B', color: '#64748B' },
    { name: 'Primary Text', hex: '#0F172A', color: '#0F172A' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* ── HEADER & PALETTE CONTAINER ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Header Card */}
          <div className="lg:col-span-8 bg-white p-7 sm:p-9 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <PolyLanceLogo size={36} />
                <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-600 bg-clip-text text-transparent">
                  PolyLance
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                UI STATE PAGES
              </h1>
              <p className="text-base font-semibold text-purple-600 mb-2">
                Consistent. Clear. On-Brand.
              </p>
              <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
                A comprehensive set of standardized UI state components designed for seamless, flawless user experiences across the PolyLance Web3 platform.
              </p>
            </div>

            {/* Quick Filter Pill Buttons */}
            <div className="pt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 mt-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Filter View:</span>
              {[
                { id: 'all', label: 'All 10 States' },
                { id: 'feedback', label: 'Feedback & Search' },
                { id: 'network', label: 'Network & Errors' },
                { id: 'auth', label: 'Auth & Forms' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette Card */}
          <div className="lg:col-span-4 bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">COLOR PALETTE</h3>
              </div>
              
              {/* Primary Colors */}
              <div className="grid grid-cols-6 gap-2 mb-4">
                {palette.map((c) => (
                  <div key={c.name} className="flex flex-col items-center group">
                    <div className={`w-8 h-8 rounded-full ${c.bg} shadow-xs transition-transform group-hover:scale-110 mb-1`} />
                    <span className="text-[9px] font-mono text-slate-400 group-hover:text-slate-700 transition-colors">
                      {c.hex}
                    </span>
                  </div>
                ))}
              </div>

              {/* Neutrals Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {neutrals.map((n) => (
                  <div key={n.name} className="flex flex-col items-center text-center">
                    <div
                      className="w-5 h-5 rounded-md border border-slate-300 shadow-3xs mb-1"
                      style={{ backgroundColor: n.color }}
                    />
                    <span className="text-[8px] font-medium text-slate-500">{n.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>WCAG AAA Compliant</span>
              <span>Tailwind Tokens</span>
            </div>
          </div>
        </div>

        {/* ── 10 UI STATES GRID ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {/* 1. EMPTY STATE */}
          {(activeFilter === 'all' || activeFilter === 'feedback') && (
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">1. EMPTY STATE</span>
              <EmptyState onAction={() => alert('Action clicked!')} />
            </div>
          )}

          {/* 2. LOADING STATE */}
          {(activeFilter === 'all' || activeFilter === 'feedback') && (
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">2. LOADING STATE</span>
              <LoadingState />
            </div>
          )}

          {/* 3. ERROR STATE */}
          {(activeFilter === 'all' || activeFilter === 'network') && (
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">3. ERROR STATE</span>
              <ErrorState onRetry={() => alert('Retry clicked')} onDashboard={() => alert('Go to dashboard clicked')} />
            </div>
          )}

          {/* 4. NO INTERNET STATE */}
          {(activeFilter === 'all' || activeFilter === 'network') && (
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">4. NO INTERNET</span>
              <NoInternetState onRetry={() => alert('Retrying connection...')} />
            </div>
          )}

          {/* 5. SLOW NETWORK STATE */}
          {(activeFilter === 'all' || activeFilter === 'network') && (
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">5. SLOW NETWORK</span>
              <SlowNetworkState onContinue={() => alert('Continuing anyway...')} />
            </div>
          )}

          {/* 6. NO SEARCH RESULT */}
          {(activeFilter === 'all' || activeFilter === 'feedback') && (
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">6. NO SEARCH RESULT</span>
              <NoSearchResultState onClear={() => alert('Search cleared')} />
            </div>
          )}

          {/* 7. PERMISSION DENIED */}
          {(activeFilter === 'all' || activeFilter === 'auth') && (
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">7. PERMISSION DENIED</span>
              <PermissionDeniedState onBack={() => alert('Navigating back...')} />
            </div>
          )}

          {/* 8. SESSION EXPIRED */}
          {(activeFilter === 'all' || activeFilter === 'auth') && (
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">8. SESSION EXPIRED</span>
              <SessionExpiredState onLogin={() => alert('Redirecting to login...')} />
            </div>
          )}

          {/* 9. FORM VALIDATION */}
          {(activeFilter === 'all' || activeFilter === 'auth') && (
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">9. FORM VALIDATION</span>
              <FormValidationCard onSubmit={(data) => alert(`Submitted: ${JSON.stringify(data)}`)} />
            </div>
          )}

          {/* 10. SUCCESS STATE */}
          {(activeFilter === 'all' || activeFilter === 'feedback') && (
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">10. SUCCESS STATE</span>
              <SuccessState onAction={() => alert('Viewing proposal...')} />
            </div>
          )}
        </div>

        {/* ── IMPLEMENTATION GUIDELINES & BRAND TERMINAL ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* How to Implement Card */}
          <div className="lg:col-span-8 bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5 text-left">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
              HOW TO IMPLEMENT
            </h3>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wide">USE COMPONENTS CONSISTENTLY</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-purple-600 shrink-0 mt-0.5" />
                  <span>Use these states across Dashboard, Proposals, Escrow, Messages, Profile, Settings, Jobs, and all other modules.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-purple-600 shrink-0 mt-0.5" />
                  <span>Maintain consistent spacing, typography, icons, and colors.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-purple-600 shrink-0 mt-0.5" />
                  <span>Use smooth transitions and micro-animations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-purple-600 shrink-0 mt-0.5" />
                  <span>Always provide clear next steps for users.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wide">BEST PRACTICES</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <span>Keep messages short, clear, and helpful.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <span>Provide primary and secondary actions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <span>Use relevant illustrations to improve clarity.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <span>Maintain accessibility and responsive behavior.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* PolyLance Zenith Protocol Card */}
          <div className="lg:col-span-4 bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between items-center text-center">
            <div className="my-auto flex flex-col items-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-indigo-500/15 flex items-center justify-center border border-blue-200/60 shadow-inner mb-4">
                <PolyLanceLogo size={46} className="filter drop-shadow-md" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">
                Build. Trust. <span className="text-purple-600">Earn.</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                The future of work is on-chain.
              </p>
            </div>

            <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold">
              <ShieldCheck size={16} /> PolyLance Zenith Protocol
            </div>
          </div>
        </div>

        {/* ── TECHNICAL SPECIFICATION FOOTER CONTAINER ───────────────────── */}
        <div className="p-7 bg-white rounded-3xl border border-slate-200/80 text-xs text-slate-500 leading-relaxed shadow-3xs">
          <div className="font-mono text-[11px] font-bold text-purple-600 uppercase tracking-widest mb-3">
            TECHNICAL ARCHITECTURE & SPECIFICATIONS
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-600">
            <div>
              <p className="font-semibold text-slate-900 mb-1">Design Tokens</p>
              <p>Light theme standard with curated HSL tailored colors (Purple, Blue, Cyan, Green, Amber, Red).</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-1">Card Architecture</p>
              <p>Stand-alone centered card layouts with soft borders, elevation shadows, and responsive constraints.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-1">Integration Ready</p>
              <p>Modular component export via <code className="text-purple-600 font-mono text-[11px]">@components/UIStates</code> with custom action callbacks.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
