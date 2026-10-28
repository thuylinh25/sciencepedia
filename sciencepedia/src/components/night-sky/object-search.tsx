"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";

import {
  searchCatalog,
  type CatalogEntry,
} from "@/lib/night-sky/catalog";
import { Input } from "@/components/ui/input";

/**
 * Ô tìm thiên thể trên đầu cột panel. Tìm trên danh mục tĩnh của trang
 * (`catalog.ts`) — khớp không dấu ở cả tên Việt lẫn tên Anh/La-tinh — và
 * không gọi mạng: danh mục nằm sẵn trong bundle vì nó cũng là dữ liệu của
 * panel thông tin.
 */
export function ObjectSearch({
  onSelect,
}: {
  onSelect: (entry: CatalogEntry) => void;
}) {
  const t = useTranslations("nightSky");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const results = open ? searchCatalog(query) : [];

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const pick = (entry: CatalogEntry) => {
    onSelect(entry);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={query}
        aria-label={t("searchLabel")}
        placeholder={t("searchPlaceholder")}
        className="pl-9"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "Enter" && results.length > 0) pick(results[0]);
        }}
      />
      {open && query.trim().length >= 2 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-xl border bg-popover p-1 shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {t("noResults")}
            </li>
          ) : (
            results.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className="flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => pick(entry)}
                >
                  <span className="font-medium">
                    {locale === "en" ? entry.nameEn : entry.nameVi}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {locale === "en" ? entry.nameVi : entry.nameEn}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
