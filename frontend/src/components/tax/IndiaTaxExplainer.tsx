import React, { useState, useId } from 'react';
import {
  FileText,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Coins,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Calendar,
  Percent,
} from 'lucide-react';

interface CalculationResult {
  grossReceiptInr: number;
  taxableProfessionalIncome: number;
  moment1Tax: number;
  saleValueInr: number;
  capitalGainInr: number;
  moment2Tax: number;
  tdsWithheldInr: number;
  totalTaxLiability: number;
  netTaxPayable: number;
  effectiveTaxRate: number;
}

export const IndiaTaxExplainer: React.FC = () => {
  // Calculator state
  const [token, setToken] = useState<'USDC' | 'POL'>('USDC');
  const [tokenAmount, setTokenAmount] = useState<number>(2000);
  const [receiptInrRate, setReceiptInrRate] = useState<number>(85);
  const [saleInrRate, setSaleInrRate] = useState<number>(90);
  const [taxSlab, setTaxSlab] = useState<number>(0.15); // 15% slab
  const [use44ADA, setUse44ADA] = useState<boolean>(true); // Presumptive taxation scheme
  const [applyTds, setApplyTds] = useState<boolean>(true); // 1% TDS Sec 194S

  // Accordion state for Myth vs Fact
  const [expandedMyth, setExpandedMyth] = useState<number | null>(null);

  // Form field IDs for accessibility
  const tokenSelectId = useId();
  const tokenAmountId = useId();
  const receiptRateId = useId();
  const saleRateId = useId();
  const taxSlabId = useId();

  // Compute taxes
  const calculateTaxes = (): CalculationResult => {
    const grossReceiptInr = tokenAmount * receiptInrRate;
    // Section 44ADA deems 50% of gross receipts as taxable profit for technical/freelance professionals
    const taxableProfessionalIncome = use44ADA ? grossReceiptInr * 0.5 : grossReceiptInr;
    // Standard 4% Health & Education cess on income tax
    const moment1Tax = taxableProfessionalIncome * taxSlab * 1.04;

    const saleValueInr = tokenAmount * saleInrRate;
    const costBasisInr = grossReceiptInr;
    const capitalGainInr = Math.max(0, saleValueInr - costBasisInr);
    // Section 115BBH flat 30% + 4% cess = 31.2% on net capital gains
    const moment2Tax = capitalGainInr * 0.312;

    // Section 194S: 1% TDS deducted at the time of sale/transfer on VDA exchange
    const tdsWithheldInr = applyTds ? saleValueInr * 0.01 : 0;

    const totalTaxLiability = moment1Tax + moment2Tax;
    const netTaxPayable = Math.max(0, totalTaxLiability - tdsWithheldInr);
    const effectiveTaxRate = saleValueInr > 0 ? (totalTaxLiability / saleValueInr) * 100 : 0;

    return {
      grossReceiptInr,
      taxableProfessionalIncome,
      moment1Tax,
      saleValueInr,
      capitalGainInr,
      moment2Tax,
      tdsWithheldInr,
      totalTaxLiability,
      netTaxPayable,
      effectiveTaxRate,
    };
  };

  const results = calculateTaxes();

  const myths = [
    {
      id: 1,
      myth: 'I have to pay a flat 30% tax on the entire milestone amount I earn.',
      fact: 'False. Crypto received as remuneration for freelance work is recognized as ordinary professional or business income (Section 28 / 56). You are taxed at your applicable individual income tax slab on the Fair Market Value (FMV) in INR on the day of receipt. Furthermore, eligible freelancers can utilize Section 44ADA (Presumptive Taxation) to declare 50% of gross receipts as presumptive taxable profit. The flat 30% tax (Section 115BBH) applies exclusively to subsequent capital gains if the tokens appreciate before you sell them.',
      badge: 'Section 115BBH vs Business Income',
    },
    {
      id: 2,
      myth: 'Freelancers get taxed twice on the same crypto payment.',
      fact: 'False. There is zero double taxation. The INR fair market value established at receipt becomes your official cost basis (Section 48 / 115BBH). When you later liquidate or swap your tokens, only the incremental appreciation (Sale Price minus Cost Basis at receipt) is subject to the 30% VDA capital gains tax. If you sell at the exact same price as received, your Moment 2 capital gains tax is ₹0.',
      badge: 'Cost Basis & Realization',
    },
    {
      id: 3,
      myth: 'Taxes only apply when I withdraw INR into my domestic bank account.',
      fact: 'False. Under Indian tax jurisprudence, income accrues and is deemed received the moment the client’s milestone funds are unlocked in your self-custody wallet on-chain. Holding tokens in MetaMask or cold storage does not defer taxable realization. Freelancers should maintain contemporaneous bookkeeping of milestone dates, on-chain transaction hashes, and the RBI/exchange reference INR rates on the receipt date.',
      badge: 'On-Chain Realization Timing',
    },
  ];

  return (
    <section className="mt-16 pt-12 border-t border-[#E5E7EB]" aria-labelledby="india-tax-heading">
      {/* Educational Banner */}
      <div className="bg-[#FFFBEB] border border-[#FCD34D] rounded-xl p-4 sm:p-5 mb-8 flex items-start gap-3.5 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1 text-sm">
          <p className="font-bold text-[#92400E]">
            Educational Information Only — Not Tax or Legal Advice
          </p>
          <p className="text-[#B45309] leading-relaxed">
            This explainer illustrates statutory provisions under the Indian Income-tax Act, 1961
            (including Sections 28, 44ADA, 115BBH, and 194S) for Web3 freelancers. Individual circumstances vary; always consult a licensed Chartered Accountant (FCA/ACA) for formal tax planning and filings.
          </p>
        </div>
      </div>

      {/* Section Header */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0047AB] text-xs font-semibold">
          <Coins className="w-3.5 h-3.5" />
          <span>India Tax Architecture &amp; VDA Compliance</span>
        </div>
        <h2 id="india-tax-heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B0B0F]">
          Indian Freelancer Tax Guide: Two-Moment Taxation Explained
        </h2>
        <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
          Earning crypto on Polygon (USDC or POL) involves two distinct statutory events in Indian tax law: <span className="font-semibold text-[#0B0B0F]">Receipt of Professional Income</span> and <span className="font-semibold text-[#0B0B0F]">Subsequent Transfer of Virtual Digital Assets (VDA)</span>.
        </p>
      </div>

      {/* Two-Moment Visual Timeline */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Moment 1 Card */}
        <div className="bg-white border-2 border-blue-100 rounded-2xl p-6 relative overflow-hidden shadow-sm hover:border-blue-300 transition-colors">
          <div className="absolute top-0 right-0 bg-[#0047AB] text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            Moment 1
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0047AB] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#0B0B0F]">On-Chain Milestone Receipt</h3>
              <p className="text-xs text-[#6B7280]">Date funds unlock in your wallet</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-[#374151]">
            <p className="leading-relaxed">
              When milestone funds release from the PolyLance escrow contract to your Polygon address, the INR fair market value (FMV) on that date is recognized as <strong className="text-[#0B0B0F]">Professional / Business Income</strong>.
            </p>
            <ul className="space-y-2 pt-2 text-xs border-t border-gray-100">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Individual Slab Rates:</strong> Taxed according to your progressive tax bracket (0% to 30% plus 4% cess).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Section 44ADA Benefit:</strong> Eligible professionals (software developers, designers, writers, consultants) with gross receipts up to ₹75 Lakhs can declare a presumptive net income of 50%, paying tax only on that half.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Cost Basis Established:</strong> The INR FMV on this receipt date establishes your acquisition cost basis for future capital gains.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Moment 2 Card */}
        <div className="bg-white border-2 border-purple-100 rounded-2xl p-6 relative overflow-hidden shadow-sm hover:border-purple-300 transition-colors">
          <div className="absolute top-0 right-0 bg-[#7C3AED] text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            Moment 2
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#0B0B0F]">Subsequent Token Sale or Swap</h3>
              <p className="text-xs text-[#6B7280]">Date you convert to INR, fiat, or another token</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-[#374151]">
            <p className="leading-relaxed">
              When you subsequently liquidate your tokens on an exchange or swap them, Section 115BBH applies <strong className="text-[#0B0B0F]">strictly to the incremental capital gain</strong>.
            </p>
            <ul className="space-y-2 pt-2 text-xs border-t border-gray-100">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span><strong>Section 115BBH (Flat 30% + 4% Cess):</strong> Applies solely to (Sale Price – Receipt FMV). No indexation or deductions allowed.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span><strong>No Gain, No VDA Tax:</strong> If you sell USDC at the exact price received (e.g. ₹85 in, ₹85 out), your capital gain is ₹0 and no Section 115BBH tax is payable.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span><strong>Section 194S (1% TDS):</strong> Indian exchanges deduct 1% TDS on the transfer value. This TDS is <em>not</em> an additional tax; it is fully creditable against your annual tax return (ITR) via Form 26AS/AIS.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive Tax Estimator Calculator */}
      <div className="mt-10 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E5E7EB] gap-3">
          <div>
            <h3 className="text-xl font-bold text-[#0B0B0F] flex items-center gap-2">
              <Percent className="w-5 h-5 text-[#0047AB]" />
              <span>Interactive Web3 Freelancer Tax Estimator</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
              Simulate your Moment 1 professional income tax and Moment 2 VDA capital gains split.
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setToken('USDC');
                setReceiptInrRate(85);
                setSaleInrRate(89);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                token === 'USDC'
                  ? 'bg-[#0047AB] text-white shadow-sm'
                  : 'text-[#4B5563] hover:text-[#0B0B0F]'
              }`}
            >
              USDC (Stable)
            </button>
            <button
              type="button"
              onClick={() => {
                setToken('POL');
                setReceiptInrRate(35);
                setSaleInrRate(42);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                token === 'POL'
                  ? 'bg-[#0047AB] text-white shadow-sm'
                  : 'text-[#4B5563] hover:text-[#0B0B0F]'
              }`}
            >
              POL (Token)
            </button>
          </div>
        </div>

        {/* Calculator Form & Output Grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs Column */}
          <div className="lg:col-span-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={tokenAmountId} className="block text-xs font-bold text-[#374151] mb-1.5">
                  Milestone Payout ({token})
                </label>
                <div className="relative">
                  <input
                    id={tokenAmountId}
                    type="number"
                    min="1"
                    step="50"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] bg-white text-[#0B0B0F]"
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-gray-400">
                    {token}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor={receiptRateId} className="block text-xs font-bold text-[#374151] mb-1.5">
                  INR Rate at Receipt (FMV)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-gray-500">₹</span>
                  <input
                    id={receiptRateId}
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={receiptInrRate}
                    onChange={(e) => setReceiptInrRate(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-7 pr-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] bg-white text-[#0B0B0F]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={saleRateId} className="block text-xs font-bold text-[#374151] mb-1.5">
                  Subsequent Sale Price (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-gray-500">₹</span>
                  <input
                    id={saleRateId}
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={saleInrRate}
                    onChange={(e) => setSaleInrRate(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-7 pr-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] bg-white text-[#0B0B0F]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={taxSlabId} className="block text-xs font-bold text-[#374151] mb-1.5">
                  Income Tax Slab (New Regime)
                </label>
                <select
                  id={taxSlabId}
                  value={taxSlab}
                  onChange={(e) => setTaxSlab(Number(e.target.value))}
                  aria-label="Income Tax Slab (New Regime)"
                  className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] bg-white text-[#0B0B0F]"
                >
                  <option value={0}>0% (Up to ₹3 Lakhs)</option>
                  <option value={0.05}>5% (₹3L - ₹7L)</option>
                  <option value={0.10}>10% (₹7L - ₹10L)</option>
                  <option value={0.15}>15% (₹10L - ₹12L)</option>
                  <option value={0.20}>20% (₹12L - ₹15L)</option>
                  <option value={0.30}>30% (Above ₹15 Lakhs)</option>
                </select>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={use44ADA}
                  onChange={(e) => setUse44ADA(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#0047AB] focus:ring-[#0047AB]"
                />
                <span className="text-xs text-[#374151] leading-relaxed">
                  <strong>Apply Section 44ADA Presumptive Scheme:</strong> Treat 50% of gross receipts as taxable profit (applicable for technical and creative freelance services).
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyTds}
                  onChange={(e) => setApplyTds(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#0047AB] focus:ring-[#0047AB]"
                />
                <span className="text-xs text-[#374151] leading-relaxed">
                  <strong>Factor 1% TDS under Sec 194S:</strong> Account for the 1% TDS withheld upon CEX fiat sale as a credit against final liability.
                </span>
              </label>
            </div>
          </div>

          {/* Results Summary Column */}
          <div className="lg:col-span-6 bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Calculated Breakdown
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-emerald-50 text-emerald-700">
                Effective Tax: {results.effectiveTaxRate.toFixed(1)}%
              </span>
            </div>

            {/* Moment 1 Results */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#4B5563]">
                <span>Moment 1 Gross Professional Income:</span>
                <span className="font-mono tabular-nums font-semibold text-[#0B0B0F]">
                  ₹{results.grossReceiptInr.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span>Taxable Income ({use44ADA ? '50% under Sec 44ADA' : '100%'}):</span>
                <span className="font-mono tabular-nums text-[#0B0B0F]">
                  ₹{results.taxableProfessionalIncome.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between font-medium text-[#0047AB]">
                <span>Moment 1 Income Tax ({((taxSlab * 1.04) * 100).toFixed(1)}% incl. cess):</span>
                <span className="font-mono tabular-nums font-bold">
                  ₹{Math.round(results.moment1Tax).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200 my-2" />

            {/* Moment 2 Results */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#4B5563]">
                <span>Moment 2 Sale Value:</span>
                <span className="font-mono tabular-nums font-semibold text-[#0B0B0F]">
                  ₹{results.saleValueInr.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span>Net VDA Capital Gain (Appreciation):</span>
                <span className="font-mono tabular-nums text-[#0B0B0F]">
                  ₹{results.capitalGainInr.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between font-medium text-purple-700">
                <span>Moment 2 Tax (Sec 115BBH flat 31.2%):</span>
                <span className="font-mono tabular-nums font-bold">
                  ₹{Math.round(results.moment2Tax).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {applyTds && (
              <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between text-xs text-emerald-700 font-medium">
                <span>1% TDS Withheld on Sale (Sec 194S Credit):</span>
                <span className="font-mono tabular-nums">
                  - ₹{Math.round(results.tdsWithheldInr).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* Total Net Due */}
            <div className="pt-3 border-t-2 border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#0B0B0F] block">
                  Net Estimated Tax Payable
                </span>
                <span className="text-[11px] text-[#6B7280]">
                  Combined Moment 1 + Moment 2 (net of TDS credit)
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold font-mono tabular-nums text-[#0047AB]">
                  ₹{Math.round(results.netTaxPayable).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Myth vs. Fact Accordion Block */}
      <div className="mt-12 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-bold text-[#0B0B0F]">
            Indian Web3 Freelancer Myths vs. Statutory Facts
          </h3>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Common misconceptions regarding crypto invoicing, TDS, and digital asset taxation in India.
          </p>
        </div>

        <div className="space-y-3">
          {myths.map((item) => {
            const isExpanded = expandedMyth === item.id;
            return (
              <div
                key={item.id}
                className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden transition-all shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setExpandedMyth(isExpanded ? null : item.id)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <XCircle className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-semibold text-[#0B0B0F]">
                      <span className="text-red-600 font-bold mr-1.5">Myth:</span>
                      {item.myth}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-100 bg-blue-50/30 text-xs sm:text-sm text-[#374151] space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider pt-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Statutory Fact ({item.badge})</span>
                    </div>
                    <p className="leading-relaxed pl-6 text-[#1F2937]">
                      {item.fact}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimers & Official References */}
      <div className="mt-10 p-5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-[#6B7280] space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-semibold text-[#374151]">
            Statutory References &amp; Review Notice
          </span>
          <span className="text-[11px] text-[#9CA3AF]">
            Income-tax Act, 1961 (Sec 28, 44ADA, 115BBH, 194S)
          </span>
        </div>
        <p className="leading-relaxed">
          <strong>Last reviewed: November 2026.</strong> Based on Income-tax Act, 1961 provisions (including Sec 115BBH &amp; 194S) and anticipated 2025/2026 enactment updates. Confirm with current law at{' '}
          <a
            href="https://incometaxindia.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0047AB] font-semibold hover:underline inline-flex items-center gap-0.5"
          >
            <span>incometaxindia.gov.in</span>
            <ExternalLink className="w-3 h-3" />
          </a>.
        </p>
        <p className="leading-relaxed text-[#4B5563] border-t border-gray-200 pt-2 font-medium">
          <strong>Platform Disclaimer:</strong> PolyLance does not deduct, withhold, or file tax on behalf of any user. Users are solely responsible for local statutory compliance, accurate bookkeeping of receipt dates and INR fair market values, and timely submission of advance tax and annual ITR filings.
        </p>
      </div>
    </section>
  );
};
