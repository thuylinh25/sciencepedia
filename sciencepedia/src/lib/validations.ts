import { z } from "zod";

import { findDraftArtifacts } from "./draft-artifacts";
import { isAllowedImageUrl } from "./utils";

/** Chặn lúc lưu, cả bản nháp: không có trạng thái nào mà dấu này hợp lệ. */
function noDraftArtifacts(text: string, ctx: z.RefinementCtx) {
  const found = findDraftArtifacts(text);
  if (found.length > 0) {
    ctx.addIssue({
      code: "custom",
      message: `Còn sót dấu trích dẫn của công cụ soạn thảo: ${found.slice(0, 3).join(" ")} — xoá trước khi lưu`,
    });
  }
}

export const localeSchema = z.enum(["vi", "en"]);

/**
 * URL ảnh: để trống, hoặc phải nằm ở host đã khai báo trong next.config.ts.
 * Chặn ở đây để biên tập viên nhận thông báo rõ ràng ngay lúc lưu, thay vì
 * trang bài viết vỡ khi next/image từ chối một hostname lạ.
 */
const imageUrl = z
  .string()
  .refine(
    isAllowedImageUrl,
    "Ảnh phải nằm trên Cloudflare R2 hoặc Supabase Storage, hoặc dùng URL https từ Unsplash / NASA / Wikimedia (với Unsplash nên dán URL TRANG ảnh để lấy được tên tác giả)",
  )
  .optional()
  .or(z.literal(""));

export const slugSchema = z
  .string()
  .min(2, "Slug quá ngắn")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu -");

/**
 * Slug ở form được phép bỏ trống — server sẽ tự sinh từ tiêu đề.
 * Nếu để `slugSchema` bắt buộc, việc "để trống sẽ tự sinh" sẽ không bao giờ
 * chạy tới server vì react-hook-form chặn ngay ở bước validate.
 */
const optionalSlug = slugSchema.or(z.literal("")).optional();

export const articleSchema = z.object({
  slug: optionalSlug,
  title: z.string().min(3, "Tiêu đề tối thiểu 3 ký tự").max(200),
  titleEn: z.string().max(200).optional().or(z.literal("")),
  summary: z.string().min(20, "Tóm tắt tối thiểu 20 ký tự").max(500),
  summaryEn: z.string().max(500).optional().or(z.literal("")),
  content: z
    .string()
    .min(50, "Nội dung tối thiểu 50 ký tự")
    .superRefine(noDraftArtifacts),
  contentEn: z
    .string()
    .superRefine(noDraftArtifacts)
    .optional()
    .or(z.literal("")),
  coverImage: imageUrl,
  /* Ghi công ảnh bìa. Markdown, để nhét được liên kết tới trang gốc.

     Đây KHÔNG phải trường trang trí: ảnh dùng giấy phép đòi ghi công (CC BY,
     CC BY-SA) thì đây là điều kiện của giấy phép, và thiếu nó là vi phạm chứ
     không phải thiếu sót thẩm mỹ. Ảnh phạm vi công cộng không bắt buộc nhưng
     vẫn nên ghi — người đọc cần biết bức ảnh đến từ đâu.

     Không bắt buộc ở tầng schema vì phần lớn ảnh trong kho là NASA/ESA thuộc
     phạm vi công cộng. Điều kiện bắt buộc theo giấy phép nằm ở gate xuất bản
     (`scripts/check-publish.ts`), nơi biết được ảnh đến từ host nào. */
  coverImageCredit: z.string().max(500).optional().or(z.literal("")),
  coverImageCreditEn: z.string().max(500).optional().or(z.literal("")),
  categoryId: z.string().min(1, "Chọn danh mục"),
  // Không dùng .default() ở các schema gắn với form: nó khiến kiểu đầu vào và
  // đầu ra của Zod lệch nhau, và zodResolver sẽ báo lỗi kiểu với useForm.
  // Giá trị mặc định được đặt ở defaultValues của form.
  tagIds: z.array(z.string()),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]),
  featured: z.boolean(),
  seoTitle: z.string().max(70).optional().or(z.literal("")),
  seoDescription: z.string().max(300).optional().or(z.literal("")),
  seoKeywords: z.string().max(300).optional().or(z.literal("")),
});
export type ArticleInput = z.infer<typeof articleSchema>;

