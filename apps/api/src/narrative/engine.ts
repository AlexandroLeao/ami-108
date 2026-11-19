// Pure domain functions: no HTTP, database, provider or browser dependency.
// Persistence and transactional command receipts must wrap these functions.
import { CHAPTERS, CHAPTER_ONE, INTRO_FALLBACK, NARRATIVE_VERSION, OPENING_ASSETS, local, type Cue, type EventId, type Locale, type Localized, type OpeningAsset } from './catalog';

import { beginChapterTwo, chapterTwoView, chapterTwoAsset, advanceChapterTwo, type ChapterTwoState } from './chapter-two';
import type { Energy, Slot } from './encounter';
import { beginChapterThree, chapterThreeView, chapterThreeAsset, advanceChapterThree, CHAPTER_FOUR_CARD, type ChapterThreeState } from './chapter-three';

import { advanceFour, beginFour, viewFour, CHAPTER_FIVE_BOUNDARY, type ChapterFourProgress } from './chapter-four-domain';

import { advanceFive, beginFive, viewFive, type ChapterFiveProgress } from './chapter-five-domain';

type FiveState = Omit<ChapterFiveProgress, 'stepId'|'reviewStepId'|'revision'|'locale'|'diagnostics'|'events'>;
const HANDOFF = 'A02-S01/CHAPTER_CARD';
export type Diagnostics = Readonly<{ energy: Energy; med: number; bio: number; hist: number; personal: number; personalUnlocked: boolean }>;
const INITIAL_DIAGNOSTICS: Diagnostics = { energy: 3, med: 10, bio: 15, hist: 12, personal: 5, personalUnlocked: false };
const actionLabel = local('Continuar', 'Continue');
const actionsByStep: Readonly<Record<string, Localized>> = {
  'A01-S03/L38': local('Seguir para o terminal', 'Head to the terminal'),
};

export type NarrativeState = Readonly<{
  version: typeof NARRATIVE_VERSION;
  stepId: string;
  reviewStepId: string | null;
  locale: Locale;
  revision: number;
  events: readonly EventId[];
  diagnostics: Diagnostics | null;
  chapterTwo?: ChapterTwoState;
  unlockedChapter?: number;
  savedDogSlots?: readonly Slot[];
  savedRatSlots?: readonly Slot[];
  chapterThree?: ChapterThreeState;
  // Optional marker keeps existing saves compatible; the authoritative cursor/events remain shared.
  chapterFour?: true;
  chapterFive?: FiveState;
  savedBoarSlots?: readonly Slot[];
  chapterFiveStart?: Readonly<{ chapterTwo: ChapterTwoState; chapterThree: ChapterThreeState; diagnostics: Diagnostics; events: readonly EventId[] }>;
  chapterFourStart?: Readonly<{ chapterTwo: ChapterTwoState; chapterThree: ChapterThreeState; diagnostics: Diagnostics; events: readonly EventId[] }>;
  chapterThreeStart?: Readonly<{ chapterTwo: ChapterTwoState; diagnostics: Diagnostics; events: readonly EventId[] }>;
  intro: Readonly<{ category: 'RANDOM'; source: 'fallback' | 'generated'; text: Localized }> | null;
}>;
export type NarrativeAction = Readonly<{ id: string; kind: 'CONTINUE' | 'INTERACT' | 'PREVIOUS' | 'CONSULT' | 'CHOOSE' | 'RETRY'; label: string }>;
export type ChapterOption = Readonly<{ number: number; title: string }>;
export type CurrentView = Readonly<{
  revision: number; locale: Locale; phase: 'CHAPTER_CARD' | 'NARRATIVE' | 'FLASHBACK' | 'ENCOUNTER' | 'DEAD';
  chapter: number; chapterTitle: string; sceneId: string; speaker: string | null; text: string;
  asset: { url: `/api/game/asset?key=${OpeningAsset}`; alt: string } | null;
  diagnostics: NarrativeState['diagnostics']; actions: readonly NarrativeAction[]; pending: false;
  // UI-only cues are proposed additions to the game contract.
  cue: Cue;
  narration: boolean;
  information: boolean;
  chapters?: readonly ChapterOption[];
  complete?: boolean;
}>;

