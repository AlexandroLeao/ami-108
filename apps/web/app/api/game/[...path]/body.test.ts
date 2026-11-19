import { describe, expect, it } from 'vitest';
import { MAX_GAME_BODY_BYTES, readGameBody } from './body';

const encoder = new TextEncoder();
function stream(...chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({ start(controller) {
    for (const chunk of chunks) controller.enqueue(chunk);
    controller.close();
  } });
}

describe('bounded game facade request body', () => {
  it('accepts empty bodies for upstream validation', async () => {
    expect(await readGameBody(null)).toEqual({ ok: true, body: '' });
    expect(await readGameBody(stream())).toEqual({ ok: true, body: '' });
  });
  it('preserves split UTF-8 bytes and valid JSON', async () => {
    const body = '{"locale":"pt-BR","text":"ação"}';
    const bytes = encoder.encode(body);
    expect(await readGameBody(stream(...Array.from(bytes, byte => Uint8Array.of(byte))))).toEqual({ ok: true, body });
  });
  it('accepts the exact raw byte limit', async () => {
    const bytes = encoder.encode('é'.repeat(MAX_GAME_BODY_BYTES / 2));
    expect(await readGameBody(stream(bytes))).toEqual({ ok: true, body: 'é'.repeat(MAX_GAME_BODY_BYTES / 2) });
  });
  it('rejects oversized single and multiple chunks', async () => {
    expect(await readGameBody(stream(new Uint8Array(MAX_GAME_BODY_BYTES + 1)))).toEqual({ ok: false, status: 413 });
    expect(await readGameBody(stream(new Uint8Array(MAX_GAME_BODY_BYTES), Uint8Array.of(1)))).toEqual({ ok: false, status: 413 });
  });
  it('cancels an overflowing stream without waiting for its end', async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(MAX_GAME_BODY_BYTES + 1)); },
      cancel() { cancelled = true; },
    });
    expect(await readGameBody(body)).toEqual({ ok: false, status: 413 });
    expect(cancelled).toBe(true);
    expect(body.locked).toBe(false);
  });
  it('rejects a failed stream without forwarding partial data', async () => {
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.error(new Error('read failed')); } });
    expect(await readGameBody(body)).toEqual({ ok: false, status: 400 });
    expect(body.locked).toBe(false);
  });
});