export const categorySchema = z.object({
  slug: optionalSlug,
  name: z.string().min(2).max(100),
  nameEn: z.string().min(2).max(100),
  description: z.string().max(1000).optional().or(z.literal("")),
  descriptionEn: z.string().max(1000).optional().or(z.literal("")),
  icon: z.string().max(50).optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Màu phải ở dạng #rrggbb"),
  coverImage: imageUrl,
  parentId: z.string().nullable().optional(),
  order: z.number().int().min(0),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const tagSchema = z.object({
  slug: optionalSlug,
  name: z.string().min(1).max(60),
  nameEn: z.string().min(1).max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Màu phải ở dạng #rrggbb"),
});
export type TagInput = z.infer<typeof tagSchema>;

/**
 * Mục từ điển thuật ngữ.
 *
 * `shortDef` giới hạn 320 ký tự vì nó hiện trong tooltip rộng 22rem: dài hơn
 * thì tooltip che mất đoạn văn người ta đang đọc, mà tooltip có thanh cuộn thì
 * còn tệ hơn. Định nghĩa dài thuộc về `fullDef`.
 *
 * `aliases` nhập bằng một dòng, cách nhau bởi dấu phẩy; server tự đưa về dạng
 * slug. Không bắt người nhập tự gõ slug — họ gõ "mô-men động lượng", máy lo
 * phần còn lại.
 */
export const glossaryTermSchema = z.object({
  slug: optionalSlug,
  term: z.string().min(1, "Chưa có tên thuật ngữ").max(120),
  termEn: z.string().max(120).optional().or(z.literal("")),
  shortDef: z
    .string()
    .min(20, "Định nghĩa ngắn tối thiểu 20 ký tự")
    .max(320, "Định nghĩa ngắn tối đa 320 ký tự — phần dài hơn để ở định nghĩa đầy đủ"),
  shortDefEn: z.string().max(320).optional().or(z.literal("")),
  fullDef: z.string().max(4000).optional().or(z.literal("")),
  fullDefEn: z.string().max(4000).optional().or(z.literal("")),
  aliases: z.string().max(300).optional().or(z.literal("")),
  category: z.string().max(60).optional().or(z.literal("")),
  image: imageUrl,
  imageCredit: z.string().max(300).optional().or(z.literal("")),
});
export type GlossaryTermInput = z.infer<typeof glossaryTermSchema>;

/**
 * Quản trị viên tạo tài khoản hộ người khác.
 *
 * Khác `registerSchema` ở hai chỗ, và cả hai đều có lý do:
 *
 * - KHÔNG có `confirmPassword`. Ô nhắc lại mật khẩu tồn tại để bắt lỗi gõ của
 *   người đang đặt mật khẩu CHO CHÍNH MÌNH — gõ sai thì họ tự khoá mình ra
 *   ngoài. Ở đây quản trị viên nhìn thấy mật khẩu mình vừa đặt và sẽ chuyển
 *   nó cho người dùng, nên ô nhắc lại chỉ là một bước thừa.
 * - CÓ `role`. Đó là toàn bộ lý do đường này tồn tại song song với trang đăng
 *   ký: đăng ký công khai luôn tạo USER, còn quản trị viên cần tạo thẳng một
 *   EDITOR mà không phải tạo rồi nâng quyền ở bước hai.
 *
 * Ràng buộc độ mạnh mật khẩu giữ NGUYÊN như trang đăng ký. Một tài khoản do
 * quản trị viên tạo không vì thế mà được phép yếu hơn — nó thường còn có
 * quyền cao hơn.
 */
export const adminUserSchema = z.object({
  name: z.string().min(2, "Tên tối thiểu 2 ký tự").max(80),
  email: z.string().email("Email không hợp lệ"),
  password: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .regex(/[a-z]/, "Cần ít nhất 1 chữ thường")
    .regex(/[A-Z]/, "Cần ít nhất 1 chữ hoa")
    .regex(/[0-9]/, "Cần ít nhất 1 chữ số"),
  role: z.enum(["USER", "EDITOR", "ADMIN"]),
});
export type AdminUserInput = z.infer<typeof adminUserSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "Tên tối thiểu 2 ký tự").max(80),
    email: z.string().email("Email không hợp lệ"),
    password: z
      .string()
      .min(8, "Mật khẩu tối thiểu 8 ký tự")
      .regex(/[a-z]/, "Cần ít nhất 1 chữ thường")
      .regex(/[A-Z]/, "Cần ít nhất 1 chữ hoa")
      .regex(/[0-9]/, "Cần ít nhất 1 chữ số"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Nhập mật khẩu"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(40),
  locale: localeSchema.default("vi"),
});

export const searchQuerySchema = z.object({
  q: z.string().max(200).default(""),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  sort: z.enum(["relevance", "newest", "popular"]).default("relevance"),
});

export const commentSchema = z.object({
  articleId: z.string().min(1),
  body: z.string().min(2, "Bình luận quá ngắn").max(2000),
  parentId: z.string().nullable().optional(),
});
