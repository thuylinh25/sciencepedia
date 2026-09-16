import { createHash, createHmac } from "node:crypto";

/**
 * Nói chuyện với Cloudflare R2 qua giao thức S3, ký SigV4 bằng `node:crypto`.
 *
 * ## Vì sao không dùng `@aws-sdk/client-s3`
 *
 * SDK của AWS kéo theo vài chục gói cho hai thao tác (PUT và LIST) trong những
 * script chạy tay dăm lần một năm. Đây là ứng dụng Next, không phải hộp công cụ
 * hạ tầng: mỗi phụ thuộc thêm vào `package.json` là thứ phải vá và nâng cấp mãi
 * về sau. Chữ ký SigV4 gói gọn trong một tệp.
 *
 * ## Vì sao không dùng `wrangler`
 *
 * `wrangler` xác thực bằng OAuth hoặc `CLOUDFLARE_API_TOKEN` — khác hẳn cặp
 * khoá S3 mà R2 phát riêng cho truy cập kiểu S3. Đã có cặp khoá ấy trong `.env`
 * thì đi thẳng bằng nó, khỏi dựng thêm một đường xác thực thứ hai.
 */

const ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

/**
 * `CLOUDFLARE_ACCOUNT_ID` là tên `wrangler` và tài liệu Cloudflare dùng, nên nó
 * đứng trước; `CLOUDFLARE_R2_ACCOUNT_ID` giữ lại cho ai đã đặt theo lối gom
 * tiền tố R2. Cùng một giá trị — đây là chỗ dễ mất nửa tiếng vì một biến đặt
 * đúng nhưng sai tên.
 */
const ACCOUNT_ID =
  process.env.CLOUDFLARE_ACCOUNT_ID ?? process.env.CLOUDFLARE_R2_ACCOUNT_ID;

export const BUCKET = process.env.CLOUDFLARE_R2_BUCKET;

const REGION = "auto"; // R2 không có vùng; SigV4 vẫn đòi một chuỗi vùng.
const SERVICE = "s3";

/** Tên biến còn thiếu, rỗng nghĩa là đủ. Script gọi để báo lỗi sớm và rõ. */
export function missingEnv(): string[] {
  return (
    [
      ["CLOUDFLARE_ACCOUNT_ID", ACCOUNT_ID],
      ["CLOUDFLARE_R2_BUCKET", BUCKET],
      ["CLOUDFLARE_R2_ACCESS_KEY_ID", ACCESS_KEY],
      ["CLOUDFLARE_R2_SECRET_ACCESS_KEY", SECRET_KEY],
    ] as const
  )
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

const sha256 = (data: Buffer | string) =>
  createHash("sha256").update(data).digest("hex");

const hmac = (key: Buffer | string, data: string) =>
  createHmac("sha256", key).update(data, "utf8").digest();

/**
 * Mã hoá từng đoạn đường dẫn theo luật của SigV4.
 *
 * `encodeURIComponent` bỏ sót `!'()*` — AWS đòi mã hoá cả chúng, và chữ ký
 * lệch một ký tự là 403 không kèm giải thích.
 */
function encodeSegment(segment: string): string {
  return encodeURIComponent(segment).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

type Request = {
  method: "GET" | "PUT";
  /** Khoá trong bucket; rỗng nghĩa là thao tác trên chính bucket (list). */
  key?: string;
  /** Chuỗi truy vấn đã sắp xếp theo alphabet, đúng như SigV4 đòi. */
  query?: string;
  body?: Buffer;
  headers?: Record<string, string>;
};

export async function send({
  method,
  key = "",
  query = "",
  body,
  headers: extra = {},
}: Request): Promise<Response> {
  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(body ?? "");

  const path = key
    ? `/${BUCKET}/${key.split("/").map(encodeSegment).join("/")}`
    : `/${BUCKET}`;

  // Tên header phải viết thường và sắp theo alphabet, ở cả hai chỗ.
  const headers: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(extra).map(([k, v]) => [k.toLowerCase(), v]),
    ),
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  const names = Object.keys(headers).sort();

  const canonicalRequest = [
    method,
    path,
    query,
    names.map((n) => `${n}:${headers[n]}\n`).join(""),
    names.join(";"),
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256(canonicalRequest),
  ].join("\n");

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${SECRET_KEY}`, dateStamp), REGION), SERVICE),
    "aws4_request",
  );
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign, "utf8")
    .digest("hex");

  const { host: _host, ...sendable } = headers;
  return fetch(`https://${host}${path}${query ? `?${query}` : ""}`, {
    method,
    headers: {
      ...sendable,
      Authorization:
        `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${scope}, ` +
        `SignedHeaders=${names.join(";")}, Signature=${signature}`,
    },
    body: body ? new Uint8Array(body) : undefined,
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