export class NarrativeError extends Error {
  constructor(readonly code: 'INVALID_STATE' | 'STALE_REVISION' | 'ACTION_NOT_ALLOWED' | 'INVALID_LOCALE') {
    super(code);
  }
}

function ensureLocale(locale: unknown): asserts locale is Locale {
  if (locale !== 'pt-BR' && locale !== 'en') throw new NarrativeError('INVALID_LOCALE');
}

function currentIndex(state: NarrativeState): number {
  if (state.version !== NARRATIVE_VERSION) throw new NarrativeError('INVALID_STATE');
  if (state.stepId === HANDOFF) return CHAPTER_ONE.length;
  const index = CHAPTER_ONE.findIndex((step) => step.id === state.stepId);
  if (index < 0) throw new NarrativeError('INVALID_STATE');
  return index;
}

export function startNarrative(locale: Locale): NarrativeState {
  ensureLocale(locale);
  return { version: NARRATIVE_VERSION, stepId: CHAPTER_ONE[0].id, reviewStepId: null, locale, revision: 0, events: [], diagnostics: null, intro: null };
}

function checkRevision(state: NarrativeState, expectedRevision: number): void {
  if (!Number.isSafeInteger(expectedRevision) || state.revision !== expectedRevision) throw new NarrativeError('STALE_REVISION');
}

// Review is presentation-only, including already-applied events. The first
// visible warehouse beat is the lower bound; the opening card/dark beats
// cannot be revisited by a new PREVIOUS command.
const FIRST_REVIEWABLE = CHAPTER_ONE.findIndex((step) => step.id === 'A01-S01/L02');
const JOIN_INDEX = CHAPTER_ONE.findIndex((step) => step.event === 'E-JOIN');
function canReviewPrevious(index: number): boolean {
  return index > FIRST_REVIEWABLE && index <= CHAPTER_ONE.length;
}

function visibleIndex(state: NarrativeState): number {
  const authoritative = currentIndex(state);
  if (!state.reviewStepId) return authoritative;
  const index = CHAPTER_ONE.findIndex((step) => step.id === state.reviewStepId);
  // Preserve legacy saved review cursors on the initial dark beats: they
  // may advance to their reached position, but cannot move farther back.
  if (index < 1 || index >= authoritative) throw new NarrativeError('INVALID_STATE');
  return index;
}

