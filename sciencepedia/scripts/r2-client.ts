import { signR2Request, type R2Credentials } from "../src/lib/r2-sign";

/**
 * Nói chuyện với Cloudflare R2 qua giao thức S3, dùng cho các script chạy tay.
 *
 * Phần ký SigV4 nằm ở `src/lib/r2-sign.ts` và dùng chung với `src/lib/storage.ts`
 * (đường tải lên của trang quản trị). Ở đây chỉ còn phần đọc khoá từ `.env` và
 * vài thao tác tiện tay — một cách ký, hai nơi gọi, không có bản chép thứ hai
 * để lệch đi ở lần sửa sau.
 */

function credentials(): R2Credentials {
  return {
    /*
     * `CLOUDFLARE_ACCOUNT_ID` là tên `wrangler` và tài liệu Cloudflare dùng,
     * nên nó đứng trước; `CLOUDFLARE_R2_ACCOUNT_ID` giữ lại cho ai đã đặt theo
     * lối gom tiền tố R2. Cùng một giá trị — đây là chỗ dễ mất nửa tiếng vì
     * một biến đặt đúng nhưng sai tên.
     */
    accountId:
      process.env.CLOUDFLARE_ACCOUNT_ID ??
      process.env.CLOUDFLARE_R2_ACCOUNT_ID ??
      "",
    bucket: process.env.CLOUDFLARE_R2_BUCKET ?? "",
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "",
  };
}

export const BUCKET = process.env.CLOUDFLARE_R2_BUCKET;

/** Tên biến còn thiếu, rỗng nghĩa là đủ. Script gọi để báo lỗi sớm và rõ. */
export function missingEnv(): string[] {
  const c = credentials();
  return (
    [
      ["CLOUDFLARE_ACCOUNT_ID", c.accountId],
      ["CLOUDFLARE_R2_BUCKET", c.bucket],
      ["CLOUDFLARE_R2_ACCESS_KEY_ID", c.accessKeyId],
      ["CLOUDFLARE_R2_SECRET_ACCESS_KEY", c.secretAccessKey],
    ] as const
  )
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

async function send(request: Parameters<typeof signR2Request>[1]) {
  const signed = signR2Request(credentials(), request);
  return fetch(signed.url, {
    method: request.method,
    headers: signed.headers,
    body: request.body ? new Uint8Array(request.body) : undefined,
  });
}

export async function put(
  key: string,
  body: Buffer,
  headers: Record<string, string>,
): Promise<void> {
  const response = await send({ method: "PUT", key, body, headers });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`HTTP ${response.status} — ${detail}`);
  }
}

/**
 * Liệt kê mọi khoá trong bucket, đi hết các trang.
 *
 * R2 trả tối đa 1000 khoá mỗi lượt và đưa `NextContinuationToken` khi còn nữa.
 * Bỏ qua phân trang là kiểu lỗi chỉ lộ ra khi kho đủ lớn — tức là lộ ra muộn.
 */
export async function listKeys(prefix = ""): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;

  do {
    const query = [
      "list-type=2",
      prefix ? `prefix=${encodeURIComponent(prefix)}` : "",
      token ? `continuation-token=${encodeURIComponent(token)}` : "",
    ]
      .filter(Boolean)
      .sort() // SigV4 đòi tham số truy vấn sắp theo alphabet.
      .join("&");

    const response = await send({ method: "GET", query });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      throw new Error(`Liệt kê thất bại: HTTP ${response.status} — ${detail}`);
    }

    const xml = await response.text();
    for (const match of xml.matchAll(/<Key>([^<]+)<\/Key>/g)) {
      keys.push(decodeXml(match[1]));
    }
    token = xml.match(
      /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/,
    )?.[1];
  } while (token);

  return keys.sort();
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
