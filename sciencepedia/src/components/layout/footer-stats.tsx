"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Compass, FileText, Layers, Tags } from "lucide-react";

import type { Locale } from "@/i18n/routing";
import { atLeast } from "@/lib/roles";
import { formatMeasure } from "@/lib/utils";
import { CountUp } from "@/components/layout/count-up";

type Stats = {
  articles: number;
  categories: number;
  tags: number;
  views: number;
};

/**
 * Dải số liệu kho, CHỈ hiện với quản trị.
 *
 * ## Vì sao là Client Component chứ không kiểm quyền ở server
 *
 * Footer nằm trong layout của mọi trang. Kiểm quyền ở server nghĩa là gọi
 * `auth()` trong layout, mà `auth()` đọc cookie — một lần đọc cookie ở đó là
 * cả 267 trang tĩnh rơi xuống dynamic. Cái giá ấy quá đắt cho một dải số
 * liệu, và nó đi ngược quy tắc đầu tiên của dự án.
 *
 * Đây cũng là lý do `UserMenu` trên header dùng `useSession()` chứ không đọc
 * phiên ở server: cả site giữ được tĩnh chính nhờ nguyên tắc đó.
 *
 * ## Vì sao số liệu đi qua API chứ không nằm sẵn trong props
 *
 * Truyền số từ server xuống rồi ẩn bằng CSS thì con số vẫn nằm trong HTML —
 * ai xem mã nguồn cũng đọc được, tức là không giấu gì cả, chỉ làm cho mình
 * tưởng là đã giấu. `/api/admin/stats` có `requireRole("ADMIN")` thật, nên
 * người không phải quản trị không có đường nào lấy được con số.
 *
 * Phần thưởng kèm theo: footer thôi chạy hai truy vấn CSDL trên mọi trang.
 */
export function FooterStats({ toolCount }: { toolCount: number }) {
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
        // Số liệu là thứ trang trí cho quản trị; hỏng thì im lặng bỏ qua chứ
        // không dựng một thông báo lỗi ở footer của mọi trang.
      });

    return () => {
      alive = false;
    };
  }, [isAdmin]);

  if (!isAdmin || !stats) return null;

  /* Bốn con số, tất cả đếm được. "Công cụ tương tác" là chính mảng `tools`
     của footer trừ trợ lý AI — truyền xuống chứ không viết một số riêng, để
     hai chỗ không lệch nhau khi thêm công cụ mới. */
  /* Mỗi ô một màu nhận dạng riêng, đặt trên ô icon chứ KHÔNG trên con số:
     bốn phép đếm cùng loại, tô mỗi số một màu sẽ ngụ ý chúng khác hạng nhau.
     Bốn màu này trùng bảng màu đã dùng cho thẻ công cụ ở trang chủ. */
  const figures = [
    {
      n: stats.articles,
      label: t("statArticles"),
      icon: FileText,
      tint: "#3b82f6",
    },
    { n: toolCount, label: t("statTools"), icon: Compass, tint: "#10b981" },
    {
      n: stats.categories,
      label: t("statFields"),
      icon: Layers,
      tint: "#8b5cf6",
    },
    { n: stats.tags, label: t("statTopics"), icon: Tags, tint: "#f59e0b" },
  ].map((figure) => ({ ...figure, value: formatMeasure(figure.n, locale) }));

  return (
    <div className="border-b">
      <div className="container-page py-10">
        {/* Vạch vàng ngắn phía trên tiêu đề: dải này là khối duy nhất trong
            footer mang số liệu, và nó nằm ngay dưới một trang nội dung dài —
            không có gì đánh dấu chỗ bắt đầu thì mắt đọc tiếp như thể vẫn còn
            trong bài. */}
        <span aria-hidden className="block h-1 w-12 rounded-full bg-primary" />
        <p className="mt-4 text-xs font-semibold tracking-widest text-foreground/80 uppercase">
          {t("statsTitle")}
        </p>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {figures.map((figure) => (
            <div
              key={figure.label}
              className="group rounded-2xl border bg-card/50 p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center gap-4">
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
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
