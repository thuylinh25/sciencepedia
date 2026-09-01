"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const t = useTranslations("search");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const term = value.trim();
    if (term.length < 2) return;

    // Giữ lại bộ lọc hiện có, nhưng luôn quay về trang 1
    const query = new URLSearchParams(searchParams.toString());
    query.set("q", term);
    query.delete("page");
    router.push(`/search?${query.toString()}`);
  }

  return (
    <form onSubmit={submit} role="search" className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("placeholder")}
        aria-label={t("title")}
        className="h-14 w-full rounded-full border bg-card pr-32 pl-13 text-base shadow-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
      />
      <Button
        type="submit"
        className="absolute top-1/2 right-2 -translate-y-1/2"
      >
        {t("title")}
      </Button>
    </form>
  );
}
