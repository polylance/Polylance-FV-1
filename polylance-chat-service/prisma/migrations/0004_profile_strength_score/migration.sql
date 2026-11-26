-- Migration 0004: Transparent Rule-Based Profile Strength Score Snapshot (Private Until Live)

CREATE TABLE IF NOT EXISTS "ProfileStrengthScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wallet_address" TEXT NOT NULL UNIQUE,
    "status" TEXT NOT NULL DEFAULT 'demo',
    "value" INTEGER,
    "factors" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "model_version" TEXT NOT NULL DEFAULT 'rule-demo-v1.0.0',
    "opted_out" BOOLEAN NOT NULL DEFAULT FALSE,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ProfileStrengthScore_status_idx"
    ON "ProfileStrengthScore" ("status");
