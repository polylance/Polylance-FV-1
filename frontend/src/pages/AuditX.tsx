import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  FileCode,
  Terminal,
  Cpu,
  Layers,
  Network,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Database,
  Eye,
  Zap,
  Radio,
  Server,
  GitBranch,
  Shield,
  Key,
  Binary,
  Code2,
  Workflow,
  ArrowRight,
  Boxes,
  Compass,
  Check,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Neomorphic & Technical UI Tokens
const UI = {
  canvas: 'bg-[#F4F6F9]',
  card: 'bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300',
  cardNeo: 'bg-[#F4F6F9] rounded-2xl shadow-[6px_6px_14px_#d9dbe0,-6px_-6px_14px_#ffffff] border border-white/80 transition-all duration-300',
  cardDark: 'bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-xl',
  badge: 'px-2.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide inline-flex items-center gap-1.5',
};

export const AuditX: React.FC = () => {
  const [isLaunchingPortal, setIsLaunchingPortal] = useState(false);

  const handleLaunchPortal = () => {
    if (isLaunchingPortal) return;
    setIsLaunchingPortal(true);

    // Multi-color celebratory confetti burst
    confetti({
      particleCount: 75,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#10b981', '#14b8a6', '#6366f1', '#3b82f6', '#8b5cf6'],
    });

    // Smooth animated sequence before opening in a new tab
    setTimeout(() => {
      window.open('https://akhilmuvva.github.io/auditX/', '_blank', 'noopener,noreferrer');
      setIsLaunchingPortal(false);
    }, 700);
  };

  return (
    <div className={`min-h-screen ${UI.canvas} text-slate-800 selection:bg-emerald-500 selection:text-white font-sans pb-24`}>
      {/* ── TOP HEADER / BREADCRUMB ── */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-slate-200/70 py-3.5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="font-mono text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-1"
            >
              PolyLance
            </Link>
            <span className="text-slate-300 font-mono text-xs">/</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 font-mono text-xs font-black border border-emerald-500/20">
              <ShieldAlert size={13} className="text-emerald-600" />
              <span>AuditX Security</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLaunchPortal}
              disabled={isLaunchingPortal}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Globe size={12} className="text-slate-400" />
              <span>Launch App</span>
              <ExternalLink size={11} className="text-slate-400" />
            </button>
            <Link
              to="/certifiedpass"
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-purple-600 font-mono text-xs font-bold transition-colors inline-flex items-center gap-1"
            >
              <span>CertifiedPass</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-10 sm:pt-14 space-y-16">
        
        {/* ── HERO INTRODUCTION ── */}
        <section className="text-center space-y-5 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold tracking-wide shadow-2xs">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Web3 Security Infrastructure & Orchestration</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-headline leading-tight">
            AuditX: Web3 Security, <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent">
              Built for Verifiable Trust.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-3xl mx-auto">
            A comprehensive, full-stack Web3 + Web2 security toolkit engineered to automate smart-contract analysis, infrastructure vulnerability scanning, blockchain activity monitoring, and verifiable on-chain audit workflows.
          </p>

          {/* Action Row with Minimalist Launch Button */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleLaunchPortal}
              disabled={isLaunchingPortal}
              className={`px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all duration-200 cursor-pointer active:scale-95 inline-flex items-center gap-2 ${
                isLaunchingPortal
                  ? 'bg-slate-900 text-white animate-pulse border border-slate-800'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm border border-slate-800'
              }`}
            >
              {isLaunchingPortal ? (
                <>
                  <Sparkles size={14} className="animate-spin text-emerald-300" />
                  <span>Opening AuditX...</span>
                </>
              ) : (
                <>
                  <Globe size={14} className="text-slate-400" />
                  <span>Explore AuditX</span>
                  <ExternalLink size={13} className="text-slate-400" />
                </>
              )}
            </button>
          </div>

          {/* Quick Pillar Jump Indicators (Non-breaking visual pills) */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <span className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-mono font-bold shadow-2xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              1. What is AuditX?
            </span>
            <span className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-mono font-bold shadow-2xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              2. How It Works
            </span>
            <span className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-mono font-bold shadow-2xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              3. What It Is For
            </span>
          </div>
        </section>

        {/* Official AuditX Standalone Web App Showcase Banner */}
        <div className="max-w-3xl mx-auto p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row items-center justify-between gap-5 text-left transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
          <div className="space-y-1.5 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 font-mono text-[10px] font-extrabold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Web3 Security Suite • Live Deployment</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 font-headline">
              Explore AuditX
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Experience the official decentralized AuditX security toolkit with automated smart-contract auditing, SIEM monitoring, threat intelligence, and verifiable EAS audit proofs.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLaunchPortal}
            disabled={isLaunchingPortal}
            className={`shrink-0 w-full sm:w-auto px-6 py-3 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all duration-200 cursor-pointer active:scale-95 inline-flex items-center justify-center gap-2 ${
              isLaunchingPortal
                ? 'bg-slate-900 text-white animate-pulse border border-slate-800'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm border border-slate-800'
            }`}
          >
            {isLaunchingPortal ? (
              <>
                <Sparkles size={14} className="animate-spin text-emerald-300" />
                <span>Launching App...</span>
              </>
            ) : (
              <>
                <Globe size={15} className="text-slate-400" />
                <span>Explore AuditX</span>
                <ExternalLink size={13} className="text-slate-400" />
              </>
            )}
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            PILLAR 1: WHAT IS AUDITX?
        ══════════════════════════════════════════════════════════════ */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-mono text-sm font-black flex items-center justify-center shadow-sm">
              01
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600">Core Definition</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-headline">What is AuditX?</h2>
            </div>
          </div>

          <div className={`${UI.card} p-6 sm:p-8 space-y-6`}>
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-medium">
              <strong>AuditX</strong> is an advanced, full-stack Web3 + Web2 security toolkit designed to automate smart-contract analysis, infrastructure security scanning, blockchain activity monitoring, and verifiable audit workflows.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-2.5 text-left">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  <Cpu size={16} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm font-headline">Rust Security Orchestrator</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Built around a high-performance Rust core orchestrator that harmonizes static analysis, symbolic execution, and dependency scanners into a single unified pipeline.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-2.5 text-left">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                  <Layers size={16} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm font-headline">Multi-Engine Fusion</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Combines specialized engines including Slither, Mythril, custom Solidity AST analysis, Semgrep, Gitleaks, and dependency auditing alongside AI-assisted vulnerability analysis.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-2.5 text-left">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                  <Lock size={16} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm font-headline">Decentralized Trust Layer</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Employs IPFS for immutable report storage and the Ethereum Attestation Service (EAS) for on-chain verifiable audit records that cannot be forged or tampered with.
                </p>
              </div>
            </div>

            {/* Quick Summary Pill Strip */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-slate-200">Integrated Security Technologies:</span>
              </div>
              <div className="text-emerald-400 font-bold tracking-wide">
                Slither · Mythril · Custom AST · Semgrep · Gitleaks · Gemini 2.5 · IPFS · EAS
              </div>
            </div>
          </div>
        </section>


        {/* ══════════════════════════════════════════════════════════════
            PILLAR 2: HOW DOES AUDITX WORK?
        ══════════════════════════════════════════════════════════════ */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white font-mono text-sm font-black flex items-center justify-center shadow-sm">
              02
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-600">Technical Workflow</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-headline">How Does AuditX Work?</h2>
            </div>
          </div>

          {/* 1. Architecture Flow Pipeline */}
          <div className="space-y-4">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-500">
              The 5-Stage Security Pipeline
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div className={`${UI.card} p-4 space-y-2 text-left border-l-4 border-l-slate-400`}>
                <div className="text-[10px] font-mono font-black text-slate-400">STAGE 01</div>
                <h4 className="text-xs font-black text-slate-900 font-headline">Application Ingestion</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Ingests Solidity contracts, ASTs, surrounding Web2 codebases, and configs.
                </p>
              </div>

              <div className={`${UI.card} p-4 space-y-2 text-left border-l-4 border-l-emerald-500`}>
                <div className="text-[10px] font-mono font-black text-emerald-600">STAGE 02</div>
                <h4 className="text-xs font-black text-slate-900 font-headline">Rust Orchestrator</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Dispatches parallel jobs to isolated engine sandboxes with zero overhead.
                </p>
              </div>

              <div className={`${UI.card} p-4 space-y-2 text-left border-l-4 border-l-teal-500`}>
                <div className="text-[10px] font-mono font-black text-teal-600">STAGE 03</div>
                <h4 className="text-xs font-black text-slate-900 font-headline">Multi-Engine Scan</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Runs Slither, Mythril, AST analysis, Semgrep, Gitleaks, & dependency checks.
                </p>
              </div>

              <div className={`${UI.card} p-4 space-y-2 text-left border-l-4 border-l-indigo-500`}>
                <div className="text-[10px] font-mono font-black text-indigo-600">STAGE 04</div>
                <h4 className="text-xs font-black text-slate-900 font-headline">AI Fusion (Gemini 2.5)</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Synthesizes individual findings into multi-step attack chains and context.
                </p>
              </div>

              <div className={`${UI.card} p-4 space-y-2 text-left border-l-4 border-l-purple-500`}>
                <div className="text-[10px] font-mono font-black text-purple-600">STAGE 05</div>
                <h4 className="text-xs font-black text-slate-900 font-headline">Trust Layer (IPFS/EAS)</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Pins audit report to IPFS and mints immutable on-chain EAS attestation.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Dual Web3 & Web2 Analysis Capabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Smart Contract Security */}
            <div className={`${UI.card} p-6 space-y-4 text-left`}>
              <div className="flex items-center gap-2 text-emerald-700 font-mono text-xs font-bold uppercase tracking-wider">
                <FileCode size={16} />
                <span>Smart Contract Security Engine</span>
              </div>
              <h4 className="text-base font-black text-slate-900 font-headline">
                Solidity Deep AST & Symbolic Analysis
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                AuditX inspects smart contracts using multiple automated and custom techniques:
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Reentrancy Detection:</strong> State updates occurring after external calls (CEI pattern enforcement).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Oracle Price Manipulation:</strong> Flash loan spot reserve distortion and un-smoothed TWAP feeds.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Signature Replay & Nonces:</strong> Missing EIP-712 nonce validation or chain ID binding.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Weak Randomness & Timestamps:</strong> Exploitable block.timestamp and blockhash dependencies.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Contract Graph Inspection:</strong> Surya-style structural inheritance, call trees, and function visibility mappings.</span>
                </li>
              </ul>
            </div>

            {/* Web2 Infrastructure Security */}
            <div className={`${UI.card} p-6 space-y-4 text-left`}>
              <div className="flex items-center gap-2 text-indigo-700 font-mono text-xs font-bold uppercase tracking-wider">
                <Server size={16} />
                <span>Web2 Infrastructure Scanning</span>
              </div>
              <h4 className="text-base font-black text-slate-900 font-headline">
                Surrounding dApp & Environment Hygiene
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Because Web3 applications depend on Web2 infrastructure, AuditX analyzes the complete surrounding stack:
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span><strong>Hardcoded Credentials:</strong> Gitleaks integration prevents leaked private keys, API secrets, and seed phrases.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span><strong>Injection Risks:</strong> Semgrep rules detect SQL injection, command execution, and unsafe deserialization.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span><strong>Vulnerable Dependencies:</strong> Automated cargo-audit and npm-audit for known CVEs in upstream packages.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span><strong>Permissive CORS:</strong> Detects misconfigured headers exposing frontend wallets to unauthorized domains.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span><strong>Missing Rate Limiting:</strong> Identifies denial-of-service and relay exhaustion vectors.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 3. SIEM & Web3 Continuous Monitoring */}
          <div className={`${UI.card} p-6 sm:p-8 space-y-5 text-left border-t-4 border-t-emerald-600`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-emerald-700 font-mono text-xs font-bold uppercase tracking-wider">
                <Radio size={16} className="text-emerald-600 animate-pulse" />
                <span>SIEM & Web3 Monitoring Architecture</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                Continuous 24/7 Threat Sentinel
              </span>
            </div>

            <h4 className="text-lg font-black text-slate-900 font-headline">
              Beyond One-Time Auditing: Live Blockchain Event Triage
            </h4>

            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              AuditX extends beyond point-in-time code audits through its specialized Security Information and Event Management (SIEM) architecture. It actively tracks deployed contract addresses, classifies security-relevant events, detects anomalies, and triggers real-time alerts.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-slate-400 font-bold text-[10px]">MONITORING</div>
                <div className="font-black text-slate-800 mt-1">Wallet & Contract Addresses</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-slate-400 font-bold text-[10px]">CLASSIFICATION</div>
                <div className="font-black text-slate-800 mt-1">Blockchain Event Categorization</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-slate-400 font-bold text-[10px]">INTELLIGENCE</div>
                <div className="font-black text-slate-800 mt-1">Anomaly & Threat Detection</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-slate-400 font-bold text-[10px]">LIFECYCLE</div>
                <div className="font-black text-slate-800 mt-1">Alert Deduplication & Webhooks</div>
              </div>
            </div>
          </div>

          {/* 4. AI Security Analysis & Verifiable Trust */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${UI.card} p-6 space-y-3 text-left`}>
              <div className="flex items-center gap-2 text-purple-700 font-mono text-xs font-bold uppercase tracking-wider">
                <Sparkles size={16} />
                <span>AI Security Analysis (Gemini 2.5)</span>
              </div>
              <h4 className="text-sm font-black text-slate-900 font-headline">
                Intelligent Attack Chain Synthesis
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                AuditX includes an AI Fusion layer powered by <strong>Gemini 2.5</strong>. It aggregates raw outputs across Slither, Mythril, and AST rules to synthesize holistic, multi-step attack scenarios and explain non-obvious relational vulnerabilities.
              </p>
            </div>

            <div className={`${UI.card} p-6 space-y-3 text-left`}>
              <div className="flex items-center gap-2 text-teal-700 font-mono text-xs font-bold uppercase tracking-wider">
                <ShieldCheck size={16} />
                <span>Verifiable Audit Infrastructure</span>
              </div>
              <h4 className="text-sm font-black text-slate-900 font-headline">
                On-Chain Attestations & Badges
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Security records move beyond centralized PDF reports. Audit findings are cryptographically hashed, pinned to <strong>IPFS</strong>, and minted as on-chain attestations via the <strong>Ethereum Attestation Service (EAS)</strong> with embeddable repository badges.
              </p>
            </div>
          </div>

          {/* 5. Complete Technology Stack Matrix */}
          <div className={`${UI.card} p-6 space-y-4 text-left`}>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              AuditX Technology Stack
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Frontend</div>
                <div className="font-bold text-slate-800 mt-0.5">Next.js</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Core Engine</div>
                <div className="font-bold text-slate-800 mt-0.5">Rust & Alloy</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Web3 Analysis</div>
                <div className="font-bold text-slate-800 mt-0.5">Slither & Mythril</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Web2 Analysis</div>
                <div className="font-bold text-slate-800 mt-0.5">Semgrep & Gitleaks</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">AI Fusion</div>
                <div className="font-bold text-slate-800 mt-0.5">Gemini 2.5</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Trust Layer</div>
                <div className="font-bold text-slate-800 mt-0.5">IPFS & EAS</div>
              </div>
            </div>
          </div>
        </section>


        {/* ══════════════════════════════════════════════════════════════
            PILLAR 3: WHAT IS AUDITX FOR?
        ══════════════════════════════════════════════════════════════ */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-mono text-sm font-black flex items-center justify-center shadow-sm">
              03
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600">Purpose & Value</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-headline">What is AuditX For?</h2>
            </div>
          </div>

          <div className={`${UI.card} p-6 sm:p-8 space-y-6`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-left">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  <Shield size={16} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm font-headline">Vulnerability Prevention</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Prevents catastrophic exploit losses by catching reentrancy, flash loan oracle manipulation, credential leaks, and flawed state machines prior to production deployment.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-left">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                  <Activity size={16} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm font-headline">Live Runtime Sentinel</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Guards live protocols post-launch through real-time address tracking, anomaly detection, alert deduplication, and automated webhook incident notifications.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-left">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                  <ShieldCheck size={16} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm font-headline">Tamper-Proof Verification</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Provides users, auditors, and DAOs with verifiable cryptographic proof of security through on-chain EAS attestations and IPFS CID hashes.
                </p>
              </div>
            </div>

            {/* PolyLance + AuditX Synergy Card */}
            <div className="rounded-2xl p-6 bg-gradient-to-br from-slate-950 via-[#0B132B] to-slate-900 text-white border border-slate-800 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-wider">
                <Boxes size={13} />
                <span>PolyLance Ecosystem Synergy</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black font-headline text-white">
                How PolyLance & AuditX Work Together
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                PolyLance and AuditX serve complementary roles within the Web3 trust ecosystem:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="text-purple-400 font-mono text-xs font-bold uppercase tracking-wide">
                    PolyLance Focus
                  </div>
                  <div className="text-base font-bold text-white">Identity + Reputation + Work</div>
                  <p className="text-xs text-slate-400 font-medium">
                    Developer identity, reputation scores, GitHub verification, wallet identity, job escrow completion, and Soulbound work history.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wide">
                    AuditX Focus
                  </div>
                  <div className="text-base font-bold text-white">Security + Monitoring + Verification</div>
                  <p className="text-xs text-slate-400 font-medium">
                    Automated contract auditing, infrastructure vulnerability scanning, live on-chain threat monitoring, and verifiable EAS audit proofs.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <span className="text-slate-400">
                  Together they deliver end-to-end trust for the sovereign freelance and Web3 developer economy.
                </span>
                <Link
                  to="/certifiedpass"
                  className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                >
                  <span>Explore CertifiedPass Credentials</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default AuditX;
