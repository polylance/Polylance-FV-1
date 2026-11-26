-- Migration 0005: Indexed Join Columns for Category Reputation Leaderboard

CREATE INDEX IF NOT EXISTS "JobRecord_freelancer_status_idx"
    ON "JobRecord" ("freelancer", "status");

CREATE INDEX IF NOT EXISTS "CertificateRecord_holder_type_status_idx"
    ON "CertificateRecord" ("holderWallet", "certType", "status");
