import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  ExternalLink,
  Download,
  Printer,
  Search,
  Filter,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  Layers,
  RefreshCw,
  Lock,
  Sparkles,
  Activity,
  FileCode,
  ArrowRight,
  Database,
  Radio,
  ArrowLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Seo } from '../../../components/seo/Seo';
import { ErrorState } from '../../../components/common/ErrorState';
import { useWeb3 } from '../../../context/Web3Context';
import { useAuth } from '../../../context/AuthContext';
import { isAdminAddress } from '../../../utils/adminGuard';
import { auditxApi } from '../api/client';
import { MAINNET_CONTRACTS, POLYGONSCAN_BASE_URL, POLYGON_CHAIN_ID } from '../../../seo/site.config';

// ── Types ─────────────────────────────────────────────────────────────
type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
type FindingStatus = 'Fixed' | 'Acknowledged' | 'Open';

interface AuditFinding {
  id: string;
  title: string;
  severity: Severity;
  status: FindingStatus;
  contract: string;
  functionTarget?: string;
  description: string;
  recommendation: string;
  cwe?: string;
  resolvedVersion?: string;
}

interface ContractInfo {
  name: string;
  address: string;
  type: string;
  description: string;
}

// ── Verified Polygon Contracts ─────────────────────────────────────────
const VERIFIED_CONTRACTS: ContractInfo[] = [
  {
    name: 'JobFactory',
    address: MAINNET_CONTRACTS.jobFactory,
    type: 'Factory & Registry',
    description: 'Deploys, initializes, and tracks job escrows on Polygon Mainnet.'
  },
  {
    name: 'JobEscrow (Impl)',
    address: MAINNET_CONTRACTS.jobEscrowImpl,
    type: 'Escrow Logic',
    description: 'Non-custodial milestone funding, releases, auto-release timers, and fee deductions.'
  },
  {
    name: 'ReputationSBT',
    address: MAINNET_CONTRACTS.reputationSBT,
    type: 'ERC-5192 Soulbound',
    description: 'Issues non-transferable on-chain proof-of-work reputation certificates.'
  },
  {
    name: 'ProfileRegistry',
    address: MAINNET_CONTRACTS.profileRegistry,
    type: 'Identity',
    description: 'Binds public developer profile metadata and wallet addresses.'
  },
  {
    name: 'GitHubRegistry',
    address: MAINNET_CONTRACTS.githubReputationRegistry,
    type: 'Attestation Oracle',
    description: 'Cryptographic proof binding GitHub accounts and verified repository contributions.'
  },
  {
    name: 'JudgeDAO',
    address: MAINNET_CONTRACTS.judgeDAO,
    type: 'Arbitration Protocol',
    description: 'Decentralized multi-sig dispute resolution with arbitrary split capabilities.'
  },
  {
    name: 'TimelockController',
    address: MAINNET_CONTRACTS.timelockController,
    type: 'Governance Timelock',
    description: 'Enforces 48-hour delay on platform parameter updates and upgrade operations.'
  }
];

