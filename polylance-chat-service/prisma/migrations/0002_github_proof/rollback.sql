-- Rollback 0002: Remove GithubProof Table and Indexes

DROP INDEX IF EXISTS "GithubProof_last_synced_at_idx";
DROP INDEX IF EXISTS "GithubProof_github_login_idx";
DROP TABLE IF EXISTS "GithubProof";
