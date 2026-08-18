import React from 'react';
import { motion } from 'motion/react';
import { 
  Scale, AlertTriangle, ShieldCheck, Sparkles, CheckCircle2, FileText, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Disclaimer: React.FC = () => {
  return (
    <div className="space-y-12 py-8 max-w-6xl mx-auto px-4 font-sans text-slate-900 select-none">
      
      {/* 3D Glassmorphic Header */}
      <section className="relative overflow-hidden rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-white/90 via-amber-50/40 to-slate-50 border border-amber-100/80 shadow-md text-left">
        <div className="hidden lg:block absolute -right-6 -top-6 w-36 h-36 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl rotate-12 opacity-15 blur-sm pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white border border-amber-200 text-amber-800 rounded-full shadow-3xs text-[11px] font-mono font-black uppercase tracking-wider">
            <Sparkles size={12} className="text-amber-600 animate-pulse" />
            <span>Legal Notice & Risk Disclosure</span>
          </div>

          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Protocol Disclaimer &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-orange-600 to-rose-600">
              Risk Notice
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed font-medium">
            PolyLance is an open-source, non-custodial decentralized protocol deployed on the Polygon blockchain. Please review the operational risks associated with Web3 smart contract interactions.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-slate-500">
            <span className="bg-amber-50 text-amber-800 px-3 py-1 rounded-lg border border-amber-200 font-bold flex items-center gap-1">
              <AlertTriangle size={13} /> Non-Custodial Protocol
            </span>
            <span className="bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 font-bold">
              Autonomous Code Execution
            </span>
          </div>
        </div>
      </section>

      {/* Disclaimers Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        
        {/* 1. Autonomous Smart Contracts */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3 hover:shadow-md transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0 shadow-3xs">
            <Scale size={20} />
          </div>
          <h3 className="font-headline font-bold text-lg text-slate-900">
            1. Autonomous Code Execution Notice
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Smart contracts execute deterministically according to their deployed bytecode. Once funds are deposited into an escrow contract, disbursements occur exclusively via cryptographic authorization or decentralized arbitration.
          </p>
        </motion.div>

        {/* 2. Experimental Testnet Tokens */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3 hover:shadow-md transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-700 border border-orange-100 flex items-center justify-center shrink-0 shadow-3xs">
            <AlertTriangle size={20} />
          </div>
          <h3 className="font-headline font-bold text-lg text-slate-900">
            2. Testnet Network & Token Notice
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Tokens deployed on Polygon Amoy (Chain ID 80002) are testnet assets with zero financial value. Users should verify transaction signatures in MetaMask or RainbowKit before signing.
          </p>
        </motion.div>

        {/* 3. No Earnings Guarantee */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3 hover:shadow-md transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center shrink-0 shadow-3xs">
            <FileText size={20} />
          </div>
          <h3 className="font-headline font-bold text-lg text-slate-900">
            3. No Financial Advice or Income Guarantee
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            PolyLance provides decentralized infrastructure for peer-to-peer contracting. We do not guarantee freelance employment, client funding, or financial returns.
          </p>
        </motion.div>

        {/* 4. Tax & Jurisdiction Compliance */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3 hover:shadow-md transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0 shadow-3xs">
            <ShieldCheck size={20} />
          </div>
          <h3 className="font-headline font-bold text-lg text-slate-900">
            4. Local Tax & Compliance Responsibility
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Users are solely responsible for complying with local tax laws, reporting income received via digital wallets, and abiding by jurisdiction-specific labor laws.
          </p>
        </motion.div>

      </section>

      {/* CTA section */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
        <h3 className="font-headline font-bold text-xl text-slate-900">Have questions about protocol rules?</h3>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link to="/terms" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-headline font-bold text-xs shadow-xs transition-colors">
            Read Smart Escrow Terms
          </Link>
          <Link to="/jobs" className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-headline font-bold text-xs border border-slate-300 transition-colors">
            Browse Marketplace →
          </Link>
        </div>
      </section>

    </div>
  );
};
