// Limit raw bytes and total read time before decoding or forwarding.
// Do not accumulate an unbounded request when Content-Length is unreliable.
export const MAX_GAME_BODY_BYTES = 2048;
export const MAX_GAME_BODY_READ_MS = 10000;
type ReadResult = { ok: true; body: string } | { ok: false; status: 400 | 408 | 413 };

export async function readGameBody(
  stream: ReadableStream<Uint8Array> | null,
  timeoutMs = MAX_GAME_BODY_READ_MS,
): Promise<ReadResult> {
  if (!stream) return { ok: true, body: '' };
  const reader = stream.getReader();
  const buffer = new Uint8Array(MAX_GAME_BODY_BYTES);
  let size = 0;
  let expired = false;
  const deadline = performance.now() + timeoutMs;
  const cancel = () => { void reader.cancel().catch(() => {}); };
  const expire = () => {
    expired = true;
    // Cancellation settles outstanding reads without waiting for the source.
    cancel();
  };
  const timer = setTimeout(expire, timeoutMs);
  try {
    while (true) {
      const { done, value } = await reader.read();
      // A single absolute deadline, not a fresh timeout for each chunk.
      if (expired || performance.now() >= deadline) {
        if (!expired) expire();
        return { ok: false, status: 408 };
      }
      if (done) return { ok: true, body: new TextDecoder().decode(buffer.subarray(0, size)) };
      if (value.byteLength > MAX_GAME_BODY_BYTES - size) {
        cancel();
        return { ok: false, status: 413 };
      }
      buffer.set(value, size);
      size += value.byteLength;
    }
  } catch {
    return { ok: false, status: expired ? 408 : 400 };
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}
