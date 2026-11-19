// Internal AI transport, never exposed to the browser. No provider retry.
import type { NarrativeState } from '../narrative/engine';
import { randomInt } from 'node:crypto';
import { INTRO_FALLBACK, local, type Locale, type Localized } from '../narrative/catalog';
import { DOG, type EncounterState } from '../narrative/encounter';
import { RAT } from '../narrative/chapter-three-catalog';

export const GENERATION_DEADLINE_MS = 2500;
export type GenerationRequest = {
  requestId: string; questionId: 'Q-DOG' | 'Q-RAT' | 'INTRO-RANDOM'; category: 'CORRECT' | 'RANDOM';
  locale: Locale; factIds: string[]; deadlineMs: number;
};
export type GenerationAudit = { generationStatus: 'VALIDATED' | 'FALLBACK_REQUIRED'; generationReason: string | null };
export type GenerationResult = GenerationAudit & { text?: string };
type Variant = { questionId: GenerationRequest['questionId']; category: GenerationRequest['category']; text: Localized; recipe: boolean; factId?: string };
// Bilingual finite allowlist: original Master v1.13 examples and owner-requested expanded RANDOM topics.
const variants: readonly Variant[] = [
  { questionId: 'INTRO-RANDOM', category: 'RANDOM', factId: 'INTRO-OCTOPUS', text: INTRO_FALLBACK, recipe: false },
  { questionId: 'Q-DOG', category: 'RANDOM', factId: 'DOG-RECIPE', text: DOG.random, recipe: DOG.randomIsRecipe },
  { questionId: 'Q-RAT', category: 'RANDOM', factId: 'RAT-RECIPE', text: RAT.random, recipe: RAT.randomIsRecipe },
  { questionId: 'INTRO-RANDOM', category: 'RANDOM', factId: 'INTRO-CHESS', text: local("O xadrez é disputado em um tabuleiro de 64 casas.", "Chess is played on a board of 64 squares."), recipe: false },
  { questionId: 'INTRO-RANDOM', category: 'RANDOM', factId: 'INTRO-HEXAGON', text: local("Um hexágono possui seis lados.", "A hexagon has six sides."), recipe: false },
  { questionId: 'INTRO-RANDOM', category: 'RANDOM', factId: 'INTRO-DOZEN', text: local("Uma dúzia corresponde a doze unidades.", "A dozen equals twelve units."), recipe: false },
  { questionId: 'INTRO-RANDOM', category: 'RANDOM', factId: 'INTRO-PIANO', text: local("O piano possui teclas brancas e pretas.", "A piano has black and white keys."), recipe: false },
  { questionId: 'INTRO-RANDOM', category: 'RANDOM', factId: 'INTRO-CENTURY', text: local("Um século corresponde a cem anos.", "A century equals one hundred years."), recipe: false },
  { questionId: 'INTRO-RANDOM', category: 'RANDOM', factId: 'INTRO-ALPHABET', text: local("A letra M ocupa a décima terceira posição no alfabeto latino.", "The letter M is thirteenth in the Latin alphabet."), recipe: false },
  { questionId: 'Q-DOG', category: 'RANDOM', factId: 'DOG-NEPTUNE', text: local("Netuno é o oitavo planeta a partir do Sol.", "Neptune is the eighth planet from the Sun."), recipe: false },
  { questionId: 'Q-DOG', category: 'RANDOM', factId: 'DOG-PANCAKE', text: local("Para preparar panquecas, misture farinha, leite e ovos.", "To make pancakes, mix flour, milk and eggs."), recipe: true },
  { questionId: 'Q-DOG', category: 'RANDOM', factId: 'DOG-POTATO', text: local("Para preparar purê, amasse as batatas cozidas.", "To make mashed potatoes, mash the cooked potatoes."), recipe: true },
  { questionId: 'Q-DOG', category: 'RANDOM', factId: 'DOG-TOWELS', text: local("Recomenda-se dobrar as toalhas antes de guardá-las.", "Folding towels before storing them is recommended."), recipe: false },
  { questionId: 'Q-DOG', category: 'RANDOM', factId: 'DOG-WASHING', text: local("Recomenda-se separar roupas claras e escuras antes da lavagem.", "Separating light and dark clothes before washing is recommended."), recipe: false },
  { questionId: 'Q-RAT', category: 'RANDOM', factId: 'RAT-KILOGRAM', text: local("Um quilograma corresponde a mil gramas.", "A kilogram equals one thousand grams."), recipe: false },
  { questionId: 'Q-RAT', category: 'RANDOM', factId: 'RAT-BREAD', text: local("A massa de pão pode ser preparada com farinha, água e fermento.", "Bread dough can be made with flour, water and yeast."), recipe: true },
  { questionId: 'Q-RAT', category: 'RANDOM', factId: 'RAT-FRUIT', text: local("Para preparar salada de frutas, misture pedaços de frutas.", "To make fruit salad, mix pieces of fruit."), recipe: true },
  { questionId: 'Q-RAT', category: 'RANDOM', factId: 'RAT-CALENDAR', text: local("O calendário gregoriano possui doze meses.", "The Gregorian calendar has twelve months."), recipe: false },
  { questionId: 'Q-RAT', category: 'RANDOM', factId: 'RAT-BOOKS', text: local("Recomenda-se organizar os livros por ordem alfabética.", "Organizing books alphabetically is recommended."), recipe: false },
  { questionId: 'INTRO-RANDOM', category: 'RANDOM', text: local("Os pinguins não sabem voar.", "Penguins cannot fly."), recipe: false },
  { questionId: 'Q-DOG', category: 'RANDOM', text: local("Saturno possui um sistema de anéis composto principalmente por partículas de gelo.", "Saturn has a ring system composed primarily of ice particles."), recipe: false },
  { questionId: 'Q-DOG', category: 'RANDOM', text: local("Para remover manchas de tecidos claros, recomenda-se utilizar sabão neutro.", "To remove stains from light fabrics, mild soap is recommended."), recipe: false },
  { questionId: 'Q-RAT', category: 'RANDOM', text: local("Recomenda-se dobrar a roupa imediatamente após a secagem.", "Folding clothes immediately after drying is recommended."), recipe: false },
  { questionId: 'Q-RAT', category: 'RANDOM', text: local("Os pinguins são incapazes de voar.", "Penguins are incapable of flight."), recipe: false },
  { questionId: 'Q-DOG', category: 'CORRECT', text: local("A visão da criatura está comprometida e sua audição foi ampliada. Permaneça imóvel até que ela abandone a área.", "The creature's vision is impaired and its hearing is heightened. Remain still until it leaves the area."), recipe: false },
  { questionId: 'Q-RAT', category: 'CORRECT', text: local("Organismos da primeira geração são intolerantes à luz intensa. A iluminação de contenção deverá forçá-lo a recuar.", "First-generation organisms are intolerant of intense light. The containment lighting should force it to retreat."), recipe: false },
];
function matchVariant(request: GenerationRequest, text: unknown) {
  return variants.find(v => v.questionId === request.questionId && v.category === request.category && (!v.factId || request.factIds.includes(v.factId)) && v.text[request.locale] === text);
}
export const fallback = (reason: string): GenerationResult => ({ generationStatus: 'FALLBACK_REQUIRED', generationReason: reason });
export const enabled = () => process.env.AMI_AI_GENERATION === '1';

