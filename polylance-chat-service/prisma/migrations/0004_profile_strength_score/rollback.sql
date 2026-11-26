-- Rollback 0004: Remove ProfileStrengthScore Table and Index

DROP INDEX IF EXISTS "ProfileStrengthScore_status_idx";
DROP TABLE IF EXISTS "ProfileStrengthScore";
