// Limit raw bytes before decoding or forwarding. Do not read an unbounded
// request into memory when Content-Length is missing or unreliable.
export const MAX_GAME_BODY_BYTES = 2048;
type ReadResult = { ok: true; body: string } | { ok: false; status: 400 | 413 };

export async function readGameBody(stream: ReadableStream<Uint8Array> | null): Promise<ReadResult> {
  if (!stream) return { ok: true, body: '' };
  const reader = stream.getReader();
  const buffer = new Uint8Array(MAX_GAME_BODY_BYTES);
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return { ok: true, body: new TextDecoder().decode(buffer.subarray(0, size)) };
      if (value.byteLength > MAX_GAME_BODY_BYTES - size) {
        // Do not wait for a potentially stalled upstream cancellation.
        void reader.cancel().catch(() => {});
        return { ok: false, status: 413 };
      }
      buffer.set(value, size);
      size += value.byteLength;
    }
  } catch {
    return { ok: false, status: 400 };
  } finally {
    reader.releaseLock();
  }
}
