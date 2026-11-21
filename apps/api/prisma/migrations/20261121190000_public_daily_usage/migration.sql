-- Additive, no existing saves or receipts are touched.
-- This is a UTC-day aggregate counter, not a user tracking table.
CREATE TABLE "PublicDailyUsage" (
  "day" DATE NOT NULL,
  "sessions" INTEGER NOT NULL DEFAULT 0,
  "modelRequests" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PublicDailyUsage_pkey" PRIMARY KEY ("day"),
  CONSTRAINT "PublicDailyUsage_sessions_nonnegative" CHECK ("sessions" >= 0),
  CONSTRAINT "PublicDailyUsage_ai_nonnegative" CHECK ("modelRequests" >= 0)
);
