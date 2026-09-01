import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Inter, Playfair_Display } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing, type Locale } from "@/i18n/routing";
import { getRootCategories } from "@/server/queries";
import { Providers } from "@/components/providers";
import { SiteHeader, type NavCategory } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AssistantLauncher } from "@/components/ai/assistant-launcher";
import { Toaster } from "@/components/ui/sonner";
import { absoluteUrl } from "@/lib/utils";
import { websiteJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

import "../globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-display",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });

  return {
    metadataBase: new URL(absoluteUrl("/")),
    title: {
      default: `${t("name")} — ${t("tagline")}`,
      template: `%s · ${t("name")}`,
    },
    description: t("description"),
    applicationName: t("name"),
    manifest: "/manifest.webmanifest",
    icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
    formatDetection: { telephone: false },
  };
}

/**
 * Lĩnh vực trên thanh điều hướng lấy thẳng từ CSDL — trước đây danh sách bị
 * ghim cứng nên thêm lĩnh vực mới là menu không có.
 *
 * `getRootCategories` đã được cache nên layout vẫn render tĩnh được; bọc
 * try/catch để `next build` không gãy khi không kết nối được CSDL.
 */
async function navCategories(): Promise<NavCategory[]> {
  try {
    const categories = await getRootCategories();
    return categories.map(({ slug, name, nameEn, icon }) => ({
      slug,
      name,
      nameEn,
      icon,
    }));
  } catch (error) {
    console.warn("[layout] không nạp được danh mục:", (error as Error).message);
    return [];
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Bật static rendering cho toàn bộ cây bên dưới
  setRequestLocale(locale);

  const categories = await navCategories();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable}`}
    >
      <body className="min-h-dvh font-sans">
        <NextIntlClientProvider>
          <Providers>
            <JsonLd data={websiteJsonLd(locale as Locale)} />
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-5 focus:py-2 focus:text-primary-foreground"
            >
              Bỏ qua tới nội dung chính
            </a>
            <div className="flex min-h-dvh flex-col">
              <SiteHeader categories={categories} />
              <main id="main" className="flex-1">
                {children}
              </main>
              <SiteFooter />
            </div>
            <AssistantLauncher />
            <Toaster />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
