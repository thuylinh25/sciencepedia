"use server";

import bcrypt from "bcryptjs";
import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma, type Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { AuthError, requireRole } from "@/lib/rbac";
import {
  adminUserSchema,
  categorySchema,
  tagSchema,
  type AdminUserInput,
  type CategoryInput,
  type TagInput,
} from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { issueResetLinkForAdmin } from "@/server/password-reset";
import type { ActionResult } from "@/server/actions/types";

function toFailure(error: unknown, entity: string): ActionResult<never> {
  if (error instanceof AuthError) return { ok: false, error: error.code };
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      ok: false,
      error: "SLUG_TAKEN",
      fieldErrors: { slug: ["Slug này đã tồn tại"] },
    };
  }
  // P2003/P2014: còn bài viết đang tham chiếu danh mục
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2003" || error.code === "P2014")
  ) {
    return { ok: false, error: "IN_USE" };
  }
  console.error(`[${entity}]`, error);
  return { ok: false, error: "SERVER_ERROR" };
}

// ------------------------------------------------------------------ Danh mục

export async function createCategory(
  raw: CategoryInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole("ADMIN");

    const parsed = categorySchema.safeParse(raw);
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

    const input = parsed.data;
    const category = await prisma.category.create({
      data: {
        slug: input.slug?.trim() || slugify(input.name),
        name: input.name.trim(),
        nameEn: input.nameEn.trim(),
        description: input.description?.trim() || null,
        descriptionEn: input.descriptionEn?.trim() || null,
        icon: input.icon?.trim() || null,
        color: input.color,
        coverImage: input.coverImage?.trim() || null,
        parentId: input.parentId || null,
        order: input.order,
      },
      select: { id: true },
    });

    revalidateTag("categories");
    revalidatePath("/[locale]/categories", "page");

    return { ok: true, data: category };
  } catch (error) {
    return toFailure(error, "categories");
  }
}

export async function updateCategory(
  id: string,
  raw: CategoryInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole("ADMIN");

    const parsed = categorySchema.safeParse(raw);
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

    const input = parsed.data;

    // Không cho một danh mục làm cha của chính nó
    if (input.parentId === id) {
      return {
        ok: false,
        error: "INVALID_PARENT",
        fieldErrors: { parentId: ["Danh mục không thể là cha của chính nó"] },
      };
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        slug: input.slug?.trim() || slugify(input.name),
        name: input.name.trim(),
        nameEn: input.nameEn.trim(),
        description: input.description?.trim() || null,
        descriptionEn: input.descriptionEn?.trim() || null,
        icon: input.icon?.trim() || null,
        color: input.color,
        coverImage: input.coverImage?.trim() || null,
        parentId: input.parentId || null,
        order: input.order,
      },
      select: { id: true, slug: true },
    });

    revalidateTag("categories");
    revalidatePath("/[locale]/categories", "page");
    revalidatePath(`/[locale]/categories/${category.slug}`, "page");

    return { ok: true, data: { id: category.id } };
  } catch (error) {
    return toFailure(error, "categories");
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");

    const count = await prisma.article.count({ where: { categoryId: id } });
    if (count > 0) return { ok: false, error: "IN_USE" };

    await prisma.category.delete({ where: { id } });

    revalidateTag("categories");
    revalidatePath("/[locale]/categories", "page");

    return { ok: true, data: undefined };
  } catch (error) {
    return toFailure(error, "categories");
  }
}

// ------------------------------------------------------------------ Thẻ

export async function createTag(
  raw: TagInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole("EDITOR");

    const parsed = tagSchema.safeParse(raw);
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

    const input = parsed.data;
    const tag = await prisma.tag.create({
      data: {
        slug: input.slug?.trim() || slugify(input.name),
        name: input.name.trim(),
        nameEn: input.nameEn.trim(),
        color: input.color,
      },
      select: { id: true },
    });

    revalidateTag("tags");
    return { ok: true, data: tag };
  } catch (error) {
    return toFailure(error, "tags");
  }
}

export async function updateTag(
  id: string,
  raw: TagInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole("EDITOR");

    const parsed = tagSchema.safeParse(raw);
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

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        slug: parsed.data.slug?.trim() || slugify(parsed.data.name),
        name: parsed.data.name.trim(),
        nameEn: parsed.data.nameEn.trim(),
        color: parsed.data.color,
      },
      select: { id: true },
    });

    revalidateTag("tags");
    return { ok: true, data: tag };
  } catch (error) {
    return toFailure(error, "tags");
  }
}

export async function deleteTag(id: string): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    await prisma.tag.delete({ where: { id } });
    revalidateTag("tags");
    return { ok: true, data: undefined };
  } catch (error) {
    return toFailure(error, "tags");
  }
}

// ------------------------------------------------------------------ Người dùng

/**
 * Quản trị viên tạo một tài khoản mới.
 *
 * Đường này KHÔNG đi qua `/api/auth/register`: route đó luôn tạo USER và không
 * nhận vai trò, đúng như một trang đăng ký công khai phải thế. Trộn hai việc
 * vào một chỗ sẽ mở đường cho người ngoài tự đặt vai trò cho mình.
 *
 * Email chuẩn hoá về chữ thường trước khi kiểm và trước khi lưu. Postgres so
 * chuỗi có phân biệt hoa thường, nên không chuẩn hoá thì "A@x.com" và
 * "a@x.com" thành hai tài khoản, và người dùng đăng nhập được bằng đúng một
 * trong hai mà không hiểu vì sao.
 */
export async function createUser(
  raw: AdminUserInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole("ADMIN");

    const parsed = adminUserSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" };
    }

    const email = parsed.data.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { ok: false, error: "EMAIL_TAKEN" };

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name.trim(),
        email,
        role: parsed.data.role,
        // 12 vòng, cùng con số với trang đăng ký. Hai đường tạo tài khoản mà
        // băm khác độ mạnh thì đường yếu hơn thành điểm tấn công.
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
      },
      select: { id: true },
    });

    revalidatePath("/[locale]/admin/users", "page");
    return { ok: true, data: user };
  } catch (error) {
    return toFailure(error, "users");
  }
}

/**
 * Sinh liên kết đặt lại mật khẩu cho một tài khoản, để quản trị viên chuyển tay.
 *
 * Chỉ ADMIN. Đây là đường vòng qua toàn bộ việc xác thực mật khẩu của một tài
 * khoản bất kỳ, nên nó phải ở mức quyền cao nhất — một EDITOR gọi được hàm này
 * là một EDITOR chiếm được tài khoản quản trị.
 *
 * `origin` lấy từ biến môi trường chứ KHÔNG từ header, cùng lý do đã ghi ở
 * route công khai: header Host do client gửi và sửa được.
 */
export async function issueResetLink(
  email: string,
  locale: string,
): Promise<ActionResult<{ link: string }>> {
  try {
    await requireRole("ADMIN");

    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const result = await issueResetLinkForAdmin(email, origin, locale);

    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, data: { link: result.link } };
  } catch (error) {
    return toFailure(error, "users");
  }
}

export async function updateUserRole(
  userId: string,
  role: Role,
): Promise<ActionResult> {
  try {
    const actor = await requireRole("ADMIN");

    // Tự hạ quyền chính mình sẽ khoá luôn khu quản trị
    if (actor.id === userId && role !== "ADMIN") {
      return { ok: false, error: "CANNOT_DEMOTE_SELF" };
    }

    await prisma.user.update({ where: { id: userId }, data: { role } });
    revalidatePath("/[locale]/admin/users", "page");

    return { ok: true, data: undefined };
  } catch (error) {
    return toFailure(error, "users");
  }
}
