import { createHash, createHmac } from "node:crypto";

/**
 * Ký một yêu cầu S3 theo AWS Signature V4, dùng cho Cloudflare R2.
 *
 * ## Vì sao tách riêng khỏi nơi đọc khoá
 *
 * Module này KHÔNG đọc biến môi trường và KHÔNG có `server-only`: nó nhận khoá
 * qua tham số và trả về các header. Nhờ vậy cả `src/lib/storage.ts` (chạy trên
 * máy chủ Next, có `server-only`) lẫn `scripts/r2-client.ts` (chạy bằng tsx)
 * dùng chung đúng một cách ký, mà bí mật vẫn nằm gọn ở hai chỗ đọc env.
 *
 * Nếu để phần ký nằm cùng phần đọc khoá, một trong hai bên sẽ phải chép lại
 * chừng trăm dòng — và bản chép sẽ lệch đi ở lần sửa thứ hai.
 *
 * ## Vì sao không dùng `@aws-sdk/client-s3`
 *
 * SDK của AWS kéo theo vài chục gói cho vài thao tác PUT/GET/DELETE. Đây là
 * ứng dụng Next, không phải hộp công cụ hạ tầng: mỗi phụ thuộc thêm vào là
 * thứ phải vá và nâng cấp mãi về sau.
 */

const REGION = "auto"; // R2 không có vùng; SigV4 vẫn đòi một chuỗi vùng.
const SERVICE = "s3";

export type R2Credentials = {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

const sha256 = (data: Buffer | string) =>
  createHash("sha256").update(data).digest("hex");

const hmac = (key: Buffer | string, data: string) =>
  createHmac("sha256", key).update(data, "utf8").digest();

/**
 * Mã hoá một đoạn đường dẫn theo luật của SigV4.
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

export type SignedRequest = {
  url: string;
  headers: Record<string, string>;
};

export function signR2Request(
  credentials: R2Credentials,
  {
    method,
    key = "",
    query = "",
    body,
    headers: extra = {},
  }: {
    method: "GET" | "PUT" | "DELETE";
    /** Khoá trong bucket; rỗng nghĩa là thao tác trên chính bucket (list). */
    key?: string;
    /** Chuỗi truy vấn đã sắp theo alphabet, đúng như SigV4 đòi. */
    query?: string;
    body?: Buffer;
    headers?: Record<string, string>;
  },
): SignedRequest {
  const { accountId, bucket, accessKeyId, secretAccessKey } = credentials;

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(body ?? "");

  const path = key
    ? `/${bucket}/${key.split("/").map(encodeSegment).join("/")}`
    : `/${bucket}`;

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
    hmac(hmac(hmac(`AWS4${secretAccessKey}`, dateStamp), REGION), SERVICE),
    "aws4_request",
  );
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign, "utf8")
    .digest("hex");

  const { host: _host, ...sendable } = headers;

  return {
    url: `https://${host}${path}${query ? `?${query}` : ""}`,
    headers: {
      ...sendable,
      Authorization:
        `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, ` +
        `SignedHeaders=${names.join(";")}, Signature=${signature}`,
    },
  };
}
