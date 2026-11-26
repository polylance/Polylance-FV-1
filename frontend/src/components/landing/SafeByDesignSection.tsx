import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pause, Play, RotateCcw, ShieldCheck, CheckCircle2, Layers } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Disclosure } from '../common/Disclosure';
import { ScrollReveal, ScrollRevealGroup, ScrollScaleShowcase, SpotlightCard } from '../common/MotionPrimitives';
import { useDataSaver, useReducedMotion } from '../../media/useDataSaver';

interface ClipSpec {
  id: string;
  stepNum: string;
  title: string;
  description: string;
  src720: string;
  src480: string;
  poster: string;
}

const CLIPS: ClipSpec[] = [
  {
    id: 'escrow-lock',
    stepNum: '01',
    title: 'Funds are held by a smart contract',
    description:
      'Before work begins, the client locks the milestone payment inside a dedicated escrow contract.',
    src720: '/videos/client-escrow-720p.mp4',
    src480: '/videos/client-escrow-480p.mp4',
    poster: '/videos/client-escrow.webp',
  },
  {
    id: 'client-approves',
    stepNum: '02',
    title: 'Payment releases when the client approves',
    description:
      'You submit deliverables directly inside the job workspace and get paid as soon as the client signs off.',
    src720: '/videos/submission-720p.mp4',
    src480: '/videos/submission-480p.mp4',
    poster: '/videos/submission.webp',
  },
  {
    id: 'independent-judges',
    stepNum: '03',
    title: 'Independent judges decide disputes',
    description:
      'If either party disagrees after review, independent arbitrators review the submitted proof and resolve payout.',
    src720: '/videos/dispute-720p.mp4',
    src480: '/videos/dispute-480p.mp4',
    poster: '/videos/dispute.webp',
  },
];

