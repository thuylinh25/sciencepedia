"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { ArrowRight, Compass, FileText, Layers, Tags } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { atLeast } from "@/lib/roles";
import { formatMeasure } from "@/lib/utils";
import { INTERACTIVE_TOOL_COUNT } from "@/lib/site-tools";
import { CountUp } from "@/components/layout/count-up";

type Stats = {
  articles: number;
  categories: number;
  tags: number;
  views: number;
};

/**
 * Dải số liệu kho, CHỈ hiện với quản trị và CHỈ trên trang Hồ sơ.
 *
 * ## Vì sao rời footer
 *
 * Khối này đã bị thu hẹp ba lần, mỗi lần vì cùng một lý do. Đầu tiên nó hiện
 * cho mọi người ở đầu footer để trả lời "đây là nền tảng cỡ nào". Rồi thu về
 * chỉ quản trị, vì với một kho đang xây thì một dải số nhỏ in ở mọi trang nói
 * về quy mô nhiều hơn là về nội dung. Giờ nó rời footer hẳn: footer đứng dưới
 * MỌI trang, kể cả những trang mà số liệu vận hành không dính gì tới thứ
 * người đọc vừa đọc. Trang Hồ sơ là chỗ duy nhất người xem đang chủ động nhìn
 * vào tài khoản của mình, nên số liệu vận hành ở đó mới đúng ngữ cảnh.
 *
 * ## Vì sao vẫn là Client Component dù trang Hồ sơ đã `force-dynamic`
 *
 * Kiểm quyền ở server là gọi `auth()`, và trang Hồ sơ vốn đã gọi rồi — nên
 * riêng ở đây đổi sang server sẽ không tốn gì. Nhưng số liệu vẫn phải đi qua
 * `/api/admin/stats`: truyền số từ server xuống rồi ẩn bằng CSS thì con số
 * vẫn nằm trong HTML, ai xem mã nguồn cũng đọc được — tức không giấu gì cả,
 * chỉ làm cho mình tưởng là đã giấu. API có `requireRole("ADMIN")` thật.
 *
 * Giữ nguyên dạng client vì thế: đằng nào cũng phải fetch sau khi mount, và
 * `useSession()` cho phép khối này rơi im lặng ở mọi chỗ khác nếu sau này có
 * ai đặt lại nó lên một trang tĩnh.
 */
