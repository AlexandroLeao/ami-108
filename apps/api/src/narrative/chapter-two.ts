// Server-only Chapter 2 presentation and transitions, based on Master v1.11 / Script v1.9.
// The existing Chapter 1 state version and handoff ID are deliberately retained.
import { CHAPTERS, OPENING_ASSETS, local, type Cue, type EventId, type Localized, type OpeningAsset } from './catalog';
import { DOG, chooseEncounter, consultEncounter, retryEncounter, startEncounter, successVariant, type EncounterState } from './encounter';
import { NarrativeError, type CurrentView, type Diagnostics, type NarrativeAction, type NarrativeState } from './engine';

const DOG_SCENE = 'A02-S01';
const TERMINAL = 'A02-S02';
const END = 'A03-S01/CHAPTER_CARD';
const FIRST = DOG_SCENE + '/L01';
const ENTRY = DOG_SCENE + '/PRE-01';
const darkIntro = ['PRE-01', 'PRE-02', 'PRE-03'].map(id => DOG_SCENE + '/' + id);
type Speaker = 'AMI' | 'UNKNOWN' | 'VOICE' | 'NARRATION' | 'NONE';
type Beat = { speaker: Speaker; text: Localized };
const beats: Readonly<Record<string, Beat>> = {
  "A02-S01/PRE-01": { speaker: 'NARRATION', text: local("Vocês partem em direção ao terminal de manutenção.", "You set off together toward the maintenance terminal.") },
  "A02-S01/PRE-02": { speaker: 'NARRATION', text: local("De repente, ruídos vindos dos veículos à frente interrompem sua caminhada.", "Suddenly, noises from the vehicles ahead interrupt your walk.") },
  "A02-S01/PRE-03": { speaker: 'NARRATION', text: local("Você observa com atenção o ponto de onde vêm os ruídos.", "You look closely toward the source of the noises.") },
  "A02-S01/L01": { speaker: 'UNKNOWN', text: local("Puta merda! O que é aquilo?!", "Holy shit! What is that thing?!") },
  "A02-S01/L02": { speaker: 'AMI', text: local("Olha a língua.", "Language.") },
  "A02-S01/L03": { speaker: 'UNKNOWN', text: local("Você tá falando sério?!", "Are you serious?!") },
  "A02-S01/L04": { speaker: 'AMI', text: local("Afirmativo.", "Affirmative.") },
  "A02-S01/WARNING-01": { speaker: 'NARRATION', text: local("Você percebe que a criatura à sua frente não é amistosa.", "You realize the creature ahead is not friendly.") },
  "A02-S01/WARNING-02": { speaker: 'NARRATION', text: local("Se quiser sobreviver, precisará tomar a decisão certa.", "If you want to survive, you will have to make the right decision.") },
  "A02-S01/Q-DOG": { speaker: 'UNKNOWN', text: local("AMI, como a gente passa por essa coisa?", "AMI, how do we get past that thing?") },
  "A02-S01/R-DOG": { speaker: 'UNKNOWN', text: local("Certo... Pelo visto, dessa vez estou por conta própria.", "Right... Looks like I'm on my own this time.") },
  "A02-S01/A1": { speaker: 'UNKNOWN', text: local("Quase morri lá atrás. Você sabe disso, né?", "I almost died back there. You know that, right?") },
  "A02-S01/A2": { speaker: 'AMI', text: local("Sua sobrevivência foi confirmada.", "Your survival has been confirmed.") },
  "A02-S01/A3": { speaker: 'UNKNOWN', text: local("Não foi graças a você.", "No thanks to you.") },
  "A02-S01/A4": { speaker: 'AMI', text: local("Reconheço essa informação.", "I acknowledge that information.") },
  "A02-S01/A5": { speaker: 'AMI', text: local("É por isso que precisamos recuperar meus arquivos, Bobo.", "That is why we need to recover my files, Bobo.") },
  "A02-S01/A6": { speaker: 'UNKNOWN', text: local("É... Vamos encontrar logo essa porcaria de terminal.", "Yeah... Let's find that damn terminal.") },
  "A02-S01/B1": { speaker: 'UNKNOWN', text: local("Até que você serve pra alguma coisa.", "You're actually good for something.") },
  "A02-S01/B2": { speaker: 'AMI', text: local("Obrigado. Acredito.", "Thank you. I think.") },
  "A02-S01/B3": { speaker: 'UNKNOWN', text: local("Vamos tentar melhorar essas suas respostas.", "Let's try to improve those answers of yours.") },
  "A02-S01/B4": { speaker: 'AMI', text: local("Essa também é minha intenção.", "That is also my intention.") },
  "A02-S01/C1": { speaker: 'UNKNOWN', text: local("Por pouco. Agora, onde fica esse terminal?", "That was close. Now, where's that terminal?") },
  "A02-S01/C2": { speaker: 'AMI', text: local("Logo adiante. Recuperar meus arquivos continua sendo uma prioridade.", "Just ahead. Recovering my files remains a priority.") },
  "A02-S02/ARRIVAL-01": { speaker: 'NARRATION', text: local("Vocês chegam ao terminal de manutenção indicado por AMI.", "You reach the maintenance terminal AMI directed you to.") },
  "A02-S02/ARRIVAL-02": { speaker: 'NARRATION', text: local("Você retira AMI da mochila e o posiciona junto ao painel.", "You take AMI out of your backpack and position him beside the panel.") },
  "A02-S02/ARRIVAL-03": { speaker: 'NARRATION', text: local("Você observa AMI se conectar ao sistema enquanto emite breves sons eletrônicos.", "You watch AMI connect to the system while emitting brief electronic sounds.") },
  "A02-S02/FOUND": { speaker: 'AMI', text: local("Encontrado.", "Found.") },
  "A02-S02/L01": { speaker: 'AMI', text: local("Identifiquei uma unidade compatível com meu sistema de armazenamento.", "I have identified a unit compatible with my storage system.") },
  "A02-S02/L02": { speaker: 'UNKNOWN', text: local("Finalmente. Vamos ver se isso funciona.", "Finally. Let's see if this works.") },
  "A02-S02/L03": { speaker: 'AMI', text: local("Restauração concluída. A integridade dos meus arquivos aumentou significativamente.", "Restoration complete. The integrity of my files has increased significantly.") },
  "A02-S02/L04": { speaker: 'UNKNOWN', text: local("Então vai parar de falar coisas aleatórias?", "So you'll stop saying random things?") },
  "A02-S02/L05": { speaker: 'AMI', text: local("Não posso garantir.", "I cannot guarantee that.") },
  "A02-S02/L06": { speaker: 'AMI', text: local("Recuperei o mapa desta região. Existe um centro de pesquisa nas proximidades.", "I have recovered a map of this area. There is a research facility nearby.") },
  "A02-S02/L07": { speaker: 'UNKNOWN', text: local("Pode ter mais peças pra você lá?", "Think there might be more parts for you there?") },
  "A02-S02/L08": { speaker: 'AMI', text: local("É uma possibilidade.", "It is a possibility.") },
  "A02-S02/L08b": { speaker: 'AMI', text: local("Quanto à minha energia, existe uma forma de recuperá-la.", "As for my energy, there is a way to restore it.") },
  "A02-S02/L09": { speaker: 'AMI', text: local("Minha energia de processamento pode ser recuperada através da luz solar.", "My processing energy can be restored through sunlight.") },
  "A02-S02/L10": { speaker: 'UNKNOWN', text: local("Então é só deixar você no sol?", "So I just leave you in the sun?") },
  "A02-S02/L11": { speaker: 'AMI', text: local("Correto.", "Correct.") },
  "A02-S02/L12": { speaker: 'UNKNOWN', text: local("Pelo menos um de nós é autossuficiente.", "At least one of us is self-sufficient.") },
  "A02-S02/L13": { speaker: 'AMI', text: local("Você continua sendo necessário para o transporte.", "You are still required for transportation.") },
  "A02-S02/L14": { speaker: 'UNKNOWN', text: local("É. Imaginei.", "Yeah. I figured.") },
  "A02-S02/MEM-D2-PAIN": { speaker: 'UNKNOWN', text: local("Ai!", "Ow!") },
  "A02-S02/MEM-D2": { speaker: 'UNKNOWN', text: local("Minha cabeça de novo!", "My head again!") },
  "A02-S02/MEM-D2-SILENCE": { speaker: 'NONE', text: local("...", "...") },
  "A02-S02/F01": { speaker: 'VOICE', text: local("Sinto muito...", "I'm sorry...") },
  "A02-S02/F01b": { speaker: 'VOICE', text: local("David...", "David...") },
  "A02-S02/MEM-D2-CALL": { speaker: 'AMI', text: local("Bobo? Está tudo bem?", "Bobo? Are you all right?") },
  "A02-S02/L15": { speaker: 'AMI', text: local("Você está apresentando sinais de desconforto.", "You are exhibiting signs of discomfort.") },
  "A02-S02/L16": { speaker: 'UNKNOWN', text: local("David...", "David...") },
  "A02-S02/L17": { speaker: 'AMI', text: local("Informação não compreendida.", "Information not understood.") },
  "A02-S02/L18": { speaker: 'UNKNOWN', text: local("Tinha alguém falando comigo...", "Someone was talking to me...") },
  "A02-S02/L18b": { speaker: 'UNKNOWN', text: local("E disse o meu nome...", "And they said my name...") },
  "A02-S02/L18c": { speaker: 'UNKNOWN', text: local("David... eu me lembro, esse é o meu nome.", "David... I remember, that's my name.") },
  "A02-S02/L19": { speaker: 'AMI', text: local("Registro atualizado. David.", "Record updated. David.") },
  "A02-S02/L20": { speaker: 'AMI', text: local("Bobo.", "Bobo.") },
};
export type ChapterTwoState = Readonly<{
  dog: EncounterState;
  checkpoint: Readonly<{ stepId: string; diagnostics: Diagnostics; events: readonly EventId[] }>;
  // Only reached beats in the current attempt, including the successful continuation.
  trail: readonly string[];
}>;
const dogId = (id: string) => DOG_SCENE + '/' + id;
const terminalId = (id: string) => TERMINAL + '/' + id;
const decision = (count: number) => dogId('DECISION-' + count);
const consultation = (kind: string, count: number) => dogId(kind + '-' + count);
const invalid = (): never => { throw new NarrativeError('INVALID_STATE'); };
const get = (state: NarrativeState) => state.chapterTwo ?? invalid();
const visible = (state: NarrativeState) => state.reviewStepId ?? state.stepId;
const action = (id: string, kind: NarrativeAction['kind'], label: Localized, state: NarrativeState): NarrativeAction => ({ id, kind, label: label[state.locale] });
const next = (state: NarrativeState, id: string, kind: NarrativeAction['kind'] = 'CONTINUE', label = local('Continuar', 'Continue')) => action(id + '/NEXT', kind, label, state);
const previous = (state: NarrativeState, id: string) => action(id + '/PREVIOUS', 'PREVIOUS', local('Fala anterior', 'Previous dialogue'), state);

