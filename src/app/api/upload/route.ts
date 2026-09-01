import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireRole } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import {
  ALLOWED_MIME,
  MAX_UPLOAD_BYTES,
  deleteImage,
  isConfigured,
  pathFromPublicUrl,
  uploadImage,
} from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/upload — tải một ảnh lên Supabase Storage.
 * Nhận multipart/form-data với trường `file`, tuỳ chọn `prefix` và `alt`.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("EDITOR");

    if (!isConfigured()) {
      return Response.json({ error: "STORAGE_NOT_CONFIGURED" }, { status: 503 });
    }

    if (!rateLimit(`upload:${user.id}`, { limit: 40, windowMs: 60_000 }).ok) {
      return Response.json({ error: "RATE_LIMITED" }, { status: 429 });
    }

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "MISSING_FILE" }, { status: 400 });
    }

    // Kiểm tra kích thước và kiểu TRƯỚC khi đụng tới Storage
    if (file.size > MAX_UPLOAD_BYTES) {
      return Response.json(
        { error: "FILE_TOO_LARGE", maxBytes: MAX_UPLOAD_BYTES },
        { status: 413 },
      );
    }

    if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
      return Response.json(
        { error: "UNSUPPORTED_TYPE", allowed: ALLOWED_MIME },
        { status: 415 },
      );
    }

    const prefixRaw = form.get("prefix");
    const prefix =
      typeof prefixRaw === "string" && /^[a-z0-9-]{1,32}$/.test(prefixRaw)
        ? prefixRaw
        : "articles";

    const uploaded = await uploadImage(file, prefix);

    const alt = form.get("alt");
    const media = await prisma.media.create({
      data: {
        path: uploaded.path,
        bucket: uploaded.bucket,
        url: uploaded.url,
        mimeType: file.type,
        size: file.size,
        alt: typeof alt === "string" && alt.trim() ? alt.trim().slice(0, 300) : null,
        uploadedById: user.id,
      },
      select: { id: true, url: true, path: true, alt: true },
    });

    return Response.json(media, { status: 201 });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("[upload]", error);
    return Response.json({ error: "UPLOAD_FAILED" }, { status: 500 });
  }
}

/**
 * DELETE /api/upload — xoá một ảnh khỏi Storage.
 * Nhận `{ path }` hoặc `{ url }`. Chỉ ADMIN hoặc chính người đã tải lên.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireRole("EDITOR");

    const body = (await request.json().catch(() => ({}))) as {
      path?: string;
      url?: string;
    };
    const path = body.path ?? (body.url ? pathFromPublicUrl(body.url) : null);

    if (!path) {
      return Response.json({ error: "MISSING_PATH" }, { status: 400 });
    }

    const media = await prisma.media.findUnique({ where: { path } });
    if (media && user.role !== "ADMIN" && media.uploadedById !== user.id) {
      return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    await deleteImage(path);
    // deleteMany chứ không phải delete: file có thể tồn tại trong bucket
    // mà chưa có bản ghi trong DB (ví dụ tải lên từ Supabase Dashboard).
    await prisma.media.deleteMany({ where: { path } });

    return new Response(null, { status: 204 });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("[upload:delete]", error);
    return Response.json({ error: "DELETE_FAILED" }, { status: 500 });
  }
}
