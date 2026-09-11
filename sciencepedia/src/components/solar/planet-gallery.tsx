import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowUpRight, Orbit, Scaling } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  BODY_BADGES,
  MOON,
  PLANETS,
  SUN,
  type BodyPhoto,
  type BodySurface,
} from "@/lib/solar-data";
import { formatNumber } from "@/lib/utils";
import { filterPublishedSlugs } from "@/server/queries";
import { PlanetSurface } from "@/components/solar/planet-surface";
import { BodyPanel, type BodyPanelData } from "@/components/solar/body-panel";

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
  orbitalPeriodDays?: number;
  dayLengthHours?: number;
  temperatureC?: number;
  gravity?: number;
  axialTilt?: number;
};

/*
 * Mặt Trăng chen vào ngay sau Trái Đất chứ không xếp cuối. Thứ tự của lưới
 * này là thứ tự khoảng cách tới Mặt Trời, và vệ tinh của một hành tinh thì
 * đứng cạnh hành tinh đó mới đọc ra quan hệ.
 */
const EARTH_INDEX = PLANETS.findIndex((planet) => planet.id === "earth");
const BODIES: GalleryBody[] = [
  SUN,
  ...PLANETS.slice(0, EARTH_INDEX + 1),
  MOON,
  ...PLANETS.slice(EARTH_INDEX + 1),
];

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

  /**
   * Dựng danh sách số đo cho tab "Đặc điểm vật lý".
   *
   * Bỏ qua trường nào không có thay vì in dấu gạch: Mặt Trời không quay
   * quanh chính nó theo nghĩa một hành tinh quay quanh Mặt Trời, và Mặt Trăng
   * không có "khoảng cách tới Mặt Trời" nào đáng ghi ở đây. Một hàng trống
   * không phải thông tin, nó chỉ là chỗ trống trông như lỗi.
   */
  const factsFor = (body: GalleryBody) => {
    const rows: Array<{ label: string; value: string }> = [
      {
        label: t("factDiameter"),
        value: `${formatNumber(body.realRadiusKm * 2, locale)} km`,
      },
      {
        label: t("factRadius"),
        value: `${formatNumber(body.realRadiusKm, locale)} km`,
      },
    ];

    if (body.realDistanceKm !== undefined) {
      rows.push({
        label: t("factDistance"),
        value: `${formatNumber(body.realDistanceKm, locale)} km`,
      });
    }
    if (body.orbitalPeriodDays !== undefined) {
      // Dưới hai năm thì đọc bằng ngày dễ hình dung hơn; trên thì ngược lại
      const days = body.orbitalPeriodDays;
      rows.push({
        label: t("factPeriod"),
        value:
          days < 700
            ? `${formatNumber(Math.round(days), locale)} ${t("unitDays")}`
            : `${(days / 365.25).toLocaleString(locale, {
                maximumFractionDigits: 1,
              })} ${t("unitYears")}`,
      });
    }
    if (body.dayLengthHours !== undefined) {
      const hours = body.dayLengthHours;
      rows.push({
        label: t("factDay"),
        value:
          hours < 72
            ? `${hours.toLocaleString(locale, { maximumFractionDigits: 1 })} ${t("unitHours")}`
            : `${(hours / 24).toLocaleString(locale, {
                maximumFractionDigits: 1,
              })} ${t("unitDays")}`,
      });
    }
    if (body.moons !== undefined) {
      rows.push({ label: t("factMoons"), value: String(body.moons) });
    }
    if (body.temperatureC !== undefined) {
      rows.push({
        label: t("factTemp"),
        value: `${formatNumber(body.temperatureC, locale)} °C`,
      });
    }
    if (body.gravity !== undefined) {
      rows.push({
        label: t("factGravity"),
        value: `${body.gravity.toLocaleString(locale, {
          maximumFractionDigits: 2,
        })} m/s²`,
      });
    }
    if (body.axialTilt !== undefined) {
      rows.push({
        label: t("factTilt"),
        value: `${body.axialTilt.toLocaleString(locale, {
          maximumFractionDigits: 1,
        })}°`,
      });
    }

    return rows;
  };

  const jumpTargets = BODIES.map((body) => ({
    id: body.id,
    name: isEnglish ? body.nameEn : body.name,
  }));

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

          return (
            <li
              key={body.id}
              id={`body-${body.id}`}
              /*
                KHÔNG dùng transform khi rê chuột — kể cả một translate 4px.

                Một ancestor có transform trở thành containing block cho mọi
                hậu duệ position: fixed. Khung Aladin ở chế độ toàn màn hình
                chính là một phần tử như vậy, nên lúc đó nó bị neo vào thẻ này
                thay vì vào cửa sổ, rồi bị overflow-hidden của thẻ cắt cụt —
                triệu chứng là bấm mở bản đồ ra một ô loading nhỏ và một
                breadcrumb lạc chỗ. Cùng họ với chú thích `isolate` trong
                globals.css: mọi thứ tạo stacking context hoặc containing
                block ở nhánh này đều nhốt lớp toàn màn hình lại.

                Viền và bóng đổ không tạo containing block, nên hiệu ứng nổi
                khối vẫn làm được bằng hai thứ đó.
              */
              className="group flex scroll-mt-24 flex-col overflow-hidden rounded-2xl border bg-card transition-[border-color,box-shadow] duration-300 hover:border-primary-strong/40 hover:shadow-xl"
            >
              {body.surface ? (
                <PlanetSurface
                  name={displayName}
                  photo={body.photo}
                  surface={body.surface}
                  caption={displayName}
                  info={
                    <BodyPanel
                      body={
                        {
                          id: body.id,
                          name: displayName,
                          secondaryName,
                          description,
                          photoCaption: caption,
                          photoCredit: body.photo.credit,
                          photoSourceUrl: body.photo.sourceUrl,
                          surfaceCaption: body.surface
                            ? isEnglish
                              ? body.surface.captionEn
                              : body.surface.captionVi
                            : null,
                          surfaceCredit: body.surface?.credit ?? null,
                          facts: factsFor(body),
                          articleHref: published.has(body.articleSlug)
                            ? `/articles/${body.articleSlug}`
                            : null,
                        } satisfies BodyPanelData
                      }
                      targets={jumpTargets.filter(
                        (item) => item.id !== body.id,
                      )}
                    />
                  }
                  crumbRoot={t("title")}
                  bodyId={body.id}
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
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display font-semibold">{displayName}</h3>
                  {secondaryName && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {secondaryName}
                    </span>
                  )}
                </div>

                {/* Nhãn phân loại. Mỗi nhãn là một mệnh đề kiểm được, không
                    phải tính từ — xem `BODY_BADGES`. */}
                {BODY_BADGES[body.id] && (
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {BODY_BADGES[body.id].map((badge) => (
                      <li
                        key={badge.labelEn}
                        className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        <span aria-hidden>{badge.emoji}</span>
                        {isEnglish ? badge.labelEn : badge.label}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Ô thống kê thay cho một dòng chữ liền.
                    Ba con số cùng cỡ, cùng vị trí trên mọi thẻ thì mắt so
                    được theo cột; nhét chúng vào một câu thì phải đọc mới
                    thấy, và đọc chín lần cho chín thẻ. */}
                <dl className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    {
                      value: `${formatNumber(Math.round(body.realRadiusKm * 2), locale)}`,
                      unit: "km",
                      label: t("diameter"),
                    },
                    body.realDistanceKm !== undefined
                      ? {
                          value: formatNumber(
                            Math.round(body.realDistanceKm / 1_000_000),
                            locale,
                          ),
                          unit: t("millionKm"),
                          label: t("distance"),
                        }
                      : null,
                    body.moons !== undefined
                      ? {
                          value: String(body.moons),
                          unit: "",
                          label: t("moons"),
                        }
                      : null,
                  ]
                    .filter((stat) => stat !== null)
                    .map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl border bg-muted/30 px-2.5 py-2"
                      >
                        <dd className="font-mono text-sm font-semibold tabular-nums">
                          {stat.value}
                          {stat.unit && (
                            <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                              {stat.unit}
                            </span>
                          )}
                        </dd>
                        <dt className="mt-0.5 text-[11px] text-muted-foreground">
                          {stat.label}
                        </dt>
                      </div>
                    ))}
                </dl>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>

                {/* Chú thích ảnh là nội dung bắt buộc, không phải trang trí:
                    ảnh Mặt Trời, bề mặt Sao Thuỷ và Sao Kim đều là màu quy
                    ước, và người đọc không có cách nào tự nhận ra. Nó nhỏ và
                    nằm cuối, nhưng không được bỏ. */}
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground/75">
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

                {/* Liên kết ngữ cảnh, đẩy xuống đáy bằng mt-auto để mọi thẻ
                    trong một hàng có cùng một đường chân. */}
                <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 border-t pt-3 text-sm">
                  {published.has(body.articleSlug) && (
                    <Link
                      href={`/articles/${body.articleSlug}`}
                      className="inline-flex items-center gap-1.5 text-primary-strong hover:underline"
                    >
                      <ArrowUpRight className="size-3.5" aria-hidden />
                      {t("readMore")}
                    </Link>
                  )}

                  <Link
                    href={`/solar-system?body=${body.id}`}
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Orbit className="size-3.5" aria-hidden />
                    {t("viewInSolarSystem")}
                  </Link>

                  <Link
                    href="/zoom"
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Scaling className="size-3.5" aria-hidden />
                    {t("viewInZoom")}
                  </Link>
                </div>
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
