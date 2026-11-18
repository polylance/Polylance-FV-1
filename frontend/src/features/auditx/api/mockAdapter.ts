/**
 * AuditX Local Development Mock Adapter
 * Enabled ONLY when VITE_AUDITX_USE_MOCK === 'true' in development.
 * All sample records and mock reports are explicitly labeled "[Sample]".
 * Throws immediately if loaded in production environments.
 */

import {
  AuditXCapabilities,
  CreateScanPayload,
  ScanJob,
  AuditXReport,
  AuditFinding
} from './types';

// Strict guard: mock adapter must never operate in production builds
if (import.meta.env.PROD && import.meta.env.VITE_AUDITX_USE_MOCK === 'true') {
  throw new Error(
    '[FATAL CONFIG] AUDITX_USE_MOCK is set to true in a production build. Mock analysis data is strictly banned in production.'
  );
}

export const MOCK_CAPABILITIES: AuditXCapabilities = {
  version: '2.4.0-preview',
  supportedLanguages: ['Solidity'],
  allowedExtensions: ['.sol', '.zip'],
  maxFileSizeBytes: 2 * 1024 * 1024, // 2 MB
  maxTotalSizeBytes: 10 * 1024 * 1024, // 10 MB
  maxFilesCount: 20,
  retentionDays: 30,
  pricing: {
    tier: 'free_preview',
    scansPerDay: 15,
    maxLinesPerScan: 5000,
  },
  privacy: {
    isolatedPerUser: true,
    codeEncryptedAtRest: true,
    noPublicTraining: true,
    deletionOnRequest: true,
    needsConfirmation: true, // Pending confirmation by scanning backend team
  },
  supportedCompilers: [
    'v0.8.28',
    'v0.8.26',
    'v0.8.24',
    'v0.8.20',
    'v0.8.19',
    'v0.7.6'
  ],
  categories: [
    {
      id: 'reentrancy',
      name: 'Reentrancy Vulnerabilities',
      description: 'Detects state variable updates occurring after external ether or token transfers (CEI violations).',
      severityDefault: 'Critical',
      needsConfirmation: false,
    },
    {
      id: 'access-control',
      name: 'Access Control & Privilege Escalation',
      description: 'Identifies unconstrained administrative routines, missing onlyOwner modifiers, and faulty initializers.',
      severityDefault: 'High',
      needsConfirmation: false,
    },
    {
      id: 'unchecked-calls',
      name: 'Unchecked Low-Level Calls',
      description: 'Flags unhandled return values from address.call, address.delegatecall, and transfer methods.',
      severityDefault: 'Medium',
      needsConfirmation: false,
    },
    {
      id: 'integer-logic',
      name: 'Arithmetic Truncation & Logic Drift',
      description: 'Scans for basis point precision truncation, unsafe downcasting, and off-by-one boundary checks.',
      severityDefault: 'Medium',
      needsConfirmation: false,
    },
    {
      id: 'gas-optimization',
      name: 'Gas & Loop Bound Inefficiencies',
      description: 'Highlights storage variable reads in loops, excessive calldata copying, and unbounded array iterations.',
      severityDefault: 'Low',
      needsConfirmation: true, // Needs confirmation
    },
    {
      id: 'best-practices',
      name: 'Coding Standards & Informational Hygiene',
      description: 'Checks for missing event emissions on state mutations, obsolete pragma definitions, and dead code.',
      severityDefault: 'Informational',
      needsConfirmation: true, // Needs confirmation
    }
  ]
};

