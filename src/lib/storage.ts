import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Storage — nơi chứa ảnh bài viết và ảnh danh mục.
 *
 * Client ở đây dùng SERVICE ROLE KEY nên bỏ qua toàn bộ RLS. Module này được
 * đánh dấu "server-only": nếu lỡ import từ Client Component, build sẽ báo lỗi
 * thay vì âm thầm nhúng khoá quản trị vào bundle trình duyệt.
 */

export const BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "article-images";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

/** Chỉ nhận đúng các định dạng ảnh web — không nhận SVG vì SVG chạy được script. */
export const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

let client: SupabaseClient | null = null;

export function storage(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY",
      );
    }

    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Sinh đường dẫn trong bucket: `<prefix>/<năm>/<tháng>/<slug>-<random>.<ext>`
 * Chia theo tháng để một thư mục không phình lên hàng chục nghìn file.
 */
export function buildPath(
  originalName: string,
  mimeType: string,
  prefix = "articles",
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const base = originalName
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "image";

  const random = crypto.randomUUID().slice(0, 8);
  const ext = EXTENSION[mimeType] ?? "bin";

  return `${prefix}/${year}/${month}/${base}-${random}.${ext}`;
}

export type UploadResult = {
  path: string;
  url: string;
  bucket: string;
};

export async function uploadImage(
  file: File,
  prefix?: string,
): Promise<UploadResult> {
  const path = buildPath(file.name, file.type, prefix);

  const { error } = await storage()
    .storage.from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      // Ảnh là bất biến: mỗi lần tải lên sinh tên mới, nên cache thoải mái
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) throw new Error(`Upload thất bại: ${error.message}`);

  const {
    data: { publicUrl },
  } = storage().storage.from(BUCKET).getPublicUrl(path);

  return { path, url: publicUrl, bucket: BUCKET };
}

export async function deleteImage(path: string): Promise<void> {
  const { error } = await storage().storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Xoá ảnh thất bại: ${error.message}`);
}

/** Suy ngược đường dẫn trong bucket từ public URL (dùng khi chỉ có URL trong DB). */
export function pathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}