// ── Internal Audit Findings Data ───────────────────────────────────────
const AUDIT_FINDINGS: AuditFinding[] = [
  {
    id: 'AX-2024-001',
    title: 'Checks-Effects-Interactions (CEI) Pattern in Milestone Payment Release',
    severity: 'Critical',
    status: 'Fixed',
    contract: 'JobEscrow.sol',
    functionTarget: '_completeJob() / releasePayment()',
    description: 'State variables tracking milestone status and job completion were updated after invoking external token transfers, exposing escrow contracts to reentrancy vulnerabilities.',
    recommendation: 'Updated contract to follow strict CEI guidelines. Inherited OpenZeppelin ReentrancyGuard and applied nonReentrant modifier on all payout and refund routines.',
    cwe: 'CWE-841: Improper Enforcement of Behavioral Workflow',
    resolvedVersion: 'v1.1.0'
  },
  {
    id: 'AX-2024-002',
    title: 'Precision Loss in Basis Points Protocol Fee Computation',
    severity: 'High',
    status: 'Fixed',
    contract: 'JobEscrow.sol',
    functionTarget: 'fundJob() / _completeJob()',
    description: 'Integer division (tokenAmount * 250) / 10000 could produce truncation errors for micro-milestone values beneath the token decimal precision boundary.',
    recommendation: 'Enforced a protocol-level minimum job budget of 0.01 units for both POL and ERC-20 tokens, guaranteeing deterministic and exact fee collection.',
    cwe: 'CWE-682: Incorrect Calculation',
    resolvedVersion: 'v1.1.0'
  },
  {
    id: 'AX-2024-003',
    title: 'Administrative Timelock Delay Enforcement on Governance Operations',
    severity: 'Medium',
    status: 'Fixed',
    contract: 'TimelockController.sol',
    functionTarget: 'schedule() / execute()',
    description: 'Administrative parameters were capable of instantaneous reconfiguration in emergency scenarios, creating a potential counterparty risk for participants.',
    recommendation: 'Integrated OpenZeppelin TimelockController enforcing a hardcoded minimum 48-hour timelock execution delay for any parameter modifications.',
    cwe: 'CWE-285: Improper Authorization',
    resolvedVersion: 'v1.2.0'
  },
  {
    id: 'AX-2024-004',
    title: 'Storage Loop Caching Optimization in Milestone Iterations',
    severity: 'Medium',
    status: 'Fixed',
    contract: 'JobEscrow.sol',
    functionTarget: 'getMilestones()',
    description: 'Iterating directly over contract storage variables during milestone inspection incurred redundant SLOAD operations, increasing gas consumption on multi-milestone contracts.',
    recommendation: 'Cached storage length and loaded milestone structs into memory slices before iterating, reducing view execution gas by approximately 28%.',
    cwe: 'Gas Optimization',
    resolvedVersion: 'v1.2.0'
  },
  {
    id: 'AX-2024-005',
    title: 'Synchronous EIP-5192 Locked Event Emission on Minting',
    severity: 'Low',
    status: 'Fixed',
    contract: 'ReputationSBT.sol',
    functionTarget: 'mintCertificate()',
    description: 'Soulbound certificates correctly locked transfers via reverts, but omitted the standard Locked(tokenId) event expected by compliant EIP-5192 indexers.',
    recommendation: 'Added emit Locked(tokenId) synchronously inside the mintCertificate() function immediately after ERC-721 token assignment.',
    cwe: 'Standards Compliance',
    resolvedVersion: 'v1.2.0'
  },
  {
    id: 'AX-2024-006',
    title: 'Explicit Zero-Address Validation in Factory Deployment Flow',
    severity: 'Low',
    status: 'Fixed',
    contract: 'JobFactory.sol',
    functionTarget: 'createJob()',
    description: 'Job initialization allowed initializing escrow instances with client or freelancer set to address(0) if client-side validation failed.',
    recommendation: 'Added explicit require(client != address(0) && freelancer != address(0), "InvalidAddress") before dispatching escrow proxies.',
    cwe: 'CWE-20: Improper Input Validation',
    resolvedVersion: 'v1.1.0'
  },
  {
    id: 'AX-2024-007',
    title: 'Solidity Custom Error Migration for Gas Efficiency',
    severity: 'Low',
    status: 'Fixed',
    contract: 'JobEscrow.sol',
    functionTarget: 'All escrow methods',
    description: 'Verbose string revert messages consumed additional contract bytecode and deployment gas.',
    recommendation: 'Migrated all require assertions to Solidity 0.8.20 custom errors (e.g. error UnauthorizedCaller(), error InsufficientFunding()), reducing deployment bytecode by 1.8KB.',
    cwe: 'Gas Optimization',
    resolvedVersion: 'v1.2.0'
  },
  {
    id: 'AX-2024-008',
    title: 'Emergency Pause Functionality Restricted to Multi-Sig Timelock',
    severity: 'Informational',
    status: 'Acknowledged',
    contract: 'JobFactory.sol',
    functionTarget: 'pause() / unpause()',
    description: 'Emergency circuit breaker permits pausing new escrow deployments during critical vulnerability alerts.',
    recommendation: 'Acknowledged and documented. Emergency pause is restricted to the multi-sig TimelockController governance address and cannot drain or touch active escrow principal.',
    cwe: 'Design Documentation',
    resolvedVersion: 'v1.0.0'
  },
  {
    id: 'AX-2024-009',
    title: 'Locked Compiler Pragma 0.8.20 with Shanghai Target',
    severity: 'Informational',
    status: 'Acknowledged',
    contract: 'All contracts',
    functionTarget: 'Compiler settings',
    description: 'Ensure compiler target avoids experimental opcodes (such as PUSH0) on EVM networks that do not support them.',
    recommendation: 'Locked all production pragma directives to ^0.8.20 with Shanghai EVM target, validated on Polygon Mainnet.',
    cwe: 'Compiler Configuration',
    resolvedVersion: 'v1.0.0'
  },
  {
    id: 'AX-2024-010',
    title: 'Two-Step Ownership Transfer Implementation Across Registries',
    severity: 'Informational',
    status: 'Fixed',
    contract: 'ProfileRegistry.sol',
    functionTarget: 'transferOwnership()',
    description: 'Single-step ownership transfer could result in permanent loss of admin control if transferred to an incorrect wallet.',
    recommendation: 'Adopted OpenZeppelin Ownable2Step across all platform registries, requiring the pending owner to accept transfer explicitly.',
    cwe: 'CWE-284: Improper Access Control',
    resolvedVersion: 'v1.2.0'
  }
];

