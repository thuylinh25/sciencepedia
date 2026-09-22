import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { oauthProviders } from "@/lib/auth-providers";
import { isInAppBrowser, systemBrowserUrl } from "@/lib/in-app-browser";

/* Trang đăng nhập dựng theo REQUEST, không dựng sẵn lúc build.

   Nó phải đọc `AUTH_*_SECRET` để biết nhà cung cấp nào đang bật, mà những biến
   ấy được đánh dấu Sensitive trên Vercel: chỉ tiêm cho runtime, bước build
   không thấy. Bản dựng sẵn vì thế đóng băng câu trả lời "không có nhà cung cấp
   nào" và production mất sạch nút Google/GitHub trong khi Auth.js ở runtime
   vẫn đăng ký đủ (đo ngày 2026-09-22).

   Đánh đổi chấp nhận được: trang `noindex`, không có nội dung để ISR, và mỗi
   lượt dựng chỉ là một form. Đổi lại, thứ hiện trên màn hình luôn khớp thứ
   `/api/auth/*` thật sự phục vụ. */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return buildMetadata({
    title: t("login"),
    description: t("loginSubtitle"),
    path: "/login",
    locale: locale as Locale,
    noindex: true,
  });
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("auth");
  const providers = oauthProviders();

  /* Lượt OAuth bắt đầu trong trình duyệt nhúng của một app thì không bao giờ
     hoàn tất được: cookie PKCE ở lại hộp cookie của app, còn Google trả về
     trình duyệt hệ thống (đo 2026-09-22, mã chẩn đoán `pkce-missing/cookie`).
     Nên trang đưa sẵn một đường mở lại chính nó bằng trình duyệt thật. */
  const userAgent = (await headers()).get("user-agent") ?? "";
  const host = (await headers()).get("host") ?? "";
  const openInBrowser =
    isInAppBrowser(userAgent) && host
      ? systemBrowserUrl(userAgent, `https://${host}/${locale}/login`)
      : null;

  return (
    <AuthShell
      title={t.rich("loginTitleRich", {
        hl: (chunks) => <span className="text-primary">{chunks}</span>,
      })} subtitle={t("loginSubtitle")}>
      {/* Cờ suy từ `oauthProviders()`, tức đúng điều kiện `auth.ts` dùng để
          đăng ký nhà cung cấp (id VÀ secret). Chỉ kiểm id là cách cũ, và nó vẽ
          nút cho nhà cung cấp không tồn tại. */}
      <LoginForm
        openInBrowser={openInBrowser}
        hasGithub={providers.github}
        hasGoogle={providers.google}
        hasFacebook={providers.facebook}
      />
    </AuthShell>
  );
}
