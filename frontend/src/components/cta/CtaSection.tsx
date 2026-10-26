import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PlusCircle } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Reveal } from '../common/MotionPrimitives';

export const CtaSection: React.FC = () => {
  return (
    <section
      className="w-full relative overflow-hidden py-[72px] border-b border-[#003882]"
      style={{
        background: 'linear-gradient(180deg, #0047AB 0%, #003A91 100%)',
      }}
      aria-label="Call to action"
    >
      {/* ── Faint radial highlight behind the heading ── */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[380px] rounded-full pointer-events-none -z-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.09) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <PageContainer noVerticalPadding>
        <div className="max-w-2xl mx-auto text-center space-y-6 relative z-10">
          {/* ── Headline: Pure white #FFFFFF, tracking -0.02em, 9.15:1 contrast ── */}
          <Reveal delay={0} riseDistance={16}>
            <h2
              className="text-display font-extrabold text-white"
              style={{
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
              }}
            >
              Start working with escrow protection today.
            </h2>
          </Reveal>

          {/* ── Paragraph: White at 88% opacity, 18px, line-height 1.6, max 640px, 7.35:1 contrast ── */}
          <Reveal delay={80} riseDistance={16}>
            <p
              className="text-[18px] leading-[1.6] max-w-[640px] mx-auto text-center font-normal"
              style={{
                color: 'rgba(255, 255, 255, 0.88)',
              }}
            >
              Join verified clients and freelancers transacting safely on Polygon. No upfront setup fees, no lock-in, and instant milestone payouts.
            </p>
          </Reveal>

          {/* ── Two Buttons: Find work (white) & Post a job (outline) ── */}
          <Reveal delay={160} riseDistance={16}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
              {/* Find work: White with cobalt text and soft shadow */}
              <Link
                to="/jobs"
                className="w-full sm:w-auto h-[52px] px-6 text-[16px] font-semibold rounded-[12px] bg-white text-[#0047AB] hover:bg-[#F9FAFB] active:bg-[#E5E7EB] shadow-[0_4px_14px_rgba(0,0,0,0.15)] inline-flex items-center justify-center gap-2.5 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0047AB]"
              >
                <span>Find work</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>

              {/* Post a job: 1.5px white border at 70% opacity, white text, hover fills white at 12% */}
              <Link
                to="/jobs/post"
                className="w-full sm:w-auto h-[52px] px-6 text-[16px] font-semibold rounded-[12px] border-[1.5px] border-white/70 text-white hover:bg-white/12 hover:border-white active:bg-white/20 inline-flex items-center justify-center gap-2 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0047AB]"
              >
                <PlusCircle size={16} strokeWidth={2} />
                <span>Post a job</span>
              </Link>
            </div>
          </Reveal>

          {/* ── Footnote: White at 80% opacity, 13px, 6.1:1 contrast ── */}
          <Reveal delay={240} riseDistance={16}>
            <div
              className="pt-4 text-[13px] text-center"
              style={{
                color: 'rgba(255, 255, 255, 0.80)',
              }}
            >
              Transparent 2.5% fee per side (5% total protocol fee) • Instant settlement on Polygon Mainnet
            </div>
          </Reveal>
        </div>
      </PageContainer>
    </section>
  );
};
