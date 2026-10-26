import React, { useState, useId, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Scale,
  ArrowRight,
  ChevronDown,
  Info,
  ChevronLeft,
  ExternalLink,
  PlusCircle,
  Search,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';
import { PolygonIcon } from '../components/TokenIcon';
import { calculateLiveFees } from '../utils/publicStatsMapper';
import {
  REVIEW_WINDOW_DAYS,
  DISPUTE_PANEL_SIZE,
  DISPUTE_EVIDENCE_WINDOW_DAYS,
  PLATFORM_FEE_PERCENT,
  MAINNET_CONTRACTS,
  POLYGONSCAN_BASE_URL,
} from '../seo/site.config';
import { trackLandingEvent } from '../utils/analytics';
import { Seo } from '../components/seo/Seo';

export const EscrowSimulatorPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial values from URL query parameters if present
  const initialBudget = (() => {
    const raw = searchParams.get('budget');
    if (!raw) return 1000;
    const n = parseFloat(raw);
    return !isNaN(n) && n >= 10 && n <= 50000 ? n : 1000;
  })();

  const initialToken = (() => {
    const raw = searchParams.get('token')?.toUpperCase();
    return raw === 'POL' ? 'POL' : 'USDC';
  })();

  const initialMilestones = (() => {
    const raw = searchParams.get('milestones');
    if (!raw) return 2;
    const n = parseInt(raw, 10);
    return !isNaN(n) && n >= 1 && n <= 5 ? n : 2;
  })();

  const initialAudience = (() => {
    const raw = searchParams.get('for')?.toLowerCase();
    return raw === 'client' ? 'client' : 'freelancer';
  })();

  const [audience, setAudience] = useState<'freelancer' | 'client'>(initialAudience);
  const [budget, setBudget] = useState<number>(initialBudget);
  const [token, setToken] = useState<'POL' | 'USDC'>(initialToken);
  const [milestonesCount, setMilestonesCount] = useState<number>(initialMilestones);
  const [isDisputeExpanded, setIsDisputeExpanded] = useState<boolean>(false);

  // Sync state to shareable query params
  useEffect(() => {
    const nextParams = new URLSearchParams();
    nextParams.set('budget', budget.toString());
    nextParams.set('token', token);
    nextParams.set('milestones', milestonesCount.toString());
    nextParams.set('for', audience);
    setSearchParams(nextParams, { replace: true });
  }, [budget, token, milestonesCount, audience, setSearchParams]);

  const budgetInputId = useId();

  // Pure BigInt math via calculateLiveFees (enforces invariant clientDeposit = freelancerNet + platformTotal)
  const calculation = calculateLiveFees(budget, token);

  const presets = [500, 1000, 2500, 5000];

  const handleBudgetChange = (value: number) => {
    const safe = Math.max(10, Math.min(50000, value));
    setBudget(safe);
    trackLandingEvent('landing_simulator_calc', { budget: safe, token, milestones: milestonesCount });
  };

  const handleTokenChange = (selected: 'POL' | 'USDC') => {
    setToken(selected);
    trackLandingEvent('landing_simulator_calc', { budget, token: selected, milestones: milestonesCount });
  };

  const handleMilestonesChange = (count: number) => {
    const safe = Math.max(1, Math.min(5, count));
    setMilestonesCount(safe);
    trackLandingEvent('landing_simulator_calc', { budget, token, milestones: safe });
  };

  const toggleDispute = () => {
    const nextState = !isDisputeExpanded;
    setIsDisputeExpanded(nextState);
    if (nextState) {
      trackLandingEvent('landing_dispute_expand', { audience });
    }
  };

  // Milestone allocation formatted with thousands separators and 2 decimals
  const perMilestoneBudget = (budget / milestonesCount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const freelancerNetNumber = parseFloat(calculation.freelancerReceives);
  const perMilestoneNet = (freelancerNetNumber / milestonesCount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Thousands-formatted numbers with two decimals
  const formattedClientPays = parseFloat(calculation.clientPays).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedFreelancerReceives = parseFloat(calculation.freelancerReceives).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedTotalFee = parseFloat(calculation.totalFee).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedClientFee = parseFloat(calculation.clientFee).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedFreelancerFee = parseFloat(calculation.freelancerFee).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="min-h-screen bg-white text-[#0B0B0F] font-sans pb-20">
      <Seo
        routeKey="/escrow-simulator"
        customConfig={{
          title: 'Interactive Escrow Simulator | PolyLance',
          description: 'Simulate any project budget on Polygon PoS. Calculate exact client deposits, freelancer payouts, 2.5% protocol fee splits, and milestone security lifecycle.',
        }}
      />

      {/* Top Breadcrumb & Return Header */}
      <div className="w-full bg-[#F6F7F9] border-b border-[#E5E7EB] py-3.5">
        <PageContainer noVerticalPadding>
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-medium">
              <Link to="/" className="hover:text-[#0047AB] transition-colors inline-flex items-center gap-1">
                <ChevronLeft size={14} />
                <span>Home</span>
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-[#0B0B0F] font-semibold">Escrow Simulator</span>
            </nav>
            <div className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px] text-[#4B5563]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Polygon PoS Mainnet</span>
            </div>
          </div>
        </PageContainer>
      </div>

      {/* Main Page Content */}
      <main className="py-10 sm:py-14 lg:py-16">
        <PageContainer noVerticalPadding>
          <div className="space-y-10 sm:space-y-12 text-left">
            
            {/* Page Title & Intro */}
            <div className="max-w-3xl space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#0047AB]">
                Protocol Fee Calculator
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B0B0F] tracking-tight">
                Interactive Escrow Simulator
              </h1>
              <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed">
                Simulate any project budget on Polygon PoS. Calculate exact client deposits, freelancer payouts, and milestone security lifecycle.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] text-xs font-medium text-[#4B5563]">
                <Info size={14} className="text-[#0047AB] shrink-0" />
                <span>Illustration using current fee rules; no transaction is made</span>
              </div>
            </div>

            {/* Interactive Calculator Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              
              {/* Left Column: Interactive Inputs (Sticky on Desktop) */}
              <div className="lg:col-span-5 bg-[#F6F7F9] border border-[#E5E7EB] rounded-2xl p-6 sm:p-7 space-y-6 lg:sticky lg:top-24 shadow-2xs">
                
                {/* Viewing As Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider">
                    Viewing As
                  </label>
                  <div
                    role="radiogroup"
                    aria-label="Simulator perspective"
                    className="grid grid-cols-2 gap-2 p-1 bg-white border border-[#E5E7EB] rounded-xl"
                  >
                    <button
                      type="button"
                      onClick={() => setAudience('freelancer')}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        audience === 'freelancer'
                          ? 'bg-[#0047AB] text-white shadow-2xs'
                          : 'text-[#4B5563] hover:text-[#0B0B0F]'
                      }`}
                    >
                      Freelancer
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudience('client')}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        audience === 'client'
                          ? 'bg-[#0047AB] text-white shadow-2xs'
                          : 'text-[#4B5563] hover:text-[#0B0B0F]'
                      }`}
                    >
                      Client
                    </button>
                  </div>
                </div>

                {/* Currency Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider">
                    Payment Currency
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleTokenChange('USDC')}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        token === 'USDC'
                          ? 'bg-white border-[#0047AB] shadow-xs ring-1 ring-[#0047AB]'
                          : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-[#0B0B0F]">USDC</div>
                        <div className="text-[11px] text-[#6B7280]">Dollar-pegged stablecoin</div>
                      </div>
                      {token === 'USDC' && <CheckCircle2 size={16} className="text-[#0047AB]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTokenChange('POL')}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        token === 'POL'
                          ? 'bg-white border-[#0047AB] shadow-xs ring-1 ring-[#0047AB]'
                          : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-[#0B0B0F] flex items-center gap-1.5">
                          <PolygonIcon size={14} className="text-[#0047AB]" />
                          <span>POL</span>
                        </div>
                        <div className="text-[11px] text-[#6B7280]">Polygon native token</div>
                      </div>
                      {token === 'POL' && <CheckCircle2 size={16} className="text-[#0047AB]" />}
                    </button>
                  </div>
                </div>

                {/* Total Project Budget */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor={budgetInputId} className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider">
                      Total Project Budget
                    </label>
                    <span className="text-xs font-mono font-semibold text-[#0047AB]">
                      {budget.toLocaleString()} {token}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      id={budgetInputId}
                      type="number"
                      min={10}
                      max={50000}
                      step={50}
                      value={budget}
                      onChange={(e) => handleBudgetChange(Number(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[#0B0B0F] font-semibold text-base focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:border-transparent tabular-nums"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6B7280] pointer-events-none">
                      {token}
                    </span>
                  </div>

                  {/* Smooth Range Slider */}
                  <div className="pt-1 space-y-1">
                    <input
                      type="range"
                      min={100}
                      max={10000}
                      step={50}
                      value={budget}
                      onChange={(e) => handleBudgetChange(Number(e.target.value) || 0)}
                      aria-label="Adjust project budget"
                      className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#0047AB]"
                    />
                    <div className="flex justify-between text-[10px] text-[#6B7280] font-mono">
                      <span>100 {token}</span>
                      <span>5,000 {token}</span>
                      <span>10,000 {token}</span>
                    </div>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <span className="text-[11px] text-[#6B7280] mr-1">Presets:</span>
                    {presets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleBudgetChange(preset)}
                        className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors cursor-pointer ${
                          budget === preset
                            ? 'bg-[#EAF1FB] text-[#0047AB] border-[#0047AB]'
                            : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#D1D5DB]'
                        }`}
                      >
                        {preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Milestones Stepper */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider">
                      Number of Milestones
                    </label>
                    <span className="text-xs font-semibold text-[#0047AB]">
                      {milestonesCount} {milestonesCount === 1 ? 'Milestone' : 'Milestones'}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => handleMilestonesChange(count)}
                        className={`py-2 text-center text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          milestonesCount === count
                            ? 'bg-[#0047AB] text-white border-[#0047AB]'
                            : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#D1D5DB]'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    Each milestone holds ~{perMilestoneBudget} {token} in escrow
                  </div>
                </div>

                {/* Contextual Action Button */}
                <div className="pt-2 space-y-2">
                  <Button
                    as="Link"
                    to={`/jobs/post?budget=${budget}&token=${token}&milestones=${milestonesCount}`}
                    variant="primary"
                    size="lg"
                    leadingIcon={<PlusCircle size={16} />}
                    className="w-full justify-center"
                  >
                    Post this as a job
                  </Button>
                  <Button
                    as="Link"
                    to={`/jobs?token=${token}`}
                    variant="secondary"
                    size="md"
                    leadingIcon={<Search size={15} />}
                    className="w-full justify-center text-xs"
                  >
                    Find jobs paying {token}
                  </Button>
                </div>

              </div>

              {/* Right Column: Visual Breakdown & Lifecycle (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Summary Card with exact fee breakdown & Value Flow */}
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0047AB]">
                      Exact Fee Breakdown (Zero Hidden Spreads)
                    </span>
                    <span className="text-xs text-[#6B7280] font-mono">Polygon PoS</span>
                  </div>

                  {/* Visual Money-Flow Stage: Client Wallet -> Escrow Contract -> Freelancer Wallet */}
                  <div className="p-4 sm:p-5 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] space-y-3.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                      How funds flow through escrow
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center text-center">
                      {/* Stage 1: Client */}
                      <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs">
                        <div className="text-[11px] font-semibold text-[#6B7280]">Client Wallet</div>
                        <div className="text-sm sm:text-base font-bold text-[#0B0B0F] tabular-nums mt-0.5">
                          {formattedClientPays} {token}
                        </div>
                        <div className="text-[10px] text-[#0047AB] font-medium mt-0.5">+{PLATFORM_FEE_PERCENT}% protocol fee</div>
                      </div>

                      {/* Flow arrow -> Escrow */}
                      <div className="flex flex-col items-center">
                        <div className="w-full flex items-center justify-center text-[#0047AB]">
                          <span className="text-xs font-bold sm:hidden">→</span>
                          <div className="hidden sm:flex items-center w-full">
                            <div className="h-0.5 bg-[#0047AB]/30 flex-1" />
                            <Lock size={15} className="text-[#0047AB] shrink-0 mx-1.5" />
                            <div className="h-0.5 bg-[#0047AB]/30 flex-1" />
                          </div>
                        </div>
                        <span className="text-[10px] sm:text-xs font-semibold text-[#0047AB] mt-1">Locked in Escrow</span>
                      </div>

                      {/* Stage 3: Freelancer */}
                      <div className="p-3 rounded-xl bg-[#EAF1FB] border border-[#D0DEF2] shadow-2xs">
                        <div className="text-[11px] font-semibold text-[#0047AB]">Freelancer Wallet</div>
                        <div className="text-sm sm:text-base font-bold text-[#0047AB] tabular-nums mt-0.5">
                          {formattedFreelancerReceives} {token}
                        </div>
                        <div className="text-[10px] text-[#0047AB]/80 font-medium mt-0.5">-{PLATFORM_FEE_PERCENT}% protocol fee</div>
                      </div>
                    </div>

                    {/* Stacked Fee Split Bar: 2.5% client + 2.5% freelancer = 5% protocol fee */}
                    <div className="pt-1.5 space-y-1.5">
                      <div className="h-2.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden flex">
                        <div className="bg-[#0047AB] h-full" style={{ width: '95%' }} title="Freelancer Net (97.5%)" />
                        <div className="bg-[#2563EB] h-full" style={{ width: '2.5%' }} title="Freelancer Fee 2.5%" />
                        <div className="bg-[#4B5563] h-full" style={{ width: '2.5%' }} title="Client Fee 2.5%" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#0047AB]" />
                          Freelancer Net (97.5%)
                        </span>
                        <span className="flex items-center gap-1.5 font-medium text-[#0B0B0F]">
                          <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                          {PLATFORM_FEE_PERCENT}% per side ({PLATFORM_FEE_PERCENT * 2}% total protocol fee)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3 Result Boxes with aria-live and Estimated labels */}
                  <div
                    aria-live="polite"
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
                  >
                    <div className="p-4 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#6B7280]">
                        <span>Client Deposits</span>
                        <span className="text-[10px] uppercase font-semibold text-[#9CA3AF]">Estimated</span>
                      </div>
                      <span className="text-lg sm:text-xl font-bold text-[#0B0B0F] tabular-nums block">
                        {formattedClientPays} {token}
                      </span>
                      <span className="text-[11px] text-[#4B5563] block">
                        Budget + {PLATFORM_FEE_PERCENT}% fee ({formattedClientFee} {token})
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#EAF1FB] border border-[#D0DEF2] space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#0047AB] font-semibold">
                        <span>Freelancer Receives</span>
                        <span className="text-[10px] uppercase font-semibold text-[#0047AB]/70">Estimated</span>
                      </div>
                      <span className="text-lg sm:text-xl font-bold text-[#0047AB] tabular-nums block">
                        {formattedFreelancerReceives} {token}
                      </span>
                      <span className="text-[11px] text-[#0047AB]/80 block">
                        Budget - {PLATFORM_FEE_PERCENT}% fee ({formattedFreelancerFee} {token})
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#6B7280]">
                        <span>Protocol Fee Total</span>
                        <span className="text-[10px] uppercase font-semibold text-[#9CA3AF]">Exact</span>
                      </div>
                      <span className="text-lg sm:text-xl font-bold text-[#0B0B0F] tabular-nums block">
                        {formattedTotalFee} {token}
                      </span>
                      <span className="text-[11px] text-[#4B5563] block">
                        {PLATFORM_FEE_PERCENT * 2}% total protocol fee
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-[#6B7280] flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[#F3F4F6]">
                    <div className="flex items-center gap-1.5">
                      <Info size={13} className="text-[#0047AB] shrink-0" />
                      <span>Network gas: <strong>Typical sub-cent gas on Polygon PoS</strong></span>
                    </div>
                    <span>Zero withdrawal fees</span>
                  </div>
                </div>

                {/* Visual Step-by-Step Security Timeline */}
                <div className="bg-[#F6F7F9] border border-[#E5E7EB] rounded-2xl p-6 sm:p-7 space-y-5">
                  <h3 className="text-base font-bold text-[#0B0B0F]">
                    Escrow Execution Lifecycle
                  </h3>

                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-full bg-[#0047AB] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs sm:text-sm space-y-0.5">
                        <div className="font-bold text-[#0B0B0F]">Deposit Locked in Escrow</div>
                        <p className="text-[#4B5563] leading-relaxed">
                          Client deposits <strong>{formattedClientPays} {token}</strong> into the autonomous Polygon smart contract. Freelancer sees locked collateral before starting work.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-full bg-[#0047AB] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs sm:text-sm space-y-0.5">
                        <div className="font-bold text-[#0B0B0F]">Milestone Delivered</div>
                        <p className="text-[#4B5563] leading-relaxed">
                          Freelancer submits deliverable code with cryptographic evidence submission hash directly through the workspace.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-full bg-[#0047AB] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="text-xs sm:text-sm space-y-0.5">
                        <div className="font-bold text-[#0B0B0F]">
                          Client Review Window ({REVIEW_WINDOW_DAYS} Days)
                        </div>
                        <p className="text-[#4B5563] leading-relaxed">
                          Client inspects deliverables. If satisfied, one click triggers payment. If the client becomes unresponsive, freelancer can claim auto-release after {REVIEW_WINDOW_DAYS} days on-chain.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-full bg-[#047857] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        4
                      </div>
                      <div className="text-xs sm:text-sm space-y-0.5">
                        <div className="font-bold text-[#047857]">Instant Payment &amp; Soulbound Certificate</div>
                        <p className="text-[#4B5563] leading-relaxed">
                          Smart contract transfers <strong>{formattedFreelancerReceives} {token}</strong> directly to freelancer wallet and mints a permanent CertifiedPass credential.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Dispute Resolution Branch */}
                  <div className="pt-3 border-t border-[#E5E7EB]">
                    <button
                      type="button"
                      onClick={toggleDispute}
                      aria-expanded={isDisputeExpanded}
                      className="w-full flex items-center justify-between text-xs font-semibold text-[#0047AB] hover:underline cursor-pointer py-1.5 text-left"
                    >
                      <span className="flex items-center gap-1.5">
                        <Scale size={14} className="shrink-0" />
                        <span>What if there is a disagreement during review?</span>
                      </span>
                      <ChevronDown
                        size={15}
                        className={`transition-transform duration-200 shrink-0 ${
                          isDisputeExpanded ? 'rotate-180 text-[#0047AB]' : 'text-[#6B7280]'
                        }`}
                      />
                    </button>

                    {isDisputeExpanded && (
                      <div className="mt-3 p-4 bg-white border border-[#E5E7EB] rounded-xl space-y-2 text-xs text-[#4B5563]">
                        <div className="font-bold text-[#0B0B0F] flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-[#0047AB]" />
                          <span>Decentralized Peer Arbitration</span>
                        </div>
                        <p className="leading-relaxed">
                          Either party can initiate dispute resolution before milestone release. A {DISPUTE_PANEL_SIZE}-judge peer panel is selected via JudgeDAO on Polygon. Both parties have a {DISPUTE_EVIDENCE_WINDOW_DAYS}-day evidence submission window to submit specifications, repo logs, and messages.
                        </p>
                        <p className="text-[11px] text-[#6B7280] leading-relaxed">
                          The verdict triggers smart contract bytecode execution directly: full release, full refund, or a percentage split. PolyLance operators cannot unilaterally seize or redirect escrow funds.
                        </p>
                      </div>
                    )}
                  </div>

                </div>

                {/* Verified Smart Contract Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-[#6B7280]">Execution Architecture</span>
                    <div className="text-xs font-bold text-[#0B0B0F]">
                      Autonomous Non-Custodial Escrow on Polygon PoS
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 shrink-0">
                    <span>On-Chain Verified</span>
                  </span>
                </div>

              </div>

            </div>

          </div>
        </PageContainer>
      </main>
    </div>
  );
};

export default EscrowSimulatorPage;
