import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface HeroAbstractKineticVisualProps {
  pointerX: number; // normalized [0..1] across hero section
  pointerY: number; // normalized [0..1] across hero section
  pointerActive: boolean;
}

const WAVE_BARS = [0.48, 0.86, 0.62, 0.96, 0.54, 0.9, 0.72, 0.44, 0.78];

/**
 * High-FPS abstract kinetic visual for the Hero right stage.
 * - Canvas 2D interactive dot-matrix grid with cursor illumination.
 * - SVG spline ribbons + dashed energy stream + wave curve animated continuously (StrictMode-safe).
 * - 4 crisp white glassmorphic tiles with GPU CSS keyframes (.pl-bar-wave, .pl-spin-cw, .pl-cursor-glide) & mouse tilt.
 * - Strictly Cobalt Blue (#0A52B8), Electric Blue (#2563EB), Sky Blue (#60A5FA), White & Slate.
 */
export const HeroAbstractKineticVisual: React.FC<HeroAbstractKineticVisualProps> = ({
  pointerX,
  pointerY,
  pointerActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerStateRef = useRef({ x: 0.65, y: 0.48, active: false });

  useEffect(() => {
    pointerStateRef.current = { x: pointerX, y: pointerY, active: pointerActive };
  }, [pointerX, pointerY, pointerActive]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 22, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 120, damping: 22, mass: 0.6 });

  const rotateY = useTransform(sx, [-0.5, 0.5], [-6, 6]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [6, -6]);
  const layerOffsetX = useTransform(sx, [-0.5, 0.5], [-10, 10]);
  const layerOffsetY = useTransform(sy, [-0.5, 0.5], [-8, 8]);

  useEffect(() => {
    if (!pointerActive) {
      mx.set(0);
      my.set(0);
      return;
    }
    mx.set(pointerX - 0.5);
    my.set(pointerY - 0.5);
  }, [pointerX, pointerY, pointerActive, mx, my]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let active = true;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(320, rect.width);
      height = Math.max(320, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = (timeMs: number) => {
      if (!active) return;
      ctx.clearRect(0, 0, width, height);
      const t = timeMs * 0.0016;
      const gap = 22;
      const cols = Math.ceil(width / gap);
      const rows = Math.ceil(height / gap);
      const ptr = pointerStateRef.current;
      const px = ptr.x * width;
      const py = ptr.y * height;

      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const x = c * gap + 11;
          const y = r * gap + 11;

          const nx = (x / width - 0.52) * 1.9;
          const ny = (y / height - 0.5) * 1.9;
          const radial = Math.max(0, 1 - Math.hypot(nx, ny));
          if (radial <= 0.02) continue;

          const wave = Math.sin(c * 0.35 + t) * Math.cos(r * 0.35 - t * 0.85);
          let proximity = 0;
          if (ptr.active) {
            const dist = Math.hypot(x - px, y - py);
            if (dist < 150) {
              proximity = Math.pow(1 - dist / 150, 1.8);
            }
          }

          const radius = 1.15 + Math.max(0, wave) * 0.6 + proximity * 1.9;
          const alpha = radial * (0.14 + Math.max(0, wave) * 0.16 + proximity * 0.62);

          if (proximity > 0.15) {
            ctx.fillStyle = `rgba(37, 99, 235, ${Math.min(0.9, alpha + 0.15).toFixed(3)})`;
          } else {
            ctx.fillStyle = `rgba(10, 82, 184, ${alpha.toFixed(3)})`;
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafId = window.requestAnimationFrame(draw);
    };

    rafId = window.requestAnimationFrame(draw);

    return () => {
      active = false;
      window.removeEventListener('resize', resize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="relative w-full h-[320px] sm:h-[380px] lg:h-[440px] max-h-[460px] mx-auto select-none pointer-events-none"
      style={{
        perspective: '1100px',
        WebkitMaskImage:
          'radial-gradient(ellipse 88% 86% at 50% 50%, #000 64%, rgba(0,0,0,0.45) 85%, transparent 100%)',
        maskImage:
          'radial-gradient(ellipse 88% 86% at 50% 50%, #000 64%, rgba(0,0,0,0.45) 85%, transparent 100%)',
      }}
    >
      {/* 1. Interactive Canvas Dot-Matrix Grid */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* 2. Subtle Soft Ice-Blue Ambient Wash */}
      <div
        className="absolute inset-8 rounded-full blur-3xl opacity-70"
        style={{
          background:
            'radial-gradient(circle at 52% 48%, rgba(219, 234, 254, 0.72) 0%, rgba(96, 165, 250, 0.16) 48%, transparent 80%)',
        }}
      />

      {/* 3. Continuous Gradient Ribbons + Flowing Dashed Telemetry Path (SVG + CSS keyframes) */}
      <motion.svg
        style={{ x: layerOffsetX, y: layerOffsetY }}
        viewBox="0 0 640 460"
        fill="none"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <linearGradient id="ribbonPrimary" x1="0%" y1="15%" x2="100%" y2="85%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.12" />
            <stop offset="45%" stopColor="#0A52B8" stopOpacity="0.48" />
            <stop offset="85%" stopColor="#2563EB" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="ribbonAccent" x1="100%" y1="10%" x2="0%" y2="90%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#2563EB" stopOpacity="0.54" />
            <stop offset="100%" stopColor="#0A52B8" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        <path
          d="M 24 295 C 150 185, 265 365, 395 245 C 495 155, 560 210, 618 145"
          stroke="url(#ribbonPrimary)"
          strokeWidth="20"
          strokeLinecap="round"
        >
          <animate
            attributeName="d"
            dur="10s"
            repeatCount="indefinite"
            values="M 24 295 C 150 185, 265 365, 395 245 C 495 155, 560 210, 618 145;M 24 255 C 165 340, 290 165, 415 235 C 510 290, 570 150, 618 195;M 24 295 C 150 185, 265 365, 395 245 C 495 155, 560 210, 618 145"
          />
        </path>

        <path
          d="M 40 160 C 185 250, 295 85, 440 200 C 530 270, 580 230, 622 295"
          stroke="url(#ribbonAccent)"
          strokeWidth="6"
          strokeLinecap="round"
        >
          <animate
            attributeName="d"
            dur="8.5s"
            repeatCount="indefinite"
            values="M 40 160 C 185 250, 295 85, 440 200 C 530 270, 580 230, 622 295;M 40 205 C 175 110, 325 285, 450 175 C 525 110, 585 270, 622 240;M 40 160 C 185 250, 295 85, 440 200 C 530 270, 580 230, 622 295"
          />
        </path>

        <path
          d="M 18 360 C 160 320, 285 220, 420 315 C 505 375, 570 320, 618 260"
          stroke="#2563EB"
          strokeOpacity="0.48"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="10 10"
          className="pl-dash-stream"
        />
      </motion.svg>

      {/* 4. Floating Crisp White Motion Tiles */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full h-full"
      >
        {/* Tile A: Live-Bouncing Activity Bar Wave */}
        <div
          className="pl-float-a absolute top-[9%] left-[7%] sm:left-[10%] w-[184px] sm:w-[204px] rounded-2xl backdrop-blur-md bg-white/90 border border-[#E2E8F0] shadow-[0_14px_38px_rgba(10,82,184,0.10)] p-3.5"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="h-2 w-14 rounded-full bg-[#DBEAFE]" />
            <span className="pl-pulse-soft w-2 h-2 rounded-full bg-[#2563EB]" />
          </div>
          <div className="flex items-end justify-between gap-1.5 h-11 px-1">
            {WAVE_BARS.map((peak, i) => (
              <span
                key={i}
                className="pl-bar-wave w-2 rounded-full origin-bottom"
                style={{
                  height: `${Math.round(peak * 40)}px`,
                  background: i % 3 === 1 ? '#60A5FA' : i % 2 === 0 ? '#0A52B8' : '#2563EB',
                  animationDuration: `${(1.35 + (i % 4) * 0.22).toFixed(2)}s`,
                  animationDelay: `${(i * 0.11).toFixed(2)}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Tile B: Continuously Orbiting Cobalt & Electric Blue Dots */}
        <div
          className="pl-float-b absolute top-[13%] right-[6%] sm:right-[8%] w-[152px] sm:w-[170px] aspect-square rounded-2xl backdrop-blur-md bg-white/90 border border-[#E2E8F0] shadow-[0_16px_42px_rgba(10,82,184,0.11)] flex items-center justify-center"
        >
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg viewBox="0 0 120 120" className="pl-spin-cw w-full h-full" fill="none">
              <circle cx="60" cy="60" r="46" stroke="#0A52B8" strokeOpacity="0.22" strokeWidth="1.5" strokeDasharray="6 6" />
              <circle cx="60" cy="14" r="4.5" fill="#2563EB" />
            </svg>
            <svg viewBox="0 0 120 120" className="pl-spin-ccw absolute inset-0 w-full h-full" fill="none">
              <circle cx="60" cy="60" r="30" stroke="#60A5FA" strokeOpacity="0.65" strokeWidth="2" strokeDasharray="32 20" />
              <circle cx="90" cy="60" r="3.5" fill="#0A52B8" />
            </svg>
            <div className="pl-pulse-soft w-7 h-7 rounded-lg bg-gradient-to-br from-[#0A52B8] to-[#2563EB] shadow-[0_4px_14px_rgba(10,82,184,0.3)] rotate-45" />
          </div>
        </div>

        {/* Tile C: Smooth Gliding Cursor Moving Across & Clicking 3 Interface Pills */}
        <div
          className="pl-float-a absolute bottom-[13%] left-[9%] sm:left-[13%] w-[210px] sm:w-[230px] rounded-2xl backdrop-blur-md bg-white/90 border border-[#E2E8F0] shadow-[0_14px_38px_rgba(15,23,42,0.08)] p-3"
          style={{ animationDelay: '0.8s' }}
        >
          <div className="relative flex items-center gap-1.5 p-1 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            {[0, 1, 2].map((seg) => (
              <div key={seg} className="relative flex-1 h-7 rounded-lg flex items-center justify-center">
                <span
                  className={`h-2 rounded-full ${
                    seg === 1 ? 'w-8 bg-[#0A52B8]/75' : 'w-7 bg-[#94A3B8]/50'
                  }`}
                />
              </div>
            ))}
            <div className="pl-pill-slide absolute top-1 bottom-1 left-1 w-[31%] rounded-lg bg-[#2563EB]/15 border border-[#2563EB]/40" />
            <svg
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="none"
              className="pl-cursor-glide absolute -bottom-2 left-5 drop-shadow-sm"
            >
              <path
                d="M2.5 1.5L13 6.8L8.1 8.4L6.3 13.3L2.5 1.5Z"
                fill="#0F172A"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Tile D: Flowing Harmonic Wave Path */}
        <div
          className="pl-float-b hidden sm:flex absolute bottom-[10%] right-[7%] w-[158px] rounded-2xl backdrop-blur-md bg-white/90 border border-[#E2E8F0] shadow-[0_12px_32px_rgba(10,82,184,0.10)] px-3.5 py-2.5 flex-col gap-2"
          style={{ animationDelay: '1.1s' }}
        >
          <div className="flex items-center justify-between">
            <span className="h-2 w-10 rounded-full bg-[#2563EB]" />
            <span className="h-2 w-6 rounded-full bg-[#DBEAFE]" />
          </div>
          <svg viewBox="0 0 140 32" fill="none" className="w-full h-7 overflow-visible">
            <path
              d="M 2 20 Q 25 4, 48 18 T 94 16 T 138 12"
              stroke="#DBEAFE"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M 2 20 Q 25 4, 48 18 T 94 16 T 138 12"
              stroke="#0A52B8"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeDasharray="48 110"
              className="pl-dash-stream"
            >
              <animate
                attributeName="d"
                dur="3.6s"
                repeatCount="indefinite"
                values="M 2 20 Q 25 4, 48 18 T 94 16 T 138 12;M 2 14 Q 25 28, 48 14 T 94 20 T 138 10;M 2 20 Q 25 4, 48 18 T 94 16 T 138 12"
              />
            </path>
          </svg>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroAbstractKineticVisual;
