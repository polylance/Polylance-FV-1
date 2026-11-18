import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  Shield,
  Award,
  Lock,
  Unlock,
  CheckCircle2,
  Scale,
  Info,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { PolygonLogo } from '../brand/PolygonLogo';
import { UsdcIcon } from '../TokenIcon';
import { StepItem } from './EscrowRail';

interface EscrowDiagramProps {
  currentStep: StepItem;
  activeStep: number;
  totalSteps: number;
  isDisputeView: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelectStep: (index: number) => void;
  className?: string;
}

export const EscrowDiagram: React.FC<EscrowDiagramProps> = ({
  currentStep,
  activeStep,
  totalSteps,
  isDisputeView,
  onPrev,
  onNext,
  onSelectStep,
  className = '',
}) => {
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [blockNumber, setBlockNumber] = useState(68419204);

  // Live block ticker (Sample simulated live block heartbeat)
  useEffect(() => {
    const interval = setInterval(() => {
      setBlockNumber((prev) => prev + 1);
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  // Compute animated positions based on activeStep (0 to 5)
  // Step 0: Job card appears above client
  // Step 1: 500 USDC travels Client (x=100) -> Vault (x=360)
  // Step 2: Deliverable travels Freelancer (x=620) -> Vault (x=360) along top arc
  // Step 3: Approved review at Client, handshake lights up
  // Step 4: Split: 12.50 fee to Treasury (y=260), 487.50 to Freelancer (x=620)
  // Step 5: Certificate minted at (x=620, y=310)

  // Node highlight states
  const isClientActive = activeStep === 0 || activeStep === 1 || activeStep === 3;
  const isVaultActive = activeStep >= 1 && activeStep <= 4;
  const isFreelancerActive = activeStep === 2 || activeStep >= 4;
  const isCertActive = activeStep === 5;
  const isJudgesActive = isDisputeView && activeStep >= 3;

  return (
    <div
      className={`w-full bg-white border border-[#E5E7EB] rounded-[16px] p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col justify-between ${className}`}
    >
      {/* ── STAGE HEADER BAR ── */}
      <div className="flex flex-wrap items-center justify-between pb-3.5 border-b border-[#E5E7EB] gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse shrink-0" />
          <span className="font-semibold text-[#0B0B0F]">On-Chain Lifecycle Engine</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F6F7F9] border border-[#E5E7EB] text-[#4B5563]">
            Sample: 500 USDC
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Sample Block Ticker */}
          <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] text-[#6B7280]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0047AB]" />
            Block #{blockNumber.toLocaleString()} <span className="opacity-60">(Sample)</span>
          </span>

          {/* Clean Polygon Network Indicator: Single Polygon Mark + Mainnet + live dot */}
          <div className="flex items-center gap-1.5 font-mono text-xs text-[#0B0B0F] bg-[#F6F7F9] px-2.5 py-1 rounded-[6px] border border-[#E5E7EB]">
            <PolygonLogo variant="mark" size={14} />
            <span className="font-medium">Mainnet</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          </div>
        </div>
      </div>

      {/* ── SINGLE INLINE SVG DIAGRAM (viewBox: 0 0 720 420) ── */}
      <div className="relative w-full aspect-[720/420] my-4 bg-[#FAFAF8] rounded-[12px] border border-[#E5E7EB] overflow-hidden select-none">
        <svg
          viewBox="0 0 720 420"
          className="w-full h-full"
          aria-hidden="true"
        >
          <defs>
            {/* Dot Grid Pattern */}
            <pattern id="diag-grid-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1" fill="#E5E7EB" />
            </pattern>

            {/* Cobalt Soft Glow Filter */}
            <filter id="cobalt-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0047AB" floodOpacity="0.18" />
              <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0047AB" floodOpacity="0.08" />
            </filter>

            {/* Certificate Shine Filter */}
            <filter id="cert-gold-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#F59E0B" floodOpacity="0.25" />
            </filter>

            {/* Linear Gradient for Connectors */}
            <linearGradient id="active-connector-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0047AB" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>

            {/* Linear Gradient for Certificate Stamp */}
            <linearGradient id="cert-shine-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Dotted Grid Background */}
          <rect width="720" height="420" fill="url(#diag-grid-dots)" />

          {/* ─────────────────────────────────────────────────────────── */}
          {/* CONNECTOR PATHS (Route cleanly without passing through text) */}
          {/* ─────────────────────────────────────────────────────────── */}

          {/* 1. Client -> Vault Main Escrow Rail (y=130) */}
          <line
            x1="140"
            y1="130"
            x2="320"
            y2="130"
            stroke={activeStep >= 1 ? '#0047AB' : '#E5E7EB'}
            strokeWidth={activeStep >= 1 ? '3' : '2'}
            strokeDasharray={activeStep === 1 ? '4 4' : 'none'}
            className="transition-all duration-500"
          />

          {/* 2. Deliverable Upper Arc (Freelancer x=620 -> Vault x=360, arching over y=45) */}
          <path
            d="M 580 110 C 500 35, 430 35, 360 90"
            fill="none"
            stroke={activeStep >= 2 ? '#0047AB' : '#E5E7EB'}
            strokeWidth={activeStep === 2 ? '2.5' : '1.5'}
            strokeDasharray={activeStep === 2 ? 'none' : '4 4'}
            className="transition-all duration-500"
          />

          {/* 3. Vault -> Freelancer Settlement Rail (y=130) */}
          <line
            x1="400"
            y1="130"
            x2="580"
            y2="130"
            stroke={activeStep >= 4 && !isDisputeView ? '#0047AB' : '#E5E7EB'}
            strokeWidth={activeStep >= 4 ? '3' : '2'}
            strokeDasharray={activeStep === 4 ? '4 4' : 'none'}
            className="transition-all duration-500"
          />

          {/* 4. Vault -> Platform Fee (Peeling downward to y=260) */}
          {!isDisputeView && (
            <path
              d="M 360 170 L 360 230"
              fill="none"
              stroke={activeStep >= 4 ? '#6B7280' : '#E5E7EB'}
              strokeWidth="2"
              strokeDasharray={activeStep === 4 ? '3 3' : 'none'}
              className="transition-all duration-500"
            />
          )}

          {/* 5. Freelancer -> Work Certificate (Vertical downward to y=310) */}
          <line
            x1="620"
            y1="170"
            x2="620"
            y2="270"
            stroke={activeStep >= 5 ? '#0047AB' : '#E5E7EB'}
            strokeWidth="2.5"
            strokeDasharray={activeStep === 5 ? 'none' : '4 4'}
            className="transition-all duration-500"
          />

          {/* 6. Dispute: Vault -> Judges (Vertical downward to y=280) */}
          {isDisputeView && (
            <line
              x1="360"
              y1="170"
              x2="360"
              y2="245"
              stroke={activeStep >= 3 ? '#B45309' : '#E5E7EB'}
              strokeWidth="2.5"
              strokeDasharray="4 4"
              className="transition-all duration-500"
            />
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* PRIMARY NODES (Labels strictly placed BELOW nodes)          */}
          {/* ─────────────────────────────────────────────────────────── */}

          {/* ── NODE 1: Client Wallet (x=100, y=130) ── */}
          <g
            transform="translate(100, 130)"
            className={`transition-all duration-500 ${isClientActive ? 'opacity-100' : 'opacity-40'}`}
          >
            <circle
              r="34"
              fill="#FFFFFF"
              stroke={isClientActive ? '#0047AB' : '#E5E7EB'}
              strokeWidth={isClientActive ? '2.5' : '1.5'}
              filter={isClientActive ? 'url(#cobalt-glow)' : undefined}
            />
            <foreignObject x="-20" y="-20" width="40" height="40">
              <div className="w-full h-full flex items-center justify-center text-[#0B0B0F]">
                <Wallet size={22} className={isClientActive ? 'text-[#0047AB]' : 'text-[#6B7280]'} />
              </div>
            </foreignObject>

            {/* Label placed strictly BELOW node with 16px clearance */}
            <text y="52" textAnchor="middle" className="text-[12px] font-sans font-semibold fill-[#0B0B0F]">
              Client Wallet
            </text>
            <text y="66" textAnchor="middle" className="text-[10px] font-mono fill-[#6B7280]">
              0x71C...49A
            </text>
          </g>

          {/* ── NODE 2: Escrow Vault Smart Contract (x=360, y=130) ── */}
          <g
            transform="translate(360, 130)"
            className={`transition-all duration-500 ${isVaultActive ? 'opacity-100 scale-100' : 'opacity-40'}`}
          >
            <rect
              x="-36"
              y="-36"
              width="72"
              height="72"
              rx="16"
              fill="#FFFFFF"
              stroke={isVaultActive ? '#0047AB' : '#E5E7EB'}
              strokeWidth={isVaultActive ? '2.5' : '1.5'}
              filter={isVaultActive ? 'url(#cobalt-glow)' : undefined}
            />
            <foreignObject x="-20" y="-20" width="40" height="40">
              <div className="w-full h-full flex items-center justify-center">
                {activeStep >= 1 && activeStep < 4 ? (
                  <Lock size={24} className="text-[#0047AB] transition-transform duration-300 scale-110" />
                ) : activeStep >= 4 ? (
                  <Unlock size={24} className="text-[#10B981] transition-transform duration-300" />
                ) : (
                  <Shield size={24} className="text-[#9CA3AF]" />
                )}
              </div>
            </foreignObject>

            {/* Label placed strictly BELOW node with 16px clearance */}
            <text y="54" textAnchor="middle" className="text-[12px] font-sans font-semibold fill-[#0B0B0F]">
              Escrow Vault
            </text>
            <text
              y="68"
              textAnchor="middle"
              className={`text-[10px] font-mono font-semibold ${
                activeStep >= 1 && activeStep < 4
                  ? 'fill-[#0047AB]'
                  : activeStep >= 4
                  ? 'fill-[#10B981]'
                  : 'fill-[#9CA3AF]'
              }`}
            >
              {activeStep >= 1 && activeStep < 4
                ? 'Funds Locked'
                : activeStep >= 4
                ? 'Vault Released'
                : 'Proxy Standby'}
            </text>
          </g>

          {/* ── NODE 3: Freelancer Wallet (x=620, y=130) ── */}
          <g
            transform="translate(620, 130)"
            className={`transition-all duration-500 ${isFreelancerActive ? 'opacity-100' : 'opacity-40'}`}
          >
            <circle
              r="34"
              fill="#FFFFFF"
              stroke={isFreelancerActive ? '#0047AB' : '#E5E7EB'}
              strokeWidth={isFreelancerActive ? '2.5' : '1.5'}
              filter={isFreelancerActive ? 'url(#cobalt-glow)' : undefined}
            />
            <foreignObject x="-20" y="-20" width="40" height="40">
              <div className="w-full h-full flex items-center justify-center text-[#0B0B0F]">
                <Wallet size={22} className={isFreelancerActive ? 'text-[#0047AB]' : 'text-[#6B7280]'} />
              </div>
            </foreignObject>

            {/* Label placed strictly BELOW node with 16px clearance */}
            <text y="52" textAnchor="middle" className="text-[12px] font-sans font-semibold fill-[#0B0B0F]">
              Freelancer Wallet
            </text>
            <text y="66" textAnchor="middle" className="text-[10px] font-mono fill-[#6B7280]">
              0x38F...10D
            </text>
          </g>

          {/* ── NODE 4: Work Certificate (x=620, y=310) ── */}
          <g
            transform="translate(620, 310)"
            className={`transition-all duration-500 ${isCertActive ? 'opacity-100 scale-105' : 'opacity-40'}`}
          >
            <rect
              x="-34"
              y="-30"
              width="68"
              height="60"
              rx="10"
              fill="#FFFFFF"
              stroke={isCertActive ? '#0047AB' : '#E5E7EB'}
              strokeWidth={isCertActive ? '2.5' : '1.5'}
              filter={isCertActive ? 'url(#cobalt-glow)' : undefined}
            />

            {/* Decorative inner double border for certificate badge */}
            <rect
              x="-28"
              y="-24"
              width="56"
              height="48"
              rx="6"
              fill="none"
              stroke={isCertActive ? '#BFDBFE' : '#F3F4F6'}
              strokeWidth="1"
            />

            <foreignObject x="-16" y="-14" width="32" height="32">
              <div className="w-full h-full flex items-center justify-center text-[#0047AB]">
                <Award size={22} className={isCertActive ? 'text-[#0047AB]' : 'text-[#9CA3AF]'} />
              </div>
            </foreignObject>

            {/* Label placed strictly BELOW node with 14px clearance */}
            <text y="46" textAnchor="middle" className="text-[11px] font-sans font-semibold fill-[#0B0B0F]">
              Work Certificate
            </text>
            <text y="58" textAnchor="middle" className="text-[9px] font-mono fill-[#0047AB]">
              ERC-721 SBT
            </text>
          </g>

          {/* ── NODE 5: Platform Fee Node (x=360, y=260) ── */}
          {!isDisputeView && (
            <g
              transform="translate(360, 260)"
              className={`transition-all duration-500 ${activeStep >= 4 ? 'opacity-100' : 'opacity-35'}`}
            >
              <rect
                x="-40"
                y="-15"
                width="80"
                height="30"
                rx="8"
                fill="#FFFFFF"
                stroke={activeStep >= 4 ? '#6B7280' : '#E5E7EB'}
                strokeWidth="1.5"
              />
              <text y="4" textAnchor="middle" className="text-[10px] font-mono font-semibold fill-[#374151]">
                Treasury: 2.5%
              </text>
              <text y="25" textAnchor="middle" className="text-[9px] font-mono fill-[#6B7280]">
                12.50 USDC
              </text>
            </g>
          )}

          {/* ── NODE 6: Decentralized Judges (x=360, y=280) (Shown in dispute view) ── */}
          {isDisputeView && (
            <g
              transform="translate(360, 280)"
              className={`transition-all duration-500 ${isJudgesActive ? 'opacity-100' : 'opacity-40'}`}
            >
              <circle
                r="30"
                fill="#FFFFFF"
                stroke={isJudgesActive ? '#B45309' : '#E5E7EB'}
                strokeWidth="2"
              />
              <foreignObject x="-16" y="-16" width="32" height="32">
                <div className="w-full h-full flex items-center justify-center text-[#B45309]">
                  <Scale size={20} />
                </div>
              </foreignObject>
              <text y="44" textAnchor="middle" className="text-[11px] font-sans font-semibold fill-[#0B0B0F]">
                Decentralized Judges
              </text>
              <text y="56" textAnchor="middle" className="text-[9px] font-mono fill-[#B45309]">
                3-of-3 Quorum
              </text>
            </g>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* STEP-DRIVEN TRAVELING ARTIFACTS & CHIPS                     */}
          {/* ─────────────────────────────────────────────────────────── */}

          {/* Step 1: Job card fades in cleanly above Client at (x: 100, y: 55) */}
          {activeStep === 0 && (
            <g transform="translate(100, 55)" className="animate-fade-in">
              <rect
                x="-48"
                y="-15"
                width="96"
                height="30"
                rx="8"
                fill="#0B0B0F"
                filter="url(#cobalt-glow)"
              />
              <text x="0" y="4" textAnchor="middle" className="text-[11px] font-mono font-bold fill-[#FFFFFF]">
                Job: 500 USDC
              </text>
            </g>
          )}

          {/* Step 2: 500 USDC Coin travels along curved path from Client into Vault */}
          {activeStep === 1 && (
            <g transform="translate(230, 130)" className="transition-transform duration-500 ease-out">
              <rect
                x="-44"
                y="-15"
                width="88"
                height="30"
                rx="15"
                fill="#FFFFFF"
                stroke="#0047AB"
                strokeWidth="1.5"
                filter="url(#cobalt-glow)"
              />
              <foreignObject x="-36" y="-10" width="20" height="20">
                <UsdcIcon size={20} />
              </foreignObject>
              <text x="8" y="4" textAnchor="middle" className="text-[10px] font-mono font-bold fill-[#0B0B0F]">
                500 USDC
              </text>
            </g>
          )}

          {/* Step 3: Deliverable hash chip traveling along upper arc from Freelancer to Vault */}
          {activeStep === 2 && (
            <g transform="translate(460, 50)" className="transition-all duration-500 ease-out">
              <rect
                x="-64"
                y="-14"
                width="128"
                height="28"
                rx="7"
                fill="#0047AB"
                filter="url(#cobalt-glow)"
              />
              <text x="0" y="4" textAnchor="middle" className="text-[10px] font-mono font-semibold fill-[#FFFFFF]">
                Deliverable #c8f2a1
              </text>
            </g>
          )}

          {/* Step 4: Approved Review badge above Client Wallet */}
          {activeStep === 3 && (
            <g transform="translate(100, 55)" className="animate-fade-in">
              <rect
                x="-52"
                y="-14"
                width="104"
                height="28"
                rx="8"
                fill="#EFF6FF"
                stroke="#0047AB"
                strokeWidth="1.5"
                filter="url(#cobalt-glow)"
              />
              <text x="0" y="4" textAnchor="middle" fill="#0047AB" className="text-[11px] font-sans font-bold">
                ✓ Approved
              </text>
            </g>
          )}

          {/* Step 5: Split: 12.50 fee peels off downward, 487.50 USDC travels to Freelancer */}
          {activeStep === 4 && (
            <>
              {/* Freelancer payout chip */}
              <g transform="translate(490, 130)" className="transition-transform duration-500">
                <rect
                  x="-48"
                  y="-15"
                  width="96"
                  height="30"
                  rx="15"
                  fill="#FFFFFF"
                  stroke="#10B981"
                  strokeWidth="2"
                  filter="url(#cobalt-glow)"
                />
                <foreignObject x="-40" y="-10" width="20" height="20">
                  <UsdcIcon size={20} />
                </foreignObject>
                <text x="8" y="4" textAnchor="middle" className="text-[10px] font-mono font-bold fill-[#166534]">
                  487.50 USDC
                </text>
              </g>

              {/* Peeling fee chip */}
              <g transform="translate(360, 200)">
                <rect
                  x="-36"
                  y="-10"
                  width="72"
                  height="20"
                  rx="5"
                  fill="#F3F4F6"
                  stroke="#D1D5DB"
                />
                <text x="0" y="4" textAnchor="middle" className="text-[9px] font-mono font-semibold fill-[#4B5563]">
                  -12.50 Fee
                </text>
              </g>
            </>
          )}

          {/* Step 6: Certificate sealed badge & shine */}
          {activeStep === 5 && (
            <g transform="translate(620, 235)" className="animate-fade-in">
              <rect
                x="-52"
                y="-13"
                width="104"
                height="26"
                rx="6"
                fill="#0047AB"
                filter="url(#cobalt-glow)"
              />
              <text x="0" y="4" textAnchor="middle" className="text-[9px] font-mono font-bold fill-[#FFFFFF] tracking-wider">
                SEALED ON-CHAIN
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* ── DETAIL CARD & STEPPER CONTROLS UNDER STAGE ── */}
      <div className="p-4 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[12px] space-y-2 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#0047AB] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              0{currentStep.id}
            </span>
            <h4 className="text-sm font-semibold text-[#0B0B0F]">
              {currentStep.title}
            </h4>
          </div>

          <button
            type="button"
            onClick={() => setShowTechDetails(!showTechDetails)}
            className="text-xs text-[#0047AB] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            <Info size={13} />
            <span>{showTechDetails ? 'Hide architecture' : 'Technical details'}</span>
          </button>
        </div>

        <p className="text-xs text-[#4B5563] pl-8 leading-relaxed">
          {currentStep.copy}
        </p>

        {showTechDetails && (
          <div className="mt-2 ml-8 p-3 rounded-[8px] bg-white border border-[#E5E7EB] text-[11px] text-[#4B5563] space-y-1 animate-fade-in">
            <div>
              <strong className="text-[#0B0B0F]">Smart contract architecture:</strong>{' '}
              {currentStep.technical}
            </div>
            <div className="text-[10px] text-[#6B7280]">
              Audited minimal proxy pattern • Autonomous execution on Polygon Mainnet
            </div>
          </div>
        )}
      </div>

      {/* ── STEPPER NAVIGATION DOTS & PREV / NEXT BUTTONS ── */}
      <div className="flex items-center justify-between pt-3.5 border-t border-[#E5E7EB] mt-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPrev}
            disabled={activeStep === 0}
            aria-label="Previous step"
            className="px-3 py-1.5 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-[#F6F7F9] hover:text-[#0B0B0F] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
          >
            <ChevronLeft size={14} />
            <span>Prev</span>
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={activeStep === totalSteps - 1}
            aria-label="Next step"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0047AB] hover:bg-[#00388A] disabled:opacity-40 disabled:cursor-not-allowed rounded-[8px] cursor-pointer flex items-center gap-1 transition-colors shadow-xs"
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* 6 Step Dots */}
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Escrow steps">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={activeStep === idx}
              aria-label={`Jump to step ${idx + 1}`}
              onClick={() => onSelectStep(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeStep === idx
                  ? 'bg-[#0047AB] w-6'
                  : 'bg-[#D1D5DB] w-2.5 hover:bg-[#9CA3AF]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EscrowDiagram;
