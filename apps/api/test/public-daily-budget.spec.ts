import { randomUUID } from 'node:crypto';
import { PrismaService } from '../src/prisma.service';
import { acquirePublicBudget, MAX_PUBLIC_AI_ATTEMPTS_PER_DAY, MAX_PUBLIC_SESSIONS_PER_DAY } from '../src/game/public-daily-budget';
import { SessionService, GameError, digest } from '../src/game/session.service';

// These tests never run against a shared/Neon database: the only accepted target
// is the dedicated throwaway PostgreSQL database created by standard CI.
const raw = process.env.AMI_TEST_DATABASE_URL;
let safe = false;
try {
  const db = new URL(raw ?? '');
  safe = ['127.0.0.1', 'localhost'].includes(db.hostname) && db.pathname === '/ami_test';
} catch { /* No local test database. */ }

(safe ? describe : describe.skip)('atomic public portfolio budgets on disposable PostgreSQL', () => {
  let prisma: PrismaService;
  const keys = ['VERCEL', 'AMI_DEV_PREVIEW', 'AMI_PUBLIC_GAME', 'AMI_PUBLIC_ORIGIN', 'AMI_API_INTERNAL_TOKEN'] as const;
  let original: Record<string, string | undefined>;
  const createdDigests: string[] = [];
  const todayUtc = () => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));

  beforeAll(async () => {
    if (!safe || !raw) throw new Error('Refusing shared database for budget test');
    original = Object.fromEntries(keys.map(k => [k, process.env[k]]));
    prisma = new PrismaService({ datasourceUrl: raw });
    // Only the isolated local CI DB: no owner/QA/production data is ever deleted.
    await prisma.publicDailyUsage.deleteMany();
  });

  afterAll(async () => {
    try {
      if (createdDigests.length) {
        await prisma.gameSession.deleteMany({ where: { tokenDigest: { in: createdDigests } } });
      }
      await prisma.publicDailyUsage.deleteMany();
    } finally {
      await prisma.$disconnect();
      for (const key of keys) {
        if (original[key] === undefined) delete process.env[key];
        else process.env[key] = original[key];
      }
    }
  });

  it('permits exactly the daily global session limit under concurrent requests', async () => {
    const requests = Array.from({ length: MAX_PUBLIC_SESSIONS_PER_DAY + 8 },
      () => prisma.$transaction(tx => acquirePublicBudget(tx, 'session')));
    const results = await Promise.all(requests);
    expect(results.filter(Boolean)).toHaveLength(MAX_PUBLIC_SESSIONS_PER_DAY);
    expect(results.filter(value => !value)).toHaveLength(8);
    const row = await prisma.publicDailyUsage.findUniqueOrThrow({ where: { day: todayUtc() } });
    expect(row.sessions).toBe(MAX_PUBLIC_SESSIONS_PER_DAY);
    expect(row.modelRequests).toBe(0);
  }, 30000);

  it('caps provider attempts independently, including attempted failures', async () => {
    const results = await Promise.all(Array.from({ length: MAX_PUBLIC_AI_ATTEMPTS_PER_DAY + 5 },
      () => prisma.$transaction(tx => acquirePublicBudget(tx, 'ai'))));
    expect(results.filter(Boolean)).toHaveLength(MAX_PUBLIC_AI_ATTEMPTS_PER_DAY);
    expect(results.filter(value => !value)).toHaveLength(5);
    const row = await prisma.publicDailyUsage.findUniqueOrThrow({ where: { day: todayUtc() } });
    expect(row.sessions).toBe(MAX_PUBLIC_SESSIONS_PER_DAY);
    expect(row.modelRequests).toBe(MAX_PUBLIC_AI_ATTEMPTS_PER_DAY);
  }, 30000);

  it('rejects a public session after the cap without creating a save', async () => {
    process.env.VERCEL = '1';
    delete process.env.AMI_DEV_PREVIEW;
    process.env.AMI_PUBLIC_GAME = '1';
    process.env.AMI_PUBLIC_ORIGIN = 'https://example.invalid';
    process.env.AMI_API_INTERNAL_TOKEN = 'x'.repeat(32);
    // Standard CI must use NODE_ENV=production for this Vercel opt-in.
    const nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const before = await prisma.gameSession.count();
      await expect(new SessionService(prisma).create('pt-BR')).rejects.toMatchObject({
        status: 429, code: 'CAPACITY_LIMIT',
      } satisfies Partial<GameError>);
      expect(await prisma.gameSession.count()).toBe(before);
    } finally {
      if (nodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = nodeEnv;
    }
  });

  it('exhausted AI budget commits authored fallback, no provider call and replays safely', async () => {
    delete process.env.VERCEL;
    process.env.AMI_DEV_PREVIEW = '1';
    process.env.AMI_AI_GENERATION = '0';
    const service = new SessionService(prisma);
    const created = await service.create('pt-BR');
    createdDigests.push(digest(created.token));
    let view = created.view;
    for (let i = 0; i < 120 && view.phase !== 'ENCOUNTER'; i++) {
      const action = view.actions[0];
      if (!action) throw new Error('Cannot reach the first approved consultation');
      const result = await service.mutate(created.token, {
        kind: 'action', commandId: randomUUID(), expectedRevision: view.revision, actionId: action.id,
      });
      view = result.view;
    }
    expect(view.phase).toBe('ENCOUNTER');
    const consult = view.actions.find(action => action.kind === 'CONSULT');
    expect(consult).toBeDefined();

    process.env.VERCEL = '1';
    delete process.env.AMI_DEV_PREVIEW;
    process.env.AMI_PUBLIC_GAME = '1';
    process.env.AMI_PUBLIC_ORIGIN = 'https://example.invalid';
    process.env.AMI_API_INTERNAL_TOKEN = 'x'.repeat(32);
    const nodeEnv = process.env.NODE_ENV;
    const generationFlag = process.env.AMI_AI_GENERATION;
    process.env.NODE_ENV = 'production';
    process.env.AMI_AI_GENERATION = '1';
    try {
      const body = {
        kind: 'action' as const, commandId: randomUUID(), expectedRevision: view.revision, actionId: consult!.id,
      };
      const result = await service.mutate(created.token, body);
      expect(result.status).toBe('APPLIED');
      expect(result.view.diagnostics?.energy).toBe(2);
      const session = await prisma.gameSession.findUniqueOrThrow({ where: { tokenDigest: digest(created.token) } });
      const receipt = await prisma.gameCommandReceipt.findUniqueOrThrow({
        where: { sessionId_commandId: { sessionId: session.id, commandId: body.commandId } },
      });
      expect(receipt.generationStatus).toBe('FALLBACK_REQUIRED');
      expect(receipt.generationReason).toBe('BUDGET_EXCEEDED');
      expect(await prisma.gamePendingGeneration.count({ where: { sessionId: session.id } })).toBe(0);
      const replay = await service.mutate(created.token, body);
      expect(replay.status).toBe('REPLAYED');
      expect(replay.view).toEqual(result.view);
      const daily = await prisma.publicDailyUsage.findUniqueOrThrow({ where: { day: todayUtc() } });
      expect(daily.modelRequests).toBe(MAX_PUBLIC_AI_ATTEMPTS_PER_DAY);
    } finally {
      if (nodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = nodeEnv;
      if (generationFlag === undefined) delete process.env.AMI_AI_GENERATION;
      else process.env.AMI_AI_GENERATION = generationFlag;
    }
  }, 30000);

  it('preserves local QA behavior without consuming public quota', async () => {
    delete process.env.VERCEL;
    process.env.AMI_DEV_PREVIEW = '1';
    const before = await prisma.publicDailyUsage.findUniqueOrThrow({ where: { day: todayUtc() } });
    const created = await new SessionService(prisma).create('en');
    createdDigests.push(digest(created.token));
    const after = await prisma.publicDailyUsage.findUniqueOrThrow({ where: { day: todayUtc() } });
    expect(after).toEqual(before);
    expect(created.view.locale).toBe('en');
  });
});
