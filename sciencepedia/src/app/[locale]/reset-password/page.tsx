import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return buildMetadata({
    title: t("resetTitle"),
    description: t("resetSubtitle"),
    path: "/reset-password",
    locale: locale as Locale,
    noindex: true,
  });
}

/**
 * Trang đặt mật khẩu mới.
 *
 * Token đến từ query string. Nó KHÔNG được đọc ở tầng server và cũng không
 * được dùng để tra cứu gì ở đây: trang chỉ chuyển nó xuống form, và form gửi
 * nó tới `/api/auth/reset`. Trang này là static, nên một token nằm trong
 * `searchParams` mà bị dùng ở đây sẽ ép cả route sang render động.
 */
export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("auth");

  return (
    <AuthShell title={t("resetTitle")} subtitle={t("resetSubtitle")}>
      <ResetPasswordForm />
    </AuthShell>
  );
}
