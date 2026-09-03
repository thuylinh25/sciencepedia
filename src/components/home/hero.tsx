"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Rocket } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { HeroGalaxy } from "@/components/home/hero-galaxy";

/**
 * `search` là một slot: ô tìm kiếm phải là Server Component (chạy khi tắt JS,
 * không hook nào) nhưng Hero buộc phải là client vì framer-motion. Server
 * Component không import được vào client, nên trang chủ render nó rồi truyền
 * xuống đây qua prop.
 */
export function Hero({
  search,
  fields,
}: {
  search?: ReactNode;
  fields?: ReactNode;
}) {
  const t = useTranslations("home");
  const locale = useLocale();
  const reduced = useReducedMotion();

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 24 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduced ? 0 : 0.7,
      delay: reduced ? 0 : delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

  return (
    <section className="bg-cosmos starfield relative isolate overflow-hidden">
      {/* Quầng sáng nền, chuyển động rất chậm */}
      <div
        aria-hidden
        className="animate-aurora pointer-events-none absolute -top-1/3 left-1/2 size-[70rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--color-chart-1), transparent 65%)",
        }}
      />

      {/* Chuyển mềm sang nền trang.
          Phải đứng TRƯỚC khối nội dung trong DOM: là sibling không có z-index,
          thứ tự nguồn quyết định thứ tự chồng. Ở bản cũ nó đứng sau và không có
          `pointer-events-none`, nên khi hero thấp lại nó trùm lên hàng nút và
          nuốt cú nhấp. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-background"
      />

      {/* Padding bất đối xứng có chủ đích: StatsBand đè lên đáy hero bằng
          `-mt-10`, nên khoảng trống dưới phải dư ra chừng đó. */}
      {/* Hai cột từ lg trở lên. Cột phải cố định 24rem thay vì `1fr`: để nó co
          giãn thì ở 1024px thiên hà chiếm gần nửa bề ngang và bóp cột chữ xuống
          mức tiêu đề phải xuống bốn dòng. 28rem là mức cân được với cột chữ đã
          thu hẹp còn max-w-3xl. */}
      <div className="container-page relative z-10 grid min-h-[min(64svh,34rem)] items-center gap-10 pt-12 pb-14 text-star lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-14 lg:pt-16 lg:pb-16">
        <div className="flex flex-col justify-center">
          <motion.p
            {...rise(0)}
            className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-widest text-white/90 uppercase backdrop-blur"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-accent" />
            {t("heroEyebrow")}
          </motion.p>

          {/* Bề ngang 44rem (704px) chứ không 48rem: ở 48rem tiêu đề chiếm gần
            hết cột trái và đẩy mắt chạy ngang quá xa trước khi xuống dòng.

            leading 1.08 chứ KHÔNG 1.05, dù 1.05 nhìn chặt hơn. Tiếng Việt xếp
            hai tầng dấu — "ẫ", "ỗ", "ằ" có mũ chồng dấu thanh — nên phần nhô
            lên cao hơn hẳn chữ Latin không dấu. Ở 1.05 với cỡ chữ 60px, dấu
            của dòng dưới chạm chân dòng trên. Chính tiêu đề này ("Vũ trụ trong
            tầm tay bạn") có ũ, ầ, ạ, và nay bề ngang hẹp lại nên nó xuống hai
            dòng ở nhiều bề rộng màn hình — tức rủi ro đó chuyển từ lý thuyết
            thành thường trực. Đây là chỗ chữ Latin cho phép chặt hơn chữ Việt,
            và bản tiếng Việt là bản chính. */}
          <motion.h1
            {...rise(0.08)}
            className="max-w-[44rem] font-display text-4xl leading-[1.08] font-bold tracking-tight text-balance text-white sm:text-5xl lg:text-6xl"
          >
            {t("heroTitle")}
          </motion.h1>

          <motion.p
            {...rise(0.16)}
            className="mt-5 max-w-2xl text-lg leading-[1.55] text-pretty text-white/75"
          >
            {t("heroSubtitle")}
          </motion.p>

          {search && (
            <motion.div {...rise(0.2)} className="mt-6">
              {search}
            </motion.div>
          )}

          {fields && (
            <motion.div {...rise(0.26)} className="mt-5">
              {fields}
            </motion.div>
          )}

          {/* Một nút, không hai. "Bắt đầu khám phá" trùng đúng mục "Khám phá" trên
            navbar và cạnh tranh trực tiếp với ô tìm kiếm ngay phía trên.

            Dùng `accent` (xanh) chứ KHÔNG dùng `primary` (vàng): vàng đã thuộc
            về nút tìm kiếm ngay phía trên. Hai nút vàng cạnh nhau thì không
            nút nào còn là nút chính, và mắt phải tự chọn — đúng thứ thứ bậc
            thị giác sinh ra để tránh. Xanh accent tách bạch, đủ nổi trên nền
            vũ trụ, và vẫn xếp sau vàng.

            Quầng sáng dùng `--color-accent` chứ không phải một mã màu viết
            cứng, để nó tự theo nếu bảng màu đổi lần nữa. */}
          <motion.div {...rise(0.32)} className="mt-6 flex flex-wrap gap-3">
            <Button
              asChild
              size="xl"
              variant="accent"
              className="shadow-[0_0_36px_-6px_var(--color-accent)] transition-shadow hover:shadow-[0_0_52px_-4px_var(--color-accent)]"
            >
              <Link href="/solar-system">
                <Rocket className="size-4" />
                {t("heroCtaSecondary")}
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Ẩn hẳn dưới lg thay vì để xuống dưới: hero vừa được hạ từ 88vh
            xuống 70vh cho vừa màn hình đầu, thêm một ô vuông nữa vào cột dọc
            là trả lại đúng chỗ vừa lấy được. */}
        <div className="hidden lg:block">
          <HeroGalaxy locale={locale} />
        </div>
      </div>
    </section>
  );
}
