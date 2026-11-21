// Read-only preflight/verification around manual, owner-approved Prisma migration.
// Never print credentials, connection strings, session data or raw Prisma errors.
const { PrismaClient } = require('@prisma/client');

const EXPECTED_HOST = 'ep-fragrant-sea-bcndj0xm.c-16.us-east-1.aws.neon.tech';
const REQUIRED_TABLES = new Set([
  '_prisma_migrations', 'GameSession', 'GameCommandReceipt',
  'GameCheckpoint', 'GameConsultationSlot', 'GamePendingGeneration',
  'PublicDailyUsage',
]);

function destination() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('MISSING_SECRET');
  let parsed;
  try { parsed = new URL(raw); } catch { throw new Error('INVALID_TARGET'); }
  if (!['postgresql:', 'postgres:'].includes(parsed.protocol)
    || parsed.hostname !== EXPECTED_HOST || parsed.pathname !== '/ami'
    || parsed.username !== 'ami_app' || !parsed.password || parsed.port
    || !['require', 'verify-full'].includes(parsed.searchParams.get('sslmode'))
    || parsed.hash || parsed.searchParams.get('schema') === 'other') {
    throw new Error('INVALID_TARGET');
  }
  return raw;
}

async function main() {
  const stage = process.argv[2];
  if (!['before', 'after'].includes(stage)) throw new Error('INVALID_STAGE');
  if (process.env.GITHUB_REF !== 'refs/heads/main'
    || process.env.AMI_PRODUCTION_MIGRATION_CONFIRM !== 'MIGRATE_EMPTY_AMI_PRODUCTION') {
    throw new Error('NOT_AUTHORIZED');
  }
  const db = new PrismaClient({ datasourceUrl: destination() });
  try {
    const identity = await db.$queryRawUnsafe('SELECT current_database() AS name, current_user AS role');
    if (identity.length !== 1 || identity[0].name !== 'ami' || identity[0].role !== 'ami_app') {
      throw new Error('DATABASE_IDENTITY_MISMATCH');
    }
    const rows = await db.$queryRawUnsafe(
      "SELECT table_name AS name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
    );
    const tables = new Set(rows.map(x => x.name));
    if (stage === 'before') {
      if (tables.size !== 0) throw new Error('PRODUCTION_SCHEMA_NOT_EMPTY');
      console.log('Verified target and empty Production schema; migration may proceed.');
    } else {
      const missing = [...REQUIRED_TABLES].filter(name => !tables.has(name));
      if (missing.length > 0) throw new Error('INCOMPLETE_MIGRATIONS');
      const states = await db.$queryRawUnsafe(
        'SELECT COUNT(*)::integer AS count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL'
      );
      if (states.length !== 1 || states[0].count !== 5) throw new Error('MIGRATION_COUNT_MISMATCH');
      const saved = await db.$queryRawUnsafe('SELECT COUNT(*)::integer AS count FROM "GameSession"');
      if (saved.length !== 1 || saved[0].count !== 0) throw new Error('UNEXPECTED_PRODUCTION_SESSIONS');
      console.log('Five tracked migrations applied; required tables exist, zero game sessions.');
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch(error => {
  const allowed = new Set([
    'MISSING_SECRET', 'INVALID_TARGET', 'INVALID_STAGE', 'NOT_AUTHORIZED',
    'DATABASE_IDENTITY_MISMATCH', 'PRODUCTION_SCHEMA_NOT_EMPTY',
    'INCOMPLETE_MIGRATIONS', 'MIGRATION_COUNT_MISMATCH', 'UNEXPECTED_PRODUCTION_SESSIONS',
  ]);
  const code = error instanceof Error && allowed.has(error.message) ? error.message : 'CHECK_FAILED';
  console.error('Production schema preflight refused: ' + code + '. Details suppressed.');
  process.exitCode = 1;
});