export function LibraryStats() {
  const t = useTranslations("footer");
  const locale = useLocale() as Locale;
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);

  const isAdmin = atLeast(session?.user?.role, "ADMIN");

  useEffect(() => {
    if (!isAdmin) return;

    let alive = true;
    fetch("/api/admin/stats")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Stats | null) => {
        if (alive && data) setStats(data);
      })
      .catch(() => {
        // Số liệu là thứ phụ trợ cho quản trị; hỏng thì im lặng bỏ qua chứ
        // không dựng một thông báo lỗi trên trang Hồ sơ của người dùng.
      });

    return () => {
      alive = false;
    };
  }, [isAdmin]);

  if (!isAdmin || !stats) return null;

  /* Bốn con số, tất cả đếm được. "Công cụ tương tác" suy ra từ `SITE_TOOLS` —
     cùng mảng mà footer dựng danh sách công cụ — chứ không viết một số riêng,
     để hai chỗ không lệch nhau khi thêm công cụ mới. */
  /* Mỗi ô một màu nhận dạng riêng, đặt trên ô icon chứ KHÔNG trên con số:
     bốn phép đếm cùng loại, tô mỗi số một màu sẽ ngụ ý chúng khác hạng nhau.
     Bốn màu này trùng bảng màu đã dùng cho thẻ công cụ ở trang chủ. */
  /* Mỗi thẻ dẫn tới trang LIỆT KÊ đúng thứ nó đang đếm. Một con số không bấm
     được thì chỉ là một con số; bấm được thì nó thành lối vào.

     "Công cụ tương tác" dẫn về /models, và trang đó liệt kê đủ cả năm — ba mô
     hình 3D cộng bản đồ bầu trời và hành trình thu phóng. Con số ở đây suy ra
     từ `SITE_TOOLS`, còn trang kia dựng từ `MODEL_STEPS` + `EXPLORE_TOOLS`;
     thêm công cụ mới thì phải chạm cả hai chỗ, nếu không con số và trang sẽ
     lệch nhau. */
  const figures = [
    {
      n: stats.articles,
      label: t("statArticles"),
      icon: FileText,
      tint: "#3b82f6",
      href: "/articles",
    },
    {
      n: INTERACTIVE_TOOL_COUNT,
      label: t("statTools"),
      icon: Compass,
      tint: "#10b981",
      href: "/models",
    },
    {
      n: stats.categories,
      label: t("statFields"),
      icon: Layers,
      tint: "#8b5cf6",
      href: "/categories",
    },
    {
      n: stats.tags,
      label: t("statTopics"),
      icon: Tags,
      tint: "#f59e0b",
      href: "/tags",
    },
  ].map((figure) => ({ ...figure, value: formatMeasure(figure.n, locale) }));

  /* Không còn `border-b` và `container-page` như hồi ở footer: khối này giờ
     nằm TRONG phần thân trang Hồ sơ, vốn đã có sẵn cả hai. Lồng thêm một lần
     nữa sẽ thụt lề hai lớp và kẻ một đường ngang giữa trang. */
  return (
    <section className="mt-12">
      {/* Vạch vàng ngắn phía trên tiêu đề: đánh dấu chỗ khối số liệu bắt đầu,
          để mắt không đọc tiếp nó như phần đuôi của thẻ hồ sơ ngay bên trên. */}
      <span aria-hidden className="block h-1 w-12 rounded-full bg-primary" />
      <p className="mt-4 text-xs font-semibold tracking-widest text-foreground/80 uppercase">
        {t("statsTitle")}
      </p>

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {figures.map((figure) => (
          /* Liên kết PHỦ thẻ chứ không bọc thẻ.

             `<dl>` chỉ nhận `dt`, `dd` và `div` làm con trực tiếp — đặt một
             `<a>` ở đó là HTML sai, và trình đọc màn hình mất luôn quan hệ
             thuật ngữ–định nghĩa giữa nhãn và con số. Nên thẻ vẫn là `div`,
             còn liên kết trải kín bằng `absolute inset-0`: cả thẻ vẫn bấm
             được, cấu trúc `dl` vẫn đúng.

             Mũi tên chỉ là hình, `aria-hidden` — tên của liên kết lấy từ
             `aria-label`, vì chữ trong thẻ nằm ngoài thẻ `<a>`. */
          <div
            key={figure.label}
            className="group relative flex items-center justify-between gap-4 rounded-2xl border bg-card/50 p-5 transition-colors focus-within:border-primary/40 hover:border-primary/40"
          >
            <Link
              href={figure.href}
              aria-label={figure.label}
              className="absolute inset-0 rounded-2xl focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
            />

            <div className="flex min-w-0 items-center gap-4">
              <span
                aria-hidden
                className="flex size-12 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: figure.tint }}
              >
                <figure.icon className="size-5 text-white" />
              </span>

              {/* `flex-col-reverse` để MÃ đúng thứ tự ngữ nghĩa (dt trước
                    dd) mà MẮT vẫn thấy con số trước nhãn. */}
              <div className="flex min-w-0 flex-col-reverse">
                <dt className="mt-1 truncate text-sm text-muted-foreground">
                  {figure.label}
                </dt>
                <dd>
                  <CountUp
                    value={figure.n}
                    formatted={figure.value}
                    className="block font-display text-4xl font-bold tracking-tight text-foreground tabular-nums transition-colors group-hover:text-primary-strong"
                  />
                </dd>
              </div>
            </div>

            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background/40 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:border-primary/40 group-hover:text-primary-strong"
            >
              <ArrowRight className="size-4" />
            </span>
          </div>
        ))}
      </dl>
    </section>
  );
}
