import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface CtaSectionProps {
  onOpenVideo?: (videoId: string) => void;
}

export const CtaSection: React.FC<CtaSectionProps> = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const yLeftTop = useTransform(scrollYProgress, [0, 1], [-18, 18]);
  const yLeftBottom = useTransform(scrollYProgress, [0, 1], [16, -16]);
  const yRightTop = useTransform(scrollYProgress, [0, 1], [20, -20]);
  const yRightBottom = useTransform(scrollYProgress, [0, 1], [-14, 14]);

  return (
    <section
      ref={sectionRef}
      aria-label="Get started"
      className="w-full bg-white py-16 sm:py-24 overflow-x-clip"
    >
      <div className="max-w-[1440px] w-full mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[28px] bg-[#F8FAFC] border border-slate-200/80 px-6 sm:px-10 lg:px-14 py-14 sm:py-20"
        >
          {/* Floating Flanking Studio Artwork Thumbnails (Desktop lg+) */}
          <motion.div
            style={{ y: yLeftTop }}
            aria-hidden="true"
            className="hidden lg:block absolute top-8 left-8 w-36 aspect-square rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-md -rotate-3 pointer-events-none"
          >
            <img
              src="/images/showcase/ai-agents.webp"
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </motion.div>

          <motion.div
            style={{ y: yLeftBottom }}
            aria-hidden="true"
            className="hidden lg:block absolute bottom-7 left-14 w-40 aspect-[16/11] rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-md rotate-2 pointer-events-none"
          >
            <img
              src="/images/showcase/ui-design.webp"
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </motion.div>

          <motion.div
            style={{ y: yRightTop }}
            aria-hidden="true"
            className="hidden lg:block absolute top-8 right-10 w-38 aspect-[16/11] rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-md rotate-3 pointer-events-none"
          >
            <img
              src="/images/showcase/motion-graphics.webp"
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </motion.div>

          <motion.div
            style={{ y: yRightBottom }}
            aria-hidden="true"
            className="hidden lg:block absolute bottom-7 right-8 w-36 aspect-square rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-md -rotate-2 pointer-events-none"
          >
            <img
              src="/images/showcase/mobile-wallet.webp"
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Centered Editorial CTA Stack */}
          <div className="max-w-xl mx-auto text-center relative z-10 space-y-6">
            <p className="text-xs font-mono font-semibold uppercase tracking-widest text-[#0A52B8]">
              Polygon Mainnet · Chain 137
            </p>

            <h2
              className="text-3xl sm:text-4xl md:text-[44px] font-bold tracking-tight text-[#0F172A] leading-[1.1]"
              style={{ textWrap: 'balance' }}
            >
              Ready to hire or build without borders?
            </h2>

            <p className="text-base sm:text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">
              Launch smart contract escrow in seconds—only a 5% flat fee with instant POL or USDC payouts.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                to="/onboarding"
                className="group relative overflow-hidden inline-flex items-center gap-2 bg-[#0A52B8] hover:bg-[#084298] text-white px-6 py-3.5 rounded-xl font-semibold text-sm shadow-sm transition-colors"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 -left-full w-2/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-[320%]"
                />
                <span className="relative z-10">Get Started</span>
                <ArrowRight
                  size={16}
                  className="relative z-10 transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>

              <Link
                to="/jobs"
                className="inline-flex items-center justify-center bg-white border border-slate-300 hover:border-[#0A52B8] hover:text-[#0A52B8] text-[#0F172A] px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors"
              >
                Browse Jobs
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
