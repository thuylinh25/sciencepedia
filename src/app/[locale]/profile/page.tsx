import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { SectionHeading } from "@/components/section-heading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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

      <div className="flex flex-col gap-6 rounded-2xl border bg-card p-8 sm:flex-row sm:items-center">
        <Avatar className="size-20">
          {user.image && <AvatarImage src={user.image} alt="" />}
          <AvatarFallback className="text-2xl">
            {(user.name ?? user.email)[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-bold">
              {user.name ?? user.email}
            </h2>
            <Badge variant="soft">{roleLabel}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          {user.bio && <p className="mt-3 text-sm">{user.bio}</p>}
          <p className="mt-3 text-xs text-muted-foreground">
            {formatDate(user.createdAt, locale)}
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-4 text-center sm:gap-6">
          {[
            { label: tAdmin("articles"), value: user._count.articles },
            { label: t("myBookmarks"), value: user._count.bookmarks },
            { label: "Bình luận", value: user._count.comments },
          ].map((item) => (
            <div key={item.label}>
              <dd className="font-display text-2xl font-bold">{item.value}</dd>
              <dt className="text-xs text-muted-foreground">{item.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
