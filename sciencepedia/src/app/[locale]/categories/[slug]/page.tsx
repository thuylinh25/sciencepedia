import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { absoluteUrl, cn } from "@/lib/utils";
import { categoryNotice } from "@/lib/category-notices";
import { getAllCategories, getCategoryBySlug, listArticles } from "@/server/queries";

import { JsonLd } from "@/components/json-ld";
import { CategoryIcon } from "@/components/category-icon";
import { ArticleGrid } from "@/components/article/article-grid";
import { Pagination } from "@/components/pagination";
import { CategoryCard } from "@/components/category/category-card";
import { CategoryNotice } from "@/components/category/category-notice";
import { AssetImage } from "@/components/ui/asset-image";

export const revalidate = 300;

const PER_PAGE = 12;

export async function generateStaticParams() {
  try {
    const categories = await getAllCategories();
    return categories.map(({ slug }) => ({ slug }));
  } catch (error) {
    console.warn("[build] bỏ qua prerender danh mục:", (error as Error).message);
    return [];
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const { page } = await searchParams;
  const category = await getCategoryBySlug(slug);
  // noindex cho slug không tồn tại — xem chú thích ở articles/[slug]/page.tsx
  if (!category) {
    return { title: "404", robots: { index: false, follow: false } };
  }

  const loc = locale as Locale;
  const name = loc === "en" ? category.nameEn : category.name;
  const t = await getTranslations({ locale, namespace: "category" });
  // Danh mục chưa có mô tả từng lấy chính tên làm mô tả — trùng tiêu đề.
  // Câu mẫu chỉ là lưới đỡ; chỗ sửa thật là viết mô tả cho danh mục.
  const description =
    (loc === "en"
      ? (category.descriptionEn ?? category.description)
      : category.description) ?? t("metaDescription", { name });

  return buildMetadata({
    title: name,
    description,
    path: `/categories/${category.slug}`,
    locale: loc,
    image: category.coverImage,
    page: Math.max(1, Number(page) || 1),
    // Danh mục chưa có bài (đếm cả bài của danh mục con) là trang trống: để
    // nó trong chỉ mục là nộp cho Google một trang "nội dung mỏng". Sitemap
    // lọc cùng điều kiện. Có bài đầu tiên là tự vào lại chỉ mục.
    noindex: category._count.articles === 0,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const { page: rawPage } = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const loc = locale as Locale;
  const t = await getTranslations("category");

  const name = loc === "en" ? category.nameEn : category.name;
  const description =
    loc === "en"
      ? (category.descriptionEn ?? category.description)
      : category.description;

  /* Có ảnh thì chữ phải là chữ trắng, không phải màu chữ của theme.

     Lớp phủ trên ảnh luôn tối — nó phải tối để chữ đọc được trên một tấm ảnh
     sáng tối không đoán trước. Nhưng `text-muted-foreground` ở giao diện SÁNG
     là chữ xám đậm, tức chữ tối trên nền tối. Người dùng chọn "Sáng" hoặc
     "Theo hệ thống" sẽ thấy một khối gần như không đọc được.

     Đây là cùng lý do `CategoryFeatureCard` ép `text-white` chứ không dùng
     token màu chữ. Contrast phải đúng ở mọi giá trị dữ liệu VÀ mọi theme,
     không phải ở tổ hợp may mắn. */
  const onImage = Boolean(category.coverImage);
  const notice = categoryNotice(category.slug, category.parent?.slug);
  const muted = onImage ? "text-white/75" : "text-muted-foreground";

  // `page` trả về đã được kẹp vào khoảng trang thật sự có bài
  const { items, page, totalPages } = await listArticles({
    page: Math.max(1, Number(rawPage) || 1),
    perPage: PER_PAGE,
    categorySlug: category.slug,
  });

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Sciencepedia", url: absoluteUrl(`/${locale}`) },
          { name: t("title"), url: absoluteUrl(`/${locale}/categories`) },
          {
            name,
            url: absoluteUrl(`/${locale}/categories/${category.slug}`),
          },
        ])}
      />

      {/* Đầu trang mang ảnh bìa và màu riêng của lĩnh vực.

          Ảnh dùng đúng cách xử lý của `CategoryFeatureCard`, không phát minh
          cách thứ hai: ảnh bìa do biên tập chọn nên sáng tối không đoán trước
          được, và cách duy nhất bảo đảm chữ đọc được ở MỌI giá trị dữ liệu là
          một lớp phủ đặc, chứ không phải hy vọng ảnh đủ tối.

          Không có ảnh — mọi danh mục con hiện đều vậy — thì rơi về dải màu như
          cũ. Đó là trạng thái bình thường, không phải lỗi. */}
      <header className="relative overflow-hidden border-b py-16">
        {category.coverImage && (
          <>
            <AssetImage
              src={category.coverImage}
              alt=""
              // Trải hết bề ngang màn hình ở mọi kích thước
              sizes="100vw"
              // Khối đầu tiên của trang, quyết định LCP
              priority
              className="object-cover"
            />
            {/* Đặc bên trái, nhạt dần sang phải: chữ nằm ở cột trái, còn nửa
                phải để ảnh thở. Cùng nguyên tắc với lớp phủ đáy của card, chỉ
                đổi trục cho khớp chỗ chữ đứng. */}
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-space-900 via-space-900/85 to-space-900/45"
            />
          </>
        )}

        {/* Sắc màu của lĩnh vực, phủ trên ảnh để cả trang vẫn nhận ra là nhánh nào */}
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `linear-gradient(160deg, ${category.color}22, transparent 65%)`,
          }}
        />

        {/* `relative` là bắt buộc, không phải thừa: hai lớp phủ trên là phần tử
            đã định vị, mà phần tử đã định vị luôn vẽ TRÊN phần tử tĩnh bất kể
            thứ tự DOM. Bỏ nó thì tiêu đề nằm dưới lớp phủ. Đúng cái bẫy đã ghi
            trong docs/design-system.md. */}
        <div className="relative container-page">
          {category.parent && (
            <Link
              href={`/categories/${category.parent.slug}`}
              className={cn("text-sm", onImage ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground")}
            >
              ← {loc === "en" ? category.parent.nameEn : category.parent.name}
            </Link>
          )}

          <div className="mt-3 flex items-center gap-4">
            <span
              className="grid size-14 shrink-0 place-items-center rounded-2xl"
              style={{
                backgroundColor: `${category.color}26`,
                color: category.color,
              }}
            >
              <CategoryIcon name={category.icon} className="size-7" />
            </span>
            <div>
              <h1 className={cn("font-display text-4xl font-bold tracking-tight sm:text-5xl", onImage && "text-white")}>
                {name}
              </h1>
              <p className={cn("mt-1 text-sm", muted)}>
                {t("articleCount", { count: category._count.articles })}
              </p>
            </div>
          </div>

          {description && (
            <p className={cn("mt-5 max-w-3xl text-lg leading-relaxed text-pretty", muted)}>
              {description}
            </p>
          )}
        </div>
      </header>

      <div className="container-page page-pad">
        {notice && <CategoryNotice kind={notice} className="mb-10 max-w-3xl" />}

        {/* Danh mục con là THẺ, không còn là hàng chip trong đầu trang.

            Trang lĩnh vực là trang "landing" của nhánh: menu Khám phá chỉ liệt
            kê lĩnh vực gốc (giữ menu gọn, không có submenu bay sang phải), nên
            đường vào nhóm con — "Tác động cột sống", "Bấm huyệt"… dưới Sức
            khoẻ — là ở đây. Một hàng chip nhỏ trên ảnh bìa không gánh nổi vai
            trò đó. Thẻ đọc thẳng `category.children` từ CSDL: thêm nhóm con mới
            là thêm một hàng, không sửa code. */}
        {category.children.length > 0 && (
          <section aria-labelledby="subcategories" className="mb-14">
            <h2
              id="subcategories"
              className="mb-5 font-display text-2xl font-bold tracking-tight"
            >
              {t("subcategories")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {category.children.map((child) => (
                <CategoryCard
                  key={child.id}
                  category={child}
                  locale={loc}
                  headingLevel={3}
                  label={
                    categoryNotice(child.slug, category.slug) === "traditional"
                      ? t("notice.traditional.label")
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        )}

        <ArticleGrid articles={items} locale={loc} headingLevel={2} />
        <Pagination
          page={page}
          totalPages={totalPages}
          perPage={PER_PAGE}
          itemsOnPage={items.length}
          basePath={`/categories/${category.slug}`}
          className="mt-14"
        />
      </div>
    </>
  );
}
