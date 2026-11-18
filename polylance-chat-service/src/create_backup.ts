import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve('c:/Movies/Polylance/polylance/polylance-chat-service/backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFilename = `full_db_backup_${timestamp}.json`;
  const backupPath = path.join(backupDir, backupFilename);

  console.log(`Starting full database backup at ${new Date().toISOString()}...`);

  // 1. Fetch all PostgreSQL tables
  const jobRecords = await prisma.jobRecord.findMany();
  const certificateRecords = await prisma.certificateRecord.findMany();
  const profileRecords = await prisma.profileRecord.findMany();
  const conversationKeys = await prisma.conversationKeyRegistry.findMany();
  const messageIndexes = await prisma.messageIndex.findMany();
  const protocolSharedState = await prisma.protocolSharedState.findMany();

  // 2. Fetch local shared state file
  const localStateFile = path.resolve('c:/Movies/Polylance/polylance/polylance-chat-service/polylance_shared_state.json');
  let localSharedState = null;
  if (fs.existsSync(localStateFile)) {
    localSharedState = JSON.parse(fs.readFileSync(localStateFile, 'utf8'));
  }

  const fullBackupPayload = {
    metadata: {
      timestamp: new Date().toISOString(),
      backupFile: backupFilename,
      nodeVersion: process.version,
      source: 'Render PostgreSQL & Local polylance_shared_state.json',
      counts: {
        postgresJobRecord: jobRecords.length,
        postgresCertificateRecord: certificateRecords.length,
        postgresProfileRecord: profileRecords.length,
        postgresConversationKeyRegistry: conversationKeys.length,
        postgresMessageIndex: messageIndexes.length,
        postgresProtocolSharedState: protocolSharedState.length,
        localSharedStateJobs: localSharedState?.jobs?.length || 0,
        localSharedStateProfiles: Object.keys(localSharedState?.profiles || {}).length,
      }
    },
    postgres: {
      JobRecord: jobRecords,
      CertificateRecord: certificateRecords,
      ProfileRecord: profileRecords,
      ConversationKeyRegistry: conversationKeys,
      MessageIndex: messageIndexes,
      ProtocolSharedState: protocolSharedState,
    },
    localSharedState,
  };

  fs.writeFileSync(backupPath, JSON.stringify(fullBackupPayload, null, 2), 'utf8');

  // Also write a copy to the brain artifacts directory
  const artifactDir = path.resolve('C:/Users/sunny/.gemini/antigravity-ide/brain/84d39d38-9a99-4b66-875f-cec24335fb5e');
  const artifactBackupPath = path.join(artifactDir, backupFilename);
  fs.writeFileSync(artifactBackupPath, JSON.stringify(fullBackupPayload, null, 2), 'utf8');

  console.log('✅ BACKUP COMPLETE!');
  console.log('Primary Backup Location:', backupPath);
  console.log('Artifact Backup Location:', artifactBackupPath);
  console.log('Counts:', fullBackupPayload.metadata.counts);

  await prisma.$disconnect();
}

createBackup().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
