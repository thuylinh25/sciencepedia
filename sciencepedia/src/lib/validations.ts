import { z } from "zod";

import { isAllowedImageUrl } from "./utils";

export const localeSchema = z.enum(["vi", "en"]);

/**
 * URL ảnh: để trống, hoặc phải nằm ở host đã khai báo trong next.config.ts.
 * Chặn ở đây để biên tập viên nhận thông báo rõ ràng ngay lúc lưu, thay vì
 * trang bài viết vỡ khi next/image từ chối một hostname lạ.
 */
const imageUrl = z
  .string()
  .refine(isAllowedImageUrl, "Ảnh phải tải lên Supabase Storage, hoặc dùng URL https từ Unsplash / NASA / Wikimedia")
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
  content: z.string().min(50, "Nội dung tối thiểu 50 ký tự"),
  contentEn: z.string().optional().or(z.literal("")),
  coverImage: imageUrl,
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
export type ChatInput = z.infer<typeof chatSchema>;

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
