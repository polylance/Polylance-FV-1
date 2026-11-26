import React, { useState, useEffect } from 'react';
import { ArrowRight, PlusCircle } from 'lucide-react';
import {
  Button,
  Link,
  Tabs,
  Tag,
  Card,
  Accordion,
  SectionHeader,
  Receipt,
  HighlightMark,
  StickyStage,
  CategoryRail,
  SkeletonCard,
  BottomSheet,
} from '../common';

const TYPE_SIZES = [14, 16, 18, 24] as const;
const TYPE_SAMPLES = ['Post a job', 'Find open jobs', 'Every job starts with client funds'];

export const FoundationsSpecimen: React.FC = () => {
  const [typeMode, setTypeMode] = useState<'a' | 'b'>(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('type') === 'b') {
      return 'b';
    }
    return 'a';
  });
  const [activeTab, setActiveTab] = useState('escrow');
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (typeMode === 'b') {
        document.documentElement.setAttribute('data-type', 'b');
      } else {
        document.documentElement.removeAttribute('data-type');
      }
    }
  }, [typeMode]);

  const stages = [
    {
      title: '1. Lock funds upfront',
      body: 'Client places milestone budget inside an escrow contract before any work begins.',
      stamp: 'LOCKED' as const,
      total: '512.50 USDC',
    },
    {
      title: '2. Client reviews deliverable',
      body: 'Freelancer submits completed work for a structured 7-day inspection window.',
      stamp: 'APPROVED' as const,
      total: '500.00 USDC',
    },
    {
      title: '3. Worker gets paid + verified receipt',
      body: 'Payment transfers directly to worker wallet with a permanent verifiable work record.',
      stamp: 'PAID' as const,
      total: '487.50 USDC',
    },
  ];

  const activeStage = stages[activeStepIdx];

  return (
    <div className="space-y-12 text-left">
      {/* Type A / B Switcher & Visual Spacing Verification */}
      <section className="space-y-6 border-b border-[#E2E5EA] pb-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-eyebrow">Step 3 Specimen</div>
            <h2 className="text-landing-h2 text-[#0B0B0C]">
              Typography <HighlightMark>Type {typeMode.toUpperCase()}</HighlightMark> Pairing
            </h2>
            <p className="text-lead">
              {typeMode === 'a'
                ? 'Default Type A: Bricolage Grotesque (700/800) + Public Sans (400/500/600) + JetBrains Mono'
                : 'Alt Type B (?type=b): Schibsted Grotesk (800/400/500/600) + IBM Plex Mono'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTypeMode('a')}
              className={`px-4 py-2 rounded-[8px] text-[14px] font-semibold cursor-pointer border-2 ${
                typeMode === 'a'
                  ? 'bg-[#FFC21A] text-[#0B0B0C] border-[#0B0B0C] shadow-[2px_2px_0_#0B0B0C]'
                  : 'bg-white text-[#4B5563] border-[#E2E5EA]'
              }`}
            >
              Type A (Default)
            </button>
            <button
              type="button"
              onClick={() => setTypeMode('b')}
              className={`px-4 py-2 rounded-[8px] text-[14px] font-semibold cursor-pointer border-2 ${
                typeMode === 'b'
                  ? 'bg-[#FFC21A] text-[#0B0B0C] border-[#0B0B0C] shadow-[2px_2px_0_#0B0B0C]'
                  : 'bg-white text-[#4B5563] border-[#E2E5EA]'
              }`}
            >
              Type B (?type=b)
            </button>
          </div>
        </div>

        <Card padding="lg" className="space-y-6">
          {TYPE_SIZES.map((px) => (
            <div key={px} className="space-y-2 pb-4 border-b border-[#E2E5EA] last:border-b-0 last:pb-0">
              <div className="text-[12px] font-mono text-[#4B5563] uppercase tracking-[0.05em]">
                {px}px · word-spacing normal · letter-spacing 0
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-2 items-baseline">
                {TYPE_SAMPLES.map((txt) => (
                  <span
                    key={txt}
                    style={{
                      fontSize: `${px}px`,
                      fontWeight: px === 24 ? 700 : 500,
                      letterSpacing: 0,
                      wordSpacing: 'normal',
                    }}
                    className="text-[#0B0B0C] font-sans"
                  >
                    {txt}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </Card>
      </section>

      {/* Real Section Preview combining SectionHeader + HighlightMark + CategoryRail + StickyStage + Receipt */}
      <section className="space-y-6 border-b border-[#E2E5EA] pb-12">
        <SectionHeader
          eyebrow="Real Section Specimen"
          title={
            <>
              Protected milestone payments, <HighlightMark>verified</HighlightMark> on Polygon
            </>
          }
          description="Lock funds upfront before coding or design starts. Only client sign-off releases payment."
          action={
            <Button variant="primary" leadingIcon={<PlusCircle size={16} />}>
              Post a job
            </Button>
          }
        />

        <CategoryRail className="border-t border-[#E2E5EA] rounded-[10px]" />

        <StickyStage
          left={
            <div className="space-y-3">
              {stages.map((s, idx) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setActiveStepIdx(idx)}
                  className={`w-full text-left p-5 rounded-[10px] transition-all cursor-pointer ${
                    activeStepIdx === idx
                      ? 'bg-[#FFC21A] text-[#0B0B0C] border-2 border-[#0B0B0C] shadow-[4px_4px_0_#0B0B0C]'
                      : 'bg-white text-[#0B0B0C] border border-[#E2E5EA] hover:border-[#0B0B0C]'
                  }`}
                >
                  <div className="text-[16px] font-bold mb-1">{s.title}</div>
                  <p className="text-[14px] text-[#0B0B0C]/85 leading-relaxed">{s.body}</p>
                </button>
              ))}
            </div>
          }
          right={
            <Receipt
              badgeText="Example"
              title="Frontend Design System Rebuild"
              subtitle="Milestone 1 of 2 · Protected by Escrow"
              stamp={activeStage.stamp}
              items={[
                { label: 'Milestone amount', value: '500.00 USDC' },
                { label: 'Client platform fee (2.5%)', value: '+12.50 USDC', muted: true },
                { label: 'Worker fee (2.5%)', value: '−12.50 USDC', muted: true },
              ]}
              totalLabel={activeStage.stamp === 'PAID' ? 'Released to worker' : 'Secured in escrow'}
              totalValue={activeStage.total}
              hashLine="0x7a4e...9c2b · Polygon (137)"
            />
          }
        />
      </section>

      {/* Core Components Grid */}
      <section className="space-y-8">
        <h3 className="text-landing-h3 text-[#0B0B0C]">Component Library Specimen</h3>

        <div className="space-y-4">
          <div className="text-[14px] font-semibold text-[#4B5563]">Buttons & Links</div>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" trailingIcon={<ArrowRight size={16} />}>
              Find open jobs
            </Button>
            <Button variant="secondary" leadingIcon={<PlusCircle size={16} />}>
              Post a job
            </Button>
            <Button variant="danger">Raise dispute</Button>
            <Link to="/categories">Explore categories</Link>
          </div>

          <div className="p-6 bg-[#0B0B0C] rounded-[14px] flex flex-wrap items-center gap-4">
            <Button variant="inverse">Start contract</Button>
            <Button variant="outline-inverse">Learn how it works</Button>
            <Link to="/security" onDark>
              Security details
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-[14px] font-semibold text-[#4B5563]">Tags (Text Only) & Tabs</div>
          <div className="flex flex-wrap gap-2">
            <Tag tone="neutral">Design &amp; Creative</Tag>
            <Tag tone="cobalt">Polygon</Tag>
            <Tag tone="yellow">2.5% per side</Tag>
            <Tag tone="orange">7-day review</Tag>
            <Tag tone="red">Dispute Alert</Tag>
            <Tag tone="green">Verified</Tag>
          </div>
          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: 'escrow', label: 'Overview', badge: 4 },
              { id: 'portfolio', label: 'Portfolio', badge: 6 },
              { id: 'certs', label: 'Certificates', badge: 2 },
              { id: 'reviews', label: 'Reviews', badge: 12 },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div className="text-[14px] font-semibold text-[#4B5563]">Accordion</div>
            <Accordion
              defaultExpandedIndex={0}
              items={[
                {
                  id: 'a1',
                  title: 'When does client money leave escrow?',
                  content: 'Only when the client approves the milestone or a 3-judge peer panel signs a settlement.',
                },
                {
                  id: 'a2',
                  title: 'Can creators & brand partners use PolyLance?',
                  content: 'Yes—Creators & Brand Collabs supports deliverables verified via portfolio links and receipts.',
                },
              ]}
            />
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>
              Open BottomSheet
            </Button>
          </div>

          <div className="space-y-4">
            <div className="text-[14px] font-semibold text-[#4B5563]">Skeleton Card</div>
            <SkeletonCard />
          </div>
        </div>
      </section>

      <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title="Escrow Summary">
        <Receipt
          badgeText="Example"
          title="Brand Kit Delivery"
          stamp="APPROVED"
          items={[{ label: 'Fixed milestone', value: '250.00 USDC' }]}
          totalLabel="Worker payout"
          totalValue="243.75 USDC"
          hashLine="0x4f91...e18a · Polygon (137)"
        />
      </BottomSheet>
    </div>
  );
};
