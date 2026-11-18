-- Additive reservation and receipt audit fields. Existing saves/slots remain valid.
ALTER TABLE "GameCommandReceipt" ADD COLUMN "generationStatus" TEXT, ADD COLUMN "generationReason" TEXT;
CREATE TABLE "GamePendingGeneration" (
  "sessionId" UUID NOT NULL,
  "commandId" UUID NOT NULL,
  "requestDigest" TEXT NOT NULL,
  "nextState" JSONB NOT NULL,
  "request" JSONB NOT NULL,
  "deadlineAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GamePendingGeneration_pkey" PRIMARY KEY ("sessionId"),
  CONSTRAINT "GamePendingGeneration_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
