import {
  Activity,
  BicepsFlexed,
  Bone,
  Brain,
  Cable,
  Droplets,
  Eye,
  FlaskConical,
  GitBranch,
  HeartPulse,
  Mars,
  PersonStanding,
  ShieldPlus,
  Utensils,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";

import { SYSTEM_COLORS, SYSTEM_IDS, type SystemId } from "./anatomy";
import counts from "./system-counts.generated.json";

/**
 * Bảng đăng ký hệ — MỘT nguồn cho trang giới thiệu, bảng hệ trong viewer và
 * deep link `?system=`. Tên hệ đi qua next-intl (`humanAtlas.systemNames`),
 * màu là `SYSTEM_COLORS` (chính màu vật liệu 3D), mô tả là
 * `SYSTEM_DESCRIPTIONS` (đã duyệt). Đừng lập bảng thứ hai ở component nào.
 *
 * `SYSTEM_IDS` (anatomy.ts) KHÔNG đổi thứ tự: shader dùng chỉ số của nó để
 * chọn hướng toả khi tách lớp. Thứ tự HIỂN THỊ nằm ở đây.
 */
export const SYSTEM_ORDER: SystemId[] = [
  "integumentary",
  "skeletal",
  "muscular",
  "connective",
  "cardiac",
  "arterial",
  "venous",
  "nervous",
  "sensory",
  "respiratory",
  "digestive",
  "urinary",
  "lymphatic",
  "endocrine",
  "reproductive",
];

/**
 * Nhóm cha. Bảng hệ gộp ba hệ này thành MỘT hàng "Hệ tim mạch" (2026-10-01): bật nó là
 * tim cùng cả cây mạch như Human Anatomy Atlas; hàng con mở ra để bật/tắt riêng.
 */
export const SYSTEM_GROUP: Partial<Record<SystemId, "cardiovascular">> = {
  cardiac: "cardiovascular",
  arterial: "cardiovascular",
  venous: "cardiovascular",
};

export const SYSTEM_ICON: Record<SystemId, LucideIcon> = {
  integumentary: PersonStanding,
  skeletal: Bone,
  muscular: BicepsFlexed,
  connective: Cable,
  cardiac: HeartPulse,
  arterial: GitBranch,
  venous: Waves,
  nervous: Brain,
  sensory: Eye,
  respiratory: Wind,
  digestive: Utensils,
  urinary: Droplets,
  lymphatic: ShieldPlus,
  endocrine: FlaskConical,
  // Mô hình là cơ thể nam (BodyParts3D) — ký hiệu đúng với thứ có trong mô hình.
  reproductive: Mars,
};

/** Dự phòng khi có hệ mới mà chưa kịp chọn icon. */
export const FALLBACK_ICON: LucideIcon = Activity;

/**
 * Số mảnh mỗi hệ, SAU `correctSystems()` — sinh bởi `scripts/anatomy-groups.ts`
 * từ đúng `atlas.json` đang phát. Viewer đếm lại lúc chạy trên cùng dữ liệu đã
 * sửa, nên hai con số trùng nhau; đổi phân loại thì chạy lại script (không
 * chạy là trang giới thiệu lệch viewer).
 */
export const SYSTEM_COUNTS = counts as Record<SystemId, number>;

export const systemColor = (id: SystemId) => SYSTEM_COLORS[id];

export function isSystemId(value: string | null | undefined): value is SystemId {
  return !!value && (SYSTEM_IDS as readonly string[]).includes(value);
}

/** Đường dẫn mở viewer với đúng một hệ — dùng chung cho thẻ và mọi link từ bài viết. */
export function systemHref(locale: string, id: SystemId): string {
  return `/${locale}/human-atlas?system=${id}#atlas-viewer`;
}

/**
 * Bấm lại thẻ của hệ ĐANG có trong URL: link không đổi URL, nên `useSearchParams`
 * không báo gì và viewer không áp lại hệ (người đọc đã tự bật thêm hệ khác).
 * Thẻ phát sự kiện này, viewer nghe và áp lại như lúc URL đổi.
 */
export const SYSTEM_REAPPLY_EVENT = "human-atlas:system";
