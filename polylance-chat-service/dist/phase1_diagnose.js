import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();
async function main() {
    console.log('=== PHASE 1: COMPREHENSIVE READ-ONLY DIAGNOSIS ===\n');
    // 1. Check PostgreSQL JobRecord table
    const pgJobs = await prisma.jobRecord.findMany();
    console.log(`[PG] prisma.jobRecord total rows: ${pgJobs.length}`);
    pgJobs.forEach(j => {
        console.log(`  - JobRecord ID: ${j.id} | Contract: ${j.contractAddress} | Client: ${j.client} | Status: ${j.status} | TokenId: ${j.onchainTokenId}`);
    });
    // 2. Check PostgreSQL ProtocolSharedState table
    const pss = await prisma.protocolSharedState.findUnique({ where: { key: 'global_state' } });
    const pssJobs = pss?.data?.jobs || [];
    console.log(`\n[PG] prisma.protocolSharedState ('global_state') jobs count: ${pssJobs.length}`);
    // 3. Check Root polylance_shared_state.json
    const rootStatePath = path.resolve('c:/Movies/Polylance/polylance/polylance_shared_state.json');
    let rootStateJobs = [];
    if (fs.existsSync(rootStatePath)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(rootStatePath, 'utf8'));
            rootStateJobs = parsed.jobs || [];
            console.log(`[FILE] Root polylance_shared_state.json exists! Jobs count: ${rootStateJobs.length}`);
        }
        catch (e) {
            console.log(`[FILE] Root state parse error: ${e.message}`);
        }
    }
    else {
        console.log(`[FILE] Root polylance_shared_state.json NOT found`);
    }
    // 4. Check Chat-Service polylance_shared_state.json
    const csStatePath = path.resolve('c:/Movies/Polylance/polylance/polylance-chat-service/polylance_shared_state.json');
    let csStateJobs = [];
    if (fs.existsSync(csStatePath)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(csStatePath, 'utf8'));
            csStateJobs = parsed.jobs || [];
            console.log(`[FILE] Chat-service polylance_shared_state.json exists! Jobs count: ${csStateJobs.length}`);
        }
        catch (e) {
            console.log(`[FILE] Chat-service state parse error: ${e.message}`);
        }
    }
    // Combine all sources to find all distinct jobs
    const allJobsMap = new Map();
    // From root file
    rootStateJobs.forEach(j => {
        if (j?.id)
            allJobsMap.set(String(j.id).toLowerCase(), { source: 'root_file', ...j });
    });
    // From chat service file
    csStateJobs.forEach(j => {
        if (j?.id && !allJobsMap.has(String(j.id).toLowerCase())) {
            allJobsMap.set(String(j.id).toLowerCase(), { source: 'cs_file', ...j });
        }
    });
    // From PSS
    pssJobs.forEach(j => {
        if (j?.id && !allJobsMap.has(String(j.id).toLowerCase())) {
            allJobsMap.set(String(j.id).toLowerCase(), { source: 'pss_db', ...j });
        }
    });
    // From PG JobRecord
    pgJobs.forEach(j => {
        const idKey = String(j.id).toLowerCase();
        const existing = allJobsMap.get(idKey);
        const dbData = j.data || {};
        allJobsMap.set(idKey, {
            source: existing ? `${existing.source}+pg_job_record` : 'pg_job_record',
            ...dbData,
            ...j,
        });
    });
    console.log(`\nTotal unique jobs discovered across all sources: ${allJobsMap.size}`);
    // Inspect the candidate jobs seen in UI:
    const candidateTitles = [
        'job to be declined',
        'full lifecycle test contract',
        'defi subgraph & indexer architecture',
        'test payment workflow',
        'xmtp message test',
    ];
    console.log('\n================ CANDIDATE JOBS DETAILED AUDIT ================\n');
    for (const [id, job] of allJobsMap.entries()) {
        const titleLower = String(job.title || '').toLowerCase();
        const isCandidate = candidateTitles.some(t => titleLower.includes(t)) ||
            String(job.amountEth || job.amountUsdc || '') === '0.00' ||
            String(job.amountEth || job.amountUsdc || '') === '0';
        if (isCandidate) {
            const contractAddr = job.contractAddress || job.escrowAddress || '';
            const chatMsgs = job.chatMessages || [];
            const judgeMsgs = job.judgeMessages || [];
            const proposals = job.applications || [];
            const negProposals = job.negotiationProposals || [];
            const deliverables = job.deliverables || [];
            const hasOnchainJobId = Boolean(job.onchainJobId || job.onChainJobId);
            const hasTxHash = Boolean(job.txHash || job.creationTxHash || job.fundTxHash || job.releaseTxHash);
            const hasEscrowContract = Boolean(contractAddr && contractAddr.startsWith('0x') && contractAddr.length === 42 && !contractAddr.startsWith('0x000000000000'));
            const isFunded = job.status === 'Funded' || Boolean(job.escrowStatus === 'FUNDED') || Boolean(job.events?.some((e) => e.step === 'Funded' && e.status === 'completed'));
            const onchainBacked = hasOnchainJobId || (hasEscrowContract && hasTxHash);
            const moneyLocked = isFunded && job.status !== 'Completed' && job.status !== 'Cancelled' && job.status !== 'Refunded';
            console.log(`--------------------------------------------------`);
            console.log(`ID: ${job.id}`);
            console.log(`Title: "${job.title}"`);
            console.log(`Source: ${job.source}`);
            console.log(`Budget: ${job.amountEth ?? job.amountUsdc ?? 'N/A'} ${job.paymentTokenSymbol ?? (job.amountEth ? 'POL' : 'USDC')}`);
            console.log(`Created At: ${job.createdAt ? new Date(job.createdAt).toISOString() : 'N/A'} (${job.createdAt})`);
            console.log(`Client Wallet: ${job.client}`);
            console.log(`Freelancer Wallet: ${job.freelancer || 'None selected'}`);
            console.log(`Status: ${job.status}`);
            console.log(`On-Chain Job ID: ${job.onchainJobId || job.onChainJobId || 'None'}`);
            console.log(`Tx Hash: ${job.txHash || job.creationTxHash || job.fundTxHash || 'None'}`);
            console.log(`Escrow Address: ${contractAddr || 'None'}`);
            console.log(`Funded State: ${isFunded ? 'FUNDED' : 'UNFUNDED'} (status: ${job.status})`);
            console.log(`Proposals Count: ${proposals.length} applications, ${negProposals.length} negotiation proposals`);
            console.log(`Engagements: ${JSON.stringify(job.engagement || 'None')}`);
            console.log(`Messages Count: ${chatMsgs.length} chat messages, ${judgeMsgs.length} judge messages`);
            console.log(`Notifications: ${(job.notifications || []).length}`);
            console.log(`Deliverables: ${deliverables.length}`);
            console.log(`Reviews: ${JSON.stringify(job.reviews || job.feedback || 'None')}`);
            console.log(`Certificates: ${job.sbtTokenId || job.onchainTokenId ? `SBT ID: ${job.sbtTokenId || job.onchainTokenId}` : 'None'}`);
            console.log(`Activity Log Entries: ${(job.events || []).length} events`);
            console.log(`>> ON-CHAIN BACKED? ${onchainBacked ? 'YES' : 'NO'}`);
            console.log(`>> MONEY LOCKED? ${moneyLocked ? 'YES (FUNDS AT RISK)' : 'NO'}`);
            console.log(`--------------------------------------------------\n`);
        }
    }
    // 5. Scan DB for all other test-like rows
    console.log('\n================ ALL OTHER TEST-LIKE ROWS SCAN ================\n');
    const testKeywords = ['test', 'demo', 'sample', 'xmtp', 'lifecycle', 'dummy', 'check'];
    const testWallets = new Set([
        '0x71c8417937a8c822606552277d33b5c654d24177',
        '0x333333330000000000000000000001a13a8c2fb1',
        '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
        '0x3333444455556666777788889999000011112222',
        '0x9999999999999999999999999999999999999999',
        '0x5555555555555555555555555555555555555555'
    ]);
    const categoryA = [];
    const categoryB = [];
    const categoryC = [];
    for (const [id, job] of allJobsMap.entries()) {
        const titleLower = String(job.title || '').toLowerCase();
        const descLower = String(job.description || '').toLowerCase();
        const clientLower = String(job.client || '').toLowerCase();
        const budgetVal = parseFloat(job.amountEth || job.amountUsdc || '0');
        const matchesKeyword = testKeywords.some(kw => titleLower.includes(kw) || descLower.includes(kw));
        const matchesWallet = testWallets.has(clientLower);
        const isZeroBudget = budgetVal === 0;
        if (matchesKeyword || matchesWallet || isZeroBudget) {
            const contractAddr = job.contractAddress || job.escrowAddress || '';
            const hasOnchainJobId = Boolean(job.onchainJobId || job.onChainJobId);
            const hasTxHash = Boolean(job.txHash || job.creationTxHash || job.fundTxHash || job.releaseTxHash);
            const hasEscrowContract = Boolean(contractAddr && contractAddr.startsWith('0x') && contractAddr.length === 42 && !contractAddr.startsWith('0x000000000000'));
            const isFunded = job.status === 'Funded' || Boolean(job.escrowStatus === 'FUNDED');
            const onchainFootprint = hasOnchainJobId || (hasEscrowContract && hasTxHash) || isFunded;
            if (!onchainFootprint && budgetVal === 0 && matchesKeyword) {
                categoryA.push(job);
            }
            else if (onchainFootprint) {
                categoryB.push(job);
            }
            else {
                categoryC.push(job);
            }
        }
    }
    console.log(`Scan Summary:`);
    console.log(`- Category (a) [Clearly test, NO chain/money footprint]: ${categoryA.length}`);
    categoryA.forEach(j => console.log(`   * ${j.id}: "${j.title}" (${j.amountEth || j.amountUsdc} ${j.paymentTokenSymbol || 'POL'}, client: ${j.client})`));
    console.log(`\n- Category (b) [On-chain backed or money history]: ${categoryB.length}`);
    categoryB.forEach(j => console.log(`   * ${j.id}: "${j.title}" (${j.amountEth || j.amountUsdc} ${j.paymentTokenSymbol || 'POL'}, contract: ${j.contractAddress}, status: ${j.status})`));
    console.log(`\n- Category (c) [Uncertain / Needs user review]: ${categoryC.length}`);
    categoryC.forEach(j => console.log(`   * ${j.id}: "${j.title}" (${j.amountEth || j.amountUsdc} ${j.paymentTokenSymbol || 'POL'}, client: ${j.client}, status: ${j.status})`));
    await prisma.$disconnect();
}
main().catch(console.error);
