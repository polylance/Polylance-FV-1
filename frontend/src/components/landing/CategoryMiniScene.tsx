import React, { useEffect, useState } from 'react';
import { Check, ShieldCheck, Scissors, PenTool } from 'lucide-react';

interface CategoryMiniSceneProps {
  slug: string;
}

const DOT_GRID_STYLE: React.CSSProperties = {
  backgroundColor: '#F8FAFC',
  backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
  backgroundSize: '16px 16px',
};

const AUDIO_WAVE = [0.35, 0.9, 0.55, 0.95, 0.45, 0.85, 0.65, 0.98, 0.5, 0.82, 0.6, 0.88];

const BLOCKS = [
  { id: '#4821', hash: '0x7f...9a' },
  { id: '#4822', hash: '0x4c...2e' },
  { id: '#4823', hash: '0x9b...1d' },
  { id: '#4824', hash: '0x3a...8f' },
];

/**
 * Rich, continuously looping Light-Theme storytelling animations for all 10 Work Categories.
 * Uses CSS keyframes + subtle state ticks so animations run reliably in all environments.
 * Strictly Brand Palette: Cobalt (#0A52B8), Electric Blue (#2563EB / #60A5FA / #DBEAFE), White (#FFFFFF), Slate.
 */
export const CategoryMiniScene: React.FC<CategoryMiniSceneProps> = ({ slug }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => (t + 1) % 24);
    }, 650);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      style={DOT_GRID_STYLE}
      className="relative w-full h-[190px] rounded-[14px] border border-slate-200/90 p-3 overflow-hidden select-none flex items-center justify-center"
      aria-label={`Animated workflow showcase for ${slug}`}
    >
      {/* 01: DEVELOPMENT & IT — Light-mode IDE card + typing bars + live deploy pill */}
      {slug === 'development-it' && (
        <div className="w-full h-full rounded-[12px] bg-white border border-slate-200 p-3.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              <span className="ml-2 text-[11px] font-mono text-[#475569]">api/router.ts</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[10px] font-mono font-semibold text-[#0A52B8]">
              <span className="pl-pulse-soft w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              <span>deploy.live</span>
            </div>
          </div>

          <div className="space-y-1.5 my-auto">
            {[
              { n: '01', w: '68%', color: '#0A52B8', delay: '0s' },
              { n: '02', w: '84%', color: '#2563EB', delay: '0.2s' },
              { n: '03', w: '56%', color: '#94A3B8', delay: '0.4s' },
              { n: '04', w: '76%', color: '#60A5FA', delay: '0.6s' },
              { n: '05', w: '44%', color: '#0A52B8', delay: '0.8s' },
            ].map((row) => (
              <div key={row.n} className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono text-[#64748B] w-4">{row.n}</span>
                <div className="flex-1 h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                  <div
                    className="pl-progress-step h-full rounded-full origin-left"
                    style={{ width: row.w, backgroundColor: row.color, animationDelay: row.delay }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] pt-1 border-t border-slate-100">
            <span>tests: 42/42 passing</span>
            <span className="text-[#0A52B8] font-semibold">200 OK · {12 + (tick % 5)}ms</span>
          </div>
        </div>
      )}

      {/* 02: AI & AUTOMATION — Light-mode multi-node agent DAG */}
      {slug === 'ai-automation' && (
        <div className="w-full h-full rounded-[12px] bg-white border border-slate-200 p-3 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
              Agent Orchestration Mesh
            </span>
            <span className="text-[10px] font-mono font-semibold text-[#0A52B8]">
              latency: {44 + (tick % 6)}ms
            </span>
          </div>

          <svg viewBox="0 0 420 122" className="w-full h-[122px]" fill="none" aria-hidden="true">
            <path d="M 54 61 C 110 20, 145 20, 200 61" stroke="#DBEAFE" strokeWidth="2.5" />
            <path d="M 54 61 C 110 102, 145 102, 200 61" stroke="#DBEAFE" strokeWidth="2.5" />
            <path d="M 200 61 C 255 20, 300 20, 366 38" stroke="#DBEAFE" strokeWidth="2.5" />
            <path d="M 200 61 C 255 102, 300 102, 366 84" stroke="#DBEAFE" strokeWidth="2.5" />

            <path
              d="M 54 61 C 110 20, 145 20, 200 61 C 255 102, 300 102, 366 84"
              stroke="#2563EB"
              strokeWidth="2.8"
              strokeDasharray="22 158"
              strokeLinecap="round"
              className="pl-dash-stream-lg"
            />
            <path
              d="M 54 61 C 110 102, 145 102, 200 61 C 255 20, 300 20, 366 38"
              stroke="#0A52B8"
              strokeWidth="2.8"
              strokeDasharray="22 158"
              strokeLinecap="round"
              className="pl-dash-stream-lg"
              style={{ animationDelay: '0.6s' }}
            />

            <g>
              <circle cx="54" cy="61" r="13" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
              <text x="54" y="88" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="monospace">Prompt</text>
            </g>
            <g>
              <circle cx="200" cy="61" r="23" fill="#DBEAFE" className="pl-pulse-soft" style={{ transformOrigin: '200px 61px' }} />
              <circle cx="200" cy="61" r="15" fill="#0A52B8" stroke="#60A5FA" strokeWidth="2" />
              <text x="200" y="96" textAnchor="middle" fill="#0F172A" fontSize="9" fontWeight="bold" fontFamily="monospace">Agent Core</text>
            </g>
            <g>
              <rect x="342" y="23" width="56" height="26" rx="7" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.5" />
              <text x="370" y="39" textAnchor="middle" fill="#0A52B8" fontSize="9" fontWeight="bold" fontFamily="monospace">API Tool</text>
            </g>
            <g>
              <rect x="342" y="71" width="56" height="26" rx="7" fill="#FFFFFF" stroke="#0A52B8" strokeWidth="1.5" />
              <text x="370" y="87" textAnchor="middle" fill="#0A52B8" fontSize="9" fontWeight="bold" fontFamily="monospace">Output ✓</text>
            </g>
          </svg>
        </div>
      )}

      {/* 03: WEB3 & BLOCKCHAIN */}
      {slug === 'web3-blockchain' && (
        <div className="w-full h-full flex flex-col justify-between py-0.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-mono font-semibold text-[#0A52B8]">
              Polygon Block Stream
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#DBEAFE] text-[10px] font-mono text-[#0A52B8]">
              <ShieldCheck size={12} className="text-[#2563EB]" />
              <span>Verified Contract Shield</span>
            </span>
          </div>

          <div className="relative flex items-center justify-between gap-2 px-1">
            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-[#E2E8F0] rounded-full overflow-hidden z-0">
              <div className="pl-sweep-x h-full w-1/3 bg-gradient-to-r from-[#0A52B8] via-[#2563EB] to-[#60A5FA] rounded-full" />
            </div>

            {BLOCKS.map((blk, i) => {
              const activeLock = tick % 4 === i;
              return (
                <div
                  key={blk.id}
                  style={{ transform: activeLock ? 'translateY(-4px) scale(1.04)' : 'translateY(0) scale(1)' }}
                  className={`relative z-10 w-[23%] rounded-xl p-2.5 border transition-all duration-300 ${
                    activeLock
                      ? 'bg-[#0A52B8] text-white border-[#2563EB] shadow-[0_8px_22px_rgba(37,99,235,0.25)]'
                      : 'bg-white text-[#0F172A] border-[#E2E8F0] shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold">{blk.id}</span>
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        activeLock ? 'bg-white text-[#0A52B8]' : 'bg-[#EFF6FF] text-[#0A52B8]'
                      }`}
                    >
                      <Check size={10} />
                    </span>
                  </div>
                  <div className={`font-mono text-[9.5px] truncate ${activeLock ? 'text-[#DBEAFE]' : 'text-[#64748B]'}`}>
                    {blk.hash}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] px-1">
            <span>State: Immutable Finality</span>
            <span className="text-[#0A52B8] font-semibold">Hash: 0x{((tick * 17 + 123) % 999).toString(16)}f...e9</span>
          </div>
        </div>
      )}

      {/* 04: DESIGN & CREATIVE */}
      {slug === 'design-creative' && (
        <div className="relative w-full h-full rounded-[12px] bg-white border border-[#E2E8F0] p-2.5 overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] pb-1 border-b border-slate-100">
            <span>Frame · 1440×900</span>
            <span className="text-[#2563EB] font-semibold">Auto-Layout · Gap 16px</span>
          </div>

          <div className="relative flex-1 my-1 flex items-center justify-center">
            <div aria-hidden="true" className="pl-pulse-soft absolute inset-y-0 left-1/2 w-px border-l border-dashed border-[#2563EB]" />
            <div aria-hidden="true" className="pl-pulse-soft absolute inset-x-4 top-1/2 h-px border-t border-dashed border-[#60A5FA]" />

            <div className="relative w-[86%] h-[102px] rounded-xl border border-slate-200 bg-[#F8FAFC] p-2.5 flex items-center gap-3">
              <div className="pl-snap-left relative w-22 h-18 rounded-lg bg-[#EFF6FF] border-2 border-[#2563EB] p-2 flex flex-col justify-between">
                <span className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-[#2563EB]" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-[#2563EB]" />
                <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-[#2563EB]" />
                <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-[#2563EB]" />
                <div className="w-5 h-5 rounded-md bg-[#0A52B8]" />
                <div className="h-1.5 w-12 rounded bg-[#60A5FA]" />
              </div>

              <span className="pl-pulse-soft px-1.5 py-0.5 rounded bg-[#2563EB] text-white font-mono text-[9px] font-bold shrink-0">
                16px
              </span>

              <div className="pl-snap-right flex-1 space-y-2">
                <div className="h-2.5 w-4/5 rounded-full bg-[#0F172A]" />
                <div className="h-2 w-3/5 rounded-full bg-slate-300" />
                <div className="h-5 w-20 rounded-md bg-[#0A52B8] flex items-center justify-center text-[9px] font-bold text-white">
                  CTA Button
                </div>
              </div>
            </div>

            <svg
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="none"
              className="pl-cursor-glide absolute bottom-1 left-16 z-20 drop-shadow"
            >
              <path
                d="M2.5 1.5L13 6.8L8.1 8.4L6.3 13.3L2.5 1.5Z"
                fill="#0A52B8"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}

      {/* 05: VIDEO, AUDIO & ANIMATION */}
      {slug === 'video-audio-animation' && (
        <div className="w-full h-full rounded-[12px] bg-white border border-slate-200 p-3 flex flex-col justify-between text-[#0F172A] shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#0A52B8] text-white font-semibold">V1 + FX + A1</span>
              <span className="inline-flex items-center gap-1 text-[#2563EB] font-semibold">
                <Scissors size={11} />
                <span>Cut Active</span>
              </span>
            </div>
            <span className="text-[#0A52B8] font-bold tabular-nums">
              00:04:{String(10 + (tick % 10)).padStart(2, '0')}
            </span>
          </div>

          <div className="relative space-y-1.5 py-0.5">
            <div aria-hidden="true" className="pl-playhead absolute top-0 bottom-0 left-4 w-0.5 bg-[#2563EB] z-20">
              <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[#0A52B8] rotate-45 rounded-[1px]" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-[#64748B] w-5">V1</span>
              <div className="flex-1 h-6 rounded bg-[#F8FAFC] border border-slate-200 p-1 flex gap-1.5">
                <span className="w-2/5 rounded bg-[#0A52B8]" />
                <span className="pl-pulse-soft w-1/4 rounded bg-[#2563EB]" />
                <span className="flex-1 rounded bg-[#60A5FA]" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-[#64748B] w-5">FX</span>
              <div className="flex-1 h-5 rounded bg-[#F8FAFC] border border-slate-200 px-3 flex items-center justify-between">
                {[0, 1, 2, 3].map((k) => (
                  <span
                    key={k}
                    className="pl-pulse-soft w-2.5 h-2.5 bg-[#2563EB] rotate-45 rounded-[1px]"
                    style={{ animationDelay: `${(k * 0.3).toFixed(2)}s` }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-[#64748B] w-5">A1</span>
              <div className="flex-1 h-8 rounded bg-[#F8FAFC] border border-slate-200 px-2 flex items-end justify-between gap-1 py-1">
                {AUDIO_WAVE.map((peak, i) => (
                  <span
                    key={i}
                    className="pl-bar-wave flex-1 rounded-full origin-bottom"
                    style={{
                      height: `${Math.round(peak * 20)}px`,
                      backgroundColor: i % 2 === 0 ? '#0A52B8' : '#60A5FA',
                      animationDuration: `${(1.1 + (i % 4) * 0.2).toFixed(2)}s`,
                      animationDelay: `${(i * 0.08).toFixed(2)}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 06: CREATORS & BRAND COLLABS */}
      {slug === 'creators-brand-collabs' && (
        <div className="w-full h-full flex items-center justify-between gap-3 px-2 relative">
          <div className="relative z-10 w-[132px] h-[142px] rounded-xl bg-white border border-blue-200 p-2.5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold text-[#0A52B8]">REEL · 9:16</span>
              <span className="pl-pulse-soft w-2 h-2 rounded-full bg-[#2563EB]" />
            </div>
            <div className="flex-1 my-1.5 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center">
              <div className="pl-pulse-soft w-7 h-7 rounded-full bg-[#0A52B8] flex items-center justify-center">
                <span className="ml-0.5 w-0 h-0 border-y-4 border-y-transparent border-l-6 border-l-white" />
              </div>
            </div>
            <div className="text-[9.5px] font-semibold text-[#0F172A]">Launch Feature</div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-2 relative">
            <svg viewBox="0 0 140 44" className="w-full h-10 overflow-visible" fill="none">
              <path d="M 4 32 Q 70 0 136 32" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />
              <path
                d="M 4 32 Q 70 0 136 32"
                stroke="#2563EB"
                strokeWidth="2.8"
                strokeDasharray="24 120"
                strokeLinecap="round"
                className="pl-dash-stream"
              />
            </svg>

            <div className="pl-float-a px-2.5 py-1 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[10px] font-bold text-[#0A52B8] whitespace-nowrap shadow-xs">
              +12.4K Views
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[9.5px] font-semibold text-[#0F172A]">
                4.8% Eng
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#0A52B8] text-[9.5px] font-semibold text-white">
                Sponsored ✓
              </span>
            </div>
          </div>

          <div className="relative z-10 w-[132px] h-[142px] rounded-xl bg-white border border-slate-200 p-2.5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-bold text-[#0A52B8] uppercase">Brand Brief</span>
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            </div>
            <div className="space-y-1.5">
              <div className="h-2 w-4/5 rounded bg-[#0F172A]" />
              <div className="h-2 w-3/5 rounded bg-slate-200" />
            </div>
            <div className="p-1.5 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] text-[10px] font-mono font-bold text-[#0A52B8] text-center">
              Approved Pack
            </div>
          </div>
        </div>
      )}

      {/* 07: MARKETING */}
      {slug === 'marketing' && (
        <div className="w-full h-full grid grid-cols-12 gap-3 items-center px-1">
          <div className="col-span-4 space-y-2">
            {['SEO', 'Paid Ads', 'Social'].map((ch, idx) => (
              <div
                key={ch}
                style={{ animationDelay: `${(idx * 0.35).toFixed(2)}s` }}
                className="pl-float-a flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs text-[11px] font-semibold text-[#0F172A]"
              >
                <span>{ch}</span>
                <span className="pl-pulse-soft w-2 h-2 rounded-full bg-[#2563EB]" />
              </div>
            ))}
          </div>

          <div className="col-span-8 h-[152px] rounded-xl bg-white border border-slate-200 p-2.5 flex flex-col justify-between relative">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[9.5px] font-bold text-[#0A52B8]">
                +142% Traffic
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#0A52B8] text-[9.5px] font-bold text-white">
                3.8x ROAS
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[9.5px] font-bold text-[#2563EB]">
                Conv. +28%
              </span>
            </div>

            <svg viewBox="0 0 260 88" className="w-full h-[94px] overflow-visible" fill="none">
              <defs>
                <linearGradient id="mktAreaLight" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path
                d="M 6 76 C 52 68, 74 50, 118 44 C 165 38, 195 20, 252 10 L 252 84 L 6 84 Z"
                fill="url(#mktAreaLight)"
              />
              <path
                d="M 6 76 C 52 68, 74 50, 118 44 C 165 38, 195 20, 252 10"
                stroke="#0A52B8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="300"
                className="pl-dash-draw"
              />
              {[
                { cx: 118, cy: 44 },
                { cx: 196, cy: 21 },
                { cx: 252, cy: 10 },
              ].map((pt, i) => (
                <circle
                  key={pt.cx}
                  cx={pt.cx}
                  cy={pt.cy}
                  r="4.5"
                  fill="#2563EB"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  className="pl-pulse-soft"
                  style={{ transformOrigin: `${pt.cx}px ${pt.cy}px`, animationDelay: `${(i * 0.4).toFixed(2)}s` }}
                />
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* 08: WRITING & CONTENT */}
      {slug === 'writing-content' && (
        <div className="w-full h-full rounded-[12px] bg-white border border-slate-200 p-3.5 flex flex-col justify-between relative shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="text-[11px] font-mono font-semibold text-[#0A52B8]">launch-messaging.md</span>
            <div className="pl-float-a inline-flex items-center gap-1 text-[10px] font-semibold text-[#2563EB]">
              <PenTool size={12} />
              <span>Editing</span>
            </div>
          </div>

          <div className="space-y-2.5 my-auto">
            <div className="relative overflow-hidden whitespace-nowrap font-bold text-[14.5px] text-[#0F172A]">
              <div className="pl-type-reveal inline-block overflow-hidden whitespace-nowrap border-r-2 border-[#2563EB] pr-1">
                Launch copy that{' '}
                <span className="bg-[#EFF6FF] text-[#0A52B8] px-1 rounded">converts cleanly.</span>
              </div>
            </div>

            <div className="relative overflow-hidden whitespace-nowrap text-[12.5px] text-[#475569]">
              <div className="pl-type-reveal inline-block overflow-hidden whitespace-nowrap" style={{ animationDelay: '0.5s' }}>
                Clear API docs &amp; release guides for developers worldwide.
              </div>
            </div>

            <div className="flex gap-2 pt-0.5">
              <span className="pl-progress-step h-2 w-1/2 rounded-full bg-[#0A52B8]/25 origin-left" />
              <span className="h-2 w-1/4 rounded-full bg-slate-200" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] pt-1 border-t border-slate-100">
            <span>Readability: Grade A</span>
            <span className="text-[#0A52B8] font-semibold">EN · ES · JP Ready</span>
          </div>
        </div>
      )}

      {/* 09: DATA & ANALYTICS */}
      {slug === 'data-analytics' && (
        <div className="w-full h-full rounded-[12px] bg-white border border-slate-200 p-3 flex flex-col justify-between relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold text-[#0F172A]">Retention &amp; Cohort Funnel</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#0A52B8] font-mono text-[10px] font-bold">
              {tick % 2 === 0 ? '+38.4% YoY' : '99.2% Accuracy'}
            </span>
          </div>

          <div className="relative flex-1 flex items-end justify-between gap-2.5 pt-4 pb-1 px-2">
            {[42, 64, 58, 86, 72, 94].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div
                  className="pl-bar-wave w-full rounded-t-[6px] origin-bottom"
                  style={{
                    height: `${h}%`,
                    background:
                      i === 5
                        ? 'linear-gradient(180deg, #60A5FA 0%, #0A52B8 100%)'
                        : i % 2 === 0
                        ? '#0A52B8'
                        : '#2563EB',
                    animationDuration: `${(2.0 + i * 0.18).toFixed(2)}s`,
                    animationDelay: `${(i * 0.14).toFixed(2)}s`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10: ADMIN & SUPPORT */}
      {slug === 'admin-support' && (
        <div className="w-full h-full grid grid-cols-12 gap-3 items-center">
          <div className="col-span-5 h-full rounded-xl bg-white border border-blue-200 p-2.5 text-[#0F172A] flex flex-col items-center justify-between shadow-xs">
            <div className="relative w-16 h-16 flex items-center justify-center mt-1">
              <span className="pl-ripple absolute inset-0 rounded-full border border-[#60A5FA]" />
              <span className="pl-spin-cw absolute inset-2 rounded-full border border-dashed border-[#2563EB]" />
              <ShieldCheck size={24} className="text-[#0A52B8] relative z-10" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[9.5px] font-mono font-semibold text-[#0A52B8]">
              Verified · 2FA Active
            </span>
          </div>

          <div className="col-span-7 h-full flex flex-col justify-between gap-1.5">
            {[
              { label: 'Role Permissions', idx: 0 },
              { label: 'Audit Log Sync', idx: 1 },
              { label: 'Ticket #402', idx: 2 },
            ].map((item) => {
              const resolved = (tick + item.idx) % 3 !== 0;
              return (
                <div
                  key={item.label}
                  style={{ transform: resolved ? 'translateX(0px)' : 'translateX(4px)' }}
                  className="transition-transform duration-300 flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs"
                >
                  <span className="text-[11px] font-semibold text-[#0F172A] truncate">
                    {item.label}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold ${
                      resolved
                        ? 'bg-[#EFF6FF] text-[#0A52B8] border border-[#DBEAFE]'
                        : 'bg-slate-100 text-[#64748B] border border-slate-200'
                    }`}
                  >
                    {resolved ? 'Resolved ✓' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryMiniScene;
