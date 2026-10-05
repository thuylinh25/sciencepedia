import { getTranslations } from "next-intl/server";
import { Info, TriangleAlert } from "lucide-react";

import type { CategoryNoticeKind } from "@/lib/category-notices";
import { cn } from "@/lib/utils";

/**
 * Khung lưu ý của một danh mục (xem `@/lib/category-notices`).
 *
 * Nền `--warning` chứ không `amber-*` thô: token đã có bản sáng/tối đạt
 * contrast (docs/design-system.md). Chữ dùng `text-foreground`, không dùng
 * màu warning — warning ở light theme là nâu đậm, làm chữ thì đọc được nhưng
 * cả đoạn trông như lỗi.
 */
export async function CategoryNotice({
  kind,
  className,
}: {
  kind: CategoryNoticeKind;
  className?: string;
}) {
  const t = await getTranslations("category.notice");
  const Icon = kind === "traditional" ? TriangleAlert : Info;

  return (
    <aside
      aria-label={t(`${kind}.title`)}
      className={cn(
        "flex gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm leading-relaxed sm:p-5",
        className,
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
      <div className="space-y-1.5">
        <p className="font-semibold">{t(`${kind}.title`)}</p>
        <p className="text-muted-foreground">{t(`${kind}.body`)}</p>
      </div>
    </aside>
  );
}
