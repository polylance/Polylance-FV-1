-- Rollback 0001: Reverts job category columns, profile ranking columns, indexes, and legacy mapping table.

DROP TABLE IF EXISTS "CategoryLegacyMapping";

DROP INDEX IF EXISTS "ProfileRecord_rep_global_idx";
DROP INDEX IF EXISTS "ProfileRecord_primary_cat_rep_idx";

ALTER TABLE "ProfileRecord"
  DROP COLUMN IF EXISTS "completed_jobs_count",
  DROP COLUMN IF EXISTS "reputation_points",
  DROP COLUMN IF EXISTS "primary_category_id";

DROP INDEX IF EXISTS "JobRecord_subcategory_id_status_idx";
DROP INDEX IF EXISTS "JobRecord_category_id_status_createdAt_idx";

ALTER TABLE "JobRecord"
  DROP COLUMN IF EXISTS "legacy_category",
  DROP COLUMN IF EXISTS "subcategory_id",
  DROP COLUMN IF EXISTS "category_id";
