"use client";

import { useId, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Search } from "lucide-react";

import type { Locale } from "@/i18n/routing";
import type { SkyView } from "@/hooks/use-aladin";
import { useDebounce } from "@/hooks/use-debounce";
import { resolveObjectName } from "@/lib/sesame";
import { parseCoordinatePair, parseCoordinates } from "@/lib/sky-coords";
import {
  DEFAULT_FOV_DEG,
  findSkyTarget,
  searchSkyTargets,
  type SkyTarget,
} from "@/lib/sky-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SkySearchResult = {
  view: SkyView;
  /** Tên hiển thị của thứ vừa tìm được */
  label: string;
  /** Có giá trị khi khớp danh mục cứng; `null` khi giải qua Sesame hoặc toạ độ */
  target: SkyTarget | null;
};

/** Đổi một mục danh mục thành khung nhìn. Toạ độ hỏng thì trả `null`. */
export function targetToView(target: SkyTarget): SkyView | null {
  const coordinates = parseCoordinates(target.ra, target.dec);
  if (!coordinates) return null;
  return { ...coordinates, fovDeg: target.fovDeg, survey: target.survey };
}

/**
 * Ô tìm kiếm thiên thể.
 *
 * Ba đường giải, xếp theo thứ tự rẻ dần về phía sau:
 *   1. danh mục cứng — tức thì, biết cả tên tiếng Việt
 *   2. toạ độ gõ tay — không cần mạng
 *   3. Sesame của CDS — mọi thứ còn lại trong SIMBAD
 *
 * Component này KHÔNG cầm instance Aladin. Nó chỉ giải tên thành toạ độ rồi
 * đưa lên trên. Nhờ vậy nó dùng lại được ở chỗ chưa có bản đồ nào đang mở, và
 * luồng dữ liệu vẫn một chiều: cha giữ khung nhìn, con chỉ đề nghị đổi.
 */
export function AladinSearch({
  onSelect,
  className,
  autoFocus,
}: {
  onSelect: (result: SkySearchResult) => void;
  className?: string;
  autoFocus?: boolean;
}) {
  const t = useTranslations("sky");
  const locale = useLocale() as Locale;

  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(-1);
  const [resolving, setResolving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [open, setOpen] = useState(false);

  const listboxId = useId();
  const debounced = useDebounce(query, 150);

  const suggestions = useMemo(
    () => (debounced.trim() ? searchSkyTargets(debounced) : []),
    [debounced],
  );

  const nameOf = (target: SkyTarget) =>
    locale === "en" ? target.nameEn : target.name;

  function choose(target: SkyTarget) {
    const view = targetToView(target);
    if (!view) return;

    setQuery(nameOf(target));
    setOpen(false);
    setHighlight(-1);
    setNotFound(false);
    onSelect({ view, label: nameOf(target), target });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotFound(false);

    if (highlight >= 0 && suggestions[highlight]) {
      choose(suggestions[highlight]);
      return;
    }

    const raw = query.trim();
    if (!raw) return;

    const known = findSkyTarget(raw);
    if (known) {
      choose(known);
      return;
    }

    const coordinates = parseCoordinatePair(raw);
    if (coordinates) {
      setOpen(false);
      onSelect({
        view: { ...coordinates, fovDeg: DEFAULT_FOV_DEG },
        label: raw,
        target: null,
      });
      return;
    }

    setResolving(true);
    const resolved = await resolveObjectName(raw);
    setResolving(false);

    if (!resolved) {
      setNotFound(true);
      return;
    }

    setOpen(false);
    onSelect({
      view: { ...resolved, fovDeg: DEFAULT_FOV_DEG },
      label: raw,
      target: null,
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
      return;
    }
    if (!suggestions.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlight((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlight((index) =>
        index <= 0 ? suggestions.length - 1 : index - 1,
      );
    }
  }

  const showList = open && suggestions.length > 0;

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={submit} role="search">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            autoFocus={autoFocus}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setHighlight(-1);
              setNotFound(false);
            }}
            onFocus={() => setOpen(true)}
            // Đóng trễ một nhịp: bấm chuột vào gợi ý cũng làm input mất focus,
            // đóng ngay thì cú bấm rơi vào khoảng không.
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKeyDown}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              highlight >= 0 ? `${listboxId}-${highlight}` : undefined
            }
            className="pr-24 pl-9"
          />
          <Button
            type="submit"
            size="sm"
            disabled={resolving}
            className="absolute top-1/2 right-1.5 -translate-y-1/2 gap-2"
          >
            {resolving && <Loader2 className="size-3.5 animate-spin" />}
            {t("go")}
          </Button>
        </div>
      </form>

      {/* Kết quả tra cứu là thông báo động: trình đọc màn hình phải nghe được
          mà không cần người dùng đi tìm. */}
      <p aria-live="polite" className="sr-only">
        {resolving ? t("resolving") : notFound ? t("notFound") : ""}
      </p>

      {notFound && (
        <p className="mt-2 text-sm text-muted-foreground">{t("notFound")}</p>
      )}

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t("suggestions")}
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border bg-popover shadow-lg"
        >
          {suggestions.map((target, index) => (
            <li key={target.id} role="none">
              <button
                type="button"
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={index === highlight}
                onMouseEnter={() => setHighlight(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(target)}
                className={cn(
                  "flex w-full items-baseline justify-between gap-4 px-4 py-2.5 text-left text-sm transition-colors",
                  index === highlight ? "bg-accent/10" : "hover:bg-accent/5",
                )}
              >
                <span className="font-medium">{nameOf(target)}</span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {target.catalogId}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
