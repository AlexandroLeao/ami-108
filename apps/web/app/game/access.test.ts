import { describe, expect, it } from 'vitest';
import { gameMode, securePublicOrigin } from './access';

const base = {
  VERCEL: '1', NODE_ENV: 'production', AMI_PUBLIC_GAME: '1',
  AMI_PUBLIC_ORIGIN: 'https://ami-108.vercel.app',
  API_URL: 'https://private-binding.invalid',
  AMI_API_INTERNAL_TOKEN: 'r'.repeat(40),
};
describe('explicit game release gate', () => {
  it('allows historical local preview only outside Vercel', () => {
    expect(gameMode({ AMI_DEV_PREVIEW: '1' })).toBe('local');
    expect(gameMode({ ...base, AMI_DEV_PREVIEW: '1' })).toBe('disabled');
  });
  it('fails closed until each public prerequisite is present', () => {
    expect(gameMode(base)).toBe('public');
    for (const missing of ['NODE_ENV', 'AMI_PUBLIC_GAME', 'AMI_PUBLIC_ORIGIN', 'API_URL', 'AMI_API_INTERNAL_TOKEN']) {
      expect(gameMode({ ...base, [missing]: '' })).toBe('disabled');
    }
    expect(gameMode({ ...base, AMI_API_INTERNAL_TOKEN: 'short' })).toBe('disabled');
  });
  it('requires an exact HTTPS origin without credentials or paths', () => {
    for (const origin of [
      'http://ami-108.vercel.app', 'https://ami-108.vercel.app.evil.invalid',
      'https://user:pass@ami-108.vercel.app', 'https://ami-108.vercel.app/path',
      'https://ami-108.vercel.app/', 'javascript:alert(1)',
    ]) {
      expect(securePublicOrigin(origin)).toBe(false);
      expect(gameMode({ ...base, AMI_PUBLIC_ORIGIN: origin })).toBe('disabled');
    }
    expect(securePublicOrigin(base.AMI_PUBLIC_ORIGIN)).toBe(true);
  });
});
