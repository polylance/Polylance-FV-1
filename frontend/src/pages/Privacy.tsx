import React from 'react';
import { motion } from 'motion/react';
import { 
  Lock, ShieldCheck, EyeOff, Key, Database, MessageSquare, Sparkles, CheckCircle2, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Privacy: React.FC = () => {
  return (
    <div className="space-y-12 py-8 max-w-6xl mx-auto px-4 font-sans text-slate-900 select-none">
      
      {/* 3D Glassmorphic Header */}
      <section className="relative overflow-hidden rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-white/90 via-blue-50/40 to-slate-50 border border-blue-100/80 shadow-md text-left">
        <div className="hidden lg:block absolute -right-4 -top-4 w-36 h-36 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl rotate-12 opacity-15 blur-sm pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-full shadow-3xs text-[11px] font-mono font-black uppercase tracking-wider">
            <Sparkles size={12} className="text-blue-600 animate-pulse" />
            <span>Decentralized Data Sovereignty</span>
          </div>

          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Privacy Policy &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500">
              Data Control
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed font-medium">
            PolyLance is designed ground-up for zero personal data collection. Your identity is defined strictly by your public wallet address and on-chain soulbound achievements.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-slate-500">
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100 font-bold">
              PII Collected: 0 Bytes
            </span>
            <span className="bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 font-bold">
              Chat Transport: XMTP Encrypted
            </span>
          </div>
        </div>
      </section>

      {/* 4 Pillars Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        
        {/* Pillar 1: Zero PII */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 hover:shadow-md transition-all duration-300 relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-3xs">
            <EyeOff size={22} />
          </div>
          <h3 className="font-headline font-bold text-xl text-slate-900">
            1. Zero Personal Data Collection (No PII)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            We do not request, process, or store real names, email addresses, phone numbers, passport documents, or credit card details.
          </p>
          <ul className="space-y-2 text-xs text-slate-500 font-mono">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-500" /> No signup forms or passwords
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-500" /> No tracking cookies or invasive ad pixels
            </li>
          </ul>
        </motion.div>

        {/* Pillar 2: On-Chain Public Keys */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 hover:shadow-md transition-all duration-300 relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-3xs">
            <Key size={22} />
          </div>
          <h3 className="font-headline font-bold text-xl text-slate-900">
            2. Public Key Anonymity & Ledger Transparency
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Your transactions, job postings, and Soulbound Tokens are publicly visible on the Polygon ledger under your wallet address.
          </p>
          <ul className="space-y-2 text-xs text-slate-500 font-mono">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-purple-500" /> Pseudonymous public key identity
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-purple-500" /> Verifiable on Polygonscan
            </li>
          </ul>
        </motion.div>

        {/* Pillar 3: XMTP Messaging */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 hover:shadow-md transition-all duration-300 relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center shrink-0 shadow-3xs">
            <MessageSquare size={22} />
          </div>
          <h3 className="font-headline font-bold text-xl text-slate-900">
            3. End-to-End Encrypted Communication
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Negotiations and project chats are encrypted end-to-end via XMTP. Only the wallet private keys of the project Client and Developer can decrypt message history.
          </p>
          <ul className="space-y-2 text-xs text-slate-500 font-mono">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-cyan-500" /> Decentralized P2P message storage
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-cyan-500" /> Cannot be read by protocol relayers
            </li>
          </ul>
        </motion.div>

        {/* Pillar 4: IPFS Hashes */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 hover:shadow-md transition-all duration-300 relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-3xs">
            <Database size={22} />
          </div>
          <h3 className="font-headline font-bold text-xl text-slate-900">
            4. Content Storage via Decentralized IPFS
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Job descriptions, milestone deliverables, and dispute claims are stored as content-addressed hashes (CIDs) pinned to IPFS networks.
          </p>
          <ul className="space-y-2 text-xs text-slate-500 font-mono">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-500" /> Immutable CID hashes
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-500" /> Decentralized Pinata & W3S storage
            </li>
          </ul>
        </motion.div>

      </section>

      {/* Interactive Privacy Health Guarantee */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-xl text-left space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <Shield size={28} className="text-blue-400" />
            <div>
              <h3 className="font-headline font-bold text-xl">Privacy Health Guarantee</h3>
              <p className="text-xs text-slate-400 font-mono">Self-sovereign cryptographic identity standard</p>
            </div>
          </div>
          <Link to="/terms" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold font-mono transition-colors self-start sm:self-auto">
            Read Escrow Terms →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50 space-y-1">
            <span className="text-slate-400 text-[10px] block font-bold">DATA RETENTION</span>
            <span className="text-emerald-400 font-bold text-sm block">0 Days (Non-Custodial)</span>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50 space-y-1">
            <span className="text-slate-400 text-[10px] block font-bold">THIRD PARTY SHARING</span>
            <span className="text-blue-400 font-bold text-sm block">Never (No Analytics)</span>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50 space-y-1">
            <span className="text-slate-400 text-[10px] block font-bold">USER CONTROL</span>
            <span className="text-purple-400 font-bold text-sm block">100% Private Key Owned</span>
          </div>
        </div>
      </section>

    </div>
  );
};
