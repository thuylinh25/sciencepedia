"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  BookOpen,
  Copy,
  Database,
  Eye,
  ExternalLink,
  Link2,
  Target,
} from "lucide-react";

import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { formatCoordinates } from "@/lib/sky-coords";
import {
  SKY_TARGETS,
  VISIBILITY_LABELS,
  type SkySurvey,
  type SkyTarget,
} from "@/lib/sky-data";
import { cn } from "@/lib/utils";

/**
 * Bảng thông tin về thiên thể đang xem, đặt ngay dưới khung bản đồ.
 *
 * ## Vì sao chỉ có những trường này
 *
 * Bản mô tả đề nghị một infobox gồm loại, khoảng cách, chòm sao, kích thước
 * góc và độ sáng biểu kiến. Ba trường đầu có thật trong `sky-data.ts`; hai
 * trường sau thì KHÔNG, và chúng không được bịa ra:
 *
 * - **Kích thước góc.** `fovDeg` trông như ứng viên nhưng nó là bề rộng KHUNG
 *   NHÌN do người biên tập chọn, không phải đường kính biểu kiến của thiên
 *   thể. Dán nhãn "kích thước góc" lên nó là in ra một số đo mà không ai đo.
 * - **Độ sáng biểu kiến.** Không có ở bất kỳ đâu trong kho.
 *
 * Muốn có hai dòng đó thì phải thêm trường vào `SkyTarget` kèm nguồn cho cả
 * mười thiên thể, và đi qua gate chính xác của `science-editor` — đúng cách
 * mà mười khoảng cách trong `blurb` đã được thêm (xem chú thích ở sky-data).
 *
 * Đổi lại, bảng in `facts` — hai tới ba sự kiện đã kiểm nguồn của từng thiên
 * thể, trong đó thường có sẵn khoảng cách. Nói đúng thứ mình biết, ở dạng đã
 * được duyệt, hơn là dựng một khung năm dòng rồi bỏ trống hai.
 */
