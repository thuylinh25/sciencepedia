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
        {/* Khối danh tính KHÔNG nở.

            Trước đây nó mang `flex-1`, tức chiếm hết chiều ngang còn lại và
            đẩy khối số liệu ra sát mép phải thẻ. Nhưng nội dung bên trong đã
            bị chặn bề rộng từ trước — tiểu sử dừng ở 38ch — nên phần nở thêm
            chỉ là khoảng trống, và nó rơi vào ĐÚNG GIỮA hai nhóm. Một khoảng
            trống ở giữa thì đọc ra là hai khối rời nhau, không phải một thẻ.

            Bỏ `flex-1` thì hai nhóm đứng liền nhau, cách nhau đúng `gap`, và
            chỗ thừa dồn về mép phải — nơi nó là lề, không phải vết nứt. */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Vòng sáng quanh avatar.

              Chữ cái thay ảnh vốn là một đĩa phẳng cùng tông với nền thẻ, nên
              nó đọc ra như một ô trống chứ không như chân dung. `ring` cộng
              nền chuyển sắc cho nó đủ khối để mắt nhận ra đây là chỗ của một
              con người — và vẫn đúng khi người dùng có ảnh thật, vì vòng sáng
              nằm ngoài khung ảnh. */}
          {/* Nền avatar dùng token `accent`, không phải mã màu viết cứng.

              Bản trước là `from-indigo-500 to-violet-600` — hai màu tím lấy
              thẳng từ bảng Tailwind, không có trong hệ token của dự án. Kết
              quả là một đĩa tím không khớp với bất cứ thứ gì khác trên trang.
              `accent` chính là màu xanh đang tô nửa sau tiêu đề hero, nên
              avatar và điểm nhấn lớn nhất của site giờ cùng một màu.

              Đi kèm `text-accent-foreground` chứ không phải `text-white`:
              cặp token này đã được chọn để tương phản ở CẢ hai theme — ở giao
              diện sáng nền xanh đậm chữ gần trắng, ở giao diện tối nền xanh
              nhạt chữ gần đen. Viết cứng `text-white` thì theme sáng còn đúng,
              theme tối thành trắng trên xanh nhạt.

              Vòng sáng đổi từ `primary` (vàng) sang `accent`: một vành vàng
              quanh đĩa xanh là hai màu thương hiệu chọi nhau ở cùng một chỗ. */}
          <Avatar className="size-24 shrink-0 ring-4 ring-accent/20">
            {user.image && <AvatarImage src={user.image} alt="" />}
            <AvatarFallback className="bg-accent font-display text-3xl font-bold text-accent-foreground">
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

            {/* Bề rộng đọc chặn ở 38ch, không để tiểu sử chạy hết chiều ngang
                thẻ.

                Ở bề rộng đầy đủ, câu giới thiệu 107 ký tự vắt thành hai dòng
                mà dòng thứ hai chỉ còn một chữ — một dòng cụt ngay giữa thẻ,
                và mắt đọc nó ra như chữ bị rớt chứ không như hết câu. 38ch
                chia câu thành ba dòng gần đều nhau.

                Dùng `ch` chứ không `rem`: đơn vị này đo theo bề rộng ký tự
                của chính phông đang dùng, nên số dòng giữ nguyên khi cỡ chữ
                gốc đổi. Trên màn hẹp thì bề rộng thẻ mới là thứ chặn trước,
                và câu tự vắt thêm dòng — đúng như mong đợi.

                `text-pretty` lo nốt phần còn lại: nó cấm để lại một chữ đơn
                độc ở dòng cuối, thứ mà một con số bề rộng cố định không bảo
                đảm được cho mọi ngôn ngữ. */}
            {user.bio && (
              <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-pretty">
                {user.bio}
              </p>
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
            cột nào là cột nào mà không phải đọc ba nhãn cỡ chữ nhỏ.

            ## Vạch ngăn giữa các cột, không phải khoảng trắng

            Ba cột trước đây chỉ cách nhau bằng `gap`. Ba con số một chữ số
            nằm giữa ba vùng trống rộng thì mắt không nối được số với nhãn cho
            tới khi đọc — nhất là khi cả ba cùng ngắn và cùng cỡ. `divide-x`
            kẻ một đường mảnh giữa hai cột liền nhau, rẻ hơn nhiều so với nới
            rộng khoảng cách và không làm khối này phình ra.

            Khoảng cách chuyển từ `gap` sang `px` trên từng ô: `gap` đẩy vạch
            lệch khỏi khoảng giữa hai cột, còn padding giữ vạch đúng chính
            giữa.

            ## Vì sao icon không cùng một màu

            Cả ba trước đây đều vàng, nên chúng đọc ra như ba bản sao của một
            huy hiệu chứ không như ba thứ khác nhau. Vàng là màu thương hiệu;
            tô cả ba thì nó thôi trỏ vào cái gì cụ thể.

            Nay chỉ "Đã lưu" giữ vàng — đó là thứ DUY NHẤT trong ba cái do
            chính người dùng chủ động tạo ra, và cũng là màu của nút Lưu bài
            trên trang bài viết. Hai cột kia là số liệu quan sát được nên lấy
            màu `accent`, cùng màu với avatar ngay bên cạnh. */}
        <dl className="grid shrink-0 grid-cols-3 divide-x border-t pt-6 text-center lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
          {[
            {
              label: tAdmin("articles"),
              value: user._count.articles,
              icon: FileText,
              tint: "text-accent",
            },
            {
              label: t("myBookmarks"),
              value: user._count.bookmarks,
              icon: Bookmark,
              tint: "text-primary-strong",
            },
            {
              label: t("myComments"),
              value: user._count.comments,
              icon: MessageCircle,
              tint: "text-accent",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center px-5 lg:px-6"
            >
              <item.icon aria-hidden className={`size-6 ${item.tint}`} />
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
