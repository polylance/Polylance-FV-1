import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();
// The 4 real on-chain jobs that MUST be preserved
const REAL_JOB_IDS = new Set([
    '0xcf3665d90001',
    '0x99801f9e280b',
    '0x0d34f6b4fb25',
    '0x91175c581877',
]);
const REAL_JOB_CONTRACTS = new Set([
    '0xcf3665d90001e7335a3eca9a00ceb2d88f9e9550',
    '0xa1b17f36c1927d53b0efe67881d3ded9896dd9b8',
    '0x0d34f6b4fb25662ac798a4971664e591f253d00b',
    '0x91175c5818774af92f8669df56354e84980a18ff',
]);
// Real On-Chain SBT Tokens (0, 1, 2)
const REAL_TOKEN_IDS = new Set([0, 1, 2]);
async function runCleanup() {
    console.log('=== Starting PolyLance Phase 4 Database Cleanup ===');
    await prisma.$connect();
    const allJobs = await prisma.jobRecord.findMany();
    const allCerts = await prisma.certificateRecord.findMany();
    const allProfiles = await prisma.profileRecord.findMany();
    console.log(`Initial Counts:`);
    console.log(`- JobRecord: ${allJobs.length}`);
    console.log(`- CertificateRecord: ${allCerts.length}`);
    console.log(`- ProfileRecord: ${allProfiles.length} (all will be preserved)`);
    const fakeJobIdsToDelete = [];
    for (const j of allJobs) {
        const idLower = (j.id || '').toLowerCase();
        const contractLower = (j.contractAddress || '').toLowerCase();
        const isReal = REAL_JOB_IDS.has(idLower) ||
            REAL_JOB_CONTRACTS.has(contractLower) ||
            (j.onchainTokenId !== null && REAL_TOKEN_IDS.has(j.onchainTokenId));
        if (!isReal) {
            fakeJobIdsToDelete.push(j.id);
        }
    }
    const fakeCertIdsToDelete = [];
    for (const c of allCerts) {
        const isRealToken = c.onchainTokenId !== null && REAL_TOKEN_IDS.has(c.onchainTokenId);
        if (!isRealToken) {
            fakeCertIdsToDelete.push(c.id);
        }
    }
    console.log(`\nIdentified for Cleanup:`);
    console.log(`- Fake Jobs to Delete: ${fakeJobIdsToDelete.length}`);
    console.log(`- Fake Certificates to Delete: ${fakeCertIdsToDelete.length}`);
    console.log(`- Real Jobs Preserved: ${allJobs.length - fakeJobIdsToDelete.length}`);
    console.log(`- Real Certificates Preserved: ${allCerts.length - fakeCertIdsToDelete.length}`);
    // Transactional PostgreSQL Deletion
    const deleteResult = await prisma.$transaction(async (tx) => {
        // 1. Delete message indexes referencing fake jobs
        await tx.messageIndex.deleteMany({
            where: {
                jobAddress: { in: fakeJobIdsToDelete },
            },
        });
        // 2. Delete conversation key registries referencing fake jobs
        await tx.conversationKeyRegistry.deleteMany({
            where: {
                jobAddress: { in: fakeJobIdsToDelete },
            },
        });
        // 3. Delete fake CertificateRecords
        const certsDeleted = await tx.certificateRecord.deleteMany({
            where: {
                id: { in: fakeCertIdsToDelete },
            },
        });
        // 4. Delete fake JobRecords
        const jobsDeleted = await tx.jobRecord.deleteMany({
            where: {
                id: { in: fakeJobIdsToDelete },
            },
        });
        // 5. Update ProtocolSharedState if present
        const globalState = await tx.protocolSharedState.findFirst({ where: { key: 'global_state' } });
        if (globalState && globalState.data) {
            const data = globalState.data;
            if (Array.isArray(data.jobs)) {
                data.jobs = data.jobs.filter((j) => {
                    const idLower = String(j.id || '').toLowerCase();
                    return !fakeJobIdsToDelete.map(x => x.toLowerCase()).includes(idLower);
                });
            }
            await tx.protocolSharedState.update({
                where: { key: 'global_state' },
                data: { data },
            });
        }
        return {
            jobsDeleted: jobsDeleted.count,
            certsDeleted: certsDeleted.count,
        };
    }, {
        timeout: 45000,
        maxWait: 15000,
    });
    console.log(`\nPostgreSQL Cleanup Executed:`);
    console.log(`- Jobs Deleted: ${deleteResult.jobsDeleted}`);
    console.log(`- Certificates Deleted: ${deleteResult.certsDeleted}`);
    // Local polylance_shared_state.json synchronization
    const localStateFile = path.resolve('c:/Movies/Polylance/polylance/polylance-chat-service/polylance_shared_state.json');
    if (fs.existsSync(localStateFile)) {
        try {
            const localState = JSON.parse(fs.readFileSync(localStateFile, 'utf8'));
            if (Array.isArray(localState.jobs)) {
                const initialLocalJobs = localState.jobs.length;
                localState.jobs = localState.jobs.filter((j) => {
                    const idLower = String(j.id || '').toLowerCase();
                    return !fakeJobIdsToDelete.map(x => x.toLowerCase()).includes(idLower);
                });
                console.log(`- Local JSON jobs removed: ${initialLocalJobs - localState.jobs.length}`);
            }
            fs.writeFileSync(localStateFile, JSON.stringify(localState, null, 2), 'utf8');
            console.log(`- Updated ${localStateFile}`);
        }
        catch (localErr) {
            console.warn('Warning updating local JSON state:', localErr);
        }
    }
    // Verification After Counts
    const jobsAfter = await prisma.jobRecord.findMany();
    const certsAfter = await prisma.certificateRecord.findMany();
    const profilesAfter = await prisma.profileRecord.findMany();
    console.log(`\nAFTER COUNTS & INTEGRITY CHECK:`);
    console.log(`- Remaining JobRecords: ${jobsAfter.length}`);
    for (const j of jobsAfter) {
        console.log(`  * Job ${j.id} | Contract: ${j.contractAddress} | OnchainTokenId: ${j.onchainTokenId}`);
    }
    console.log(`- Remaining CertificateRecords: ${certsAfter.length}`);
    for (const c of certsAfter) {
        console.log(`  * Cert ${c.id} | TokenId: ${c.onchainTokenId} | Type: ${c.certType} | Holder: ${c.holderWallet}`);
    }
    console.log(`- Remaining ProfileRecords: ${profilesAfter.length} (100% preserved)`);
    await prisma.$disconnect();
    console.log('\n=== Cleanup Completed Successfully ===');
}
runCleanup().catch(err => {
    console.error('Fatal cleanup error:', err);
    process.exit(1);
});
