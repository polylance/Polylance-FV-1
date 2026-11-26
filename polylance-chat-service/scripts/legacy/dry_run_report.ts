import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function runDryRun() {
  const jobs = await prisma.jobRecord.findMany();
  const certs = await prisma.certificateRecord.findMany();
  const profiles = await prisma.profileRecord.findMany();

  const REAL_JOB_CONTRACTS = new Set([
    '0x0d34f6b4fb25',
    '0x0d34f6b4fb25c56c24b94f711be174542617f631',
    '0xa1b17f36c1927d53b0efe67881d3ded9896dd9b8',
    '0xc18511f1eff760c6d94be42d4e866ee947cbdc15',
    '0xdacce6fd6665ab8bb24cd0834eb44cf2455450fe'
  ]);

  const REAL_TOKEN_IDS = new Set([0, 1, 2]);

  const realJobs = [];
  const fakeJobs = [];

  for (const j of jobs) {
    const idLower = (j.id || '').toLowerCase();
    const contractLower = (j.contractAddress || '').toLowerCase();
    const isReal = REAL_JOB_CONTRACTS.has(idLower) || REAL_JOB_CONTRACTS.has(contractLower) || (j.onchainTokenId !== null && REAL_TOKEN_IDS.has(j.onchainTokenId));
    if (isReal) {
      realJobs.push({ id: j.id, contract: j.contractAddress, client: j.client, freelancer: j.freelancer, status: j.status, onchainTokenId: j.onchainTokenId, certNo: j.certificateNo });
    } else {
      fakeJobs.push({ id: j.id, contract: j.contractAddress, client: j.client, title: ((j.data as any) && (j.data as any).title) || 'Unknown' });
    }
  }

  const realCerts = [];
  const fakeCerts = [];

  for (const c of certs) {
    const isRealToken = c.onchainTokenId !== null && REAL_TOKEN_IDS.has(c.onchainTokenId);
    if (isRealToken) {
      realCerts.push({ id: c.id, jobId: c.jobId, onchainTokenId: c.onchainTokenId, certType: c.certType, holder: c.holderWallet });
    } else {
      fakeCerts.push({ id: c.id, jobId: c.jobId, onchainTokenId: c.onchainTokenId, certType: c.certType, holder: c.holderWallet });
    }
  }

  console.log(JSON.stringify({
    totalJobs: jobs.length,
    realJobsCount: realJobs.length,
    fakeJobsCount: fakeJobs.length,
    realJobs,
    fakeJobs: fakeJobs.map(f => ({ id: f.id, title: f.title })),
    totalCerts: certs.length,
    realCertsCount: realCerts.length,
    fakeCertsCount: fakeCerts.length,
    realCerts,
    fakeCerts: fakeCerts.map(f => ({ id: f.id, onchainTokenId: f.onchainTokenId, certType: f.certType, holder: f.holder })),
    totalProfiles: profiles.length,
  }, null, 2));

  await prisma.$disconnect();
}

runDryRun().catch(console.error);
