"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { AuthError, requireRole } from "@/lib/rbac";
import { slugify } from "@/lib/utils";
import { glossaryTermSchema, type GlossaryTermInput } from "@/lib/validations";
import type { ActionResult } from "@/server/actions/types";

/**
 * Thêm/sửa/xoá mục từ điển thuật ngữ từ trang quản trị.
 *
 * Quyền EDITOR, như thẻ: đây là nội dung biên tập. Xoá đòi ADMIN vì một mục từ
 * biến mất thì mọi `[[...]]` trỏ vào nó lặng lẽ tụt về chữ thường — không có
 * lỗi nào hiện ra, chỉ là tính năng biến mất khỏi những bài đó.
 *
 * `prisma/seed-data/glossary.json` vẫn là bản có NGUỒN của mọi mục và
 * `glossary:seed` vẫn upsert theo slug. Hai đường không đá nhau: seed ghi đè
 * theo file, trang quản trị ghi đè theo form. Sửa mục nào ở đây thì sửa cả
 * trong file, nếu không lượt seed sau sẽ kéo bản cũ về.
 *
 * Một chiều KHÔNG đối xứng: `reviewedById`/`reviewedAt` chỉ đến từ file. Form
 * này không đặt được chúng, chỉ GỠ được — xem `CLAIM_FIELDS` bên dưới.
 */

function toFailure(error: unknown): ActionResult<never> {
  if (error instanceof AuthError) return { ok: false, error: error.code };
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      ok: false,
      error: "SLUG_TAKEN",
      fieldErrors: { slug: ["Slug này đã có mục từ khác dùng"] },
    };
  }
  console.error("[glossary]", error);
  return { ok: false, error: "SERVER_ERROR" };
}

/**
 * Những trường mà sửa chúng là sửa điều mục từ KHẲNG ĐỊNH — và vì thế làm dấu
 * duyệt hết hiệu lực.
 *
 * Cố ý KHÔNG có `aliases`, `category`, `image`, `imageCredit`: thêm một alias
 * hay đổi tấm ảnh không đụng tới một mệnh đề nào, nên gỡ dấu duyệt vì chúng
 * chỉ làm con dấu mất giá trị theo một kiểu khác — nó kêu ở cả những lượt sửa
 * vô hại, rồi không ai nghe nữa và một lượt sửa thật sẽ trôi qua.
 *
 * CÓ `term`/`termEn` vì đổi tên mục từ là đổi chủ ngữ của định nghĩa: "X là Y"
 * thành "Z là Y" là một khẳng định khác, dù phần sau không đổi chữ nào.
 */
const CLAIM_FIELDS = [
  "term",
  "termEn",
  "shortDef",
  "shortDefEn",
  "fullDef",
  "fullDefEn",
] as const;

type Claim = { [K in (typeof CLAIM_FIELDS)[number]]: string | null };

function claimsDiffer(before: Claim, after: Claim): boolean {
  return CLAIM_FIELDS.some((field) => before[field] !== after[field]);
}

/** "Mô-men động lượng, spin" → ["mo-men-dong-luong", "spin"], bỏ trùng và rỗng. */
function parseAliases(raw: string | undefined, slug: string): string[] {
  const list = (raw ?? "")
    .split(",")
    .map((alias) => slugify(alias))
    .filter(Boolean)
    // Alias trùng chính slug là thừa: `getGlossaryForMarkdown` đã tra slug rồi
    .filter((alias) => alias !== slug);
  return [...new Set(list)];
}

/**
 * Hai mục từ cùng nhận một khoá thì `[[khoá]]` trong bài hiện định nghĩa nào là
 * chuyện may rủi theo thứ tự truy vấn. Chặn ở đây, nói rõ mục nào đang giữ
 * khoá đó — rẻ hơn nhiều so với đi tìm vì sao tooltip hiện sai nghĩa.
 */
async function findKeyConflict(
  keys: string[],
  exceptId: string | null,
): Promise<string | null> {
  if (keys.length === 0) return null;

  const clash = await prisma.glossaryTerm.findFirst({
    where: {
      ...(exceptId ? { id: { not: exceptId } } : {}),
      OR: [{ slug: { in: keys } }, { aliases: { hasSome: keys } }],
    },
    select: { term: true, slug: true, aliases: true },
  });
  if (!clash) return null;

  const taken = keys.filter(
    (key) => key === clash.slug || clash.aliases.includes(key),
  );
  return `${taken.join(", ")} — đang thuộc về mục “${clash.term}”`;
}

type Parsed =
  | { ok: false; failure: ActionResult<never> }
  | {
      ok: true;
      slug: string;
      aliases: string[];
      data: Omit<Prisma.GlossaryTermCreateInput, "slug">;
    };

