// AMI-009 Chapter 4 domain; engine.ts owns session dispatch.
// The authoritative session transaction persists a complete returned state atomically.
import { local, type Locale, type Localized, type Cue } from './catalog';
import type { Diagnostics } from './engine';
import { AMI_MEMORY_FRAGMENTS, BETRAYAL_DIALOGUE, BETRAYAL_RETURN, DAVID_MEMORY_TRIGGER, FAMILY_RETURN, FINAL_RESTORATION, MANUAL_RECORDS, RESTORATION_DIALOGUE } from './chapter-four-catalog';

type Asset = 'CENA-01' | 'CENA-05' | 'CENA-08' | 'CENA-11' | 'CENA-12';
type Event = 'F3' | 'E-FAMILY' | 'MEM-D4' | 'FB-D4' | 'FB-D5' | 'E-BETRAYAL' | 'E-PAST-RESTORED';
type Beat = Readonly<{ id: string; text: Localized; speaker: string | null; asset: Asset | null; phase: 'NARRATIVE' | 'FLASHBACK' | 'CHAPTER_CARD'; event?: readonly Event[]; interaction?: true; record?: true; cue?: Cue }>;
const line = (scene: string, b: {id: string; text: Localized; speaker: string}, asset: Asset | null, phase: Beat['phase'] = 'NARRATIVE'): Beat => ({
  id: scene + '/' + b.id, text: b.text, speaker: b.speaker === 'CHILD' ? 'CRIANÇA' : b.speaker, asset, phase,
});
const narration = (id: string, text: Localized, asset: Asset | null, phase: Beat['phase'] = 'NARRATIVE', event?: readonly Event[]): Beat => ({
  id, text, speaker: null, asset, phase, ...(event ? { event } : {}),
});
const s1 = 'A04-S01';
const s2 = 'A04-S02';
const f = (id: string) => s2 + '/' + id;
const r = RESTORATION_DIALOGUE.map(b => line(s1, b, null));
const family = FAMILY_RETURN.map(b => line(s2, b, null));
const memory = BETRAYAL_DIALOGUE.map(b => line(s2, b, null, 'FLASHBACK'));
const returnBeats = BETRAYAL_RETURN.map(b => line(s2, b, null));
const CARD = 'A04-S01/CHAPTER_CARD';
export const CHAPTER_FIVE_BOUNDARY = 'A05-S01/CHAPTER_CARD';
// Owner playtest amendments; all dark beats remain assetless.
// Sound is described in text only; no audio or original image changes.
const sequence: readonly Beat[] = [
  narration(CARD, local('CAPÍTULO 4 — AMI-108 & DAVID', 'CHAPTER 4 — AMI-108 & DAVID'), null, 'CHAPTER_CARD'),
  narration(s1+'/APPROACH-01', local('Com a rota recuperada no arquivo central, vocês deixam o complexo para trás e seguem em direção à instalação militar. As ruas estão desertas, e cada desvio exige cuidado.', 'With the route recovered from the central archive, you leave the complex behind and head toward the military facility. The streets are deserted, and every detour calls for caution.'), null),
  narration(s1+'/APPROACH-02', local('Ao chegarem, vocês atravessam os corredores silenciosos até encontrar um terminal de manutenção protegido. AMI examina o equipamento em busca do último componente de que precisa.', 'Upon arrival, you cross the silent corridors until you find a protected maintenance terminal. AMI scans the equipment for the final component he needs.'), null),
  ...r.slice(0, 2),
  { ...narration(s1 + '/INSTALL', local('Com o componente encaixado, você observa AMI iniciar a atualização. Pequenos ruídos eletrônicos quebram o silêncio enquanto ele reconstrói seus arquivos.', 'With the component fitted, you watch AMI begin the update. Soft electronic sounds break the silence as he reconstructs his files.'), null), interaction: true },
  { ...narration(s1+'/FACE-UPDATE', local('Você observa a tela que forma o rosto de AMI se transformar. No lugar de seus olhos, surgem os indicadores de recuperação.', 'You watch the screen that forms AMI’s face change. Recovery indicators appear where his eyes were.'), null), event:['F3'] },
  // The F3 transaction commits all indexes and energy together. The animation is presentation only.
  { ...narration(s1 + '/F3-INDEXES', local('MED-01 — 100%\nBIO-02 — 100%\nHIST-03 — 100%', 'MED-01 — 100%\nBIO-02 — 100%\nHIST-03 — 100%'), null), record: true, cue:'f3-count' },
  { ...narration(s1 + '/F3-PERSONAL', local('MEMÓRIAS RESTAURADAS — 100%', 'MEMORIES RESTORED — 100%'), null), record: true },
  { ...narration(s1+'/L03', local('ARQUIVOS PESSOAIS DISPONÍVEIS', 'PERSONAL FILES AVAILABLE'), null), record:true },
  ...MANUAL_RECORDS.map((text,i): Beat => ({ ...narration(s1 + '/MANUAL-' + (i+1), text, null), record: true })),
  ...r.slice(2),
  narration(f('FB-A1'), local('O rosto de AMI começa a falhar. Linhas de interferência atravessam sua tela, como se uma gravação antiga tentasse voltar à vida.', 'AMI’s face begins to glitch. Lines of interference cross his screen, as though an old recording were struggling back to life.'), null, 'FLASHBACK'),
  line(s2,AMI_MEMORY_FRAGMENTS[0].dialogue[0],null,'FLASHBACK'),
  { ...line(s2,AMI_MEMORY_FRAGMENTS[0].dialogue[1],'CENA-08','FLASHBACK'), cue:'crt-reveal' },
  line(s2,AMI_MEMORY_FRAGMENTS[0].dialogue[2],'CENA-08','FLASHBACK'),
  narration(f('FB-A1-LAUGH'), local('A criança ri.', 'The child laughs.'), 'CENA-08', 'FLASHBACK'),
  narration(f('FB-A2'), local('AMI canta enquanto a criança adormece.', 'AMI sings as the child falls asleep.'), 'CENA-08', 'FLASHBACK'),
  narration(f('FB-A2-RECOGNIZE'), local('Você reconhece a melodia. É a mesma que ouviu quando chegou à residência onde encontrou AMI.', 'You recognize the melody. It is the same one you heard when you reached the house where you found AMI.'), 'CENA-08', 'FLASHBACK'),
  narration(f('FB-A3'), local('As imagens no rosto de AMI mudam.', 'The images on AMI’s face change.'), null, 'FLASHBACK'),
  narration(f('FB-A3-ALARMS'), local('Sons de alarmes e gritos ecoam na gravação.', 'Alarms and screams echo through the recording.'), null, 'FLASHBACK'),
  narration(f('FB-A3-PROTECT'), local('Entre as falhas da gravação, você percebe AMI enfrentando algo, estendendo seus membros para proteger as pessoas atrás dele. A julgar pelos registros anteriores, aquela era sua família.', 'Through the gaps in the recording, you make out AMI facing something, extending his limbs to protect the people behind him. Judging by the earlier recordings, they were his family.'), null, 'FLASHBACK'),
  line(s2,AMI_MEMORY_FRAGMENTS[3].dialogue[0],null,'FLASHBACK'),
  { ...narration(f('FB-A3-IMAGE'), local('',''),'CENA-12','FLASHBACK'), cue:'crt-startle' },
  { ...narration(f('FB-A4'), local('FORTE IMPACTO. MEMÓRIA COMPROMETIDA. ERRO. ERRO. MEMBROS DANIFICADOS. ERRO. ERRO. ERRO.', 'HEAVY IMPACT. MEMORY COMPROMISED. ERROR. ERROR. LIMBS DAMAGED. ERROR. ERROR. ERROR.'), null, 'FLASHBACK'), record:true },
  { ...narration(f('FB-A4-END'), local('REGISTRO INTERROMPIDO', 'RECORD INTERRUPTED'), null, 'FLASHBACK'), record:true },
  narration(f('FAMILY-PAUSE'), local('Os olhos de AMI reaparecem na tela, mas dessa vez estão claramente tristes.', 'AMI’s eyes reappear on the screen, but this time they are clearly sad.'), null),
  ...family,
  narration(f('FAMILY-END'), local('AMI não responde. Você permanece ao seu lado.', 'AMI does not respond. You remain by his side.'), null, 'NARRATIVE', ['E-FAMILY']),
  narration(f('MEM-D4-APPROACH'), local('Até que, novamente, aquela dor intensa retorna à sua cabeça.', 'Until, once again, that intense pain returns to your head.'), null),
  { ...line(s2,DAVID_MEMORY_TRIGGER[0],null,'FLASHBACK'), event: ['MEM-D4'] },
  narration(f('FB-D4'), local('Você abre os olhos e percebe que está de volta ao depósito onde acordou sem memória.', 'You open your eyes and realize you are back in the warehouse where you woke up without your memories.'), null, 'FLASHBACK', ['FB-D4']),
  narration(f('FB-D4-SEARCH'), local('Howard está com você. Vocês vasculham o depósito à procura de algo valioso.', 'Howard is with you. You search the warehouse for something valuable.'), null, 'FLASHBACK'),
  narration(f('FB-D4-FIND'), local('Com dificuldade, você consegue abrir um compartimento metálico emperrado. Por um instante, não acredita no que acaba de encontrar.', 'With difficulty, you manage to pry open a jammed metal compartment. For a moment, you cannot believe what you have just found.'), null, 'FLASHBACK'),
  line(s2,{id:'F00a',speaker:'DAVID',text:local('Puta merda, Howard! Você não vai acreditar no que eu achei!', 'Holy shit, Howard! You won’t believe what I found!')},null,'FLASHBACK'),
  line(s2,{id:'F00b',speaker:'DAVID',text:local('Um núcleo energético de alta densidade! Estamos ricos, cara!', 'A high-density energy core! We’re rich, man!')},null,'FLASHBACK'),
  ...memory.slice(0,7),
  line(s2,{id:'F07b',speaker:'HOWARD',text:local('...','...')},null,'FLASHBACK'),
  memory[7],
  narration(f('FB-D5'), local('Enquanto você se abaixa para guardar o núcleo energético, sente um forte impacto na cabeça. Sua visão escurece e você perde os sentidos.', 'As you bend down to pack the energy core, you feel a heavy blow to your head. Your vision darkens and you lose consciousness.'), null, 'FLASHBACK', ['FB-D5']),
  { ...memory[8], asset:'CENA-11', cue:'disoriented' },
  narration(f('FB-D5-END'), local('Você escuta um som metálico caindo no chão.', 'You hear a metallic object fall to the floor.'), null, 'FLASHBACK'),
  narration(f('FB-D5-RESTORED'), local('Suas memórias retornam por completo.', 'Your memories return in full.'), null, 'FLASHBACK'),
  narration(f('FB-D1-RECALL'), local('Você se dá conta de que as duas crianças brincando naquela lembrança eram você e Howard, seu amigo de infância. A raiva cresce dentro de você ao compreender a traição.', 'You realize that the two children playing in that memory were you and Howard, your childhood friend. Anger grows within you as you understand the betrayal.'), null, 'FLASHBACK'),
  ...returnBeats,
  narration(f('PAST-RESTORED'), local('Você olha para AMI, determinado, e o acomoda novamente na parte da frente da mochila, junto ao peito.', 'You look at AMI with determination and settle him back against your chest, on the front of your backpack.'), null, 'NARRATIVE', ['E-BETRAYAL','E-PAST-RESTORED']),
  narration(f('DEPART'), local('Com suas memórias recuperadas e a rota em mãos, vocês deixam a sala de manutenção e seguem pelos corredores em direção ao hangar militar.', 'With your memories restored and the route in hand, you leave the maintenance room and follow the corridors toward the military hangar.'), null),
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
    label:(!state.reviewStepId&&b.interaction?local('Iniciar atualização','Start update'):local('Continuar','Continue'))[state.locale]});
  // Never expose future steps or reapply effects in review.
  if(visible>0) actions.push({id:b.id+'/PREVIOUS',kind:'PREVIOUS',label:local('Fala anterior','Previous dialogue')[state.locale]});
  return {revision:state.revision,locale:state.locale,stepId:b.id,phase:b.phase,
    speaker:b.speaker==='CRIANÇA'&&state.locale==='en'?'CHILD':b.speaker,
    text:b.text[state.locale],asset:b.asset,record:b.record===true,cue:b.cue,diagnostics:state.diagnostics,actions,
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