// The removed solar tutorial never reappears, including on old saves.
// Resume an authoritative cursor at the next surviving beat, or a review
// cursor at the preceding information card. No event or revision is changed.
function normalizeRetiredTutorial(state: NarrativeState): NarrativeState {
  const retired = 'A01-S03/TUTORIAL-d';
  if (state.stepId !== retired && state.reviewStepId !== retired) return state;
  return { ...state,
    stepId: state.stepId === retired ? 'A01-S03/RETURN-STREET' : state.stepId,
    reviewStepId: state.reviewStepId === retired ? 'A01-S03/TUTORIAL-c' : state.reviewStepId };
}
// Compatibility for saves made before the owner removed solar dialogue and
// condensed the laboratory/rat sequence. Retired steps never become playable.
const retiredTwo = new Set(['L08b','L09','L10','L11','L12','L13','L14'].map(id => 'A02-S02/' + id));
const retiredThree: Readonly<Record<string, string>> = {
  'A03-S01/LAB-TIME': 'A03-S01/L06a',
  'A03-S01/F07': 'A03-S01/F08',
  'A03-S03/SOL-02': 'A03-S03/DEPART',
  'A03-S03/SOL-02-L01': 'A03-S03/DEPART',
  'A03-S03/SOL-02-L02': 'A03-S03/DEPART',
};
function repairTrail(trail: readonly string[], current: string, replacement: string, retired: (id: string) => boolean, review: string | null) {
  const kept = trail.filter(id => !retired(id));
  if (replacement !== current && kept.at(-1) !== replacement) kept.push(replacement);
  let cursor = review;
  if (cursor && retired(cursor)) {
    const previous = trail.slice(0, trail.indexOf(cursor)).filter(id => !retired(id)).at(-1);
    cursor = previous && previous !== replacement ? previous : null;
  }
  return { trail: kept, reviewStepId: cursor === replacement ? null : cursor };
}
function normalizeRetiredScenes(state: NarrativeState): NarrativeState {
  state = normalizeRetiredTutorial(state);
  if (state.chapterTwo && !state.chapterThree) {
    const c = state.chapterTwo;
    const replacement = retiredTwo.has(state.stepId) ? 'A02-S02/MEM-D2-PAIN' : state.stepId;
    const needsTrail = c.trail.some(id => retiredTwo.has(id));
    const needsEnergy = !!state.diagnostics && state.events.includes('F1') && state.diagnostics.energy !== 3;
    if (needsTrail || needsEnergy) {
      const repaired = repairTrail(c.trail,state.stepId,replacement,id=>retiredTwo.has(id),state.reviewStepId);
      const events = replacement !== state.stepId && !state.events.includes('MEM-D2') ? [...state.events,'MEM-D2' as const] : state.events;
      state = { ...state, stepId: replacement, reviewStepId: repaired.reviewStepId, events,
        diagnostics: needsEnergy && state.diagnostics ? {...state.diagnostics,energy:3} : state.diagnostics,
        chapterTwo: {...c,trail:repaired.trail} };
    }
  }
  if (state.chapterThree && !state.chapterFour) {
    const c=state.chapterThree;
    const replacement=retiredThree[state.stepId] ?? state.stepId;
    const needsTrail=c.trail.some(id=>Object.hasOwn(retiredThree,id));
    const needsEnergy=!!state.diagnostics && state.events.includes('F2') && state.diagnostics.energy!==3;
    if(needsTrail || needsEnergy) {
      const repaired=repairTrail(c.trail,state.stepId,replacement,id=>Object.hasOwn(retiredThree,id),state.reviewStepId);
      state={...state,stepId:replacement,reviewStepId:repaired.reviewStepId,
        diagnostics:needsEnergy && state.diagnostics ? {...state.diagnostics,energy:3}:state.diagnostics,
        chapterThree:{...c,trail:repaired.trail}};
    }
  }
  return state;
}
export function currentAsset(state: NarrativeState): OpeningAsset | null {
  state = normalizeRetiredScenes(state);
  if (state.chapterFive) return viewFive(fiveProgress(state)).asset;
  if (state.chapterFour) return viewFour(fourProgress(state)).asset;
  if (state.chapterThree) { chapterThreeView(state); return chapterThreeAsset(state); }
  if (state.chapterTwo) { chapterTwoView(state); return chapterTwoAsset(state); }
  return CHAPTER_ONE[visibleIndex(state)]?.asset ?? null;
}

function currentActions(state: NarrativeState, index: number): readonly NarrativeAction[] {
  const step = CHAPTER_ONE[index];
  const locale = state.locale;
  const previous: NarrativeAction = { id: (step?.id ?? HANDOFF) + '/PREVIOUS', kind: 'PREVIOUS',
    label: locale === 'pt-BR' ? 'Fala anterior' : 'Previous dialogue' };
  if (!step) return [{ id: HANDOFF + '/NEXT', kind: 'CONTINUE', label: actionLabel[locale] }, previous];
  const forward: NarrativeAction = {
    id: step.id + '/NEXT',
    kind: actionsByStep[step.id] ? 'INTERACT' : step.action,
    label: (actionsByStep[step.id] ?? actionLabel)[locale],
  };
  return canReviewPrevious(index)
    ? [forward, previous]
    : [forward];
}

