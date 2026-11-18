import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  PlusCircle,
  ArrowRight,
  Play,
  Clock,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Button } from '../common/Button';
import { HeroVideoFrame } from '../hero/HeroVideoFrame';
import { getVideo } from '../../media';
import { REVIEW_WINDOW_DAYS, PLATFORM_FEE_PERCENT } from '../../seo/site.config';
import { trackLandingEvent } from '../../utils/analytics';
import { PublicActivityEvent } from '../../hooks/usePublicStats';

export type AudienceRole = 'freelancer' | 'client';

interface LandingHeroProps {
  audience: AudienceRole;
  onAudienceChange: (role: AudienceRole) => void;
  onOpenVideo?: (videoId: string) => void;
  latestActivity?: PublicActivityEvent | null;
}

import { isTestActivityEvent } from '../../config/testDataFilter';

export const LandingHero: React.FC<LandingHeroProps> = ({
  audience,
  onAudienceChange,
  onOpenVideo,
  latestActivity,
}) => {
  // Check if overview video is ready
  const overviewVideo = getVideo('intro-30s');
  const isVideoReady = overviewVideo?.status === 'ready' && !!overviewVideo.sources?.mp4;

  const handleAudienceClick = (role: AudienceRole) => {
    onAudienceChange(role);
    trackLandingEvent('landing_audience_toggle', { role });
  };

  const handleVideoClick = () => {
    if (onOpenVideo && isVideoReady) {
      onOpenVideo('intro-30s');
      trackLandingEvent('landing_video_open', { videoId: 'intro-30s' });
    }
  };

  const hasRealActivity = latestActivity && !isTestActivityEvent(latestActivity);

  return (
    <section className="w-full bg-white border-b border-[#E5E7EB] pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
      <PageContainer size="wide" noVerticalPadding>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Headlines, Audience Toggle, CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Top Row: Eyebrow + Audience Pill Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-eyebrow text-[#0047AB]">
                Escrow-protected freelancing on Polygon
              </div>

              {/* Audience Pill Toggle */}
              <div
                role="radiogroup"
                aria-label="Target audience perspective"
                className="inline-flex items-center p-1 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] text-xs font-semibold shadow-2xs"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={audience === 'freelancer'}
                  onClick={() => handleAudienceClick('freelancer')}
                  className={`px-3.5 py-1 rounded-full transition-all duration-150 cursor-pointer ${
                    audience === 'freelancer'
                      ? 'bg-white text-[#0047AB] shadow-sm font-bold'
                      : 'text-[#4B5563] hover:text-[#0B0B0F]'
                  }`}
                >
                  I want to work
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={audience === 'client'}
                  onClick={() => handleAudienceClick('client')}
                  className={`px-3.5 py-1 rounded-full transition-all duration-150 cursor-pointer ${
                    audience === 'client'
                      ? 'bg-white text-[#0047AB] shadow-sm font-bold'
                      : 'text-[#4B5563] hover:text-[#0B0B0F]'
                  }`}
                >
                  I want to hire
                </button>
              </div>
            </div>

            {/* Display Headline (Exact User Mandate) */}
            <h1 className="text-display text-[#0B0B0F]">
              Get paid safely for every milestone.
            </h1>

            {/* 3-Step Value Strip */}
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-[#0047AB] bg-[#EAF1FB] border border-[#D0DEF2] rounded-[8px] py-2 px-3 sm:px-4 w-fit">
              <span>Fund escrow</span>
              <span className="text-[#9CA3AF]">→</span>
              <span>Deliver milestone</span>
              <span className="text-[#9CA3AF]">→</span>
              <span>Get paid</span>
            </div>

            {/* Dynamic Lead Paragraph */}
            <p className="text-lead text-[#4B5563]">
              {audience === 'freelancer' ? (
                <>
                  Never chase an invoice again. PolyLance secures client funds in smart contract escrow on Polygon before you write a single line of code. Deliver milestones, get approved, and receive payment instantly with a permanent on-chain work certificate.
                </>
              ) : (
                <>
                  Hire verified technical talent with zero payment risk. Funds are committed into Polygon escrow and released only when deliverables match your specifications. Transparent {PLATFORM_FEE_PERCENT}% fee per side ({PLATFORM_FEE_PERCENT * 2}% total protocol fee) with built-in {REVIEW_WINDOW_DAYS}-day milestone review protection.
                </>
              )}
            </p>

            {/* Action Buttons & Video Modal Trigger */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Button
                as="Link"
                to={audience === 'freelancer' ? '/jobs' : '/jobs/post'}
                variant="primary"
                size="lg"
                leadingIcon={
                  audience === 'freelancer' ? (
                    <Search size={18} strokeWidth={2.5} />
                  ) : (
                    <PlusCircle size={18} strokeWidth={2.5} />
                  )
                }
                trailingIcon={<ArrowRight size={18} strokeWidth={2.5} />}
                className="w-full sm:w-auto"
                onClick={() =>
                  trackLandingEvent('landing_cta_click', {
                    target: audience === 'freelancer' ? '/jobs' : '/jobs/post',
                    audience,
                  })
                }
              >
                {audience === 'freelancer' ? 'Find work' : 'Post a job'}
              </Button>

              <Button
                as="Link"
                to={audience === 'freelancer' ? '/jobs/post' : '/jobs'}
                variant="secondary"
                size="lg"
                leadingIcon={
                  audience === 'freelancer' ? (
                    <PlusCircle size={18} strokeWidth={2} className="text-[#0047AB]" />
                  ) : (
                    <Search size={18} strokeWidth={2} className="text-[#0047AB]" />
                  )
                }
                className="w-full sm:w-auto"
                onClick={() =>
                  trackLandingEvent('landing_cta_click', {
                    target: audience === 'freelancer' ? '/jobs/post' : '/jobs',
                    audience,
                  })
                }
              >
                {audience === 'freelancer' ? 'Post a job' : 'Find talent'}
              </Button>

              {/* Accessible 30-Second Explainer Video Trigger */}
              {isVideoReady && (
                <button
                  type="button"
                  onClick={handleVideoClick}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-[#0047AB] hover:text-[#0047AB] text-xs font-semibold text-[#374151] transition-all shadow-2xs hover:shadow-xs cursor-pointer select-none"
                  aria-label="Watch 30-second platform overview video"
                >
                  <span className="w-5 h-5 rounded-full bg-[#EAF1FB] text-[#0047AB] flex items-center justify-center">
                    <Play size={10} fill="currentColor" />
                  </span>
                  <span>Watch 30s overview</span>
                </button>
              )}
            </div>

            {/* Secondary Deep-Dive Text Links */}
            <div className="pt-1 flex items-center gap-4 text-xs font-semibold text-[#0047AB]">
              <Link to="/how-it-works" className="inline-flex items-center gap-1 hover:underline">
                <span>How it works</span>
                <ArrowRight size={13} />
              </Link>
              <span className="text-gray-300">·</span>
              <Link to="/escrow-simulator" className="inline-flex items-center gap-1.5 hover:underline">
                <Calculator size={13} />
                <span>Try the simulator</span>
              </Link>
            </div>

            {/* Microcopy Trust Row */}
            <div className="pt-2 text-xs text-[#4B5563] flex items-center flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-1.5 font-medium text-[#0B0B0F]">
                <ShieldCheck size={14} className="text-[#0047AB]" />
                Escrow-protected
              </span>
              <span>•</span>
              <span>{PLATFORM_FEE_PERCENT}% fee per side ({PLATFORM_FEE_PERCENT * 2}% total)</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={13} className="text-[#6B7280]" />
                {REVIEW_WINDOW_DAYS}-day review window
              </span>
              <span>•</span>
              <span>Polygon Mainnet (Chain ID 137)</span>
            </div>

          </div>

          {/* Right Column: Hero Visual Frame + Floating Real Activity Chip */}
          <div className="lg:col-span-5 relative">
            <HeroVideoFrame />

            {/* Live Activity Chip Floater (Honest real data only) */}
            {hasRealActivity && latestActivity && (
              <div
                className="absolute -bottom-4 right-2 sm:right-6 bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-[10px] p-2.5 sm:p-3 shadow-lg flex items-center gap-2.5 text-xs text-[#0B0B0F] max-w-[280px] sm:max-w-[320px] pointer-events-none z-20"
                aria-live="polite"
              >
                <div className="w-7 h-7 rounded-full bg-[#EAF1FB] text-[#0047AB] flex items-center justify-center shrink-0">
                  <Sparkles size={14} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{latestActivity.title}</div>
                  <div className="text-[11px] text-[#6B7280]">
                    Verified on Polygon Mainnet
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </PageContainer>
    </section>
  );
};