export const SafeByDesignSection: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const isDataSaver = useDataSaver();
  const noAutoplay = reducedMotion || isDataSaver;

  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [nearViewport, setNearViewport] = useState<boolean>(false);
  const [visibleRatio, setVisibleRatio] = useState<number>(0);
  const [tabVisible, setTabVisible] = useState<boolean>(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );
  const [userPaused, setUserPaused] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [allEnded, setAllEnded] = useState<boolean>(false);

  const activeClip = CLIPS[activeIdx] || CLIPS[0];

  // 1. Proximity Observer (300px before section): mounts <source> ONLY when near viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearViewport(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px 0px', threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 2. Visibility Ratio Observer: play >= 0.5, pause < 0.3
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setVisibleRatio(entry.intersectionRatio);
      },
      { threshold: [0, 0.3, 0.5, 0.75] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 3. Tab visibility guard
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisChange = () => {
      setTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, []);

  // 4. Coordinate video element playback cleanly
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !nearViewport) return;

    if (!tabVisible || visibleRatio < 0.3 || userPaused || allEnded) {
      if (!video.paused) video.pause();
      return;
    }

    if (visibleRatio >= 0.5 && !noAutoplay) {
      video.play().catch(() => {
        // Browser autoplay blocked cleanly; user Play button stays available
      });
    }
  }, [nearViewport, visibleRatio, tabVisible, userPaused, allEnded, noAutoplay, activeIdx]);

  const selectClip = (idx: number) => {
    setActiveIdx(idx);
    setAllEnded(false);
    setUserPaused(false);
    setNearViewport(true);
  };

  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (allEnded) {
      selectClip(0);
      return;
    }
    if (video.paused) {
      setUserPaused(false);
      video.play().catch(() => {});
    } else {
      setUserPaused(true);
      video.pause();
    }
  };

  const handleClipEnded = () => {
    if (activeIdx < CLIPS.length - 1) {
      setActiveIdx((prev) => prev + 1);
    } else {
      setAllEnded(true);
      setIsPlaying(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      aria-label="Safe by design"
      className="w-full bg-[#F8FAFC] border-b border-slate-200/80 py-16 sm:py-24 scroll-mt-20"
    >
      <PageContainer noVerticalPadding>
        <div className="space-y-10 text-left">
          <ScrollReveal>
            <div className="max-w-2xl space-y-2.5">
              <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#0A52B8]">
                Safe by design
              </p>
              <h2 className="text-landing-h2 text-[#0F172A]" style={{ textWrap: 'balance' }}>
                You stay in control of the money at every step.
              </h2>
              <p className="text-lead text-[#475569]">
                See how smart contracts hold funds, verify approval, and settle disputes without middlemen.
              </p>
            </div>
          </ScrollReveal>

          {/* Mobile (<lg): Stories-style 3-segment progress bars */}
          <div className="lg:hidden grid grid-cols-3 gap-2">
            {CLIPS.map((clip, idx) => (
              <button
                key={clip.id}
                type="button"
                onClick={() => selectClip(idx)}
                aria-label={`Step ${clip.stepNum}: ${clip.title}`}
                className="py-1 cursor-pointer"
              >
                <span
                  className={`block h-1.5 rounded-full transition-colors ${
                    idx <= activeIdx ? 'bg-[#0047AB]' : 'bg-[#E2E5EA]'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT: Clean Video Stage (scroll-linked scale 0.94 -> 1 + reveal showcase) */}
            <div className="lg:col-span-7 space-y-4">
              <ScrollScaleShowcase>
                <div className="relative w-full aspect-video bg-[#0B0B0C] rounded-[16px] border border-[#E2E5EA] shadow-[0_12px_36px_rgba(11,11,12,0.10)] overflow-hidden">
                  <video
                    ref={videoRef}
                    key={activeClip.id}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload={nearViewport ? 'metadata' : 'none'}
                    poster={activeClip.poster}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={handleClipEnded}
                  >
                    {nearViewport && (
                      <>
                        <source
                          media="(max-width: 767px)"
                          src={activeClip.src480}
                          type="video/mp4"
                        />
                        <source src={activeClip.src720} type="video/mp4" />
                      </>
                    )}
                  </video>

                  {/* Visible Pause / Play / Replay Control */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    {allEnded ? (
                      <button
                        type="button"
                        onClick={() => selectClip(0)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] bg-white border border-[#D1D5DB] shadow-sm text-[13px] font-semibold text-[#0B0B0C] hover:bg-[#F5F6F8] cursor-pointer"
                      >
                        <RotateCcw size={14} />
                        <span>Replay</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleTogglePlay}
                        aria-label={isPlaying ? 'Pause walkthrough video' : 'Play walkthrough video'}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] bg-white border border-[#D1D5DB] shadow-sm text-[13px] font-semibold text-[#0B0B0C] hover:bg-[#F5F6F8] cursor-pointer"
                      >
                        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        <span>{isPlaying ? 'Pause' : 'Play'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </ScrollScaleShowcase>

              {/* Technical details expander + audit notice below stage */}
              <div className="space-y-3">
                <Disclosure title="Technical details" subtitle="Smart contract standards and escrow settlement">
                  <p>
                    Each job deploys a minimal clone contract using ERC-1167 proxies behind a verified JobFactory on Polygon Mainnet (Chain ID 137).
                    Authentication uses EIP-4361 message signing without passwords or email collection. Completed work settles directly from contract balance and mints ERC-721 Soulbound Tokens.
                  </p>
                </Disclosure>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[14px] text-[#4B5563] px-1">
                  <span>Independent audit: Pending (internal security test suite active).</span>
                  <Link to="/security" className="font-semibold text-[#0047AB] hover:underline">
                    Read security policy
                  </Link>
                </div>
              </div>
            </div>

            {/* RIGHT: 3 Interactive Step Controls with Hover Glow */}
            <div className="lg:col-span-5 divide-y divide-[#E2E8F0] border-y border-[#E2E8F0] bg-white rounded-[14px] border-x overflow-hidden shadow-[0_6px_24px_rgba(10,13,20,0.04)]">
              {CLIPS.map((clip, idx) => {
                const isSelected = idx === activeIdx;
                return (
                  <button
                    key={clip.id}
                    type="button"
                    onClick={() => selectClip(idx)}
                    aria-current={isSelected ? 'step' : undefined}
                    className={`w-full p-5 text-left transition-colors cursor-pointer border-l-4 ${
                      isSelected
                        ? 'bg-[#EFF6FF]/75 border-l-[#0A52B8]'
                        : 'bg-white border-l-transparent hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <span
                        className={`text-[13px] font-bold tabular-nums pt-0.5 ${
                          isSelected ? 'text-[#0A52B8]' : 'text-[#64748B]'
                        }`}
                      >
                        {clip.stepNum}
                      </span>
                      <div className="space-y-1">
                        <h3 className="text-[16px] font-bold text-[#0A0D14] leading-snug">
                          {clip.title}
                        </h3>
                        <p className="text-[14px] text-[#475569] leading-relaxed">
                          {clip.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3 Equal-Height, Horizontally Aligned Security & Trust Cards */}
          <ScrollRevealGroup staggerSec={0.09} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch pt-2">
            {/* Card 1: Contract-Locked Escrow */}
            <SpotlightCard
              spotlightColor="rgba(37, 99, 235, 0.08)"
              className="h-full p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm"
            >
              <div className="h-full flex flex-col justify-between gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between h-10">
                    <div className="relative w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#0A52B8] overflow-hidden shrink-0">
                      <ShieldCheck size={18} />
                      <span className="pl-scan-y absolute inset-x-0 h-0.5 bg-[#2563EB]" />
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-[#0A52B8] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#DBEAFE]">
                      Non-Custodial
                    </span>
                  </div>
                  <h3 className="text-[16px] font-bold text-[#0F172A] leading-snug">
                    Contract-Locked Escrow
                  </h3>
                </div>

                <p className="text-[13.5px] leading-relaxed text-[#64748B]">
                  Funds sit in isolated ERC-1167 smart contracts, never on company servers.
                </p>
              </div>
            </SpotlightCard>

            {/* Card 2: Instant Wallet Settlement */}
            <SpotlightCard
              spotlightColor="rgba(37, 99, 235, 0.08)"
              className="h-full p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm"
            >
              <div className="h-full flex flex-col justify-between gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between h-10">
                    <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] shrink-0">
                      <CheckCircle2 size={18} />
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#0A52B8] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#DBEAFE]">
                      <span className="pl-pulse-soft w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                      Chain 137 Live
                    </span>
                  </div>
                  <h3 className="text-[16px] font-bold text-[#0F172A] leading-snug">
                    Instant Wallet Settlement
                  </h3>
                </div>

                <p className="text-[13.5px] leading-relaxed text-[#64748B]">
                  Sign off on deliverables and settle POL or USDC straight to your wallet.
                </p>
              </div>
            </SpotlightCard>

            {/* Card 3: Transparent 2.5% + 2.5% */}
            <SpotlightCard
              spotlightColor="rgba(37, 99, 235, 0.08)"
              className="h-full p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm"
            >
              <div className="h-full flex flex-col justify-between gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between h-10">
                    <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#0A52B8] shrink-0">
                      <Layers size={18} />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-[#0A52B8] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#DBEAFE]">
                      5% Flat Fee
                    </span>
                  </div>
                  <h3 className="text-[16px] font-bold text-[#0F172A] leading-snug">
                    Transparent 2.5% + 2.5%
                  </h3>
                </div>

                <div className="space-y-2 pt-0.5">
                  <div className="flex items-center gap-2 text-[10.5px] font-mono font-semibold text-[#0A52B8]">
                    <span className="w-20 shrink-0">PolyLance 5%</span>
                    <div className="flex-1 h-2 rounded-full bg-[#EFF6FF] overflow-hidden">
                      <motion.div
                        className="h-full bg-[#0A52B8] rounded-full origin-left"
                        initial={{ width: '0%' }}
                        whileInView={{ width: '25%' }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10.5px] font-mono text-[#64748B]">
                    <span className="w-20 shrink-0">Legacy 20%</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        className="h-full bg-slate-300 rounded-full origin-left"
                        initial={{ width: '0%' }}
                        whileInView={{ width: '100%' }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 1.0, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </ScrollRevealGroup>
        </div>
      </PageContainer>
    </section>
  );
};

export default SafeByDesignSection;
