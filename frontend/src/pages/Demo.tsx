import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { VideoSlot } from '../components/video/VideoSlot';
import { EscrowFlow } from '../components/escrow/EscrowFlow';
import { useDemoMode } from '../context/DemoModeContext';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Sparkles,
  ShieldCheck,
  Award,
  Scale,
  FileCheck,
  ArrowRight,
  Wallet,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const Demo: React.FC = () => {
  const { isDemoMode, enterDemoMode, restartTour } = useDemoMode();
  const navigate = useNavigate();

  const handleStartInteractiveDemo = () => {
    enterDemoMode();
    navigate('/dashboard');
  };

  return (
    <PageContainer className="space-y-6 py-6 text-[#0B0B0F]">
      <PageHeader
        title="Experience PolyLance in two minutes"
        subtitle="Explore the decentralized freelance marketplace without installing browser extensions, holding crypto funds, or paying gas fees."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleStartInteractiveDemo}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0047AB] hover:bg-[#003884] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Play size={13} className="fill-white" />
              <span>{isDemoMode ? 'Continue guided tour' : 'Start interactive demo'}</span>
              <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#F6F7F9] text-[#0B0B0F] border border-[#E5E7EB] text-xs font-medium transition-colors cursor-pointer"
            >
              <Wallet size={13} />
              <span>Connect wallet</span>
            </button>
          </div>
        }
      />

      {/* ── TWO-MINUTE VIDEO OVERVIEW ────────────────────────────────────── */}
      <section className="space-y-6 text-left">
        <div className="border-b border-[#E5E7EB] pb-3">
          <h2 className="font-sans font-semibold text-xl text-[#0B0B0F]">
            Product Overview & Investor Pitch
          </h2>
          <p className="text-xs text-[#6B7280]">
            Watch recorded walkthroughs of the on-chain milestone escrow and reputation oracle.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#0B0B0F]">Full Product Walkthrough (75s)</h3>
            <VideoSlot id="walkthrough" />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#0B0B0F]">Investor & Partner Pitch (90s)</h3>
            <VideoSlot id="pitch-demo" />
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE ESCROW FLOW DIAGRAM ──────────────────────────────── */}
      <section className="space-y-6 text-left">
        <div className="border-b border-[#E5E7EB] pb-3">
          <h2 className="font-sans font-semibold text-xl text-[#0B0B0F]">
            How on-chain escrow protects both parties
          </h2>
          <p className="text-xs text-[#6B7280]">
            Step through the non-custodial Polygon smart contract lifecycle.
          </p>
        </div>

        <EscrowFlow />
      </section>

      {/* ── FOUR CORE ARCHITECTURE BLOCKS ─────────────────────────────────── */}
      <section className="space-y-6 text-left">
        <div className="border-b border-[#E5E7EB] pb-3">
          <h2 className="font-sans font-semibold text-xl text-[#0B0B0F]">
            Four core trust pillars
          </h2>
          <p className="text-xs text-[#6B7280]">
            Engineered from first principles to remove platform risk and centralized dispute bias.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1: Escrow */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[8px] bg-[#E7EEF9] text-[#0047AB] flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-base text-[#0B0B0F]">
                  1. Non-Custodial Escrow Vaults
                </h3>
                <p className="text-xs text-[#6B7280]">Smart contract milestone locks</p>
              </div>
            </div>

            <ul className="space-y-2 text-xs sm:text-sm text-[#4B5563]">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#0047AB] shrink-0 mt-0.5" />
                <span>Clients lock project funds before work commences; freelancers never work on credit.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#0047AB] shrink-0 mt-0.5" />
                <span>Zero centralized custodian: neither PolyLance nor founders can touch or freeze escrow balances.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#0047AB] shrink-0 mt-0.5" />
                <span>Supports POL (native Polygon) and USDC token denominations with 2.5% protocol fee.</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={handleStartInteractiveDemo}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0047AB] hover:underline pt-2 cursor-pointer"
            >
              <span>Try escrow funding in demo</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Pillar 2: Reputation */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[8px] bg-[#E7EEF9] text-[#0047AB] flex items-center justify-center shrink-0">
                <Award size={18} />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-base text-[#0B0B0F]">
                  2. Verifiable GitHub & On-Chain Reputation
                </h3>
                <p className="text-xs text-[#6B7280]">Cryptographic proof of skill</p>
              </div>
            </div>

            <ul className="space-y-2 text-xs sm:text-sm text-[#4B5563]">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#0047AB] shrink-0 mt-0.5" />
                <span>GitHub E-KYC attestation computes developer score out of 1000 from real commit history.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#0047AB] shrink-0 mt-0.5" />
                <span>Language contributions and repo activity are cryptographically attested without sharing private keys.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#0047AB] shrink-0 mt-0.5" />
                <span>Soulbound points cannot be bought, transferred, or faked across profiles.</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={handleStartInteractiveDemo}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0047AB] hover:underline pt-2 cursor-pointer"
            >
              <span>Inspect demo profile reputation</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Pillar 3: Disputes */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[8px] bg-[#E7EEF9] text-[#0047AB] flex items-center justify-center shrink-0">
                <Scale size={18} />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-base text-[#0B0B0F]">
                  3. Decentralized Juror Dispute Resolution
                </h3>
                <p className="text-xs text-[#6B7280]">Community adjudication safety net</p>
              </div>
            </div>

            <ul className="space-y-2 text-xs sm:text-sm text-[#4B5563]">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#0047AB] shrink-0 mt-0.5" />
                <span>If scope conflicts arise, either party can freeze escrow and request judge arbitration.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#0047AB] shrink-0 mt-0.5" />
                <span>Elected jurors examine deliverables and chat history to cast multi-sig ruling verdicts.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#0047AB] shrink-0 mt-0.5" />
                <span>Transparent verdicts disburse locked escrow directly to the rightful winner.</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={handleStartInteractiveDemo}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0047AB] hover:underline pt-2 cursor-pointer"
            >
              <span>View dispute panel in demo</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Pillar 4: Certificates */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[8px] bg-[#E7EEF9] text-[#0047AB] flex items-center justify-center shrink-0">
                <FileCheck size={18} />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-base text-[#0B0B0F]">
                  4. Soulbound Work Certificates (ERC-721)
                </h3>
                <p className="text-xs text-[#6B7280]">Permanent proof of completion</p>
              </div>
            </div>

            <ul className="space-y-2 text-xs sm:text-sm text-[#4B5563]">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#0047AB] shrink-0 mt-0.5" />
                <span>Every approved milestone mints a non-transferable Soulbound token directly to the freelancer.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#0047AB] shrink-0 mt-0.5" />
                <span>Permanent Polygon metadata records contract value, category, timestamp, and client identity.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#0047AB] shrink-0 mt-0.5" />
                <span>Universally verifiable via CertifiedPass Oracle without relying on centralized databases.</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={handleStartInteractiveDemo}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0047AB] hover:underline pt-2 cursor-pointer"
            >
              <span>View certificate in demo</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ──────────────────────────────────────────────────── */}
      <section className="bg-[#0B0B0F] text-white rounded-[12px] p-8 sm:p-12 text-center space-y-5">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Ready to try the future of freelance work?
        </h2>
        <p className="text-sm sm:text-base text-[#D1D5DB] max-w-xl mx-auto leading-relaxed">
          Start the interactive demo to walk through all 8 steps, or connect your Web3 wallet to post your first contract.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleStartInteractiveDemo}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[8px] bg-[#0047AB] hover:bg-[#003884] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <Play size={15} className="fill-white" />
            <span>Launch interactive demo</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-[8px] bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition-colors cursor-pointer"
          >
            <Wallet size={15} />
            <span>Connect wallet</span>
          </button>
        </div>
      </section>
    </PageContainer>
  );
};

export default Demo;