function parse(raw: GlossaryTermInput): Parsed {
  const parsed = glossaryTermSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      failure: {
        ok: false,
        error: "INVALID_INPUT",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  const input = parsed.data;
  const slug = input.slug?.trim() || slugify(input.term);
  const aliases = parseAliases(input.aliases, slug);

  const trimmed = (value: string | undefined) => value?.trim() || null;

  return {
    ok: true,
    slug,
    aliases,
    data: {
      term: input.term.trim(),
      termEn: trimmed(input.termEn),
      shortDef: input.shortDef.trim(),
      shortDefEn: trimmed(input.shortDefEn),
      fullDef: trimmed(input.fullDef),
      fullDefEn: trimmed(input.fullDefEn),
      aliases,
      category: trimmed(input.category),
      image: trimmed(input.image),
      imageCredit: trimmed(input.imageCredit),
    },
  };
}

/**
 * Trang thuật ngữ và trang danh sách làm mới ngay. Bài viết KHÔNG:
 * định nghĩa nằm sẵn trong HTML của từng bài ISR, và không có cách nào biết
 * bài nào chứa `[[khoá]]` mà không quét toàn kho. Chúng tự làm mới trong 5 phút
 * theo `revalidate` của trang bài viết — sửa một dấu phẩy không đáng phải dựng
 * lại cả kho.
 */
function revalidateTerm(slug: string) {
  revalidatePath(`/[locale]/glossary/${slug}`, "page");
  revalidatePath("/[locale]/admin/glossary", "page");
}

/**
 * `stampCleared` báo cho giao diện biết lượt lưu này vừa gỡ dấu duyệt, để nó
 * nói ra. Một tác dụng phụ im lặng lên byline là thứ biên tập viên phải được
 * biết ngay lúc lưu, không phải phát hiện sau đó trên trang công khai.
 */
type SaveResult = { id: string; stampCleared: boolean };

export async function createGlossaryTerm(
  raw: GlossaryTermInput,
): Promise<ActionResult<SaveResult>> {
  try {
    await requireRole("EDITOR");

    const parsed = parse(raw);
    if (!parsed.ok) return parsed.failure;

    const conflict = await findKeyConflict([parsed.slug, ...parsed.aliases], null);
    if (conflict) {
      return { ok: false, error: "KEY_TAKEN", fieldErrors: { aliases: [conflict] } };
    }

    const term = await prisma.glossaryTerm.create({
      data: { slug: parsed.slug, ...parsed.data },
      select: { id: true },
    });

    revalidateTerm(parsed.slug);
    return { ok: true, data: { ...term, stampCleared: false } };
  } catch (error) {
    return toFailure(error);
  }
}

export async function updateGlossaryTerm(
  id: string,
  raw: GlossaryTermInput,
): Promise<ActionResult<SaveResult>> {
  try {
    await requireRole("EDITOR");

    const parsed = parse(raw);
    if (!parsed.ok) return parsed.failure;

    const conflict = await findKeyConflict([parsed.slug, ...parsed.aliases], id);
    if (conflict) {
      return { ok: false, error: "KEY_TAKEN", fieldErrors: { aliases: [conflict] } };
    }

    const previous = await prisma.glossaryTerm.findUnique({
      where: { id },
      select: {
        slug: true,
        reviewedById: true,
        term: true,
        termEn: true,
        shortDef: true,
        shortDefEn: true,
        fullDef: true,
        fullDefEn: true,
      },
    });

    /**
     * Sửa nội dung thì GỠ dấu duyệt.
     *
     * Hai cột `reviewedById`/`reviewedAt` hiện thành byline "đã được biên tập
     * viên duyệt". Form này không ghi được chúng, nên nếu không gỡ ở đây thì
     * sửa một định nghĩa đã đóng dấu sẽ để lại con dấu nguyên vẹn trên một
     * đoạn văn người duyệt chưa từng đọc — đúng loại lỗi mà gate accuracy tồn
     * tại để chặn, và là loại khó thấy nhất vì trang vẫn hiện bình thường.
     *
     * Gỡ chứ không chặn sửa: biên tập viên vẫn phải sửa được lỗi ngay. Cái mất
     * đi chỉ là lời bảo chứng, và nó được lấy lại qua lượt duyệt sau
     * (`glossary:seed` đóng lại dấu khi file mang `reviewedBy`/`reviewedAt`).
     */
    const stampCleared =
      previous !== null &&
      previous.reviewedById !== null &&
      claimsDiffer(previous, {
        term: parsed.data.term,
        termEn: parsed.data.termEn ?? null,
        shortDef: parsed.data.shortDef,
        shortDefEn: parsed.data.shortDefEn ?? null,
        fullDef: parsed.data.fullDef ?? null,
        fullDefEn: parsed.data.fullDefEn ?? null,
      });

    const term = await prisma.glossaryTerm.update({
      where: { id },
      data: {
        slug: parsed.slug,
        ...parsed.data,
        // `disconnect` chứ không phải `reviewedById: null`: `parsed.data` dùng
        // API "checked" của Prisma (quan hệ, không phải khoá trần), trộn hai
        // kiểu vào một `data` thì Prisma không phân giải được overload.
        ...(stampCleared ? { reviewedBy: { disconnect: true }, reviewedAt: null } : {}),
      },
      select: { id: true },
    });

    revalidateTerm(parsed.slug);
    // Đổi slug thì trang cũ phải được dựng lại để trả 404 thay vì phục vụ bản
    // đã cache của một mục từ nay mang địa chỉ khác.
    if (previous && previous.slug !== parsed.slug) revalidateTerm(previous.slug);

    return { ok: true, data: { ...term, stampCleared } };
  } catch (error) {
    return toFailure(error);
  }
}

export async function deleteGlossaryTerm(id: string): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const term = await prisma.glossaryTerm.delete({
      where: { id },
      select: { slug: true },
    });
    revalidateTerm(term.slug);
    return { ok: true, data: undefined };
  } catch (error) {
    return toFailure(error);
  }
}
