import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { search } from "@/lib/search";
import { getAllCategories } from "@/server/queries";
import { formatNumber } from "@/lib/utils";
import { escapeHtml } from "@/lib/highlight";

import { SearchBar } from "@/components/search/search-bar";
import { SearchFilters } from "@/components/search/search-filters";
import { SearchDeadEnd } from "@/components/search/search-dead-end";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";

const PER_PAGE = 12;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "search" });

  return buildMetadata({
    title: t("title"),
    description: t("placeholder"),
    path: "/search",
    locale: locale as Locale,
    // Trang kết quả tìm kiếm không nên vào chỉ mục
    noindex: true,
  });
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const query = (sp.q ?? "").trim();
  const requestedPage = Math.max(1, Number(sp.page) || 1);
  const sort =
    sp.sort === "newest" || sp.sort === "popular" ? sp.sort : "relevance";

  const loc = locale as Locale;
  const t = await getTranslations("search");
  const tArticle = await getTranslations("article");
  const categories = await getAllCategories();

  // `search()` tự chọn Meilisearch hoặc Postgres và không ném lỗi —
  // backend === "none" nghĩa là cả hai đều không dùng được.
  const runSearch = (target: number) =>
    search({
      query,
      categorySlug: sp.category,
      limit: PER_PAGE,
      offset: (target - 1) * PER_PAGE,
      sort,
    });

  let result =
    query.length >= 2
      ? await runSearch(requestedPage)
      : { hits: [], total: 0, backend: "postgres" as const };

  const totalPages = Math.max(1, Math.ceil(result.total / PER_PAGE));

  // Số kết quả thay đổi giữa hai lần tìm (bài mới đăng, bộ lọc đổi) có thể để
  // lại link trỏ tới trang không còn tồn tại — rơi về trang cuối thay vì rỗng.
  const page = Math.min(requestedPage, totalPages);
  if (page !== requestedPage && result.total > 0) {
    result = await runSearch(page);
  }

  const hits = result.hits;
  const total = result.total;
  const failed = result.backend === "none";

  return (
    <div className="container-page page-pad">
      <h1 className="font-display text-4xl font-bold tracking-tight">
        {t("title")}
      </h1>

      <div className="mt-6 max-w-2xl">
        {/* localePrefix = "always": <form action> không được next-intl thêm
            tiền tố ngôn ngữ, phải sinh tường minh. */}
        <SearchBar
          action={getPathname({ href: "/search", locale: loc })}
          defaultValue={query}
        />
      </div>

      <SearchFilters
        categories={categories.map((c) => ({
          slug: c.slug,
          name: loc === "en" ? c.nameEn : c.name,
          count: c._count.articles,
        }))}
        className="mt-6"
      />

      <div className="mt-8">
        {query.length < 2 ? (
          // Màn hình chưa nhập gì cũng là một trạng thái rỗng, không phải một
          // dòng chữ trần: nó phải mời đi tiếp, giống hệt khi không có kết quả.
          <SearchDeadEnd
            title={t("startTyping")}
            hint={t("startTypingHint")}
            browseLabel={t("noResultsBrowse")}
            allLabel={t("noResultsAll")}
            categories={categories}
            locale={loc}
          />
        ) : failed ? (
          // Meilisearch chết khác hẳn "không có kết quả": nói đúng chuyện gì
          // đang xảy ra, đừng để người đọc tưởng kho rỗng.
          <SearchDeadEnd
            title={t("searchUnavailable")}
            hint={t("searchUnavailableHint")}
            browseLabel={t("noResultsBrowse")}
            allLabel={t("noResultsAll")}
            categories={categories}
            locale={loc}
          />
        ) : hits.length === 0 ? (
          <SearchDeadEnd
            title={t("noResults")}
            hint={t("noResultsHint")}
            browseLabel={t("noResultsBrowse")}
            allLabel={t("noResultsAll")}
            categories={categories}
            locale={loc}
          />
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              {t("resultsFor", { query })} ·{" "}
              {t("resultCount", { count: formatNumber(total, locale) })}
            </p>

            <ul className="search-highlight divide-y rounded-2xl border">
              {hits.map((hit) => {
                // titleHtml/summaryHtml đã thoát HTML và chỉ còn thẻ <mark>.
                // Bản tiếng Anh chưa được highlight nên hiển thị văn bản thuần.
                const titleHtml =
                  loc === "en" && hit.titleEn
                    ? escapeHtml(hit.titleEn)
                    : hit.titleHtml;
                const summaryHtml =
                  loc === "en" && hit.summaryEn
                    ? escapeHtml(hit.summaryEn)
                    : hit.summaryHtml;
                const category =
                  loc === "en" ? hit.categoryNameEn : hit.categoryName;

                return (
                  <li key={hit.id}>
                    <Link
                      href={`/articles/${hit.slug}`}
                      className="group flex flex-col gap-2 p-5 transition-colors hover:bg-muted/50"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge variant="soft">{category}</Badge>
                        {/* `readingTime` là một con số phút. In trần ra thì
                            dòng meta đọc thành "7 · 1,2 N" — vô nghĩa. */}
                        <span className="text-xs text-muted-foreground">
                          {tArticle("readingTime", { minutes: hit.readingTime })}{" "}
                          ·{" "}
                          {tArticle("views", {
                            count: formatNumber(hit.views, locale),
                          })}
                        </span>
                      </span>

                      {/* Chuỗi đã được thoát HTML, chỉ giữ lại thẻ <mark> */}
                      <h2
                        className="font-display text-xl font-semibold group-hover:text-primary-strong"
                        dangerouslySetInnerHTML={{ __html: titleHtml }}
                      />
                      <p
                        className="line-clamp-2 text-sm text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: summaryHtml }}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <Pagination
              page={page}
              totalPages={totalPages}
              perPage={PER_PAGE}
              itemsOnPage={hits.length}
              basePath="/search"
              extraQuery={{ q: query, category: sp.category, sort }}
              className="mt-12"
            />
          </>
        )}
      </div>
    </div>
  );
}
