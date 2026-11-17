// AMI-008: server-only Chapter 3 transitions. Existing Chapters 1–2 stay intact.
import { CHAPTERS, OPENING_ASSETS, local, type Cue, type EventId, type Localized, type OpeningAsset } from './catalog';
import { ARRIVAL_MEMORY, LAB_AFTER_RECORDS, LAB_APPROACH, LAB_CONNECT, LAB_ENTRY, LAB_RECORDS, LAB_RETURN, PARTNER_LABEL, RAT, RAT_ENTRY, RAT_QUESTION, RAT_REACTIONS, RAT_SUCCESS, SECOND_FRAGMENT } from './chapter-three-catalog';
import { chooseEncounter, consultEncounter, retryEncounter, startEncounter, successVariant, type EncounterState } from './encounter';
import { NarrativeError, type CurrentView, type Diagnostics, type NarrativeAction, type NarrativeState } from './engine';

const LAB = 'A03-S01';
const RAT_SCENE = 'A03-S02';
const ARCHIVE = 'A03-S03';
export const CHAPTER_FOUR_CARD = 'A04-S01/CHAPTER_CARD';
const lab = (id: string) => LAB + '/' + id;
const rat = (id: string) => RAT_SCENE + '/' + id;
const archive = (id: string) => ARCHIVE + '/' + id;
const decision = (count: number) => rat('DECISION-' + count);
const invalid = (): never => { throw new NarrativeError('INVALID_STATE'); };
const get = (state: NarrativeState) => state.chapterThree ?? invalid();
const visible = (state: NarrativeState) => state.reviewStepId ?? state.stepId;

export type ChapterThreeState = Readonly<{
  trail: readonly string[];
  rat?: EncounterState;
  checkpoint?: Readonly<{ stepId: string; diagnostics: Diagnostics; events: readonly EventId[] }>;
}>;

const labOrder = [...LAB_APPROACH, ...LAB_ENTRY, ...LAB_CONNECT, ...LAB_RECORDS, ...LAB_AFTER_RECORDS, ...ARRIVAL_MEMORY, ...LAB_RETURN];
const labSteps = labOrder.map(beat => lab(beat.id));
const memorySteps = new Set(ARRIVAL_MEMORY.map(beat => lab(beat.id)));
const archiveOrder = SECOND_FRAGMENT.map(beat => archive(beat.id));
// These are presentation instructions grounded in the existing scene descriptions,
// not added character dialogue or new plot facts.
const arrival = local('Vocês seguem adiante até o arquivo central.', 'You proceed to the central archive.');
const restore = local('AMI identifica o segundo componente em um equipamento compatível.', 'AMI identifies the second component in a compatible device.');
const route = local('Com a rota para a instalação militar identificada, vocês sabem para onde seguir.', 'With the route to the military facility identified, you know where to go next.');

function action(state: NarrativeState, id: string, kind: NarrativeAction['kind'], label: Localized): NarrativeAction {
  return { id, kind, label: label[state.locale] };
}
function next(state: NarrativeState, id: string, kind: NarrativeAction['kind'] = 'CONTINUE', label = local('Continuar', 'Continue')) {
  return action(state, id + '/NEXT', kind, label);
}
function actions(state: NarrativeState, id: string): NarrativeAction[] {
  const c = get(state);
  const index = c.trail.indexOf(id);
  if (index < 0 || c.trail.at(-1) !== state.stepId) return invalid();
  const barrier = (step: string) => step.startsWith(rat('DECISION-')) || [rat('DEATH'), rat('DEAD-CARD'), rat('SUCCESS')].includes(step);
  const back = index > 0 && !barrier(id) && !barrier(c.trail[index - 1])
    ? [action(state, id + '/PREVIOUS', 'PREVIOUS', local('Fala anterior', 'Previous dialogue'))] : [];
  if (state.reviewStepId) return [next(state, id), ...back];
  if (id === CHAPTER_FOUR_CARD) return back;
  if (id === rat('DEAD-CARD')) return [action(state, id + '/RETRY', 'RETRY', local('Retornar ao checkpoint', 'Return to checkpoint'))];
  if (id.startsWith(rat('DECISION-'))) {
    const encounter = c.rat ?? invalid();
    const choices = RAT.choices.map(choice => action(state, choice.id, 'CHOOSE', choice.label));
    if (encounter.energy > 0 && encounter.used.length < 3) choices.unshift(action(state, id + '/CONSULT', 'CONSULT', local('Consultar AMI (−1 energia)', 'Consult AMI (−1 energy)')));
    return choices;
  }
  if (id === lab('L05')) return [next(state, id, 'INTERACT', local('Conectar AMI', 'Connect AMI')), ...back];
  if (id === archive('RESTORE')) return [next(state, id, 'INTERACT', local('Restaurar memória', 'Restore memory')), ...back];
  return [next(state, id), ...back];
}

