import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useReducedMotion } from '../../media/useDataSaver';
import { MOTION } from '../../styles/motion';

export interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  riseDistance?: number;
  scaleFrom?: number;
  className?: string;
  as?: React.ElementType;
}

/**
 * <Reveal>
 * Fades and translates children up (16-24px) over 350-600ms when first entering viewport.
 * Uses IntersectionObserver (threshold 0.15, once only).
 * CSS class-based so a failed script never hides content.
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  riseDistance = 12,
  scaleFrom = 1,
  className = '',
  as: Component = 'div',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (
      reducedMotion ||
      typeof window === 'undefined' ||
      !('IntersectionObserver' in window)
    ) {
      setIsVisible(true);
      return;
    }

    const rect = element.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 1.15) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || entry.boundingClientRect.top <= window.innerHeight) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.02, rootMargin: '60px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const duration = scaleFrom !== 1 || riseDistance > 12 ? MOTION.duration.sequence : MOTION.duration.reveal;

  const style: React.CSSProperties = {
    transitionProperty: reducedMotion ? 'opacity' : 'opacity, transform',
    transitionDuration: `${reducedMotion ? MOTION.duration.fast : duration}ms`,
    transitionTimingFunction: reducedMotion ? 'ease-out' : MOTION.ease.brand,
    transitionDelay: delay ? `${delay}ms` : '0ms',
    opacity: isVisible ? 1 : 0,
    transform: reducedMotion
      ? 'none'
      : isVisible
      ? 'translateY(0) scale(1)'
      : `translateY(${riseDistance}px) scale(${scaleFrom})`,
    willChange: isVisible ? 'auto' : 'opacity, transform',
  };

  return (
    <Component ref={ref} style={style} className={className}>
      {children}
    </Component>
  );
};

export interface CountUpProps {
  value: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

/**
 * <CountUp>
 * Smoothly animates a number from 0 to target value once when visible.
 * Preserves the final value in aria-label from the start for accessibility.
 * Capped at max 800ms per motion rules.
 */
export const CountUp: React.FC<CountUpProps> = ({
  value,
  durationMs = 600,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  // Cap at 800ms max per motion guideline
  const safeDurationMs = Math.min(durationMs, MOTION.duration.max);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(value);
      setHasAnimated(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const startAnimation = () => {
      if (hasAnimated) return;
      setHasAnimated(true);
      const startTime = performance.now();
      const startVal = 0;
      const endVal = value;

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / safeDurationMs, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = startVal + (endVal - startVal) * easeProgress;
        setDisplayValue(current);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setDisplayValue(endVal);
        }
      };

      requestAnimationFrame(step);
    };

    if (element.getBoundingClientRect().top <= window.innerHeight * 1.05) {
      startAnimation();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || entry.boundingClientRect.top <= window.innerHeight) {
          startAnimation();
          observer.unobserve(element);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [value, safeDurationMs, hasAnimated, reducedMotion]);

  const formatted = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString();

  const finalFormatted = decimals > 0
    ? value.toFixed(decimals)
    : Math.round(value).toLocaleString();

  return (
    <span
      ref={ref}
      aria-label={`${prefix}${finalFormatted}${suffix}`}
      className={className}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

export interface ProgressFillProps {
  percent: number;
  className?: string;
  colorClass?: string;
}

/**
 * <ProgressFill>
 * Horizontal progress bar that animates from 0% to value once when visible.
 */
export const ProgressFill: React.FC<ProgressFillProps> = ({
  percent,
  className = 'h-2 bg-[#E5E7EB] rounded-full overflow-hidden',
  colorClass = 'bg-[#0047AB]',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const clamped = Math.min(Math.max(percent, 0), 100);
    if (reducedMotion) {
      setWidth(clamped);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setWidth(clamped);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [percent, reducedMotion]);

  return (
    <div ref={ref} className={className}>
      <div
        className={`h-full transition-all duration-700 ease-out rounded-full ${colorClass}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

/**
 * <DrawCheck>
 * SVG stroke-dashoffset animation for checkmarks.
 */
export const DrawCheck: React.FC<{ size?: number; className?: string }> = ({
  size = 20,
  className = 'text-[#0047AB]',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
};

export interface StaggerProps {
  children: React.ReactNode;
  staggerDelayMs?: number;
  className?: string;
}

/**
 * <Stagger>
 * Wraps list items with 50ms progressive offsets, capping at max 8 items.
 */
export const Stagger: React.FC<StaggerProps> = ({
  children,
  staggerDelayMs = 50,
  className = '',
}) => {
  const reducedMotion = useReducedMotion();
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={className}>
      {childrenArray.map((child, index) => {
        const delay = reducedMotion ? 0 : Math.min(index, 8) * staggerDelayMs;
        return (
          <Reveal key={index} delay={delay}>
            {child}
          </Reveal>
        );
      })}
    </div>
  );
};

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

/**
 * <Skeleton>
 * Static neutral gray layout placeholder with subtle 1.6s opacity pulse.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = 'w-full h-4 rounded-[6px]',
  width,
  height,
}) => {
  const style: React.CSSProperties = {
    width,
    height,
  };

  return (
    <div
      style={style}
      aria-hidden="true"
      className={`bg-[#E5E7EB] animate-pulse ${className}`}
    />
  );
};

export interface ScrollParallaxBandProps {
  children: React.ReactNode;
  className?: string;
  offsetPx?: number;
}

/**
 * <ScrollParallaxBand>
 * Lightweight GPU-composited scroll-reactive motion wrapper.
 * Gently translates & settles content as the section moves into view; static under reduced motion.
 */
export const ScrollParallaxBand: React.FC<ScrollParallaxBandProps> = ({
  children,
  className = '',
  offsetPx = 18,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion || typeof window === 'undefined') return;

    let rafId = 0;
    const update = () => {
      rafId = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      // Normalized progress [-1..1] around viewport center
      const centerProgress = (rect.top + rect.height * 0.35 - vh * 0.6) / vh;
      const clamped = Math.max(-1, Math.min(1, centerProgress));
      const y = Number((clamped * offsetPx).toFixed(2));
      el.style.transform = `translate3d(0, ${y}px, 0)`;
    };

    const onScroll = () => {
      if (!rafId) rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
      el.style.transform = 'none';
    };
  }, [offsetPx, reducedMotion]);

  return (
    <div ref={ref} className={className} style={{ willChange: reducedMotion ? 'auto' : 'transform' }}>
      {children}
    </div>
  );
};

export interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
}

const PREMIUM_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * <MaskedHeadingReveal>
 * Overflow-masked headline entrance sliding cleanly out of view boundary (y: 28 -> 0).
 */
export const MaskedHeadingReveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
  children,
  className = '',
  delay = 0,
}) => {
  const hasIO = typeof window !== 'undefined' && 'IntersectionObserver' in window;

  if (!hasIO) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.55, delay, ease: PREMIUM_EASE }}
      >
        {children}
      </motion.div>
    </div>
  );
};

