import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { LandingHero, AudienceRole } from '../components/landing/LandingHero';
import { ActivityTicker } from '../components/landing/ActivityTicker';
import { LiveProofStrip } from '../components/landing/LiveProofStrip';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { OpenJobsPreview } from '../components/landing/OpenJobsPreview';
import { SafeByDesignSection } from '../components/landing/SafeByDesignSection';
import { NewToCryptoSection } from '../components/landing/NewToCryptoSection';
import { LandingFaqSection } from '../components/landing/LandingFaqSection';
import { CtaSection } from '../components/cta';
import { LandingFooter } from '../components/layout/LandingFooter';
import { usePublicStats } from '../hooks/usePublicStats';
import { Reveal } from '../components/common/MotionPrimitives';
import { Job, UserProfile } from '../types';

interface LandingVisitorProps {
  jobs?: Job[];
  profiles?: Record<string, UserProfile>;
  onOpenVideo?: (videoId: string) => void;
}

export const LandingVisitor: React.FC<LandingVisitorProps> = ({
  jobs = [],
  profiles = {},
  onOpenVideo,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Audience role: URL query param -> sessionStorage -> default 'freelancer'
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

  // Sync state if URL param changes externally
  useEffect(() => {
    const urlRole = searchParams.get('for');
    if ((urlRole === 'client' || urlRole === 'freelancer') && urlRole !== audience) {
      setAudience(urlRole);
    }
  }, [searchParams, audience]);

  // Real-time backend stats & recent on-chain activity
  const { stats } = usePublicStats();

  return (
    <div className="w-full text-[#0B0B0F] font-sans">
      
      {/* 1. HERO (White Band) */}
      <LandingHero
        audience={audience}
        onAudienceChange={handleAudienceChange}
        onOpenVideo={onOpenVideo}
        latestActivity={stats?.recentActivity?.[0] || null}
      />

      {/* 2. REAL ON-CHAIN ACTIVITY TICKER & LIVE TRUST STRIP (Light Gray Band #F6F7F9) */}
      <ActivityTicker events={stats?.recentActivity} />
      <LiveProofStrip stats={stats} jobs={jobs} profiles={profiles} />

      {/* 3. FEATURE BENTO (White Band) */}
      <section className="w-full bg-white border-b border-[#E5E7EB] py-16 sm:py-20 lg:py-24">
        <PageContainer noVerticalPadding>
          <div className="space-y-12">
            <Reveal>
              <div className="max-w-2xl space-y-3 text-left">
                <div className="text-eyebrow text-[#0047AB]">Why PolyLance</div>
                <h2 className="text-landing-h2 text-[#0B0B0F]">
                  Built for clarity, speed and security.
                </h2>
                <p className="text-lead text-[#4B5563]">
                  Protected payments, transparent fees, and permanent proof of your work on Polygon.
                </p>
              </div>
            </Reveal>

            <FeaturesSection jobs={jobs} profiles={profiles} />
          </div>
        </PageContainer>
      </section>

      {/* 4. REAL OPEN JOBS IN MARKETPLACE (Light Gray Band #F6F7F9) */}
      <OpenJobsPreview jobs={jobs} />

      {/* 5. GET STARTED / NEW TO CRYPTO (White Band) */}
      <NewToCryptoSection />

      {/* 6. SAFE BY DESIGN / SECURITY BAND (Near-Black Band #0B0B0F) */}
      <SafeByDesignSection />

      {/* 7. SHORT FAQ (White Band) */}
      <LandingFaqSection />

      {/* 8. FINAL CALL TO ACTION (Cobalt Gradient Band) */}
      <CtaSection />

      {/* 9. DEDICATED LANDING FOOTER (Near-Black Band) */}
      <LandingFooter />

    </div>
  );
};

export default LandingVisitor;
