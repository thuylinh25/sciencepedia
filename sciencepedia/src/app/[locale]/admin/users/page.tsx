import { getTranslations, setRequestLocale } from "next-intl/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { atLeast } from "@/lib/roles";
import { Link } from "@/i18n/navigation";
import { getActivitySummaries } from "@/server/activity";
import { RoleSelect } from "@/components/admin/role-select";
import { UserCreate } from "@/components/admin/user-create";
import { ResetLinkButton } from "@/components/admin/reset-link-button";
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

  // Lịch sử xem là dữ liệu hành vi cá nhân: chỉ ADMIN thấy, kể cả khi trang
  // này lọt tới quyền thấp hơn. MỘT truy vấn GROUP BY cho cả bảng, không N+1.
  const isAdmin = atLeast(session?.user?.role ?? "USER", "ADMIN");
  // Lỗi (vd. code lên trước migration `content_activity`) thì ẩn cột, không
  // kéo sập cả trang quản lý người dùng.
  const activity = isAdmin
    ? await getActivitySummaries(users.map((user) => user.id)).catch(
        (error: Error) => {
          console.error("[admin/users] không đọc được lịch sử xem:", error.message);
          return null;
        },
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Tiêu đề và nút tạo cùng một hàng: nút là hành động DUY NHẤT của
          trang này, nên nó thuộc về hàng tiêu đề chứ không trôi xuống dưới
          bảng — nơi người ta phải cuộn qua cả danh sách mới thấy. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {t("users")}
        </h1>
        <UserCreate />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("users")}</TableHead>
            <TableHead className="w-24 text-right">{t("articles")}</TableHead>
            {activity && (
              <TableHead className="w-44">{t("activity.column")}</TableHead>
            )}
            <TableHead className="w-32">{t("save")}</TableHead>
            <TableHead className="w-64">{t("resetLink")}</TableHead>
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
                    {activity ? (
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-medium hover:underline"
                      >
                        {user.name ?? "—"}
                      </Link>
                    ) : (
                      <span className="font-medium">{user.name ?? "—"}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </span>
                </span>
              </TableCell>

              <TableCell className="text-right tabular-nums">
                {user._count.articles}
              </TableCell>

              {activity && (
                <TableCell>
                  {(() => {
                    const summary = activity.get(user.id);
                    return (
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="flex flex-col rounded-sm hover:underline focus-visible:underline"
                        aria-label={`${t("activity.action")}: ${user.name ?? user.email}`}
                      >
                        <span className="text-sm tabular-nums">
                          {t("activity.summary", {
                            articles: summary?.articles ?? 0,
                            models: summary?.models ?? 0,
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {summary?.lastActivityAt
                            ? formatDate(summary.lastActivityAt, locale)
                            : t("activity.never")}
                        </span>
                      </Link>
                    );
                  })()}
                </TableCell>
              )}

              <TableCell className="text-muted-foreground">
                {formatDate(user.createdAt, locale)}
              </TableCell>

              {/* Chỉ hiện với tài khoản CÓ email. Tài khoản đăng nhập bằng
                  OAuth mà nhà cung cấp không trả email thì không đặt lại mật
                  khẩu được — chúng không có mật khẩu để đặt lại. */}
              <TableCell>
                {user.email ? <ResetLinkButton email={user.email} /> : "—"}
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