const SAMPLE_FINDINGS: AuditFinding[] = [
  {
    id: 'AX-SMP-001',
    title: '[Sample] Missing ReentrancyGuard on Milestone Release',
    severity: 'Critical',
    status: 'Open',
    contractOrFile: 'EscrowVault.sol',
    functionTarget: 'releaseMilestoneFunds()',
    lineStart: 44,
    lineEnd: 52,
    codeSnippet: `// Vulnerable sample snippet:\nfunction releaseMilestoneFunds(uint256 id) external {\n    uint256 amount = milestones[id].amount;\n    (bool sent, ) = recipient.call{value: amount}("");\n    require(sent, "Transfer failed");\n    milestones[id].paid = true; // State updated after external call!\n}`,
    description: 'The contract performs an external Ether transfer before updating the milestone status flag, exposing the contract to reentrant callbacks.',
    recommendation: 'Apply the OpenZeppelin nonReentrant modifier and follow strict Checks-Effects-Interactions: set milestones[id].paid = true before the transfer.',
    cwe: 'CWE-841: Improper Enforcement of Behavioral Workflow',
    swc: 'SWC-107: Reentrancy'
  },
  {
    id: 'AX-SMP-002',
    title: '[Sample] Unprotected Ownership Initialization',
    severity: 'High',
    status: 'Open',
    contractOrFile: 'EscrowVault.sol',
    functionTarget: 'initVault()',
    lineStart: 21,
    lineEnd: 26,
    codeSnippet: `// Unprotected public initializer\nfunction initVault(address _owner) public {\n    require(owner == address(0), "Already initialized");\n    owner = _owner;\n}`,
    description: 'Anyone can front-run the initial contract call if not wrapped in a constructor or automated factory initialize pattern.',
    recommendation: 'Use OpenZeppelin Initializable contract with the initializer modifier, or initialize during deployment.',
    cwe: 'CWE-285: Improper Authorization',
    swc: 'SWC-105: Unprotected Ether Withdrawal'
  },
  {
    id: 'AX-SMP-003',
    title: '[Sample] Fee Division Truncation on Micro-Amounts',
    severity: 'Medium',
    status: 'Acknowledged',
    contractOrFile: 'FeeCalculator.sol',
    functionTarget: 'computeFee()',
    lineStart: 78,
    lineEnd: 82,
    codeSnippet: `function computeFee(uint256 gross) public pure returns (uint256) {\n    return (gross * 250) / 10000;\n}`,
    description: 'For amounts below 40 units, fee calculation yields zero due to integer division truncation.',
    recommendation: 'Enforce a minimum project budget validation threshold before accepting escrow deposits.',
    cwe: 'CWE-682: Incorrect Calculation'
  },
  {
    id: 'AX-SMP-004',
    title: '[Sample] Uncached Storage Read in Loop',
    severity: 'Low',
    status: 'Open',
    contractOrFile: 'EscrowVault.sol',
    functionTarget: 'getActiveMilestones()',
    lineStart: 95,
    lineEnd: 101,
    codeSnippet: `for (uint256 i = 0; i < milestones.length; i++) {\n    // milestones.length evaluated from storage every iteration\n}`,
    description: 'Reading the array length from storage on each loop cycle wastes unnecessary gas on Polygon.',
    recommendation: 'Cache array length in a stack memory variable: uint256 len = milestones.length;.',
    swc: 'SWC-128: DoS With Block Gas Limit'
  },
  {
    id: 'AX-SMP-005',
    title: '[Sample] Unlocked Pragma Floating Version',
    severity: 'Informational',
    status: 'Open',
    contractOrFile: 'EscrowVault.sol',
    lineStart: 1,
    lineEnd: 1,
    codeSnippet: `pragma solidity ^0.8.20;`,
    description: 'Floating pragma statements allow compiling with untested newer versions of the Solidity compiler.',
    recommendation: 'Lock pragma to an exact tested version, e.g. pragma solidity 0.8.24;.',
    swc: 'SWC-103: Floating Pragma'
  }
];

export const STATIC_SAMPLE_REPORT: AuditXReport = {
  id: 'rpt_sample_static_preview',
  scanId: 'scn_sample_static_001',
  projectName: 'EscrowVault Protocol [Sample]',
  targetType: 'files',
  targetSummary: 'EscrowVault.sol, FeeCalculator.sol (2 files, 320 lines)',
  language: 'Solidity',
  compilerVersion: 'v0.8.24',
  createdAt: '2026-10-24T12:00:00.000Z',
  scanDurationMs: 4210,
  status: 'has_findings',
  severityCounts: {
    Critical: 1,
    High: 1,
    Medium: 1,
    Low: 1,
    Informational: 1,
  },
  totalFindings: 5,
  findings: SAMPLE_FINDINGS,
  limitationsNotice: 'This is a synthetic sample demonstration report generated for preview purposes. Automated analysis cannot detect all logical errors, business rule bugs, or economic exploits and is not a formal security audit.',
  isSample: true,
};

// In-memory mock store for local development session
const mockScansStore = new Map<string, ScanJob>();
const mockReportsStore = new Map<string, AuditXReport>();

// Seed initial sample scan for signed-in user demonstration
const initialSampleScan: ScanJob = {
  id: 'scn_sample_static_001',
  userId: 'current-user',
  targetType: 'files',
  targetName: 'EscrowVault.sol (2 files)',
  projectName: 'EscrowVault Protocol [Sample]',
  language: 'Solidity',
  compilerVersion: 'v0.8.24',
  status: 'completed',
  progress: 100,
  elapsedMs: 4210,
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  completedAt: new Date(Date.now() - 3595000).toISOString(),
  severitySummary: {
    Critical: 1,
    High: 1,
    Medium: 1,
    Low: 1,
    Informational: 1,
  },
};
mockScansStore.set(initialSampleScan.id, initialSampleScan);
mockReportsStore.set('rpt_sample_static_preview', STATIC_SAMPLE_REPORT);

