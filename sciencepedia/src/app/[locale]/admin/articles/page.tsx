import { getTranslations, setRequestLocale } from "next-intl/server";
import { Plus, Search, X } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { AdminArticleTable } from "@/components/admin/article-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/pagination";

const PER_PAGE = 20;

export default async function AdminArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { page: rawPage, q } = await searchParams;
  const requestedPage = Math.max(1, Number(rawPage) || 1);
  const t = await getTranslations("admin");

  const where = q
    ? { title: { contains: q, mode: "insensitive" as const } }
    : {};

  const findPage = (target: number) =>
    prisma.article.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        featured: true,
        views: true,
        updatedAt: true,
        category: { select: { name: true, nameEn: true, color: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (target - 1) * PER_PAGE,
      take: PER_PAGE,
    });

  const [optimistic, total] = await Promise.all([
    findPage(requestedPage),
    prisma.article.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  // Xoá bài ở trang cuối làm hụt một trang; đừng để lại bảng rỗng.
  const page = Math.min(requestedPage, totalPages);
  const articles = page === requestedPage ? optimistic : await findPage(page);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {t("articles")}
          </h1>
          {/* Tổng số đứng ngay dưới tiêu đề: nó vốn đã được truy vấn để tính
              số trang, nên hiển thị không tốn thêm gì, mà thiếu nó thì người
              quản trị phải nhân số trang với 20 để đoán. */}
          <p className="mt-1 text-sm text-muted-foreground">
            {q
              ? t("searchResults", { count: total, query: q })
              : t("articleCount", { count: total })}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/articles/new">
            <Plus className="size-4" />
            {t("newArticle")}
          </Link>
        </Button>
      </header>

      {/*
        Form GET thuần, không JavaScript.

        Trang này vốn đã đọc `q` từ query string và lọc bằng nó; thứ thiếu chỉ
        là ô để gõ. Một form GET nộp thẳng vào chính URL hiện tại cho ra đúng
        hành vi đó mà giữ nguyên trang là Server Component — tìm kiếm chạy
        được cả khi JavaScript chưa tải xong, kết quả đặt được dấu trang, và
        nút lùi của trình duyệt hoạt động đúng.

        Không mang theo `page`: đổi từ khoá tìm kiếm thì phải về trang một,
        và cách chắc chắn nhất là không có trường đó trong form.
      */}
      <form method="get" className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>

        <Button type="submit" variant="outline">
          {t("search")}
        </Button>

        {q && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/articles">
              <X className="size-4" />
              {t("clearSearch")}
            </Link>
          </Button>
        )}
      </form>

      <AdminArticleTable articles={articles} locale={locale} />

      <Pagination
        page={page}
        totalPages={totalPages}
        perPage={PER_PAGE}
        itemsOnPage={articles.length}
        basePath="/admin/articles"
        extraQuery={{ q }}
      />
    </div>
  );
}
