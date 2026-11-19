// Exercise the built Next.js facade and NestJS API against the disposable CI DB.
// No AI provider, browser automation, or cloud deployment is involved.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

const contract = JSON.parse(await readFile(new URL('../docs/api/game.openapi.json', import.meta.url), 'utf8'));
const schemas = contract.components.schemas;
// Focused wire-shape checks against the documented contract, not a full JSON Schema validator.
function assertShape(name, value) {
  const schema = schemas[name];
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), name);
  for (const key of schema.required) assert.ok(Object.hasOwn(value, key), name + ' missing ' + key);
  for (const key of Object.keys(value)) assert.ok(Object.hasOwn(schema.properties, key), name + ' unexpected ' + key);
}
function assertProjection(view) {
  assertShape('Projection', view);
  for (const field of ['phase','locale','cue']) assert.ok(schemas.Projection.properties[field].enum.includes(view[field]), field);
  assert.equal(view.pending, false);
  assert.ok(Number.isInteger(view.revision) && view.revision >= 0);
  assert.ok(Number.isInteger(view.chapter) && view.chapter >= 1 && view.chapter <= 5);
  if (Object.hasOwn(view, 'complete')) assert.equal(typeof view.complete, 'boolean');
  if (view.diagnostics) assertShape('Diagnostics', view.diagnostics);
  if (view.asset) assertShape('Asset', view.asset);
  for (const action of view.actions) {
    assertShape('Action', action);
    assert.ok(schemas.Action.properties.kind.enum.includes(action.kind));
  }
  for (const chapter of view.chapters) assert.deepEqual(Object.keys(chapter).sort(), ['number','title']);
}
function assertResult(result) {
  assertShape('CommandResult', result);
  assert.ok(schemas.CommandResult.properties.status.enum.includes(result.status));
  assertProjection(result.view);
}
const manifest = JSON.parse(await readFile(new URL('../apps/api/assets/scenes/manifest.json', import.meta.url), 'utf8'));
assert.equal(manifest.scenes.length, 12);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
for (const scene of manifest.scenes) {
  const bytes = await readFile(new URL('../apps/api/assets/scenes/' + scene.file, import.meta.url));
  assert.equal(sha256(bytes), scene.sha256, scene.id + ' manifest hash');
  assert.equal(bytes.readUInt32BE(16), 1536, scene.id + ' width');
  assert.equal(bytes.readUInt32BE(20), 864, scene.id + ' height');
}
const expectedHashes = new Map(manifest.scenes.map(scene => [scene.id, scene.sha256]));
const webOrigin = 'http://127.0.0.1:3000';
const apiOrigin = 'http://127.0.0.1:3001';
const env = { ...process.env, AMI_DEV_PREVIEW: '1', API_URL: apiOrigin, AMI_PUBLIC_ORIGIN: webOrigin };
const children = [
  spawn(process.execPath, ['dist/main.js'], { cwd: 'apps/api', env, stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3000'], { cwd: 'apps/web', env, stdio: 'inherit' }),
];

async function waitFor(url) {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return; } catch { /* startup */ }
    await delay(500);
  }
  throw new Error('Service failed to start: ' + url);
}
let cookie = '';
async function call(endpoint, method = 'GET', body, origin = webOrigin) {
  return fetch(webOrigin + '/api/game/' + endpoint, {
    method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(12000),
  });
}

