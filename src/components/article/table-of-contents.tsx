"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, List } from "lucide-react";

import { cn } from "@/lib/utils";

export type Heading = { id: string; text: string; level: 2 | 3 };

/** Danh sách link mục lục — dùng chung cho bản cột phải và bản gấp trên di động. */
function HeadingList({
  headings,
  activeId,
  onNavigate,
}: {
  headings: Heading[];
  activeId: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-0.5 border-l">
      {headings.map((heading) => (
        <li key={heading.id}>
          <a
            href={`#${heading.id}`}
            onClick={onNavigate}
            aria-current={activeId === heading.id ? "location" : undefined}
            className={cn(
              "-ml-px block border-l-2 py-2 leading-snug transition-colors",
              heading.level === 3 ? "pl-7 text-[13px]" : "pl-4",
              activeId === heading.id
                ? "border-accent font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Theo dõi mục đang đọc bằng IntersectionObserver. */
function useActiveHeading(headings: Heading[]): string {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? "");

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // Vùng quan sát nằm ở 1/3 trên màn hình, dưới header dính
      { rootMargin: "-96px 0px -66% 0px", threshold: [0, 1] },
    );

    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}

/** Mục lục dính bên phải, tự làm nổi mục đang đọc. Chỉ hiện từ lg trở lên. */
export function TableOfContents({ headings }: { headings: Heading[] }) {
  const t = useTranslations("article");
  const activeId = useActiveHeading(headings);

  if (headings.length < 2) return null;

  return (
    <nav aria-label={t("tableOfContents")} className="text-sm">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        <List className="size-3.5" />
        {t("tableOfContents")}
      </p>
      <HeadingList headings={headings} activeId={activeId} />
    </nav>
  );
}

/**
 * Mục lục cho di động.
 *
 * Bản cột phải là `hidden lg:block`, nên trên 390px — bố cục chính của dự án —
 * một bài bách khoa dài trước đây không có bất kỳ cách nào để nhảy tới một mục:
 * chỉ còn nước cuộn. Bản này dựng bằng <details>, nên nó nằm sẵn trong HTML đầu
 * tiên, mở/đóng được không cần JS, và không đẩy nội dung xuống khi đóng.
 */
export function MobileTableOfContents({ headings }: { headings: Heading[] }) {
  const t = useTranslations("article");
  const activeId = useActiveHeading(headings);

  if (headings.length < 2) return null;

  return (
    <details className="group mb-10 rounded-xl border bg-muted/30 lg:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <List className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        {t("tableOfContents")}
        <ChevronDown
          className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="px-4 pb-3">
        <HeadingList headings={headings} activeId={activeId} />
      </div>
    </details>
  );
}
