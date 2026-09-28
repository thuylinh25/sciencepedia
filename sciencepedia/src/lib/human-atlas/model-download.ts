/**
 * Giải một phản hồi tải khối hình học.
 *
 * Port từ Human Atlas (MIT, © 2026 ashemag). Máy chủ tĩnh có thể phát `.gz`
 * dưới dạng nén truyền tải (trình duyệt đã tự giải) HOẶC dưới dạng một tệp
 * gzip nguyên — R2 là trường hợp thứ hai. Soi hai byte chữ ký thay vì tin
 * header, để không giải nén hai lần hay bỏ sót lần nào.
 */
export class ModelDownloadError extends Error {}

export async function decodeModelResponse(
  response: Response,
  expectedBytes: number | null,
  compressed: boolean,
): Promise<ArrayBuffer> {
  if (!response.ok) throw new ModelDownloadError(`HTTP ${response.status}`);
  const payload = await response.arrayBuffer();
  const signature = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
  const gzip = compressed && signature[0] === 0x1f && signature[1] === 0x8b;
  const buffer = gzip
    ? await new Response(
        new Blob([payload]).stream().pipeThrough(new DecompressionStream("gzip")),
      ).arrayBuffer()
    : payload;
  if (expectedBytes !== null && buffer.byteLength !== expectedBytes) {
    throw new ModelDownloadError("incomplete");
  }
  return buffer;
}
