// AMI-009 isolated Chapter 4 domain increment. Not yet connected to engine.ts.
// The authoritative session transaction will persist a complete returned state atomically.
import { local, type Locale, type Localized } from './catalog';
import type { Diagnostics } from './engine';
import { AMI_MEMORY_FRAGMENTS, BETRAYAL_DIALOGUE, BETRAYAL_RETURN, DAVID_MEMORY_TRIGGER, FAMILY_RETURN, FINAL_RESTORATION, MANUAL_RECORDS, RESTORATION_DIALOGUE } from './chapter-four-catalog';

type Asset = 'CENA-01' | 'CENA-05' | 'CENA-08' | 'CENA-11' | 'CENA-12';
type Event = 'F3' | 'E-FAMILY' | 'MEM-D4' | 'FB-D4' | 'FB-D5' | 'E-BETRAYAL' | 'E-PAST-RESTORED';
type Beat = Readonly<{ id: string; text: Localized; speaker: string | null; asset: Asset | null; phase: 'NARRATIVE' | 'FLASHBACK' | 'CHAPTER_CARD'; event?: readonly Event[]; interaction?: true; record?: true }>;
const line = (scene: string, b: {id: string; text: Localized; speaker: string}, asset: Asset | null, phase: Beat['phase'] = 'NARRATIVE'): Beat => ({
  id: scene + '/' + b.id, text: b.text, speaker: b.speaker === 'CHILD' ? 'CRIANÇA' : b.speaker, asset, phase,
});
const narration = (id: string, text: Localized, asset: Asset | null, phase: Beat['phase'] = 'NARRATIVE', event?: readonly Event[]): Beat => ({
  id, text, speaker: null, asset, phase, ...(event ? { event } : {}),
});
const s1 = 'A04-S01';
const s2 = 'A04-S02';
const f = (id: string) => s2 + '/' + id;
const r = RESTORATION_DIALOGUE.map(b => line(s1, b, 'CENA-05'));
const family = FAMILY_RETURN.map(b => line(s2, b, 'CENA-05'));
const memory = BETRAYAL_DIALOGUE.map(b => line(s2, b, b.id === 'F09' ? null : 'CENA-01', 'FLASHBACK'));
const returnBeats = BETRAYAL_RETURN.map(b => line(s2, b, 'CENA-05'));
const CARD = 'A04-S01/CHAPTER_CARD';
export const CHAPTER_FIVE_BOUNDARY = 'A05-S01/CHAPTER_CARD';
// Narration translates the source scene directions; no new character dialogue or facts.
const sequence: readonly Beat[] = [
  narration(CARD, local('CAPÍTULO 4 — AMI-108 & DAVID', 'CHAPTER 4 — AMI-108 & DAVID'), null, 'CHAPTER_CARD'),
  ...r.slice(0, 2),
  { ...narration(s1 + '/INSTALL', local('Você instala o componente compatível diretamente em AMI.', 'You install the compatible component directly in AMI.'), 'CENA-05'), interaction: true },
  { ...r[2], event: ['F3'] },
  ...MANUAL_RECORDS.map((text,i): Beat => ({ ...narration(s1 + '/MANUAL-' + (i+1), text, null), record: true })),
  ...r.slice(3),
  narration(f('FB-A1'), local('Uma criança se aproxima de AMI, ainda com todos os seus membros.', 'A child approaches AMI, still with all his limbs.'), 'CENA-08', 'FLASHBACK'),
  ...AMI_MEMORY_FRAGMENTS[0].dialogue.map(b => line(s2,b,'CENA-08','FLASHBACK')),
  narration(f('FB-A1-LAUGH'), local('A criança ri.', 'The child laughs.'), 'CENA-08', 'FLASHBACK'),
  narration(f('FB-A2'), local('AMI canta enquanto a criança adormece.', 'AMI sings as the child falls asleep.'), 'CENA-08', 'FLASHBACK'),
  narration(f('FB-A3'), local('Alarmes soam enquanto a família tenta sair.', 'Alarms sound as the family tries to leave.'), 'CENA-12', 'FLASHBACK'),
  narration(f('FB-A3-PROTECT'), local('AMI se coloca entre a família e a criatura, estendendo os membros para protegê-la.', 'AMI steps between the family and the creature, extending his limbs to protect them.'), 'CENA-12', 'FLASHBACK'),
  narration(f('FB-A4'), local('Interferência. Membros danificados. Um forte impacto.', 'Interference. Damaged limbs. A heavy impact.'), null, 'FLASHBACK'),
  ...AMI_MEMORY_FRAGMENTS[3].dialogue.map(b => line(s2,b,null,'FLASHBACK')),
  narration(f('FB-A4-END'), local('REGISTRO INTERROMPIDO', 'RECORD INTERRUPTED'), null, 'FLASHBACK'),
  narration(f('FAMILY-PAUSE'), local('David permanece ao lado de AMI.', 'David remains beside AMI.'), 'CENA-05'),
  ...family,
  narration(f('FAMILY-END'), local('AMI não responde. David permanece ao lado dele.', 'AMI does not respond. David remains beside him.'), 'CENA-05', 'NARRATIVE', ['E-FAMILY']),
  narration(f('MEM-D4-APPROACH'), local('Você examina um compartimento de alimentação cujo símbolo lembra o do depósito.', 'You examine a power compartment whose symbol resembles the one in the warehouse.'), 'CENA-05'),
  { ...line(s2,DAVID_MEMORY_TRIGGER[0],null,'FLASHBACK'), event: ['MEM-D4'] },
  narration(f('FB-D4'), local('David e Howard encontram o núcleo raro no depósito.', 'David and Howard find the rare core in the warehouse.'), 'CENA-01', 'FLASHBACK', ['FB-D4']),
  ...memory.slice(0,8),
  narration(f('FB-D5'), local('Howard atinge David com a barra de ferro.', 'Howard strikes David with the iron bar.'), 'CENA-11', 'FLASHBACK', ['FB-D5']),
  memory[8],
  narration(f('FB-D5-END'), local('A barra cai no chão. Howard leva o núcleo e seus passos se afastam.', 'The bar falls to the floor. Howard takes the core and his footsteps fade away.'), null, 'FLASHBACK'),
  narration(f('FB-D1-RECALL'), local('As duas crianças daquela lembrança eram David e Howard.', 'The two children in that memory were David and Howard.'), null, 'FLASHBACK'),
  ...returnBeats,
  narration(f('PAST-RESTORED'), local('David olha para o chão. AMI não insiste.', 'David looks down. AMI does not press him.'), 'CENA-05', 'NARRATIVE', ['E-BETRAYAL','E-PAST-RESTORED']),
  narration(CHAPTER_FIVE_BOUNDARY, local('CAPÍTULO 5 — DE NADA, BOBO', 'CHAPTER 5 — YOU’RE WELCOME, BOBO'), null, 'CHAPTER_CARD'),
];
export type ChapterFourProgress = Readonly<{
  stepId: string; reviewStepId: string | null; revision: number; locale: Locale;
  diagnostics: Diagnostics; events: readonly Event[];
}>;
export function beginFour(diagnostics: Diagnostics, previousEvents: readonly string[], locale: Locale, revision: number): ChapterFourProgress {
  if (!previousEvents.includes('F2') || !previousEvents.includes('E-ESCAPE-ROUTE') ||
      diagnostics.energy !== 3 || diagnostics.med !== 75 || diagnostics.bio !== 85 ||
      diagnostics.hist !== 78 || diagnostics.personal !== 5 || diagnostics.personalUnlocked) throw Error('CHAPTER_FOUR_NOT_READY');
  return { stepId: CARD, reviewStepId: null, diagnostics, locale, revision, events: [] };
}
function indexes(state: ChapterFourProgress) {
  const reached = sequence.findIndex(b=>b.id===state.stepId);
  const visible = state.reviewStepId ? sequence.findIndex(b=>b.id===state.reviewStepId) : reached;
  if (reached<0 || visible<0 || visible>reached || (state.reviewStepId && visible===reached)) throw Error('INVALID_CHAPTER_FOUR_STATE');
  return {reached,visible};
}
export function viewFour(state: ChapterFourProgress) {
  const {reached,visible}=indexes(state);
  const b=sequence[visible];
  const actions: {id:string; kind:'CONTINUE'|'INTERACT'|'PREVIOUS'; label:string}[]=[];
  if (visible<sequence.length-1) actions.push({id:b.id+'/NEXT',kind:!state.reviewStepId && b.interaction?'INTERACT':'CONTINUE',
    label:(!state.reviewStepId&&b.interaction?local('Instalar componente','Install component'):local('Continuar','Continue'))[state.locale]});
  // Never expose future steps or reapply effects in review.
  if(visible>0) actions.push({id:b.id+'/PREVIOUS',kind:'PREVIOUS',label:local('Fala anterior','Previous dialogue')[state.locale]});
  return {revision:state.revision,locale:state.locale,stepId:b.id,phase:b.phase,
    speaker:b.speaker==='CRIANÇA'&&state.locale==='en'?'CHILD':b.speaker,
    text:b.text[state.locale],asset:b.asset,record:b.record===true,diagnostics:state.diagnostics,actions,
    reached:sequence[reached].id};
}
export function advanceFour(state: ChapterFourProgress, actionId: string, revision: number): ChapterFourProgress {
  if (revision!==state.revision) throw Error('STALE_REVISION');
  const {reached,visible}=indexes(state);
  const action=viewFour(state).actions.find(a=>a.id===actionId);
  if(!action) throw Error('ACTION_NOT_ALLOWED');
  if(action.kind==='PREVIOUS') return {...state,reviewStepId:sequence[visible-1].id,revision:revision+1};
  if(state.reviewStepId) return {...state,reviewStepId:visible+1===reached?null:sequence[visible+1].id,revision:revision+1};
  const target=sequence[reached+1];
  const events=[...state.events];
  for(const event of target.event??[]) if(!events.includes(event)) events.push(event);
  // F3 and all diagnostics are one returned immutable state, never separate writes.
  const diagnostics=target.event?.includes('F3')?FINAL_RESTORATION:state.diagnostics;
  return {...state,stepId:target.id,reviewStepId:null,revision:revision+1,events,diagnostics};
}
