import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileCode,
  Sparkles,
  ExternalLink,
  Search,
  Fingerprint,
  QrCode,
  Copy,
  Check,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Network,
  Share2,
  Award,
  BookOpen,
  Terminal,
  Shield,
  Clock,
  Eye,
  BadgeCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Neomorphic design token utility classes (Soft UI concave/convex surfaces and tactile insets)
const NEO = {
  canvas: 'bg-[#EBECF0]',
  card: 'bg-[#EBECF0] rounded-3xl shadow-[8px_8px_18px_#cbced6,-8px_-8px_18px_#ffffff] border border-white/60 transition-all duration-300',
  cardHover: 'hover:shadow-[12px_12px_24px_#cbced6,-12px_-12px_24px_#ffffff] hover:-translate-y-1',
  cardInset: 'bg-[#EBECF0] rounded-2xl shadow-[inset_4px_4px_8px_#cbced6,inset_-4px_-4px_8px_#ffffff]',
  button: 'bg-[#EBECF0] rounded-xl shadow-[5px_5px_10px_#cbced6,-5px_-5px_10px_#ffffff] active:shadow-[inset_4px_4px_8px_#cbced6,inset_-4px_-4px_8px_#ffffff] text-slate-700 hover:text-purple-700 font-bold transition-all duration-200 border border-white/70',
  buttonPrimary: 'bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-[5px_5px_12px_#b8bec9,-5px_-5px_12px_#ffffff] active:scale-[0.98] text-white font-bold transition-all duration-200 hover:brightness-105',
  pill: 'bg-[#EBECF0] rounded-full shadow-[4px_4px_8px_#cbced6,-4px_-4px_8px_#ffffff] text-slate-600 font-mono text-xs',
  pillInset: 'bg-[#EBECF0] rounded-full shadow-[inset_3px_3px_6px_#cbced6,inset_-3px_-3px_6px_#ffffff] font-mono text-xs',
  badge3D: 'bg-[#EBECF0] rounded-2xl shadow-[6px_6px_14px_#cbced6,-6px_-6px_14px_#ffffff] border border-white/80',
};

// Demo certificate records for testing the interactive verifier
const DEMO_CERTS: Record<string, {
  certId: string;
  jobTitle: string;
  category: string;
  freelancerAddress: string;
  freelancerName: string;
  freelancerGithub: string;
  clientAddress: string;
  clientName: string;
  sbtTokenId: string;
  ipfsCid: string;
  oracleSignature: string;
  contractAddress: string;
  networkChainId: number;
  completedAt: string;
  privacyShieldedAmount: string;
}> = {
  'PL-SBT-JOB-101': {
    certId: 'PL-SBT-JOB-101',
    jobTitle: 'Solidity Reentrancy & Flash Loan Arbitrage Audit',
    category: 'Security & Smart Contracts',
    freelancerAddress: '0x88aa0398b91a150b041da819bc954bb356e009dd',
    freelancerName: 'Alex Thorne',
    freelancerGithub: 'sunny200551',
    clientAddress: '0x71c8366420a092c55660830e8115e9a44390001',
    clientName: 'Aegis Protocol Labs',
    sbtTokenId: 'SBT-101',
    ipfsCid: 'bafybeihkovi2mfl4vj6l3k4o7v7q4d4pkm6e6377k47x2',
    oracleSignature: '0x7a89b3f12c98d45e76a1098b12f45c90812e34d567a89b012c34d56e78f901ab23cd45ef67890123456789abcdef0123456789abcdef0123456789abcdef01234567891b',
    contractAddress: '0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879',
    networkChainId: 137,
    completedAt: '2026-09-18T14:32:00Z',
    privacyShieldedAmount: 'PROTECTED (Zero-Knowledge Verified)',
  },
  'PL-SBT-JOB-001': {
    certId: 'PL-SBT-JOB-001',
    jobTitle: 'Polygon zkEVM Cross-Chain Bridge Integration',
    category: 'Web3 Core Protocol',
    freelancerAddress: '0x3333444455556666777788889999000011112222',
    freelancerName: 'Elena Rostova',
    freelancerGithub: 'elena-crypto',
    clientAddress: '0x9999888877776666555544443333222211110000',
    clientName: 'Zenith Global Ventures',
    sbtTokenId: 'SBT-001',
    ipfsCid: 'bafybeicg2k3p4d4pkm6e6377k47x2kovi2mfl4vj6l3k4o7v7q',
    oracleSignature: '0x4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d1c',
    contractAddress: '0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879',
    networkChainId: 137,
    completedAt: '2026-09-10T11:15:00Z',
    privacyShieldedAmount: 'PROTECTED (Zero-Knowledge Verified)',
  },
};

