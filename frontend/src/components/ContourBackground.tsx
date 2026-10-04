import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ContourBackgroundProps {
  /** Number of contour lines (default: 35 on desktop, 20 on mobile) */
  lineCount?: number;
  /** Amplitude of the vertical contour waves in px (default: 28) */
  amplitude?: number;
  /** Speed of noise time advancement per frame (default: 0.0003) */
  speed?: number;
  /** Interactive mouse ripple on desktop (default: true) */
  interactive?: boolean;
  /** Ref to hero headline/subtitle container to feather calm zone */
  calmZoneRef?: React.RefObject<HTMLElement | null>;
  /** Padding around calm zone in px (default: 48) */
  calmZonePadding?: number;
  /** Color overrides */
  colors?: {
    primary?: string; // Cobalt #0047AB
    gray?: string;    // Gray #8892A0
  };
  className?: string;
  /** Temporary test flag to verify layering (fills background red) */
  testRedBackground?: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// Inline 2D Perlin Noise Implementation (Library-Free, Ultra-Fast)
// ──────────────────────────────────────────────────────────────────────────────
const PERMUTATION = [
  151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
  8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
  35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
  134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
  55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
  18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,
  226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,
  17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,
  167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,
  246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,
  14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,
  4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,
  156,180
];

const pTable = new Uint8Array(512);
for (let i = 0; i < 256; i++) {
  pTable[i] = PERMUTATION[i];
  pTable[256 + i] = PERMUTATION[i];
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t: number, a: number, b: number): number {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number): number {
  const h = hash & 7;
  const u = h < 4 ? x : y;
  const v = h < 4 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function noise2D(x: number, y: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);
  const A = pTable[X] + Y;
  const B = pTable[X + 1] + Y;
  return lerp(
    v,
    lerp(u, grad(pTable[A], xf, yf), grad(pTable[B], xf - 1, yf)),
    lerp(u, grad(pTable[A + 1], xf, yf - 1), grad(pTable[B + 1], xf - 1, yf - 1))
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// ContourBackground Component
// ──────────────────────────────────────────────────────────────────────────────
export const ContourBackground: React.FC<ContourBackgroundProps> = ({
  lineCount: propLineCount,
  amplitude = 28,
  speed = 0.0003,
  interactive = true,
  calmZoneRef,
  calmZonePadding = 48,
  colors,
  className = '',
  testRedBackground = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isTouchDevice =
      typeof window !== 'undefined' &&
      (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        window.matchMedia('(pointer: coarse)').matches);

    // Color tokens
    const computedStyle = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
    const cobaltHex = colors?.primary || computedStyle?.getPropertyValue('--primary').trim() || '#0047AB';
    const grayHex = colors?.gray || computedStyle?.getPropertyValue('--ink-3').trim() || '#8892A0';

    // Parse rgb
    const parseRgb = (hex: string): [number, number, number] => {
      let c = hex.replace('#', '').trim();
      if (c.length === 3) c = c.split('').map((x) => x + x).join('');
      const n = parseInt(c, 16);
      if (isNaN(n)) return [0, 71, 171];
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };

    const [cobaltR, cobaltG, cobaltB] = parseRgb(cobaltHex);
    const [grayR, grayG, grayB] = parseRgb(grayHex);

    let width = window.innerWidth;
    let height = window.innerHeight;
    let lines = propLineCount ?? (width < 768 ? 20 : 36);
    let pointsPerLine = width < 768 ? 60 : 120;

    // Mouse tracking for desktop ripple
    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      active: false,
    };

    // Cached calm zone rect
    let calmRect: { left: number; top: number; right: number; bottom: number } | null = null;
    const updateCalmRect = () => {
      if (calmZoneRef?.current) {
        const b = calmZoneRef.current.getBoundingClientRect();
        calmRect = {
          left: b.left - calmZonePadding,
          top: b.top - calmZonePadding,
          right: b.right + calmZonePadding,
          bottom: b.bottom + calmZonePadding,
        };
      } else {
        calmRect = null;
      }
    };

    // Scroll tracking
    let scrollY = window.scrollY || 0;
    const handleScroll = () => {
      scrollY = window.scrollY || 0;
      updateCalmRect();
    };

    // Canvas resize handling with DPR cap at 2
    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      lines = propLineCount ?? (width < 768 ? 20 : 36);
      pointsPerLine = width < 768 ? 60 : 120;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      updateCalmRect();
    };

    resizeCanvas();
    updateCalmRect();

    // Noise time progression
    let noiseTime = 0;
    let rafId: number | null = null;
    let lastTime = performance.now();
    let slowFrames = 0;
    let targetInterval = 1000 / 60; // 60fps

    // Soft feathered calm zone calculation (smoothstep falloff, no hard box)
    const getCalmMultiplier = (x: number, y: number) => {
      if (!calmRect) return { amp: 1.0, alpha: 1.0 };
      const dx = Math.max(0, calmRect.left - x, x - calmRect.right);
      const dy = Math.max(0, calmRect.top - y, y - calmRect.bottom);
      const dist = Math.hypot(dx, dy);
      const feather = 80; // 80px smooth edge falloff

      if (dist >= feather) {
        return { amp: 1.0, alpha: 1.0 };
      }
      const t = dist / feather;
      // Smoothstep 3t^2 - 2t^3
      const ease = t * t * (3 - 2 * t);
      // Reduce amplitude to 30%, alpha to 25% inside calm zone
      const amp = 0.30 + 0.70 * ease;
      const alpha = 0.25 + 0.75 * ease;
      return { amp, alpha };
    };

    // Render single frame
    const renderFrame = (dtFactor: number) => {
      ctx.clearRect(0, 0, width, height);

      // Diagnostic layering test mode
      if (testRedBackground) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
        ctx.fillRect(0, 0, width, height);
      }

      // Overall intensity by section: hero strongest (100%), middle sections 50%
      const sectionFactor = scrollY < 150 ? 1.0 : Math.max(0.5, 1.0 - ((scrollY - 150) / 400) * 0.5);

      // Light vertical noise drift with scroll (max 40px)
      const scrollDrift = Math.min(40, scrollY * 0.05);

      // Smooth mouse easing towards target
      if (!isTouchDevice && interactive) {
        mouse.x += (mouse.targetX - mouse.x) * 0.1;
        mouse.y += (mouse.targetY - mouse.y) * 0.1;
      }

      const totalLines = lines;
      const lineSpacing = height / (totalLines + 1);

      // Accent lines (2-3 lines styled in subtle gray #8892A0)
      const grayAccentIndices = new Set([
        Math.floor(totalLines * 0.22),
        Math.floor(totalLines * 0.55),
        Math.floor(totalLines * 0.82)
      ]);

      // Draw lines
      for (let i = 0; i < totalLines; i++) {
        const baseY = (i + 1) * lineSpacing;
        const isIndexContour = i % 5 === 0;
        const isGrayAccent = grayAccentIndices.has(i);

        // Base styling parameters
        let baseAlpha = 0.13;
        let lineWidth = 1.0;
        let strokeR = cobaltR;
        let strokeG = cobaltG;
        let strokeB = cobaltB;

        if (isGrayAccent) {
          baseAlpha = 0.25;
          strokeR = grayR;
          strokeG = grayG;
          strokeB = grayB;
        } else if (isIndexContour) {
          baseAlpha = 0.28;
          lineWidth = 1.25;
        }

        // Generate points for the curve
        const points: { x: number; y: number }[] = [];
        let avgAlphaMult = 0;

        for (let j = 0; j < pointsPerLine; j++) {
          const x = (j / (pointsPerLine - 1)) * width;

          // Spatial noise coordinates:
          // Strongest folds at right side and bottom of hero
          const xRatio = x / width;
          const yRatio = baseY / height;
          const foldWeight = (0.55 + 0.55 * Math.pow(xRatio, 1.1)) * (0.8 + 0.25 * yRatio);

          const nx = xRatio * 2.2;
          const ny = (i / totalLines) * 3.2 + noiseTime + (scrollDrift * 0.003);

          // Combined multi-octave 2D Perlin noise
          const n = noise2D(nx, ny) * 0.72 + noise2D(nx * 2.1, ny * 2.1) * 0.28;

          // Calm zone attenuation
          const { amp: calmAmp, alpha: calmAlpha } = getCalmMultiplier(x, baseY);
          avgAlphaMult += calmAlpha;

          let yDisp = n * amplitude * foldWeight * calmAmp;

          // Mouse ripple effect (lines gently bend away within 180px radius)
          if (!isTouchDevice && interactive && mouse.active) {
            const mdx = x - mouse.x;
            const mdy = baseY - mouse.y;
            const mDist = Math.hypot(mdx, mdy);
            const rippleRadius = 180;

            if (mDist < rippleRadius && mDist > 0) {
              const push = Math.pow(1 - mDist / rippleRadius, 2) * 16;
              const angle = Math.atan2(mdy, mdx);
              yDisp += Math.sin(angle) * push;
            }
          }

          points.push({
            x,
            y: baseY + yDisp,
          });
        }

        avgAlphaMult /= pointsPerLine;
        const finalAlpha = baseAlpha * sectionFactor * avgAlphaMult;

        // Draw smooth polyline with quadratic bezier curve smoothing
        if (points.length > 2 && finalAlpha > 0.005) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);

          for (let k = 1; k < points.length - 1; k++) {
            const xc = (points[k].x + points[k + 1].x) * 0.5;
            const yc = (points[k].y + points[k + 1].y) * 0.5;
            ctx.quadraticCurveTo(points[k].x, points[k].y, xc, yc);
          }

          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${finalAlpha.toFixed(3)})`;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      }
    };

    // If reduced motion is preferred, render single static frame
    if (prefersReducedMotion) {
      renderFrame(1.0);
      return;
    }

    // Animation frame loop with automatic 30fps throttle
    const loop = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      const dtFactor = Math.min(2.5, dt / 16.667);

      noiseTime += speed * dtFactor;

      const frameStart = performance.now();
      renderFrame(dtFactor);
      const frameDuration = performance.now() - frameStart;

      // Drop to 30fps if frame takes > 24ms
      if (frameDuration > 24) {
        slowFrames++;
        if (slowFrames > 6) {
          targetInterval = 1000 / 30;
        }
      } else if (slowFrames > 0 && frameDuration < 16) {
        slowFrames = Math.max(0, slowFrames - 1);
        if (slowFrames === 0) {
          targetInterval = 1000 / 60;
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    // Mouse listeners for desktop ripple
    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    if (!isTouchDevice && interactive) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseleave', handleMouseLeave);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Debounced resize
    let resizeTimer: number | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resizeCanvas();
        if (prefersReducedMotion) {
          renderFrame(1.0);
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    // Visibility change handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      } else {
        lastTime = performance.now();
        if (!rafId && !prefersReducedMotion) {
          rafId = requestAnimationFrame(loop);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (!isTouchDevice && interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    propLineCount,
    amplitude,
    speed,
    interactive,
    calmZoneRef,
    calmZonePadding,
    colors,
    testRedBackground,
  ]);

  if (typeof document === 'undefined') return null;

  // Use createPortal to mount canvas directly into <body> at z-index: -1
  // This physically bypasses any parent stacking contexts (like motion.div transforms)
  return createPortal(
    <canvas
      id="bg"
      ref={canvasRef}
      aria-hidden="true"
      role="presentation"
      className={`fixed inset-0 w-screen h-screen pointer-events-none block ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        display: 'block',
      }}
    />,
    document.body
  );
};

export default ContourBackground;
