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
  locale: Locale;
  revision: number;
  events: readonly EventId[];
  diagnostics: typeof INITIAL_DIAGNOSTICS | null;
  intro: Readonly<{ category: 'RANDOM'; source: 'fallback'; text: Localized }> | null;
}>;
export type NarrativeAction = Readonly<{ id: string; kind: 'CONTINUE' | 'INTERACT'; label: string }>;
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
  return { version: NARRATIVE_VERSION, stepId: CHAPTER_ONE[0].id, locale, revision: 0, events: [], diagnostics: null, intro: null };
}

function checkRevision(state: NarrativeState, expectedRevision: number): void {
  if (!Number.isSafeInteger(expectedRevision) || state.revision !== expectedRevision) throw new NarrativeError('STALE_REVISION');
}

export function currentAsset(state: NarrativeState): OpeningAsset | null {
  return CHAPTER_ONE[currentIndex(state)]?.asset ?? null;
}

export function projectNarrative(state: NarrativeState): CurrentView {
  ensureLocale(state.locale);
  const step = CHAPTER_ONE[currentIndex(state)];
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
    actions: [{ id: step.id + '/NEXT', kind: actionsByStep[step.id] ? 'INTERACT' : step.action, label: (actionsByStep[step.id] ?? actionLabel)[locale] }],
    pending: false, cue: step.cue,
  };
}

export function advanceNarrative(state: NarrativeState, actionId: string, expectedRevision: number): NarrativeState {
  checkRevision(state, expectedRevision);
  const index = currentIndex(state);
  const allowed = projectNarrative(state).actions[0];
  if (!allowed || actionId !== allowed.id) throw new NarrativeError('ACTION_NOT_ALLOWED');
  const next = CHAPTER_ONE[index + 1];
  let result: NarrativeState = { ...state, stepId: next?.id ?? HANDOFF, revision: state.revision + 1 };
  if (next?.event && !state.events.includes(next.event)) {
    result = { ...result, events: [...state.events, next.event] };
    if (next.event === 'E-JOIN') result = { ...result, diagnostics: INITIAL_DIAGNOSTICS };
    if (next.event === 'INTRO-RANDOM') result = { ...result, intro: { category: 'RANDOM', source: 'fallback', text: INTRO_FALLBACK } };
  }
  return result;
}

export function changeNarrativeLocale(state: NarrativeState, locale: Locale, expectedRevision: number): NarrativeState {
  checkRevision(state, expectedRevision);
  currentIndex(state);
  ensureLocale(locale);
  return { ...state, locale, revision: state.revision + 1 };
}
