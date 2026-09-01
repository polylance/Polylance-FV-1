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
        "settledAmountUsdc" NUMERIC(18, 2),
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
  id: string;
  jobId: string;
  jobTitle: string;
  category?: string;
  settledAmountUsdc: number;
  freelancerAddress: string;
  freelancerName?: string;
  freelancerGithub?: string;
  clientAddress: string;
  clientName?: string;
  sbtTokenId?: string;
  ipfsCid?: string;
  oracleSignature?: string;
  contractAddress?: string;
  metadata?: any;
}) {
  if (!certifiedPassClient) return;

  try {
    await initCertifiedPassDatabase();

    await certifiedPassClient.$executeRawUnsafe(
      `
      INSERT INTO "CertifiedSBTRecord" (
        "id", "jobId", "jobTitle", "category", "settledAmountUsdc",
        "freelancerAddress", "freelancerName", "freelancerGithub",
        "clientAddress", "clientName", "sbtTokenId", "ipfsCid",
        "oracleSignature", "contractAddress", "metadata", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, CURRENT_TIMESTAMP)
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
        "metadata" = EXCLUDED."metadata",
        "updatedAt" = CURRENT_TIMESTAMP;
      `,
      sbtData.id,
      sbtData.jobId,
      sbtData.jobTitle,
      sbtData.category || 'Web3 Engineering',
      sbtData.settledAmountUsdc,
      sbtData.freelancerAddress.toLowerCase(),
      sbtData.freelancerName || 'Anonymous Talent',
      sbtData.freelancerGithub || null,
      sbtData.clientAddress.toLowerCase(),
      sbtData.clientName || 'Escrow Sponsor',
      sbtData.sbtTokenId || 'SBT-ERC5192-MINTED',
      sbtData.ipfsCid || null,
      sbtData.oracleSignature || null,
      sbtData.contractAddress || null,
      JSON.stringify(sbtData.metadata || {})
    );

    console.log(`[CERTIFIED_PASS_DB] Successfully replicated SBT Certificate ${sbtData.id} to CertifiedPass DB`);
  } catch (err: any) {
    console.warn(`[CERTIFIED_PASS_DB] Error copying SBT ${sbtData.id}:`, err?.message || err);
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
  fullReport?: any;
}) {
  if (!certifiedPassClient) return;

  try {
    await initCertifiedPassDatabase();

    await certifiedPassClient.$executeRawUnsafe(
      `
      INSERT INTO "CertifiedAuditRecord" (
        "id", "targetAddress", "displayName", "roleType",
        "trustIndexScore", "lifetimeVolumeUsdc", "slaSuccessRate",
        "completedMilestonesCount", "ipfsCid", "oracleSignature",
        "auditData", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT ("id") DO UPDATE SET
        "displayName" = EXCLUDED."displayName",
        "trustIndexScore" = EXCLUDED."trustIndexScore",
        "lifetimeVolumeUsdc" = EXCLUDED."lifetimeVolumeUsdc",
        "slaSuccessRate" = EXCLUDED."slaSuccessRate",
        "completedMilestonesCount" = EXCLUDED."completedMilestonesCount",
        "ipfsCid" = EXCLUDED."ipfsCid",
        "oracleSignature" = EXCLUDED."oracleSignature",
        "auditData" = EXCLUDED."auditData",
        "updatedAt" = CURRENT_TIMESTAMP;
      `,
      auditData.id,
      auditData.targetAddress.toLowerCase(),
      auditData.displayName || 'Verified Member',
      auditData.roleType,
      auditData.trustIndexScore || '10.0',
      auditData.lifetimeVolumeUsdc || 0,
      auditData.slaSuccessRate || '100%',
      auditData.completedMilestonesCount || 0,
      auditData.ipfsCid || null,
      auditData.oracleSignature || null,
      JSON.stringify(auditData.fullReport || {})
    );

    console.log(`[CERTIFIED_PASS_DB] Successfully replicated Audit Report ${auditData.id} to CertifiedPass DB`);
  } catch (err: any) {
    console.warn(`[CERTIFIED_PASS_DB] Error copying Audit ${auditData.id}:`, err?.message || err);
  }
}

/**
 * Public Verification Query (used by CertifiedPass verification app)
 */
export async function getCertifiedCertificate(certId: string) {
  if (!certifiedPassClient) return null;

  try {
    await initCertifiedPassDatabase();

    const records: any[] = await certifiedPassClient.$queryRawUnsafe(
      `SELECT * FROM "CertifiedSBTRecord" WHERE "id" = $1 LIMIT 1;`,
      certId
    );

    if (records && records.length > 0) {
      // Log verification event
      await certifiedPassClient.$executeRawUnsafe(
        `INSERT INTO "CertifiedVerificationLog" ("certId") VALUES ($1);`,
        certId
      ).catch(() => {});

      return records[0];
    }
    return null;
  } catch (err: any) {
    console.warn(`[CERTIFIED_PASS_DB] Query error for cert ${certId}:`, err?.message || err);
    return null;
  }
}
