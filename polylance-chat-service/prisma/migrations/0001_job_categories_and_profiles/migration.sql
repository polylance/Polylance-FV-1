-- Migration 0001: Job Categories, Profile Category & Leaderboard Columns, Legacy Category Mapping
-- Generated cleanly; DO NOT execute against production DB without explicit approval.

ALTER TABLE "JobRecord"
  ADD COLUMN IF NOT EXISTS "category_id" TEXT,
  ADD COLUMN IF NOT EXISTS "subcategory_id" TEXT,
  ADD COLUMN IF NOT EXISTS "legacy_category" TEXT;

CREATE INDEX IF NOT EXISTS "JobRecord_category_id_status_createdAt_idx"
  ON "JobRecord" ("category_id", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "JobRecord_subcategory_id_status_idx"
  ON "JobRecord" ("subcategory_id", "status");

ALTER TABLE "ProfileRecord"
  ADD COLUMN IF NOT EXISTS "primary_category_id" TEXT,
  ADD COLUMN IF NOT EXISTS "reputation_points" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "completed_jobs_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "ProfileRecord_primary_cat_rep_idx"
  ON "ProfileRecord" ("primary_category_id", "reputation_points" DESC, "completed_jobs_count" DESC, "address" ASC);

CREATE INDEX IF NOT EXISTS "ProfileRecord_rep_global_idx"
  ON "ProfileRecord" ("reputation_points" DESC, "completed_jobs_count" DESC, "address" ASC);

CREATE TABLE IF NOT EXISTS "CategoryLegacyMapping" (
  "legacy_key" TEXT PRIMARY KEY,
  "category_id" TEXT NOT NULL,
  "subcategory_id" TEXT NOT NULL,
  "display_fallback" TEXT NOT NULL DEFAULT 'Legacy',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "CategoryLegacyMapping" ("legacy_key", "category_id", "subcategory_id", "display_fallback")
VALUES
  ('web3', 'cat_web3_block', 'sub_smart_contracts', 'Legacy'),
  ('frontend', 'cat_dev_it', 'sub_web_dev', 'Legacy'),
  ('backend', 'cat_dev_it', 'sub_software_apis', 'Legacy'),
  ('mobile', 'cat_dev_it', 'sub_mobile_dev', 'Legacy')
ON CONFLICT ("legacy_key") DO NOTHING;
