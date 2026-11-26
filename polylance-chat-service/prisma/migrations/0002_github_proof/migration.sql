-- Migration 0002: Minimal-Scope GitHub Proof Snapshots (No Tokens, No Email, No Phone)

CREATE TABLE IF NOT EXISTS "GithubProof" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wallet_address" TEXT NOT NULL UNIQUE,
    "github_id" TEXT NOT NULL UNIQUE,
    "github_login" TEXT NOT NULL,
    "stats_snapshot" JSONB NOT NULL,
    "last_synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "GithubProof_github_login_idx"
    ON "GithubProof" ("github_login");

CREATE INDEX IF NOT EXISTS "GithubProof_last_synced_at_idx"
    ON "GithubProof" ("last_synced_at" DESC);