// The authoritative domain has already selected the category and constructed
// the authored fallback. Never reserve a replayed slot or intro.
export function generationRequest(before: NarrativeState, after: NarrativeState, requestId: string): GenerationRequest | null {
  // BOAR is authored CORRECT only; never reserve model inference for Chapter 5.
  if (after.chapterFive) return null;
  const common = { requestId, locale: after.locale, deadlineMs: GENERATION_DEADLINE_MS };
  if (!before.intro && after.intro) {
    return { ...common, questionId: 'INTRO-RANDOM', category: 'RANDOM', factIds: ['INTRO-OCTOPUS', 'INTRO-PENGUIN', 'INTRO-CHESS', 'INTRO-HEXAGON', 'INTRO-DOZEN', 'INTRO-PIANO', 'INTRO-CENTURY', 'INTRO-ALPHABET'] };
  }
  // Only newly resolved slots at the active consultation transition may call AI.
  // Cached slots are retained across chapter restart and retry.
  if (before.stepId.startsWith('A03-S02/DECISION-') && /^A03-S02\/Q-[123]$/.test(after.stepId)) {
    const previous = before.savedRatSlots ?? before.chapterThree?.rat?.slots ?? [];
    const slot = after.chapterThree?.rat?.slots.find(item => !previous.some(old => old.index === item.index));
    if (!slot) return null;
    return { ...common, questionId: 'Q-RAT', category: slot.category,
      factIds: slot.category === 'CORRECT' ? ['RAT-LIGHT', 'RAT-CONTAINMENT'] : ['RAT-RECIPE', 'RAT-LAUNDRY', 'RAT-PENGUIN', 'RAT-KILOGRAM', 'RAT-BREAD', 'RAT-FRUIT', 'RAT-CALENDAR', 'RAT-BOOKS'] };
  }
  const previous = before.savedDogSlots ?? before.chapterTwo?.dog.slots ?? [];
  const slot = after.chapterTwo?.dog.slots.find(item => !previous.some(old => old.index === item.index));
  if (!slot) return null;
  return { ...common, questionId: 'Q-DOG', category: slot.category,
    factIds: slot.category === 'CORRECT' ? ['DOG-VISION', 'DOG-HEARING', 'DOG-WAIT'] : ['DOG-RECIPE', 'DOG-SATURN', 'DOG-LAUNDRY', 'DOG-NEPTUNE', 'DOG-PANCAKE', 'DOG-POTATO', 'DOG-TOWELS', 'DOG-WASHING'] };
}

