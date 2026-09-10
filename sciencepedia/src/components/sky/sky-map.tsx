"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import type { Locale } from "@/i18n/routing";
import type { SkyView } from "@/hooks/use-aladin";
import { formatCoordinates } from "@/lib/sky-coords";
import {
  DEFAULT_SURVEY,
  SKY_SURVEYS,
  SKY_TARGETS,
  findSkyTarget,
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
      <AladinSearch onSelect={applySearch} className="max-w-xl" />

      <AladinViewer
        view={view}
        label={t("viewerLabel", { object: label })}
        activation="visible"
        posterCaption={t("posterCaption", { object: label })}
        className="h-[calc(100dvh-16rem)] min-h-[30rem]"
      />

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
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SKY_TARGETS.map((target) => (
            <li key={target.id}>
              <button
                type="button"
                onClick={() => applyTarget(target)}
                aria-current={activeId === target.id ? "true" : undefined}
                className={cn(
                  "h-full w-full rounded-2xl border p-4 text-left transition-colors hover:border-accent hover:bg-accent/5",
                  activeId === target.id && "border-accent bg-accent/5",
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display font-semibold">
                    {nameOf(target, locale)}
                  </h3>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {target.catalogId}
                  </span>
                </div>
                {/* Tên chòm sao đứng trơ một mình đọc ra vô nghĩa — người
                    đọc không biết "Orion" ở đây là chòm sao hay là tên khác
                    của chính thiên thể. Nhãn phía trước là bắt buộc. */}
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("constellation")}{" "}
                  {locale === "en"
                    ? target.constellationEn
                    : target.constellation}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {locale === "en" ? target.blurbEn : target.blurb}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function nameOf(target: SkyTarget, locale: Locale): string {
  return locale === "en" ? target.nameEn : target.name;
}
