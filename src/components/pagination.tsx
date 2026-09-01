import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Sinh dãy trang có dấu … khi số trang lớn. */
function pageRange(page: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "gap")[] = [];
  let previous = 0;
  for (const current of sorted) {
    if (previous && current - previous > 1) result.push("gap");
    result.push(current);
    previous = current;
  }
  return result;
}

export async function Pagination({
  page,
  totalPages,
  basePath,
  extraQuery,
  className,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  extraQuery?: Record<string, string | undefined>;
  className?: string;
}) {
  const t = await getTranslations("common");
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(extraQuery ?? {})) {
      if (value) query.set(key, value);
    }
    if (target > 1) query.set("page", String(target));
    const qs = query.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const linkClass =
    "grid size-10 place-items-center rounded-full border text-sm font-medium transition-colors hover:bg-muted";

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-2", className)}
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className={linkClass}
          aria-label={t("previous")}
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={cn(linkClass, "pointer-events-none opacity-40")}>
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pageRange(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span
            key={`gap-${index}`}
            className="px-1 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              linkClass,
              item === page &&
                "border-primary bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            {item}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={href(page + 1)} className={linkClass} aria-label={t("next")}>
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(linkClass, "pointer-events-none opacity-40")}>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
