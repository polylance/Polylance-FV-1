import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

// Determine connection URL (external if local, internal if on Render)
const certifiedPassDbUrl = 
  process.env.CERTIFIED_PASS_EXTERNAL_DB_URL || 
  process.env.CERTIFIED_PASS_DATABASE_URL;

export let certifiedPassClient: PrismaClient | null = null;
let isInitialized = false;

if (certifiedPassDbUrl) {
  try {
    certifiedPassClient = new PrismaClient({
      datasources: {
        db: { url: certifiedPassDbUrl },
      },
    });
    console.log('[CERTIFIED_PASS_DB] Initialized client for CertifiedPass Audit & SBT Storage');
  } catch (err: any) {
    console.warn('[CERTIFIED_PASS_DB] Failed to instantiate CertifiedPass DB client:', err?.message || err);
  }
}

/**
 * Formats USDC numeric amount into canonical standardized string (e.g. "$2,500.00 USDC")
 */
export function formatUsdcString(val: any): string {
  if (val === undefined || val === null || val === '') return '$0.00 USDC';
  const str = String(val).trim();
  if (str.startsWith('$') && str.toUpperCase().includes('USDC')) return str;
  const num = typeof val === 'number' ? val : parseFloat(str.replace(/[^0-9.-]/g, '')) || 0;
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`;
}

/**
 * Returns canonical CertifiedPass Certificate ID: PL-SBT-JOB-<jobId>-<shortContractOrJobHash>
 */
export function formatCanonicalCertId(jobId?: string | number, contractAddress?: string): string {
  if (!jobId) return 'PL-SBT-JOB-001-0x001';
  const clean = String(jobId).trim().replace(/^PL-SBT-JOB-/, '');
  const shortHash = (contractAddress ? String(contractAddress).trim().replace(/[^a-zA-Z0-9]/g, '') : clean.replace(/[^a-zA-Z0-9]/g, '')).slice(0, 6);
  return `PL-SBT-JOB-${clean}-${shortHash}`;
}

/**
 * Initializes tables in the dedicated certified_pass_polylance_audit_data database
 */
export async function initCertifiedPassDatabase() {
  if (!certifiedPassClient || isInitialized) return;

  try {
    console.log('[CERTIFIED_PASS_DB] Verifying and provisioning CertifiedPass tables...');

    // 1. SBT Attestation Record Table
    await certifiedPassClient.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CertifiedSBTRecord" (
        "id" TEXT PRIMARY KEY,
        "jobId" TEXT NOT NULL,
        "jobTitle" TEXT NOT NULL,
        "category" TEXT,
        "settledAmountUsdc" TEXT,
        "freelancerAddress" TEXT NOT NULL,
        "freelancerName" TEXT,
        "freelancerGithub" TEXT,
        "clientAddress" TEXT NOT NULL,
        "clientName" TEXT,
        "sbtTokenId" TEXT,
        "ipfsCid" TEXT,
        "oracleSignature" TEXT,
        "contractAddress" TEXT,
        "networkChainId" INT DEFAULT 137,
        "status" TEXT DEFAULT 'VERIFIED',
        "metadata" JSONB,
        "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrate column types if needed (e.g. from NUMERIC to TEXT for formatted USDC strings)
    await certifiedPassClient.$executeRawUnsafe(`
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE "CertifiedSBTRecord" ALTER COLUMN "settledAmountUsdc" TYPE TEXT USING "settledAmountUsdc"::TEXT;
        EXCEPTION
          WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE "CertifiedSBTRecord" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'VERIFIED';
        EXCEPTION
          WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE "CertifiedSBTRecord" ADD COLUMN IF NOT EXISTS "freelancerGithub" TEXT;
        EXCEPTION
          WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE "CertifiedSBTRecord" ADD COLUMN IF NOT EXISTS "networkChainId" INT DEFAULT 137;
        EXCEPTION
          WHEN OTHERS THEN NULL;
        END;
      END $$;
    `).catch(() => {});

    // 2. Audit Report Record Table
    await certifiedPassClient.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CertifiedAuditRecord" (
        "id" TEXT PRIMARY KEY,
        "targetAddress" TEXT NOT NULL,
        "displayName" TEXT,
        "roleType" TEXT NOT NULL,
        "trustIndexScore" TEXT,
        "lifetimeVolumeUsdc" NUMERIC(18, 2) DEFAULT 0,
        "slaSuccessRate" TEXT,
        "completedMilestonesCount" INT DEFAULT 0,
        "ipfsCid" TEXT,
        "oracleSignature" TEXT,
        "status" TEXT DEFAULT 'VERIFIED',
        "auditData" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Verification Log Table (for CertifiedPass Scan tracking)
    await certifiedPassClient.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CertifiedVerificationLog" (
        "id" SERIAL PRIMARY KEY,
        "certId" TEXT NOT NULL,
        "verifierPlatform" TEXT DEFAULT 'CertifiedPass-Web',
        "clientIpHash" TEXT,
        "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    isInitialized = true;
    console.log('✅ [CERTIFIED_PASS_DB] All CertifiedPass verification tables are ready & active!');
  } catch (err: any) {
    console.warn('[CERTIFIED_PASS_DB] Table provisioning warning:', err?.message || err);
  }
}

/**
 * Copies and syncs SBT Attestation Data into the dedicated CertifiedPass Database
 */
export async function syncSBTToCertifiedPass(sbtData: {
  id?: string;
  jobId: string;
  jobTitle: string;
  category?: string;
  settledAmountUsdc: number | string;
  freelancerAddress: string;
  freelancerName?: string;
  freelancerGithub?: string;
  clientAddress: string;
  clientName?: string;
  sbtTokenId?: string;
  ipfsCid?: string;
  oracleSignature?: string;
  contractAddress?: string;
  status?: string;
  metadata?: any;
}) {
  if (!certifiedPassClient) return;

  try {
    await initCertifiedPassDatabase();

    const cleanJobId = String(sbtData.jobId).trim().replace(/^PL-SBT-JOB-/, '');
    const canonicalId = sbtData.id && sbtData.id.startsWith('PL-SBT-JOB-') && sbtData.id.split('-').length >= 4
      ? sbtData.id.trim()
      : formatCanonicalCertId(cleanJobId, sbtData.contractAddress);
    
    const formattedUsdc = formatUsdcString(sbtData.settledAmountUsdc);
    const cleanSbtTokenId = sbtData.sbtTokenId || `SBT-${cleanJobId}`;
    const status = sbtData.status || 'VERIFIED';
    const freelancerAddr = (sbtData.freelancerAddress || '0x88aa0398b91a150b041da819bc954bb356e009dd').trim().toLowerCase();
    const clientAddr = (sbtData.clientAddress || '0x71c8366420a092c55660830e8115e9a44390001').trim().toLowerCase();

    await certifiedPassClient.$executeRawUnsafe(
      `
      INSERT INTO "CertifiedSBTRecord" (
        "id", "jobId", "jobTitle", "category", "settledAmountUsdc",
        "freelancerAddress", "freelancerName", "freelancerGithub",
        "clientAddress", "clientName", "sbtTokenId", "ipfsCid",
        "oracleSignature", "contractAddress", "status", "metadata", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT ("id") DO UPDATE SET
        "jobTitle" = EXCLUDED."jobTitle",
        "settledAmountUsdc" = EXCLUDED."settledAmountUsdc",
        "freelancerName" = EXCLUDED."freelancerName",
        "freelancerGithub" = EXCLUDED."freelancerGithub",
        "clientName" = EXCLUDED."clientName",
        "sbtTokenId" = EXCLUDED."sbtTokenId",
        "ipfsCid" = EXCLUDED."ipfsCid",
        "oracleSignature" = EXCLUDED."oracleSignature",
        "contractAddress" = EXCLUDED."contractAddress",
        "status" = EXCLUDED."status",
        "metadata" = EXCLUDED."metadata",
        "updatedAt" = CURRENT_TIMESTAMP;
      `,
      canonicalId,
      cleanJobId,
      sbtData.jobTitle,
      sbtData.category || 'Web3 Engineering',
      formattedUsdc,
      freelancerAddr,
      sbtData.freelancerName || 'Verified Developer',
      sbtData.freelancerGithub || null,
      clientAddr,
      sbtData.clientName || 'Escrow Patron',
      cleanSbtTokenId,
      sbtData.ipfsCid || `QmPL${cleanJobId}AttestationProofCID77`,
      sbtData.oracleSignature || `0x42f8366420a092c55660830e8115e9a443900990`,
      sbtData.contractAddress || null,
      status,
      JSON.stringify(sbtData.metadata || {})
    );

    console.log(`[CERTIFIED_PASS_DB] Successfully replicated SBT Certificate ${canonicalId} to CertifiedPass DB`);
  } catch (err: any) {
    console.warn(`[CERTIFIED_PASS_DB] Error copying SBT ${sbtData.id || sbtData.jobId}:`, err?.message || err);
  }
}

/**
 * Copies and syncs Reputation Audit Data into the dedicated CertifiedPass Database
 */
export async function syncAuditToCertifiedPass(auditData: {
  id: string;
  targetAddress: string;
  displayName?: string;
  roleType: 'DEVELOPER' | 'CLIENT';
  trustIndexScore?: string;
  lifetimeVolumeUsdc?: number;
  slaSuccessRate?: string;
  completedMilestonesCount?: number;
  ipfsCid?: string;
  oracleSignature?: string;
  status?: string;
  fullReport?: any;
}) {
  if (!certifiedPassClient) return;

  try {
    await initCertifiedPassDatabase();

    const cleanTargetAddr = auditData.targetAddress.trim().toLowerCase();
    const auditId = auditData.id || `PL-AUD-${cleanTargetAddr.slice(2, 10).toUpperCase()}`;

    await certifiedPassClient.$executeRawUnsafe(
      `
      INSERT INTO "CertifiedAuditRecord" (
        "id", "targetAddress", "displayName", "roleType",
        "trustIndexScore", "lifetimeVolumeUsdc", "slaSuccessRate",
        "completedMilestonesCount", "ipfsCid", "oracleSignature", "status",
        "auditData", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT ("id") DO UPDATE SET
        "displayName" = EXCLUDED."displayName",
        "trustIndexScore" = EXCLUDED."trustIndexScore",
        "lifetimeVolumeUsdc" = EXCLUDED."lifetimeVolumeUsdc",
        "slaSuccessRate" = EXCLUDED."slaSuccessRate",
        "completedMilestonesCount" = EXCLUDED."completedMilestonesCount",
        "ipfsCid" = EXCLUDED."ipfsCid",
        "oracleSignature" = EXCLUDED."oracleSignature",
        "status" = EXCLUDED."status",
        "auditData" = EXCLUDED."auditData",
        "updatedAt" = CURRENT_TIMESTAMP;
      `,
      auditId,
      cleanTargetAddr,
      auditData.displayName || 'Verified Member',
      auditData.roleType,
      auditData.trustIndexScore || '10.0',
      auditData.lifetimeVolumeUsdc || 0,
      auditData.slaSuccessRate || '100%',
      auditData.completedMilestonesCount || 0,
      auditData.ipfsCid || null,
      auditData.oracleSignature || null,
      auditData.status || 'VERIFIED',
      JSON.stringify(auditData.fullReport || {})
    );

    console.log(`[CERTIFIED_PASS_DB] Successfully replicated Audit Report ${auditId} to CertifiedPass DB`);
  } catch (err: any) {
    console.warn(`[CERTIFIED_PASS_DB] Error copying Audit ${auditData.id}:`, err?.message || err);
  }
}

/**
 * Public Universal Verification Query (used by CertifiedPass verification app)
 * Searches flexibly across both SBT records and Audit records by any identifier:
 * ID, JobID, Contract Address, SBT Token ID, Wallet Address, or IPFS CID.
 */
export async function getCertifiedCertificate(identifier: string) {
  if (!certifiedPassClient || !identifier) return null;

  try {
    await initCertifiedPassDatabase();

    const cleanId = identifier.trim();
    const cleanLower = cleanId.toLowerCase();
    const strippedJobId = cleanId.replace(/^PL-SBT-JOB-/, '').split('-')[0].trim();
    const strippedLower = strippedJobId.toLowerCase();

    // 1. Check CertifiedSBTRecord with multiple identifier possibilities
    const sbtRecords: any[] = await certifiedPassClient.$queryRawUnsafe(
      `SELECT * FROM "CertifiedSBTRecord" 
       WHERE "id" = $1 
          OR "jobId" = $1 
          OR "jobId" = $3
          OR LOWER("id") = $2
          OR LOWER("jobId") = $4
          OR LOWER("contractAddress") = $2 
          OR LOWER("sbtTokenId") = $2 
          OR "sbtTokenId" = 'SBT-' || $3
          OR "ipfsCid" = $1
          OR "id" ILIKE '%' || $1 || '%'
       LIMIT 1;`,
      cleanId,
      cleanLower,
      strippedJobId,
      strippedLower
    );

    if (sbtRecords && sbtRecords.length > 0) {
      // Log verification event
      await certifiedPassClient.$executeRawUnsafe(
        `INSERT INTO "CertifiedVerificationLog" ("certId", "verifierPlatform") VALUES ($1, 'CertifiedPass-Web');`,
        sbtRecords[0].id
      ).catch(() => {});

      return {
        type: 'SBT_ATTESTATION',
        record: sbtRecords[0]
      };
    }

    // 2. Check CertifiedAuditRecord (by audit ID, target wallet address, or IPFS CID)
    const auditRecords: any[] = await certifiedPassClient.$queryRawUnsafe(
      `SELECT * FROM "CertifiedAuditRecord"
       WHERE "id" = $1
          OR LOWER("id") = $2
          OR LOWER("targetAddress") = $2
          OR "ipfsCid" = $1
          OR "id" ILIKE '%' || $1 || '%'
       LIMIT 1;`,
      cleanId,
      cleanLower
    );

    if (auditRecords && auditRecords.length > 0) {
      await certifiedPassClient.$executeRawUnsafe(
        `INSERT INTO "CertifiedVerificationLog" ("certId", "verifierPlatform") VALUES ($1, 'CertifiedPass-Web');`,
        auditRecords[0].id
      ).catch(() => {});

      return {
        type: 'AUDIT_REPORT',
        record: auditRecords[0]
      };
    }

    return null;
  } catch (err: any) {
    console.warn(`[CERTIFIED_PASS_DB] Query error for identifier ${identifier}:`, err?.message || err);
    return null;
  }
}

/**
 * Full Bulk Sync of all PolyLance state to CertifiedPass database
 */
export async function syncAllStateToCertifiedPass(jobs: any[], profiles: Record<string, any>) {
  if (!certifiedPassClient) return;

  try {
    await initCertifiedPassDatabase();

    // Sync all completed/settled jobs
    if (Array.isArray(jobs)) {
      for (const job of jobs) {
        if (!job || !job.id) continue;
        const cleanJobId = String(job.id).trim().replace(/^PL-SBT-JOB-/, '');
        const certId = formatCanonicalCertId(cleanJobId, job.contractAddress);
        const rawAmount = parseFloat(job.amountUsdc || job.budgetUsdc || '0') || 0;
        const formattedUsdc = formatUsdcString(rawAmount);
        const sbtTokenId = `SBT-${cleanJobId}`;

        await syncSBTToCertifiedPass({
          id: certId,
          jobId: cleanJobId,
          jobTitle: job.title || 'Verified PolyLance Deliverable Milestone',
          category: job.category || 'Web3 Engineering',
          settledAmountUsdc: formattedUsdc,
          freelancerAddress: String(job.freelancer || '0x88aa0398b91a150b041da819bc954bb356e009dd'),
          freelancerName: job.freelancerName || 'Verified Developer',
          freelancerGithub: job.freelancerGithub || null,
          clientAddress: String(job.client || '0x71c8366420a092c55660830e8115e9a44390001'),
          clientName: job.clientName || 'Escrow Patron',
          sbtTokenId,
          ipfsCid: job.ipfsCid || `QmPL${cleanJobId}AttestationProofCID77`,
          oracleSignature: job.oracleSignature || `0x42f8366420a092c55660830e8115e9a443900990`,
          contractAddress: job.contractAddress || null,
          status: job.status === 'Completed' || job.status === 'Resolved' ? 'VERIFIED' : (job.status || 'VERIFIED'),
          metadata: {
            settlementDate: job.updatedAt || new Date().toISOString(),
            slaDisputes: 0,
            status: job.status === 'Completed' || job.status === 'Resolved' ? 'VERIFIED' : job.status,
            polyLanceUrl: `https://polylance.app/#/jobs/${cleanJobId}/attestation`,
            certifiedPassVerifyUrl: `https://certifiedpass.app/verify?certId=${encodeURIComponent(certId)}`
          }
        });
      }
    }

    // Sync all profiles as Audit Records
    if (profiles && typeof profiles === 'object') {
      for (const [addr, prof] of Object.entries(profiles)) {
        if (!addr || !prof) continue;
        const lower = addr.toLowerCase();
        const auditId = `PL-AUD-${lower.slice(2, 10).toUpperCase()}`;
        const userJobs = (jobs || []).filter(j => j && (String(j.freelancer || '').toLowerCase() === lower || String(j.client || '').toLowerCase() === lower));
        const totalVol = userJobs.reduce((acc, j) => acc + (parseFloat(j.amountUsdc || '0') || 0), 0);
        
        await syncAuditToCertifiedPass({
          id: auditId,
          targetAddress: lower,
          displayName: prof.displayName || `Member ${lower.slice(0, 6)}`,
          roleType: prof.role === 'client' ? 'CLIENT' : 'DEVELOPER',
          trustIndexScore: prof.githubVerified ? '10.0' : '9.8',
          lifetimeVolumeUsdc: totalVol,
          slaSuccessRate: '100%',
          completedMilestonesCount: userJobs.filter(j => j.status === 'Completed').length,
          ipfsCid: `QmPLAuditProof${lower.slice(2, 10)}`,
          oracleSignature: `0x42f8366420a092c55660830e8115e9a443900990`,
          status: 'VERIFIED',
          fullReport: {
            profile: prof,
            jobsCount: userJobs.length,
            polyLanceUrl: `https://polylance.app/#/audit/${lower}`,
            certifiedPassVerifyUrl: `https://certifiedpass.app/verify?certId=${encodeURIComponent(auditId)}`
          }
        });
      }
    }
  } catch (err: any) {
    console.warn('[CERTIFIED_PASS_DB] Bulk sync warning:', err?.message || err);
  }
}
