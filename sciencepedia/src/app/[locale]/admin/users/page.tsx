import { getTranslations, setRequestLocale } from "next-intl/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { RoleSelect } from "@/components/admin/role-select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin");
  const session = await auth();

  const users = await prisma.user.findMany({
    orderBy: [{ role: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      _count: { select: { articles: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        {t("users")}
      </h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("users")}</TableHead>
            <TableHead className="w-24 text-right">{t("articles")}</TableHead>
            <TableHead className="w-32">{t("save")}</TableHead>
            <TableHead className="w-44">{t("role")}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <span className="flex items-center gap-3">
                  <Avatar className="size-8">
                    {user.image && <AvatarImage src={user.image} alt="" />}
                    <AvatarFallback>
                      {(user.name ?? user.email)[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex flex-col">
                    <span className="font-medium">{user.name ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </span>
                </span>
              </TableCell>

              <TableCell className="text-right tabular-nums">
                {user._count.articles}
              </TableCell>

              <TableCell className="text-muted-foreground">
                {formatDate(user.createdAt, locale)}
              </TableCell>

              <TableCell>
                <RoleSelect
                  userId={user.id}
                  role={user.role}
                  // Không cho tự đổi quyền của chính mình ngay trên bảng
                  disabled={user.id === session?.user?.id}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
