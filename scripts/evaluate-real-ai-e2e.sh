#!/usr/bin/env bash
# Isolated manual benchmark; never run against the game database.
(
  set -euo pipefail
  cd ~/ami-108
  test "$(git branch --show-current)" = main
  test "$(git rev-parse --short HEAD)" = af212f0
  test -z "$(git status --porcelain)"
  git fetch origin feat/ai-rag-foundation
  candidate=47c7621e473abc5ee0b89db0f259ebbd3729a1c3
  git cat-file -e "$candidate^{commit}"
  worktree=$(mktemp -d /tmp/ami108-eval.XXXXXX)
  tag="ami108-eval-$(printf '%s' "${worktree##*.}" | LC_ALL=C tr '[:upper:]' '[:lower:]')"
  net="$tag-net"
  server="$tag-ollama"
  volume="$tag-models"
  image="$tag-ai"
  db="$tag-db"
  ai="$tag-service"
  api="$tag-api"
  web="$tag-web"
  dbvolume="$tag-dbdata"
  apiimage="$tag-api-image"
  webimage="$tag-web-image"
  cleanup() {
    docker rm -f "$web" "$api" "$ai" "$db" >/dev/null 2>&1 || true
    docker volume rm "$dbvolume" >/dev/null 2>&1 || true
    docker rm -f "$server" >/dev/null 2>&1 || true
    docker network rm "$net" >/dev/null 2>&1 || true
    docker volume rm "$volume" >/dev/null 2>&1 || true
    git worktree remove "$worktree" >/dev/null 2>&1 || true
  }
  trap cleanup EXIT
  git worktree add --detach "$worktree" "$candidate"
  df -h /
  docker build -t "$image" "$worktree/services/ai"
  docker build -f "$worktree/infra/node.Dockerfile" --target api -t "$apiimage" "$worktree"
  docker build -f "$worktree/infra/node.Dockerfile" --target web -t "$webimage" "$worktree"
  docker pull postgres:17-alpine
  docker pull ollama/ollama@sha256:910d0d8107b538fb0894e63163eb195de0cc7aefcbc666dc62d3b18f71124592
  ollama_image=$(docker image inspect --format '{{.Id}}' ollama/ollama@sha256:910d0d8107b538fb0894e63163eb195de0cc7aefcbc666dc62d3b18f71124592)
  printf 'Candidate: %s\nOllama image: %s\n' "$candidate" "$ollama_image"
  docker image inspect --format '{{json .RepoDigests}}' "$ollama_image"
  docker volume create "$volume"
  docker network create --internal "$net"
  docker run -d --name "$server" --network bridge \
    -e OLLAMA_NO_CLOUD=1 -e OLLAMA_HOST=0.0.0.0:11434 \
    -e OLLAMA_NUM_PARALLEL=1 -e OLLAMA_MAX_LOADED_MODELS=1 \
    -v "$volume:/root/.ollama" "$ollama_image"
  ready=0
  for i in $(seq 1 30); do
    if docker exec "$server" ollama list >/dev/null 2>&1; then
      ready=1; break
    fi
    sleep 2
  done
  test "$ready" = 1
  docker logs "$server" 2>&1 | grep -i 'cloud disabled: true'
  docker exec "$server" ollama --version
  docker exec "$server" ollama pull qwen2.5:1.5b
  docker exec "$server" ollama list
  docker network connect --alias ollama "$net" "$server"
  docker network disconnect bridge "$server"
  docker inspect --format '{{json .NetworkSettings.Networks}}' "$server"
  docker network inspect --format '{{.Internal}}' "$net"
  # Everything below uses only the newly created internal network and volume.
  docker volume create "$dbvolume"
  password=$(openssl rand -hex 24)
  token=$(openssl rand -hex 32)
  database="postgresql://ami_test:$password@db:5432/ami_test?schema=public"
  docker run -d --name "$db" --network "$net" --network-alias db \
    -e POSTGRES_USER=ami_test -e POSTGRES_PASSWORD="$password" -e POSTGRES_DB=ami_test \
    -v "$dbvolume:/var/lib/postgresql/data" postgres:17-alpine
  ready=0
  for i in $(seq 1 60); do
    if docker exec "$db" pg_isready -U ami_test -d ami_test >/dev/null 2>&1; then ready=1; break; fi
    sleep 1
  done
  test "$ready" = 1
  docker run -d --name "$ai" --network "$net" --network-alias ai \
    -e AMI_AI_INTERNAL_TOKEN="$token" -e AMI_AI_PROVIDER=ollama \
    -e AMI_OLLAMA_URL=http://ollama:11434 -e AMI_OLLAMA_MODEL=qwen2.5:1.5b "$image"
  docker run -d --name "$api" --network "$net" --network-alias api \
    -e DATABASE_URL="$database" -e AMI_AI_GENERATION=1 -e AMI_AI_INTERNAL_TOKEN="$token" \
    -e AI_SERVICE_URL=http://ai:8000 -e AMI_DEV_PREVIEW=1 "$apiimage"
  docker run -d --name "$web" --network "$net" --network-alias web \
    -e API_URL=http://api:3001 -e AMI_DEV_PREVIEW=1 -e AMI_PUBLIC_ORIGIN=http://web:3000 "$webimage"
  wait_stack() {
    local ready=0
    for i in $(seq 1 90); do
      if docker exec "$api" node -e 'Promise.all(["http://localhost:3001/health/ready","http://ai:8000/health","http://web:3000/health"].map(async u=>{if(!(await fetch(u,{signal:AbortSignal.timeout(1000)})).ok)throw Error("not ready")})).catch(()=>process.exit(1))' >/dev/null 2>&1; then ready=1; break; fi
      sleep 2
    done
    test "$ready" = 1
  }
  wait_stack
  echo '=== Warmup only: outside gameplay timing ==='
  docker run --rm -i --network "$net" "$image" /app/.venv/bin/python -u - <<'PYTHON'
import http.client
import json
import time
started = time.monotonic()
conn = http.client.HTTPConnection("ollama", 11434, timeout=90)
try:
    body = {"model": "qwen2.5:1.5b", "prompt": "Reply with the single digit 0.",
            "stream": False, "keep_alive": "5m", "options": {"temperature": 0, "num_predict": 4}}
    conn.request("POST", "/api/generate", json.dumps(body), {"Content-Type": "application/json"})
    response = conn.getresponse()
    if response.status != 200:
        raise RuntimeError("Warmup failed")
    result = json.loads(response.read(16385))
    if result.get("done") is not True:
        raise RuntimeError("Warmup incomplete")
    print(json.dumps({"phase": "warmup", "elapsedMs": round((time.monotonic()-started)*1000)}))
finally:
    conn.close()
PYTHON
  drive() {
    docker exec -i "$api" node - "$1" <<'NODE'
const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const fs = require('node:fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const phase = process.argv[2];
const origin = 'http://web:3000';
const file = '/tmp/ami-e2e-resume.json';
let cookie, view;
let sessionId;
const hash = value => createHash('sha256').update(value).digest('hex');
async function call(endpoint, method='GET', body, expected=200) {
  const res = await fetch(origin+'/api/game/'+endpoint, {
    method, headers: { Origin: origin, ...(cookie ? {Cookie:cookie}:{}),
      ...(body ? {'Content-Type':'application/json'}:{}) },
    body: body ? JSON.stringify(body):undefined, signal:AbortSignal.timeout(12000),
  });
  assert.equal(res.status, expected, endpoint+' HTTP status');
  return res;
}
async function create(locale) {
  cookie=undefined;
  const res=await call('session','POST',{locale},201);
  cookie=res.headers.get('set-cookie').split(';')[0];
  view=await res.json();
  const row=await prisma.gameSession.findUniqueOrThrow({where:{tokenDigest:hash(cookie.split('=')[1])}});
  sessionId=row.id;
}
async function send(actionId=view.actions[0].id) {
  const body={commandId:randomUUID(),expectedRevision:view.revision,actionId};
  const result=await (await call('commands','POST',body)).json();
  assert.equal(result.status,'APPLIED');
  view=result.view;
  return body;
}
async function until(predicate, limit) {
  for(let i=0;i<limit && !predicate();i++) {
    const next=view.actions.find(a=>a.kind==='CONTINUE'||a.kind==='INTERACT');
    assert.ok(next,'expected progress action');
    await send(next.id);
  }
  assert.ok(predicate(),'expected narrative boundary');
}
async function receipt(body) {
  return prisma.gameCommandReceipt.findUniqueOrThrow({where:{sessionId_commandId:{sessionId,commandId:body.commandId}}});
}
async function readSlot(encounter) {
  return prisma.gameConsultationSlot.findUniqueOrThrow({where:{sessionId_encounterId_slotIndex:{sessionId,encounterId:encounter,slotIndex:1}}});
}
async function verifyIntro(expected) {
  const rows=await prisma.gameCommandReceipt.findMany({where:{sessionId,generationStatus:{not:null}}});
  assert.equal(rows.length,1,'one introduction generation receipt');
  console.log(JSON.stringify({context:'INTRO',status:rows[0].generationStatus,reason:rows[0].generationReason}));
  assert.equal(rows[0].generationStatus,expected);
}
async function consult(encounter,expected,locale,checkRetry) {
  const action=view.actions.find(a=>a.kind==='CONSULT');
  assert.ok(action);
  const body={commandId:randomUUID(),expectedRevision:view.revision,actionId:action.id};
  const started=Date.now();
  const sendSame=()=>call('commands','POST',body).then(r=>r.json());
  const pair=await Promise.all([sendSame(),sendSame()]);
  assert.deepEqual(pair.map(x=>x.status).sort(),['APPLIED','REPLAYED']);
  assert.deepEqual(pair[0].view,pair[1].view);
  view=pair[0].view;
  assert.equal(view.diagnostics.energy,2);
  const audit=await receipt(body);
  const slot=await readSlot(encounter);
  console.log(JSON.stringify({context:encounter,locale,status:audit.generationStatus,reason:audit.generationReason,
    elapsedMs:Date.now()-started,category:slot.category,energy:view.diagnostics.energy}));
  assert.equal(audit.generationStatus,expected);
  assert.equal(await prisma.gameConsultationSlot.count({where:{sessionId,encounterId:encounter}}),1);
  await send();
  assert.ok(view.text===slot.localizedText[locale],'display matches persisted localized slot');
  if(!checkRetry) return;
  const other=locale==='pt-BR'?'en':'pt-BR';
  view=(await (await call('locale','PATCH',{commandId:randomUUID(),expectedRevision:view.revision,locale:other})).json()).view;
  assert.ok(view.text===slot.localizedText[other],'locale maps saved bilingual slot');
  await until(()=>view.phase==='ENCOUNTER',4);
  await send(encounter+'-01');
  await until(()=>view.actions.some(a=>a.kind==='RETRY'),4);
  await send(view.actions.find(a=>a.kind==='RETRY').id);
  assert.equal(view.diagnostics.energy,3);
  await until(()=>view.phase==='ENCOUNTER',15);
  const before=await prisma.gameCommandReceipt.count({where:{sessionId,generationStatus:{not:null}}});
  await send(view.actions.find(a=>a.kind==='CONSULT').id);
  await send();
  assert.ok(view.text===slot.localizedText[other],'retry reuses saved slot');
  assert.equal(view.diagnostics.energy,2);
  assert.deepEqual(await readSlot(encounter),slot);
  assert.equal(await prisma.gameCommandReceipt.count({where:{sessionId,generationStatus:{not:null}}}),before);
  await until(()=>view.phase==='ENCOUNTER',4);
  console.log(JSON.stringify({context:encounter,duplicate:true,locale:true,retry:true,singleDebit:true,cached:true}));
}
async function main(){
  if(phase==='online'){
    await create('pt-BR');
    await until(()=>view.phase==='ENCOUNTER',120);
    assert.equal(view.sceneId,'A02-S01');
    await verifyIntro('VALIDATED');
    await consult('DOG','VALIDATED','pt-BR',true);
    await send('DOG-04');
    await until(()=>view.phase==='ENCOUNTER',150);
    assert.equal(view.sceneId,'A03-S02');
    await consult('RAT','VALIDATED','en',true);
    await send('RAT-02');
    await until(()=>view.chapter===4,30);
    assert.deepEqual(view.diagnostics,{energy:3,med:75,bio:85,hist:78,personal:5,personalUnlocked:false});
    assert.equal(await prisma.gameCheckpoint.count({where:{sessionId}}),2);
    assert.equal(await prisma.gamePendingGeneration.count({where:{sessionId}}),0);
    fs.writeFileSync(file,JSON.stringify({cookie,view,sessionId}),{mode:0o600});
    console.log('ONLINE: real provider, bilingual slots, duplicate/retry, checkpoints and F2 passed.');
  }else if(phase==='offline'){
    ({cookie,view,sessionId}=JSON.parse(fs.readFileSync(file,'utf8')));
    assert.deepEqual(await (await call('view')).json(),view);
    assert.equal(await prisma.gameConsultationSlot.count({where:{sessionId}}),2);
    console.log('RESTART: saved session and both slots retained.');
    await create('pt-BR');
    await until(()=>view.phase==='ENCOUNTER',120);
    await verifyIntro('FALLBACK_REQUIRED');
    await consult('DOG','FALLBACK_REQUIRED','pt-BR',true);
    await send('DOG-04');
    await until(()=>view.phase==='ENCOUNTER',150);
    await consult('RAT','FALLBACK_REQUIRED','en',true);
    await send('RAT-02');
    await until(()=>view.chapter===4,30);
    assert.deepEqual(view.diagnostics,{energy:3,med:75,bio:85,hist:78,personal:5,personalUnlocked:false});
    assert.equal(await prisma.gamePendingGeneration.count({where:{sessionId}}),0);
    console.log('OFFLINE: authored fallback, persistence and progression passed.');
  }else throw Error('unknown phase');
}
main().catch(err=>{console.error(err.message);process.exitCode=1;}).finally(()=>prisma.$disconnect());
NODE
  }
  drive online
  docker restart "$api" >/dev/null
  wait_stack
  docker stop "$server" >/dev/null
  drive offline
  echo 'ISOLATED E2E PASSED'
)
