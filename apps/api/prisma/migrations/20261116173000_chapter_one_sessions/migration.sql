-- Preserve foundation-only session rows; they are not resumable without a capability.
ALTER TABLE "GameSession"
  ADD COLUMN "tokenDigest" TEXT,
  ADD COLUMN "narrativeVersion" TEXT,
  ADD COLUMN "state" JSONB,
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "GameSession_tokenDigest_key" ON "GameSession"("tokenDigest");
CREATE TABLE "GameCommandReceipt" (
  "sessionId" UUID NOT NULL,
  "commandId" UUID NOT NULL,
  "requestDigest" TEXT NOT NULL,
  "appliedRevision" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GameCommandReceipt_pkey" PRIMARY KEY ("sessionId", "commandId"),
  CONSTRAINT "GameCommandReceipt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_revision_nonnegative" CHECK ("revision" >= 0);