export const mockAuditXApi = {
  getCapabilities: async (): Promise<AuditXCapabilities> => {
    await new Promise((r) => setTimeout(r, 120));
    return MOCK_CAPABILITIES;
  },

  createScan: async (payload: CreateScanPayload): Promise<ScanJob> => {
    await new Promise((r) => setTimeout(r, 350));
    const scanId = `scn_usr_${Date.now().toString(36)}`;
    let targetName = 'Code Snippet';
    if (payload.targetType === 'files') {
      const fNames = payload.files?.map((f) => f.name).join(', ') || 'Uploaded files';
      targetName = fNames.length > 35 ? `${fNames.slice(0, 32)}...` : fNames;
    } else if (payload.targetType === 'address') {
      targetName = payload.contractAddress ? `${payload.contractAddress.slice(0, 10)}...${payload.contractAddress.slice(-6)}` : 'Polygon Contract';
    }

    const newScan: ScanJob = {
      id: scanId,
      userId: 'current-user',
      targetType: payload.targetType,
      targetName,
      projectName: payload.projectName || `${targetName} [Scan]`,
      language: payload.language || 'Solidity',
      compilerVersion: payload.compilerVersion || 'v0.8.24',
      status: 'queued',
      progress: 0,
      elapsedMs: 0,
      createdAt: new Date().toISOString(),
      severitySummary: { Critical: 0, High: 0, Medium: 0, Low: 0, Informational: 0 },
      canCancel: true,
    };

    mockScansStore.set(scanId, newScan);

    // Simulate asynchronous scan lifecycle in memory
    const startTime = Date.now();
    setTimeout(() => {
      const cur = mockScansStore.get(scanId);
      if (cur && cur.status !== 'cancelled') {
        cur.status = 'scanning';
        cur.progress = 25;
        cur.elapsedMs = Date.now() - startTime;
      }
    }, 1200);

    setTimeout(() => {
      const cur = mockScansStore.get(scanId);
      if (cur && cur.status !== 'cancelled') {
        cur.progress = 70;
        cur.elapsedMs = Date.now() - startTime;
      }
    }, 2800);

    setTimeout(() => {
      const cur = mockScansStore.get(scanId);
      if (cur && cur.status !== 'cancelled') {
        cur.status = 'completed';
        cur.progress = 100;
        cur.elapsedMs = Date.now() - startTime;
        cur.completedAt = new Date().toISOString();
        cur.severitySummary = {
          Critical: 1,
          High: 1,
          Medium: 1,
          Low: 1,
          Informational: 1,
        };

        const reportId = `rpt_${scanId}`;
        const newReport: AuditXReport = {
          id: reportId,
          scanId,
          projectName: cur.projectName,
          targetType: cur.targetType,
          targetSummary: cur.targetName,
          language: cur.language,
          compilerVersion: cur.compilerVersion,
          createdAt: cur.completedAt,
          scanDurationMs: cur.elapsedMs,
          status: 'has_findings',
          severityCounts: cur.severitySummary,
          totalFindings: 5,
          findings: SAMPLE_FINDINGS,
          limitationsNotice: 'Automated analysis is an automated tool and cannot find every potential vulnerability or guarantee code safety. This is not a substitute for a professional third-party smart contract audit.',
          isSample: true,
        };
        mockReportsStore.set(reportId, newReport);
      }
    }, 4500);

    return newScan;
  },

  getScans: async (): Promise<ScanJob[]> => {
    await new Promise((r) => setTimeout(r, 180));
    return Array.from(mockScansStore.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getScan: async (id: string): Promise<ScanJob | null> => {
    await new Promise((r) => setTimeout(r, 100));
    return mockScansStore.get(id) || null;
  },

  getReport: async (reportOrScanId: string): Promise<AuditXReport | null> => {
    await new Promise((r) => setTimeout(r, 200));
    // Direct report lookup
    if (mockReportsStore.has(reportOrScanId)) {
      return mockReportsStore.get(reportOrScanId) || null;
    }
    // Lookup by scanId
    for (const r of mockReportsStore.values()) {
      if (r.scanId === reportOrScanId) return r;
    }
    // Fallback sample
    if (reportOrScanId === 'sample' || reportOrScanId === 'static') {
      return STATIC_SAMPLE_REPORT;
    }
    return null;
  },

  deleteScan: async (id: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 150));
    mockScansStore.delete(id);
    for (const [rId, rep] of mockReportsStore.entries()) {
      if (rep.scanId === id || rep.id === id) {
        mockReportsStore.delete(rId);
      }
    }
    return true;
  },

  cancelScan: async (id: string): Promise<boolean> => {
    const s = mockScansStore.get(id);
    if (s && (s.status === 'queued' || s.status === 'scanning')) {
      s.status = 'cancelled';
      s.progress = 0;
      return true;
    }
    return false;
  }
};