export function beginChapterTwo(state: NarrativeState): NarrativeState {
  if (!state.diagnostics || state.diagnostics.energy !== 3 || state.diagnostics.bio !== 15) return invalid();
  const events: readonly EventId[] = [...state.events, 'CP-DOG'];
  return { ...state, stepId: ENTRY, reviewStepId: null, revision: state.revision + 1,
    events, chapterTwo: { dog: { ...startEncounter(DOG, state.diagnostics.energy), slots: state.savedDogSlots ?? [] }, checkpoint: { stepId: FIRST, diagnostics: state.diagnostics, events }, trail: [ENTRY] } };
}
function actions(state: NarrativeState, id: string): NarrativeAction[] {
  const c = get(state);
  const index = c.trail.indexOf(id);
  if (index < 0 || c.trail[c.trail.length - 1] !== state.stepId) return invalid();
  const barrier = (step: string) => step.startsWith(dogId('DECISION-')) || [dogId('DEATH'), dogId('DEAD-CARD'), dogId('SUCCESS')].includes(step);
  const back = index > 0 && !barrier(id) && !barrier(c.trail[index - 1]) ? [previous(state, id)] : [];
  // Historical decision screens cannot issue a new choice or debit energy.
  if (state.reviewStepId) return [next(state, id), ...back];
  if (id === END) return back;
  if (id === dogId('DEAD-CARD')) return [action(id + '/RETRY', 'RETRY', local('Retornar ao checkpoint', 'Return to checkpoint'), state)];
  if (id.startsWith(dogId('DECISION-'))) {
    const available: NarrativeAction[] = DOG.choices.map(choice => action(choice.id, 'CHOOSE', choice.label, state));
    if (c.dog.energy > 0 && c.dog.used.length < 3) available.unshift(action(id + '/CONSULT', 'CONSULT', local('Consultar AMI (−1 energia)', 'Consult AMI (−1 energy)'), state));
    return available;
  }
  if (id === terminalId('L02')) return [next(state, id, 'INTERACT', local('Restaurar memória', 'Restore memory')), ...back];
  if (id === terminalId('L08b')) return [next(state, id, 'INTERACT', local('Recarregar energia', 'Recharge energy')), ...back];
  return [next(state, id), ...back];
}
export function chapterTwoAsset(state: NarrativeState): OpeningAsset | null {
  const id = visible(state);
  if (id === END || ['ARRIVAL-01', 'ARRIVAL-02', 'ARRIVAL-03', 'FOUND', 'MEM-D2-PAIN', 'MEM-D2', 'MEM-D2-SILENCE', 'F01', 'F01b', 'MEM-D2-CALL'].some(step => id === terminalId(step)) || darkIntro.includes(id) || /^A02-S01\/[ABC]\d$/.test(id) || [dogId('DEATH'), dogId('DEAD-CARD'), dogId('SUCCESS')].includes(id)) return null;
  return id.startsWith(DOG_SCENE + '/') ? 'CENA-04' : 'CENA-05';
}
export function chapterTwoView(state: NarrativeState): CurrentView {
  const c = get(state);
  const id = visible(state);
  const choices = actions(state, id);
  const locale = state.locale;
  const chapter = id === END ? 3 : 2;
  const sceneId = id.split('/')[0];
  let asset = chapterTwoAsset(state);
  let phase: CurrentView['phase'] = 'NARRATIVE';
  let cue: Cue = 'none';
  let narration = false;
  let speaker: string | null = null;
  let text: Localized;
  if (id === END) {
    asset = null; phase = 'CHAPTER_CARD';
    text = local('CAPÍTULO 3 — PENSAMENTO POSITIVO', 'CHAPTER 3 — STAY POSITIVE');
  } else if (id.startsWith(dogId('DECISION-'))) {
    phase = 'ENCOUNTER'; text = local('Escolha uma ação.', 'Choose an action.');
  } else if (id === dogId('DEATH') || id === dogId('SUCCESS')) {
    const choice = DOG.choices.find(item => item.id === c.dog.selected) ?? invalid();
    text = choice.consequence; narration = true; asset = null; cue = 'none';
    if (id === dogId('DEATH')) phase = 'DEAD';
  } else if (id === dogId('DEAD-CARD')) {
    asset = null; phase = 'DEAD'; text = local('VOCÊ NÃO SOBREVIVEU', 'YOU DID NOT SURVIVE');
  } else {
    let beat = beats[id];
    const q = id.match(/^A02-S01\/(Q|ANSWER|R)-(\d)$/);
    if (q) {
      const slot = c.dog.slots.find(item => item.index === Number(q[2])) ?? invalid();
      beat = q[1] === 'Q' ? beats[dogId('Q-DOG')] : q[1] === 'R' ? beats[dogId('R-DOG')] : { speaker: 'AMI', text: slot.text };
    }
    if (!beat) return invalid();
    text = beat.text;
    const named = sceneId === TERMINAL && ['L18c', 'L19', 'L20'].includes(id.split('/')[1]);
    narration = beat.speaker === 'NARRATION';
    speaker = narration || beat.speaker === 'NONE' ? null : beat.speaker === 'AMI' ? 'AMI-108' : beat.speaker === 'VOICE' ? local('Voz familiar', 'Familiar voice')[locale] : named ? 'DAVID' : '???';
    if (id === FIRST) cue = 'startle';
    if (id === terminalId('L01')) cue = 'fade-in';
    if (id === terminalId('MEM-D2-PAIN')) cue = 'blink-black';
    if (id === terminalId('MEM-D2') || id === terminalId('F01') || id === terminalId('F01b')) cue = 'memory-shiver';
    if (id === terminalId('L18c')) cue = 'name-reveal';
    if (id === terminalId('MEM-D2') || id === terminalId('MEM-D2-SILENCE') || id === terminalId('F01') || id === terminalId('F01b') || id === terminalId('MEM-D2-CALL')) phase = 'FLASHBACK';
    if (id === terminalId('L15')) cue = 'wake';
  }
  return { revision: state.revision, locale, phase, chapter, chapterTitle: CHAPTERS[chapter - 1].title[locale], sceneId,
    speaker, text: text[locale], asset: asset ? { url: `/api/game/asset?key=${asset}`, alt: OPENING_ASSETS[asset][locale] } : null,
    diagnostics: state.diagnostics, actions: choices, pending: false, cue, narration, information: false };
}
function move(state: NarrativeState, id: string, dog = get(state).dog, event?: EventId): NarrativeState {
  const c = get(state);
  if (!state.diagnostics) return invalid();
  let diagnostics = { ...state.diagnostics, energy: dog.energy };
  let events = state.events;
  if (event && !events.includes(event)) {
    events = [...events, event];
    if (event === 'F1') diagnostics = { ...diagnostics, med: 35, bio: 42, hist: 53 };
    if (event === 'SOL-01') diagnostics = { ...diagnostics, energy: 3 };
  }
  // After the encounter, energy is independent of the encounter's historical usage.
  if (state.events.includes('SOL-01')) diagnostics = { ...diagnostics, energy: 3 };
  return { ...state, stepId: id, reviewStepId: null, revision: state.revision + 1, diagnostics, events,
    chapterTwo: { ...c, dog, trail: [...c.trail, id] } };
}
export function advanceChapterTwo(state: NarrativeState, actionId: string, random: () => number): NarrativeState {
  const c = get(state);
  const id = visible(state);
  const allowed = actions(state, id).find(item => item.id === actionId);
  if (!allowed) throw new NarrativeError('ACTION_NOT_ALLOWED');
  if (allowed.kind === 'PREVIOUS') return { ...state, revision: state.revision + 1, reviewStepId: c.trail[c.trail.indexOf(id) - 1] };
  if (state.reviewStepId) {
    const target = c.trail[c.trail.indexOf(id) + 1];
    return { ...state, revision: state.revision + 1, reviewStepId: target === state.stepId ? null : target };
  }
  if (allowed.kind === 'RETRY') {
    const dog = retryEncounter(c.dog);
    if (!state.diagnostics) return invalid();
    return { ...state, stepId: c.checkpoint.stepId, revision: state.revision + 1, reviewStepId: null,
      events: c.checkpoint.events, diagnostics: c.checkpoint.diagnostics, chapterTwo: { ...c, dog, trail: [c.checkpoint.stepId] } };
  }
  if (allowed.kind === 'CONSULT') {
    const { state: dog, slot } = consultEncounter(c.dog, DOG, random);
    return move(state, consultation('Q', slot.index), dog);
  }
  if (allowed.kind === 'CHOOSE') {
    const { state: dog } = chooseEncounter(c.dog, DOG, actionId);
    return move(state, dogId(dog.phase === 'DEAD' ? 'DEATH' : 'SUCCESS'), dog);
  }
  if (id === dogId('DEATH')) return move(state, dogId('DEAD-CARD'));
  if (id === dogId('SUCCESS')) return move(state, dogId(successVariant(c.dog) + '1'));
  const slotBeat = id.match(/^A02-S01\/(Q|ANSWER|R)-(\d)$/);
  if (slotBeat) {
    const count = Number(slotBeat[2]);
    const slot = c.dog.slots.find(item => item.index === count) ?? invalid();
    return move(state, slotBeat[1] === 'Q' ? consultation('ANSWER', count)
      : slotBeat[1] === 'ANSWER' && slot.category === 'RANDOM' ? consultation('R', count) : decision(count));
  }
  const intro = id.match(/^A02-S01\/L0([1-4])$/);
  if (darkIntro.includes(id)) return move(state, darkIntro[darkIntro.indexOf(id) + 1] ?? FIRST);
  if (id === dogId('WARNING-01')) return move(state, dogId('WARNING-02'));
  if (id === dogId('WARNING-02')) return move(state, decision(0));
  if (intro) return move(state, Number(intro[1]) === 4 ? dogId('WARNING-01') : dogId('L0' + (Number(intro[1]) + 1)));
  const branch = id.match(/^A02-S01\/([ABC])(\d)$/);
  if (branch) {
    const last = branch[1] === 'A' ? 6 : branch[1] === 'B' ? 4 : 2;
    return move(state, Number(branch[2]) === last ? terminalId('ARRIVAL-01') : dogId(branch[1] + (Number(branch[2]) + 1)));
  }
  if (id === terminalId('ARRIVAL-01')) return move(state, terminalId('ARRIVAL-02'));
  if (id === terminalId('ARRIVAL-02')) return move(state, terminalId('ARRIVAL-03'));
  if (id === terminalId('ARRIVAL-03')) return move(state, terminalId('FOUND'));
  if (id === terminalId('FOUND')) return move(state, terminalId('L01'));
  if (id === terminalId('MEM-D2-PAIN')) return move(state, terminalId('MEM-D2'));
  if (id === terminalId('MEM-D2')) return move(state, terminalId('MEM-D2-SILENCE'));
  if (id === terminalId('MEM-D2-SILENCE')) return move(state, terminalId('F01'), c.dog, 'FB-D2');
  if (id === terminalId('F01')) return move(state, terminalId('F01b'));
  if (id === terminalId('F01b')) return move(state, terminalId('MEM-D2-CALL'));
  if (id === terminalId('MEM-D2-CALL')) return move(state, terminalId('L15'));
  if (id === terminalId('L18')) return move(state, terminalId('L18b'));
  if (id === terminalId('L18b')) return move(state, terminalId('L18c'), c.dog, 'E-NAME');
  if (id === terminalId('L18c')) return move(state, terminalId('L19'));
  if (id === terminalId('L08')) return move(state, terminalId('L08b'));
  if (id === terminalId('L08b')) return move(state, terminalId('L09'), c.dog, 'SOL-01');
  const terminal = id.match(/^A02-S02\/L(\d\d)$/);
  if (terminal) {
    const n = Number(terminal[1]);
    if (n === 20) return move(state, END);
    if (n === 14) return move(state, terminalId('MEM-D2-PAIN'), c.dog, 'MEM-D2');
    const event = n === 2 ? 'F1' : undefined;
    return move(state, terminalId('L' + String(n + 1).padStart(2, '0')), c.dog, event);
  }
  return invalid();
}
