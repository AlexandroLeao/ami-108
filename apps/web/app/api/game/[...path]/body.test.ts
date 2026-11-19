import { describe, expect, it, vi } from 'vitest';
import { MAX_GAME_BODY_BYTES, MAX_GAME_BODY_READ_MS, readGameBody } from './body';

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
  it('rejects a stalled body at the total deadline and releases the reader', async () => {
    vi.useFakeTimers();
    try {
      let cancelled = false;
      const body = new ReadableStream<Uint8Array>({
        cancel() {
          cancelled = true;
          // A source that never finishes cancellation must not delay the response.
          return new Promise<void>(() => {});
        },
      });
      const result = readGameBody(body, 100);
      await vi.advanceTimersByTimeAsync(100);
      expect(await result).toEqual({ ok: false, status: 408 });
      expect(cancelled).toBe(true);
      expect(body.locked).toBe(false);
    } finally { vi.useRealTimers(); }
  });
  it('does not reset the deadline for a partial chunk', async () => {
    vi.useFakeTimers();
    try {
      let controller!: ReadableStreamDefaultController<Uint8Array>;
      const body = new ReadableStream<Uint8Array>({ start(c) { controller = c; } });
      const result = readGameBody(body, 100);
      await vi.advanceTimersByTimeAsync(60);
      controller.enqueue(encoder.encode('{'));
      await vi.advanceTimersByTimeAsync(40);
      expect(await result).toEqual({ ok: false, status: 408 });
      expect(body.locked).toBe(false);
    } finally { vi.useRealTimers(); }
  });
  it('clears the deadline after a successful read', async () => {
    vi.useFakeTimers();
    try {
      expect(MAX_GAME_BODY_READ_MS).toBe(10000);
      expect(await readGameBody(stream(encoder.encode('{}')))).toEqual({ ok: true, body: '{}' });
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });
});
