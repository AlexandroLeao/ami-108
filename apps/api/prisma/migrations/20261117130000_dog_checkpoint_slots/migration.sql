-- Additive, preserves Chapter 1 sessions and command receipts.
CREATE TABLE "GameCheckpoint" (
  "sessionId" UUID NOT NULL,
  "checkpointId" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GameCheckpoint_pkey" PRIMARY KEY ("sessionId", "checkpointId"),
  CONSTRAINT "GameCheckpoint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "GameConsultationSlot" (
  "sessionId" UUID NOT NULL,
  "encounterId" TEXT NOT NULL,
  "slotIndex" INTEGER NOT NULL,
  "category" TEXT NOT NULL,
  "localizedText" JSONB NOT NULL,
  "recipe" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GameConsultationSlot_pkey" PRIMARY KEY ("sessionId", "encounterId", "slotIndex"),
  CONSTRAINT "GameConsultationSlot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GameConsultationSlot_index_range" CHECK ("slotIndex" BETWEEN 1 AND 3),
  CONSTRAINT "GameConsultationSlot_category_check" CHECK ("category" IN ('CORRECT', 'RANDOM'))
);
