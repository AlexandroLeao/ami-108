import type { ExecutionContext } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { GameInternalGuard } from '../src/game/game-internal.guard';

const secret = 'private-shared-secret-for-tests-only-0123456789';
const keys = ['VERCEL', 'NODE_ENV', 'AMI_PUBLIC_GAME', 'AMI_PUBLIC_ORIGIN', 'AMI_API_INTERNAL_TOKEN', 'AMI_DEV_PREVIEW'] as const;
const context = (token?: string): ExecutionContext => ({
  switchToHttp: () => ({
    getRequest: () => ({
      headers: token === undefined ? {} : { 'x-ami-internal-token': token },
    }),
  }),
}) as unknown as ExecutionContext;

describe('private NestJS game route guard', () => {
  const old = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  beforeEach(() => {
    process.env.VERCEL = '1';
    process.env.NODE_ENV = 'production';
    process.env.AMI_PUBLIC_GAME = '1';
    process.env.AMI_PUBLIC_ORIGIN = 'https://ami-108.vercel.app';
    process.env.AMI_API_INTERNAL_TOKEN = secret;
    delete process.env.AMI_DEV_PREVIEW;
  });
  afterAll(() => {
    for (const key of keys) {
      if (old[key] === undefined) delete process.env[key];
      else process.env[key] = old[key];
    }
  });

  it('permits only the matching internal token in public mode', () => {
    const guard = new GameInternalGuard();
    expect(guard.canActivate(context(secret))).toBe(true);
    for (const candidate of [undefined, '', 'wrong', secret + 'x', secret.slice(0, -1)]) {
      expect(() => guard.canActivate(context(candidate))).toThrow(HttpException);
    }
  });
  it('denies even a valid token when the public release switch is off', () => {
    delete process.env.AMI_PUBLIC_GAME;
    expect(() => new GameInternalGuard().canActivate(context(secret))).toThrow(HttpException);
  });
  it('preserves historical local preview, without requiring a production secret', () => {
    delete process.env.VERCEL;
    process.env.AMI_DEV_PREVIEW = '1';
    delete process.env.AMI_API_INTERNAL_TOKEN;
    expect(new GameInternalGuard().canActivate(context())).toBe(true);
  });
});
