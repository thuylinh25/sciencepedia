"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/rbac";
import { intakeCover } from "@/lib/cover-intake";
import { articleSchema, type ArticleInput } from "@/lib/validations";
import { readingTime, slugify } from "@/lib/utils";
import { removeArticle, syncArticle } from "@/lib/meili";
import type { ActionResult } from "@/server/actions/types";

/* Các action ở đây ghi thẳng `status: PUBLISHED`, KHÔNG gọi `check-publish`.
   Có chủ ý: form quản trị là đường xuất bản tay của chủ sản phẩm (quyết định
   2026-09-25, docs/architecture.md mục "Form quản trị KHÔNG đi qua khoá").
   Bài xuất bản ở đây vẫn hiện CHẶN trong `npm run publish:check` — đó là trạng
   thái thật, dọn sau bằng script, đừng nới gate. Chặn duy nhất còn lại là dấu
   trích dẫn của công cụ AI, nằm trong `articleSchema`. */

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
    coverImageCredit: input.coverImageCredit?.trim() || null,
    coverImageCreditEn: input.coverImageCreditEn?.trim() || null,
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

    /* Dán URL ảnh ngoài thì kéo về R2 ngay trong lượt lưu — xem
       `src/lib/cover-intake.ts`. Hỏng thì vẫn lưu, chỉ là bìa còn trỏ ra
       ngoài cho tới lượt `covers:mirror` kế tiếp. */
    const base = normalise(parsed.data);
    const data = await intakeCover(base, {
      prefix: "articles",
      name: base.slug,
    });

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

    /* Dán URL ảnh ngoài thì kéo về R2 ngay trong lượt lưu — xem
       `src/lib/cover-intake.ts`. Hỏng thì vẫn lưu, chỉ là bìa còn trỏ ra
       ngoài cho tới lượt `covers:mirror` kế tiếp. */
    const base = normalise(parsed.data);
    const data = await intakeCover(base, {
      prefix: "articles",
      name: base.slug,
    });

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
