"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, Telescope } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { formatCoordinates, parseCoordinates } from "@/lib/sky-coords";
import { DEFAULT_FOV_DEG } from "@/lib/sky-data";
import { AladinViewer } from "@/components/sky/aladin-viewer";

/**
 * Dữ liệu định vị bầu trời gắn vào một bài viết. Bốn trường đầu là hợp đồng
 * với CSDL (`model SkyObject`); hai trường sau chỉ để đóng khung cho đẹp.
 */
export type ArticleSkyObject = {
  objectName: string;
  catalogId: string;
  /** J2000, sexagesimal hoặc độ thập phân */
  ra: string;
  dec: string;
  fovDeg?: number;
  survey?: string | null;
};

/**
 * Khối "Xem trên bản đồ bầu trời" trong bài viết.
 *
 * ## Vì sao mặc định phải bấm mới nạp
 *
 * Ở trang `/space-map` người đọc đến VÌ bản đồ, nên nạp khi cuộn tới là đúng.
 * Trong một bài viết thì ngược lại: bản đồ là phần phụ dưới thân bài, và tiêu
 * 1 MB băng thông của người chỉ muốn đọc chữ là lấy của họ thứ họ không xin.
 * Bấm rồi thì Aladin mở ra đã ngắm sẵn đúng thiên thể — không phải tìm lại.
 *
 * ## Vì sao toạ độ vẫn in ra chữ
 *
 * Đoạn RA/Dec là văn bản thật trong HTML đầu tiên, không phụ thuộc WebGL.
 * Người dùng trình đọc màn hình, người tắt JavaScript và công cụ tìm kiếm đều
 * lấy được thông tin; khung bản đồ chỉ là phần tăng cường phía trên nó.
 */
export function AladinArticleEmbed({
  object,
  activation = "click",
}: {
  object: ArticleSkyObject;
  activation?: "visible" | "click";
}) {
  const t = useTranslations("sky");

  const coordinates = parseCoordinates(object.ra, object.dec);

  return (
    <section className="mt-14">
      <h2 className="flex items-center gap-2 border-b pb-3 font-display text-2xl font-bold tracking-tight">
        <Telescope className="size-5 shrink-0 text-accent" aria-hidden />
        {t("embedTitle")}
      </h2>

      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground">{t("objectName")}</dt>
          <dd className="font-medium">{object.objectName}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground">{t("catalogId")}</dt>
          <dd className="font-mono">{object.catalogId}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground">{t("coordinates")}</dt>
          <dd className="font-mono">
            {coordinates
              ? formatCoordinates(coordinates.ra, coordinates.dec)
              : `${object.ra} ${object.dec}`}
          </dd>
        </div>
      </dl>

      {/* Toạ độ hỏng thì bỏ khung bản đồ chứ không dựng một khung trỏ vào chỗ
          sai. Phần chữ ở trên vẫn còn, nên bài viết không mất gì. */}
      {coordinates && (
        <AladinViewer
          view={{
            ...coordinates,
            fovDeg: object.fovDeg ?? DEFAULT_FOV_DEG,
            survey: object.survey ?? undefined,
          }}
          label={t("viewerLabel", { object: object.objectName })}
          activation={activation}
          posterCaption={t("posterCaption", { object: object.objectName })}
          className="mt-4 aspect-[16/10] sm:aspect-[2/1]"
        />
      )}

      <Link
        href={`/space-map?object=${encodeURIComponent(object.catalogId)}`}
        className="mt-4 inline-flex items-center gap-2 text-sm text-primary-strong underline underline-offset-4"
      >
        {t("openFullMap")}
        <ExternalLink className="size-3.5" aria-hidden />
      </Link>
    </section>
  );
}
