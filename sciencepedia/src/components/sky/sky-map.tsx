"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import type { Locale } from "@/i18n/routing";
import type { SkyView } from "@/hooks/use-aladin";
import { formatCoordinates } from "@/lib/sky-coords";
import {
  DEFAULT_SURVEY,
  SKY_SURVEYS,
  SKY_TARGETS,
  VISIBILITY_LABELS,
  findSkyTarget,
  type SkyObjectKind,
  type SkyTarget,
} from "@/lib/sky-data";
import { cn } from "@/lib/utils";
import {
  AladinSearch,
  targetToView,
  type SkySearchResult,
} from "@/components/sky/aladin-search";
import { AladinViewer } from "@/components/sky/aladin-viewer";

/**
 * Vỏ trang bản đồ bầu trời: ô tìm kiếm, khung bản đồ, bộ chọn survey và danh
 * sách thiên thể.
 *
 * ## Vì sao đây là Client Component mà vẫn không hại SEO
 *
 * Client Component vẫn được render ra HTML ở server. Toàn bộ chữ trên trang —
 * tên, chòm sao, mô tả, toạ độ — có mặt trong HTML đầu tiên và Google đọc
 * được mà không cần chạy JavaScript. Thứ duy nhất không SSR là chính khung
 * WebGL, mà khung đó không chứa chữ nào để index.
 *
 * ## Vì sao khung nhìn nằm ở đây chứ không trong khung bản đồ
 *
 * Ba nguồn cùng ra lệnh cho bản đồ: ô tìm kiếm, danh sách thiên thể, bộ chọn
 * survey. Để trạng thái ở component cha là cách duy nhất giữ ba nguồn đó khỏi
 * giẫm lên nhau, và giữ luồng dữ liệu một chiều.
 *
 * ## Vì sao `?object=` đọc trong effect chứ không nhận từ server
 *
 * Đọc `searchParams` ở page sẽ biến cả route thành dynamic — mất hẳn bản
 * tĩnh, trong khi trang này không có một truy vấn CSDL nào để mà cần dynamic.
 * Đọc bằng `useSearchParams` thì Next đòi bọc Suspense và trả rỗng lúc
 * prerender, tức là vẫn phải xử lý trường hợp "chưa biết".
 *
 * Đọc trong effect sau khi mount là đường duy nhất giữ được cả ba: route tĩnh
 * hoàn toàn, HTML server và lần render đầu ở client giống hệt nhau (không có
 * hydration mismatch), và deep link vẫn tới đúng thiên thể — kịp trước cả lúc
 * Aladin nạp xong.
 */
