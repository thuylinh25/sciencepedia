"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * Ô tìm kiếm của trang /search. Là client component vì nó phải đọc bộ lọc hiện
 * tại (`useSearchParams`) để không làm mất chúng khi tìm lại.
 *
 * `action` do trang truyền vào (`getPathname({ href: "/search", locale })`) chứ
 * không viết cứng "/search": `routing.localePrefix === "always"`, mà thuộc tính
 * `action` của <form> không đi qua `Link` của next-intl nên không được thêm
 * tiền tố ngôn ngữ. Có `action` + `method="get"` thì form vẫn gửi được khi tắt
 * JS; `onSubmit` chỉ chặn lại khi JS có mặt để điều hướng phía client.
 *
 * Ô tìm kiếm trên trang chủ KHÔNG dùng lại component này — xem `SearchHeroForm`.
 */
export function SearchBar({
  action,
  defaultValue = "",
}: {
  action: string;
  defaultValue?: string;
}) {
  const t = useTranslations("search");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);

  // Bộ lọc đang có trong URL phải đi kèm khi submit không-JS, nếu không mỗi lần
  // tìm lại sẽ âm thầm xoá lĩnh vực và cách sắp xếp người đọc vừa chọn.
  const category = searchParams.get("category");
  const sort = searchParams.get("sort");

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
    <form action={action} method="get" onSubmit={submit} role="search" className="relative">
      {category && <input type="hidden" name="category" value={category} />}
      {sort && <input type="hidden" name="sort" value={sort} />}
      <Search className="pointer-events-none absolute top-1/2 start-5 size-5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("placeholder")}
        aria-label={t("title")}
        className="h-14 w-full rounded-full border bg-card pe-32 ps-13 text-base shadow-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
      />
      <Button
        type="submit"
        className="absolute top-1/2 end-2 -translate-y-1/2"
      >
        {t("title")}
      </Button>
    </form>
  );
}
