import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ExplainerScene {
  id: string;
  headline: string;
  subcopy: string;
  bg: string;
  scrimRgb: string;
  text: string;
  muted: string;
  videoSrc: string;
  durationMs: number;
  objectPosition: string;
}

const SCENES: ExplainerScene[] = [
  {
    id: 'problem',
    headline: '20% fees. 30-day holds. Unpaid revisions.',
    subcopy:
      'Legacy freelance platforms carve up payouts, hold funds for weeks, and leave creative and technical contractors unprotected when scopes shift.',
    bg: '#5C1A2B',
    scrimRgb: '92, 26, 43',
    text: '#FFFFFF',
    muted: '#F3E4E7',
    videoSrc: '/videos/explainer/scene-01-problem.mp4',
    durationMs: 4050,
    objectPosition: '50% 15%',
  },
  {
    id: 'escrow',
    headline: 'Meet PolyLance. Smart-contract escrow on Polygon.',
    subcopy:
      'Clients fund milestone budgets into isolated ERC-1167 smart contracts before any work begins — zero middleman custody.',
    bg: '#0A52B8',
    scrimRgb: '10, 82, 184',
    text: '#FFFFFF',
    muted: '#E0ECFF',
    videoSrc: '/videos/explainer/scene-02-escrow.mp4',
    durationMs: 3950,
    objectPosition: '50% 12%',
  },
  {
    id: 'talent',
    headline: 'For developers, designers, editors & creators.',
    subcopy:
      'Dual verification tracks honor both GitHub engineering history and creative portfolio showcases alongside transparent Client Trust Scores.',
    bg: '#0F3D2E',
    scrimRgb: '15, 61, 46',
    text: '#FFFFFF',
    muted: '#DCF0E5',
    videoSrc: '/videos/explainer/scene-03-talent.mp4',
    durationMs: 3950,
    objectPosition: '50% 0%',
  },
  {
    id: 'settlement',
    headline: 'Approve work. Settle in ~2 seconds. 5% flat fee.',
    subcopy:
      'Direct POL or USDC settlement straight to your wallet, an on-chain Soulbound Work Certificate, and neutral 3-judge peer arbitration.',
    bg: '#0F172A',
    scrimRgb: '15, 23, 42',
    text: '#FFFFFF',
    muted: '#CBD5E1',
    videoSrc: '/videos/explainer/scene-04-settlement.mp4',
    durationMs: 4050,
    objectPosition: '50% 8%',
  },
];

export const WhatIsPolyLanceSection: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const advancedForIdxRef = useRef<number | null>(null);

  const advanceToNextScene = useCallback((expectedIdx: number) => {
    if (advancedForIdxRef.current === expectedIdx) return;
    advancedForIdxRef.current = expectedIdx;
    setActiveIdx((expectedIdx + 1) % SCENES.length);
  }, []);

  useEffect(() => {
    advancedForIdxRef.current = null;
    const currentScene = SCENES[activeIdx];
    const vid = videoRef.current;
    if (vid) {
      try {
        vid.currentTime = 0;
        const p = vid.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch {
        // Ignore headless autoplay blocks
      }
    }

    // Fallback advance timer in case media events are throttled in background tabs
    const fallbackTimer = window.setTimeout(() => {
      advanceToNextScene(activeIdx);
    }, currentScene.durationMs + 450);

    return () => window.clearTimeout(fallbackTimer);
  }, [activeIdx, advanceToNextScene]);

  const activeScene = SCENES[activeIdx];

  return (
    <section
      id="what-is-polylance"
      aria-label="What is PolyLance interactive explainer"
      className="relative z-0 w-full bg-[#F8FAFC] py-16 sm:py-24 scroll-mt-28 border-b border-slate-200/70"
    >
      <div className="max-w-[1440px] w-full mx-auto px-6 lg:px-10 text-left">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-mono font-semibold uppercase tracking-widest text-[#0A52B8]">
              WHAT IS POLYLANCE
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]"
              style={{ textWrap: 'balance' }}
            >
              Built to fix broken freelancing.
            </h2>
          </div>

          <p className="text-sm text-slate-600 max-w-md">
            An interactive walkthrough of how non-custodial Polygon escrow, cross-skill proof, and ~2s payout finality replace legacy middlemen.
          </p>
        </div>

        {/* Centerpiece 16:9 Clean Auto-Playing 4-Scene Video Stage */}
        <div className="mt-8 rounded-[28px] overflow-hidden border border-slate-200 shadow-lg bg-white">
          <div
            className="relative w-full min-h-[420px] sm:min-h-[480px] lg:h-[600px] xl:h-[640px] transition-colors duration-500 overflow-hidden"
            style={{ backgroundColor: activeScene.bg, color: activeScene.text }}
          >
            {/* Background Video Layer Cycling Sequentially 1 -> 2 -> 3 -> 4 -> 1 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScene.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
                style={{ backgroundColor: activeScene.bg }}
              >
                <video
                  ref={videoRef}
                  key={activeScene.id}
                  src={activeScene.videoSrc}
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  onLoadedData={() => {
                    videoRef.current?.play().catch(() => {});
                  }}
                  onEnded={() => advanceToNextScene(activeIdx)}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition: activeScene.objectPosition }}
                />

                {/* Left-side directional scrim for crisp white copy above the video */}
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-full lg:w-[60%] pointer-events-none"
                  style={{
                    background: `linear-gradient(to right, rgba(${activeScene.scrimRgb}, 0.9) 0%, rgba(${activeScene.scrimRgb}, 0.55) 56%, rgba(${activeScene.scrimRgb}, 0) 100%)`,
                  }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Clean Foreground Text Above Video */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`copy-${activeScene.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 h-full min-h-[420px] sm:min-h-[480px] lg:min-h-[600px] xl:min-h-[640px] flex items-center px-6 py-10 sm:px-12 sm:py-12 pointer-events-none"
              >
                <div className="w-full lg:max-w-[44%] space-y-4">
                  <motion.h3
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04, duration: 0.24 }}
                    className="text-2xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-[1.12] drop-shadow-xs"
                    style={{ color: activeScene.text, textWrap: 'balance' }}
                  >
                    {activeScene.headline}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08, duration: 0.24 }}
                    className="text-sm sm:text-base leading-relaxed max-w-xl"
                    style={{ color: activeScene.muted }}
                  >
                    {activeScene.subcopy}
                  </motion.p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export const BuiltOnPolyLanceSection = WhatIsPolyLanceSection;
export default WhatIsPolyLanceSection;