export function SkyMap() {
  const t = useTranslations("sky");
  const locale = useLocale() as Locale;

  const initial = SKY_TARGETS[0];
  const initialView = targetToView(initial);

  /**
   * Nhóm đang lọc. `null` là xem tất cả.
   *
   * Mười thiên thể chưa đủ nhiều để bắt buộc phải lọc, nhưng chúng thuộc năm
   * loại vật thể khác hẳn nhau — thiên hà, tinh vân, cụm sao, sao, hố đen —
   * và người vào đây thường đang quan tâm đúng một loại. Bộ lọc biến một
   * danh sách phải đọc hết thành một danh sách chọn được.
   */
  const [kind, setKind] = useState<SkyObjectKind | null>(null);

  const [view, setView] = useState<SkyView>(
    initialView ?? { ra: 0, dec: 0, fovDeg: 60 },
  );
  const [label, setLabel] = useState(nameOf(initial, locale));
  const [activeId, setActiveId] = useState<string | null>(initial.id);
  const [survey, setSurvey] = useState(initial.survey ?? DEFAULT_SURVEY);

  /**
   * Ghi lựa chọn vào URL để chia sẻ được, nhưng bằng `replaceState` chứ không
   * qua router: điều hướng thật sẽ dựng lại cây React và giết luôn instance
   * Aladin đang giữ ô tile của vùng trời đang xem.
   */
  const syncUrl = useCallback((targetId: string | null) => {
    const url = new URL(window.location.href);
    if (targetId) url.searchParams.set("object", targetId);
    else url.searchParams.delete("object");
    window.history.replaceState(null, "", url);
  }, []);

  const applyTarget = useCallback(
    (target: SkyTarget) => {
      /*
       * Cuộn lên khung bản đồ trước khi đổi mục tiêu.
       *
       * Danh sách thiên thể nằm dưới khung bản đồ, nên khi bấm một thẻ ở hàng
       * thứ hai trở xuống thì khung bản đồ đã ra khỏi tầm nhìn. Bản đồ đổi
       * đúng mục tiêu nhưng người bấm không thấy gì đổi cả — họ kết luận nút
       * hỏng, đúng như đã xảy ra với dải "Khám phá tiếp".
       *
       * `block: "start"` chứ không phải `"center"`: khung bản đồ cao gần bằng
       * màn hình, căn giữa nó thì mép trên bị đẩy lên khỏi tầm nhìn.
       */
      document
        .getElementById("sky-map-frame")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });

      const next = targetToView(target);
      if (!next) return;

      setView(next);
      setLabel(nameOf(target, locale));
      setActiveId(target.id);
      setSurvey(next.survey ?? DEFAULT_SURVEY);
      syncUrl(target.id);
    },
    [locale, syncUrl],
  );

  const applySearch = useCallback(
    (result: SkySearchResult) => {
      if (result.target) {
        applyTarget(result.target);
        return;
      }

      // Kết quả tự do (toạ độ hoặc Sesame): giữ nguyên survey người dùng đang
      // xem, vì chúng ta không biết gì về thiên thể để mà chọn hộ.
      setView({ ...result.view, survey });
      setLabel(result.label);
      setActiveId(null);
      syncUrl(null);
    },
    [applyTarget, survey, syncUrl],
  );

  /**
   * Deep link `?object=`. Giải bằng `findSkyTarget` chứ không tra theo id:
   * tham số này đến từ cả link người dùng chia sẻ lẫn khối nhúng trong bài
   * viết (chỗ đó gửi mã catalog), nên nó phải nhận mọi cách gọi tên.
   */
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("object");
    if (!requested) return;

    const target = findSkyTarget(requested);
    if (target) applyTarget(target);
  }, [applyTarget]);

  const applySurvey = useCallback((surveyId: string) => {
    setSurvey(surveyId);
    setView((current) => ({ ...current, survey: surveyId }));
  }, []);

  return (
    <div className="space-y-4">
      {/* Mốc để cuộn về khi bấm một thẻ thiên thể ở phía dưới.
          scroll-mt-20 chừa chỗ cho thanh điều hướng dính trên đỉnh, nếu
          không thì mép trên khung bản đồ nằm khuất sau nó. */}
      <div id="sky-map-frame" className="scroll-mt-20 space-y-4">
        <AladinSearch onSelect={applySearch} className="max-w-xl" />

        <AladinViewer
          view={view}
          label={t("viewerLabel", { object: label })}
          activation="visible"
          posterCaption={t("posterCaption", { object: label })}
          className="h-[calc(100dvh-16rem)] min-h-[30rem]"
        />
      </div>

      {/* --------------------------------------------------- Thanh trạng thái */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl border bg-card px-5 py-3.5">
        <p className="text-sm">
          <span className="text-muted-foreground">{t("centeredOn")} </span>
          <span className="font-medium">{label}</span>
          <span className="ml-3 font-mono text-xs text-muted-foreground">
            {formatCoordinates(view.ra, view.dec)}
          </span>
        </p>

        <div
          className="flex flex-wrap items-center gap-1 rounded-full border bg-muted/40 p-0.5"
          role="group"
          aria-label={t("surveyLabel")}
        >
          {SKY_SURVEYS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => applySurvey(item.id)}
              aria-pressed={survey === item.id}
              title={locale === "en" ? item.bandEn : item.band}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                survey === item.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* --------------------------------------------------- Danh sách thiên thể
          Render ở server cùng phần còn lại của trang: đây là nội dung có chữ,
          và là thứ duy nhất trên trang này mà công cụ tìm kiếm đọc được. */}
      <section className="pt-4">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          {t("catalogTitle")}
        </h2>
        {/* Bộ lọc nhóm. Nút "tất cả" đứng đầu và là mặc định — vào trang
            lần đầu thì thấy hết, không phải chọn gì mới thấy gì. */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setKind(null)}
            aria-pressed={kind === null}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              kind === null
                ? "border-accent bg-accent/10 text-foreground"
                : "text-muted-foreground hover:border-accent/60 hover:text-foreground",
            )}
          >
            {t("filterAll")}
          </button>

          {PRESENT_KINDS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setKind(item === kind ? null : item)}
              aria-pressed={kind === item}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                kind === item
                  ? "border-accent bg-accent/10 text-foreground"
                  : "text-muted-foreground hover:border-accent/60 hover:text-foreground",
              )}
            >
              {t(`kind.${item}`)}
            </button>
          ))}
        </div>

        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SKY_TARGETS.filter(
            (target) => kind === null || target.kind === kind,
          ).map((target) => {
            const visibility = VISIBILITY_LABELS[target.visibility];
            const facts = locale === "en" ? target.factsEn : target.facts;

            return (
              <li key={target.id}>
                <button
                  type="button"
                  onClick={() => applyTarget(target)}
                  aria-current={activeId === target.id ? "true" : undefined}
                  className={cn(
                    "group flex h-full w-full flex-col overflow-hidden rounded-2xl border text-left transition-colors hover:border-accent",
                    activeId === target.id && "border-accent",
                  )}
                >
                  {/* Ảnh 16:9 đứng trước mọi thứ khác.
                      Mười thiên thể này khác nhau rõ tới mức một tấm ảnh nói
                      được nhiều hơn cả đoạn mô tả — mà bản trước lại chỉ có
                      chữ, nên M31, M42, M87 và M1 trông giống hệt nhau. */}
                  <span className="relative block aspect-video overflow-hidden bg-[#04060e]">
                    <Image
                      src={target.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, calc(100vw - 3rem)"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[11px] text-white/90 backdrop-blur-sm">
                      <span aria-hidden>{visibility.emoji}</span>
                      {locale === "en" ? visibility.labelEn : visibility.label}
                    </span>
                  </span>

                  <span className="flex flex-1 flex-col p-4">
                    <span className="flex items-baseline justify-between gap-3">
                      <h3 className="font-display font-semibold">
                        {nameOf(target, locale)}
                      </h3>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {target.catalogId}
                      </span>
                    </span>

                    {/* Tên chòm sao đứng trơ một mình đọc ra vô nghĩa — người
                        đọc không biết "Orion" ở đây là chòm sao hay là tên
                        khác của chính thiên thể. Nhãn phía trước là bắt buộc. */}
                    <span className="mt-1 text-xs text-muted-foreground">
                      {t("constellation")}{" "}
                      {locale === "en"
                        ? target.constellationEn
                        : target.constellation}
                    </span>

                    {/* Ba ý ngắn thay cho một đoạn: mắt quét được ba dòng
                        trong thời gian đọc hết một câu. */}
                    <ul className="mt-3 space-y-1">
                      {facts.map((fact) => (
                        <li
                          key={fact}
                          className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                        >
                          <span aria-hidden className="text-accent">
                            ·
                          </span>
                          {fact}
                        </li>
                      ))}
                    </ul>

                    {target.imageCredit && (
                      <span className="mt-3 text-[10px] leading-relaxed text-muted-foreground/70">
                        {target.imageCredit}
                      </span>
                    )}

                    <span className="mt-auto pt-3 text-xs font-medium text-accent">
                      {t("showOnMap")}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/**
 * Các nhóm CÓ MẶT trong dữ liệu, theo thứ tự xuất hiện.
 *
 * Suy từ `SKY_TARGETS` chứ không viết tay danh sách: thêm một thiên thể loại
 * mới mà quên cập nhật danh sách thì nút lọc của loại đó không bao giờ hiện,
 * và không ai phát hiện ra vì mọi thứ khác vẫn chạy.
 */
const PRESENT_KINDS = [...new Set(SKY_TARGETS.map((target) => target.kind))];

function nameOf(target: SkyTarget, locale: Locale): string {
  return locale === "en" ? target.nameEn : target.name;
}
