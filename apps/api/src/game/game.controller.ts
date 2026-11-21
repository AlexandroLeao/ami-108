import { Body, Controller, Get, Header, Headers, HttpException, HttpCode, Patch, Post, Query, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { GameError, SESSION_COOKIE, SESSION_SECONDS, SessionService, sessionToken, type Mutation } from './session.service';
import type { Locale } from '../narrative/catalog';
import { gameMode } from './game-access';
import { GameInternalGuard } from './game-internal.guard';
import { readSceneArtwork } from './scene-assets';

type HeaderResponse = { setHeader(name: string, value: string): void };
function invalid(): never { throw new GameError(400, 'INVALID_INPUT'); }
function fields(body: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return invalid();
  const value = body as Record<string, unknown>;
  if (Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) return invalid();
  return value;
}
function locale(value: unknown): Locale {
  if (value !== 'pt-BR' && value !== 'en') return invalid();
  return value;
}
function mutation(body: unknown, kind: Mutation['kind']): Mutation {
  const value = fields(body, ['commandId', 'expectedRevision', kind === 'action' ? 'actionId' : 'locale']);
  const { commandId, expectedRevision } = value;
  if (typeof commandId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(commandId)
    || typeof expectedRevision !== 'number' || !Number.isInteger(expectedRevision) || expectedRevision < 0 || expectedRevision > 2147483646) return invalid();
  const base = { commandId: commandId.toLowerCase(), expectedRevision };
  if (kind === 'locale') return { ...base, kind, locale: locale(value.locale) };
  if (typeof value.actionId !== 'string' || value.actionId.length < 1 || value.actionId.length > 120) return invalid();
  return { ...base, kind, actionId: value.actionId };
}

@Controller('game')
@UseGuards(GameInternalGuard)
export class GameController {
  constructor(private readonly sessions: SessionService) {}

  private async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      // Local integration only; production needs rate limits and deployment review.
      if (gameMode() === 'disabled') throw new GameError(404, 'NOT_AVAILABLE');
      return await operation();
    } catch (error) {
      const status = error instanceof GameError ? error.status : 503;
      const code = error instanceof GameError ? error.code : 'SERVICE_UNAVAILABLE';
      throw new HttpException({ code, message: code, requestId: randomUUID() }, status);
    }
  }

  @Post('session')
  @Header('Cache-Control', 'private, no-store')
  create(@Body() body: unknown, @Res({ passthrough: true }) response: HeaderResponse) {
    return this.execute(async () => {
      const result = await this.sessions.create(locale(fields(body, ['locale']).locale));
      // The same-origin facade sets Secure on HTTPS. Direct API is local-only.
      response.setHeader('Set-Cookie', `${SESSION_COOKIE}=${result.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}`);
      return result.view;
    });
  }

  @Get('view')
  @Header('Cache-Control', 'private, no-store')
  view(@Headers('cookie') cookie?: string) {
    return this.execute(() => this.sessions.view(sessionToken(cookie)));
  }

  @Post('commands')
  @HttpCode(200)
  @Header('Cache-Control', 'private, no-store')
  command(@Body() body: unknown, @Headers('cookie') cookie?: string) {
    return this.execute(() => this.sessions.mutate(sessionToken(cookie), mutation(body, 'action')));
  }

  @Patch('locale')
  @Header('Cache-Control', 'private, no-store')
  changeLocale(@Body() body: unknown, @Headers('cookie') cookie?: string) {
    return this.execute(() => this.sessions.mutate(sessionToken(cookie), mutation(body, 'locale')));
  }

  @Get('asset')
  @Header('Cache-Control', 'private, no-store')
  asset(@Query('key') key: unknown, @Headers('cookie') cookie?: string) {
    return this.execute(async () => {
      const id = await this.sessions.asset(sessionToken(cookie), key);
      try {
        return new StreamableFile(await readSceneArtwork(id), { type: 'image/png' });
      } catch (error) {
        // Preview-only sanitized diagnostics: never log cookies, paths or session data.
        if (process.env.VERCEL_ENV === 'preview') {
          const code = error instanceof Error && 'code' in error && typeof error.code === 'string' ? error.code : 'UNKNOWN';
          console.error('game.asset.read-failed', { scene: id, code });
        }
        throw new GameError(404, 'ASSET_UNAVAILABLE');
      }
    });
  }
}
