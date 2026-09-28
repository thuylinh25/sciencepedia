"use client";

// Client: toàn bộ trạng thái của trình xem (hệ đang bật, cấu trúc đang chọn,
// độ tách) đổi theo từng thao tác chuột/chạm. Component vẫn được SSR: tiêu đề,
// khung và thông báo "đang tải" có trong HTML đầu tiên. Chỉ cảnh WebGL là
// `ssr: false`, nạp động bên dưới.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Info,
  Layers3,
  Pause,
  RotateCcw,
  RotateCw,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DEFAULT_VISIBLE,
  ORGAN_PRESET,
  SYSTEM_IDS,
  atlasSchema,
  type Atlas,
  type Concept,
  type SceneState,
  type SystemId,
  type View,
} from "@/lib/human-atlas/anatomy";
import { atlasDataUrl } from "@/lib/human-atlas/assets";
import { decodeModelResponse } from "@/lib/human-atlas/model-download";
import { displayName } from "@/lib/human-atlas/names-vi";
import {
  buildSearchIndex,
  resolveStructure,
  structureSlug,
  type SearchIndex,
} from "@/lib/human-atlas/search";
import type { StructureArticle } from "@/lib/human-atlas/structure-links";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { AtlasErrorBoundary } from "@/components/human-atlas/atlas-error-boundary";
import { PANEL } from "@/components/human-atlas/panel";
import { StructureDetail } from "@/components/human-atlas/structure-detail";
import { StructureSearch } from "@/components/human-atlas/structure-search";
import { SystemsPanel } from "@/components/human-atlas/systems-panel";
import type { SceneError } from "@/components/human-atlas/anatomy-scene";

/**
 * three.js (~600 KB) và cảnh chỉ tải khi trang này chạy ở trình duyệt:
 * `ssr: false` + `import()` động tách chúng thành chunk riêng, nên trang chủ
 * và trang bài viết không mang theo một byte nào của atlas.
 */
const AnatomyScene = dynamic(() => import("@/components/human-atlas/anatomy-scene"), {
  ssr: false,
});

/** Số mảnh của bộ dữ liệu, để tiêu đề có số ngay trong HTML đầu tiên. */
const PIECE_COUNT = 2234;

const VIEWS: { id: View; key: "threeQuarter" | "front" | "side" | "back" }[] = [
  { id: "three-quarter", key: "threeQuarter" },
  { id: "front", key: "front" },
  { id: "side", key: "side" },
  { id: "back", key: "back" },
];

const initial: SceneState = {
  explode: 0,
  visible: DEFAULT_VISIBLE,
  selected: [],
  isolate: false,
  view: "three-quarter",
  rotate: false,
  reset: 0,
  focus: 0,
};

type Failure = SceneError | "catalog";

async function loadCatalog(signal: AbortSignal): Promise<Atlas> {
  // Bản gzip nhẹ hơn 6 lần (220 KB so với 1,3 MB); trình duyệt thiếu
  // DecompressionStream thì lấy bản thô.
  const compressed = typeof DecompressionStream !== "undefined";
  const response = await fetch(atlasDataUrl(compressed ? "atlas.json.gz" : "atlas.json"), {
    signal,
  });
  const buffer = await decodeModelResponse(response, null, compressed);
  const parsed = atlasSchema.safeParse(JSON.parse(new TextDecoder().decode(buffer)));
  if (!parsed.success) throw new Error(`atlas.json sai cấu trúc: ${parsed.error.message}`);
  return parsed.data;
}

/** `?structure=` trỏ tới khái niệm; dùng slug tiếng Anh, trùng tên thì dùng mã FMA. */
function linkValue(index: SearchIndex, concept: Concept): string {
  const slug = structureSlug(concept.name);
  return index.bySlug.get(slug)?.id === concept.id ? slug : concept.id;
}

function writeStructureParam(value: string | null) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set("structure", value);
  else url.searchParams.delete("structure");
  // `replaceState` chứ không `router.replace`: đổi URL để chia sẻ được, không
  // render lại route và không thêm một mục lịch sử cho mỗi lần chạm.
  window.history.replaceState(window.history.state, "", url);
}

