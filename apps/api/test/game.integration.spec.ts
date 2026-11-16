import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service';
import { GameController } from '../src/game/game.controller';
import { SessionService, digest } from '../src/game/session.service';
import { CHAPTER_ONE } from '../src/narrative/catalog';
import type { CurrentView } from '../src/narrative/engine';

const databaseUrl = process.env.AMI_TEST_DATABASE_URL;
const integration = databaseUrl ? describe : describe.skip;

integration('Chapter 1 HTTP API with migrated PostgreSQL', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const digests: string[] = [];
  const originalFlag = process.env.AMI_DEV_PREVIEW;

  async function open() {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    const module = await Test.createTestingModule({
      controllers: [GameController],
      providers: [SessionService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  }
  beforeAll(async () => {
    process.env.AMI_DEV_PREVIEW = '1';
    await open();
  });
  afterAll(async () => {
    try {
      await prisma.gameSession.deleteMany({ where: { tokenDigest: { in: digests } } });
    } finally {
      await app.close();
      if (originalFlag === undefined) delete process.env.AMI_DEV_PREVIEW;
      else process.env.AMI_DEV_PREVIEW = originalFlag;
    }
  });
  async function create(locale = 'pt-BR') {
    const res = await request(app.getHttpServer()).post('/game/session').send({ locale }).expect(201);
    const setCookie = res.get('set-cookie') as unknown as string[];
    expect(setCookie[0]).toContain('HttpOnly');
    expect(setCookie[0]).toContain('SameSite=Lax');
    const cookie = setCookie[0].split(';')[0];
    digests.push(digest(cookie.split('=')[1]));
    expect(JSON.stringify(res.body)).not.toContain(cookie.split('=')[1]);
    expect(res.get('cache-control')).toContain('no-store');
    return { cookie, view: res.body as CurrentView };
  }
  async function command(cookie: string, view: CurrentView, actionId = view.actions[0].id) {
    const body = { commandId: randomUUID(), expectedRevision: view.revision, actionId };
    return (await request(app.getHttpServer()).post('/game/commands').set('Cookie', cookie).send(body).expect(200)).body.view as CurrentView;
  }

  it('rejects missing session, extra input, unsupported locale and arbitrary image keys', async () => {
    await request(app.getHttpServer()).get('/game/view').expect(401);
    await request(app.getHttpServer()).post('/game/session').send({ locale: 'pt-BR', state: {} }).expect(400);
    await request(app.getHttpServer()).post('/game/session').send({ locale: 'fr' }).expect(400);
    const { cookie, view } = await create();
    expect(view.phase).toBe('CHAPTER_CARD');
    expect(view.asset).toBeNull();
    expect(view.diagnostics).toBeNull();
    await request(app.getHttpServer()).get('/game/asset?key=CENA-01').set('Cookie', cookie).expect(404);
    await request(app.getHttpServer()).post('/game/commands').set('Cookie', cookie)
      .send({ commandId: randomUUID(), expectedRevision: view.revision, actionId: 'A01-S03/L33/NEXT' }).expect(403);
    await request(app.getHttpServer()).get('/game/view').set('Cookie', 'ami_session=' + 'A'.repeat(43)).expect(401);
  });

  it('serializes concurrent identical commands and rejects conflicting or stale requests', async () => {
    const { cookie, view } = await create();
    const body = { commandId: randomUUID(), expectedRevision: 0, actionId: view.actions[0].id };
    const send = () => request(app.getHttpServer()).post('/game/commands').set('Cookie', cookie).send(body);
    const responses = await Promise.all([send(), send()]);
    expect(responses.map((res) => res.status)).toEqual([200, 200]);
    expect(responses.map((res) => res.body.status).sort()).toEqual(['APPLIED', 'REPLAYED']);
    expect(responses.every((res) => res.body.view.revision === 1)).toBe(true);
    await request(app.getHttpServer()).post('/game/commands').set('Cookie', cookie).send({ ...body, actionId: 'different' }).expect(409);
    await request(app.getHttpServer()).post('/game/commands').set('Cookie', cookie).send({ ...body, commandId: randomUUID() }).expect(409);
    const session = await prisma.gameSession.findUniqueOrThrow({ where: { tokenDigest: digest(cookie.split('=')[1]) } });
    expect(session.revision).toBe(1);
    expect(await prisma.gameCommandReceipt.count({ where: { sessionId: session.id } })).toBe(1);
    const next = await command(cookie, responses[0].body.view);
    const replay = await send().expect(200);
    expect(replay.body.view.revision).toBe(next.revision);
    expect(replay.body.status).toBe('REPLAYED');
  });

  it('persists and isolates progress across server restart; serves only current art', async () => {
    const first = await create();
    const other = await create('en');
    let view = first.view;
    for (let i = 0; i < 4; i++) view = await command(first.cookie, view);
    expect(view.text).toBe('Onde eu estou?');
    expect(view.asset?.url).toBe('/api/game/asset?key=CENA-01');
    await request(app.getHttpServer()).get('/game/asset?key=CENA-01').set('Cookie', first.cookie).expect(200).expect('Content-Type', /image\/png/);
    await request(app.getHttpServer()).get('/game/asset?key=CENA-02').set('Cookie', first.cookie).expect(404);
    await request(app.getHttpServer()).get('/game/asset?key=CENA-01').set('Cookie', other.cookie).expect(404);
    await app.close();
    await open();
    await request(app.getHttpServer()).get('/game/view').set('Cookie', first.cookie).expect(200, view);
    await request(app.getHttpServer()).get('/game/view').set('Cookie', other.cookie).expect(200, other.view);
    const translated = await request(app.getHttpServer()).patch('/game/locale').set('Cookie', first.cookie)
      .send({ commandId: randomUUID(), expectedRevision: view.revision, locale: 'en' }).expect(200);
    expect(translated.body.view.text).toBe('Where am I?');
    expect(translated.body.view.asset.url).toBe(view.asset?.url);
    expect(translated.body.view.actions.some((action: { kind: string }) => action.kind === 'PREVIOUS')).toBe(false);
    view = await command(first.cookie, translated.body.view);
    const previous = view.actions.find((action) => action.kind === 'PREVIOUS')!;
    view = await command(first.cookie, view, previous.id);
    expect(view.text).toBe('Where am I?');
    view = await command(first.cookie, view);
    view = await command(first.cookie, view);
    view = await command(first.cookie, view);
    expect(view.asset).toBeNull();
    await request(app.getHttpServer()).get('/game/asset?key=CENA-01').set('Cookie', first.cookie).expect(404);
  });

  it('plays all Chapter 1 steps and persists one free introduction, memory and join', async () => {
    const session = await create();
    let view = session.view;
    for (let i = 0; i < CHAPTER_ONE.length; i++) view = await command(session.cookie, view);
    expect(view.chapter).toBe(2);
    expect(view.actions.map((action) => action.kind)).toEqual(['PREVIOUS']);
    expect(view.diagnostics).toEqual({ energy: 3, med: 10, bio: 15, hist: 12, personal: 5, personalUnlocked: false });
    const row = await prisma.gameSession.findUniqueOrThrow({ where: { tokenDigest: digest(session.cookie.split('=')[1]) } });
    expect(row.state).toMatchObject({ events: ['E-JOIN', 'INTRO-RANDOM', 'MEM-D1', 'FB-D1'], intro: { category: 'RANDOM', source: 'fallback' } });
    expect(await prisma.gameCommandReceipt.count({ where: { sessionId: row.id } })).toBe(CHAPTER_ONE.length);
    await request(app.getHttpServer()).get('/game/view').set('Cookie', session.cookie).expect(200, view);
    // Persist history across the handoff and memory, without changing applied events.
    for (let i = 0; i < 6; i++) view = await command(session.cookie, view, view.actions.find((action) => action.kind === 'PREVIOUS')!.id);
    expect(view.text).toBe('Tudo isso parece estranhamente familiar.');
    expect(view.asset).toBeNull();
    await request(app.getHttpServer()).get('/game/view').set('Cookie', session.cookie).expect(200, view);
    const reviewed = await prisma.gameSession.findUniqueOrThrow({ where: { id: row.id } });
    expect(reviewed.state).toMatchObject({ stepId: 'A02-S01/CHAPTER_CARD', events: ['E-JOIN', 'INTRO-RANDOM', 'MEM-D1', 'FB-D1'] });
  });

  it('does not expose integration routes without explicit local flag', async () => {
    delete process.env.AMI_DEV_PREVIEW;
    try { await request(app.getHttpServer()).post('/game/session').send({ locale: 'en' }).expect(404); }
    finally { process.env.AMI_DEV_PREVIEW = '1'; }
  });
});
