import {
  Atom,
  Bone,
  Brain,
  Bug,
  CloudSun,
  Cog,
  Dna,
  Droplets,
  Flame,
  FlaskConical,
  GitBranch,
  Globe2,
  HeartPulse,
  Leaf,
  Microscope,
  Mountain,
  Move,
  Orbit,
  Rocket,
  Salad,
  ScrollText,
  Sparkles,
  Stethoscope,
  Telescope,
  ThermometerSun,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Danh sách icon được phép cho danh mục.
 * Dùng map tường minh thay vì import động để tree-shaking hoạt động —
 * import cả bộ lucide sẽ thêm hàng trăm KB vào bundle.
 *
 * **Map này phải phủ mọi `icon` đang nằm trong CSDL.** Tên thiếu rơi về
 * `Sparkles` **im lặng** — không lỗi build, không lỗi runtime, chỉ là một thẻ
 * hiển thị sai mà không ai nhìn ra. Đã xảy ra: `Move`, `Flame`, `CloudSun`,
 * `GitBranch`, `ThermometerSun` do `taxonomy:tier2` (2026-09-05) ghi vào CSDL
 * mà không ai thêm vào đây, năm danh mục con render nhầm icon tới 2026-09-10.
 * Thêm danh mục có icon mới thì sửa file này trong cùng một thay đổi.
 */
const ICONS: Record<string, LucideIcon> = {
  Atom,
  Bone,
  Brain,
  Bug,
  CloudSun,
  Cog,
  Dna,
  Droplets,
  Flame,
  FlaskConical,
  GitBranch,
  Globe2,
  HeartPulse,
  Leaf,
  Microscope,
  Mountain,
  Move,
  Orbit,
  Rocket,
  Salad,
  ScrollText,
  Sparkles,
  Stethoscope,
  Telescope,
  ThermometerSun,
  Waves,
  Zap,
};

export const ICON_NAMES = Object.keys(ICONS);

export function CategoryIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = (name && ICONS[name]) || Sparkles;
  return <Icon className={className} aria-hidden />;
}
