import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { Universe } from "@/components/universe/universe";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "universe" });

  return buildMetadata({
    title: t("title"),
    description: t("subtitle"),
    path: "/universe",
    locale: locale as Locale,
  });
}

export default async function UniversePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("universe");

  return (
    <div className="container-page py-8">
      <header className="mb-5">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </header>

      <Universe />

      {/* KHÔNG có bậc thang dùng chung ở đây.

          Trang này đã tự có một bậc thang riêng — từ Ngân Hà ra tới chân trời
          vũ trụ, xem `UNIVERSE_SCALES` — và nó là phần nội dung chính của
          trang chứ không phải khối điều hướng cuối bài. Thêm bậc thang bảy nấc
          dùng chung vào đây là in hai thang bậc chồng nhau trên cùng một trang,
          mỗi thang một cách chia. */}
    </div>
  );
}
