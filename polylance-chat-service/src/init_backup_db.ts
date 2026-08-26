import { PrismaClient } from '@prisma/client';

const backupUrl = 'postgres://17a77f3e1cb2f34728bd50b80dd36257b564ba4864ae9693229ee3276fe81b91:sk_YbuOIT2V-RXc7UJIwd01U@pooled.db.prisma.io:5432/postgres?sslmode=require';

const backup = new PrismaClient({
  datasources: {
    db: { url: backupUrl },
  },
});

async function main() {
  console.log('Connecting to Backup Database...');
  await backup.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProtocolSharedState" (
      "key" TEXT PRIMARY KEY,
      "data" JSONB NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await backup.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "JobRecord" (
      "id" TEXT PRIMARY KEY,
      "contractAddress" TEXT,
      "client" TEXT NOT NULL,
      "freelancer" TEXT,
      "status" TEXT NOT NULL,
      "data" JSONB NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await backup.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProfileRecord" (
      "address" TEXT PRIMARY KEY,
      "data" JSONB NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('SUCCESS: All tables created in Backup Database (Prisma Cloud)!');
}

main()
  .catch(console.error)
  .finally(() => backup.$disconnect());
