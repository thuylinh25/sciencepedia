"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Clock, FileText, Loader2, Search } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import type { SearchHit } from "@/types/search";
import { cn } from "@/lib/utils";

export function SearchCommand({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const debounced = useDebounce(query, 220);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHits([]);
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    const term = debounced.trim();
    if (term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(term)}&limit=6`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data: { hits: SearchHit[] }) => {
        setHits(data.hits ?? []);
        setActive(0);
      })
      .catch((error) => {
        if ((error as Error)?.name !== "AbortError") setHits([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debounced]);

  function go(slug: string) {
    onOpenChange(false);
    router.push(`/articles/${slug}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, hits.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (hits[active]) go(hits[active].slug);
      else if (query.trim()) {
        onOpenChange(false);
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[12%] max-w-2xl translate-y-0 gap-0 overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">{t("quickSearch")}</DialogTitle>

        <div className="flex items-center gap-3 border-b px-5">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("placeholder")}
            autoFocus
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {loading && (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="max-h-[min(60vh,26rem)] overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {t("startTyping")}
            </p>
          ) : hits.length === 0 && !loading ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium">{t("noResults")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("noResultsHint")}
              </p>
            </div>
          ) : (
            <ul className="search-highlight space-y-1">
              {hits.map((hit, index) => {
                const title =
                  locale === "en" ? (hit.titleEn ?? hit.title) : hit.title;
                const summary =
                  locale === "en" ? (hit.summaryEn ?? hit.summary) : hit.summary;
                const category =
                  locale === "en" ? hit.categoryNameEn : hit.categoryName;

                return (
                  <li key={hit.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(hit.slug)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                        index === active ? "bg-muted" : "hover:bg-muted/60",
                      )}
                    >
                      <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {title}
                          </span>
                          <Badge variant="soft" className="shrink-0">
                            {category}
                          </Badge>
                        </span>
                        <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">
                          {summary}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {hit.readingTime}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {query.trim().length >= 2 && (
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              router.push(`/search?q=${encodeURIComponent(query.trim())}`);
            }}
            className="flex items-center justify-between border-t px-5 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <span>{t("resultsFor", { query: query.trim() })}</span>
            <ArrowRight className="size-4" />
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
