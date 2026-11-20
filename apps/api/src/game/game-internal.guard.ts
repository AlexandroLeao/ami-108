import { HttpException, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { gameMode } from './game-access';

@Injectable()
export class GameInternalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const mode = gameMode();
    if (mode === 'local') return true;
    if (mode !== 'public') return this.reject();
    const { headers } = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const secret = process.env.AMI_API_INTERNAL_TOKEN;
    const supplied = headers['x-ami-internal-token'];
    if (typeof secret !== 'string' || typeof supplied !== 'string') return this.reject();
    const expected = Buffer.from(secret, 'utf8');
    const actual = Buffer.from(supplied, 'utf8');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return this.reject();
    return true;
  }

  private reject(): never {
    throw new HttpException(
      { code: 'NOT_AVAILABLE', message: 'NOT_AVAILABLE', requestId: randomUUID() }, 404,
    );
  }
}
