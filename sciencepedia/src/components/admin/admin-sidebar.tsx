"use client";

import { useTranslations } from "next-intl";
import type { Role } from "@prisma/client";
import {
  ArrowLeft,
  FileText,
  FolderTree,
  LayoutDashboard,
  Tags,
  Users,
} from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { atLeast } from "@/lib/roles";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", key: "dashboard" as const, icon: LayoutDashboard, exact: true, min: "EDITOR" as Role },
  { href: "/admin/articles", key: "articles" as const, icon: FileText, min: "EDITOR" as Role },
  { href: "/admin/categories", key: "categories" as const, icon: FolderTree, min: "ADMIN" as Role },
  { href: "/admin/tags", key: "tags" as const, icon: Tags, min: "EDITOR" as Role },
  { href: "/admin/users", key: "users" as const, icon: Users, min: "ADMIN" as Role },
];

export function AdminSidebar({ role }: { role: Role }) {
  const t = useTranslations("admin");
  const pathname = usePathname();

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <p className="mb-4 font-display text-lg font-bold tracking-tight">
        {t("title")}
      </p>

      <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {ITEMS.filter((item) => atLeast(role, item.min)).map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary-strong"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/"
        className="mt-6 hidden items-center gap-2 px-3.5 text-sm text-muted-foreground transition-colors hover:text-foreground lg:flex"
      >
        <ArrowLeft className="size-4" />
        {t("backToSite")}
      </Link>
    </aside>
  );
}
