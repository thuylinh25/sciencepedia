import { z } from "zod";

import { isVertebraCode } from "./vertebrae";

/**
 * Hình dạng của một chủ đề trong `content/tac-dong-cot-song/topics/*.json` —
 * nguồn sự thật của module "Tác động cột sống". Bài viết trong CSDL và chỉ mục
 * đốt sống ↔ bài đều SINH từ đây, không ai sửa tay hai thứ kia.
 *
 * ## Hai giọng, không trộn
 *
 * Mọi trường có `ref` là lời của tài liệu Phương pháp Tác động Cột sống Việt Nam
 * — trích nguyên văn, luôn kèm trang, luôn hiện dưới nhãn "Theo tài liệu…".
 * Kiến thức Sciencepedia tự viết (kể cả `safetyBox`) mang nguồn bậc 1–2, và gate
 * `check-publish.ts` tính trên phần ấy. Tài liệu KHÔNG tính vào gate — chủ sản
 * phẩm chốt 2026-10-05, phương án (a).
 *
 * ## Vì sao quan hệ đích không gắn cứng với đốt sống
 *
 * `targetType` để ngỏ cho huyệt, cấu trúc giải phẫu khác về sau: thêm một loại
 * đích là thêm một registry, không đổi schema hay giao diện.
 */

const Bilingual = z.object({ vi: z.string().min(1), en: z.string().optional() });

export const SourceRef = z.object({
  pdfPage: z.number().int().min(1).max(43),
  bookPage: z.number().int().min(1),
  quote: z.string().optional(),
});

export const Role = z.enum(["primary", "related", "caution", "avoid"]);
export const Side = z.enum(["left", "right"]);
export const Confidence = z.enum(["exact", "expanded", "region-only", "uncertain"]);

export const Mapping = z
  .object({
    targetType: z.enum(["vertebra", "region"]),
    targetId: z.string(),
    role: Role,
    side: Side.optional(),
    /** Nguyên văn trong tài liệu — để người duyệt đối chiếu, không bao giờ sửa. */
    raw: z.string(),
    confidence: Confidence,
    note: z.string().optional(),
    ref: SourceRef,
  })
  .refine((m) => m.targetType !== "vertebra" || isVertebraCode(m.targetId), {
    message: "targetId không phải mã đốt sống hợp lệ",
  })
  .refine((m) => m.targetType !== "region" || m.confidence === "region-only", {
    message: "đích là vùng thì confidence phải là region-only",
  });

export const Variant = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: Bilingual,
  ref: SourceRef,
  mappings: z.array(Mapping),
  /** Khái niệm riêng của phương pháp — tách khỏi đốt sống, không bao giờ trộn. */
  methodTerms: z
    .object({
      temperatureZones: z.array(z.object({ zone: z.string(), side: Side.optional() })),
      muscleTriangles: z.array(z.number().int().min(1).max(8)),
      muscleSegments: z.array(z.string()),
      layers: z.array(z.enum(["outer", "middle", "inner"])),
      functions: z.array(z.string()),
    })
    .partial()
    .optional(),
});

const SourceCitation = z.object({
  title: z.string(),
  publisher: z.string(),
  url: z.url(),
  tier: z.union([z.literal(1), z.literal(2)]),
});

const ReviewState = z.enum(["pending", "passed", "changes-requested"]);

export const Topic = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+-theo-tac-dong-cot-song$/),
    collection: z.literal("tac-dong-cot-song"),
    title: Bilingual,
    riskLevel: z.enum(["normal", "high"]),
    safetyBox: z.object({ body: Bilingual, sources: z.array(SourceCitation).min(1) }).optional(),
    source: z.object({
      docId: z.literal("pp-tdcs-vn"),
      part: z.string(),
      section: z.string(),
      pdfPages: z.tuple([z.number().int(), z.number().int()]),
    }),
    symptoms: z.array(z.object({ text: Bilingual, ref: SourceRef })),
    variants: z.array(Variant),
    outOfScope: z.array(z.object({ text: Bilingual, ref: SourceRef })),
    incomplete: z.string().optional(),
    review: z.object({ transcription: ReviewState, mapping: ReviewState }),
  })
  .refine((t) => t.riskLevel !== "high" || !!t.safetyBox, {
    message: "chủ đề rủi ro cao phải có safetyBox",
  })
  .refine((t) => t.source.pdfPages[0] <= t.source.pdfPages[1], { message: "pdfPages đảo ngược" });

export type Topic = z.infer<typeof Topic>;
export type Variant = z.infer<typeof Variant>;
export type Mapping = z.infer<typeof Mapping>;
