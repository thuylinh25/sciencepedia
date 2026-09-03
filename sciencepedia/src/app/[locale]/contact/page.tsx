import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { StaticPage } from "@/components/static-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });

  return buildMetadata({
    title: t("contact"),
    description: t("aboutText"),
    path: "/contact",
    locale: locale as Locale,
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("footer");
  const en = locale === "en";

  return (
    <StaticPage title={t("contact")}>
      {en ? (
        <>
          <p>{t("aboutText")}</p>
          <h2>Reach us</h2>
          <ul>
            <li>
              General enquiries —{" "}
              <a href="mailto:hello@sciencepedia.dev">hello@sciencepedia.dev</a>
            </li>
            <li>
              Corrections and factual errors —{" "}
              <a href="mailto:corrections@sciencepedia.dev">
                corrections@sciencepedia.dev
              </a>
            </li>
            <li>
              Privacy —{" "}
              <a href="mailto:privacy@sciencepedia.dev">
                privacy@sciencepedia.dev
              </a>
            </li>
          </ul>
          <h2>Reporting an error</h2>
          <p>
            Include the article URL and, where possible, a source we can check.
            Corrections to published articles are made in place and recorded in
            the article revision history.
          </p>
        </>
      ) : (
        <>
          <p>{t("aboutText")}</p>
          <h2>Liên hệ</h2>
          <ul>
            <li>
              Thông tin chung —{" "}
              <a href="mailto:hello@sciencepedia.dev">hello@sciencepedia.dev</a>
            </li>
            <li>
              Báo lỗi nội dung —{" "}
              <a href="mailto:corrections@sciencepedia.dev">
                corrections@sciencepedia.dev
              </a>
            </li>
            <li>
              Quyền riêng tư —{" "}
              <a href="mailto:privacy@sciencepedia.dev">
                privacy@sciencepedia.dev
              </a>
            </li>
          </ul>
          <h2>Cách báo lỗi</h2>
          <p>
            Vui lòng kèm đường dẫn bài viết và, nếu có thể, nguồn để chúng tôi
            đối chiếu. Các đính chính được sửa trực tiếp trên bài và lưu lại
            trong lịch sử phiên bản.
          </p>
        </>
      )}
    </StaticPage>
  );
}