export function SkyObjectPanel({
  target,
  label,
  ra,
  dec,
  survey,
  onSelect,
}: {
  /** `null` khi khung nhìn đang ở một toạ độ tự do, không phải thiên thể nào */
  target: SkyTarget | null;
  /** Nhãn đang hiển thị — với toạ độ tự do thì đây là chuỗi người dùng gõ */
  label: string;
  ra: number;
  dec: number;
  survey: SkySurvey;
  /** Bấm một thiên thể liên quan thì bay tới nó */
  onSelect: (target: SkyTarget) => void;
}) {
  const t = useTranslations("sky");
  const locale = useLocale() as Locale;
  const en = locale === "en";

  const coords = formatCoordinates(ra, dec);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copied"), { description: text });
    } catch {
      /* Trình duyệt chặn clipboard (thường vì trang không chạy trên HTTPS).
         Im lặng: một thông báo lỗi cho thao tác phụ này ồn hơn giá trị của nó,
         và người dùng còn thanh địa chỉ để chép tay. */
    }
  };

  /* Thiên thể liên quan = CÙNG LOẠI, suy từ dữ liệu chứ không viết tay danh
     sách. Danh mục chỉ có mười mục nên "cùng loại" là quan hệ duy nhất đủ
     dày để luôn có gợi ý; viết tay thì thêm một thiên thể là phải sửa mười
     danh sách. Không đủ cùng loại thì bù bằng các mục còn lại. */
  const sameKind = target
    ? SKY_TARGETS.filter(
        (item) => item.id !== target.id && item.kind === target.kind,
      )
    : [];
  const rest = target
    ? SKY_TARGETS.filter(
        (item) => item.id !== target.id && item.kind !== target.kind,
      )
    : [];
  const related = target ? [...sameKind, ...rest].slice(0, 5) : [];

  return (
    <div className="space-y-6">
      {/* --------------------------------------------------------- Infobox */}
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          <Target className="size-3.5 text-primary-strong" aria-hidden />
          {t("observing")}
        </p>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            {label}
          </h2>
          {target && (
            <span className="font-mono text-sm text-muted-foreground">
              {target.catalogId}
            </span>
          )}
        </div>

        {target ? (
          <>
            <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Row term={t("objectType")} value={t(`kind.${target.kind}`)} />
              <Row
                term={t("constellation")}
                value={en ? target.constellationEn : target.constellation}
              />
              <Row term={t("coordinates")} value={coords} mono />
              <Row
                term={t("seenWith")}
                value={`${VISIBILITY_LABELS[target.visibility].emoji} ${
                  en
                    ? VISIBILITY_LABELS[target.visibility].labelEn
                    : VISIBILITY_LABELS[target.visibility].label
                }`}
              />
            </dl>

            <ul className="mt-4 space-y-1.5 border-t pt-4">
              {(en ? target.factsEn : target.facts).map((fact) => (
                <li
                  key={fact}
                  className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                >
                  <span aria-hidden className="text-accent">
                    ·
                  </span>
                  {fact}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {coords}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("freeAimHint")}
            </p>
          </>
        )}

        {/* ------------------------------------------------------ Nút đi tiếp

            Ba đích, xếp theo thứ tự Sciencepedia trước.

            "Tìm bài viết" dẫn tới trang tìm kiếm nội bộ chứ không tới một bài
            cụ thể, và đó là lựa chọn có ý thức: không có ánh xạ thiên thể →
            slug trong dữ liệu, mà thêm một truy vấn CSDL vào route này sẽ phá
            đúng thứ khiến nó tĩnh hoàn toàn (xem chú thích ở `space-map/page`).
            Một liên kết tìm kiếm luôn đúng; một liên kết đoán slug thì hỏng
            im lặng vào ngày ai đó đổi tên bài. */}
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/search?q=${encodeURIComponent(target?.catalogId ?? label)}`}
            className={ctaClass}
          >
            <BookOpen className="size-3.5" aria-hidden />
            {t("readArticle")}
          </Link>

          {target && (
            <>
              <a
                href={`https://simbad.cds.unistra.fr/simbad/sim-id?Ident=${encodeURIComponent(target.catalogId)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={ctaClass}
              >
                <Database className="size-3.5" aria-hidden />
                {t("astroData")}
                <ExternalLink className="size-3 opacity-60" aria-hidden />
              </a>

              <a
                href={`https://${en ? "en" : "vi"}.wikipedia.org/w/index.php?search=${encodeURIComponent(
                  en ? target.nameEn : target.name,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={ctaClass}
              >
                <Eye className="size-3.5" aria-hidden />
                {t("wikipedia")}
                <ExternalLink className="size-3 opacity-60" aria-hidden />
              </a>
            </>
          )}

          <button
            type="button"
            onClick={() => copy(window.location.href)}
            className={ctaClass}
          >
            <Link2 className="size-3.5" aria-hidden />
            {t("copyLink")}
          </button>

          <button
            type="button"
            onClick={() => copy(coords)}
            className={ctaClass}
          >
            <Copy className="size-3.5" aria-hidden />
            {t("copyCoords")}
          </button>
        </div>
      </section>

      {/* ------------------------------------------- Bạn đang nhìn thấy gì */}
      <section className="rounded-2xl border border-accent/25 bg-accent/[0.06] p-5">
        <h3 className="font-display font-semibold">{t("seeingTitle")}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("seeingBody", { survey: survey.fullName })}
        </p>
      </section>

      {/* ------------------------------------------------ Khám phá tiếp */}
      {related.length > 0 && (
        <section>
          <h3 className="font-display font-semibold">{t("relatedTitle")}</h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {related.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="group flex w-full items-center gap-3 overflow-hidden rounded-xl border p-2 text-left transition-colors hover:border-accent lg:flex-col lg:items-stretch lg:p-0"
                >
                  <span className="relative block size-12 shrink-0 overflow-hidden rounded-lg bg-[#04060e] lg:aspect-video lg:size-auto lg:w-full lg:rounded-none">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 20vw, 48px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </span>
                  <span className="min-w-0 lg:p-3">
                    <span className="block truncate text-sm font-medium">
                      {en ? item.nameEn : item.name}
                    </span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {item.catalogId}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const ctaClass =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent hover:text-accent";

function Row({
  term,
  value,
  mono,
}: {
  term: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 sm:justify-start sm:gap-3">
      <dt className="shrink-0 text-sm text-muted-foreground">{term}</dt>
      <dd
        className={cn(
          "text-right text-sm font-medium sm:text-left",
          mono && "font-mono",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