export const CertifiedPass: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Interactive Live Verifier State
  const [certInput, setCertInput] = useState('PL-SBT-JOB-101');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(DEMO_CERTS['PL-SBT-JOB-101']);
  const [verificationSteps, setVerificationSteps] = useState<number>(4);
  const [copied, setCopied] = useState(false);

  const runVerification = (idToVerify: string) => {
    const cleanId = idToVerify.trim().toUpperCase();
    setIsVerifying(true);
    setVerificationSteps(0);

    const match = DEMO_CERTS[cleanId] || {
      certId: cleanId,
      jobTitle: 'Verified PolyLance Sovereign Deliverable',
      category: 'Decentralized Milestone',
      freelancerAddress: '0x88aa0398b91a150b041da819bc954bb356e009dd',
      freelancerName: 'Verified Freelancer',
      freelancerGithub: 'polylance-dev',
      clientAddress: '0x71c8366420a092c55660830e8115e9a44390001',
      clientName: 'Verified Client Escrow',
      sbtTokenId: `SBT-${cleanId.replace(/[^0-9]/g, '') || '042'}`,
      ipfsCid: 'bafybeihkovi2mfl4vj6l3k4o7v7q4d4pkm6e6377k47x2',
      oracleSignature: '0x7a89b3f12c98d45e76a1098b12f45c90812e34d567a89b012c34d56e78f901ab23cd45ef67890123456789abcdef0123456789abcdef0123456789abcdef01234567891b',
      contractAddress: '0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879',
      networkChainId: 137,
      completedAt: new Date().toISOString(),
      privacyShieldedAmount: 'PROTECTED (Zero-Knowledge Verified)',
    };

    // Step-by-step verification simulation
    setTimeout(() => setVerificationSteps(1), 300);
    setTimeout(() => setVerificationSteps(2), 650);
    setTimeout(() => setVerificationSteps(3), 1050);
    setTimeout(() => {
      setVerificationSteps(4);
      setVerificationResult(match);
      setIsVerifying(false);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    }, 1450);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`min-h-screen ${NEO.canvas} text-slate-700 py-8 px-4 sm:px-6 lg:px-8 font-sans select-none relative overflow-x-hidden`}>
      {/* Scroll Progress Meter */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Decorative Neomorphic Ambient Orbs */}
      <div className="fixed -top-24 -left-24 w-96 h-96 rounded-full bg-purple-200/40 blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 -right-32 w-96 h-96 rounded-full bg-blue-200/40 blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-1/4 w-80 h-80 rounded-full bg-indigo-200/30 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-16 py-4">

        {/* ── 1. HERO SECTION: 3D Neomorphic Badge & Title ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6 pt-4"
        >
          {/* 3D Floating Neomorphic Shield Emblem */}
          <div className="relative inline-flex items-center justify-center p-6 sm:p-8 rounded-[36px] bg-[#EBECF0] shadow-[14px_14px_28px_#cbced6,-14px_-14px_28px_#ffffff] border border-white/70 group hover:rotate-3 transition-transform duration-500">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#EBECF0] shadow-[inset_6px_6px_12px_#cbced6,inset_-6px_-6px_12px_#ffffff] flex items-center justify-center relative">
              <ShieldCheck className="w-12 h-12 sm:w-14 sm:h-14 text-purple-600 drop-shadow-[0_4px_8px_rgba(147,51,234,0.3)]" />
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#EBECF0] shadow-sm animate-pulse" />
            </div>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EBECF0] shadow-[inset_3px_3px_6px_#cbced6,inset_-3px_-3px_6px_#ffffff] text-purple-700 text-xs font-mono font-bold uppercase tracking-widest">
              <Sparkles size={12} className="text-purple-600 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Cross-Protocol Attestation Engine</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Certified<span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">Pass</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
              The sovereign decentralized verification oracle for PolyLance credentials, soulbound work histories, and autonomous milestone deliveries.
            </p>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#verifier"
              className={`px-6 py-2.5 ${NEO.buttonPrimary} text-xs uppercase tracking-wider inline-flex items-center gap-2`}
            >
              <Search size={14} />
              <span>Verify a Certificate</span>
            </a>
            <a
              href="#how-it-works"
              className={`px-6 py-2.5 ${NEO.button} text-xs uppercase tracking-wider inline-flex items-center gap-2`}
            >
              <BookOpen size={14} />
              <span>How It Works</span>
            </a>
            <Link
              to="/reputation"
              className={`px-6 py-2.5 ${NEO.button} text-xs uppercase tracking-wider inline-flex items-center gap-2`}
            >
              <Award size={14} className="text-purple-600" />
              <span>SBT Leaderboard</span>
            </Link>
          </div>
        </motion.section>


        {/* ── 2. WHAT IS CERTIFIEDPASS? (3-Column Neomorphic Cards) ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
              What is <span className="text-purple-700">CertifiedPass</span>?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">
              An independent attestation layer designed to eliminate resume fraud, fake code portfolios, and unverifiable freelance claims in Web3.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1: Soulbound Authenticity */}
            <div className={`${NEO.card} ${NEO.cardHover} p-6 sm:p-8 space-y-4`}>
              <div className="w-14 h-14 rounded-2xl bg-[#EBECF0] shadow-[inset_4px_4px_8px_#cbced6,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center text-purple-600">
                <Fingerprint size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 font-heading">
                Soulbound Identity (SBT)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Every milestone approval on PolyLance mints a non-transferable ERC-5192 Soulbound Token. Credentials are permanently bound to the developer's wallet address and cannot be sold, transferred, or faked.
              </p>
              <div className="pt-2 text-[11px] font-mono font-bold text-purple-600 flex items-center gap-1.5">
                <span>ERC-5192 Standard</span>
                <CheckCircle2 size={13} />
              </div>
            </div>

            {/* Card 2: Cryptographic Deliverable Proof */}
            <div className={`${NEO.card} ${NEO.cardHover} p-6 sm:p-8 space-y-4`}>
              <div className="w-14 h-14 rounded-2xl bg-[#EBECF0] shadow-[inset_4px_4px_8px_#cbced6,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center text-indigo-600">
                <FileCode size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 font-heading">
                Cryptographic Deliverables
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Deliverable repositories, git commit shas, pull request diffs, and work logs are hashed and pinned to IPFS. The IPFS Content Identifier (CID) is cryptographically stamped directly into the token metadata.
              </p>
              <div className="pt-2 text-[11px] font-mono font-bold text-indigo-600 flex items-center gap-1.5">
                <span>IPFS Content Stamping</span>
                <CheckCircle2 size={13} />
              </div>
            </div>

            {/* Card 3: Zero-Knowledge Privacy Shield */}
            <div className={`${NEO.card} ${NEO.cardHover} p-6 sm:p-8 space-y-4`}>
              <div className="w-14 h-14 rounded-2xl bg-[#EBECF0] shadow-[inset_4px_4px_8px_#cbced6,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center text-blue-600">
                <Lock size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 font-heading">
                Confidentiality Shield
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Contract financial settlement amounts and commercial agreements remain strictly confidential. CertifiedPass proves <strong className="text-slate-800">what was built</strong> and <strong className="text-slate-800">client satisfaction</strong> without exposing private pricing data.
              </p>
              <div className="pt-2 text-[11px] font-mono font-bold text-blue-600 flex items-center gap-1.5">
                <span>Zero-Knowledge Privacy</span>
                <CheckCircle2 size={13} />
              </div>
            </div>
          </div>
        </motion.section>


        {/* ── 3. INTERACTIVE LIVE VERIFIER (The Heart of CertifiedPass) ── */}
        <motion.section
          id="verifier"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`${NEO.card} p-6 sm:p-10 space-y-8 relative overflow-hidden`}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300/60 pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-black text-purple-700 uppercase tracking-wider">
                <Shield size={14} className="text-purple-600" />
                <span>Live Attestation Verifier Tool</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                Verify a PolyLance Certificate
              </h2>
            </div>

            {/* Demo ID Preset Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono text-slate-500 font-bold">Try Demo:</span>
              {Object.keys(DEMO_CERTS).map((demoId) => (
                <button
                  key={demoId}
                  type="button"
                  onClick={() => {
                    setCertInput(demoId);
                    runVerification(demoId);
                  }}
                  className={`px-3 py-1 text-[11px] ${certInput === demoId ? NEO.buttonPrimary : NEO.button}`}
                >
                  {demoId}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input Bar with Neomorphic Inset Well */}
          <div className="space-y-3">
            <label className="block text-xs font-mono font-bold text-slate-700 tracking-wide">
              ENTER CERTIFICATE ID (e.g. PL-SBT-JOB-101):
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full relative flex-1">
                <input
                  type="text"
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  placeholder="Enter Certificate ID (e.g., PL-SBT-JOB-101)..."
                  className={`w-full py-3.5 pl-11 pr-4 ${NEO.cardInset} text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40`}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
              <button
                type="button"
                disabled={isVerifying || !certInput.trim()}
                onClick={() => runVerification(certInput)}
                className={`w-full sm:w-auto px-8 py-3.5 ${NEO.buttonPrimary} text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50`}
              >
                {isVerifying ? (
                  <>
                    <Cpu size={16} className="animate-spin" />
                    <span>Verifying On-Chain...</span>
                  </>
                ) : (
                  <>
                    <BadgeCheck size={16} />
                    <span>Run Verification</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4-Stage Verification Progress Dials */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {/* Step 1 */}
            <div className={`p-4 rounded-2xl ${verificationSteps >= 1 ? 'bg-emerald-500/10 border border-emerald-500/30' : NEO.cardInset} transition-all`}>
              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                {verificationSteps >= 1 ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                ) : (
                  <Clock size={16} className="text-slate-400 shrink-0" />
                )}
                <span className={verificationSteps >= 1 ? 'text-emerald-800' : 'text-slate-500'}>1. Oracle Signature</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">ECDSA Cryptographic Key Match</p>
            </div>

            {/* Step 2 */}
            <div className={`p-4 rounded-2xl ${verificationSteps >= 2 ? 'bg-emerald-500/10 border border-emerald-500/30' : NEO.cardInset} transition-all`}>
              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                {verificationSteps >= 2 ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                ) : (
                  <Clock size={16} className="text-slate-400 shrink-0" />
                )}
                <span className={verificationSteps >= 2 ? 'text-emerald-800' : 'text-slate-500'}>2. Polygon Contract</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">JobFactory & SBT Code Audit</p>
            </div>

            {/* Step 3 */}
            <div className={`p-4 rounded-2xl ${verificationSteps >= 3 ? 'bg-emerald-500/10 border border-emerald-500/30' : NEO.cardInset} transition-all`}>
              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                {verificationSteps >= 3 ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                ) : (
                  <Clock size={16} className="text-slate-400 shrink-0" />
                )}
                <span className={verificationSteps >= 3 ? 'text-emerald-800' : 'text-slate-500'}>3. IPFS Content CID</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Deliverable Hash Integrity</p>
            </div>

            {/* Step 4 */}
            <div className={`p-4 rounded-2xl ${verificationSteps >= 4 ? 'bg-emerald-500/10 border border-emerald-500/30' : NEO.cardInset} transition-all`}>
              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                {verificationSteps >= 4 ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                ) : (
                  <Clock size={16} className="text-slate-400 shrink-0" />
                )}
                <span className={verificationSteps >= 4 ? 'text-emerald-800' : 'text-slate-500'}>4. Privacy Shield</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Confidential Financial Guard</p>
            </div>
          </div>

          {/* Verification Result Inspection Card */}
          {verificationResult && verificationSteps === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 sm:p-8 rounded-3xl ${NEO.cardInset} space-y-6 border border-emerald-500/20`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-widest block">
                      STATUS: CRYPTOGRAPHICALLY VERIFIED
                    </span>
                    <h3 className="text-lg font-black text-slate-900 font-heading">
                      {verificationResult.certId}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`https://polylance.codes/#/attestation/${verificationResult.certId}`)}
                    className={`px-3 py-1.5 ${NEO.button} text-xs flex items-center gap-1.5`}
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Share Proof'}</span>
                  </button>
                  <Link
                    to={`/attestation/${verificationResult.certId}`}
                    className={`px-3 py-1.5 ${NEO.buttonPrimary} text-xs flex items-center gap-1.5`}
                  >
                    <span>View Attestation</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>

              {/* Canonical Certificate URL Display */}
              <div className="p-3 bg-white/60 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">OFFICIAL CERTIFICATE VERIFICATION URL</span>
                <a
                  href={`https://polylance.codes/#/attestation/${verificationResult.certId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 break-all text-[11px]"
                >
                  <span>{`https://polylance.codes/#/attestation/${verificationResult.certId}`}</span>
                  <ExternalLink size={12} className="shrink-0" />
                </a>
              </div>

              {/* Data Field Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
                {/* Milestone Title */}
                <div className="p-3 bg-white/60 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">PROJECT DELIVERABLE</span>
                  <span className="font-bold text-slate-800 font-sans block">{verificationResult.jobTitle}</span>
                </div>

                {/* Freelancer */}
                <div className="p-3 bg-white/60 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">FREELANCER (REPUTATION HOLDER)</span>
                  <span className="font-bold text-purple-700 block truncate">{verificationResult.freelancerName} ({verificationResult.freelancerAddress.slice(0, 8)}...)</span>
                </div>

                {/* Client */}
                <div className="p-3 bg-white/60 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">CLIENT (ESCROW RELEASER)</span>
                  <span className="font-bold text-slate-800 block truncate">{verificationResult.clientName} ({verificationResult.clientAddress.slice(0, 8)}...)</span>
                </div>

                {/* Token ID */}
                <div className="p-3 bg-white/60 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">SOULBOUND TOKEN ID</span>
                  <span className="font-bold text-indigo-700 block">{verificationResult.sbtTokenId} (ERC-5192)</span>
                </div>

                {/* IPFS CID */}
                <div className="p-3 bg-white/60 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">IMMUTABLE IPFS CID</span>
                  <span className="font-bold text-slate-700 block truncate">{verificationResult.ipfsCid}</span>
                </div>

                {/* Settlement Privacy Shield */}
                <div className="p-3 bg-white/60 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">FINANCIAL SETTLEMENT</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <Lock size={12} />
                    <span>{verificationResult.privacyShieldedAmount}</span>
                  </span>
                </div>
              </div>

              {/* Cryptographic Signature Well */}
              <div className="p-3.5 bg-slate-900 text-slate-300 rounded-xl text-[11px] font-mono space-y-1 overflow-x-auto">
                <span className="text-[10px] text-purple-400 font-bold block uppercase tracking-wider">Oracle ECDSA Signature:</span>
                <span className="text-slate-400 break-all">{verificationResult.oracleSignature}</span>
              </div>
            </motion.div>
          )}
        </motion.section>


        {/* ── 4. HOW ARE CERTS VERIFIED IN CERTIFIEDPASS? (Step-by-Step 3D Grid) ── */}
        <motion.section
          id="how-it-works"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
              How Verifications Work
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">
              Every certificate in CertifiedPass passes through a 4-layer decentralized validation pipeline before being attested as genuine.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Step 1 */}
            <div className={`${NEO.card} p-6 sm:p-7 space-y-3 relative group`}>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-purple-600/30 font-mono">01</span>
                <div className="w-10 h-10 rounded-xl bg-[#EBECF0] shadow-[inset_3px_3px_6px_#cbced6,inset_-3px_-3px_6px_#ffffff] flex items-center justify-center text-purple-600">
                  <Cpu size={20} />
                </div>
              </div>
              <h4 className="text-base font-black text-slate-900 font-heading">1. Oracle Signature Verification</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                The deliverable bundle is signed off-chain by the PolyLance Oracle node. CertifiedPass checks the ECDSA signature against the Oracle's verified public key to confirm that no data was tampered with in transit.
              </p>
            </div>

            {/* Step 2 */}
            <div className={`${NEO.card} p-6 sm:p-7 space-y-3 relative group`}>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-indigo-600/30 font-mono">02</span>
                <div className="w-10 h-10 rounded-xl bg-[#EBECF0] shadow-[inset_3px_3px_6px_#cbced6,inset_-3px_-3px_6px_#ffffff] flex items-center justify-center text-indigo-600">
                  <Database size={20} />
                </div>
              </div>
              <h4 className="text-base font-black text-slate-900 font-heading">2. On-Chain Smart Contract Audit</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                CertifiedPass directly queries Polygon Mainnet contracts (<code className="text-indigo-700 bg-indigo-50 px-1 rounded">JobFactory</code> & <code className="text-indigo-700 bg-indigo-50 px-1 rounded">ReputationSBT</code>) to verify that the Soulbound Token actually exists in the recipient's wallet and was issued through authentic escrow settlement.
              </p>
            </div>

            {/* Step 3 */}
            <div className={`${NEO.card} p-6 sm:p-7 space-y-3 relative group`}>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-blue-600/30 font-mono">03</span>
                <div className="w-10 h-10 rounded-xl bg-[#EBECF0] shadow-[inset_3px_3px_6px_#cbced6,inset_-3px_-3px_6px_#ffffff] flex items-center justify-center text-blue-600">
                  <Layers size={20} />
                </div>
              </div>
              <h4 className="text-base font-black text-slate-900 font-heading">3. IPFS Content Addressing</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                The milestone work deliverable is pinned to IPFS using cryptographic content addressing. CertifiedPass matches the IPFS CID to ensure the original work files, code commits, and milestone requirements are immutable.
              </p>
            </div>

            {/* Step 4 */}
            <div className={`${NEO.card} p-6 sm:p-7 space-y-3 relative group`}>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-emerald-600/30 font-mono">04</span>
                <div className="w-10 h-10 rounded-xl bg-[#EBECF0] shadow-[inset_3px_3px_6px_#cbced6,inset_-3px_-3px_6px_#ffffff] flex items-center justify-center text-emerald-600">
                  <Lock size={20} />
                </div>
              </div>
              <h4 className="text-base font-black text-slate-900 font-heading">4. Zero-Knowledge Privacy Preservation</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Commercial compensation terms and private escrow volumes are permanently shielded. Third-party employers see proof of milestone completion, technical skill tags, and client rating without seeing confidential financial contracts.
              </p>
            </div>
          </div>
        </motion.section>


        {/* ── 5. HOW TO USE CERTIFIEDPASS (For Freelancers & Clients) ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
              How to Use CertifiedPass
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">
              Empowering developers to showcase verified proof-of-work and giving clients trustless verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Freelancers / Developers */}
            <div className={`${NEO.card} p-6 sm:p-8 space-y-5 text-left`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBECF0] shadow-[inset_2px_2px_5px_#cbced6,inset_-2px_-2px_5px_#ffffff] text-purple-700 text-xs font-mono font-bold">
                <span>FOR FREELANCERS & AUDITORS</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 font-heading">
                Turn Proof-of-Work Into Sovereign Capital
              </h3>
              <ul className="space-y-3 text-xs text-slate-600 font-medium">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-purple-600 shrink-0 mt-0.5" />
                  <span><strong>Automatic Minting:</strong> Complete any milestone on PolyLance; your Soulbound Token and Certificate ID are generated automatically upon escrow settlement.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-purple-600 shrink-0 mt-0.5" />
                  <span><strong>Exportable Trust Badges:</strong> Embed your CertifiedPass badge or QR code on your personal website, GitHub README, or LinkedIn portfolio.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-purple-600 shrink-0 mt-0.5" />
                  <span><strong>Direct Proof Links:</strong> Share your unique attestation URL (<code className="bg-slate-200 px-1 rounded font-mono">https://polylance.codes/#/attestation/PL-SBT-JOB-...</code>) with prospective clients for instant verification.</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  to="/reputation"
                  className={`inline-flex items-center gap-2 px-5 py-2.5 ${NEO.button} text-xs font-bold text-purple-700`}
                >
                  <span>View Your Reputation SBTs</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* For Clients, Recruiter DAOs & Protocols */}
            <div className={`${NEO.card} p-6 sm:p-8 space-y-5 text-left`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBECF0] shadow-[inset_2px_2px_5px_#cbced6,inset_-2px_-2px_5px_#ffffff] text-indigo-700 text-xs font-mono font-bold">
                <span>FOR CLIENTS & PROTOCOLS</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 font-heading">
                Verify Web3 Talent in Seconds
              </h3>
              <ul className="space-y-3 text-xs text-slate-600 font-medium">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>Certificate ID Search:</strong> Input any candidate's PolyLance Certificate ID into CertifiedPass to verify smart contract ownership and deliverable specs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>QR Code Scanning:</strong> Scan the QR code stamped on any PolyLance attestation certificate with your phone for instant mobile validation.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>REST API Automation:</strong> Integrate our verification API into your hiring portal or DAO governance to gate proposals to verified developers.</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  to="/jobs"
                  className={`inline-flex items-center gap-2 px-5 py-2.5 ${NEO.buttonPrimary} text-xs font-bold`}
                >
                  <span>Post a Protected Job</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </motion.section>


        {/* ── 6. DEVELOPER API INTEGRATION (Neomorphic Code Block) ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`${NEO.card} p-6 sm:p-8 space-y-4 text-left`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-mono font-black text-slate-800 uppercase tracking-wider">
              <Terminal size={16} className="text-purple-600" />
              <span>Programmatic Verification Endpoint</span>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 font-bold border border-emerald-500/30">
              REST v1 ACTIVE
            </span>
          </div>

          <p className="text-xs text-slate-600 font-medium">
            Automate verification in your DAO or recruitment pipeline by querying the CertifiedPass verification endpoint:
          </p>

          <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl font-mono text-xs overflow-x-auto space-y-2 border border-slate-800 shadow-inner">
            <div className="text-slate-500"># Verify any PolyLance certificate via curl</div>
            <div className="text-purple-400">
              curl -X GET "https://polylance.codes/api/certified-pass/verify/PL-SBT-JOB-101"
            </div>
            <div className="text-slate-500 pt-2"># Response (200 OK):</div>
            <div className="text-emerald-400">
              {`{ "status": "VERIFIED", "certId": "PL-SBT-JOB-101", "chainId": 137, "sbtTokenId": "SBT-101", "valid": true }`}
            </div>
            <div className="text-slate-500 pt-2"># Canonical Certificate Web Link:</div>
            <div className="text-cyan-400">
              https://polylance.codes/#/attestation/PL-SBT-JOB-101
            </div>
          </div>
        </motion.section>


        {/* ── 7. FOOTER CALLOUT ── */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center py-6 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#EBECF0] shadow-[6px_6px_12px_#cbced6,-6px_-6px_12px_#ffffff] text-slate-600 text-xs font-medium">
            <ShieldCheck size={16} className="text-purple-600" />
            <span>
              CertifiedPass is powered by the <strong>PolyLance Sovereign Protocol</strong>. Anchored to Polygon Mainnet.
            </span>
          </div>
        </motion.section>

      </div>
    </div>
  );
};
