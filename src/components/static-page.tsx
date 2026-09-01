import type { ReactNode } from "react";

/** Khung dùng chung cho các trang tĩnh (chính sách, điều khoản, liên hệ). */
export function StaticPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt?: string;
  children: ReactNode;
}) {
  return (
    <div className="container-prose py-16">
      <h1 className="font-display text-4xl font-bold tracking-tight">{title}</h1>
      {updatedAt && (
        <p className="mt-2 text-sm text-muted-foreground">
          Cập nhật lần cuối: {updatedAt}
        </p>
      )}
      <div className="article-prose mt-8">{children}</div>
    </div>
  );
}
