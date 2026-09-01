import type { ReactNode } from "react";

import { Logo } from "@/components/layout/logo";
import { Link } from "@/i18n/navigation";

/** Khung hai cột cho trang đăng nhập / đăng ký. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>

          <h1 className="mt-8 font-display text-3xl font-bold tracking-tight lg:mt-0">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>
      </div>

      {/* Nửa phải mang tinh thần NASA: nền vũ trụ, một câu trích */}
      <aside className="bg-cosmos starfield relative hidden items-end p-12 lg:flex">
        <blockquote className="relative max-w-md text-star">
          <p className="font-display text-2xl leading-snug font-medium text-balance text-white">
            “Ở đâu đó, một điều gì đó tuyệt vời đang chờ được biết đến.”
          </p>
          <footer className="mt-4 text-sm text-white/60">— Carl Sagan</footer>
        </blockquote>
      </aside>
    </div>
  );
}
