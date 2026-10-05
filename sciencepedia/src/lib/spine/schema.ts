import { z } from "zod";

import { isVertebraCode } from "./vertebrae";

/**
 * Hai tệp cho mỗi chủ đề trong `content/tac-dong-cot-song/topics/`:
 *
 *  - `<slug>.editorial.json` — NGƯỜI viết: tiêu đề, phần kiến thức chung có nguồn,
 *    khung cảnh báo, các đoạn trích đã chọn. Schema: `Editorial`.
 *  - `<slug>.json` — MÁY sinh (`npm run spine:build`) từ bộ trích + quyết định
 *    D-n + tệp biên tập. Schema: `Topic`. Không sửa tay — sửa nguồn rồi build lại.
 *
 * Tách ra vì quan hệ đốt sống phải luôn suy ra được từ bản chép trang: nếu topic
 * là tệp sửa tay, mapping trong đó lặng lẽ trôi khỏi tài liệu gốc mà không ai biết.
 *
 * ## Hai giọng, không trộn
 *
 * Mọi thứ mang `ref` / `pdfPage` là lời của tài liệu Phương pháp Tác động Cột sống
 * Việt Nam — trích nguyên văn (máy kiểm từng đoạn), hiện dưới nhãn "Theo tài liệu…".
 * `general` và `safety` là lời Sciencepedia, mỗi khối trỏ vào nguồn bậc 1–2 trong
 * `sources`; gate `check-publish.ts` tính trên các nguồn ấy. Tài liệu KHÔNG tính
 * vào gate — chủ sản phẩm chốt 2026-10-05, phương án (a).
 *
 * ## Vì sao đích không gắn cứng với đốt sống
 *
 * `targetType` để ngỏ cho huyệt hay cấu trúc giải phẫu khác về sau: thêm một loại
 * đích là thêm một registry, không đổi schema hay giao diện.
 */

const Bilingual = z.object({ vi: z.string().min(1), en: z.string().min(1) });

export const SourceRef = z.object({
  pdfPage: z.number().int().min(1).max(43),
  bookPage: z.number().int().min(1),
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
    /** Câu nguồn chứa mã, khi mã đến từ văn xuôi. */
    context: z.string().optional(),
    confidence: Confidence,
    note: z.string().optional(),
    /** Quyết định của người đã chạm vào mapping này (D-n). */
    decision: z.string().optional(),
    ref: SourceRef,
  })
  .refine((m) => m.targetType !== "vertebra" || isVertebraCode(m.targetId), {
    message: "targetId không phải mã đốt sống hợp lệ",
  })
  .refine((m) => m.targetType !== "region" || m.confidence === "region-only", {
    message: "đích là vùng thì confidence phải là region-only",
  });

export const Quote = z.object({
  pdfPage: z.number().int().min(1).max(43),
  /** Nguyên văn tiếng Việt — `spine:build` từ chối nếu không khớp bản chép trang. */
  vi: z.string().min(1),
  en: z.string().min(1),
});

const ReviewState = z.enum(["pending", "passed", "changes-requested"]);

const SourceEntry = z.object({
  id: z.string().regex(/^s\d+$/),
  title: z.string(),
  publisher: z.string(),
  url: z.url(),
  tier: z.union([z.literal(1), z.literal(2)]),
  accessed: z.iso.date(),
});

const GeneralBlock = z.object({
  heading: Bilingual,
  body: Bilingual,
  /** Mọi khối kiến thức chung phải trỏ được vào nguồn. */
  sources: z.array(z.string().regex(/^s\d+$/)).min(1),
});

export const Editorial = z
  .object({
    section: z.string(),
    slug: z.string().regex(/^[a-z0-9-]+-theo-tac-dong-cot-song$/),
    title: Bilingual,
    summary: Bilingual,
    seoDescription: Bilingual,
    keywords: z.string(),
    riskLevel: z.enum(["normal", "high"]),
    sources: z.array(SourceEntry).min(3),
    general: z.array(GeneralBlock).min(1),
    safety: GeneralBlock,
    symptoms: z.array(Quote),
    /** Đoạn tài liệu nói về cách phương pháp tiếp cận bệnh, đặt đầu mục "Nội dung theo phương pháp". */
    methodQuotes: z.array(Quote).default([]),
    variants: z.array(
      z.object({
        /** Id thể bệnh trong extract.generated.json. */
        id: z.string(),
        label: Bilingual,
        quotes: z.array(Quote),
      }),
    ),
    outOfScope: z.array(Quote),
    review: z.object({ transcription: ReviewState, mapping: ReviewState, editor: ReviewState }),
  })
  .superRefine((e, ctx) => {
    const ids = new Set(e.sources.map((s) => s.id));
    for (const block of [...e.general, e.safety]) {
      for (const id of block.sources) {
        if (!ids.has(id)) ctx.addIssue({ code: "custom", message: `khối "${block.heading.vi}" trỏ nguồn ${id} không có` });
      }
    }
  });

export const Topic = z.object({
  slug: z.string(),
  collection: z.literal("tac-dong-cot-song"),
  section: z.string(),
  title: Bilingual,
  riskLevel: z.enum(["normal", "high"]),
  source: z.object({
    docId: z.literal("pp-tdcs-vn"),
    part: z.string(),
    heading: z.string(),
    pdfPages: z.tuple([z.number().int(), z.number().int()]),
  }),
  variants: z.array(
    z.object({
      id: z.string(),
      label: Bilingual,
      heading: z.string(),
      ref: SourceRef,
      mappings: z.array(Mapping),
    }),
  ),
  /** Mã mà máy thấy nhưng không ai gán vai — KHÔNG vào chỉ mục, giữ để truy vết. */
  unassigned: z.array(z.object({ line: z.string(), codes: z.array(z.string()), ref: SourceRef })),
  review: z.object({ transcription: ReviewState, mapping: ReviewState, editor: ReviewState }),
});

export type Editorial = z.infer<typeof Editorial>;
export type Topic = z.infer<typeof Topic>;
export type Mapping = z.infer<typeof Mapping>;
export type Quote = z.infer<typeof Quote>;
