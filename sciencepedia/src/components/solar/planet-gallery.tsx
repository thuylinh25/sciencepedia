import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  PLANETS,
  SUN,
  type BodyPhoto,
  type BodySurface,
} from "@/lib/solar-data";
import { cn, formatNumber } from "@/lib/utils";
import { filterPublishedSlugs } from "@/server/queries";
import { PlanetSurface } from "@/components/solar/planet-surface";

/**
 * Thư viện ảnh Hệ Mặt Trời — Mặt Trời và tám hành tinh.
 *
 * ## Vì sao hành tinh không nằm trong danh mục bản đồ sao
 *
 * `SKY_TARGETS` gắn mỗi thiên thể với một cặp RA/Dec cố định, vì thiên hà và
 * tinh vân ở yên chỗ đó suốt đời một con người. Hành tinh thì đi dọc hoàng
 * đạo và đổi chỗ mỗi đêm; ghi một toạ độ cứng cho Sao Hoả là ghi một điều sai
 * ngay hôm sau. Vị trí thật của chúng đã có ở `/solar-system`, lấy từ API
 * Horizons của JPL và làm mới sáu giờ một lần.
 *
 * ## Vì sao đây là Server Component
 *
 * Cả khối này là ảnh và chữ. Hai thẻ không có bản đồ bề mặt thì không kèm một
 * byte JavaScript nào; bảy thẻ còn lại chỉ nạp Aladin khi người đọc bấm. Xem
 * chú thích trong `planet-surface.tsx`.
 */
type GalleryBody = {
  id: string;
  name: string;
  nameEn: string;
  articleSlug: string;
  descriptionVi: string;
  descriptionEn: string;
  photo: BodyPhoto;
  surface: BodySurface | null;
  realRadiusKm: number;
  /** Mặt Trời không có hai trường này — nó là tâm hệ, không quay quanh ai. */
  realDistanceKm?: number;
  moons?: number;
};

const BODIES: GalleryBody[] = [SUN, ...PLANETS];

/** Cùng một chuỗi cho mọi thẻ: lưới tối đa ba cột trong `container-page`. */
const IMAGE_SIZES =
  "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, calc(100vw - 3rem)";

export async function PlanetGallery() {
  const t = await getTranslations("solar");
  const locale = (await getLocale()) as Locale;
  const isEnglish = locale === "en";

  /*
   * Slug trong `solar-data.ts` là hằng số viết tay, không phải khoá ngoại.
   * Bài nào chưa xuất bản thì trang bài trả 404, nên link phải tự biến mất
   * thay vì dẫn người đọc vào ngõ cụt. Một truy vấn cho cả chín thẻ.
   */
  const published = await filterPublishedSlugs(
    BODIES.map((body) => body.articleSlug),
  );

  return (
    <section className="pt-10">
      <h2 className="font-display text-2xl font-bold tracking-tight">
        {t("galleryTitle")}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {t("galleryNote")}
      </p>

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BODIES.map((body) => {
          const description = isEnglish
            ? body.descriptionEn
            : body.descriptionVi;
          const caption = isEnglish
            ? body.photo.captionEn
            : body.photo.captionVi;
          /**
           * Hành tinh dùng tên theo ngôn ngữ đang xem, khác với danh mục
           * thiên thể sâu ở trên. Lý do là chuyện tra cứu: "Tua Rua" gõ vào
           * SIMBAD hay Stellarium không ra gì, còn "Sao Hoả" thì ai cũng biết
           * là Mars — tên hành tinh tiếng Việt là tên sống, không phải bản
           * dịch chỉ tồn tại trên trang này.
           */
          const displayName = isEnglish ? body.nameEn : body.name;
          const secondaryName = isEnglish ? null : body.nameEn;

          /*
           * Dựng một lần, dùng hai chỗ: dưới ảnh trong thẻ, và trong lớp phủ
           * khi người xem bấm toàn màn hình. Ở toàn màn hình nền luôn là đen
           * nên chữ phải sáng, còn trong thẻ thì theo chủ đề của trang — đó
           * là toàn bộ khác biệt giữa hai lần gọi.
           */
          const info = (dark: boolean) => (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display font-semibold">{displayName}</h3>
                {secondaryName && (
                  <span
                    className={cn(
                      "shrink-0 text-xs",
                      dark ? "text-white/50" : "text-muted-foreground",
                    )}
                  >
                    {secondaryName}
                  </span>
                )}
              </div>

              <dl
                className={cn(
                  "mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs",
                  dark ? "text-white/60" : "text-muted-foreground",
                )}
              >
                <div className="flex gap-1.5">
                  <dt>{t("diameter")}</dt>
                  <dd>{formatNumber(body.realRadiusKm * 2, locale)} km</dd>
                </div>
                {body.realDistanceKm !== undefined && (
                  <div className="flex gap-1.5">
                    <dt>{t("distance")}</dt>
                    <dd>{formatNumber(body.realDistanceKm, locale)} km</dd>
                  </div>
                )}
                {body.moons !== undefined && (
                  <div className="flex gap-1.5">
                    <dt>{t("moons")}</dt>
                    <dd>{body.moons}</dd>
                  </div>
                )}
              </dl>

              <p
                className={cn(
                  "mt-3 text-sm leading-relaxed",
                  dark ? "text-white/80" : "text-muted-foreground",
                )}
              >
                {description}
              </p>

              {/* Chú thích ảnh là nội dung bắt buộc, không phải trang trí:
                  ảnh Mặt Trời và bề mặt Sao Thuỷ, Sao Kim đều là màu quy
                  ước, và người đọc không có cách nào tự nhận ra. */}
              <p
                className={cn(
                  "mt-3 text-xs leading-relaxed",
                  dark ? "text-white/55" : "text-muted-foreground/80",
                )}
              >
                {caption}{" "}
                <a
                  href={body.photo.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  {body.photo.credit}
                </a>
              </p>
            </>
          );

          return (
            <li
              key={body.id}
              className="flex flex-col overflow-hidden rounded-2xl border bg-card"
            >
              {body.surface ? (
                <PlanetSurface
                  name={displayName}
                  photo={body.photo}
                  surface={body.surface}
                  caption={t("surfacePrompt", { body: displayName })}
                  info={info(true)}
                  sizes={IMAGE_SIZES}
                />
              ) : (
                <div className="relative aspect-square bg-[#04060e]">
                  <Image
                    src={body.photo.url}
                    alt={displayName}
                    fill
                    sizes={IMAGE_SIZES}
                    className="object-cover"
                  />
                </div>
              )}

              <div className="flex flex-1 flex-col p-4">
                {info(false)}

                {/* Bài chưa xuất bản thì không có link: xem `filterPublishedSlugs` */}
                {published.has(body.articleSlug) && (
                  <Link
                    href={`/articles/${body.articleSlug}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm text-primary-strong underline underline-offset-4"
                  >
                    {t("readMore")}
                    <ArrowUpRight className="size-3.5" aria-hidden />
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        {t("galleryCredit")}
      </p>
    </section>
  );
}
