import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Radio, Satellite, Telescope } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import { EpicEarth } from "@/components/earth/epic-earth";
import { JsonLd } from "@/components/json-ld";
import {
  MobileTableOfContents,
  TableOfContents,
  type Heading,
} from "@/components/article/table-of-contents";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "earthLive" });

  return buildMetadata({
    title: t("title"),
    description: t("metaDescription"),
    path: "/earth-live",
    locale: locale as Locale,
  });
}

/**
 * Neo của ba mục đọc. Đặt thành hằng số vì mục lục và chính các thẻ h2 phải
 * dùng CHUNG một danh sách — hai danh sách song song thì thêm một mục là hỏng
 * một liên kết, và hỏng im lặng.
 */
const SECTIONS = ["ban-ngay", "mau-that", "gioi-han"] as const;

/**
 * Trang "Trái Đất thời gian thực".
 *
 * ## Vì sao là một trang chứ không chỉ là khối trên trang chủ
 *
 * Khối ảnh trên trang chủ trả lời được "Trái Đất hôm nay trông thế nào" và
 * hết. Ba câu hỏi đến ngay sau đó — ảnh này ai chụp, chụp từ đâu, và vì sao
 * lúc nào cũng thấy ban ngày — không có chỗ nào trả lời. Đó là phần biến một
 * widget thành một công cụ để học, và nó cần chỗ.
 *
 * ## Vì sao trang này là static
 *
 * Không một dòng nào ở đây phụ thuộc vào dữ liệu NASA: ảnh do component
 * client tự lấy sau khi trang đã hiện. Nên trang được prerender như mọi
 * trang nội dung khác, và phần "thời gian thực" không kéo theo một lượt
 * render phía máy chủ nào.
 *
 * ## Bố cục hai cột từ `xl`
 *
 * Bản một cột cũ để cột chữ rộng 48rem trong một khung 80rem, tức gần một
 * phần ba màn hình bỏ trống bên phải trên laptop. Nay phần đọc và phần tra
 * cứu tách làm hai: chữ ở trái, còn mục lục cùng các khối dữ kiện — thứ người
 * ta LIẾC chứ không đọc tuần tự — sang cột phải và dính khi cuộn.
 *
 * Ngưỡng là `xl` (1280px) chứ không `lg`: ở 1024px, trừ cột phải 21rem thì
 * cột chữ còn chừng 600px, hẹp hơn cả bản một cột hiện tại. Đổi bố cục để cột
 * chữ hẹp đi là đổi ngược hướng.
 *
 * Thứ tự trong DOM là SIDEBAR TRƯỚC, và nó được đẩy sang phải bằng `order`.
 * Nhờ vậy khi lưới xếp chồng (dưới xl) thì ba thẻ dữ kiện vẫn nằm ngay dưới
 * khung ảnh — đúng thứ tự của bản cũ, tức di động không đổi một nhịp nào.
 */
