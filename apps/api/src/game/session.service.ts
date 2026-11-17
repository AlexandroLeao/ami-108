import { Injectable } from '@nestjs/common';
import { Prisma, type GameSession } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma.service';
import { advanceNarrative, changeNarrativeLocale, currentAsset, NarrativeError, projectNarrative, startNarrative, type NarrativeState } from '../narrative/engine';
import { NARRATIVE_VERSION, type Locale } from '../narrative/catalog';

export const SESSION_SECONDS = 30 * 24 * 60 * 60;
export const SESSION_COOKIE = 'ami_session';
export class GameError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code); }
}
export type Mutation = { commandId: string; expectedRevision: number } &
  ({ kind: 'action'; actionId: string } | { kind: 'locale'; locale: Locale });
export const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
export function sessionToken(cookie: string | undefined): string {
  const matches = (cookie ?? '').split(';').map((part) => part.trim()).filter((part) => part.startsWith(SESSION_COOKIE + '='));
  const token = matches.length === 1 ? matches[0].slice(SESSION_COOKIE.length + 1) : '';
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new GameError(401, 'SESSION_REQUIRED');
  return token;
}

function readState(row: GameSession | null): NarrativeState {
  if (!row?.tokenDigest || !row.expiresAt || row.expiresAt.getTime() <= Date.now() || !row.state) {
    throw new GameError(401, 'SESSION_REQUIRED');
  }
  if (row.narrativeVersion !== NARRATIVE_VERSION) throw new GameError(409, 'NARRATIVE_VERSION_MISMATCH');
  // State is written only by this server, never deserialized from a client body.
  const state = row.state as unknown as NarrativeState;
  if (state.revision !== row.revision || state.version !== NARRATIVE_VERSION) throw new GameError(503, 'INVALID_SAVED_STATE');
  try { projectNarrative(state); } catch { throw new GameError(503, 'INVALID_SAVED_STATE'); }
  return state;
}
// Server-owned state contains only JSON data; strip optional undefined fields.
const jsonState = (state: NarrativeState): Prisma.InputJsonObject => JSON.parse(JSON.stringify(state)) as Prisma.InputJsonObject;

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(locale: Locale) {
    const token = randomBytes(32).toString('base64url');
    const state = startNarrative(locale);
    await this.prisma.gameSession.create({ data: {
      tokenDigest: digest(token), narrativeVersion: state.version, state: jsonState(state),
      revision: state.revision, expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000),
    } });
    return { token, view: projectNarrative(state) };
  }

  private async load(token: string) {
    return readState(await this.prisma.gameSession.findUnique({ where: { tokenDigest: digest(token) } }));
  }

  async view(token: string) {
    return projectNarrative(await this.load(token));
  }

  async asset(token: string, key: unknown) {
    const id = currentAsset(await this.load(token));
    // The key is a cache discriminator, not an asset selection. Reject stale/future keys.
    if (!id || key !== id) throw new GameError(404, 'ASSET_UNAVAILABLE');
    return id;
  }

  async mutate(token: string, input: Mutation) {
    const tokenDigest = digest(token);
    // Canonical field order, independent of JSON input property order.
    const fingerprint = digest(JSON.stringify([input.kind, input.expectedRevision, input.kind === 'action' ? input.actionId : input.locale]));
    return this.prisma.$transaction(async (tx) => {
      // Serialize mutations of a single session. No provider/network calls inside this transaction.
      const rows = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "GameSession" WHERE "tokenDigest" = ${tokenDigest} FOR UPDATE`;
      if (rows.length !== 1) throw new GameError(401, 'SESSION_REQUIRED');
      const sessionId = rows[0].id;
      const state = readState(await tx.gameSession.findUnique({ where: { id: sessionId } }));
      const prior = await tx.gameCommandReceipt.findUnique({ where: { sessionId_commandId: { sessionId, commandId: input.commandId } } });
      if (prior) {
        if (prior.requestDigest !== fingerprint) throw new GameError(409, 'COMMAND_CONFLICT');
        // Replay returns the latest authorized view, not an obsolete historical projection.
        return { commandId: input.commandId, status: 'REPLAYED' as const, view: projectNarrative(state) };
      }
      let next: NarrativeState;
      try {
        next = input.kind === 'action'
          ? advanceNarrative(state, input.actionId, input.expectedRevision)
          : changeNarrativeLocale(state, input.locale, input.expectedRevision);
      } catch (error) {
        if (error instanceof NarrativeError) {
          throw new GameError(error.code === 'STALE_REVISION' ? 409 : error.code === 'ACTION_NOT_ALLOWED' ? 403 : 400, error.code);
        }
        throw error;
      }
      // Normalized checkpoint and resolved slots commit with JSON progress and receipt.
      if (next.chapterTwo && !state.chapterTwo) {
        await tx.gameCheckpoint.upsert({ where: { sessionId_checkpointId: { sessionId, checkpointId: 'CP-DOG' } }, update: {}, create: { sessionId, checkpointId: 'CP-DOG', snapshot: JSON.parse(JSON.stringify(next.chapterTwo.checkpoint)) as Prisma.InputJsonObject } });
      }
      if (next.chapterTwo) {
        const priorSlots = state.savedDogSlots ?? state.chapterTwo?.dog.slots ?? [];
        for (const slot of next.chapterTwo.dog.slots) {
          if (!priorSlots.some(item => item.index === slot.index)) {
            await tx.gameConsultationSlot.create({ data: { sessionId, encounterId: 'DOG', slotIndex: slot.index, category: slot.category, localizedText: { ...slot.text }, recipe: slot.recipe } });
          }
        }
      }
      if (next.chapterThree?.checkpoint && !state.chapterThree?.checkpoint) {
        await tx.gameCheckpoint.upsert({ where: { sessionId_checkpointId: { sessionId, checkpointId: 'CP-RAT' } }, update: {}, create: { sessionId, checkpointId: 'CP-RAT', snapshot: JSON.parse(JSON.stringify(next.chapterThree.checkpoint)) as Prisma.InputJsonObject } });
      }
      if (next.chapterThree?.rat) {
        const priorRatSlots = state.savedRatSlots ?? state.chapterThree?.rat?.slots ?? [];
        for (const slot of next.chapterThree.rat.slots) {
          if (!priorRatSlots.some(item => item.index === slot.index)) await tx.gameConsultationSlot.create({ data: { sessionId, encounterId: 'RAT', slotIndex: slot.index, category: slot.category, localizedText: { ...slot.text }, recipe: slot.recipe } });
        }
      }
      await tx.gameSession.update({ where: { id: sessionId }, data: { state: jsonState(next), revision: next.revision } });
      await tx.gameCommandReceipt.create({ data: { sessionId, commandId: input.commandId, requestDigest: fingerprint, appliedRevision: next.revision } });
      return { commandId: input.commandId, status: 'APPLIED' as const, view: projectNarrative(next) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  }
}