function unlocked(state: NarrativeState): number {
  const reached = state.chapterFive || (state.chapterFour && state.stepId === CHAPTER_FIVE_BOUNDARY) ? 5 : state.chapterFour || state.stepId === CHAPTER_FOUR_CARD ? 4 : state.chapterThree || state.stepId === 'A03-S01/CHAPTER_CARD' ? 3 : state.chapterTwo || state.stepId === HANDOFF ? 2 : 1;
  return Math.min(5, Math.max(reached, state.unlockedChapter ?? 1));
}
export function projectNarrative(state: NarrativeState): CurrentView {
  state = normalizeRetiredScenes(state);
  const view = projectCurrent(state);
  return { ...view, chapters: CHAPTERS.slice(0, unlocked(state)).map(chapter => ({ number: chapter.number, title: chapter.title[state.locale] })) };
}
function projectCurrent(state: NarrativeState): CurrentView {
  ensureLocale(state.locale);
  if (state.version !== NARRATIVE_VERSION) throw new NarrativeError('INVALID_STATE');
  if (state.chapterFive) return projectFive(state);
  if (state.chapterFour) return projectFour(state);
  if (state.chapterThree) {
    const view = chapterThreeView(state);
    if (state.stepId === CHAPTER_FOUR_CARD && !state.reviewStepId) {
      return { ...view, actions: [{ id: CHAPTER_FOUR_CARD + '/NEXT', kind: 'CONTINUE', label: actionLabel[state.locale] }, ...view.actions] };
    }
    return view;
  }
  if (state.chapterTwo) return chapterTwoView(state);
  const index = visibleIndex(state);
  const step = CHAPTER_ONE[index];
  const locale = state.locale;
  if (!step) {
    // Stable handoff ID also resumes sessions created before Chapter 2.
    return { revision: state.revision, locale, phase: 'CHAPTER_CARD', chapter: 2,
      chapterTitle: CHAPTERS[1].title[locale], sceneId: 'A02-S01',
      speaker: null, text: locale === 'pt-BR' ? 'CAPÍTULO 2 — REGISTRO ATUALIZADO' : 'CHAPTER 2 — RECORD UPDATED',
      asset: null, diagnostics: state.diagnostics, actions: currentActions(state, index), pending: false, cue: 'none', narration: false, information: false };
  }
  return {
    revision: state.revision, locale, phase: step.phase, chapter: 1, chapterTitle: CHAPTERS[0].title[locale],
    sceneId: step.sceneId, speaker: step.speaker?.[locale] ?? null,
    text: step.event === 'INTRO-RANDOM' && state.intro ? state.intro.text[locale] : step.text[locale],
    asset: step.asset ? { url: `/api/game/asset?key=${step.asset}`, alt: OPENING_ASSETS[step.asset][locale] } : null,
    diagnostics: index >= JOIN_INDEX ? state.diagnostics : null,
    actions: currentActions(state, index),
    pending: false, cue: step.cue, narration: step.narration === true, information: step.information === true,
  };
}

