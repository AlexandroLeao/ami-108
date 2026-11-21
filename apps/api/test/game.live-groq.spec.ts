import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/prisma.service';
import { GameController } from '../src/game/game.controller';
import { SessionService, digest } from '../src/game/session.service';
import type { CurrentView } from '../src/narrative/engine';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

// Manual-only: exactly one live consultation in each locale on an ephemeral CI DB.
// Never executed by regular CI, and never pointed at owner/Neon databases.
const live = process.env.AMI_GROQ_LIVE_TEST === '1';
(live ? describe : describe.skip)('opt-in Groq game/DB acceptance', () => {
  const original = {
    mode: process.env.AMI_DEV_PREVIEW,
    generation: process.env.AMI_AI_GENERATION,
  };
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  const testDigests: string[] = [];

  beforeAll(async () => {
    const raw = process.env.AMI_TEST_DATABASE_URL;
    const db = raw ? new URL(raw) : null;
    if (!db || !['127.0.0.1', 'localhost'].includes(db.hostname)
      || db.pathname !== '/ami_groq_ci' || process.env.VERCEL === '1') {
      throw new Error('Manual Groq test requires isolated local ami_groq_ci PostgreSQL');
    }
    if (process.env.AI_SERVICE_URL !== 'http://127.0.0.1:8000'
      || !process.env.AMI_AI_INTERNAL_TOKEN || process.env.AMI_AI_PROVIDER !== 'groq') {
      throw new Error('Manual Groq test requires the private runner-only FastAPI endpoint');
    }
    process.env.AMI_DEV_PREVIEW = '1';
    process.env.AMI_AI_GENERATION = '0';
    prisma = new PrismaService({ datasourceUrl: raw });
    const module = await Test.createTestingModule({
      controllers: [GameController],
      providers: [SessionService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    try {
      if (prisma && testDigests.length) {
        await prisma.gameSession.deleteMany({ where: { tokenDigest: { in: testDigests } } });
      }
    } finally {
      if (app) await app.close();
      if (prisma) await prisma.$disconnect();
      for (const [key, value] of [
        ['AMI_DEV_PREVIEW', original.mode],
        ['AMI_AI_GENERATION', original.generation],
      ] as const) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  it.each(['pt-BR', 'en'] as const)(
    'saves one validated %s consultation and replays it without regenerating',
    async locale => {
      if (!app || !prisma) throw new Error('Acceptance test did not initialize');
      process.env.AMI_AI_GENERATION = '0'; // No intro or incidental provider calls.
      const created = await request(app.getHttpServer())
        .post('/game/session').send({ locale }).expect(201);
      const cookies = created.get('set-cookie') as unknown as string[];
      const cookie = cookies[0].split(';')[0];
      const token = cookie.split('=')[1];
      testDigests.push(digest(token));

      let view = created.body as CurrentView;
      for (let i = 0; i < 120 && view.phase !== 'ENCOUNTER'; i++) {
        const action = view.actions[0];
        if (!action) throw new Error('Cannot reach the approved DOG encounter');
        const result = await request(app.getHttpServer())
          .post('/game/commands').set('Cookie', cookie)
          .send({ commandId: randomUUID(), expectedRevision: view.revision, actionId: action.id })
          .expect(200);
        view = result.body.view as CurrentView;
      }
      expect(view.phase).toBe('ENCOUNTER');
      expect(view.sceneId).toBe('A02-S01');
      const consult = view.actions.find(action => action.kind === 'CONSULT');
      expect(consult).toBeDefined();

      const body = {
        commandId: randomUUID(), expectedRevision: view.revision, actionId: consult!.id,
      };
      process.env.AMI_AI_GENERATION = '1';
      let accepted: { status: string; view: CurrentView };
      try {
        const response = await request(app.getHttpServer())
          .post('/game/commands').set('Cookie', cookie).send(body).expect(200);
        accepted = response.body as { status: string; view: CurrentView };
      } finally {
        process.env.AMI_AI_GENERATION = '0';
      }
      expect(accepted.status).toBe('APPLIED');
      expect(accepted.view.diagnostics?.energy).toBe(2);
      const session = await prisma.gameSession.findUniqueOrThrow({
        where: { tokenDigest: digest(token) },
      });
      const receipt = await prisma.gameCommandReceipt.findUniqueOrThrow({
        where: { sessionId_commandId: { sessionId: session.id, commandId: body.commandId } },
      });
      expect(receipt).toMatchObject({ generationStatus: 'VALIDATED', generationReason: null });
      expect(await prisma.gamePendingGeneration.count({ where: { sessionId: session.id } })).toBe(0);
      expect(await prisma.gameConsultationSlot.count({
        where: { sessionId: session.id, encounterId: 'DOG' },
      })).toBe(1);
      await request(app.getHttpServer()).get('/game/view')
        .set('Cookie', cookie).expect(200, accepted.view);
      const replay = await request(app.getHttpServer())
        .post('/game/commands').set('Cookie', cookie).send(body).expect(200);
      expect(replay.body.status).toBe('REPLAYED');
      expect(replay.body.view).toEqual(accepted.view);
    },
    30000,
  );
});
