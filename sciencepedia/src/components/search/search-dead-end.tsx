import { SearchX } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";

/**
 * Trạng thái "không có gì để hiện" của trang tìm kiếm.
 *
 * Trước đây chỗ này chỉ có một icon và hai dòng chữ — người đọc không tìm thấy
 * bài thì hết đường, phải tự bấm nút back. Một bách khoa toàn thư mất người đọc
 * ngay tại ô tìm kiếm là mất luôn: họ sang Google chứ không duyệt tiếp.
 *
 * Nên khối này luôn đưa ra ít nhất hai lối đi tiếp: duyệt theo lĩnh vực, hoặc
 * xem toàn bộ bài viết.
 *
 * Xem .claude/agents/product-designer.md — "search must never dead-end".
 */
export function SearchDeadEnd({
  title,
  hint,
  browseLabel,
  allLabel,
  categories,
  locale,
}: {
  title: string;
  hint: string;
  browseLabel: string;
  allLabel: string;
  categories: { slug: string; name: string; nameEn: string }[];
  locale: Locale;
}) {
  // Nhiều quá thì thành một bức tường chữ, không còn là gợi ý nữa
  const suggestions = categories.slice(0, 8);

  return (
    <EmptyState icon={SearchX} title={title} description={hint} bordered={false}>
      {suggestions.length > 0 && (
        <nav className="mt-2 max-w-lg" aria-label={browseLabel}>
          <p className="text-sm text-muted-foreground">{browseLabel}</p>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {suggestions.map((category) => (
              <li key={category.slug}>
                <Link href={`/categories/${category.slug}`}>
                  <Badge
                    variant="outline"
                    // py-2 để vùng chạm đạt ~44px trên di động
                    className="px-4 py-2 transition-colors hover:border-accent hover:bg-accent/10"
                  >
                    {locale === "en" ? category.nameEn : category.name}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <Link
        href="/articles"
        className="mt-2 text-sm font-medium text-primary-strong underline-offset-4 hover:underline"
      >
        {allLabel}
      </Link>
    </EmptyState>
  );
}
