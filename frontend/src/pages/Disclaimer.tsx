import React from 'react';
import { motion } from 'motion/react';
import { 
  Scale, AlertTriangle, ShieldCheck, Sparkles, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';

export const Disclaimer: React.FC = () => {
  return (
    <PageContainer className="py-8 space-y-10 text-[#0B0B0F]">
      {/* Clean Modern Header with 720px column */}
      <div className="max-w-[720px] mx-auto text-left space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F6F7F9] border border-[#E5E7EB] text-[#374151] rounded-full text-xs font-medium">
          <Sparkles size={13} className="text-[#0047AB]" />
          <span>Legal notice & risk disclosure</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B0B0F] tracking-tight leading-tight">
          Protocol Disclaimer & <span className="text-[#0047AB]">Risk Notice</span>
        </h1>

        <p className="text-sm text-[#4B5563] leading-relaxed font-normal">
          PolyLance is an open-source, non-custodial decentralized protocol deployed on the Polygon blockchain. Please review the operational risks associated with Web3 smart contract interactions.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#6B7280]">
          <span className="bg-[#F6F7F9] text-[#374151] px-3 py-1 rounded-lg border border-[#E5E7EB] font-medium flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-[#0047AB]" /> Non-custodial protocol
          </span>
          <span className="bg-[#F6F7F9] text-[#374151] px-3 py-1 rounded-lg border border-[#E5E7EB] font-medium">
            Autonomous code execution
          </span>
        </div>
      </div>

      {/* Disclaimers Cards (720px reading column) */}
      <div className="max-w-[720px] mx-auto space-y-4 text-left">
        {/* 1. Autonomous Smart Contracts */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-3 transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] text-[#0047AB] flex items-center justify-center shrink-0">
            <Scale size={20} />
          </div>
          <h3 className="text-lg font-bold text-[#0B0B0F]">
            1. Autonomous code execution notice
          </h3>
          <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed font-normal">
            Smart contracts execute deterministically according to their deployed bytecode. Once funds are deposited into an escrow contract, disbursements occur exclusively via cryptographic authorization or decentralized arbitration.
          </p>
        </motion.div>

        {/* 2. Mainnet Tokens */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-3 transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] text-[#0047AB] flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <h3 className="text-lg font-bold text-[#0B0B0F]">
            2. Network and token transactions
          </h3>
          <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed font-normal">
            Transactions on the Polygon network interact with cryptographic assets. Users must carefully verify all transaction signatures, gas parameters, and recipient addresses in their wallet before signing.
          </p>
        </motion.div>

        {/* 3. No Earnings Guarantee */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-3 transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] text-[#0047AB] flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <h3 className="text-lg font-bold text-[#0B0B0F]">
            3. No financial advice or income guarantee
          </h3>
          <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed font-normal">
            PolyLance provides decentralized infrastructure for peer-to-peer contracting. We do not guarantee freelance employment, client funding, or financial returns.
          </p>
        </motion.div>

        {/* 4. Tax & Jurisdiction Compliance */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-3 transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] text-[#0047AB] flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <h3 className="text-lg font-bold text-[#0B0B0F]">
            4. Local tax & compliance responsibility
          </h3>
          <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed font-normal">
            Users are solely responsible for complying with local tax laws, reporting income received via digital wallets, and abiding by jurisdiction-specific labor regulations.
          </p>
        </motion.div>
      </div>

      {/* CTA section */}
      <div className="max-w-[720px] mx-auto bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xs">
        <h3 className="text-lg font-bold text-[#0B0B0F]">Have questions about protocol rules?</h3>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link to="/terms" className="px-5 py-2.5 bg-[#0047AB] hover:bg-[#003B8E] text-white rounded-xl font-semibold text-xs transition-colors">
            Read smart escrow terms
          </Link>
          <Link to="/jobs" className="px-5 py-2.5 bg-[#F6F7F9] hover:bg-[#E5E7EB] text-[#374151] rounded-xl font-semibold text-xs border border-[#E5E7EB] transition-colors">
            Browse marketplace →
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};

export default Disclaimer;
