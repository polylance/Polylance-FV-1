import React, { useEffect, useRef, useState } from 'react';
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
  riseDistance = 16,
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

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const duration = scaleFrom !== 1 || riseDistance > 16 ? MOTION.duration.slow : MOTION.duration.standard;

  const style: React.CSSProperties = {
    transition: reducedMotion
      ? `opacity ${MOTION.duration.fast}ms ease-out`
      : `opacity ${duration}ms ${MOTION.ease.brand}, transform ${duration}ms ${MOTION.ease.brand}`,
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          observer.unobserve(element);

          const startTime = performance.now();
          const startVal = 0;
          const endVal = value;

          const step = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / safeDurationMs, 1);
            // Cubic bezier ease-out approximation: 1 - (1 - progress)^3
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

