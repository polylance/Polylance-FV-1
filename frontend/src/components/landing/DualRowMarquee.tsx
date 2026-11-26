import React, { useMemo } from 'react';
import { getCategories } from '../../utils/taxonomy';
import { ScrollReveal } from '../common/MotionPrimitives';
import { useReducedMotion } from '../../media/useDataSaver';

/**
 * Infinite dual-row horizontal marquee displaying real taxonomy disciplines and verified skill tags.
 * - Opposite scroll directions across Row A and Row B.
 * - Soft gradient edge fade masks + pauses gently on hover.
 * - Falls back to a clean static wrapped strip when prefers-reduced-motion is active.
 */
export const DualRowMarquee: React.FC = () => {
  const reducedMotion = useReducedMotion();

  const { rowA, rowB } = useMemo(() => {
    const categories = getCategories();
    const catLabels = categories.map((c) => c.name);
    const skillTags = Array.from(
      new Set(categories.flatMap((c) => c.subcategories.slice(0, 2).flatMap((s) => s.skills.slice(0, 2))))
    ).slice(0, 14);

    return {
      rowA: catLabels,
      rowB: skillTags,
    };
  }, []);

  if (reducedMotion) {
    return (
      <section aria-label="Supported disciplines and skills" className="w-full bg-white border-b border-[#E2E5EA] py-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 space-y-3">
          <div className="flex flex-wrap gap-2">
            {rowA.map((label) => (
              <span
                key={label}
                className="px-3.5 py-1.5 rounded-full bg-[#F5F6F8] border border-[#E2E5EA] text-[13px] font-semibold text-[#0B0B0C]"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {rowB.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 rounded-full bg-white border border-[#E2E5EA] text-[12.5px] font-medium text-[#4B5563]"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Supported disciplines and skills"
      className="w-full bg-white border-b border-[#E2E5EA] py-8 sm:py-10 overflow-hidden"
    >
      <ScrollReveal>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 mb-5 flex items-center justify-between gap-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#0A52B8]">
            Verified Capabilities Across PolyLance
          </p>
          <span className="hidden sm:inline text-[12px] text-[#6B7280]">
            Hover to pause
          </span>
        </div>

        <div className="pl-marquee-pause pl-marquee-mask space-y-3 overflow-hidden">
          {/* Row A: Leftward Infinite Track */}
          <div className="pl-marquee-track-left gap-3">
            {[...rowA, ...rowA].map((label, idx) => (
              <span
                key={`cat-${idx}-${label}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5F6F8] border border-[#E2E5EA] text-[13.5px] font-semibold text-[#0B0B0C] whitespace-nowrap shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A52B8]" />
                {label}
              </span>
            ))}
          </div>

          {/* Row B: Rightward Infinite Track */}
          <div className="pl-marquee-track-right gap-2.5">
            {[...rowB, ...rowB].map((skill, idx) => (
              <span
                key={`skill-${idx}-${skill}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E2E5EA] text-[13px] font-medium text-[#4B5563] whitespace-nowrap shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                {skill}
              </span>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default DualRowMarquee;
