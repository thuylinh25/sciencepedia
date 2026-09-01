"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/rbac";
import { articleSchema, type ArticleInput } from "@/lib/validations";
import { readingTime, slugify } from "@/lib/utils";
import { removeArticle, syncArticle } from "@/lib/meili";
import type { ActionResult } from "@/server/actions/types";

/** Quan hệ cần có để đẩy một bài viết lên Meilisearch. */
const syncInclude = {
  category: { select: { slug: true, name: true, nameEn: true } },
  tags: { select: { tag: { select: { slug: true, name: true, nameEn: true } } } },
} satisfies Prisma.ArticleInclude;

function invalidate(slug?: string) {
  revalidateTag("articles");
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/articles", "page");
  if (slug) revalidatePath(`/[locale]/articles/${slug}`, "page");
}

function toFailure(error: unknown): ActionResult<never> {
  if (error instanceof AuthError) {
    return { ok: false, error: error.code };
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      ok: false,
      error: "SLUG_TAKEN",
      fieldErrors: { slug: ["Slug này đã được dùng cho bài viết khác"] },
    };
  }
  console.error("[articles]", error);
  return { ok: false, error: "SERVER_ERROR" };
}

/** Chuẩn hoá dữ liệu form: sinh slug nếu trống, tính lại thời gian đọc. */
function normalise(input: ArticleInput) {
  const slug = input.slug?.trim() || slugify(input.title);
  return {
    slug,
    title: input.title.trim(),
    titleEn: input.titleEn?.trim() || null,
    summary: input.summary.trim(),
    summaryEn: input.summaryEn?.trim() || null,
    content: input.content,
    contentEn: input.contentEn?.trim() || null,
    coverImage: input.coverImage?.trim() || null,
    categoryId: input.categoryId,
    status: input.status,
    featured: input.featured,
    readingTime: readingTime(input.content),
    seoTitle: input.seoTitle?.trim() || null,
    seoDescription: input.seoDescription?.trim() || null,
    seoKeywords: input.seoKeywords?.trim() || null,
  };
}

export async function createArticle(
  raw: ArticleInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const user = await requireRole("EDITOR");

    const parsed = articleSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: "INVALID_INPUT",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const data = normalise(parsed.data);

    const article = await prisma.article.create({
      data: {
        ...data,
        authorId: user.id,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
        tags: {
          create: parsed.data.tagIds.map((tagId) => ({ tagId })),
        },
        revisions: {
          create: {
            title: data.title,
            content: data.content,
            note: "Tạo mới",
            editorId: user.id,
          },
        },
      },
      include: syncInclude,
    });

    await syncArticle(article);
    invalidate(article.slug);

    return { ok: true, data: { id: article.id, slug: article.slug } };
  } catch (error) {
    return toFailure(error);
  }
}

export async function updateArticle(
  id: string,
  raw: ArticleInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const user = await requireRole("EDITOR");

    const parsed = articleSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: "INVALID_INPUT",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const existing = await prisma.article.findUnique({
      where: { id },
      select: { slug: true, status: true, publishedAt: true, content: true },
    });
    if (!existing) return { ok: false, error: "NOT_FOUND" };

    const data = normalise(parsed.data);

    // Chỉ đặt publishedAt lần đầu xuất bản — giữ nguyên ở các lần sửa sau
    const publishedAt =
      data.status === "PUBLISHED"
        ? (existing.publishedAt ?? new Date())
        : existing.publishedAt;

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...data,
        publishedAt,
        tags: {
          deleteMany: {},
          create: parsed.data.tagIds.map((tagId) => ({ tagId })),
        },
        // Chỉ lưu bản sửa khi nội dung thực sự thay đổi
        ...(existing.content !== data.content
          ? {
              revisions: {
                create: {
                  title: data.title,
                  content: data.content,
                  editorId: user.id,
                },
              },
            }
          : {}),
      },
      include: syncInclude,
    });

    await syncArticle(article);
    invalidate(article.slug);
    if (existing.slug !== article.slug) invalidate(existing.slug);

    return { ok: true, data: { id: article.id, slug: article.slug } };
  } catch (error) {
    return toFailure(error);
  }
}

export async function deleteArticle(id: string): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");

    const article = await prisma.article.delete({
      where: { id },
      select: { id: true, slug: true },
    });

    await removeArticle(article.id);
    invalidate(article.slug);

    return { ok: true, data: undefined };
  } catch (error) {
    return toFailure(error);
  }
}

/** Bật/tắt xuất bản nhanh từ bảng danh sách. */
export async function toggleArticleStatus(
  id: string,
): Promise<ActionResult<{ status: string }>> {
  try {
    await requireRole("EDITOR");

    const current = await prisma.article.findUnique({
      where: { id },
      select: { status: true, publishedAt: true },
    });
    if (!current) return { ok: false, error: "NOT_FOUND" };

    const nextStatus = current.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

    const article = await prisma.article.update({
      where: { id },
      data: {
        status: nextStatus,
        publishedAt:
          nextStatus === "PUBLISHED"
            ? (current.publishedAt ?? new Date())
            : current.publishedAt,
      },
      include: syncInclude,
    });

    await syncArticle(article);
    invalidate(article.slug);

    return { ok: true, data: { status: nextStatus } };
  } catch (error) {
    return toFailure(error);
  }
}
