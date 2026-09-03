"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CategoryOption = { slug: string; name: string; count: number };

export function SearchFilters({
  categories,
  className,
}: {
  categories: CategoryOption[];
  className?: string;
}) {
  const t = useTranslations("search");
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") ?? "all";
  const currentSort = searchParams.get("sort") ?? "relevance";
  const hasFilters = currentCategory !== "all" || currentSort !== "relevance";

  function update(key: string, value: string) {
    const query = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "relevance") query.delete(key);
    else query.set(key, value);
    query.delete("page");
    router.push(`/search?${query.toString()}`);
  }

  function clear() {
    const query = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) query.set("q", q);
    router.push(`/search?${query.toString()}`);
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Select
        value={currentCategory}
        onValueChange={(value) => update("category", value)}
      >
        <SelectTrigger size="sm" className="w-56">
          <SelectValue placeholder={t("allCategories")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allCategories")}</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.slug} value={category.slug}>
              {category.name} ({category.count})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentSort}
        onValueChange={(value) => update("sort", value)}
      >
        <SelectTrigger size="sm" className="w-48">
          <SelectValue placeholder={t("sortBy")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="relevance">{t("sortRelevance")}</SelectItem>
          <SelectItem value="newest">{t("sortNewest")}</SelectItem>
          <SelectItem value="popular">{t("sortPopular")}</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clear}>
          <X className="size-4" />
          {t("clearFilters")}
        </Button>
      )}
    </div>
  );
}
