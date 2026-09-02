import {
  Atom,
  Bone,
  Brain,
  Bug,
  Dna,
  Droplets,
  FlaskConical,
  Globe2,
  HeartPulse,
  Leaf,
  Microscope,
  Mountain,
  Orbit,
  Rocket,
  Salad,
  ScrollText,
  Sparkles,
  Stethoscope,
  Telescope,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Danh sách icon được phép cho danh mục.
 * Dùng map tường minh thay vì import động để tree-shaking hoạt động —
 * import cả bộ lucide sẽ thêm hàng trăm KB vào bundle.
 */
const ICONS: Record<string, LucideIcon> = {
  Atom,
  Bone,
  Brain,
  Bug,
  Dna,
  Droplets,
  FlaskConical,
  Globe2,
  HeartPulse,
  Leaf,
  Microscope,
  Mountain,
  Orbit,
  Rocket,
  Salad,
  ScrollText,
  Sparkles,
  Stethoscope,
  Telescope,
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
