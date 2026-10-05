import index from "./index.generated.json";
import type { Mapping } from "./schema";

/**
 * Chỉ mục đốt sống ↔ bài "Tác động cột sống", SINH bởi `npm run spine:build`
 * từ `content/tac-dong-cot-song/topics/*.json` — không sửa tay. Khoá là mã FMA
 * của khái niệm atlas (S1–S5 chung một khoá xương cùng), nên trang
 * `/human-atlas` gộp nó với `STRUCTURE_ARTICLES` mà không biết gì về đốt sống.
 *
 * Chỉ mang slug + vai; tiêu đề lấy từ CSDL lúc render, và chỉ bài PUBLISHED mới
 * hiện — bài nháp có trong chỉ mục cũng không bao giờ dẫn vào 404.
 */
export type SpineRole = Mapping["role"];
export type SpineLink = { slug: string; roles: SpineRole[]; codes: string[] };

export const SPINE_LINKS: Record<string, SpineLink[]> = index.byFma as Record<string, SpineLink[]>;

export const SPINE_SLUGS: string[] = [
  ...new Set(Object.values(SPINE_LINKS).flat().map((l) => l.slug)),
];
