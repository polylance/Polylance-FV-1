-- Rollback 0003: Remove PortfolioLink Table and Indexes

DROP INDEX IF EXISTS "PortfolioLink_category_tag_idx";
DROP INDEX IF EXISTS "PortfolioLink_wallet_position_idx";
DROP TABLE IF EXISTS "PortfolioLink";
