import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

/** Khung dùng chung cho các trang tĩnh (chính sách, điều khoản, liên hệ). */
export async function StaticPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt?: string;
  children: ReactNode;
}) {
  // Nhãn này từng bị ghim cứng tiếng Việt nên bản /en cũng hiện "Cập nhật lần cuối"
  const t = await getTranslations("common");

  return (
    <div className="container-prose py-16">
      <h1 className="font-display text-4xl font-bold tracking-tight">{title}</h1>
      {updatedAt && (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("lastUpdated", { date: updatedAt })}
        </p>
      )}
      <div className="article-prose mt-8">{children}</div>
    </div>
  );
}
