import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('web health', () => {
  it('reports liveness', async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', service: 'web' });
  });
});