export default async function EarthLivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("earthLive");

  const facts = [
    {
      icon: Satellite,
      term: t("facts.spacecraft.term"),
      detail: t("facts.spacecraft.detail"),
    },
    {
      icon: Telescope,
      term: t("facts.instrument.term"),
      detail: t("facts.instrument.detail"),
    },
    {
      icon: Radio,
      term: t("facts.cadence.term"),
      detail: t("facts.cadence.detail"),
    },
  ];

  const sections = [
    { id: SECTIONS[0], title: t("dayTitle"), body: t("dayBody") },
    { id: SECTIONS[1], title: t("colourTitle"), body: t("colourBody") },
    { id: SECTIONS[2], title: t("limitTitle"), body: t("limitBody") },
  ];

  const headings: Heading[] = sections.map((section) => ({
    id: section.id,
    text: section.title,
    level: 2,
  }));

  /* Bảng tra cứu: mỗi dòng một sự kiện đo được, không có câu văn nào.
     Nó KHÔNG tóm tắt ba thẻ phía trên mà trả lời một loại câu hỏi khác —
     "con số là bao nhiêu" thay vì "cái này là gì". */
  const quick = [
    { term: t("quick.spacecraft"), value: t("quick.spacecraftValue") },
    { term: t("quick.orbit"), value: t("quick.orbitValue") },
    { term: t("quick.agency"), value: t("quick.agencyValue") },
    { term: t("quick.launch"), value: t("quick.launchValue") },
    { term: t("quick.camera"), value: t("quick.cameraValue") },
    { term: t("quick.cadence"), value: t("quick.cadenceValue") },
  ];

  return (
    /* Khung rộng 88rem thay cho `container-page` (80rem).
       Bố cục hai cột cần chỗ cho cả cột chữ 56rem lẫn cột tra cứu 21rem cộng
       khoảng cách giữa hai cột; ở 80rem thì cột chữ bị bóp xuống dưới 48rem
       và bản hai cột đọc còn khó hơn bản một cột. */
    <div className="mx-auto w-full max-w-[88rem] px-5 py-8 sm:px-8 lg:px-12">
      {/* Kiểu WebApplication chứ không phải Article: trang này là một công cụ
          chạy được, không phải một bài đọc. Google dùng phân biệt đó để quyết
          định hiển thị nó ra sao trong kết quả tìm kiếm. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: t("title"),
          description: t("metaDescription"),
          url: absoluteUrl(`/${locale}/earth-live`),
          applicationCategory: "EducationalApplication",
          browserRequirements: "JavaScript",
          isAccessibleForFree: true,
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          creator: {
            "@type": "Organization",
            name: "Sciencepedia",
            url: absoluteUrl("/"),
          },
          about: [
            { "@type": "Thing", name: "Earth observation" },
            { "@type": "Thing", name: "DSCOVR" },
            { "@type": "Thing", name: "NASA EPIC" },
          ],
        }}
      />

      <header className="mb-6 max-w-3xl">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {t("intro")}
        </p>
      </header>

      {/* Khung ảnh giữ nguyên bề ngang tối đa: nó là lý do người ta vào trang,
          và một quả cầu càng lớn càng đọc được nhiều chi tiết mây. Hai cột chỉ
          bắt đầu ở phần chữ bên dưới. */}
      <EpicEarth locale={locale} />

      <div className="mt-12 grid gap-10 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start xl:gap-14">
        {/* ------------------------------------------------ Cột tra cứu */}
        <aside className="min-w-0 xl:order-2">
          {/* `sticky` chỉ bật từ xl. Dưới ngưỡng đó cột này nằm trong dòng
              chảy bình thường, mà một khối dính trong dòng chảy dọc thì trôi
              theo suốt trang và che mất nội dung. */}
          <div className="space-y-6 xl:sticky xl:top-28">
            {/* Mục lục bản cột: từ lg trở lên. Dưới lg đã có bản gấp trong
                cột chữ, nên hai bản không bao giờ cùng xuất hiện. */}
            <div className="hidden rounded-2xl border bg-card p-5 lg:block">
              <TableOfContents headings={headings} />
            </div>

            {/* Nhãn cho ba thẻ dữ kiện.

                Bản cũ có tiêu đề h2 "Ảnh này đến từ đâu" đứng trên chúng. Ở
                cột phải một h2 sẽ tranh thứ bậc với các tiêu đề mục bên trái,
                nên nó xuống thành nhãn nhỏ — giữ đúng câu chữ cũ, đổi mỗi vai
                trò thị giác. Ba thẻ không có nhãn thì trôi lơ lửng giữa mục lục
                và bảng tra cứu, không rõ chúng trả lời câu hỏi gì. */}
            <p className="px-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {t("howTitle")}
            </p>

            <dl className="!mt-3 space-y-4">
              {facts.map(({ icon: Icon, term, detail }) => (
                <div key={term} className="rounded-2xl border bg-card p-5">
                  <dt className="flex items-center gap-2.5 font-display font-semibold">
                    <Icon
                      className="size-4 shrink-0 text-primary-strong"
                      aria-hidden
                    />
                    {term}
                  </dt>
                  {/* Cắt còn ba dòng CHỈ ở bố cục hai cột: cột phải là chỗ để
                      liếc, và ba thẻ dài đầy đủ ở đó sẽ cao hơn cả phần chữ
                      bên trái. Dưới xl không cắt, nên trên di động người đọc
                      vẫn nhận đủ chữ như bản cũ. */}
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground xl:line-clamp-3">
                    {detail}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="rounded-2xl border bg-card p-5">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                {t("quickTitle")}
              </p>
              <dl className="mt-3 space-y-2.5 text-sm">
                {quick.map(({ term, value }) => (
                  <div
                    key={term}
                    className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2.5 last:border-0 last:pb-0"
                  >
                    <dt className="shrink-0 text-muted-foreground">{term}</dt>
                    <dd className="text-right font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </aside>

        {/* ---------------------------------------------------- Cột chữ */}
        <div className="min-w-0 xl:order-1 xl:max-w-[56rem]">
          <MobileTableOfContents headings={headings} />

          {sections.map((section, index) => (
            <section
              key={section.id}
              aria-labelledby={section.id}
              className={index === 0 ? "" : "mt-14"}
            >
              {/* Vạch vàng ngắn trên mỗi tiêu đề mục.

                  Ba mục này là ba câu hỏi độc lập, không phải ba đoạn của một
                  mạch. Ở bản cũ chúng chỉ cách nhau 32px và cùng cỡ chữ với
                  mọi h2 khác trên trang, nên mắt đọc thành một khối liền.
                  Vạch màu thương hiệu tốn 4px chiều cao mà đánh dấu được chỗ
                  bắt đầu ý mới rõ hơn bất kỳ khoảng trắng nào. */}
              <span
                aria-hidden
                className="block h-1 w-10 rounded-full bg-primary"
              />
              <h2
                id={section.id}
                className="mt-4 scroll-mt-28 font-display text-2xl font-bold tracking-tight"
              >
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}

          <section className="mt-14">
            <span
              aria-hidden
              className="block h-1 w-10 rounded-full bg-primary"
            />
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">
              {t("nextTitle")}
            </h2>

            <div className="mt-5 grid max-w-xl gap-4">
              <Link
                href="/zoom"
                className="group rounded-2xl border bg-card p-5 transition-colors hover:border-primary-strong/40"
              >
                <Telescope className="size-5 text-primary-strong" aria-hidden />
                <h3 className="mt-3 font-display font-semibold">
                  {t("nextCta")}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t("nextHint")}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-strong">
                  {t("nextCta")}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              {t("credit")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
