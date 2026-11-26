import React, { useState } from 'react';
import { 
  ArrowRight, PlusCircle, CheckCircle2, Copy, Check, 
  ChevronDown, ShieldCheck, Smartphone, Monitor
} from 'lucide-react';

interface SpecimenOption {
  id: 'a' | 'b' | 'c';
  title: string;
  badge: string;
  headingFamily: string;
  bodyFamily: string;
  monoFamily: string;
  displayClass: string;
  textClass: string;
  monoClass: string;
  recommendation?: string;
}

const SPECIMENS: SpecimenOption[] = [
  {
    id: 'a',
    title: 'Option A: Red Hat Cohesive System',
    badge: 'Recommended',
    recommendation: 'Single unified family designed together. Highly readable at small mobile sizes with geometric balance.',
    headingFamily: 'Red Hat Display (600/700)',
    bodyFamily: 'Red Hat Text (400/500)',
    monoFamily: 'Red Hat Mono (400/500)',
    displayClass: 'font-opt-a-display',
    textClass: 'font-opt-a-text',
    monoClass: 'font-opt-a-mono',
  },
  {
    id: 'b',
    title: 'Option B: Geist Modern Geometric',
    badge: 'Vercel / Modern Web3',
    recommendation: 'Modern neo-grotesque type crafted for code and digital interfaces. Razor-sharp neutral aesthetics.',
    headingFamily: 'Geist (600/700)',
    bodyFamily: 'Geist (400/500)',
    monoFamily: 'Geist Mono (400/500)',
    displayClass: 'font-opt-b-display',
    textClass: 'font-opt-b-text',
    monoClass: 'font-opt-b-mono',
  },
  {
    id: 'c',
    title: 'Option C: Bricolage + Public Sans',
    badge: 'Editorial Expressive',
    recommendation: 'Expressive vintage grotesque display combined with USWDS Public Sans for high-contrast character.',
    headingFamily: 'Bricolage Grotesque (600/700)',
    bodyFamily: 'Public Sans (400/500)',
    monoFamily: 'JetBrains Mono (400/500)',
    displayClass: 'font-opt-c-display',
    textClass: 'font-opt-c-text',
    monoClass: 'font-opt-c-mono',
  },
];

