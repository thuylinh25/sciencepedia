import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Plan } from "../../lib/corrections";
import { extractD } from "../../lib/sheet";

/**
 * Phiếu: docs/content/checks/2026-10-26/long-dung-cam-va-su-to-mo-dieu-gi-dua-loai-nguoi-den-cac-vi-sao.md
 * Bù mục E của phiếu 23/10 ("chưa có bản EN"): điền titleEn/summaryEn/contentEn dịch từ bản VI sau
 * đính chính. Bản VI không đổi chữ nào → minor (không đổi lastVerifiedAt), byline giữ.
 */

const SLUG = "long-dung-cam-va-su-to-mo-dieu-gi-dua-loai-nguoi-den-cac-vi-sao";
const D = extractD(
  readFileSync(join(__dirname, "../../../../docs/content/checks/2026-10-26", `${SLUG}.md`), "utf8"),
);

export const LONG_DUNG_CAM_EN: Plan = {
  slug: SLUG,
  note: "Trước khi thêm bản EN 26/10: titleEn/summaryEn/contentEn null (phiếu 2026-10-26, skill translation)",
  minor: true,
  fixes: [
    { field: "titleEn", fill: D.D1, why: "Bản EN — tiêu đề" },
    { field: "summaryEn", fill: D.D2, why: "Bản EN — tóm tắt" },
    { field: "contentEn", fill: D.D3, why: "Bản EN — toàn bài, dịch từ bản VI sau đính chính 23/10" },
  ],
  reading: [],
  sources: [],
};
