-- Migration 0003: Non-Tech Portfolio Links (Strict Format Validation, No Server Fetching)

CREATE TABLE IF NOT EXISTS "PortfolioLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wallet_address" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "category_tag" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "PortfolioLink_wallet_position_idx"
    ON "PortfolioLink" ("wallet_address", "position");

CREATE INDEX IF NOT EXISTS "PortfolioLink_category_tag_idx"
    ON "PortfolioLink" ("category_tag");