function retainedSlots(state: NarrativeState): readonly Slot[] {
  const cached = state.savedDogSlots ?? [];
  const current = state.chapterTwo?.dog.slots ?? [];
  // All slots are immutable and allocated sequentially. A restored earlier
  // chapter snapshot can have a shorter prefix than the run-wide cache.
  return current.length > cached.length ? current : cached;
}
function retainedRatSlots(state: NarrativeState): readonly Slot[] {
  const cached = state.savedRatSlots ?? [];
  const current = state.chapterThree?.rat?.slots ?? [];
  return current.length > cached.length ? current : cached;
}
function retainedBoarSlots(state: NarrativeState): readonly Slot[] {
  const cached = state.savedBoarSlots ?? [];
  const current = state.chapterFive?.retainedSlots ?? [];
  return current.length > cached.length ? current : cached;
}
function rememberProgress(state: NarrativeState): NarrativeState {
  const archive = state.stepId === 'A03-S01/CHAPTER_CARD' && state.chapterTwo && state.diagnostics
    ? { chapterTwo: state.chapterTwo, diagnostics: state.diagnostics, events: state.events } : state.chapterThreeStart;
  const four = state.stepId === CHAPTER_FOUR_CARD && state.chapterTwo && state.chapterThree && state.diagnostics
    ? { chapterTwo: state.chapterTwo, chapterThree: state.chapterThree, diagnostics: state.diagnostics, events: state.events } : state.chapterFourStart;
  const five = state.chapterFour && !state.chapterFive && state.stepId === CHAPTER_FIVE_BOUNDARY && state.chapterTwo && state.chapterThree && state.diagnostics
    ? { chapterTwo: state.chapterTwo, chapterThree: state.chapterThree, diagnostics: state.diagnostics, events: state.events } : state.chapterFiveStart;
  return { ...state, unlockedChapter: unlocked(state), savedDogSlots: retainedSlots(state), savedRatSlots: retainedRatSlots(state), savedBoarSlots: retainedBoarSlots(state), ...(five ? { chapterFiveStart: five } : {}), ...(archive ? { chapterThreeStart: archive } : {}), ...(four ? { chapterFourStart: four } : {}) };
}
function restartChapter(state: NarrativeState, chapter: number): NarrativeState {
  if (chapter < 1 || chapter > unlocked(state)) throw new NarrativeError('ACTION_NOT_ALLOWED');
  const remembered = rememberProgress(state);
  const common = { ...startNarrative(state.locale), revision: state.revision + 1, intro: state.intro,
    unlockedChapter: remembered.unlockedChapter, savedDogSlots: remembered.savedDogSlots, savedRatSlots: remembered.savedRatSlots,
    savedBoarSlots: remembered.savedBoarSlots,
    ...(remembered.chapterFiveStart ? { chapterFiveStart: remembered.chapterFiveStart } : {}),
    ...(remembered.chapterFourStart ? { chapterFourStart: remembered.chapterFourStart } : {}),
    ...(remembered.chapterThreeStart ? { chapterThreeStart: remembered.chapterThreeStart } : {}) };
  if (chapter === 1) return common;
  if (chapter === 2) return { ...common, stepId: HANDOFF, diagnostics: INITIAL_DIAGNOSTICS,
    events: ['E-JOIN', 'INTRO-RANDOM', 'MEM-D1', 'FB-D1'], intro: state.intro ?? { category: 'RANDOM', source: 'fallback', text: INTRO_FALLBACK } };
  if (chapter === 5) {
    const snapshot = remembered.chapterFiveStart;
    if (!snapshot || !snapshot.chapterThree.rat) throw new NarrativeError('ACTION_NOT_ALLOWED');
    return { ...common, ...snapshot, chapterFour:true, chapterTwo: { ...snapshot.chapterTwo, dog: { ...snapshot.chapterTwo.dog, slots: retainedSlots(remembered) } }, chapterThree: { ...snapshot.chapterThree, rat: { ...snapshot.chapterThree.rat, slots: retainedRatSlots(remembered) } }, stepId: CHAPTER_FIVE_BOUNDARY };
  }
  if (chapter === 4) {
    const snapshot = remembered.chapterFourStart;
    if (!snapshot || !snapshot.chapterThree.rat) throw new NarrativeError('ACTION_NOT_ALLOWED');
    return { ...common, ...snapshot, chapterTwo: { ...snapshot.chapterTwo, dog: { ...snapshot.chapterTwo.dog, slots: retainedSlots(remembered) } }, chapterThree: { ...snapshot.chapterThree, rat: { ...snapshot.chapterThree.rat, slots: retainedRatSlots(remembered) } }, stepId: CHAPTER_FOUR_CARD };
  }
  const snapshot = remembered.chapterThreeStart;
  if (!snapshot) throw new NarrativeError('ACTION_NOT_ALLOWED');
  return { ...common, ...snapshot, chapterTwo: { ...snapshot.chapterTwo, dog: { ...snapshot.chapterTwo.dog, slots: retainedSlots(remembered) } }, stepId: 'A03-S01/CHAPTER_CARD' };
}
export function advanceNarrative(state: NarrativeState, actionId: string, expectedRevision: number, random: () => number = Math.random): NarrativeState {
  checkRevision(state, expectedRevision);
  state = normalizeRetiredScenes(state);
  const restart = /^CHAPTER\/RESTART\/([1-5])$/.exec(actionId);
  if (restart) return restartChapter(state, Number(restart[1]));
  return rememberProgress(advanceCurrent(state, actionId, random));
}
// Chapter 4 reuses the authoritative cursor, revision, diagnostics and events.
// Only its marker is new persisted data; previous chapter snapshots are retained.
const fourEvents = ['F3','E-FAMILY','MEM-D4','FB-D4','FB-D5','E-BETRAYAL','E-PAST-RESTORED'] as const;
function isFourEvent(event: EventId): event is typeof fourEvents[number] {
  return fourEvents.some(value => value === event);
}
function fourProgress(state: NarrativeState): ChapterFourProgress {
  if (!state.chapterFour || !state.diagnostics || !state.chapterThree || !state.chapterTwo ||
      !state.events.includes('F2') || !state.events.includes('E-ESCAPE-ROUTE')) throw new NarrativeError('INVALID_STATE');
  return { stepId:state.stepId, reviewStepId:state.reviewStepId, revision:state.revision,
    locale:state.locale, diagnostics:state.diagnostics, events:state.events.filter(isFourEvent) };
}
function projectFour(state: NarrativeState): CurrentView {
  const view = viewFour(fourProgress(state));
  const chapter = view.stepId === CHAPTER_FIVE_BOUNDARY ? 5 : 4;
  const cue: Cue = view.cue ?? (view.record ? 'archive-record' : view.stepId === 'A04-S02/MEM-D4' ? 'blink-black'
    : view.stepId === 'A04-S02/FB-D5' ? 'memory-cut' : view.stepId === 'A04-S02/FB-D5-END' ? 'fade-black' : 'none');
  return { revision:view.revision, locale:view.locale, phase:view.phase, chapter,
    chapterTitle:CHAPTERS[chapter-1].title[state.locale], sceneId:view.stepId.split('/')[0],
    speaker:view.speaker, text:view.text, asset:view.asset ? {url:`/api/game/asset?key=${view.asset}`,alt:OPENING_ASSETS[view.asset][state.locale]} : null,
    diagnostics:view.diagnostics, actions: state.stepId===CHAPTER_FIVE_BOUNDARY && !state.reviewStepId ? [{id:CHAPTER_FIVE_BOUNDARY+'/NEXT',kind:'CONTINUE',label:actionLabel[state.locale]},...view.actions] : view.actions, pending:false, cue,
    narration:view.text!=='' && view.speaker===null && !view.record && view.phase!=='CHAPTER_CARD', information:false };
}
function applyFour(state: NarrativeState, progress: ChapterFourProgress): NarrativeState {
  const events = [...state.events];
  for (const event of progress.events) if (!events.includes(event)) events.push(event);
  return {...state,chapterFour:true,stepId:progress.stepId,reviewStepId:progress.reviewStepId,
    revision:progress.revision,diagnostics:progress.diagnostics,events};
}

