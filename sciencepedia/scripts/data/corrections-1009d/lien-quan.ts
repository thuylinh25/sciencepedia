import type { Plan } from "../../lib/corrections";

/**
 * Sửa đi kèm đính chính bài "Cái chết dưới góc nhìn tiến hóa" (cai-chet.ts):
 *   - link text ở 4 bài đang trỏ vào nó theo tiêu đề mới (chủ sản phẩm duyệt đổi tiêu đề 09/10);
 *   - bài bất tử theo thuật ngữ chốt cho cả kho ("tích lũy đột biến", "đa hiệu đối kháng"),
 *     và trỏ ngược về bài "Cái chết…" (phiếu 2026-10-09, mục E).
 * Không đổi claim nên không gỡ byline duyệt.
 */
const CAI_CHET = "cai-chet-duoi-goc-nhin-tien-hoa-vi-sao-tu-nhien-khong-thiet-ke-chung-ta-de-song-mai";
const OLD_VI = `- [Cái chết dưới góc nhìn tiến hóa: Vì sao tự nhiên không thiết kế chúng ta để sống mãi?](/articles/${CAI_CHET})`;
const NEW_VI = `- [Cái chết dưới góc nhìn tiến hóa: vì sao chúng ta không sống mãi?](/articles/${CAI_CHET})`;
const OLD_EN = `- [Death through the lens of evolution: why didn't nature design us to live forever?](/articles/${CAI_CHET})`;
const NEW_EN = `- [Death through the lens of evolution: why don't we live forever?](/articles/${CAI_CHET})`;

const WHY = "Tiêu đề bài đích đổi (phiếu 2026-10-09 B1, chủ sản phẩm duyệt): bỏ văn mục đích luận 'tự nhiên không thiết kế'.";

function linkText(slug: string, en: boolean): Plan {
  return {
    slug,
    note: `Trước sửa 09/10: link text tới ${CAI_CHET} theo tiêu đề mới`,
    fixes: [
      { field: "content", find: OLD_VI, replace: NEW_VI, why: WHY },
      ...(en ? [{ field: "contentEn" as const, find: OLD_EN, replace: NEW_EN, why: WHY }] : []),
    ],
    reading: [],
    sources: [],
    minor: true,
  };
}

export const LINK_TEXT: Plan[] = [
  linkText("su-song-tren-trai-dat-4-ti-nam-trong-mot-dong-thoi-gian", true),
  linkText("khi-tim-ngung-dap-dieu-gi-thuc-su-xay-ra-voi-co-the-khi-chung-ta-chet", true),
  linkText("y-thuc-mon-qua-vi-dai-hay-cai-gia-dat-cua-su-tien-hoa", true),
  linkText("khi-te-bao-goc-quen-minh-la-ai-khung-hoang-danh-tinh-o-cap-do-phan-tu", false),
];

export const BAT_TU_THUAT_NGU: Plan = {
  slug: "cai-gia-cua-su-bat-tu-lieu-song-mai-co-thuc-su-la-loi-the",
  note: "Trước sửa 09/10: thống nhất thuật ngữ 'tích lũy đột biến' cho cả kho; thêm link về bài Cái chết dưới góc nhìn tiến hóa",
  forbid: ["Tích luỹ đột biến", "tích luỹ đột biến"],
  fixes: [
    {
      field: "content",
      find: "**Tích luỹ đột biến:**",
      replace: "**Tích lũy đột biến:**",
      why: "Chủ sản phẩm chốt 09/10 một cách gọi cho cả kho: 'tích lũy đột biến', 'đa hiệu đối kháng' (chính tả theo đa số kho).",
    },
    {
      field: "content",
      find: "- [Ý thức: Món quà vĩ đại hay cái giá đắt của sự tiến hóa?](/articles/y-thuc-mon-qua-vi-dai-hay-cai-gia-dat-cua-su-tien-hoa)",
      replace:
        "- [Ý thức: Món quà vĩ đại hay cái giá đắt của sự tiến hóa?](/articles/y-thuc-mon-qua-vi-dai-hay-cai-gia-dat-cua-su-tien-hoa)\n" +
        `- [Cái chết dưới góc nhìn tiến hóa: vì sao chúng ta không sống mãi?](/articles/${CAI_CHET})`,
      why: "Phiếu 2026-10-09 (cai-chet), mục E: hai bài cùng chủ đề trỏ qua lại — bài kia đã đính chính cho khớp bài này.",
    },
  ],
  reading: [],
  sources: [],
  minor: true,
};