export function beginChapterThree(state: NarrativeState): NarrativeState {
  if (!state.chapterTwo || !state.diagnostics || state.diagnostics.energy !== 3 || state.diagnostics.bio !== 42 || !state.events.includes('F1') || !state.events.includes('E-NAME')) return invalid();
  return { ...state, stepId: lab('PRE-01'), reviewStepId: null, revision: state.revision + 1,
    chapterThree: { trail: [lab('PRE-01')] } };
}

export function chapterThreeAsset(state: NarrativeState): OpeningAsset | null {
  const id = visible(state);
  if (id === CHAPTER_FOUR_CARD || (/^A03-S01\/(PRE-|LAB-|EXIT-)/.test(id) || memorySteps.has(id)) || id === lab('MEM-D3')
    || /^A03-S02\/[ABC]\d$/.test(id) || [rat('DEATH'), rat('DEAD-CARD'), rat('SUCCESS'), archive('DEPART'), archive('ROUTE')].includes(id)) return null;
  if (id.startsWith(LAB + '/')) return 'CENA-06';
  if (id.startsWith(RAT_SCENE + '/')) return 'CENA-07';
  return id === archive('ARRIVAL') || id === archive('RESTORE') ? 'CENA-06' : 'CENA-05';
}

export function chapterThreeView(state: NarrativeState): CurrentView {
  const c = get(state);
  const id = visible(state);
  const sceneId = id.split('/')[0];
  const locale = state.locale;
  const chapter = id === CHAPTER_FOUR_CARD ? 4 : 3;
  const asset = chapterThreeAsset(state);
  let phase: CurrentView['phase'] = 'NARRATIVE';
  let cue: Cue = 'none';
  let speaker: string | null = null;
  let narration = false;
  let text: Localized;
  if (id === CHAPTER_FOUR_CARD) {
    phase = 'CHAPTER_CARD'; text = local('CAPÍTULO 4 — AMI-108 & DAVID', 'CHAPTER 4 — AMI-108 & DAVID');
  } else if (id.startsWith(rat('DECISION-'))) {
    phase = 'ENCOUNTER'; text = local('Escolha uma ação.', 'Choose an action.');
  } else if (id === rat('DEATH') || id === rat('SUCCESS')) {
    text = (RAT.choices.find(choice => choice.id === c.rat?.selected) ?? invalid()).consequence;
    narration = true;
    if (id === rat('DEATH')) phase = 'DEAD';
  } else if (id === rat('DEAD-CARD')) {
    phase = 'DEAD'; text = local('VOCÊ NÃO SOBREVIVEU', 'YOU DID NOT SURVIVE');
  } else if (id === archive('ARRIVAL') || id === archive('RESTORE') || id === archive('ROUTE')) {
    text = id === archive('ARRIVAL') ? arrival : id === archive('RESTORE') ? restore : route; narration = true;
  } else {
    const key = id.split('/')[1];
    const slotBeat = id.match(/^A03-S02\/(Q|ANSWER|R)-(\d)$/);
    let beat;
    if (slotBeat) {
      const slot = c.rat?.slots.find(item => item.index === Number(slotBeat[2])) ?? invalid();
      beat = slotBeat[1] === 'Q' ? RAT_QUESTION : slotBeat[1] === 'R' ? RAT_REACTIONS[slot.recipe ? 0 : 1] : { speaker: 'AMI-108', text: slot.text };
    } else {
      beat = (sceneId === LAB ? labOrder : sceneId === RAT_SCENE ? [...RAT_ENTRY, ...Object.values(RAT_SUCCESS).flat()] : SECOND_FRAGMENT).find(item => item.id === key) ?? invalid();
    }
    text = beat.text;
    speaker = beat.speaker === 'PARTNER' ? PARTNER_LABEL[locale] : beat.speaker === 'RECORD' || beat.speaker === 'NARRATION' ? null : beat.speaker;
    if (beat.speaker === 'NARRATION') narration = true;
    if (beat.speaker === 'RECORD') cue = 'archive-record';
    if (id === lab('L01') || id === lab('L06a')) cue = 'fade-in';
    if (id === rat('L01')) cue = 'startle';
    if (id === lab('MEM-D3')) { cue = 'blink-black'; phase = 'FLASHBACK'; }
    if (memorySteps.has(id)) { phase = 'FLASHBACK'; cue = id === lab('F09') ? 'name-reveal' : 'memory-shiver'; }
    if (id === lab('RETURN-00')) cue = 'wake';
    if (id === lab('EXIT-01')) cue = 'fade-black';
    if (id === archive('L01')) cue = 'fade-in';
  }
  return { revision: state.revision, locale, phase, chapter, chapterTitle: CHAPTERS[chapter - 1].title[locale], sceneId,
    speaker, text: text[locale], asset: asset ? { url: `/api/game/asset?key=${asset}`, alt: OPENING_ASSETS[asset][locale] } : null,
    diagnostics: state.diagnostics, actions: actions(state, id), pending: false, cue, narration, information: false };
}

