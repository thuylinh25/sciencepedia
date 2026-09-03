import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShieldAlert } from "lucide-react";

import { auth } from "@/auth";
import { atLeast } from "@/lib/roles";
import { Link } from "@/i18n/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin");
  const session = await auth();

  // Chặn ngay ở layout: mọi trang con đều nằm sau cổng này
  if (!session?.user || !atLeast(session.user.role, "EDITOR")) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="size-12 text-destructive" />
        <h1 className="font-display text-2xl font-bold">
          {t("noPermission")}
        </h1>
        <Button asChild>
          <Link href={session?.user ? "/" : "/login"}>
            {session?.user ? t("backToSite") : "Đăng nhập"}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <AdminSidebar role={session.user.role} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