export const DesignSpecimen: React.FC = () => {
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'all' | 'a' | 'b' | 'c'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [accordionOpen, setAccordionOpen] = useState<{ [key: string]: boolean }>({
    a: false,
    b: false,
    c: false,
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleAccordion = (id: string) => {
    setAccordionOpen(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const visibleSpecimens = activeTab === 'all' 
    ? SPECIMENS 
    : SPECIMENS.filter(s => s.id === activeTab);

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#0B1220] py-6 px-3 sm:px-6">
      {/* Top Controls Bar */}
      <header className="max-w-7xl mx-auto mb-8 bg-white border border-[#DCE3F0] rounded-xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#EEF3FF] text-[#0047AB] text-xs font-semibold tracking-[0.05em] uppercase">
            <span>PolyLance Foundation Specimen</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B1220] mt-1">
            Typography &amp; Token Comparison
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5568]">
            Compare the 3 font candidates with real PolyLance content and strict token rules.
          </p>
        </div>

        {/* Viewport & Tab Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Viewport Width Switcher */}
          <div className="inline-flex p-1 bg-[#EEF3FF] rounded-lg border border-[#DCE3F0]">
            <button
              type="button"
              onClick={() => setViewportMode('desktop')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewportMode === 'desktop'
                  ? 'bg-white text-[#0047AB] shadow-xs font-semibold'
                  : 'text-[#4A5568] hover:text-[#0B1220]'
              }`}
            >
              <Monitor size={15} />
              <span>1280px Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('mobile')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewportMode === 'mobile'
                  ? 'bg-white text-[#0047AB] shadow-xs font-semibold'
                  : 'text-[#4A5568] hover:text-[#0B1220]'
              }`}
            >
              <Smartphone size={15} />
              <span>375px Mobile</span>
            </button>
          </div>

          {/* Option Selector */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-[#DCE3F0]">
            {(['all', 'a', 'b', 'c'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors uppercase ${
                  activeTab === tab
                    ? 'bg-white text-[#0B1220] shadow-xs font-bold'
                    : 'text-[#4A5568] hover:text-[#0B1220]'
                }`}
              >
                {tab === 'all' ? 'All (Side by Side)' : `Option ${tab.toUpperCase()}`}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Specimen Canvas */}
      <main className="max-w-7xl mx-auto flex justify-center">
        <div
          className={`w-full transition-all duration-300 ${
            viewportMode === 'mobile'
              ? 'max-w-[375px] mx-auto'
              : 'w-full'
          }`}
        >
          <div
            className={`grid gap-8 ${
              viewportMode === 'desktop' && visibleSpecimens.length > 1
                ? visibleSpecimens.length === 2
                  ? 'grid-cols-1 lg:grid-cols-2'
                  : 'grid-cols-1 lg:grid-cols-3'
                : 'grid-cols-1'
            }`}
          >
            {visibleSpecimens.map((specimen) => (
              <article
                key={specimen.id}
                className="bg-white border border-[#DCE3F0] rounded-xl overflow-hidden shadow-xs flex flex-col justify-between"
              >
                {/* Specimen Header Meta */}
                <div className="p-5 border-b border-[#DCE3F0] bg-[#EEF3FF]/40 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.05em] text-[#0047AB]">
                      {specimen.badge}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-[#DCE3F0] text-[#4A5568] font-mono">
                      WOFF2 Local
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#0B1220]">
                    {specimen.title}
                  </h2>
                  <div className="text-xs text-[#4A5568] space-y-0.5 font-sans">
                    <p><strong className="text-[#0B1220]">Display:</strong> {specimen.headingFamily}</p>
                    <p><strong className="text-[#0B1220]">Body:</strong> {specimen.bodyFamily}</p>
                    <p><strong className="text-[#0B1220]">On-chain Mono:</strong> {specimen.monoFamily}</p>
                  </div>
                  {specimen.recommendation && (
                    <p className="text-xs text-[#0047AB] font-medium pt-1 border-t border-[#DCE3F0]/60">
                      {specimen.recommendation}
                    </p>
                  )}
                </div>

                {/* Content Sandbox with Real PolyLance Data */}
                <div className="p-5 sm:p-6 space-y-7 flex-1">
                  
                  {/* 1. HERO HEADLINE & EYEBROW */}
                  <section className="space-y-2.5">
                    <div className={`${specimen.textClass} text-xs font-medium tracking-[0.05em] uppercase text-[#0047AB]`}>
                      Escrow-Protected Freelance Protocol
                    </div>
                    <h3
                      className={`${specimen.displayClass} font-semibold text-[#0B1220] tracking-[-0.02em] leading-[1.15] text-[clamp(1.75rem,1.2rem+2vw,2.5rem)]`}
                      style={{ textWrap: 'balance' }}
                    >
                      Get paid safely for every milestone
                    </h3>
                    <p
                      className={`${specimen.textClass} text-base leading-[1.6] text-[#4A5568] max-w-[62ch]`}
                      style={{ textWrap: 'pretty', letterSpacing: '0', wordSpacing: 'normal' }}
                    >
                      PolyLance locks project milestones in autonomous Polygon smart contract escrows. Funds release strictly upon verified deliverables with soulbound reputation attestations and zero custodial risk.
                    </p>
                  </section>

                  {/* 2. BUTTON ROW (Mobile 48px / Desktop 44px, Single Icon, No cramped word spacing) */}
                  <section className="space-y-3">
                    <span className="text-[11px] font-bold text-[#4A5568] tracking-[0.05em] uppercase block">
                      Buttons &amp; Actions
                    </span>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
                      <button
                        type="button"
                        className={`${specimen.textClass} h-11 sm:h-11 px-5 rounded-lg bg-[#0047AB] hover:bg-[#00388A] text-white font-medium text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer w-full sm:w-auto`}
                        style={{ letterSpacing: '0', wordSpacing: 'normal' }}
                      >
                        <span>Browse Escrow Jobs</span>
                        <ArrowRight size={16} />
                      </button>

                      <button
                        type="button"
                        className={`${specimen.textClass} h-11 sm:h-11 px-5 rounded-lg bg-white hover:bg-[#EEF3FF] border border-[#DCE3F0] text-[#0B1220] font-medium text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer w-full sm:w-auto`}
                        style={{ letterSpacing: '0', wordSpacing: 'normal' }}
                      >
                        <PlusCircle size={16} />
                        <span>Post a Job</span>
                      </button>

                      <button
                        type="button"
                        className={`${specimen.textClass} h-11 sm:h-11 px-4 rounded-lg bg-transparent hover:bg-[#EEF3FF] text-[#0047AB] font-medium text-sm inline-flex items-center justify-center transition-colors cursor-pointer w-full sm:w-auto`}
                        style={{ letterSpacing: '0', wordSpacing: 'normal' }}
                      >
                        <span>Inspect Contract</span>
                      </button>
                    </div>
                  </section>

                  {/* 3. ON-CHAIN STATS ROW (Tabular Figures) */}
                  <section className="p-4 rounded-xl bg-[#EEF3FF] border border-[#DCE3F0] space-y-2">
                    <span className="text-[11px] font-bold text-[#4A5568] tracking-[0.05em] uppercase block">
                      Live Protocol Proof
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="space-y-0.5">
                        <div className={`${specimen.monoClass} text-base sm:text-lg font-bold text-[#0B1220]`}>
                          $2,450,000
                        </div>
                        <div className={`${specimen.textClass} text-[11px] text-[#4A5568]`}>
                          Total Escrowed
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <div className={`${specimen.monoClass} text-base sm:text-lg font-bold text-[#0047AB]`}>
                          0.02s
                        </div>
                        <div className={`${specimen.textClass} text-[11px] text-[#4A5568]`}>
                          Polygon Finality
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <div className={`${specimen.monoClass} text-base sm:text-lg font-bold text-[#166534]`}>
                          100%
                        </div>
                        <div className={`${specimen.textClass} text-[11px] text-[#4A5568]`}>
                          Non-Custodial
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 4. FEE BREAKDOWN (Strict Invariant: 2.5% + 2.5% = 5%) */}
                  <section className="space-y-2">
                    <span className="text-[11px] font-bold text-[#4A5568] tracking-[0.05em] uppercase block">
                      Escrow Settlement Breakdown
                    </span>
                    <div className="p-3.5 rounded-lg border border-[#DCE3F0] bg-white space-y-2 text-sm">
                      <div className="flex justify-between items-center text-[#4A5568]">
                        <span className={specimen.textClass}>Milestone Budget</span>
                        <span className={`${specimen.monoClass} font-medium text-[#0B1220]`}>1,000.00 USDC</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-[#4A5568]">
                        <span className={specimen.textClass}>Client Protocol Fee (2.5%)</span>
                        <span className={`${specimen.monoClass} text-[#0047AB]`}>+25.00 USDC</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-[#4A5568]">
                        <span className={specimen.textClass}>Freelancer Protocol Fee (2.5%)</span>
                        <span className={`${specimen.monoClass} text-[#0047AB]`}>-25.00 USDC</span>
                      </div>
                      <div className="pt-2 border-t border-[#DCE3F0] flex justify-between items-center font-medium">
                        <span className={specimen.textClass}>Freelancer Net Settlement</span>
                        <span className={`${specimen.monoClass} font-bold text-[#166534] text-base`}>975.00 USDC</span>
                      </div>
                    </div>
                  </section>

                  {/* 5. ON-CHAIN DATA (Mono Only, Never on Decoration) */}
                  <section className="space-y-2">
                    <span className="text-[11px] font-bold text-[#4A5568] tracking-[0.05em] uppercase block">
                      On-Chain Identifiers (Mono Restricted)
                    </span>
                    <div className="space-y-2 text-xs">
                      {/* Wallet Address */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-[#DCE3F0]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[#4A5568] font-sans">Client:</span>
                          <span className={`${specimen.monoClass} text-[#0B1220] font-medium truncate`}>
                            0x71C...4982
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(`wallet-${specimen.id}`, '0x71C2d8A9e4F1672B1046E3A9842')}
                          className="p-1 rounded text-[#4A5568] hover:text-[#0047AB] transition-colors"
                          aria-label="Copy wallet address"
                        >
                          {copiedId === `wallet-${specimen.id}` ? <Check size={14} className="text-[#166534]" /> : <Copy size={14} />}
                        </button>
                      </div>

                      {/* Transaction Hash */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-[#DCE3F0]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[#4A5568] font-sans">Tx:</span>
                          <span className={`${specimen.monoClass} text-[#0047AB] font-medium truncate`}>
                            0x9a3f...d81e
                          </span>
                        </div>
                        <span className="text-[11px] text-[#166534] font-medium flex items-center gap-1">
                          <CheckCircle2 size={13} />
                          <span>Polygon Confirmed</span>
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* 6. FORM INPUT (48px tall, 16px text - iOS Zoom Proof) */}
                  <section className="space-y-2">
                    <span className="text-[11px] font-bold text-[#4A5568] tracking-[0.05em] uppercase block">
                      Form Input (48px Height, 16px Text)
                    </span>
                    <div>
                      <label className={`${specimen.textClass} block text-xs font-semibold text-[#0B1220] mb-1.5`}>
                        Milestone Deliverable Specification
                      </label>
                      <input
                        type="text"
                        defaultValue="Smart contract escrow deployment & bytecode audit"
                        className={`${specimen.textClass} w-full h-12 px-3.5 bg-white border border-[#DCE3F0] rounded-lg text-base text-[#0B1220] placeholder-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:ring-offset-2 transition-shadow`}
                      />
                      <p className={`${specimen.textClass} text-xs text-[#4A5568] mt-1`}>
                        Acceptance criteria verified before automated escrow release.
                      </p>
                    </div>
                  </section>

                  {/* 7. ACCORDION ITEM (56px Tap Target Row, Hairline Divider) */}
                  <section className="space-y-2">
                    <span className="text-[11px] font-bold text-[#4A5568] tracking-[0.05em] uppercase block">
                      Accordion (56px Tap Target, Hairline Divider)
                    </span>
                    <div className="border border-[#DCE3F0] rounded-lg divide-y divide-[#DCE3F0] overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => toggleAccordion(specimen.id)}
                        className={`${specimen.textClass} w-full h-14 px-4 flex items-center justify-between text-left text-sm font-semibold text-[#0B1220] hover:bg-[#EEF3FF]/40 transition-colors cursor-pointer`}
                      >
                        <span>How does non-custodial milestone dispute resolution work?</span>
                        <ChevronDown 
                          size={18} 
                          className={`text-[#4A5568] transition-transform duration-200 ${
                            accordionOpen[specimen.id] ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>
                      {accordionOpen[specimen.id] && (
                        <div className={`${specimen.textClass} p-4 text-xs sm:text-sm text-[#4A5568] leading-relaxed bg-[#EEF3FF]/20`}>
                          In the event of an unresolvable dispute, either party may escalate to JudgeDAO peer arbitrators. Funds remain locked in the EIP-1167 smart proxy until evidence is reviewed on-chain.
                        </div>
                      )}
                    </div>
                  </section>

                </div>

                {/* Footer Selection Button */}
                <div className="p-4 border-t border-[#DCE3F0] bg-[#EEF3FF]/30">
                  <div className="text-center">
                    <span className="text-xs text-[#0047AB] font-semibold">
                      Candidate {specimen.id.toUpperCase()}: {specimen.headingFamily.split(' ')[0]} + {specimen.bodyFamily.split(' ')[0]}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DesignSpecimen;

