import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, LayoutGrid } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { modelNeighbours, type ModelStep } from "@/lib/models";

/**
 * Bậc thang kích thước ở cuối mỗi trang mô hình 3D.
 *
 * Ba cảnh được giữ tách rời chứ không gộp thành một cảnh phóng to liền mạch:
 * dải tỉ lệ cần bao là khoảng 19 bậc độ lớn, vượt xa độ chính xác của số thực
 * 32-bit mà WebGL dùng, nên hình học sẽ giật và rung. Liên kết hai chiều ở đây
 * cho người đọc cảm nhận được thang bậc liên tục mà mỗi cảnh vẫn giữ được chất
 * lượng riêng.
 */
export async function ScaleLadder({ current }: { current: string }) {
  const t = await getTranslations("models");
  const locale = (await getLocale()) as Locale;
  const { previous, next } = modelNeighbours(current);

  const name = (step: ModelStep) =>
    locale === "en" ? step.nameEn : step.name;
  const scale = (step: ModelStep) =>
    locale === "en" ? step.scaleEn : step.scale;

  return (
    <nav aria-label={t("ladderTitle")} className="mt-12 border-t pt-8">
      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        {t("ladderTitle")}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {previous ? (
          <Link
            href={previous.href}
            className="group flex items-center gap-4 rounded-2xl border p-5 transition-colors hover:border-accent hover:bg-accent/5"
          >
            <ArrowLeft className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1" />
            <span>
              <span className="block text-xs text-muted-foreground">
                {t("zoomIn")}
              </span>
              <span
                className="block font-display text-lg font-semibold"
                style={{ color: previous.color }}
              >
                {name(previous)}
              </span>
              <span className="block text-xs text-muted-foreground">
                {scale(previous)}
              </span>
            </span>
          </Link>
        ) : (
          <span />
        )}

        {next && (
          <Link
            href={next.href}
            className="group flex items-center justify-end gap-4 rounded-2xl border p-5 text-right transition-colors hover:border-accent hover:bg-accent/5"
          >
            <span>
              <span className="block text-xs text-muted-foreground">
                {t("zoomOut")}
              </span>
              <span
                className="block font-display text-lg font-semibold"
                style={{ color: next.color }}
              >
                {name(next)}
              </span>
              <span className="block text-xs text-muted-foreground">
                {scale(next)}
              </span>
            </span>
            <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      <Link
        href="/models"
        className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <LayoutGrid className="size-4" />
        {t("allModels")}
      </Link>
    </nav>
  );
}
