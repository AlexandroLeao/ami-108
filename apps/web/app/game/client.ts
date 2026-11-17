import type { Locale } from '../preview/copy';

export type GameAction = { id: string; kind: 'CONTINUE' | 'INTERACT' | 'PREVIOUS' | 'CONSULT' | 'CHOOSE' | 'RETRY'; label: string };
export type CampaignView = {
  revision: number; locale: Locale; phase: 'CHAPTER_CARD' | 'NARRATIVE' | 'FLASHBACK' | 'ENCOUNTER' | 'DEAD';
  chapter: number; chapterTitle: string; sceneId: string; speaker: string | null; text: string;
  asset: { url: string; alt: string } | null;
  diagnostics: { energy: 0 | 1 | 2 | 3; med: number; bio: number; hist: number; personal: number; personalUnlocked: boolean } | null;
  actions: GameAction[]; pending: boolean;
  cue: 'none' | 'pain' | 'ellipsis' | 'wake' | 'memory-cut' | 'fade-black' | 'close-eyes' | 'startle' | 'blink-black' | 'fade-in' | 'memory-shiver' | 'name-reveal' | 'energy-reveal';
  narration: boolean;
  information: boolean;
  chapters?: { number: number; title: string }[];
};
export type CommandBody = { commandId: string; expectedRevision: number } &
  ({ actionId: string } | { locale: Locale });
export type CommandResult = { commandId: string; status: 'APPLIED' | 'REPLAYED'; view: CampaignView };

export class RequestError extends Error {
  constructor(readonly status: number) { super('Game request failed'); }
}
export async function gameRequest<T>(endpoint: 'session' | 'view' | 'commands' | 'locale', method = 'GET', body?: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/game/' + endpoint, {
      method, credentials: 'same-origin', cache: 'no-store',
      ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(12000),
    });
  } catch { throw new RequestError(0); }
  if (!response.ok) throw new RequestError(response.status);
  return response.json() as Promise<T>;
}
