/**
 * AuditX TypeScript Type Definitions
 * Shared types for capabilities, scan requests, lifecycle status, reports, and findings.
 */

export type FindingSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
export type FindingStatus = 'Open' | 'Fixed' | 'Acknowledged';
export type ScanStatus = 'queued' | 'scanning' | 'completed' | 'failed' | 'cancelled';
export type ScanTargetType = 'files' | 'code' | 'address';

export interface AuditXCategory {
  id: string;
  name: string;
  description: string;
  severityDefault: FindingSeverity;
  /** Flags whether this check category is confirmed by the backend analysis team */
  needsConfirmation: boolean;
}

export interface AuditXCapabilities {
  version: string;
  supportedLanguages: string[];
  allowedExtensions: string[];
  maxFileSizeBytes: number;
  maxTotalSizeBytes: number;
  maxFilesCount: number;
  categories: AuditXCategory[];
  retentionDays: number;
  privacy: {
    isolatedPerUser: boolean;
    codeEncryptedAtRest: boolean;
    noPublicTraining: boolean;
    deletionOnRequest: boolean;
    /** Flags whether retention and encryption policies are finalized by the backend team */
    needsConfirmation: boolean;
  };
  supportedCompilers: string[];
  pricing: {
    tier: 'free_preview';
    scansPerDay: number;
    maxLinesPerScan: number;
  };
}

export interface CreateScanPayload {
  targetType: ScanTargetType;
  projectName?: string;
  language: string;
  compilerVersion: string;
  notes?: string;
  // For 'files' target:
  files?: File[];
  // For 'code' target:
  codeSnippet?: string;
  // For 'address' target:
  contractAddress?: string;
  chainId?: number;
}

export interface ScanJob {
  id: string;
  userId: string;
  targetType: ScanTargetType;
  targetName: string;
  projectName: string;
  language: string;
  compilerVersion: string;
  status: ScanStatus;
  progress: number; // 0 - 100
  elapsedMs: number;
  createdAt: string;
  completedAt?: string;
  severitySummary: Record<FindingSeverity, number>;
  errorMessage?: string;
  canCancel?: boolean;
}

export interface AuditFinding {
  id: string;
  title: string;
  severity: FindingSeverity;
  status: FindingStatus;
  contractOrFile: string;
  functionTarget?: string;
  lineStart?: number;
  lineEnd?: number;
  codeSnippet?: string;
  description: string;
  recommendation: string;
  cwe?: string;
  swc?: string;
  referenceUrl?: string;
}

export interface AuditXReport {
  id: string;
  scanId: string;
  projectName: string;
  targetType: ScanTargetType;
  targetSummary: string;
  language: string;
  compilerVersion: string;
  createdAt: string;
  scanDurationMs: number;
  status: 'clean' | 'has_findings' | 'incomplete';
  severityCounts: Record<FindingSeverity, number>;
  totalFindings: number;
  findings: AuditFinding[];
  limitationsNotice: string;
  isSample?: boolean;
}
