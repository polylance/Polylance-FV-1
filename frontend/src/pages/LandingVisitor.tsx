import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LandingHero, AudienceRole } from '../components/landing/LandingHero';
import { LiveProofStrip } from '../components/landing/LiveProofStrip';
import { LandingCategoriesSection } from '../components/landing/LandingCategoriesSection';
import { BuiltOnPolyLanceSection } from '../components/landing/BuiltOnPolyLanceSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { NewToCryptoSection } from '../components/landing/NewToCryptoSection';
import { OpenJobsPreview } from '../components/landing/OpenJobsPreview';
import { LandingFaqSection } from '../components/landing/LandingFaqSection';
import { CtaSection } from '../components/cta';
import { LandingFooter } from '../components/layout/LandingFooter';
import { usePublicStats } from '../hooks/usePublicStats';
import { Job, UserProfile } from '../types';

interface LandingVisitorProps {
  jobs?: Job[];
  profiles?: Record<string, UserProfile>;
  isLoading?: boolean;
  onOpenVideo?: (videoId: string) => void;
}

export const LandingVisitor: React.FC<LandingVisitorProps> = ({
  jobs = [],
  profiles = {},
  isLoading = false,
  onOpenVideo,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [audience, setAudience] = useState<AudienceRole>(() => {
    const urlRole = searchParams.get('for');
    if (urlRole === 'client' || urlRole === 'freelancer') {
      return urlRole;
    }
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('polylance_audience_mode');
      if (stored === 'client' || stored === 'freelancer') {
        return stored;
      }
    }
    return 'freelancer';
  });

  const handleAudienceChange = (newRole: AudienceRole) => {
    setAudience(newRole);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('polylance_audience_mode', newRole);
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('for', newRole);
        return next;
      },
      { replace: true }
    );
  };

  useEffect(() => {
    const urlRole = searchParams.get('for');
    if ((urlRole === 'client' || urlRole === 'freelancer') && urlRole !== audience) {
      setAudience(urlRole);
    }
  }, [searchParams, audience]);

  const { stats } = usePublicStats();

  return (
    <div className="w-full text-[#0F172A] font-sans bg-white">
      {/* 1. VISUAL-FIRST EDITORIAL HERO */}
      <LandingHero
        audience={audience}
        onAudienceChange={handleAudienceChange}
        onOpenVideo={onOpenVideo}
      />

      {/* 2. LIVE PROTOCOL TELEMETRY STRIP */}
      <LiveProofStrip stats={stats} jobs={jobs} profiles={profiles} />

      {/* 3. HORIZONTAL PILLS + 4-COLUMN STAGGERED MASONRY EXPLORER */}
      <LandingCategoriesSection jobs={jobs} profiles={profiles} isLoading={isLoading} />

      {/* 4. WHAT IS POLYLANCE — INTERACTIVE KINETIC EXPLAINER */}
      <BuiltOnPolyLanceSection />

      {/* 5. THREE GUARANTEES BUILT INTO EVERY CONTRACT */}
      <FeaturesSection jobs={jobs} profiles={profiles} />

      {/* 6. START IN THREE STEPS */}
      <NewToCryptoSection />

      {/* 7. LATEST OPEN JOBS (Rendered cleanly when real jobs >= 3) */}
      <OpenJobsPreview jobs={jobs} />

      {/* 8. FAQ (Balanced 4/8 Light-Mode Accordion) */}
      <LandingFaqSection />

      {/* 9. EDITORIAL LIGHT-MODE CTA FLANKED BY PARALLAX STUDIO ARTWORK */}
      <CtaSection />

      {/* 10. FOOTER */}
      <LandingFooter />
    </div>
  );
};

export default LandingVisitor;
