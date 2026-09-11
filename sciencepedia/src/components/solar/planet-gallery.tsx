import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowUpRight, Orbit, Scaling } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  BODY_BADGES,
  shortenCredit,
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
              className="group flex scroll-mt-24 flex-col overflow-hidden rounded-2xl border bg-card transition-[border-color,box-shadow] duration-300 hover:border-sky-400/45 hover:shadow-[0_18px_50px_-20px_rgba(56,189,248,0.45)]"
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
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
              )}

              {/* p-5 thay p-4, và khoảng cách giữa các khối nâng lên một
                  nhịp thống nhất: mọi khối cách nhau 16px thay vì 8–12px mỗi
                  chỗ một kiểu. Cộng thêm pt-5 sau ảnh cho ảnh và chữ thôi
                  dính vào nhau. */}
              <div className="flex flex-1 flex-col gap-4 p-5">
                {/* Tên tiếng Anh xuống dòng dưới thay vì trôi sang mép phải.

                    Đặt hai tên ở hai đầu một hàng thì mắt phải đi hết bề ngang
                    thẻ mới đọc xong một cái tên, và với tên dài ngắn khác nhau
                    thì cột phải so le trên mọi thẻ. Xếp chồng giữ chúng cạnh
                    nhau và cùng một mép trái. */}
                <div>
                  <h3 className="font-display text-lg leading-tight font-semibold">
                    {displayName}
                  </h3>
                  {secondaryName && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {secondaryName}
                    </p>
                  )}
                </div>

                {/* Badge tương phản hơn: nền sáng hơn và viền rõ hơn. Ở
                    bg-muted/40 chúng gần như tan vào nền thẻ. Cùng chiều cao
                    và cùng đệm cho mọi badge. */}
                {BODY_BADGES[body.id] && (
                  <ul className="flex flex-wrap gap-1.5">
                    {BODY_BADGES[body.id].map((badge) => (
                      <li
                        key={badge.labelEn}
                        className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border/80 bg-muted px-2.5 text-[11px] font-medium text-foreground/85"
                      >
                        <span aria-hidden>{badge.emoji}</span>
                        {isEnglish ? badge.labelEn : badge.label}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Ô thống kê cùng chiều cao, cùng cách căn.

                    Đơn vị viết thống nhất: đường kính luôn là km, khoảng cách
                    luôn là "triệu km". Trước đây mỗi thẻ một kiểu — "1,4 Tr
                    km" ở Mặt Trời nhưng "4.879,4 km" ở Sao Thuỷ — nên hai con
                    số cạnh nhau không so được với nhau. */}
                <dl className="grid grid-cols-3 gap-2">
                  {[
                    {
                      value: formatNumber(
                        Math.round(body.realRadiusKm * 2),
                        locale,
                      ),
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
                        className="flex min-h-[4.25rem] flex-col justify-center rounded-xl border bg-muted/40 px-2.5 py-2"
                      >
                        <dd className="font-mono text-sm font-semibold tabular-nums">
                          {stat.value}
                          {stat.unit && (
                            <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                              {stat.unit}
                            </span>
                          )}
                        </dd>
                        <dt className="mt-1 text-[11px] leading-tight text-muted-foreground">
                          {stat.label}
                        </dt>
                      </div>
                    ))}
                </dl>

                {/* Mô tả giới hạn bốn dòng để mọi thẻ trong một hàng cao bằng
                    nhau. Bản đầy đủ nằm ở bài viết. */}
                <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>

                {/* Chú thích ảnh là nội dung bắt buộc chứ không phải trang
                    trí — ảnh Mặt Trời, bề mặt Sao Thuỷ và Sao Kim đều là màu
                    quy ước — nhưng nó cũng giới hạn ba dòng, và dòng ghi nguồn
                    rút về danh sách tổ chức. Link vẫn dẫn tới nguồn đầy đủ. */}
                <div>
                  <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground/75">
                    {caption}
                  </p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground/60">
                    {t("dataSource")}:{" "}
                    <a
                      href={body.photo.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      title={body.photo.credit}
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      {shortenCredit(body.photo.credit)}
                    </a>
                  </p>
                </div>

                {/* CTA có thứ bậc: một nút chính có nền, hai lối đi phụ là
                    chữ. Trước đây ba liên kết cùng một kiểu chữ nhỏ nên không
                    cái nào là đường chính, và người bấm phải đọc hết ba cái
                    mới chọn được. Chiều cao 40px cho ngón tay bấm trúng. */}
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4">
                  <Link
                    href={`/solar-system?body=${body.id}`}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-sky-500/15 px-3.5 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-500/25"
                  >
                    <Orbit className="size-4" aria-hidden />
                    {t("viewInSolarSystem")}
                  </Link>

                  {published.has(body.articleSlug) && (
                    <Link
                      href={`/articles/${body.articleSlug}`}
                      className="inline-flex h-10 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ArrowUpRight className="size-3.5" aria-hidden />
                      {t("readMore")}
                    </Link>
                  )}

                  <Link
                    href="/zoom"
                    className="inline-flex h-10 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
