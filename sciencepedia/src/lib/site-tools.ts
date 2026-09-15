import {
  Aperture,
  Disc3,
  Orbit,
  Scaling,
  Sparkles,
  Telescope,
} from "lucide-react";

/**
 * Danh sách công cụ tương tác của site — một nguồn duy nhất.
 *
 * Trước đây mảng này nằm trong `site-footer.tsx` và dải số liệu kho đứng ngay
 * dưới nó, nên footer truyền thẳng `tools.length - 1` xuống. Từ khi dải số
 * liệu chuyển sang trang Hồ sơ, hai chỗ không còn đứng cạnh nhau nữa — và một
 * con số viết tay ở trang Hồ sơ sẽ lệch ngay lần thêm công cụ tiếp theo mà
 * không ai nhận ra, vì không có gì bắt hai nơi phải khớp.
 *
 * `navKey` là khoá dịch trong namespace `nav`; nhãn dựng ở nơi hiển thị chứ
 * không nằm ở đây, để module này không phải là client component.
 */
export const SITE_TOOLS = [
  { href: "/solar-system", navKey: "solarSystem", icon: Orbit },
  { href: "/milky-way", navKey: "milkyWay", icon: Disc3 },
  { href: "/universe", navKey: "universe", icon: Aperture },
  { href: "/space-map", navKey: "spaceMap", icon: Telescope },
  { href: "/zoom", navKey: "zoom", icon: Scaling },
  { href: "/assistant", navKey: "assistant", icon: Sparkles },
] as const;

/**
 * Số công cụ TƯƠNG TÁC, tức trừ trợ lý AI.
 *
 * Trợ lý là hộp thoại hỏi–đáp, không phải mô hình xoay được; gộp nó vào con số
 * "công cụ tương tác" là đếm hai loại khác nhau thành một.
 */
export const INTERACTIVE_TOOL_COUNT = SITE_TOOLS.length - 1;
