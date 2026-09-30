"use client";

// Client: ô tìm kiếm lọc danh mục đã tải về trình duyệt, theo từng phím gõ.

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Plus, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Concept } from "@/lib/human-atlas/anatomy";
import { displayName, hasViName } from "@/lib/human-atlas/names-vi";
import { searchConcepts, type SearchIndex } from "@/lib/human-atlas/search";
import { searchViews, viewKind } from "@/lib/human-atlas/views";
import { Button } from "@/components/ui/button";
import { PANEL } from "@/components/human-atlas/panel";

/**
 * Tìm cấu trúc — combobox theo mẫu ARIA 1.2 (ô nhập + listbox, phím mũi tên,
 * Enter, Esc).
 *
 * Viết tay thay vì kéo `Combobox` của @base-ui như bản gốc: repo không dùng
 * base-ui, và thêm một bộ component thứ hai chỉ cho một ô tìm kiếm là đúng
 * loại phụ thuộc trùng lặp phải tránh. Ô này cũng là lối vào thay thế cho
 * người không thao tác được trên canvas: mọi cấu trúc chọn được bằng chuột
 * thì cũng chọn được từ đây bằng bàn phím.
 *
 * Góc nhìn (tổng quan hệ, nhóm, cấu trúc — `searchViews`) đứng đầu danh sách,
 * cùng một listbox: gõ "phổi" ra Hệ hô hấp, Phổi, Phổi phải, Phổi trái trước,
 * rồi mới tới các khái niệm FMA mang chữ ấy.
 *
 * Chọn NHIỀU cấu trúc cùng lúc (2026-09-30): nút ＋ ở mỗi hàng hoặc Shift+Enter thêm/bỏ
 * cấu trúc khỏi tập chọn mà KHÔNG đóng ô tìm — tìm "xương đùi", ＋, tìm "xương chày",
 * ＋. Bấm vào tên vẫn là thay cả vùng chọn và đóng. Nút ＋ `tabIndex -1`: phím Tab
 * không lọt vào từng hàng của listbox; bàn phím dùng Shift+Enter.
 */
export function StructureSearch({
  index,
  locale,
  onChoose,
  picked,
  onTogglePicked,
  onClearPicked,
  onChooseView,
  onClose,
}: {
  index: SearchIndex | null;
  locale: string;
  onChoose: (concept: Concept) => void;
  picked: readonly Concept[];
  onTogglePicked: (concept: Concept) => void;
  onClearPicked: () => void;
  onChooseView: (viewId: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations("humanAtlas");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const listId = `${id}-list`;

  const results = useMemo(
    () => (index ? searchConcepts(index, query) : []),
    [index, query],
  );
  const views = useMemo(() => searchViews(query), [query]);
  /** Một chỉ số chung cho hai nhóm: góc nhìn trước, khái niệm sau. */
  const total = views.length + results.length;
  const pickItem = (i: number) => {
    if (i < views.length) onChooseView(views[i].id);
    else if (results[i - views.length]) onChoose(results[i - views.length]);
  };

  useEffect(() => {
    input.current?.focus();
  }, []);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    list.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(total - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      const concept = results[active - views.length];
      if (concept) onTogglePicked(concept);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pickItem(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <section
      aria-label={t("search")}
      className={cn(
        PANEL,
        "absolute z-40 flex flex-col p-3",
        "atlas-phone:inset-x-3 atlas-phone:top-3 atlas-phone:max-h-[calc(100%-7.5rem)]",
        "atlas-short:bottom-3 atlas-short:right-16 atlas-short:top-3 atlas-short:w-80",
        "atlas-wide:right-4 atlas-wide:top-20 atlas-wide:max-h-[calc(100%-12rem)] atlas-wide:w-[22rem] lg:atlas-wide:right-6",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <h2 className="text-sm font-semibold">{t("search")}</h2>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t("closeSearch")}>
          <X />
        </Button>
      </div>

      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          ref={input}
          type="search"
          role="combobox"
          aria-label={t("searchLabel")}
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active < total ? `${id}-${active}` : undefined}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("searchPlaceholder")}
          autoComplete="off"
          spellCheck={false}
          // 16px trở lên: iOS không tự phóng to trang khi ô nhập được focus.
          className="h-11 w-full rounded-xl border bg-background pr-3 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
        />
      </div>

      {picked.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 px-1" aria-live="polite">
          <span className="text-xs text-muted-foreground">{t("searchPicked")}</span>
          {picked.map((c) => {
            const name = displayName(locale, c.id, c.name);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onTogglePicked(c)}
                aria-label={t("searchUnpick", { name })}
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs outline-none hover:bg-muted/70 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <span className="truncate">{name}</span>
                <X aria-hidden className="size-3 shrink-0" />
              </button>
            );
          })}
          {picked.length > 1 && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onClearPicked}>
              {t("searchClearPicked")}
            </Button>
          )}
        </div>
      )}

      <ul
        ref={list}
        id={listId}
        role="listbox"
        aria-label={t("searchLabel")}
        className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {views.length > 0 && (
          <li role="presentation" className="px-3 pt-1 pb-1 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            {t("atlasViews.searchHeading")}
          </li>
        )}
        {views.map((view, i) => (
          <li
            key={view.id}
            id={`${id}-${i}`}
            data-index={i}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActive(i)}
            onClick={() => onChooseView(view.id)}
            className={cn(
              "flex cursor-pointer items-baseline gap-3 rounded-lg px-3 py-2.5 text-sm",
              i === active && "bg-muted",
            )}
          >
            <span className="min-w-0 flex-1 truncate">{locale === "vi" ? view.name.vi : view.name.en}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {t(`atlasViews.searchKind.${viewKind(view)}`)}
            </span>
          </li>
        ))}
        {views.length > 0 && results.length > 0 && <li role="presentation" aria-hidden className="mx-3 my-1 h-px bg-border" />}
        {total === 0 && index && (
          <li role="presentation" className="px-3 py-4 text-sm text-muted-foreground">
            {t("searchEmpty")}
          </li>
        )}
        {results.map((concept, n) => {
          const i = n + views.length;
          const name = displayName(locale, concept.id, concept.name);
          const translated = locale === "vi" && hasViName(concept.id, concept.name);
          const isPicked = picked.some((c) => c.id === concept.id);
          return (
            <li
              key={concept.id}
              id={`${id}-${i}`}
              data-index={i}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => onChoose(concept)}
              className={cn(
                "flex cursor-pointer items-baseline gap-3 rounded-lg px-3 py-2.5 text-sm",
                i === active && "bg-muted",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate">{name}</span>
                {translated && (
                  <span lang="en" className="block truncate text-xs text-muted-foreground">
                    {concept.name}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {t("pieces", { count: concept.elements.length })}
              </span>
              <button
                type="button"
                tabIndex={-1}
                aria-pressed={isPicked}
                aria-label={isPicked ? t("searchUnpick", { name }) : t("searchPick", { name })}
                title={isPicked ? t("searchUnpick", { name }) : t("searchPick", { name })}
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePicked(concept);
                }}
                className={cn(
                  "grid size-7 shrink-0 place-items-center self-center rounded-md border text-muted-foreground outline-none hover:bg-background hover:text-foreground",
                  isPicked && "border-accent bg-accent/15 text-foreground",
                )}
              >
                {isPicked ? <Check aria-hidden className="size-4" /> : <Plus aria-hidden className="size-4" />}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-2 px-1 text-xs leading-relaxed text-muted-foreground">
        {query ? t("searchNoteQuery") : t("searchNoteEmpty")} {t("searchPickHint")}
      </p>
    </section>
  );
}
