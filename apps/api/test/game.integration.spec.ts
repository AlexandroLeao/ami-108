import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import type { Prisma } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service';
import { GameController } from '../src/game/game.controller';
import { SessionService, digest } from '../src/game/session.service';
import { CHAPTER_ONE } from '../src/narrative/catalog';
import { advanceNarrative, type CurrentView, type NarrativeState } from '../src/narrative/engine';
import { generationRequest } from '../src/game/ai-client';

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
    expect(view.actions.map((action) => action.kind)).toEqual(['CONTINUE', 'PREVIOUS']);
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

  it('persists dog checkpoint and slots, serializes debit/retry, and reaches Chapter 3', async () => {
    const { cookie, view: initial } = await create();
    let view = initial;
    for (let i = 0; i <= CHAPTER_ONE.length; i++) view = await command(cookie, view);
    const row = await prisma.gameSession.findUniqueOrThrow({ where: { tokenDigest: digest(cookie.split('=')[1]) } });
    const cp = await prisma.gameCheckpoint.findUniqueOrThrow({ where: { sessionId_checkpointId: { sessionId: row.id, checkpointId: 'CP-DOG' } } });
    expect(cp.snapshot).toMatchObject({ stepId: 'A02-S01/L01', diagnostics: { energy: 3, bio: 15 } });
    await request(app.getHttpServer()).get('/game/asset?key=CENA-04').set('Cookie', cookie).expect(404);
    await request(app.getHttpServer()).get('/game/asset?key=CENA-05').set('Cookie', cookie).expect(404);
    for (let i = 0; i < 12 && view.phase !== 'ENCOUNTER'; i++) view = await command(cookie, view);
    await request(app.getHttpServer()).get('/game/asset?key=CENA-04').set('Cookie', cookie).expect(200);
    const consult = view.actions.find(x => x.kind === 'CONSULT')!;
    const body = { commandId: randomUUID(), expectedRevision: view.revision, actionId: consult.id };
    const send = () => request(app.getHttpServer()).post('/game/commands').set('Cookie', cookie).send(body);
    const responses = await Promise.all([send(), send()]);
    expect(responses.map(x => x.status)).toEqual([200, 200]);
    expect(responses.map(x => x.body.status).sort()).toEqual(['APPLIED', 'REPLAYED']);
    view = responses[0].body.view;
    expect(view.diagnostics?.energy).toBe(2);
    const slot = await prisma.gameConsultationSlot.findUniqueOrThrow({ where: { sessionId_encounterId_slotIndex: { sessionId: row.id, encounterId: 'DOG', slotIndex: 1 } } });
    expect(await prisma.gameConsultationSlot.count({ where: { sessionId: row.id } })).toBe(1);
    await app.close(); await open();
    await request(app.getHttpServer()).get('/game/view').set('Cookie', cookie).expect(200, view);
    view = await command(cookie, view);
    const answer = view.text;
    for (let i = 0; i < 3 && view.phase !== 'ENCOUNTER'; i++) view = await command(cookie, view);
    expect(view.phase).toBe('ENCOUNTER');
    view = await command(cookie, view, 'DOG-01');
    expect(view.phase).toBe('DEAD');
    expect(view.diagnostics?.energy).toBe(2);
    view = await command(cookie, view);
    view = await command(cookie, view, view.actions.find(x => x.kind === 'RETRY')!.id);
    expect(view.diagnostics?.energy).toBe(3);
    for (let i = 0; i < 12 && view.phase !== 'ENCOUNTER'; i++) view = await command(cookie, view);
    view = await command(cookie, view, view.actions.find(x => x.kind === 'CONSULT')!.id);
    view = await command(cookie, view);
    expect(view.text).toBe(answer);
    expect(view.diagnostics?.energy).toBe(2);
    expect(await prisma.gameConsultationSlot.findUniqueOrThrow({ where: { sessionId_encounterId_slotIndex: { sessionId: row.id, encounterId: 'DOG', slotIndex: 1 } } })).toEqual(slot);
    for (let i = 0; i < 3 && view.phase !== 'ENCOUNTER'; i++) view = await command(cookie, view);
    view = await command(cookie, view, 'DOG-04');
    for (let i = 0; i < 60 && view.chapter !== 3; i++) view = await command(cookie, view);
    expect(view.chapter).toBe(3);
    expect(view.diagnostics).toEqual({ energy: 3, med: 35, bio: 42, hist: 53, personal: 5, personalUnlocked: false });
    expect(await prisma.gameCheckpoint.count({ where: { sessionId: row.id } })).toBe(1);
    expect((await prisma.gameSession.findUniqueOrThrow({ where: { id: row.id } })).state).toMatchObject({ events: expect.arrayContaining(['F1', 'MEM-D2', 'FB-D2', 'E-NAME']) });
    expect(view.chapters?.map(c => c.number)).toEqual([1,2,3]);
    view = await command(cookie, view, 'CHAPTER/RESTART/1');
    expect(view.chapter).toBe(1);
    expect(view.chapters?.map(c => c.number)).toEqual([1,2,3]);
    await request(app.getHttpServer()).get('/game/view').set('Cookie', cookie).expect(200, view);
    view = await command(cookie, view, 'CHAPTER/RESTART/2');
    expect(view.chapter).toBe(2);
    for (let i = 0; i < 15 && view.phase !== 'ENCOUNTER'; i++) view = await command(cookie, view);
    view = await command(cookie, view, view.actions.find(x => x.kind === 'CONSULT')!.id);
    view = await command(cookie, view);
    expect(view.text).toBe(answer);
    expect(await prisma.gameConsultationSlot.count({ where: { sessionId: row.id } })).toBe(1);
    view = await command(cookie, view, 'CHAPTER/RESTART/3');
    expect(view.chapter).toBe(3);
    expect(view.diagnostics?.bio).toBe(42);
    await request(app.getHttpServer()).post('/game/commands').set('Cookie', cookie).send({commandId: randomUUID(), expectedRevision: view.revision, actionId: 'CHAPTER/RESTART/4'}).expect(403);
  }, 30000);

  it('persists rat checkpoint, cache, F2 recharge and chapter replay', async () => {
    const { cookie, view: initial } = await create();
    let view = initial;
    for (let i=0; i<100 && view.phase!=='ENCOUNTER'; i++) view=await command(cookie,view);
    view=await command(cookie,view,'DOG-04');
    for (let i=0; i<65 && view.chapter!==3; i++) view=await command(cookie,view);
    expect(view.chapter).toBe(3);
    await request(app.getHttpServer()).get('/game/asset?key=CENA-06').set('Cookie',cookie).expect(404);
    view=await command(cookie,view);
    expect(view.asset).toBeNull();
    for(let i=0;i<5 && !view.asset;i++) view=await command(cookie,view);
    expect(view.asset?.url).toBe('/api/game/asset?key=CENA-06');
    await request(app.getHttpServer()).get('/game/asset?key=CENA-07').set('Cookie',cookie).expect(404);
    for (let i=0; i<65 && view.phase!=='ENCOUNTER'; i++) view=await command(cookie,view);
    expect(view.sceneId).toBe('A03-S02');
    expect(view.asset?.url).toBe('/api/game/asset?key=CENA-07');
    const row=await prisma.gameSession.findUniqueOrThrow({where:{tokenDigest:digest(cookie.split('=')[1])}});
    const cp=await prisma.gameCheckpoint.findUniqueOrThrow({where:{sessionId_checkpointId:{sessionId:row.id,checkpointId:'CP-RAT'}}});
    expect(cp.snapshot).toMatchObject({stepId:'A03-S02/L01',diagnostics:{energy:3,bio:42}});
    const action=view.actions.find(x=>x.kind==='CONSULT')!;
    const body={commandId:randomUUID(),expectedRevision:view.revision,actionId:action.id};
    const send=()=>request(app.getHttpServer()).post('/game/commands').set('Cookie',cookie).send(body);
    const pair=await Promise.all([send(),send()]);
    expect(pair.map(x=>x.status)).toEqual([200,200]);
    expect(pair.map(x=>x.body.status).sort()).toEqual(['APPLIED','REPLAYED']);
    view=pair[0].body.view;
    expect(view.diagnostics?.energy).toBe(2);
    const slot=await prisma.gameConsultationSlot.findUniqueOrThrow({where:{sessionId_encounterId_slotIndex:{sessionId:row.id,encounterId:'RAT',slotIndex:1}}});
    await app.close(); await open();
    await request(app.getHttpServer()).get('/game/view').set('Cookie',cookie).expect(200,view);
    for(let i=0;i<4 && view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
    view=await command(cookie,view,'RAT-01');
    view=await command(cookie,view);
    view=await command(cookie,view,view.actions.find(x=>x.kind==='RETRY')!.id);
    expect(view.diagnostics?.energy).toBe(3);
    for(let i=0;i<12 && view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
    view=await command(cookie,view,view.actions.find(x=>x.kind==='CONSULT')!.id);
    expect(await prisma.gameConsultationSlot.findUniqueOrThrow({where:{sessionId_encounterId_slotIndex:{sessionId:row.id,encounterId:'RAT',slotIndex:1}}})).toEqual(slot);
    for(let i=0;i<4 && view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
    view=await command(cookie,view,'RAT-02');
    for(let i=0;i<25 && view.chapter!==4;i++) view=await command(cookie,view);
    expect(view.chapter).toBe(4);
    expect(view.diagnostics).toEqual({energy:3,med:75,bio:85,hist:78,personal:5,personalUnlocked:false});
    expect(await prisma.gameCheckpoint.count({where:{sessionId:row.id}})).toBe(2);
    expect((await prisma.gameSession.findUniqueOrThrow({where:{id:row.id}})).state).toMatchObject({events:expect.arrayContaining(['E-ARCHIVE','MEM-D3','FB-D3','E-PLANET','E-PARTNER','CP-RAT','F2','E-ESCAPE-ROUTE'])});
    view=await command(cookie,view,'CHAPTER/RESTART/3');
    expect(view.chapter).toBe(3);
    expect(view.diagnostics?.bio).toBe(42);
    view=await command(cookie,view,'CHAPTER/RESTART/4');
    expect(view.chapter).toBe(4);
    expect(view.diagnostics?.bio).toBe(85);
  }, 30000);

  it('persists Chapter 4 F3 and authorizes only reached art, including legacy card resume', async () => {
    const { cookie, view: initial } = await create();
    let view = initial;
    for(let i=0;i<120 && view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
    view=await command(cookie,view,'DOG-04');
    for(let i=0;i<150 && view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
    expect(view.sceneId).toBe('A03-S02');
    view=await command(cookie,view,'RAT-02');
    for(let i=0;i<40 && view.chapter!==4;i++) view=await command(cookie,view);
    expect(view.chapter).toBe(4);
    expect(view.diagnostics?.personalUnlocked).toBe(false);
    const row=await prisma.gameSession.findUniqueOrThrow({where:{tokenDigest:digest(cookie.split('=')[1])}});
    expect(row.state).not.toHaveProperty('chapterFour');
    await request(app.getHttpServer()).get('/game/asset?key=CENA-08').set('Cookie',cookie).expect(404);
    for(let i=0;i<10 && !view.actions.some(a=>a.kind==='INTERACT');i++) view=await command(cookie,view);
    const install=view.actions.find(a=>a.kind==='INTERACT')!;
    expect(install.id).toBe('A04-S01/INSTALL/NEXT');
    const body={commandId:randomUUID(),expectedRevision:view.revision,actionId:install.id};
    const send=()=>request(app.getHttpServer()).post('/game/commands').set('Cookie',cookie).send(body);
    const pair=await Promise.all([send(),send()]);
    expect(pair.map(x=>x.status)).toEqual([200,200]);
    expect(pair.map(x=>x.body.status).sort()).toEqual(['APPLIED','REPLAYED']);
    view=pair[0].body.view;
    expect(view.diagnostics).toEqual({energy:3,med:100,bio:100,hist:100,personal:100,personalUnlocked:true});
    const stored=await prisma.gameSession.findUniqueOrThrow({where:{id:row.id}});
    expect(stored.state).toMatchObject({chapterFour:true,diagnostics:view.diagnostics,events:expect.arrayContaining(['F2','F3'])});
    expect((stored.state as {events:string[]}).events.filter(x=>x==='F3')).toHaveLength(1);
    await app.close(); await open();
    await request(app.getHttpServer()).get('/game/view').set('Cookie',cookie).expect(200,view);
    for(let i=0;i<30 && view.asset?.url!=='/api/game/asset?key=CENA-08';i++) view=await command(cookie,view);
    expect(view.asset?.url).toBe('/api/game/asset?key=CENA-08');
    await request(app.getHttpServer()).get('/game/asset?key=CENA-08').set('Cookie',cookie).expect(200);
    await request(app.getHttpServer()).get('/game/asset?key=CENA-11').set('Cookie',cookie).expect(404);
    const assets=new Set<string>();
    for(let i=0;i<100 && view.chapter!==5;i++){
      if(view.asset) assets.add(view.asset.url);
      view=await command(cookie,view);
    }
    expect(view.chapter).toBe(5);
    expect(assets.has('/api/game/asset?key=CENA-11')).toBe(true);
    expect(assets.has('/api/game/asset?key=CENA-12')).toBe(true);
    expect(view.diagnostics?.personalUnlocked).toBe(true);
    expect(await prisma.gameCheckpoint.count({where:{sessionId:row.id}})).toBe(2);
    // Simulate a saved Chapter 4 boundary from before the new optional fields.
    const legacy=(await prisma.gameSession.findUniqueOrThrow({where:{id:row.id}})).state as unknown as NarrativeState;
    const {chapterFiveStart: _snapshot,savedBoarSlots: _slots,...oldState}=legacy;
    void _snapshot; void _slots;
    await prisma.gameSession.update({where:{id:row.id},data:{state:JSON.parse(JSON.stringify({...oldState,unlockedChapter:4})) as Prisma.InputJsonObject}});
    view=(await request(app.getHttpServer()).get('/game/view').set('Cookie',cookie).expect(200)).body;
    expect(view.chapters?.map(x=>x.number)).toEqual([1,2,3,4,5]);
    expect(view.actions[0].id).toBe('A05-S01/CHAPTER_CARD/NEXT');
    await request(app.getHttpServer()).get('/game/asset?key=CENA-09').set('Cookie',cookie).expect(404);
    for(let i=0;i<30&&view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
    expect(view.asset?.url).toBe('/api/game/asset?key=CENA-09');
    await request(app.getHttpServer()).get('/game/asset?key=CENA-09').set('Cookie',cookie).expect(200);
    await request(app.getHttpServer()).get('/game/asset?key=CENA-10').set('Cookie',cookie).expect(404);
    const checkpoint=await prisma.gameCheckpoint.findUniqueOrThrow({where:{sessionId_checkpointId:{sessionId:row.id,checkpointId:'CP-BOAR'}}});
    expect(checkpoint.snapshot).toMatchObject({diagnostics:{energy:3,bio:100,personalUnlocked:true},ship:{powered:false,gateOpen:false,enginesOn:false,launched:false}});
    const consult=view.actions.find(a=>a.kind==='CONSULT')!;
    const consultBody={commandId:randomUUID(),expectedRevision:view.revision,actionId:consult.id};
    const consultSend=()=>request(app.getHttpServer()).post('/game/commands').set('Cookie',cookie).send(consultBody);
    const consultPair=await Promise.all([consultSend(),consultSend()]);
    expect(consultPair.map(x=>x.status)).toEqual([200,200]);
    expect(consultPair.map(x=>x.body.status).sort()).toEqual(['APPLIED','REPLAYED']);
    view=consultPair[0].body.view;
    expect(view.diagnostics?.energy).toBe(2);
    const key={sessionId_encounterId_slotIndex:{sessionId:row.id,encounterId:'BOAR',slotIndex:1}};
    const slot=await prisma.gameConsultationSlot.findUniqueOrThrow({where:key});
    expect(slot).toMatchObject({category:'CORRECT',recipe:false});
    expect(await prisma.gamePendingGeneration.count({where:{sessionId:row.id}})).toBe(0);
    await app.close(); await open();
    await request(app.getHttpServer()).get('/game/view').set('Cookie',cookie).expect(200,view);
    for(let i=0;i<4&&view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
    view=await command(cookie,view,'BOAR-02');
    view=await command(cookie,view);
    view=await command(cookie,view,view.actions.find(a=>a.kind==='RETRY')!.id);
    expect(view.diagnostics?.energy).toBe(3);
    for(let i=0;i<12&&view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
    view=await command(cookie,view,view.actions.find(a=>a.kind==='CONSULT')!.id);
    expect(await prisma.gameConsultationSlot.findUniqueOrThrow({where:key})).toEqual(slot);
    for(let i=0;i<4&&view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
    view=await command(cookie,view,'BOAR-04');
    for(let i=0;i<40&&!view.complete;i++) view=await command(cookie,view);
    expect(view).toMatchObject({complete:true,text:'CONTINUA...',asset:null});
    view=await command(cookie,view);
    expect(view.actions).toEqual([]);
    const completed=(await prisma.gameSession.findUniqueOrThrow({where:{id:row.id}})).state as unknown as NarrativeState;
    expect(completed.events.filter(e=>e==='E-COMPLETE')).toHaveLength(1);
    expect(completed.chapterFive?.ship).toEqual({powered:true,gateOpen:true,enginesOn:true,launched:true});
    view=await command(cookie,view,'CHAPTER/RESTART/5');
    expect(view).toMatchObject({chapter:5,phase:'CHAPTER_CARD',diagnostics:{energy:3}});
    expect(await prisma.gameConsultationSlot.findUniqueOrThrow({where:key})).toEqual(slot);
    view=await command(cookie,view,'CHAPTER/RESTART/4');
    expect(view.chapter).toBe(4);
    expect(view.diagnostics).toEqual({energy:3,med:75,bio:85,hist:78,personal:5,personalUnlocked:false});
    await request(app.getHttpServer()).get('/game/asset?key=CENA-08').set('Cookie',cookie).expect(404);
  }, 60000);

  it('reserves one AI call, blocks conflicting mutations and atomically finalizes the same command', async () => {
    const previous = { flag: process.env.AMI_AI_GENERATION, token: process.env.AMI_AI_INTERNAL_TOKEN, url: process.env.AI_SERVICE_URL };
    delete process.env.AMI_AI_GENERATION;
    const { cookie, view: initial } = await create();
    let view = initial;
    for (let i=0;i<100 && view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
    expect(view.phase).toBe('ENCOUNTER');
    const row=await prisma.gameSession.findUniqueOrThrow({where:{tokenDigest:digest(cookie.split('=')[1])}});
    let requests=0;
    let announce!: () => void;
    let release!: () => void;
    const entered=new Promise<void>(resolve=>{announce=resolve;});
    const gate=new Promise<void>(resolve=>{release=resolve;});
    const server=createServer((req,res)=>{
      let raw='';
      req.on('data',(chunk:Buffer)=>{raw+=chunk.toString();});
      req.on('end',()=>{
        requests++;
        const body=JSON.parse(raw) as {requestId:string};
        announce();
        void gate.then(()=>{
          res.writeHead(200,{'Content-Type':'application/json'});
          res.end(JSON.stringify({requestId:body.requestId,status:'FALLBACK_REQUIRED',reason:'UNAVAILABLE'}));
        });
      });
    });
    server.listen(0,'127.0.0.1'); await once(server,'listening');
    const address=server.address();
    if (!address || typeof address==='string') throw new Error('Mock server address');
    process.env.AMI_AI_GENERATION='1';
    process.env.AMI_AI_INTERNAL_TOKEN='test-only';
    process.env.AI_SERVICE_URL='http://127.0.0.1:'+address.port;
    try {
      const body={commandId:randomUUID(),expectedRevision:view.revision,actionId:view.actions.find(x=>x.kind==='CONSULT')!.id};
      const send=()=>request(app.getHttpServer()).post('/game/commands').set('Cookie',cookie).send(body);
      const first=send().then(x=>x);
      await entered;
      const pending=await prisma.gamePendingGeneration.findUniqueOrThrow({where:{sessionId:row.id}});
      expect(pending.commandId).toBe(body.commandId);
      expect((await prisma.gameSession.findUniqueOrThrow({where:{id:row.id}})).revision).toBe(view.revision);
      expect(await prisma.gameConsultationSlot.count({where:{sessionId:row.id}})).toBe(0);
      const second=send().then(x=>x);
      await request(app.getHttpServer()).patch('/game/locale').set('Cookie',cookie).send({commandId:randomUUID(),expectedRevision:view.revision,locale:'en'}).expect(409);
      release();
      const pair=await Promise.all([first,second]);
      expect(pair.map(x=>x.status)).toEqual([200,200]);
      expect(pair.map(x=>x.body.status).sort()).toEqual(['APPLIED','REPLAYED']);
      expect(pair[0].body.view.diagnostics.energy).toBe(2);
      expect(requests).toBe(1);
      expect(await prisma.gamePendingGeneration.count({where:{sessionId:row.id}})).toBe(0);
      expect(await prisma.gameConsultationSlot.count({where:{sessionId:row.id}})).toBe(1);
      expect(await prisma.gameCommandReceipt.findUniqueOrThrow({where:{sessionId_commandId:{sessionId:row.id,commandId:body.commandId}}})).toMatchObject({generationStatus:'FALLBACK_REQUIRED',generationReason:'UNAVAILABLE'});
    } finally {
      release();
      server.closeAllConnections();
      await new Promise<void>(resolve=>server.close(()=>resolve()));
      for (const [key,value] of [['AMI_AI_GENERATION',previous.flag],['AMI_AI_INTERNAL_TOKEN',previous.token],['AI_SERVICE_URL',previous.url]] as const) {
        if(value===undefined) delete process.env[key]; else process.env[key]=value;
      }
    }
  },30000);

  it.each(['DOG','RAT'] as const)('persists validated %s variation, translation and retry without a new call', async encounter => {
    const previous={flag:process.env.AMI_AI_GENERATION,token:process.env.AMI_AI_INTERNAL_TOKEN,url:process.env.AI_SERVICE_URL};
    delete process.env.AMI_AI_GENERATION;
    const {cookie,view:initial}=await create();
    let view=initial;
    for(let i=0;i<120 && view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
    if(encounter==='RAT') {
      view=await command(cookie,view,'DOG-04');
      for(let i=0;i<150 && view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
      expect(view.sceneId).toBe('A03-S02');
    } else expect(view.sceneId).toBe('A02-S01');
    const row=await prisma.gameSession.findUniqueOrThrow({where:{tokenDigest:digest(cookie.split('=')[1])}});
    const variants={
      DOG:{
        CORRECT:{pt:'A visão da criatura está comprometida e sua audição foi ampliada. Permaneça imóvel até que ela abandone a área.',en:"The creature's vision is impaired and its hearing is heightened. Remain still until it leaves the area."},
        RANDOM:{pt:'Saturno possui um sistema de anéis composto principalmente por partículas de gelo.',en:'Saturn has a ring system composed primarily of ice particles.'},
      },
      RAT:{
        CORRECT:{pt:'Organismos da primeira geração são intolerantes à luz intensa. A iluminação de contenção deverá forçá-lo a recuar.',en:'First-generation organisms are intolerant of intense light. The containment lighting should force it to retreat.'},
        RANDOM:{pt:'Recomenda-se dobrar a roupa imediatamente após a secagem.',en:'Folding clothes immediately after drying is recommended.'},
      },
    };
    let requests=0;
    let chosen: {pt:string;en:string}|undefined;
    const server=createServer((req,res)=>{
      let raw='';
      req.on('data',(chunk:Buffer)=>{raw+=chunk.toString();});
      req.on('end',()=>{
        requests++;
        const body=JSON.parse(raw) as {requestId:string;questionId:string;category:'CORRECT'|'RANDOM';locale:string};
        if(body.questionId!=='Q-'+encounter || body.locale!=='pt-BR') {res.writeHead(400);res.end();return;}
        chosen=variants[encounter][body.category];
        res.writeHead(200,{'Content-Type':'application/json'});
        res.end(JSON.stringify({requestId:body.requestId,status:'VALIDATED',text:chosen.pt}));
      });
    });
    server.listen(0,'127.0.0.1'); await once(server,'listening');
    const address=server.address();
    if(!address || typeof address==='string') throw Error('Mock server address');
    process.env.AMI_AI_GENERATION='1';
    process.env.AMI_AI_INTERNAL_TOKEN='test-only';
    process.env.AI_SERVICE_URL='http://127.0.0.1:'+address.port;
    try {
      const body={commandId:randomUUID(),expectedRevision:view.revision,actionId:view.actions.find(x=>x.kind==='CONSULT')!.id};
      view=(await request(app.getHttpServer()).post('/game/commands').set('Cookie',cookie).send(body).expect(200)).body.view as CurrentView;
      expect(chosen).toBeDefined();
      expect(view.diagnostics?.energy).toBe(2);
      const key={sessionId_encounterId_slotIndex:{sessionId:row.id,encounterId:encounter,slotIndex:1}};
      const slot=await prisma.gameConsultationSlot.findUniqueOrThrow({where:key});
      expect(slot).toMatchObject({localizedText:{'pt-BR':chosen!.pt,en:chosen!.en},recipe:false});
      expect(await prisma.gameCommandReceipt.findUniqueOrThrow({where:{sessionId_commandId:{sessionId:row.id,commandId:body.commandId}}})).toMatchObject({generationStatus:'VALIDATED',generationReason:null});
      view=await command(cookie,view);
      expect(view.text).toBe(chosen!.pt);
      await app.close(); await open();
      await request(app.getHttpServer()).get('/game/view').set('Cookie',cookie).expect(200,view);
      view=(await request(app.getHttpServer()).patch('/game/locale').set('Cookie',cookie).send({commandId:randomUUID(),expectedRevision:view.revision,locale:'en'}).expect(200)).body.view as CurrentView;
      expect(view.text).toBe(chosen!.en);
      for(let i=0;i<4 && view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
      view=await command(cookie,view,encounter+'-01');
      for(let i=0;i<3 && !view.actions.some(a=>a.kind==='RETRY');i++) view=await command(cookie,view);
      view=await command(cookie,view,view.actions.find(a=>a.kind==='RETRY')!.id);
      expect(view.diagnostics?.energy).toBe(3);
      for(let i=0;i<15 && view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
      view=await command(cookie,view,view.actions.find(a=>a.kind==='CONSULT')!.id);
      view=await command(cookie,view);
      expect(view.text).toBe(chosen!.en);
      expect(view.diagnostics?.energy).toBe(2);
      expect(requests).toBe(1);
      expect(await prisma.gameConsultationSlot.findUniqueOrThrow({where:key})).toEqual(slot);
    } finally {
      server.closeAllConnections();
      await new Promise<void>(resolve=>server.close(()=>resolve()));
      for(const [key,value] of [['AMI_AI_GENERATION',previous.flag],['AMI_AI_INTERNAL_TOKEN',previous.token],['AI_SERVICE_URL',previous.url]] as const) {
        if(value===undefined) delete process.env[key]; else process.env[key]=value;
      }
    }
  },30000);

  it('persists three distinct new RANDOM slots during provider timeout and replays without reroll', async () => {
    const previous={flag:process.env.AMI_AI_GENERATION,token:process.env.AMI_AI_INTERNAL_TOKEN,url:process.env.AI_SERVICE_URL};
    delete process.env.AMI_AI_GENERATION;
    const {cookie,view:initial}=await create();
    let view=initial;
    for(let i=0;i<120 && view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
    expect(view.sceneId).toBe('A02-S01');
    const row=await prisma.gameSession.findUniqueOrThrow({where:{tokenDigest:digest(cookie.split('=')[1])}});
    let requests=0;
    const server=createServer((req,res)=>{
      let raw='';
      req.on('data',(chunk:Buffer)=>{raw+=chunk.toString();});
      req.on('end',()=>{
        requests++;
        const body=JSON.parse(raw) as {requestId:string;category:string};
        if(body.category!=='RANDOM') {res.writeHead(400);res.end();return;}
        res.writeHead(200,{'Content-Type':'application/json'});
        res.end(JSON.stringify({requestId:body.requestId,status:'FALLBACK_REQUIRED',reason:'TIMEOUT'}));
      });
    });
    server.listen(0,'127.0.0.1'); await once(server,'listening');
    const address=server.address();
    if(!address || typeof address==='string') throw Error('Mock server address');
    process.env.AMI_AI_GENERATION='1';
    process.env.AMI_AI_INTERNAL_TOKEN='test-only';
    process.env.AI_SERVICE_URL='http://127.0.0.1:'+address.port;
    const rng=jest.spyOn(Math,'random').mockReturnValue(0.99);
    try {
      for(let i=0;i<3;i++){
        const body={commandId:randomUUID(),expectedRevision:view.revision,actionId:view.actions.find(x=>x.kind==='CONSULT')!.id};
        view=(await request(app.getHttpServer()).post('/game/commands').set('Cookie',cookie).send(body).expect(200)).body.view as CurrentView;
        expect(view.diagnostics?.energy).toBe(2-i);
        expect(await prisma.gameCommandReceipt.findUniqueOrThrow({where:{sessionId_commandId:{sessionId:row.id,commandId:body.commandId}}})).toMatchObject({generationStatus:'FALLBACK_REQUIRED',generationReason:'TIMEOUT'});
        for(let j=0;j<8 && view.phase!=='ENCOUNTER';j++) view=await command(cookie,view);
      }
      const slots=await prisma.gameConsultationSlot.findMany({where:{sessionId:row.id,encounterId:'DOG'},orderBy:{slotIndex:'asc'}});
      expect(slots).toHaveLength(3);
      expect(slots.every(s=>s.category==='RANDOM')).toBe(true);
      expect(new Set(slots.map(s=>JSON.stringify(s.localizedText))).size).toBe(3);
      await app.close(); await open();
      view=await command(cookie,view,'DOG-01');
      for(let i=0;i<5 && !view.actions.some(a=>a.kind==='RETRY');i++) view=await command(cookie,view);
      view=await command(cookie,view,view.actions.find(a=>a.kind==='RETRY')!.id);
      for(let i=0;i<15 && view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
      view=await command(cookie,view,view.actions.find(a=>a.kind==='CONSULT')!.id);
      expect(view.diagnostics?.energy).toBe(2);
      expect(requests).toBe(3);
      expect(await prisma.gameConsultationSlot.findMany({where:{sessionId:row.id,encounterId:'DOG'},orderBy:{slotIndex:'asc'}})).toEqual(slots);
    } finally {
      rng.mockRestore();
      server.closeAllConnections();
      await new Promise<void>(resolve=>server.close(()=>resolve()));
      for(const [key,value] of [['AMI_AI_GENERATION',previous.flag],['AMI_AI_INTERNAL_TOKEN',previous.token],['AI_SERVICE_URL',previous.url]] as const) {
        if(value===undefined) delete process.env[key]; else process.env[key]=value;
      }
    }
  },30000);

  it.each(['DOG','RAT'] as const)('recovers an expired %s reservation after restart, with no reroll, double debit or provider call', async encounter => {
    const {cookie,view:initial}=await create();
    let view=initial;
    for(let i=0;i<100 && view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
    if(encounter==='RAT') {
      view=await command(cookie,view,'DOG-04');
      for(let i=0;i<150 && view.phase!=='ENCOUNTER';i++) view=await command(cookie,view);
      expect(view.sceneId).toBe('A03-S02');
    }
    const row=await prisma.gameSession.findUniqueOrThrow({where:{tokenDigest:digest(cookie.split('=')[1])}});
    const state=row.state as unknown as NarrativeState;
    const action=view.actions.find(x=>x.kind==='CONSULT')!;
    const commandId=randomUUID();
    const next=advanceNarrative(state,action.id,state.revision,()=>0);
    const gen=generationRequest(state,next,commandId)!;
    expect(gen.questionId).toBe('Q-'+encounter);
    await prisma.gamePendingGeneration.create({data:{
      sessionId:row.id,commandId,requestDigest:digest(JSON.stringify(['action',state.revision,action.id])),
      nextState:JSON.parse(JSON.stringify(next)) as Prisma.InputJsonObject,
      request:JSON.parse(JSON.stringify(gen)) as Prisma.InputJsonObject,
      deadlineAt:new Date(Date.now()-1000),
    }});
    await app.close(); await open();
    const recovered=await request(app.getHttpServer()).get('/game/view').set('Cookie',cookie).expect(200);
    expect(recovered.body.diagnostics.energy).toBe(2);
    expect(recovered.body.revision).toBe(state.revision+1);
    expect(await prisma.gameConsultationSlot.findUniqueOrThrow({where:{sessionId_encounterId_slotIndex:{sessionId:row.id,encounterId:encounter,slotIndex:1}}})).toMatchObject({category:'CORRECT'});
    expect(await prisma.gamePendingGeneration.count({where:{sessionId:row.id}})).toBe(0);
    const replay=await request(app.getHttpServer()).post('/game/commands').set('Cookie',cookie).send({commandId,expectedRevision:state.revision,actionId:action.id}).expect(200);
    expect(replay.body.status).toBe('REPLAYED');
    expect(replay.body.view).toEqual(recovered.body);
    expect(await prisma.gameCommandReceipt.findUniqueOrThrow({where:{sessionId_commandId:{sessionId:row.id,commandId}}})).toMatchObject({generationStatus:'FALLBACK_REQUIRED',generationReason:'TIMEOUT'});
  },30000);

  it('does not expose integration routes without explicit local flag', async () => {
    delete process.env.AMI_DEV_PREVIEW;
    try { await request(app.getHttpServer()).post('/game/session').send({ locale: 'en' }).expect(404); }
    finally { process.env.AMI_DEV_PREVIEW = '1'; }
  });
});