try {
  await Promise.all([waitFor(apiOrigin + '/health'), waitFor(webOrigin + '/health')]);
  const home = await fetch(webOrigin);
  assert.equal(home.status, 200);
  // Browser baseline applies to successful pages and facade rejection responses.
  function assertBrowserHeaders(response) {
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(response.headers.get('permissions-policy'), 'camera=(), microphone=(), geolocation=()');
    assert.equal(response.headers.get('x-powered-by'), null);
  }
  assertBrowserHeaders(home);
  assertBrowserHeaders(await fetch(webOrigin + '/health'));
  const unauthorized = await call('view');
  assert.equal(unauthorized.status, 401);
  assertBrowserHeaders(unauthorized);
  const invalidOrigin = await call('session', 'POST', { locale: 'pt-BR' }, 'https://other.example');
  assert.equal(invalidOrigin.status, 403);
  assertBrowserHeaders(invalidOrigin);
  assert.match(await home.text(), /AMI-108/);
  assert.equal((await call('view')).status, 401);
  assert.equal((await call('session', 'POST', { locale: 'pt-BR' }, 'https://other.example')).status, 403);
  assert.equal((await call('session')).status, 405);
  assert.equal((await call('internal/generate', 'POST', {})).status, 404);
  assert.equal((await call('view?unexpected=1')).status, 400);
  assert.equal((await call('session', 'POST', { locale: 'pt-BR', extra: true })).status, 400);
  assert.equal((await fetch(webOrigin + '/api/game/session', {
    method:'POST', headers:{Origin:webOrigin,'Content-Type':'text/plain'}, body:'{}'
  })).status, 415);
  assert.equal((await call('session', 'POST', { locale: 'x'.repeat(2048) })).status, 413);
  // A streaming request has no declared Content-Length; enforce the same raw-byte limit.
  const oversizedStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('x'.repeat(1024)));
      controller.enqueue(new TextEncoder().encode('x'.repeat(1025)));
      controller.close();
    }
  });
  assert.equal((await fetch(webOrigin + '/api/game/session', {
    method: 'POST', headers: { Origin: webOrigin, 'Content-Type': 'application/json' },
    body: oversizedStream, duplex: 'half', signal: AbortSignal.timeout(10000)
  })).status, 413);
  const created = await call('session', 'POST', { locale: 'pt-BR' });
  assert.equal(created.status, 201);
  const setCookie = created.headers.get('set-cookie');
  assert.match(setCookie, /^ami_session=[A-Za-z0-9_-]{43}; HttpOnly; SameSite=Lax; Path=\/; Max-Age=2592000$/);
  cookie = setCookie.split(';')[0];
  let view = await created.json();
  assertProjection(view);
  assert.ok(!JSON.stringify(view).includes(cookie.split('=')[1]));
  assert.deepEqual(view.chapters.map(c=>c.number),[1]);
  assert.equal(view.phase, 'CHAPTER_CARD');
  assert.equal(view.asset, null);
  assert.equal((await call('asset?key=CENA-01')).status, 404);
  assert.equal((await call('asset?key=../../secret')).status, 404);
  assert.equal((await call('commands','POST',{commandId:randomUUID(),expectedRevision:view.revision,actionId:'CHAPTER/RESTART/5'})).status,403);
  assert.deepEqual(await (await call('view')).json(),view);
  const verifiedAssets = new Set();
  const verifyCurrentArtwork = async () => {
    if (!view.asset) return;
    const key = new URL(webOrigin + view.asset.url).searchParams.get('key');
    const response = await fetch(webOrigin + view.asset.url, { headers: { Cookie: cookie } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.equal(sha256(Buffer.from(await response.arrayBuffer())), expectedHashes.get(key), key + ' HTTP hash');
    verifiedAssets.add(key);
  };
  const send = async (action) => {
    const body = { commandId: randomUUID(), expectedRevision: view.revision, actionId: action.id };
    const result = await call('commands', 'POST', body);
    assert.equal(result.status, 200);
    const outcome = await result.json();
    assertResult(outcome);
    assert.equal(outcome.status, 'APPLIED');
    view = outcome.view;
    await verifyCurrentArtwork();
    return body;
  };
  for (let i = 0; i < 4; i++) await send(view.actions[0]);
  assert.equal(view.text, 'Onde eu estou?');
  const asset = await fetch(webOrigin + view.asset.url, { headers: { Cookie: cookie } });
  assert.equal(asset.status, 200);
  assert.equal(asset.headers.get('cache-control'), 'private, no-store');
  assertBrowserHeaders(asset);
  const pixels = Buffer.from(await asset.arrayBuffer());
  assert.equal(pixels.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const body = await send(view.actions[0]);
  assert.equal(view.text, 'Sangue...?');
  assert.deepEqual(Buffer.from(await (await fetch(webOrigin + view.asset.url, { headers: { Cookie: cookie } })).arrayBuffer()), pixels);
  const replay = await (await call('commands', 'POST', body)).json();
  assertResult(replay);
  assert.equal(replay.status, 'REPLAYED');
  assert.equal(replay.view.revision, view.revision);
  assert.equal((await call('asset?key=CENA-12')).status, 404);
  const translated = await call('locale', 'PATCH', { commandId: randomUUID(), expectedRevision: view.revision, locale: 'en' });
  assert.equal(translated.status, 200);
  const localeResult = await translated.json();
  assertResult(localeResult);
  view = localeResult.view;
  assert.equal(view.text, 'Blood...?');
  assert.deepEqual(await (await call('view')).json(), view);
  const resumed = await fetch(webOrigin, { headers: { Cookie: cookie } });
  assert.equal(resumed.status, 200);
  for (let i = 0; i < 90 && view.phase !== 'ENCOUNTER'; i++) {
    await send(view.actions.find(action => action.kind === 'CONTINUE' || action.kind === 'INTERACT'));
  }
  assert.equal(view.phase, 'ENCOUNTER');
  assert.equal(view.actions.filter(action => action.kind === 'CHOOSE').length, 4);
  assert.equal((await call('asset?key=CENA-04')).status, 200);
  assert.equal((await call('asset?key=CENA-05')).status, 404);
  await send(view.actions.find(action => action.kind === 'CONSULT'));
  assert.equal(view.diagnostics.energy, 2);
  for (let i = 0; i < 4 && view.phase !== 'ENCOUNTER'; i++) await send(view.actions[0]);
  await send(view.actions.find(action => action.id === 'DOG-01'));
  assert.equal(view.phase, 'DEAD');
  await send(view.actions[0]);
  await send(view.actions.find(action => action.kind === 'RETRY'));
  assert.equal(view.diagnostics.energy, 3);
  for (let i = 0; i < 12 && view.phase !== 'ENCOUNTER'; i++) await send(view.actions[0]);
  await send(view.actions.find(action => action.id === 'DOG-04'));
  for (let i = 0; i < 60 && view.chapter !== 3; i++) await send(view.actions[0]);
  assert.equal(view.chapter, 3);
  assert.deepEqual(view.diagnostics, { energy: 3, med: 35, bio: 42, hist: 53, personal: 5, personalUnlocked: false });
  assert.equal((await call('asset?key=CENA-06')).status, 404);
  await send(view.actions[0]);
  assert.equal(view.asset, null);
  for(let i=0;i<5 && !view.asset;i++) await send(view.actions[0]);
  assert.equal(view.asset.url, '/api/game/asset?key=CENA-06');
  assert.equal((await call('asset?key=CENA-07')).status, 404);
  for(let i=0;i<65 && view.phase!=='ENCOUNTER';i++) await send(view.actions[0]);
  assert.equal(view.sceneId,'A03-S02');
  assert.equal(view.asset.url,'/api/game/asset?key=CENA-07');
  await send(view.actions.find(action=>action.kind==='CONSULT'));
  for(let i=0;i<4 && view.phase!=='ENCOUNTER';i++) await send(view.actions[0]);
  await send(view.actions.find(action=>action.id==='RAT-02'));
  for(let i=0;i<25 && view.chapter!==4;i++) await send(view.actions[0]);
  assert.equal(view.chapter,4);
  assert.deepEqual(view.diagnostics,{energy:3,med:75,bio:85,hist:78,personal:5,personalUnlocked:false});
  assert.deepEqual([...verifiedAssets].sort(), ['CENA-01', 'CENA-02', 'CENA-03', 'CENA-04', 'CENA-05', 'CENA-06', 'CENA-07']);
  assert.equal((await call('asset?key=CENA-08')).status, 404);
  for(let i=0;i<10 && !view.actions.some(a=>a.kind==='INTERACT');i++) await send(view.actions[0]);
  assert.equal(view.actions[0].id,'A04-S01/INSTALL/NEXT');
  const f3=await send(view.actions[0]);
  assert.deepEqual(view.diagnostics,{energy:3,med:100,bio:100,hist:100,personal:100,personalUnlocked:true});
  const repeated=await (await call('commands','POST',f3)).json();
  assert.equal(repeated.status,'REPLAYED');
  assert.deepEqual(repeated.view,view);
  await send(view.actions[0]);
  assert.equal(view.cue,'f3-count');
  assert.match(view.text,/MED-01/);
  await send(view.actions[0]);
  assert.match(view.text,/MEMORIES RESTORED/);
  assert.equal(view.cue,'archive-record');
  assert.equal((await call('asset?key=CENA-12')).status,404);
  for(let i=0;i<100 && view.chapter!==5;i++) await send(view.actions[0]);
  assert.equal(view.chapter,5);
  assert.deepEqual(view.diagnostics,{energy:3,med:100,bio:100,hist:100,personal:100,personalUnlocked:true});
  assert.deepEqual([...verifiedAssets].sort(), ['CENA-01','CENA-02','CENA-03','CENA-04','CENA-05','CENA-06','CENA-07','CENA-08','CENA-11','CENA-12']);
  assert.equal((await call('asset?key=CENA-09')).status,404);
  assert.equal((await call('asset?key=CENA-10')).status,404);
  assert.deepEqual(await (await call('view')).json(),view);
  assert.deepEqual(view.chapters.map(c=>c.number),[1,2,3,4,5]);
  for(let i=0;i<30 && view.phase!=='ENCOUNTER';i++) await send(view.actions[0]);
  assert.equal(view.sceneId,'A05-S01');
  assert.equal(view.asset.url,'/api/game/asset?key=CENA-09');
  assert.equal((await call('asset?key=CENA-10')).status,404);
  await send(view.actions.find(a=>a.kind==='CONSULT'));
  assert.equal(view.diagnostics.energy,2);
  for(let i=0;i<4 && view.phase!=='ENCOUNTER';i++) await send(view.actions[0]);
  await send(view.actions.find(a=>a.id==='BOAR-01'));
  assert.equal(view.phase,'DEAD');
  await send(view.actions[0]);
  await send(view.actions.find(a=>a.kind==='RETRY'));
  assert.equal(view.diagnostics.energy,3);
  for(let i=0;i<12 && view.phase!=='ENCOUNTER';i++) await send(view.actions[0]);
  await send(view.actions.find(a=>a.id==='BOAR-04'));
  for(let i=0;i<40 && !view.complete;i++) await send(view.actions[0]);
  assert.equal(view.complete,true);
  assert.equal(view.text,view.locale==='en'?'TO BE CONTINUED...':'CONTINUA...');
  assert.equal(view.asset,null);
  await send(view.actions[0]);
  assert.equal(view.actions.length,0);
  assert.equal(view.complete,true);
  assert.deepEqual(await (await call('view')).json(),view);
  assert.deepEqual([...verifiedAssets].sort(),[...expectedHashes.keys()].sort());
  assertProjection(view);
  console.log('Wire contract and facade rejection checks passed.');
  console.log('Built Next.js/NestJS smoke passed: complete campaign, all 12 HTTP artwork hashes, session, locale, checkpoints, restoration, launch and credits.');
} finally {
  for (const child of children) child.kill('SIGTERM');
}
