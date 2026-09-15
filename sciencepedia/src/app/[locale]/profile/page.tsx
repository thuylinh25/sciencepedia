import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Bookmark,
  CalendarDays,
  Crown,
  FileText,
  Mail,
  MessageCircle,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { SectionHeading } from "@/components/section-heading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LibraryStats } from "@/components/profile/library-stats";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const t = await getTranslations("auth");
  const tAdmin = await getTranslations("admin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      bio: true,
      role: true,
      createdAt: true,
      _count: { select: { articles: true, bookmarks: true, comments: true } },
    },
  });

  if (!user) redirect(`/${locale}/login`);

  const roleLabel = {
    USER: tAdmin("roleUser"),
    EDITOR: tAdmin("roleEditor"),
    ADMIN: tAdmin("roleAdmin"),
  }[user.role];

  return (
    <div className="container-page py-16">
      <SectionHeading title={t("profile")} />

      {/* Thẻ hồ sơ chia làm hai nửa, ngăn bằng một đường kẻ.

          Bản trước xếp avatar, thông tin và ba con số thành ba khối ngang
          hàng, cách nhau bằng khoảng trắng. Ở màn rộng thì ba con số trôi ra
          giữa khoảng không bên phải và không rõ chúng thuộc về ai — chúng đọc
          ra như một khối riêng tình cờ nằm cùng thẻ. Đường kẻ nói rõ đây là
          MỘT thẻ có hai phần: bên trái là danh tính, bên phải là hoạt động.

          Kẻ dọc chỉ từ lg trở lên. Dưới ngưỡng đó thẻ xếp chồng nên đường kẻ
          phải nằm ngang, nếu không nó cắt ngang chỗ không có gì để ngăn. */}
      <div className="flex flex-col gap-8 rounded-2xl border bg-card p-8 lg:flex-row lg:items-center lg:gap-10">
        <div className="flex flex-1 flex-col gap-6 sm:flex-row sm:items-start">
          {/* Vòng sáng quanh avatar.

              Chữ cái thay ảnh vốn là một đĩa phẳng cùng tông với nền thẻ, nên
              nó đọc ra như một ô trống chứ không như chân dung. `ring` cộng
              nền chuyển sắc cho nó đủ khối để mắt nhận ra đây là chỗ của một
              con người — và vẫn đúng khi người dùng có ảnh thật, vì vòng sáng
              nằm ngoài khung ảnh. */}
          <Avatar className="size-24 shrink-0 ring-4 ring-primary/15">
            {user.image && <AvatarImage src={user.image} alt="" />}
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 font-display text-3xl font-bold text-white">
              {(user.name ?? user.email)[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-bold">
                {user.name ?? user.email}
              </h2>
              <Badge variant="soft" className="gap-1.5">
                <Crown aria-hidden className="size-3.5" />
                {roleLabel}
              </Badge>
            </div>

            {/* Email và ngày tham gia đều mang icon dẫn.

                Hai dòng này cùng cỡ chữ mờ và nằm trên dưới nhau, nên trước
                đây phải ĐỌC mới biết dòng nào là gì — mà ngày tháng thì không
                tự nói nó là ngày gì. Icon trả lời trước khi đọc, và nhãn
                "Tham gia" trả lời phần còn lại. */}
            <p className="mt-2 flex items-center gap-2 text-sm break-all text-muted-foreground">
              <Mail aria-hidden className="size-4 shrink-0" />
              {user.email}
            </p>

            {user.bio && (
              <p className="mt-3 text-sm leading-relaxed">{user.bio}</p>
            )}

            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays aria-hidden className="size-4 shrink-0" />
              {t("joined")}: {formatDate(user.createdAt, locale)}
            </p>
          </div>
        </div>

        {/* Ba con số nhận icon riêng, và icon đứng TRÊN con số.

            Nhãn dưới con số vẫn giữ — icon một mình thì mơ hồ, nhất là dấu
            trang với bình luận. Nhưng icon đứng trên cho người lướt nhận ra
            cột nào là cột nào mà không phải đọc ba nhãn cỡ chữ nhỏ. */}
        <dl className="grid shrink-0 grid-cols-3 gap-6 border-t pt-6 text-center lg:gap-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          {[
            {
              label: tAdmin("articles"),
              value: user._count.articles,
              icon: FileText,
            },
            {
              label: t("myBookmarks"),
              value: user._count.bookmarks,
              icon: Bookmark,
            },
            {
              label: t("myComments"),
              value: user._count.comments,
              icon: MessageCircle,
            },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <item.icon
                aria-hidden
                className="size-5 text-primary-strong/70"
              />
              <dd className="mt-2 font-display text-3xl font-bold tabular-nums">
                {item.value}
              </dd>
              <dt className="mt-1 text-xs text-muted-foreground">
                {item.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>

      {/* Số liệu kho — tự ẩn với người không phải quản trị. Đặt ở đây thay vì
          trong footer: xem chú thích đầu `library-stats.tsx`. */}
      <LibraryStats />
    </div>
  );
}