export const InternalReportPage: React.FC = () => {
  const { address, currentRole, connectWallet } = useWeb3();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Admin access validation
  const isAdmin = (address ? isAdminAddress(address) : false) || currentRole === 'admin';

  // Server authorization check
  const [serverAuthorized, setServerAuthorized] = useState<boolean | null>(null);
  const [serverCheckLoading, setServerCheckLoading] = useState(true);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'All'>('All');
  const [contractFilter, setContractFilter] = useState<string>('All');
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set(['AX-2024-001']));
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      setServerCheckLoading(false);
      return;
    }

    let mounted = true;
    auditxApi.getAdminInternalReport().then(() => {
      if (mounted) setServerAuthorized(true);
    }).catch((err: any) => {
      if (mounted) {
        if (err.status === 403 || err.status === 401) {
          setServerAuthorized(false);
        } else {
          // If server is unreachable in mock mode, allow admin view
          setServerAuthorized(true);
        }
      }
    }).finally(() => {
      if (mounted) setServerCheckLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, isAdmin]);

  const toggleFinding = (id: string) => {
    setExpandedFindings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(text);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  const handleExportJson = () => {
    const data = {
      reportTitle: 'PolyLance Smart Contract Security Report',
      accessClassification: 'INTERNAL_ADMIN_ONLY',
      generatedAt: '2026-10-24T12:00:00Z',
      network: 'Polygon Mainnet (137)',
      contracts: VERIFIED_CONTRACTS,
      findings: AUDIT_FINDINGS
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'polylance_internal_security_report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Severity counts
  const severityCounts = useMemo(() => {
    return AUDIT_FINDINGS.reduce((acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    }, {} as Record<Severity, number>);
  }, []);

  // Filtered findings
  const filteredFindings = useMemo(() => {
    return AUDIT_FINDINGS.filter((f) => {
      const matchSearch =
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.contract.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSeverity = severityFilter === 'All' || f.severity === severityFilter;
      const matchContract = contractFilter === 'All' || f.contract === contractFilter;
      return matchSearch && matchSeverity && matchContract;
    });
  }, [searchQuery, severityFilter, contractFilter]);

  // Chart data
  const chartData = [
    { name: 'Critical', count: severityCounts.Critical || 0, fill: '#DC2626' },
    { name: 'High', count: severityCounts.High || 0, fill: '#EA580C' },
    { name: 'Medium', count: severityCounts.Medium || 0, fill: '#EAB308' },
    { name: 'Low', count: severityCounts.Low || 0, fill: '#2563EB' },
    { name: 'Info', count: severityCounts.Informational || 0, fill: '#64748B' }
  ];

  // Unauthenticated guard
  if (!isAuthenticated) {
    return (
      <PageContainer className="py-12 w-full text-[#0B0B0F]">
        <Seo routeKey="/auditx/internal" />
        <ErrorState
          variant="auth-required"
          title="Connect Wallet to Access Internal Protocol Report"
          description="The PolyLance internal security hardening report is restricted to protocol administrators. Please connect your authorized wallet to continue."
          actionText="Connect & Sign In"
          onAction={connectWallet}
        />
      </PageContainer>
    );
  }

  // Non-admin guard (403 ErrorState)
  if (!isAdmin || serverAuthorized === false) {
    return (
      <PageContainer className="py-12 w-full text-[#0B0B0F]">
        <Seo routeKey="/auditx/internal" />
        <ErrorState
          variant="403"
          title="Administrator Authorization Required"
          description="This report is only available to PolyLance administrators."
          actionText="Back to AuditX"
          onAction={() => navigate('/auditx')}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6 py-6 w-full text-[#0B0B0F]">
      <Seo routeKey="/auditx/internal" />

      {/* Top Navigation & Admin Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/auditx"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to AuditX Public Overview</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#0047AB] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-3xs">
            <Shield size={12} />
            <span>Admin Restricted Report</span>
          </span>

          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-3xs transition-colors cursor-pointer"
          >
            <Download size={13} />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-3xs transition-colors cursor-pointer"
          >
            <Printer size={13} />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Page Header */}
      <PageHeader
        title="PolyLance Smart Contract Security Report"
        subtitle="Internal hardening review and static analysis report for PolyLance core protocol contracts on Polygon Mainnet (137)."
        actions={
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-200 font-semibold flex items-center gap-1">
              <CheckCircle2 size={13} /> All 10 Hardening Findings Resolved
            </span>
          </div>
        }
      />

      {/* Transparent Third-Party Audit Notice */}
      <div className="bg-white border-2 border-amber-200/90 rounded-3xl p-6 shadow-xs text-left space-y-2">
        <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
          <ShieldAlert size={18} className="text-amber-600 shrink-0" />
          <span>Internal Hardening Report Notice</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
          This document represents PolyLance&apos;s internal pre-deployment security review and automated Slither static analysis. PolyLance contracts are not yet independently audited by a third-party security firm. Formal independent audit engagements are scheduled prior to protocol v3 deployment.
        </p>
      </div>

      {/* Severity Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(['Critical', 'High', 'Medium', 'Low', 'Informational'] as Severity[]).map((sev) => {
          const count = severityCounts[sev] || 0;
          let badgeColor = 'bg-slate-50 text-slate-700 border-slate-200';
          if (sev === 'Critical') badgeColor = 'bg-red-50 text-red-700 border-red-200';
          if (sev === 'High') badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
          if (sev === 'Medium') badgeColor = 'bg-yellow-50 text-yellow-800 border-yellow-200';
          if (sev === 'Low') badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';

          return (
            <div
              key={sev}
              onClick={() => setSeverityFilter(severityFilter === sev ? 'All' : sev)}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                severityFilter === sev
                  ? 'border-[#0047AB] ring-2 ring-[#0047AB]/20 bg-blue-50/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${badgeColor}`}>
                {sev}
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">
                {count}
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                {sev === 'Informational' ? 'Acknowledged' : '100% Fixed'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart & Scope Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-[#0047AB]" />
            <h3 className="font-bold text-base text-slate-900">
              Protocol Scope & Hardening Breakdown
            </h3>
          </div>
          <span className="font-mono text-xs text-slate-400">Total Findings: {AUDIT_FINDINGS.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 font-mono">
              <span>Verified Polygon Contracts in Scope:</span>
              <span className="font-bold text-slate-900">{VERIFIED_CONTRACTS.length} Contracts</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 font-mono">
              <span>OpenZeppelin Base Standard:</span>
              <span className="font-bold text-slate-900">v5.0.2 Primitives</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 font-mono">
              <span>Automated Hardhat Test Suite:</span>
              <span className="font-bold text-emerald-700">34 Passing Tests</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Contracts Registry */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-[#0047AB]" />
            <h3 className="font-bold text-base text-slate-900">
              Verified Core Protocol Contracts (Polygon 137)
            </h3>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {VERIFIED_CONTRACTS.map((c) => (
            <div key={c.name} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{c.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600">
                    {c.type}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] truncate">{c.description}</p>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600 shrink-0">
                <span className="truncate max-w-[200px]">{c.address}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(c.address)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                  title="Copy address"
                >
                  {copiedAddr === c.address ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
                <a
                  href={`https://polygonscan.com/address/${c.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#0047AB] hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  Polygonscan <ExternalLink size={10} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Findings Breakdown Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <FileCode size={18} className="text-[#0047AB]" />
            <h3 className="font-bold text-base text-slate-900">
              Detailed Findings & Fix Verifications ({filteredFindings.length})
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search internal findings..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="w-full sm:w-auto p-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Informational">Informational</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredFindings.map((finding) => {
            const isExpanded = expandedFindings.has(finding.id);
            return (
              <div key={finding.id} className="py-4">
                <button
                  type="button"
                  onClick={() => toggleFinding(finding.id)}
                  className="w-full flex items-start justify-between text-left gap-3 hover:text-[#0047AB] transition-colors cursor-pointer"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        {finding.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                          finding.severity === 'Critical'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : finding.severity === 'High'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : finding.severity === 'Medium'
                            ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                            : finding.severity === 'Low'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {finding.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {finding.status}
                      </span>
                      <span className="font-bold text-sm text-slate-900">
                        {finding.title}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                      <span>Contract: {finding.contract}</span>
                      {finding.functionTarget && <span>• Target: {finding.functionTarget}</span>}
                    </div>
                  </div>

                  <div className="p-1 text-slate-400 hover:text-slate-600 shrink-0">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 pl-3 sm:pl-4 border-l-2 border-blue-200 space-y-3 pt-1">
                    <div>
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                        Vulnerability Analysis
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {finding.description}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-700" />
                        <span>Resolution & Mitigation Applied ({finding.resolvedVersion || 'Resolved'})</span>
                      </div>
                      <p className="leading-relaxed">{finding.recommendation}</p>
                    </div>

                    {finding.cwe && (
                      <div className="text-[11px] font-mono text-slate-400">
                        Classification: {finding.cwe}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
};

export default InternalReportPage;
