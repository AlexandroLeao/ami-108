// Pure domain functions: no HTTP, database, provider or browser dependency.
// Persistence and transactional command receipts must wrap these functions.
import { CHAPTERS, CHAPTER_ONE, INTRO_FALLBACK, NARRATIVE_VERSION, OPENING_ASSETS, local, type Cue, type EventId, type Locale, type Localized, type OpeningAsset } from './catalog';

const HANDOFF = 'A02-S01/CHAPTER_CARD';
const INITIAL_DIAGNOSTICS = { energy: 3, med: 10, bio: 15, hist: 12, personal: 5, personalUnlocked: false } as const;
const actionLabel = local('Continuar', 'Continue');
const actionsByStep: Readonly<Record<string, Localized>> = {
  'A01-S01/L04': local('Sair do depósito', 'Leave the warehouse'),
  'A01-S02/L02': local('Seguir a música', 'Follow the music'),
  'A01-S03/L38': local('Seguir para o terminal', 'Head to the terminal'),
};

export type NarrativeState = Readonly<{
  version: typeof NARRATIVE_VERSION;
  stepId: string;
  reviewStepId: string | null;
  locale: Locale;
  revision: number;
  events: readonly EventId[];
  diagnostics: typeof INITIAL_DIAGNOSTICS | null;
  intro: Readonly<{ category: 'RANDOM'; source: 'fallback'; text: Localized }> | null;
}>;
export type NarrativeAction = Readonly<{ id: string; kind: 'CONTINUE' | 'INTERACT' | 'PREVIOUS'; label: string }>;
export type CurrentView = Readonly<{
  revision: number; locale: Locale; phase: 'CHAPTER_CARD' | 'NARRATIVE' | 'FLASHBACK';
  chapter: number; chapterTitle: string; sceneId: string; speaker: string | null; text: string;
  asset: { url: '/api/game/asset'; alt: string } | null;
  diagnostics: NarrativeState['diagnostics']; actions: readonly NarrativeAction[]; pending: false;
  // UI-only cues are proposed additions to the game contract.
  cue: Cue;
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

// The review cursor is distinct from authoritative progress. It can only move
// within a contiguous authored dialogue group that has already been reached.
function canReviewPrevious(index: number): boolean {
  const step = CHAPTER_ONE[index];
  const previous = CHAPTER_ONE[index - 1];
  return !!step && !!previous && step.sceneId === previous.sceneId
    && step.phase === 'NARRATIVE' && previous.phase === 'NARRATIVE'
    && step.speaker !== null && previous.speaker !== null
    && !step.event && !previous.event && previous.action !== 'INTERACT';
}

function visibleIndex(state: NarrativeState): number {
  const authoritative = currentIndex(state);
  if (!state.reviewStepId) return authoritative;
  const index = CHAPTER_ONE.findIndex((step) => step.id === state.reviewStepId);
  if (index < 0 || index >= authoritative) throw new NarrativeError('INVALID_STATE');
  for (let i = authoritative; i > index; i--) {
    if (!canReviewPrevious(i)) throw new NarrativeError('INVALID_STATE');
  }
  return index;
}

export function currentAsset(state: NarrativeState): OpeningAsset | null {
  return CHAPTER_ONE[visibleIndex(state)]?.asset ?? null;
}

function currentActions(state: NarrativeState, index: number): readonly NarrativeAction[] {
  const step = CHAPTER_ONE[index];
  if (!step) return [];
  const locale = state.locale;
  const forward: NarrativeAction = {
    id: step.id + '/NEXT',
    kind: actionsByStep[step.id] ? 'INTERACT' : step.action,
    label: (actionsByStep[step.id] ?? actionLabel)[locale],
  };
  return canReviewPrevious(index)
    ? [forward, { id: step.id + '/PREVIOUS', kind: 'PREVIOUS', label: locale === 'pt-BR' ? 'Fala anterior' : 'Previous dialogue' }]
    : [forward];
}

export function projectNarrative(state: NarrativeState): CurrentView {
  ensureLocale(state.locale);
  const index = visibleIndex(state);
  const step = CHAPTER_ONE[index];
  const locale = state.locale;
  if (!step) {
    // AMI-005 connects this boundary to the first encounter and creates CP-DOG.
    return { revision: state.revision, locale, phase: 'CHAPTER_CARD', chapter: 2,
      chapterTitle: CHAPTERS[1].title[locale], sceneId: 'A02-S01',
      speaker: null, text: locale === 'pt-BR' ? 'CAPÍTULO 2 — REGISTRO ATUALIZADO' : 'CHAPTER 2 — RECORD UPDATED',
      asset: null, diagnostics: state.diagnostics, actions: [], pending: false, cue: 'none' };
  }
  return {
    revision: state.revision, locale, phase: step.phase, chapter: 1, chapterTitle: CHAPTERS[0].title[locale],
    sceneId: step.sceneId, speaker: step.speaker?.[locale] ?? null,
    text: step.event === 'INTRO-RANDOM' && state.intro ? state.intro.text[locale] : step.text[locale],
    asset: step.asset ? { url: '/api/game/asset', alt: OPENING_ASSETS[step.asset][locale] } : null,
    diagnostics: state.diagnostics,
    actions: currentActions(state, index),
    pending: false, cue: step.cue,
  };
}

export function advanceNarrative(state: NarrativeState, actionId: string, expectedRevision: number): NarrativeState {
  checkRevision(state, expectedRevision);
  const index = visibleIndex(state);
  const allowed = currentActions(state, index).find((action) => action.id === actionId);
  if (!allowed) throw new NarrativeError('ACTION_NOT_ALLOWED');
  if (allowed.kind === 'PREVIOUS') {
    return { ...state, reviewStepId: CHAPTER_ONE[index - 1].id, revision: state.revision + 1 };
  }
  if (state.reviewStepId) {
    const reviewNext = CHAPTER_ONE[index + 1].id;
    return { ...state, reviewStepId: reviewNext === state.stepId ? null : reviewNext, revision: state.revision + 1 };
  }
  const next = CHAPTER_ONE[index + 1];
  let result: NarrativeState = { ...state, stepId: next?.id ?? HANDOFF, reviewStepId: null, revision: state.revision + 1 };
  if (next?.event && !state.events.includes(next.event)) {
    result = { ...result, events: [...state.events, next.event] };
    if (next.event === 'E-JOIN') result = { ...result, diagnostics: INITIAL_DIAGNOSTICS };
    if (next.event === 'INTRO-RANDOM') result = { ...result, intro: { category: 'RANDOM', source: 'fallback', text: INTRO_FALLBACK } };
  }
  return result;
}

export function changeNarrativeLocale(state: NarrativeState, locale: Locale, expectedRevision: number): NarrativeState {
  checkRevision(state, expectedRevision);
  visibleIndex(state);
  ensureLocale(locale);
  return { ...state, locale, revision: state.revision + 1 };
}
