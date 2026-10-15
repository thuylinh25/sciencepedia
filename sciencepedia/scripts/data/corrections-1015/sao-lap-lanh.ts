import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Plan } from "../../lib/corrections";
import { extractD } from "../../lib/sheet";

/**
 * Phiếu: docs/content/checks/2026-10-15/bi-an-bau-troi-dem-tai-sao-ngoi-sao-lap-lanh-con-hanh-tinh-thi-khong.md
 * Bốn câu, sửa song song ở content và contentEn (bản EN vừa ghi đợt en-translate 2026-10-15).
 * Đổi claim (bỏ con số "mười lần" không nguồn, thu hẹp câu ống nhòm và chòm hoàng đạo) → clearReview:
 * byline ký 12/10 không được đứng trên bản chưa ai đọc. Bài GIỮ PUBLISHED. Số 480 km khớp NASA (483 km),
 * chỉ thêm mốc năm → hẹn thẩm định lại sau 12 tháng.
 */

const SLUG = "bi-an-bau-troi-dem-tai-sao-ngoi-sao-lap-lanh-con-hanh-tinh-thi-khong";
const D = extractD(readFileSync(join(__dirname, "../../../../docs/content/checks/2026-10-15", `${SLUG}.md`), "utf8"));

const VI_TEN_TIMES =
  'Điều thú vị là hiệu ứng này "nhìn" tinh hơn mắt. Các nhà thiên văn chỉ ra rằng chỉ riêng việc ngôi sao lấp lánh còn hành tinh thì không đã cho biết khác biệt về kích thước góc giữa chúng, ở mức chi tiết tốt hơn khoảng mười lần so với độ phân giải của mắt người.';
const EN_TEN_TIMES =
  'Interestingly, this effect "sees" more finely than the eye. Astronomers have pointed out that the mere fact that stars twinkle while planets do not reveals the difference in angular size between them, at a level of detail about ten times finer than the resolution of the human eye.';

export const SAO_LAP_LANH: Plan = {
  slug: SLUG,
  note: "Trước đính chính 15/10: phiếu 2026-10-15 (A1: 'tốt hơn khoảng mười lần' không nguồn → bỏ; B1: Hubble 480 km thêm mốc NASA 2026; B2: ống nhòm → hành tinh sáng; B3: chòm hoàng đạo → 'phần lớn'), cả content và contentEn",
  reverifyMonths: 12,
  clearReview: true,
  forbid: ["mười lần so với độ phân giải", "ten times finer", "Các nhà thiên văn chỉ ra rằng", "Astronomers have pointed out"],
  fixes: [
    {
      field: "content",
      find: "Bay quanh Trái Đất ở độ cao khoảng 480 km, kính **Hubble** tránh được những méo mó do khí quyển gây ra.",
      replace: D.D1,
      why: "B1 — thêm mốc thời gian cho số liệu quỹ đạo (NASA: 483 km)",
    },
    { field: "content", find: VI_TEN_TIMES, replace: D.D2, why: "A1 — bỏ con số không nguồn" },
    {
      field: "content",
      find: "Chỉ cần một chiếc ống nhòm là đã thấy hành tinh không nhỏ như các ngôi sao.",
      replace: D.D3,
      why: "B2 — thu hẹp về hành tinh sáng",
    },
    {
      field: "content",
      find: "Các chòm sao nằm dọc theo đường ấy chính là [các chòm sao hoàng đạo](/articles/cac-chom-sao-hoang-dao).",
      replace: D.D4,
      why: "B3 — hoàng đạo còn đi qua Xà Phu",
    },
    {
      field: "contentEn",
      find: "Orbiting Earth at an altitude of about 480 km, the **Hubble** telescope avoids the distortions caused by the atmosphere.",
      replace: D.D5,
      why: "B1 (EN)",
    },
    { field: "contentEn", find: EN_TEN_TIMES, replace: D.D6, why: "A1 (EN)" },
    {
      field: "contentEn",
      find: "A pair of binoculars is enough to see that a planet is not as small as the stars.",
      replace: D.D7,
      why: "B2 (EN)",
    },
    {
      field: "contentEn",
      find: "The constellations lying along that path are [the zodiac constellations](/articles/cac-chom-sao-hoang-dao).",
      replace: D.D8,
      why: "B3 (EN)",
    },
  ],
  reading: [],
  sources: [],
};