const fiveEvents = ['E-SHIP','CP-BOAR','E-LAUNCH','E-COMPLETE'] as const;
function isFiveEvent(event: EventId): event is typeof fiveEvents[number] {
  return fiveEvents.some(value=>value===event);
}
function fiveProgress(state: NarrativeState): ChapterFiveProgress {
  if (!state.chapterFive || !state.chapterFour || !state.diagnostics || !state.chapterTwo || !state.chapterThree ||
      !state.events.includes('F3') || !state.events.includes('E-PAST-RESTORED')) throw new NarrativeError('INVALID_STATE');
  return {...state.chapterFive,stepId:state.stepId,reviewStepId:state.reviewStepId,revision:state.revision,
    locale:state.locale,diagnostics:state.diagnostics,events:state.events.filter(isFiveEvent)};
}
function projectFive(state: NarrativeState): CurrentView {
  const view=viewFive(fiveProgress(state));
  return {revision:view.revision,locale:view.locale,phase:view.phase,chapter:5,chapterTitle:CHAPTERS[4].title[state.locale],
    sceneId:view.stepId.split('/')[0],speaker:view.speaker,text:view.text,
    asset:view.asset?{url:`/api/game/asset?key=${view.asset}`,alt:OPENING_ASSETS[view.asset][state.locale]}:null,
    diagnostics:view.diagnostics,actions:view.actions,pending:false,cue:view.stepId==='A05-S01/L06'?'startle':view.stepId==='A05-S02/NAVIGATION'?'fade-in':'none',
    narration:view.narration,information:false,complete:view.complete};
}
function applyFive(state: NarrativeState, progress: ChapterFiveProgress): NarrativeState {
  const {stepId,reviewStepId,revision,locale,diagnostics,events,...chapterFive}=progress;
  return {...state,chapterFive,stepId,reviewStepId,revision,locale,diagnostics,
    events:[...state.events.filter(e=>!isFiveEvent(e)),...events]};
}
function advanceCurrent(state: NarrativeState, actionId: string, random: () => number): NarrativeState {
  if (state.chapterFive) {
    if (!projectFive(state).actions.some(action=>action.id===actionId)) throw new NarrativeError('ACTION_NOT_ALLOWED');
    return applyFive(state,advanceFive(fiveProgress(state),actionId,state.revision));
  }
  if (state.chapterFour && state.stepId===CHAPTER_FIVE_BOUNDARY && !state.reviewStepId && actionId===CHAPTER_FIVE_BOUNDARY+'/NEXT') {
    if (!state.diagnostics || !state.chapterTwo || !state.chapterThree?.rat) throw new NarrativeError('INVALID_STATE');
    const remembered=rememberProgress(state);
    try {
      const progress=beginFive(state.diagnostics,state.events,state.locale,state.revision,
        state.chapterTwo.dog.recipeSeen || state.chapterThree.rat.recipeSeen,retainedBoarSlots(state));
      return applyFive(remembered,advanceFive(progress,actionId,state.revision));
    } catch { throw new NarrativeError('INVALID_STATE'); }
  }
  if (state.chapterFour) {
    if (!projectFour(state).actions.some(action=>action.id===actionId)) throw new NarrativeError('ACTION_NOT_ALLOWED');
    return applyFour(state,advanceFour(fourProgress(state),actionId,state.revision));
  }
  if (state.chapterThree && state.stepId===CHAPTER_FOUR_CARD && !state.reviewStepId && actionId===CHAPTER_FOUR_CARD+'/NEXT') {
    if (!state.diagnostics || !state.chapterTwo) throw new NarrativeError('INVALID_STATE');
    try { return applyFour(state,advanceFour(beginFour(state.diagnostics,state.events,state.locale,state.revision),actionId,state.revision)); }
    catch { throw new NarrativeError('INVALID_STATE'); }
  }
  if (state.chapterThree) return advanceChapterThree(state, actionId, random);
  if (state.chapterTwo && state.stepId === 'A03-S01/CHAPTER_CARD' && !state.reviewStepId && actionId === state.stepId + '/NEXT') return beginChapterThree(state);
  if (state.chapterTwo) return advanceChapterTwo(state, actionId, random);
  const index = visibleIndex(state);
  const allowed = currentActions(state, index).find((action) => action.id === actionId);
  if (!allowed) throw new NarrativeError('ACTION_NOT_ALLOWED');
  if (allowed.kind === 'PREVIOUS') {
    return { ...state, reviewStepId: CHAPTER_ONE[index - 1].id, revision: state.revision + 1 };
  }
  if (state.reviewStepId) {
    const reviewNext = CHAPTER_ONE[index + 1]?.id ?? HANDOFF;
    return { ...state, reviewStepId: reviewNext === state.stepId ? null : reviewNext, revision: state.revision + 1 };
  }
  if (index === CHAPTER_ONE.length) return beginChapterTwo(state);
  const next = CHAPTER_ONE[index + 1];
  let result: NarrativeState = { ...state, stepId: next?.id ?? HANDOFF, reviewStepId: null, revision: state.revision + 1 };
  if (next?.event && !state.events.includes(next.event)) {
    result = { ...result, events: [...state.events, next.event] };
    if (next.event === 'E-JOIN') result = { ...result, diagnostics: INITIAL_DIAGNOSTICS };
    if (next.event === 'INTRO-RANDOM') result = { ...result, intro: state.intro ?? { category: 'RANDOM', source: 'fallback', text: INTRO_FALLBACK } };
  }
  return result;
}

export function changeNarrativeLocale(state: NarrativeState, locale: Locale, expectedRevision: number): NarrativeState {
  checkRevision(state, expectedRevision);
  projectNarrative(state);
  ensureLocale(locale);
  return { ...normalizeRetiredScenes(state), locale, revision: state.revision + 1 };
}
