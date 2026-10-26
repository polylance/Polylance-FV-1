import React, { useState } from 'react';
import { DollarSign, ShieldCheck } from 'lucide-react';
import { Seo } from '../components/seo/Seo';
import { FaqSection } from '../components/faq/FaqSection';
import { FeeBreakdown } from '../components/common/FeeBreakdown';
import { ResponsiveTable, ResponsiveTableColumn } from '../components/common/ResponsiveTable';
import { CLIENT_FEE_PERCENT, FREELANCER_FEE_PERCENT, TOTAL_PLATFORM_FEE_PERCENT } from '../utils/fees';

interface FeeRow {
  id: string;
  budget: string;
  clientFee: string;
  clientPays: string;
  freelancerFee: string;
  freelancerReceives: string;
  platformFee: string;
}

export const FeesPage: React.FC = () => {
  const [sampleBudget, setSampleBudget] = useState('100');

  const feeScheduleColumns: ResponsiveTableColumn<FeeRow>[] = [
    {
      key: 'budget',
      header: 'Job Budget',
      headerLabel: 'Job Budget',
      priority: 'high',
      render: (val) => <span className="font-bold text-slate-900 whitespace-nowrap">{val}</span>,
    },
    {
      key: 'clientFee',
      header: `Client Fee (+${CLIENT_FEE_PERCENT}%)`,
      headerLabel: `Client Fee (+${CLIENT_FEE_PERCENT}%)`,
      priority: 'low',
      render: (val) => <span className="text-slate-600 whitespace-nowrap">{val}</span>,
    },
    {
      key: 'clientPays',
      header: 'Total Client Pays',
      headerLabel: 'Total Client Pays',
      priority: 'high',
      highlight: true,
      render: (val) => <span className="font-bold text-[#0047AB] whitespace-nowrap">{val}</span>,
    },
    {
      key: 'freelancerFee',
      header: `Freelancer Fee (−${FREELANCER_FEE_PERCENT}%)`,
      headerLabel: `Freelancer Fee (−${FREELANCER_FEE_PERCENT}%)`,
      priority: 'low',
      render: (val) => <span className="text-slate-600 whitespace-nowrap">{val}</span>,
    },
    {
      key: 'freelancerReceives',
      header: 'Freelancer Receives',
      headerLabel: 'Freelancer Receives',
      priority: 'high',
      highlight: true,
      render: (val) => <span className="font-bold text-emerald-700 whitespace-nowrap">{val}</span>,
    },
    {
      key: 'platformFee',
      header: `Total PolyLance Fee (${TOTAL_PLATFORM_FEE_PERCENT}%)`,
      headerLabel: 'Total PolyLance Fee',
      priority: 'low',
      render: (val) => <span className="text-slate-700 whitespace-nowrap">{val}</span>,
    },
  ];

  const feeScheduleData: FeeRow[] = [
    {
      id: '1',
      budget: '10.00 USDC',
      clientFee: '+0.25 USDC',
      clientPays: '10.25 USDC',
      freelancerFee: '−0.25 USDC',
      freelancerReceives: '9.75 USDC',
      platformFee: '0.50 USDC',
    },
    {
      id: '2',
      budget: '100.00 USDC',
      clientFee: '+2.50 USDC',
      clientPays: '102.50 USDC',
      freelancerFee: '−2.50 USDC',
      freelancerReceives: '97.50 USDC',
      platformFee: '5.00 USDC',
    },
    {
      id: '3',
      budget: '1,000.00 USDC',
      clientFee: '+25.00 USDC',
      clientPays: '1,025.00 USDC',
      freelancerFee: '−25.00 USDC',
      freelancerReceives: '975.00 USDC',
      platformFee: '50.00 USDC',
    },
    {
      id: '4',
      budget: '9.00 POL',
      clientFee: '+0.225 POL',
      clientPays: '9.225 POL',
      freelancerFee: '−0.225 POL',
      freelancerReceives: '8.775 POL',
      platformFee: '0.450 POL',
    },
    {
      id: '5',
      budget: '100.00 POL',
      clientFee: '+2.500 POL',
      clientPays: '102.500 POL',
      freelancerFee: '−2.500 POL',
      freelancerReceives: '97.500 POL',
      platformFee: '5.000 POL',
    },
    {
      id: '6',
      budget: '1,000.00 POL',
      clientFee: '+25.000 POL',
      clientPays: '1,025.000 POL',
      freelancerFee: '−25.000 POL',
      freelancerReceives: '975.000 POL',
      platformFee: '50.000 POL',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B0B0C] flex flex-col">
      <Seo routeKey="/fees" />

      {/* Hero Header */}
      <header className="w-full bg-white border-b border-[#E2E6EC] py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7EEF9] text-[#0047AB] text-xs font-bold tracking-wide">
            <DollarSign size={14} />
            <span>TRANSPARENT PRICING</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B0B0C] tracking-tight">
            2.5% Platform Fee. Zero Hidden Dues.
          </h1>
          <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
            Simple, honest pricing built into verified Polygon smart contracts. No subscription tiers, no currency conversion spreads, and no wire transfer fees.
          </p>
        </div>
      </header>

      {/* Main Content (Aligned with 1540px Dashboard standard) */}
      <main className="flex-1 max-w-[1540px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
        {/* Interactive Calculator Section */}
        <section className="bg-white rounded-3xl border border-[#E2E6EC] p-6 sm:p-10 shadow-xs space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-[#0B0B0C]">Interactive Fee Calculator</h2>
            <p className="text-sm text-[#4B5563] mt-1">
              Enter any project budget to see the exact on-chain fee allocation for both client deposit and freelancer net payout.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label htmlFor="budget-input" className="text-sm font-semibold text-slate-700">
              Sample Project Budget (USDC / POL):
            </label>
            <div className="relative">
              <input
                id="budget-input"
                type="number"
                min="1"
                value={sampleBudget}
                onChange={(e) => setSampleBudget(e.target.value)}
                className="px-4 py-2 border border-[#CBD5E1] rounded-xl text-sm font-bold w-36 focus:ring-2 focus:ring-[#0047AB] outline-none"
              />
            </div>
          </div>

          {/* FeeBreakdown Component */}
          <div className="max-w-xl">
            <FeeBreakdown budget={sampleBudget || '0'} token="USDC" />
          </div>
        </section>

        {/* Factual Fee Schedule & Examples (ResponsiveTable) */}
        <section className="bg-white rounded-3xl border border-[#E2E6EC] p-6 sm:p-10 shadow-xs space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[#0B0B0F]">Transparent Fee Schedule &amp; Examples</h2>
            <p className="text-sm text-[#4B5563] mt-1">
              PolyLance charges a 2.5% service fee to each side (5% of the job budget in total). Below are exact calculations for standard job amounts.
            </p>
          </div>

          {/* Responsive Table with zero horizontal scroll and card transform below 560px */}
          <ResponsiveTable
            columns={feeScheduleColumns}
            data={feeScheduleData}
            caption="Fee Schedule & Examples"
            ariaLabel="Transparent PolyLance Fee Schedule Table"
          />

          <div className="p-4 rounded-2xl bg-[#F6F7F9] border border-[#E5E7EB] text-xs text-[#4B5563] space-y-2">
            <div className="font-semibold text-[#0B0B0F] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#0047AB]" />
              <span>Smart Contract Guarantee</span>
            </div>
            <p>
              Client fees are deposited at escrow funding; freelancer fees are deducted upon work approval when funds are released. In the event of a cancellation before work delivery, the full escrow principal is returned to the client.
            </p>
          </div>
        </section>

        {/* FAQs */}
        <FaqSection pageId="/fees" />
      </main>
    </div>
  );
};

export default FeesPage;
