import { Injectable } from '@nestjs/common';
import { Prisma, type GameSession, type GamePendingGeneration } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma.service';
import { gameMode } from './game-access';
import { acquirePublicBudget } from './public-daily-budget';
import { advanceNarrative, changeNarrativeLocale, currentAsset, NarrativeError, projectNarrative, startNarrative, type NarrativeState } from '../narrative/engine';
import { NARRATIVE_VERSION, type Locale } from '../narrative/catalog';
import { applyGeneratedText, callGeneration, enabled, expectedText, fallback, generationRequest, prepareRandomFallback, rejectRepeatedRandom, GENERATION_DEADLINE_MS, type GenerationAudit, type GenerationRequest, type GenerationResult } from './ai-client';

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
    await this.prisma.$transaction(async tx => {
      // The production gate consumes one UTC-day slot atomically across replicas.
      // Local integration tests and offline gameplay do not consume portfolio quota.
      if (gameMode() === 'public' && !(await acquirePublicBudget(tx, 'session'))) {
        throw new GameError(429, 'CAPACITY_LIMIT');
      }
      await tx.gameSession.create({ data: {
        tokenDigest: digest(token), narrativeVersion: state.version, state: jsonState(state),
        revision: state.revision, expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000),
      } });
    });
    return { token, view: projectNarrative(state) };
  }

  private async load(token: string) {
    return readState(await this.prisma.gameSession.findUnique({ where: { tokenDigest: digest(token) } }));
  }

  async view(token: string) {
    // A reload after an interrupted call recovers the reservation, without
    // reissuing inference. Wait outside the transaction until its deadline.
    const tokenDigest = digest(token);
    while (true) {
      const result = await this.prisma.$transaction(async tx => {
        const { sessionId, state } = await this.lock(tx, tokenDigest);
        const pending = await tx.gamePendingGeneration.findUnique({ where: { sessionId } });
        if (!pending) return { view: projectNarrative(state) };
        if (pending.deadlineAt.getTime() <= Date.now()) {
          return { view: (await this.finalize(tx, state, pending, fallback('TIMEOUT'))).view };
        }
        return { wait: pending.deadlineAt.getTime() };
      });
      if (result.view) return result.view;
      await this.delay(result.wait!);
    }
  }

  async asset(token: string, key: unknown) {
    const id = currentAsset(await this.load(token));
    // The key is a cache discriminator, not an asset selection. Reject stale/future keys.
    if (!id || key !== id) throw new GameError(404, 'ASSET_UNAVAILABLE');
    return id;
  }

  private async lock(tx: Prisma.TransactionClient, tokenDigest: string) {
    const rows = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "GameSession" WHERE "tokenDigest" = ${tokenDigest} FOR UPDATE`;
    if (rows.length !== 1) throw new GameError(401, 'SESSION_REQUIRED');
    const sessionId = rows[0].id;
    return { sessionId, state: readState(await tx.gameSession.findUnique({ where: { id: sessionId } })) };
  }

  private async delay(deadline: number) {
    await new Promise<void>(resolve => setTimeout(resolve, Math.max(1, Math.min(50, deadline - Date.now()))));
  }

  private async persist(tx: Prisma.TransactionClient, sessionId: string, state: NarrativeState, next: NarrativeState, commandId: string, fingerprint: string, audit?: GenerationAudit) {
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
    if (next.chapterFive?.checkpoint && !state.chapterFive?.checkpoint) {
      await tx.gameCheckpoint.upsert({ where: { sessionId_checkpointId: { sessionId, checkpointId: 'CP-BOAR' } }, update: {}, create: { sessionId, checkpointId: 'CP-BOAR', snapshot: JSON.parse(JSON.stringify(next.chapterFive.checkpoint)) as Prisma.InputJsonObject } });
    }
    if (next.chapterFive?.boar) {
      const prior = state.savedBoarSlots ?? state.chapterFive?.boar?.slots ?? [];
      for (const slot of next.chapterFive.boar.slots) {
        if (!prior.some(item => item.index === slot.index)) await tx.gameConsultationSlot.create({ data: { sessionId, encounterId: 'BOAR', slotIndex: slot.index, category: slot.category, localizedText: { ...slot.text }, recipe: slot.recipe } });
      }
    }
    await tx.gameSession.update({ where: { id: sessionId }, data: { state: jsonState(next), revision: next.revision } });
    await tx.gameCommandReceipt.create({ data: { sessionId, commandId, requestDigest: fingerprint, appliedRevision: next.revision, ...audit } });
    return { commandId, status: 'APPLIED' as const, view: projectNarrative(next) };
  }

  private async finalize(tx: Prisma.TransactionClient, state: NarrativeState, pending: GamePendingGeneration, audit: GenerationResult) {
    const next = pending.nextState as unknown as NarrativeState;
    if (next.revision !== state.revision + 1 || next.version !== state.version) throw new GameError(503, 'INVALID_SAVED_STATE');
    const request = pending.request as unknown as GenerationRequest;
    const accepted = rejectRepeatedRandom(state, request, audit, expectedText(request, next));
    const finalized = applyGeneratedText(next, request, accepted);
    projectNarrative(finalized);
    const result = await this.persist(tx, pending.sessionId, state, finalized, pending.commandId, pending.requestDigest, {
      generationStatus: accepted.generationStatus, generationReason: accepted.generationReason,
    });
    await tx.gamePendingGeneration.delete({ where: { sessionId: pending.sessionId } });
    return result;
  }

  async mutate(token: string, input: Mutation) {
    const tokenDigest = digest(token);
    const fingerprint = digest(JSON.stringify([input.kind, input.expectedRevision, input.kind === 'action' ? input.actionId : input.locale]));
    while (true) {
      const phase = await this.prisma.$transaction(async tx => {
        const locked = await this.lock(tx, tokenDigest);
        const { sessionId } = locked;
        const state = locked.state;
        const pending = await tx.gamePendingGeneration.findUnique({ where: { sessionId } });
        if (pending) {
          if (pending.deadlineAt.getTime() <= Date.now()) {
            await this.finalize(tx, state, pending, fallback('TIMEOUT'));
            return { kind: 'recovered' as const };
          } else {
            if (pending.commandId !== input.commandId || pending.requestDigest !== fingerprint) throw new GameError(409, 'COMMAND_CONFLICT');
            return { kind: 'wait' as const, deadline: pending.deadlineAt.getTime() };
          }
        }
        const prior = await tx.gameCommandReceipt.findUnique({ where: { sessionId_commandId: { sessionId, commandId: input.commandId } } });
        if (prior) {
          if (prior.requestDigest !== fingerprint) throw new GameError(409, 'COMMAND_CONFLICT');
          return { kind: 'done' as const, result: { commandId: input.commandId, status: 'REPLAYED' as const, view: projectNarrative(state) } };
        }
        let next: NarrativeState;
        try {
          next = input.kind === 'action'
            ? advanceNarrative(state, input.actionId, input.expectedRevision)
            : changeNarrativeLocale(state, input.locale, input.expectedRevision);
        } catch (error) {
          if (error instanceof NarrativeError) throw new GameError(error.code === 'STALE_REVISION' ? 409 : error.code === 'ACTION_NOT_ALLOWED' ? 403 : 400, error.code);
          throw error;
        }
        const request = enabled() ? generationRequest(state, next, input.commandId) : null;
        if (!request) return { kind: 'done' as const, result: await this.persist(tx, sessionId, state, next, input.commandId, fingerprint) };
        next = prepareRandomFallback(state, next, request);
        // Persist the drawn category, slot, authored fallback and resulting
        // revision BEFORE any network call. Only this reserving caller calls AI.
        const reserved = await tx.gamePendingGeneration.create({ data: {
          sessionId, commandId: input.commandId, requestDigest: fingerprint, nextState: jsonState(next),
          request: JSON.parse(JSON.stringify(request)) as Prisma.InputJsonObject,
          deadlineAt: new Date(Date.now() + GENERATION_DEADLINE_MS),
        } });
        return { kind: 'reserved' as const, reserved, request, expected: expectedText(request, next) };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
      if (phase.kind === 'done') return phase.result;
      if (phase.kind === 'recovered') continue;
      if (phase.kind === 'wait') { await this.delay(phase.deadline); continue; }
      const { reserved, request, expected } = phase;
      let audit: GenerationResult;
      if (gameMode() !== 'public') {
        audit = await callGeneration(request, expected, reserved.deadlineAt);
      } else {
        // A provider attempt consumes quota even when it times out or rejects.
        // Missing migrations/DB failure fail closed to authored fallback.
        let admitted = false;
        try {
          admitted = await this.prisma.$transaction(tx => acquirePublicBudget(tx, 'ai'));
        } catch {
          // Never leak the SQL error, player save or server environment to clients.
        }
        audit = admitted ? await callGeneration(request, expected, reserved.deadlineAt)
          : fallback('BUDGET_EXCEEDED');
      }
      return this.prisma.$transaction(async tx => {
        const { sessionId, state } = await this.lock(tx, tokenDigest);
        const pending = await tx.gamePendingGeneration.findUnique({ where: { sessionId } });
        // A recovery or duplicate may already have finalized. Never apply a
        // late result to a new attempt/restart or another command.
        if (!pending || pending.commandId !== input.commandId || pending.requestDigest !== fingerprint) {
          const receipt = await tx.gameCommandReceipt.findUnique({ where: { sessionId_commandId: { sessionId, commandId: input.commandId } } });
          if (!receipt || receipt.requestDigest !== fingerprint) throw new GameError(409, 'COMMAND_CONFLICT');
          return { commandId: input.commandId, status: 'REPLAYED' as const, view: projectNarrative(state) };
        }
        return this.finalize(tx, state, pending, pending.deadlineAt.getTime() <= Date.now() ? fallback('TIMEOUT') : audit);
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
    }
  }
}
