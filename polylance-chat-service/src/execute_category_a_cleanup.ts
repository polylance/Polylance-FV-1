import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

// The 7 zero-footprint test jobs approved for hard delete
const CATEGORY_A_JOB_IDS = [
  '0x881a13affd51d',           // "Job To Be Declined" (0 POL)
  '0x771a13afc3007',           // "Full Lifecycle Test Contract" (0 POL)
  '0x771a13afd358d',           // "Full Lifecycle Test Contract" (0 POL)
  '0x771a13affd266',           // "Full Lifecycle Test Contract" (0 POL)
  'job-verify-1791982369172',   // "DeFi Subgraph & Indexer Architecture" (synthetic wallet)
  '0xeeacc05a99a2',           // "Testing Site " (0 POL)
  '0x03B7a86F3bfC',           // "Testing WebRTC & Web Socket" (0 MATIC)
].map(id => id.toLowerCase().trim());

const CATEGORY_A_SET = new Set(CATEGORY_A_JOB_IDS);

async function runCategoryACleanup() {
  console.log('=== Executing Category (a) Hard Delete ===\n');

  await prisma.$connect();

  // 1. Delete from PostgreSQL MessageIndex & ConversationKeyRegistry
  const msgDel = await prisma.messageIndex.deleteMany({
    where: {
      jobAddress: { in: CATEGORY_A_JOB_IDS },
    },
  });
  console.log(`- Deleted ${msgDel.count} orphaned MessageIndex records`);

  const keyDel = await prisma.conversationKeyRegistry.deleteMany({
    where: {
      jobAddress: { in: CATEGORY_A_JOB_IDS },
    },
  });
  console.log(`- Deleted ${keyDel.count} orphaned ConversationKeyRegistry records`);

  // 2. Delete from PostgreSQL JobRecord
  const jobDel = await prisma.jobRecord.deleteMany({
    where: {
      OR: [
        { id: { in: CATEGORY_A_JOB_IDS } },
        { id: { in: CATEGORY_A_JOB_IDS.map(id => id.toUpperCase()) } },
      ],
    },
  });
  console.log(`- Deleted ${jobDel.count} PostgreSQL JobRecord rows`);

  // 3. Delete from PostgreSQL ProtocolSharedState ('global_state')
  const pss = await prisma.protocolSharedState.findUnique({ where: { key: 'global_state' } });
  if (pss && pss.data) {
    const data: any = pss.data;
    if (Array.isArray(data.jobs)) {
      const beforeCount = data.jobs.length;
      data.jobs = data.jobs.filter((j: any) => !CATEGORY_A_SET.has(String(j.id || '').toLowerCase().trim()));
      console.log(`- PostgreSQL ProtocolSharedState jobs filtered: ${beforeCount} -> ${data.jobs.length} (removed ${beforeCount - data.jobs.length})`);
    }
    // Also add to deletedJobIds in global state so clients get real-time purge event
    if (!Array.isArray(data.deletedJobIds)) data.deletedJobIds = [];
    CATEGORY_A_JOB_IDS.forEach(id => {
      if (!data.deletedJobIds.includes(id)) data.deletedJobIds.push(id);
    });

    await prisma.protocolSharedState.update({
      where: { key: 'global_state' },
      data: { data },
    });
    console.log(`- Updated PostgreSQL ProtocolSharedState`);
  }

  // 4. Update Root polylance_shared_state.json
  const rootStatePath = path.resolve('c:/Movies/Polylance/polylance/polylance_shared_state.json');
  if (fs.existsSync(rootStatePath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(rootStatePath, 'utf8'));
      if (Array.isArray(raw.jobs)) {
        const before = raw.jobs.length;
        raw.jobs = raw.jobs.filter((j: any) => !CATEGORY_A_SET.has(String(j.id || '').toLowerCase().trim()));
        console.log(`- Root polylance_shared_state.json jobs: ${before} -> ${raw.jobs.length} (removed ${before - raw.jobs.length})`);
      }
      if (!Array.isArray(raw.deletedJobIds)) raw.deletedJobIds = [];
      CATEGORY_A_JOB_IDS.forEach(id => {
        if (!raw.deletedJobIds.includes(id)) raw.deletedJobIds.push(id);
      });
      fs.writeFileSync(rootStatePath, JSON.stringify(raw, null, 2), 'utf8');
      console.log(`- Saved Root polylance_shared_state.json`);
    } catch (err: any) {
      console.warn(`Warning updating root state:`, err.message);
    }
  }

  // 5. Update Chat-Service polylance_shared_state.json
  const csStatePath = path.resolve('c:/Movies/Polylance/polylance/polylance-chat-service/polylance_shared_state.json');
  if (fs.existsSync(csStatePath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(csStatePath, 'utf8'));
      if (Array.isArray(raw.jobs)) {
        const before = raw.jobs.length;
        raw.jobs = raw.jobs.filter((j: any) => !CATEGORY_A_SET.has(String(j.id || '').toLowerCase().trim()));
        console.log(`- Chat-Service polylance_shared_state.json jobs: ${before} -> ${raw.jobs.length} (removed ${before - raw.jobs.length})`);
      }
      if (!Array.isArray(raw.deletedJobIds)) raw.deletedJobIds = [];
      CATEGORY_A_JOB_IDS.forEach(id => {
        if (!raw.deletedJobIds.includes(id)) raw.deletedJobIds.push(id);
      });
      fs.writeFileSync(csStatePath, JSON.stringify(raw, null, 2), 'utf8');
      console.log(`- Saved Chat-Service polylance_shared_state.json`);
    } catch (err: any) {
      console.warn(`Warning updating chat service state:`, err.message);
    }
  }

  await prisma.$disconnect();
  console.log('\n=== Category (a) Cleanup Complete ===');
}

runCategoryACleanup().catch(console.error);