export function HumanAtlas({
  articles,
}: {
  /** Mã FMA → bài đã kiểm là PUBLISHED lúc render trang. */
  articles: Record<string, StructureArticle[]>;
}) {
  const t = useTranslations("humanAtlas");
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  // Site mặc định tối; trước khi next-themes đọc xong thì coi như tối.
  const dark = resolvedTheme !== "light";

  const [attempt, setAttempt] = useState(0);
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState(initial);
  const [panel, setPanel] = useState<"layers" | "search" | null>(null);
  const [details, setDetails] = useState(false);
  const [about, setAbout] = useState(false);
  const [chosen, setChosen] = useState<Concept | null>(null);
  const [focusDetail, setFocusDetail] = useState(false);
  const deepLinked = useRef(false);

  // --------------------------------------------------------- tải danh mục
  useEffect(() => {
    const abort = new AbortController();
    setFailure(null);
    setProgress(0);
    loadCatalog(abort.signal)
      .then(setAtlas)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("[human-atlas] không tải được danh mục:", error);
        setFailure("catalog");
      });
    return () => abort.abort();
  }, [attempt]);

  const index = useMemo(() => (atlas ? buildSearchIndex(atlas) : null), [atlas]);
  const parts = useMemo(() => new Map(atlas?.parts.map((p) => [p.id, p])), [atlas]);
  const counts = useMemo(() => {
    const out = Object.fromEntries(SYSTEM_IDS.map((id) => [id, 0])) as Record<SystemId, number>;
    atlas?.parts.forEach((p) => {
      out[p.system] += 1;
    });
    return out;
  }, [atlas]);
  const activeSystems = useMemo(
    () => (atlas ? SYSTEM_IDS.filter((id) => counts[id] > 0) : [...SYSTEM_IDS]),
    [atlas, counts],
  );

  const selectedParts = state.selected
    .map((id) => parts.get(id))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const visibleCount =
    atlas?.parts.filter((p) =>
      state.isolate
        ? state.selected.includes(p.id)
        : state.visible.includes(p.system) || state.selected.includes(p.id),
    ).length ?? 0;
  const detailOpen = details && selectedParts.length > 0 && !!chosen;

  // ---------------------------------------------------------- thao tác
  const choose = useCallback(
    (
      concept: Concept,
      { focus = true, userInitiated = true, isolate = false } = {},
    ) => {
      setChosen(concept);
      setState((s) => ({
        ...s,
        selected: concept.elements,
        isolate,
        rotate: false,
        focus: focus ? s.focus + 1 : s.focus,
      }));
      setDetails(true);
      setFocusDetail(userInitiated);
      setPanel(null);
      if (index && userInitiated) writeStructureParam(linkValue(index, concept));
    },
    [index],
  );

  const choosePart = useCallback(
    (id: string) => {
      const p = parts.get(id);
      if (!p) return;
      setChosen({ id: p.conceptId, name: p.name, elements: [id] });
      setState((s) => ({ ...s, selected: [id], isolate: false, rotate: false }));
      setDetails(true);
      setFocusDetail(true);
      setPanel(null);
      const concept = index?.byId.get(p.conceptId.toLowerCase());
      if (index && concept) writeStructureParam(linkValue(index, concept));
    },
    [parts, index],
  );

  const clearSelection = () => {
    setState((s) => ({ ...s, selected: [], isolate: false }));
    setDetails(false);
    writeStructureParam(null);
  };

  const showOnly = (ids: SystemId[]) => {
    setDetails(false);
    setState((s) => ({ ...s, visible: ids, selected: [], isolate: false }));
  };

  const toggle = (id: SystemId) => {
    setDetails(false);
    setState((s) => ({
      ...s,
      selected: [],
      isolate: false,
      visible: s.visible.includes(id) ? s.visible.filter((x) => x !== id) : [...s.visible, id],
    }));
  };

  const reset = () => {
    setState((s) => ({ ...initial, reset: s.reset + 1, focus: s.focus }));
    setChosen(null);
    setDetails(false);
    setPanel(null);
    writeStructureParam(null);
  };

  const openPanel = (next: "layers" | "search") => {
    setDetails(false);
    setPanel((p) => (p === next ? null : next));
  };

  const retry = () => {
    setAtlas(null);
    setChosen(null);
    setDetails(false);
    setState(initial);
    deepLinked.current = false;
    setAttempt((n) => n + 1);
  };

  // ---------------------------------------------------------- deep link
  useEffect(() => {
    if (!index || deepLinked.current) return;
    deepLinked.current = true;
    const concept = resolveStructure(
      index,
      new URLSearchParams(window.location.search).get("structure"),
    );
    // Mở sẵn ở chế độ "Xem riêng": phần lớn cơ quan nằm sau lớp cơ và xương, nên
    // tô sáng mà không tách ra là tô sáng một thứ không ai thấy. Người đến từ
    // một link "xem tim" muốn thấy tim; nút "Hiện giải phẫu xung quanh" trả lại
    // toàn cảnh.
    if (concept) choose(concept, { focus: true, userInitiated: false, isolate: true });
  }, [index, choose]);

  // "/" mở tìm kiếm — giữ phím tắt của bản gốc, trừ khi đang gõ ở ô nhập khác.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setDetails(false);
        setPanel("search");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const labelFor = useCallback(
    (i: number) => {
      const p = atlas?.parts[i];
      return p ? displayName(locale, p.conceptId, p.name) : "";
    },
    [atlas, locale],
  );

  const onProgress = useCallback((n: number) => setProgress(n), []);
  const onError = useCallback((code: SceneError) => setFailure(code), []);

  const caption = state.isolate
    ? chosen
      ? displayName(locale, chosen.id, chosen.name)
      : t("caption.isolated")
    : state.explode > 0.95
      ? t("caption.inventory")
      : state.explode > 0.05
        ? t("caption.separated")
        : t("caption.assembled");

  const failureText =
    failure === "webgl"
      ? t("webglError")
      : failure === "context-lost"
        ? t("contextLost")
        : t("error");

  const crashed = (retryBoundary: () => void) => (
    <div className="absolute inset-0 grid place-items-center p-6">
      <div role="alert" className={cn(PANEL, "max-w-sm p-5 text-center")}>
        <AlertTriangle aria-hidden className="mx-auto size-5 text-warning" />
        <p className="mt-3 text-sm">{t("crashed")}</p>
        <Button
          className="mt-4"
          onClick={() => {
            retry();
            retryBoundary();
          }}
        >
          {t("retry")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="relative isolate size-full overflow-hidden bg-[#f2f3f3] text-foreground dark:bg-[#131b29]">
      <AtlasErrorBoundary fallback={crashed}>
        {atlas && !failure && (
          <AnatomyScene
            key={attempt}
            atlas={atlas}
            state={{ ...state, inspectorOpen: detailOpen }}
            dark={dark}
            ariaLabel={t("canvasLabel")}
            labelFor={labelFor}
            onSelect={choosePart}
            onProgress={onProgress}
            onError={onError}
          />
        )}
      </AtlasErrorBoundary>

      {/* Viền tối nhẹ ở mép — của bản gốc, giúp mô hình nổi khỏi nền phẳng. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_51%_43%,transparent_35%,rgb(131_145_158/0.08)_100%)]"
      />

      {/* ---------------------------------------------------- tiêu đề */}
      <header className="pointer-events-none absolute top-3 left-4 z-10 max-w-[calc(100%-8rem)] sm:top-5 lg:left-6">
        <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-success" />
          {t("eyebrow")}
        </p>
        <h1 className="mt-1 font-display text-lg leading-tight min-[400px]:text-xl font-bold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground atlas-short:hidden">
          {t("meta", { count: (atlas?.parts.length ?? PIECE_COUNT).toLocaleString(locale) })}
        </p>
      </header>

      <nav
        aria-label={t("search")}
        className="absolute top-3 right-3 z-20 flex items-center gap-2 sm:top-5 lg:right-6"
      >
        <Button
          variant="outline"
          className={cn("bg-background/85 backdrop-blur", panel === "search" && "bg-muted")}
          onClick={() => openPanel("search")}
          aria-label={t("search")}
          aria-expanded={panel === "search"}
        >
          <Search aria-hidden />
          <span className="hidden sm:inline">{t("search")}</span>
          <kbd className="hidden rounded border px-1.5 text-[10px] text-muted-foreground lg:inline">
            /
          </kbd>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-background/85 backdrop-blur"
          aria-label={t("about")}
          onClick={() => {
            setDetails(false);
            setPanel(null);
            setAbout(true);
          }}
        >
          <Info aria-hidden />
        </Button>
      </nav>

      {/* ------------------------------------------------------ bảng */}
      <SystemsPanel
        open={panel === "layers"}
        systems={activeSystems}
        counts={counts}
        visible={state.visible}
        visibleCount={visibleCount}
        locale={locale}
        presets={{ all: activeSystems, skeleton: ["skeletal"], organs: ORGAN_PRESET }}
        onClose={() => setPanel(null)}
        onToggle={toggle}
        onShowOnly={showOnly}
      />

      {panel === "search" && (
        <StructureSearch
          index={index}
          locale={locale}
          onChoose={(c) => choose(c)}
          onClose={() => setPanel(null)}
        />
      )}

      {detailOpen && chosen && (
        <StructureDetail
          concept={chosen}
          parts={selectedParts}
          isolate={state.isolate}
          locale={locale}
          articles={articles[chosen.id] ?? []}
          focusOnOpen={focusDetail}
          onIsolate={() => setState((s) => ({ ...s, isolate: !s.isolate, explode: 0 }))}
          onChoosePart={choosePart}
          onClear={clearSelection}
          onClose={() => setDetails(false)}
        />
      )}

      {/* ------------------------------------------ điều khiển camera */}
      <nav
        aria-label={t("cameraControls")}
        className={cn(
          PANEL,
          "absolute top-1/2 right-3 z-20 flex -translate-y-1/2 flex-col p-1 lg:right-6",
          // Điện thoại: ngay dưới hai nút trên cùng, không canh giữa — cột 6 nút canh
          // giữa trên màn 320×568 đè lên nút "Về bản đồ này". Bảng chi tiết mở thì
          // ẩn hẳn: bảng chiếm nửa dưới, và "Đặt lại" vẫn có ở thanh dưới.
          "atlas-phone:top-[4.25rem] atlas-phone:translate-y-0",
          detailOpen && "atlas-phone:hidden",
          // Xoay ngang: chỉ còn nút tự xoay + đặt lại (xoay tay bằng chạm), vì cột
          // đủ 6 nút chạm tới nút trợ lý AI cố định ở góc dưới phải.
          "atlas-short:top-14 atlas-short:translate-y-0",
        )}
      >
        {VIEWS.map((v) => (
          <Button
            key={v.id}
            variant="ghost"
            size="icon"
            className={cn("rounded-xl text-sm atlas-short:hidden", state.view === v.id && "bg-muted")}
            aria-pressed={state.view === v.id}
            disabled={state.explode > 0.8 && v.id !== "front"}
            aria-label={t(`views.${v.key}`)}
            title={t(`views.${v.key}`)}
            onClick={() =>
              setState((s) => ({ ...s, view: v.id, reset: s.reset + 1, rotate: false }))
            }
          >
            <span aria-hidden>{t(`viewsShort.${v.key}`)}</span>
          </Button>
        ))}
        <span aria-hidden className="mx-2 my-1 h-px bg-border atlas-short:hidden" />
        <Button
          variant="ghost"
          size="icon"
          className={cn("rounded-xl", state.rotate && "bg-muted")}
          disabled={state.explode >= 0.4}
          aria-pressed={state.rotate}
          aria-label={state.rotate ? t("pauseRotate") : t("rotate")}
          title={state.rotate ? t("pauseRotate") : t("rotate")}
          onClick={() => setState((s) => ({ ...s, rotate: !s.rotate }))}
        >
          {state.rotate ? <Pause aria-hidden /> : <RotateCw aria-hidden />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          aria-label={t("resetLabel")}
          title={t("resetLabel")}
          onClick={reset}
        >
          <RotateCcw aria-hidden />
        </Button>
      </nav>

      <p
        aria-hidden
        className="pointer-events-none absolute bottom-[9.5rem] left-1/2 hidden -translate-x-1/2 items-center gap-3 text-[11px] tracking-[0.15em] whitespace-nowrap text-muted-foreground uppercase atlas-wide:flex"
      >
        <span className="h-px w-6 bg-border" />
        {caption}
        <span className="h-px w-6 bg-border" />
      </p>

      {/* ---------------------------------------------------- thanh dưới
          Điện thoại: chừa 5rem bên phải cho nút trợ lý AI (position: fixed
          của layout) — không có khoảng này thì nút đó đè lên nút "Đặt lại". */}
      <div
        className={cn(
          PANEL,
          "absolute z-20 flex items-center gap-3 p-3",
          "atlas-phone:right-20 atlas-phone:bottom-[max(1rem,env(safe-area-inset-bottom))] atlas-phone:left-3",
          "atlas-short:bottom-3 atlas-short:left-3 atlas-short:w-[16rem]",
          "atlas-wide:bottom-12 atlas-wide:left-1/2 atlas-wide:w-[28rem] atlas-wide:-translate-x-1/2 atlas-wide:gap-5 atlas-wide:px-5",
        )}
      >
        <Button
          variant="ghost"
          className="h-auto flex-col gap-1 px-2 py-1.5 text-[11px] atlas-wide:hidden"
          onClick={() => openPanel("layers")}
          aria-label={t("openSystems")}
          aria-expanded={panel === "layers"}
          aria-controls="atlas-systems"
        >
          <Layers3 aria-hidden className="size-5" />
          <span className="max-[379px]:sr-only atlas-short:sr-only">{t("systems")}</span>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs whitespace-nowrap">
            <label htmlFor="atlas-explode" className="truncate font-medium">
              {t("explode")}
            </label>
            <output htmlFor="atlas-explode" className="text-muted-foreground tabular-nums">
              {Math.round(state.explode * 100)}%
            </output>
          </div>
          <input
            id="atlas-explode"
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(state.explode * 100)}
            onChange={(e) => {
              const v = Number(e.target.value);
              setState((s) => ({
                ...s,
                explode: v / 100,
                view: v > 80 ? "front" : s.view,
                rotate: false,
              }));
            }}
            className="block h-6 w-full cursor-pointer accent-[var(--accent)]"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground atlas-phone:hidden atlas-short:hidden">
            <span>{t("assembled")}</span>
            <span>{t("everyPiece")}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="h-auto flex-col gap-1 border-l px-3 py-1.5 text-[11px]"
          onClick={reset}
          aria-label={t("resetLabel")}
        >
          <RotateCcw aria-hidden className="size-5" />
          <span className="max-[379px]:sr-only atlas-short:sr-only">{t("reset")}</span>
        </Button>
      </div>

      <div className="absolute bottom-3 left-6 z-10 hidden items-center gap-4 text-[11px] text-muted-foreground atlas-wide:flex">
        <span>
          {state.explode > 0.8 ? t("hintPan") : t("hintOrbit")} · {t("hintZoom")} · {t("hintTap")}
        </span>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onClick={() => {
            setDetails(false);
            setPanel(null);
            setAbout(true);
          }}
        >
          {t("credits")}
          <ArrowUpRight aria-hidden className="size-3" />
        </button>
      </div>

      {/* -------------------------------------------- đang tải / lỗi */}
      {!failure && progress < 100 && (
        <div
          role="status"
          className={cn(
            PANEL,
            "absolute top-[42%] left-1/2 z-30 flex w-[min(20rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 items-center gap-4 p-5",
          )}
        >
          <Activity aria-hidden className="size-5 shrink-0 animate-pulse text-accent" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{atlas ? t("loading") : t("catalogLoading")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              {t("loadingDetail", {
                percent: progress,
                count: (atlas?.parts.length ?? PIECE_COUNT).toLocaleString(locale),
              })}
            </p>
            <div
              role="progressbar"
              aria-label={t("loading")}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="mt-3 h-1 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {failure && (
        <div
          role="alert"
          className={cn(
            PANEL,
            "absolute top-[42%] left-1/2 z-30 w-[min(22rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 p-5 text-center",
          )}
        >
          <AlertTriangle aria-hidden className="mx-auto size-5 text-warning" />
          <p className="mt-3 text-sm">{failureText}</p>
          <Button className="mt-4" onClick={retry}>
            {t("retry")}
          </Button>
        </div>
      )}

      {/* ------------------------------------------------ nguồn & ghi công */}
      <Sheet open={about} onOpenChange={setAbout}>
        <SheetContent className="w-[min(28rem,100vw)] overflow-y-auto p-6 pt-12 sm:max-w-md">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {t("aboutSheet.eyebrow")}
          </p>
          <SheetTitle className="font-display text-2xl font-bold tracking-tight">
            {t("aboutSheet.title")}
          </SheetTitle>
          <SheetDescription>{t("aboutSheet.lead")}</SheetDescription>
          <AboutCopy />
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Nội dung ghi công — dùng chung cho bảng "Nguồn & ghi công" và phần dưới trang. */
export function AboutCopy() {
  const t = useTranslations("humanAtlas.aboutSheet");
  const links = [
    ["license", "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html"],
    ["dataset", "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html"],
    ["publication", "https://doi.org/10.1093/nar/gkn613"],
  ] as const;
  return (
    <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <p>{t("scope")}</p>
      <p>{t("limits")}</p>
      <p>{t("purpose")}</p>
      <h3 className="pt-2 text-sm font-semibold text-foreground">{t("sourceHeading")}</h3>
      <p>{t("sourceText")}</p>
      <ul className="space-y-1.5">
        {links.map(([key, href]) => (
          <li key={key}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline"
            >
              {t(key)}
              <ArrowUpRight aria-hidden className="size-3.5" />
            </a>
          </li>
        ))}
      </ul>
      <h3 className="pt-2 text-sm font-semibold text-foreground">{t("appHeading")}</h3>
      <p>{t("appText")}</p>
      <a
        href="https://github.com/ashemag/human-atlas"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline"
      >
        {t("appLink")}
        <ArrowUpRight aria-hidden className="size-3.5" />
      </a>
      <p className="text-xs">{t("translation")}</p>
    </div>
  );
}