function move(state: NarrativeState, id: string, options: { encounter?: EncounterState; events?: readonly EventId[]; diagnostics?: Diagnostics; checkpoint?: ChapterThreeState['checkpoint'] } = {}): NarrativeState {
  const c = get(state);
  if (!state.diagnostics) return invalid();
  const events = [...state.events];
  for (const event of options.events ?? []) if (!events.includes(event)) events.push(event);
  const diagnostics = options.diagnostics ?? (options.encounter ? { ...state.diagnostics, energy: options.encounter.energy } : state.diagnostics);
  return { ...state, stepId: id, reviewStepId: null, revision: state.revision + 1, events, diagnostics,
    chapterThree: { ...c, ...(options.encounter ? { rat: options.encounter } : {}), ...(options.checkpoint ? { checkpoint: options.checkpoint } : {}), trail: [...c.trail, id] } };
}

export function advanceChapterThree(state: NarrativeState, actionId: string, random: () => number): NarrativeState {
  const c = get(state);
  const id = visible(state);
  const allowed = actions(state, id).find(item => item.id === actionId);
  if (!allowed) throw new NarrativeError('ACTION_NOT_ALLOWED');
  if (allowed.kind === 'PREVIOUS') return { ...state, reviewStepId: c.trail[c.trail.indexOf(id) - 1], revision: state.revision + 1 };
  if (state.reviewStepId) {
    const target = c.trail[c.trail.indexOf(id) + 1];
    return { ...state, reviewStepId: target === state.stepId ? null : target, revision: state.revision + 1 };
  }
  const diagnostics = state.diagnostics ?? invalid();
  if (allowed.kind === 'RETRY') {
    const checkpoint = c.checkpoint ?? invalid();
    const encounter = retryEncounter(c.rat ?? invalid());
    return { ...state, stepId: checkpoint.stepId, reviewStepId: null, revision: state.revision + 1, events: checkpoint.events, diagnostics: checkpoint.diagnostics,
      chapterThree: { ...c, rat: encounter, trail: [checkpoint.stepId] } };
  }
  if (allowed.kind === 'CONSULT') {
    const { state: encounter, slot } = consultEncounter(c.rat ?? invalid(), RAT, random);
    return move(state, rat('Q-' + slot.index), { encounter });
  }
  if (allowed.kind === 'CHOOSE') {
    const { state: encounter } = chooseEncounter(c.rat ?? invalid(), RAT, actionId);
    return move(state, rat(encounter.phase === 'DEAD' ? 'DEATH' : 'SUCCESS'), { encounter });
  }
  if (id === rat('DEATH')) return move(state, rat('DEAD-CARD'));
  if (id === rat('SUCCESS')) return move(state, rat(successVariant(c.rat ?? invalid()) + '1'));
  const slotBeat = id.match(/^A03-S02\/(Q|ANSWER|R)-(\d)$/);
  if (slotBeat) {
    const count = Number(slotBeat[2]);
    const slot = c.rat?.slots.find(item => item.index === count) ?? invalid();
    return move(state, slotBeat[1] === 'Q' ? rat('ANSWER-' + count) : slotBeat[1] === 'ANSWER' && slot.category === 'RANDOM' ? rat('R-' + count) : decision(count));
  }
  const labIndex = labSteps.indexOf(id);
  if (labIndex >= 0) {
    if (id === lab('EXIT-03')) {
      if (!state.events.includes('E-ARCHIVE') || !state.events.includes('E-PARTNER') || diagnostics.energy !== 3 || diagnostics.bio !== 42) return invalid();
      const events: readonly EventId[] = [...state.events, 'CP-RAT'];
      const encounter = { ...startEncounter(RAT, diagnostics.energy), slots: state.savedRatSlots ?? [] };
      return move(state, rat('L01'), { events: ['CP-RAT'], encounter, checkpoint: { stepId: rat('L01'), diagnostics, events } });
    }
    const target = labSteps[labIndex + 1];
    const events: EventId[] = target === lab('CONNECT-01') ? ['E-ARCHIVE'] : target === lab('MEM-D3') ? ['MEM-D3'] : target === lab('F01') ? ['FB-D3'] : target === lab('RETURN-00') ? ['E-PLANET', 'E-PARTNER'] : [];
    return move(state, target, { events });
  }
  if (id === rat('L01')) return move(state, rat('L02'));
  if (id === rat('L02')) return move(state, rat('L03'));
  if (id === rat('L03')) return move(state, rat('L04'));
  if (id === rat('L04')) return move(state, rat('L05'));
  if (id === rat('L05')) return move(state, rat('WARNING'));
  if (id === rat('WARNING')) return move(state, decision(0));
  const branch = id.match(/^A03-S02\/([ABC])([12])$/);
  if (branch) return move(state, branch[2] === '1' ? rat(branch[1] + '2') : archive('ARRIVAL'));
  if (id === archive('ARRIVAL')) return move(state, archive('RESTORE'));
  if (id === archive('RESTORE')) return move(state, archive('L01'), { events: ['F2'], diagnostics: { ...diagnostics, energy: 3, med: 75, bio: 85, hist: 78 } });
  if (id === archive('L07')) return move(state, archive('ROUTE'));
  if (id === archive('ROUTE')) return move(state, archive('DEPART'));
  if (id === archive('DEPART')) {
    if (!state.events.includes('F2')) return invalid();
    return move(state, CHAPTER_FOUR_CARD, { events: ['E-ESCAPE-ROUTE'] });
  }
  const index = archiveOrder.indexOf(id);
  if (index >= 0 && index + 1 < archiveOrder.length) return move(state, archiveOrder[index + 1]);
  return invalid();
}
