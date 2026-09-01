"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { List } from "lucide-react";

import { cn } from "@/lib/utils";

export type Heading = { id: string; text: string; level: 2 | 3 };

/** Mục lục dính bên phải, tự làm nổi mục đang đọc. */
export function TableOfContents({ headings }: { headings: Heading[] }) {
  const t = useTranslations("article");
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

  if (headings.length < 2) return null;

  return (
    <nav aria-label={t("tableOfContents")} className="text-sm">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        <List className="size-3.5" />
        {t("tableOfContents")}
      </p>
      <ul className="space-y-0.5 border-l">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "-ml-px block border-l-2 py-1.5 leading-snug transition-colors",
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
    </nav>
  );
}
