import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();
const TARGET_JOB_IDS = [
    '0x71c8a185b376', // DeFi Subgraph & Indexer Architecture
    '0x37835B31461a', // Test Payment Workflow 
    '0x2F463F3dB8C0', // XMTP Message Test
].map(id => id.toLowerCase().trim());
const TARGET_SET = new Set(TARGET_JOB_IDS);
async function runCleanup() {
    console.log('=== Executing Hard Delete for Remaining 3 Test Jobs ===\n');
    await prisma.$connect();
    // 1. Delete message indexes and conversation keys
    const msgDel = await prisma.messageIndex.deleteMany({
        where: {
            jobAddress: { in: TARGET_JOB_IDS },
        },
    });
    console.log(`- Deleted ${msgDel.count} MessageIndex records`);
    const keyDel = await prisma.conversationKeyRegistry.deleteMany({
        where: {
            jobAddress: { in: TARGET_JOB_IDS },
        },
    });
    console.log(`- Deleted ${keyDel.count} ConversationKeyRegistry records`);
    // 2. Delete from JobRecord
    const jobDel = await prisma.jobRecord.deleteMany({
        where: {
            OR: [
                { id: { in: TARGET_JOB_IDS } },
                { id: { in: TARGET_JOB_IDS.map(id => id.toUpperCase()) } },
            ],
        },
    });
    console.log(`- Deleted ${jobDel.count} PostgreSQL JobRecord rows`);
    // 3. Update PostgreSQL ProtocolSharedState ('global_state')
    const pss = await prisma.protocolSharedState.findUnique({ where: { key: 'global_state' } });
    if (pss && pss.data) {
        const data = pss.data;
        if (Array.isArray(data.jobs)) {
            const beforeCount = data.jobs.length;
            data.jobs = data.jobs.filter((j) => !TARGET_SET.has(String(j.id || '').toLowerCase().trim()));
            console.log(`- PostgreSQL ProtocolSharedState jobs: ${beforeCount} -> ${data.jobs.length} (removed ${beforeCount - data.jobs.length})`);
        }
        if (!Array.isArray(data.deletedJobIds))
            data.deletedJobIds = [];
        TARGET_JOB_IDS.forEach(id => {
            if (!data.deletedJobIds.includes(id))
                data.deletedJobIds.push(id);
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
                raw.jobs = raw.jobs.filter((j) => !TARGET_SET.has(String(j.id || '').toLowerCase().trim()));
                console.log(`- Root polylance_shared_state.json jobs: ${before} -> ${raw.jobs.length} (removed ${before - raw.jobs.length})`);
            }
            if (!Array.isArray(raw.deletedJobIds))
                raw.deletedJobIds = [];
            TARGET_JOB_IDS.forEach(id => {
                if (!raw.deletedJobIds.includes(id))
                    raw.deletedJobIds.push(id);
            });
            fs.writeFileSync(rootStatePath, JSON.stringify(raw, null, 2), 'utf8');
            console.log(`- Saved Root polylance_shared_state.json`);
        }
        catch (err) {
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
                raw.jobs = raw.jobs.filter((j) => !TARGET_SET.has(String(j.id || '').toLowerCase().trim()));
                console.log(`- Chat-Service polylance_shared_state.json jobs: ${before} -> ${raw.jobs.length} (removed ${before - raw.jobs.length})`);
            }
            if (!Array.isArray(raw.deletedJobIds))
                raw.deletedJobIds = [];
            TARGET_JOB_IDS.forEach(id => {
                if (!raw.deletedJobIds.includes(id))
                    raw.deletedJobIds.push(id);
            });
            fs.writeFileSync(csStatePath, JSON.stringify(raw, null, 2), 'utf8');
            console.log(`- Saved Chat-Service polylance_shared_state.json`);
        }
        catch (err) {
            console.warn(`Warning updating chat service state:`, err.message);
        }
    }
    await prisma.$disconnect();
    console.log('\n=== Hard Delete of Remaining 3 Test Jobs Complete ===');
}
runCleanup().catch(console.error);
