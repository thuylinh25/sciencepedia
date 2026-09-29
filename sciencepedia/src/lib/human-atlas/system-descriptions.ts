import { z } from "zod";

import type { SystemId } from "./anatomy";
import generated from "./system-descriptions.generated.json";

/**
 * Mô tả 15 hệ — bản đã kiểm và đã duyệt.
 *
 * NGUỒN THẬT là `data/anatomy/systems-l2.json` (có câu trích làm bằng chứng);
 * tệp `.generated.json` bên cạnh do `scripts/anatomy-enrich.ts --write` ghi ra,
 * chỉ gồm mục đã qua bộ kiểm VÀ science-editor. Đừng sửa tay tệp sinh ra.
 *
 * Nằm trong bundle chứ không tải từ R2 như dữ liệu cấu trúc: 15 đoạn ngắn,
 * cần có trong HTML đầu tiên của trang giới thiệu (Server Component), và bảng
 * chi tiết dùng lại chúng làm "Tổng quan · hệ".
 *
 * Trước 2026-09-29 các đoạn này nằm trong `messages/*.json`, chép từ bản gốc
 * Human Atlas rồi dịch — không nguồn, và vài đoạn sai với chính mô hình (tả
 * mạch và hạch bạch huyết trong khi mô hình chỉ có tuyến ức và lách).
 */
const entrySchema = z.object({
  summary: z.object({ vi: z.string(), en: z.string() }),
  /** Một câu cho thẻ hệ ở trang giới thiệu (15–25 từ). */
  short: z.object({ vi: z.string(), en: z.string() }).optional(),
  sources: z.array(z.object({ section: z.string(), url: z.string().url() })).min(1),
  review: z.object({ by: z.literal("science-editor"), at: z.string() }),
});

export type SystemDescription = z.infer<typeof entrySchema>;
export type SystemDescriptions = Partial<Record<SystemId, SystemDescription>>;

export const SYSTEM_DESCRIPTIONS: SystemDescriptions = z
  .record(z.string(), entrySchema)
  .parse(generated) as SystemDescriptions;

/** "19-1-heart-anatomy" → "19.1": số mục như người đọc thấy trong sách. */
export function sectionNumber(slug: string): string {
  const match = /^(\d+)-(\d+)-/.exec(slug);
  return match ? `${match[1]}.${match[2]}` : slug;
}
