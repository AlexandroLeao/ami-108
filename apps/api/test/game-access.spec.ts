import { gameMode } from '../src/game/game-access';

describe('NestJS production release gate', () => {
  const ready = {
    VERCEL: '1', NODE_ENV: 'production', AMI_PUBLIC_GAME: '1',
    AMI_PUBLIC_ORIGIN: 'https://ami-108.vercel.app',
    AMI_API_INTERNAL_TOKEN: 's'.repeat(40),
  };
  it('preserves local preview and ignores development mode on Vercel', () => {
    expect(gameMode({ AMI_DEV_PREVIEW: '1' })).toBe('local');
    expect(gameMode({ ...ready, AMI_DEV_PREVIEW: '1' })).toBe('disabled');
  });
  it('fails closed until all explicit production variables are configured', () => {
    expect(gameMode(ready)).toBe('public');
    for (const missing of ['NODE_ENV', 'AMI_PUBLIC_GAME', 'AMI_PUBLIC_ORIGIN', 'AMI_API_INTERNAL_TOKEN']) {
      expect(gameMode({ ...ready, [missing]: '' })).toBe('disabled');
    }
    expect(gameMode({ ...ready, AMI_API_INTERNAL_TOKEN: 'short' })).toBe('disabled');
    expect(gameMode({ ...ready, AMI_PUBLIC_ORIGIN: 'http://ami-108.vercel.app' })).toBe('disabled');
  });
});
