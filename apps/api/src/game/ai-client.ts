// Internal AI transport, never exposed to the browser. No provider retry.
import type { NarrativeState } from '../narrative/engine';
import type { Locale } from '../narrative/catalog';

export const GENERATION_DEADLINE_MS = 2500;
export type GenerationRequest = {
  requestId: string; questionId: 'Q-DOG' | 'INTRO-RANDOM'; category: 'CORRECT' | 'RANDOM';
  locale: Locale; factIds: string[]; deadlineMs: number;
};
export type GenerationAudit = { generationStatus: 'VALIDATED' | 'FALLBACK_REQUIRED'; generationReason: string | null };
export const fallback = (reason: string): GenerationAudit => ({ generationStatus: 'FALLBACK_REQUIRED', generationReason: reason });
export const enabled = () => process.env.AMI_AI_GENERATION === '1';

// The authoritative domain has already selected the category and constructed
// the authored fallback. Never reserve a replayed slot or intro.
export function generationRequest(before: NarrativeState, after: NarrativeState, requestId: string): GenerationRequest | null {
  const common = { requestId, locale: after.locale, deadlineMs: GENERATION_DEADLINE_MS };
  if (!before.intro && after.intro) {
    return { ...common, questionId: 'INTRO-RANDOM', category: 'RANDOM', factIds: ['INTRO-OCTOPUS'] };
  }
  const previous = before.savedDogSlots ?? before.chapterTwo?.dog.slots ?? [];
  const slot = after.chapterTwo?.dog.slots.find(item => !previous.some(old => old.index === item.index));
  if (!slot) return null;
  return { ...common, questionId: 'Q-DOG', category: slot.category,
    factIds: slot.category === 'CORRECT' ? ['DOG-VISION', 'DOG-HEARING', 'DOG-WAIT'] : ['DOG-RECIPE'] };
}

export function expectedText(request: GenerationRequest, next: NarrativeState): string | undefined {
  if (request.questionId === 'INTRO-RANDOM') return next.intro?.text[request.locale];
  return next.chapterTwo?.dog.slots.at(-1)?.text[request.locale];
}

const reasons = new Set(['UNAVAILABLE', 'TIMEOUT', 'INVALID_OUTPUT', 'BUDGET_EXCEEDED', 'UNAUTHORIZED_CONTEXT']);
export async function callGeneration(request: GenerationRequest, expected: string | undefined, deadlineAt: Date): Promise<GenerationAudit> {
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
    // Exact canonical output only in this increment. Even a compromised service
    // cannot change game rules or approved wording. Translation stays authored.
    if (value.status !== 'VALIDATED' || value.text !== expected || expected.length > 500) return fallback('INVALID_OUTPUT');
    return { generationStatus: 'VALIDATED', generationReason: null };
  } catch {
    return fallback(Date.now() >= deadlineAt.getTime() ? 'TIMEOUT' : 'UNAVAILABLE');
  }
}