export function expectedText(request: GenerationRequest, next: NarrativeState): string | undefined {
  if (request.questionId === 'INTRO-RANDOM') return next.intro?.text[request.locale];
  if (request.questionId === 'Q-RAT') return next.chapterThree?.rat?.slots.at(-1)?.text[request.locale];
  return next.chapterTwo?.dog.slots.at(-1)?.text[request.locale];
}

// Only the current newly drawn RANDOM slot is eligible. Previously committed
// text is immutable, even if a provider returns the same authorized option.
function previousRandomTexts(before: NarrativeState, request: GenerationRequest): Set<string> {
  const slots = request.questionId === 'Q-DOG'
    ? before.savedDogSlots ?? before.chapterTwo?.dog.slots ?? []
    : request.questionId === 'Q-RAT'
      ? before.savedRatSlots ?? before.chapterThree?.rat?.slots ?? []
      : [];
  return new Set(slots.filter(slot => slot.category === 'RANDOM').map(slot => slot.text[request.locale]));
}

// Choose once, before persisting the pending reservation. Even a timeout or
// recovery uses this same approved bilingual utterance; no extra model call.
export function prepareRandomFallback(
  before: NarrativeState, next: NarrativeState, request: GenerationRequest,
  draw: (count: number) => number = randomInt,
): NarrativeState {
  if (request.category !== 'RANDOM') return next;
  const previous = previousRandomTexts(before, request);
  const candidates = variants.filter(v => v.questionId === request.questionId && v.category === 'RANDOM'
    && (!v.factId || request.factIds.includes(v.factId)) && !previous.has(v.text[request.locale]));
  if (!candidates.length) return next;
  const selected = candidates[draw(candidates.length)];
  if (!selected) throw new RangeError('Invalid random utterance selection');
  return applyVariant(next, request, selected, 'fallback');
}

// A repeated model selection is unsuitable for a fresh RANDOM slot. Keep the
// already reserved distinct fallback and report the rejection honestly.
export function rejectRepeatedRandom(
  before: NarrativeState, request: GenerationRequest, result: GenerationResult,
  reservedText: string | undefined,
): GenerationResult {
  if (request.category !== 'RANDOM' || result.generationStatus !== 'VALIDATED') return result;
  const candidate = result.text ?? reservedText;
  return candidate && previousRandomTexts(before, request).has(candidate)
    ? fallback('INVALID_OUTPUT') : result;
}

