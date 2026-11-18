import React, { useEffect, useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Seo } from '../../../components/seo/Seo';
import { FaqSection } from '../../../components/faq/FaqSection';
import { useWeb3 } from '../../../context/Web3Context';
import { isAdminAddress } from '../../../utils/adminGuard';
import { auditxApi } from '../api/client';
import { AuditXCapabilities } from '../api/types';
import { AuditXHero } from '../components/AuditXHero';
import { WhatAuditXIs } from '../components/WhatAuditXIs';
import { HowItWorksSteps } from '../components/HowItWorksSteps';
import { VulnerabilityCategories } from '../components/VulnerabilityCategories';
import { WhyItMatters } from '../components/WhyItMatters';
import { HowItHelps } from '../components/HowItHelps';
import { SampleReportCard } from '../components/SampleReportCard';
import { PrivacyDataHandling } from '../components/PrivacyDataHandling';
import { AuditXLimitations } from '../components/AuditXLimitations';
import { AuditXSupportedSpecs } from '../components/AuditXSupportedSpecs';

export const AuditXLandingPage: React.FC = () => {
  const { address, currentRole } = useWeb3();
  const [capabilities, setCapabilities] = useState<AuditXCapabilities | null>(null);

  const isAdmin = (address ? isAdminAddress(address) : false) || currentRole === 'admin';

  useEffect(() => {
    let mounted = true;
    auditxApi.getCapabilities().then((caps) => {
      if (mounted) setCapabilities(caps);
    }).catch((err) => {
      console.warn('[AuditX] Error fetching capabilities:', err);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleScrollToSample = () => {
    const el = document.getElementById('sample-report');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <PageContainer className="space-y-6 py-4 w-full text-[#0B0B0F]">
      <Seo routeKey="/auditx" />

      {/* Hero Section */}
      <AuditXHero onScrollToSample={handleScrollToSample} isAdmin={isAdmin} />

      {/* What it is and who it is for */}
      <WhatAuditXIs />

      {/* 4-Step Workflow */}
      <HowItWorksSteps />

      {/* What it checks */}
      <VulnerabilityCategories categories={capabilities?.categories || []} />

      {/* Why it matters */}
      <WhyItMatters />

      {/* How it helps */}
      <HowItHelps />

      {/* Sample report preview */}
      <SampleReportCard />

      {/* Privacy and data handling */}
      <PrivacyDataHandling capabilities={capabilities || undefined} />

      {/* Scope and limitations */}
      <AuditXLimitations />

      {/* Supported languages, quotas, and final CTA */}
      <AuditXSupportedSpecs capabilities={capabilities || undefined} />

      {/* FAQ Section */}
      <FaqSection
        pageId="/auditx"
        title="AuditX Frequently Asked Questions"
        className="py-12 border-t border-slate-200/80"
      />
    </PageContainer>
  );
};

export default AuditXLandingPage;
