"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Orbit } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { HeroGlobe } from "@/components/home/hero-globe";

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
          giãn thì ở 1024px quả cầu chiếm gần nửa bề ngang và bóp cột chữ xuống
          mức tiêu đề phải xuống bốn dòng. */}
      <div className="container-page relative z-10 grid min-h-[min(70svh,36rem)] items-center gap-10 pt-14 pb-20 text-star lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14 lg:pt-20 lg:pb-24">
        <div className="flex flex-col justify-center">
          <motion.p
            {...rise(0)}
            className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-widest text-white/90 uppercase backdrop-blur"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-accent" />
            {t("heroEyebrow")}
          </motion.p>

          {/* leading 1.08 chứ không 1.05: dấu thanh tiếng Việt (ẫ, ỗ, ằ) chạm
            dòng trên ở 1.05. */}
          <motion.h1
            {...rise(0.08)}
            className="max-w-4xl font-display text-4xl leading-[1.08] font-bold tracking-tight text-balance text-white sm:text-5xl lg:text-6xl"
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
            navbar và cạnh tranh trực tiếp với ô tìm kiếm ngay phía trên. */}
          <motion.div {...rise(0.32)} className="mt-6 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              variant="glass"
              className="border-white/25 bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="/solar-system">
                <Orbit className="size-4" />
                {t("heroCtaSecondary")}
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Ẩn hẳn dưới lg thay vì để xuống dưới: hero vừa được hạ từ 88vh
            xuống 70vh cho vừa màn hình đầu, thêm một ô vuông nữa vào cột dọc
            là trả lại đúng chỗ vừa lấy được. */}
        <div className="hidden lg:block">
          <HeroGlobe />
        </div>
      </div>
    </section>
  );
}