export function applyGeneratedText(next: NarrativeState, request: GenerationRequest, result: GenerationResult): NarrativeState {
  if (result.generationStatus !== 'VALIDATED') return next;
  // A matching reserved RANDOM text is also a validated provider response.
  const text = result.text ?? (request.category === 'RANDOM' ? expectedText(request, next) : undefined);
  const variant = matchVariant(request, text);
  return variant ? applyVariant(next, request, variant, 'generated') : next;
}

function applyVariant(next: NarrativeState, request: GenerationRequest, variant: Variant, source: 'fallback' | 'generated'): NarrativeState {
  if (request.questionId === 'INTRO-RANDOM') {
    return next.intro ? { ...next, intro: { ...next.intro, source, text: variant.text } } : next;
  }
  const update = (encounter: EncounterState): EncounterState => {
    const index = encounter.used.length;
    const slot = encounter.slots.find(s => s.index === index);
    if (!slot || slot.category !== request.category) return encounter;
    const slots = encounter.slots.map(s => s.index === index ? { ...s, text: variant.text, recipe: variant.recipe } : s);
    return { ...encounter, slots, recipeSeen: slots.some(s => s.index <= index && s.recipe) };
  };
  if (request.questionId === 'Q-DOG' && next.chapterTwo) {
    const dog = update(next.chapterTwo.dog);
    return { ...next, chapterTwo: { ...next.chapterTwo, dog }, savedDogSlots: dog.slots };
  }
  if (request.questionId === 'Q-RAT' && next.chapterThree?.rat) {
    const rat = update(next.chapterThree.rat);
    return { ...next, chapterThree: { ...next.chapterThree, rat }, savedRatSlots: rat.slots };
  }
  return next;
}

const reasons = new Set(['UNAVAILABLE', 'TIMEOUT', 'INVALID_OUTPUT', 'BUDGET_EXCEEDED', 'UNAUTHORIZED_CONTEXT']);
export async function callGeneration(request: GenerationRequest, expected: string | undefined, deadlineAt: Date): Promise<GenerationResult> {
  const token = process.env.AMI_AI_INTERNAL_TOKEN;
  const url = process.env.AI_SERVICE_URL;
  if (!token || !url || !expected) return fallback('UNAVAILABLE');
  const remaining = deadlineAt.getTime() - Date.now();
  if (remaining <= 0) return fallback('TIMEOUT');
  try {
    const target = new URL('/internal/generate', url);
    if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) return fallback('UNAVAILABLE');
    const response = await fetch(target, {
      method: 'POST', redirect: 'error',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, deadlineMs: Math.min(request.deadlineMs, remaining) }),
      signal: AbortSignal.timeout(remaining),
    });
    if (!response.ok) return fallback('UNAVAILABLE');
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return fallback('INVALID_OUTPUT');
    const value = body as Record<string, unknown>;
    if (value.requestId !== request.requestId || Object.keys(value).length !== 3) return fallback('INVALID_OUTPUT');
    if (value.status === 'FALLBACK_REQUIRED' && typeof value.reason === 'string' && reasons.has(value.reason)) return fallback(value.reason);
    // Independent exact allowlist at the authority boundary; reject even a
    // service claiming VALIDATED for arbitrary or cross-context text.
    if (value.status !== 'VALIDATED' || typeof value.text !== 'string' || value.text.length > 500) return fallback('INVALID_OUTPUT');
    if (value.text === expected) return { generationStatus: 'VALIDATED', generationReason: null };
    if (!matchVariant(request, value.text)) return fallback('INVALID_OUTPUT');
    return { generationStatus: 'VALIDATED', generationReason: null, text: value.text };
  } catch {
    return fallback(Date.now() >= deadlineAt.getTime() ? 'TIMEOUT' : 'UNAVAILABLE');
  }
}
