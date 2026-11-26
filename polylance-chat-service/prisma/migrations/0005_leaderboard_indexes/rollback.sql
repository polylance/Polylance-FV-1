-- Rollback 0005: Drop Leaderboard Join Indexes

DROP INDEX IF EXISTS "CertificateRecord_holder_type_status_idx";
DROP INDEX IF EXISTS "JobRecord_freelancer_status_idx";
