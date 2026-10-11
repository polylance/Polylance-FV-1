import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { PolyLanceSelect, SelectOption } from '../components/PolyLanceSelect';
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';

type FontCandidate = 'plus-jakarta-sans' | 'manrope' | 'geist';

const FONT_OPTIONS: { id: FontCandidate; name: string; family: string; desc: string }[] = [
  {
    id: 'plus-jakarta-sans',
    name: 'Plus Jakarta Sans (Default)',
    family: "'Plus Jakarta Sans', 'Plus Jakarta Sans Fallback', sans-serif",
    desc: 'Geometric grotesque with balanced warmth and high legibility at micro sizes.',
  },
  {
    id: 'manrope',
    name: 'Manrope',
    family: "'Manrope', sans-serif",
    desc: 'Modern semi-geometric sans with open aperture and distinctive numerals.',
  },
  {
    id: 'geist',
    name: 'Geist',
    family: "'Geist', sans-serif",
    desc: 'Precision engineered neo-grotesque designed specifically for developer tools.',
  },
];

export const TypeLab: React.FC = () => {
  const [selectedFont, setSelectedFont] = useState<FontCandidate>('plus-jakarta-sans');
  const [role, setRole] = useState('freelancer');

  const current = FONT_OPTIONS.find((f) => f.id === selectedFont) || FONT_OPTIONS[0];

  const roleOptions: SelectOption[] = [
    { value: 'freelancer', label: 'Freelance Engineer' },
    { value: 'client', label: 'Client / Organization' },
    { value: 'judge', label: 'Ecosystem Judge' },
  ];

  return (
    <div
      className="min-h-screen bg-[#F6F7F9] text-[#0B0B0F] pb-24"
      style={{ fontFamily: current.family }}
    >
      {/* Sticky Switcher Header */}
      <div className="sticky top-16 z-40 bg-white border-b border-[#E5E7EB] shadow-xs">
        <PageContainer className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0047AB]" />
                <h1 className="text-base font-bold text-[#0B0B0F]">Typography Lab</h1>
                <span className="text-xs px-2 py-0.5 rounded bg-[#EFF6FF] text-[#0047AB] font-semibold border border-[#BFDBFE]">
                  Dev Route (/#/type-lab)
                </span>
              </div>
              <p className="text-xs text-[#4B5563] mt-0.5">{current.desc}</p>
            </div>

            {/* Font Switcher Radio Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[10px]">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFont(f.id)}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
                    selectedFont === f.id
                      ? 'bg-white text-[#0047AB] shadow-xs border border-[#E5E7EB]'
                      : 'text-[#4B5563] hover:text-[#0B0B0F]'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer className="py-10 space-y-12">
        {/* 1. Landing Hero Specimen */}
        <section className="bg-white border border-[#E5E7EB] rounded-[16px] p-8 sm:p-12 space-y-6 shadow-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#0047AB] border border-[#BFDBFE] text-eyebrow">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0047AB]" />
            <span>Escrow-protected freelancing on Polygon</span>
          </div>

          <h2 className="text-display text-[#0B0B0F]">
            Get paid safely for every milestone.
          </h2>

          <p className="text-lead text-[#374151]">
            Client funds lock securely into an on-chain smart contract before work starts.
            When you complete a milestone and the client approves, payment releases instantly to your wallet.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
            >
              Find work
            </Button>
            <Button
              variant="secondary"
              size="md"
            >
              Hire talent
            </Button>
            <Button
              as="a"
              href="#/demo"
              variant="ghost"
              size="md"
              trailingIcon={<ArrowRight size={14} />}
            >
              Try the demo
            </Button>
          </div>

          <div className="pt-4 border-t border-[#E5E7EB] flex flex-wrap items-center gap-6 text-xs text-[#4B5563]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#0047AB]" />
              <span>Escrow-protected</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#0047AB]" />
              <span>Platform fee 2.5%</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#0047AB]" />
              <span>Built on Polygon</span>
            </span>
          </div>
        </section>

        {/* 2. Stat Numeral Specimen (Tabular Nums) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6 space-y-2">
            <span className="text-xs font-semibold text-[#6B7280]">Total settled escrow volume</span>
            <div className="stat-numeral text-[#0B0B0F]">
              $24,580.00
            </div>
            <p className="text-xs text-[#4B5563]">100% verifiable on Polygonscan</p>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6 space-y-2">
            <span className="text-xs font-semibold text-[#6B7280]">Verified certificates issued</span>
            <div className="stat-numeral text-[#0B0B0F]">
              142
            </div>
            <p className="text-xs text-[#4B5563]">Non-transferable on-chain credentials</p>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6 space-y-2">
            <span className="text-xs font-semibold text-[#6B7280]">Completed milestones</span>
            <div className="stat-numeral text-[#0B0B0F]">
              389
            </div>
            <p className="text-xs text-[#4B5563]">Median settlement time under 4 minutes</p>
          </div>
        </section>

        {/* 3. Bento Card Specimen */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#F6F7F9] text-[#4B5563] border border-[#E5E7EB]">
                Escrow security
              </span>
              <ShieldCheck size={18} className="text-[#0047AB]" />
            </div>
            <h3 className="text-landing-h3 text-[#0B0B0F]">
              Smart contract milestone protection
            </h3>
            <p className="text-body text-[#4B5563]">
              Funds are held directly inside an isolated escrow contract, never in a PolyLance bank account. Payment is released milestone by milestone when approved.
            </p>
            <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#4B5563]">
              <span>Standard fee</span>
              <span className="font-semibold text-[#0B0B0F]">2.5% protocol flat</span>
            </div>
          </div>

          {/* 4. Form Controls Specimen */}
          <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#0B0B0F]">
              Interactive Form Inputs
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#4B5563] mb-1">
                  Full name or handle
                </label>
                <input
                  type="text"
                  defaultValue="Alex Thorne"
                  className="w-full bg-white border border-[#E5E7EB] rounded-[8px] px-3.5 py-2 text-sm text-[#0B0B0F] focus:outline-none focus:ring-2 focus:ring-[#EFF6FF] focus:border-[#0047AB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B5563] mb-1">
                  Primary account role
                </label>
                <PolyLanceSelect
                  value={role}
                  onChange={setRole}
                  options={roleOptions}
                  size="md"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded-[8px] bg-[#0047AB] text-white text-xs font-semibold hover:bg-[#00388A] transition-colors cursor-pointer"
                >
                  Save settings
                </button>
              </div>
            </div>
          </div>
        </section>
      </PageContainer>
    </div>
  );
};