/**
 * <ScrollReveal>
 * Glide-up entrance triggered once at 12% viewport visibility with [0.22, 1, 0.36, 1] easing.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  className = '',
}) => {
  const hasIO = typeof window !== 'undefined' && 'IntersectionObserver' in window;

  if (!hasIO) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.54, delay, ease: PREMIUM_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export interface ScrollRevealGroupProps {
  children: React.ReactNode;
  staggerSec?: number;
  className?: string;
}

/**
 * <ScrollRevealGroup>
 * Coordinates staggered child entrances (0.09s stagger by default) with scale 0.98 -> 1.
 */
export const ScrollRevealGroup: React.FC<ScrollRevealGroupProps> = ({
  children,
  staggerSec = 0.09,
  className = '',
}) => {
  const hasIO = typeof window !== 'undefined' && 'IntersectionObserver' in window;
  const items = React.Children.toArray(children);

  if (!hasIO) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {items.map((child, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{
            duration: 0.52,
            delay: Math.min(idx, 6) * staggerSec,
            ease: PREMIUM_EASE,
          }}
          className="h-full"
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

export interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

/**
 * <SpotlightCard>
 * Bento card with cursor-tracking radial spotlight glow, fine-pointer spring hover lift (y: -4),
 * and full reduced-motion safety.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(10, 82, 184, 0.08)',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setCoords((prev) => ({ ...prev, active: false }))}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      className={`group relative rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-sm hover:border-[#0A52B8]/35 hover:shadow-[0_14px_34px_rgba(10,82,184,0.08)] transition-[border-color,box-shadow] duration-200 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: coords.active ? 1 : 0,
          background: `radial-gradient(360px circle at ${coords.x}px ${coords.y}px, ${spotlightColor}, transparent 65%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
};

export interface ScrollScaleShowcaseProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * <ScrollScaleShowcase>
 * Smooth scroll-linked scale (0.94 -> 1) and brightness/opacity reveal tied to viewport entry.
 */
export const ScrollScaleShowcase: React.FC<ScrollScaleShowcaseProps> = ({
  children,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.92', 'center 0.55'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 26,
    mass: 0.6,
  });

  const scale = useTransform(smoothProgress, [0, 1], [0.94, 1]);
  const opacity = useTransform(smoothProgress, [0, 1], [0.84, 1]);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      style={{ scale, opacity, willChange: 'transform, opacity' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export interface ParallaxAmbientLayerProps {
  className?: string;
  variant?: 'cool' | 'warm';
}

/**
 * <ParallaxAmbientLayer>
 * Soft floating geometric outlines and radial gradient orbs driven by scroll position (useTransform).
 */
export const ParallaxAmbientLayer: React.FC<ParallaxAmbientLayerProps> = ({
  className = '',
}) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#CBD5E1]/70 to-transparent ${className}`}
    />
  );
};


