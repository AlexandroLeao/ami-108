import { Prisma } from '@prisma/client';

// Conservative portfolio defaults; below Groq's published Free daily request limit.
// Applied only when gameMode() is public on Vercel, never to local/private test state.
// A counter is charged on attempted provider use, including failures, to avoid retries.
export const MAX_PUBLIC_SESSIONS_PER_DAY = 50;
export const MAX_PUBLIC_AI_ATTEMPTS_PER_DAY = 100;

export type PublicBudget = 'session' | 'ai';

/** One atomic Postgres upsert per attempt, safe across serverless replicas.
 * Rows store UTC date and aggregate counts only: no IP, user ID or session token.
 * A failed query must NOT be interpreted as permission to bypass the budget.
 */
export async function acquirePublicBudget(
  tx: Prisma.TransactionClient,
  budget: PublicBudget,
): Promise<boolean> {
  if (budget === 'session') {
    const rows = await tx.$queryRaw<{ day: Date }[]>`
      INSERT INTO "PublicDailyUsage" ("day", "sessions", "modelRequests")
      VALUES ((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date, 1, 0)
      ON CONFLICT ("day") DO UPDATE
        SET "sessions" = "PublicDailyUsage"."sessions" + 1
        WHERE "PublicDailyUsage"."sessions" < ${MAX_PUBLIC_SESSIONS_PER_DAY}
      RETURNING "day"
    `;
    return rows.length === 1;
  }

  const rows = await tx.$queryRaw<{ day: Date }[]>`
    INSERT INTO "PublicDailyUsage" ("day", "sessions", "modelRequests")
    VALUES ((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date, 0, 1)
    ON CONFLICT ("day") DO UPDATE
      SET "modelRequests" = "PublicDailyUsage"."modelRequests" + 1
      WHERE "PublicDailyUsage"."modelRequests" < ${MAX_PUBLIC_AI_ATTEMPTS_PER_DAY}
    RETURNING "day"
  `;
  return rows.length === 1;
}
