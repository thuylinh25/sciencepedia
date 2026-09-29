"use client";

// Client: toàn bộ trạng thái của trình xem (hệ đang bật, cấu trúc đang chọn,
// độ tách) đổi theo từng thao tác chuột/chạm. Component vẫn được SSR: tiêu đề,
// khung và thông báo "đang tải" có trong HTML đầu tiên. Chỉ cảnh WebGL là
// `ssr: false`, nạp động bên dưới.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Info,
  LayoutGrid,
  Layers3,
  Pause,
  RotateCcw,
  RotateCw,
  Scan,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DEFAULT_VISIBLE,
  ORGAN_PRESET,
  CONCEPT_COUNT,
  effectivePeel,
  peelToExplode,
  PIECE_COUNT,
  SYSTEM_IDS,
  atlasSchema,
  correctSystems,
  type Atlas,
  type Concept,
  type SceneState,
  type SystemId,
  type View,
} from "@/lib/human-atlas/anatomy";
import { ANATOMY_DATA_FILE, anatomyDataUrl, atlasDataUrl } from "@/lib/human-atlas/assets";
import {
  anatomyDataSchema,
  type AnatomyData,
} from "@/lib/human-atlas/structures";
import { decodeModelResponse } from "@/lib/human-atlas/model-download";
import { ATLAS_PROVENANCE } from "@/lib/human-atlas/provenance";
import { SYSTEM_ORDER, SYSTEM_REAPPLY_EVENT, isSystemId } from "@/lib/human-atlas/systems";
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
import { ViewsGallery } from "@/components/human-atlas/views-gallery";
import { isUsableView, viewById, viewParts } from "@/lib/human-atlas/views";
import { withSupplements } from "@/lib/human-atlas/supplements";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { SceneError } from "@/components/human-atlas/anatomy-scene";

/**
 * three.js (~600 KB) và cảnh chỉ tải khi trang này chạy ở trình duyệt:
 * `ssr: false` + `import()` động tách chúng thành chunk riêng, nên trang chủ
 * và trang bài viết không mang theo một byte nào của atlas.
 */
const AnatomyScene = dynamic(() => import("@/components/human-atlas/anatomy-scene"), {
  ssr: false,
});

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
  // Nhìn thẳng: hộp bao chiếu lên màn đúng bằng chiều cao cơ thể, nên khung
  // mặc định to nhất có thể mà không cắt đầu/chân. Nhìn ¾ vẫn có ở cột camera.
  view: "front",
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
  return withSupplements(correctSystems(parsed.data));
}

/**
 * Dữ liệu FMA (tên Latin, đồng nghĩa, cha, TA98) — lớp làm giàu, không bắt
 * buộc. Tải SAU danh mục và không chặn gì: hỏng hay chưa phát hành
 * (`ANATOMY_DATA_FILE` null) thì atlas chạy y như trước, chỉ thiếu các dòng ấy.
 */
async function loadAnatomy(signal: AbortSignal): Promise<AnatomyData | null> {
  if (!ANATOMY_DATA_FILE) return null;
  // Cùng cách với `loadCatalog`: bản gzip 123 KB thay vì 1,5 MB thô.
  const compressed = typeof DecompressionStream !== "undefined";
  const response = await fetch(
    anatomyDataUrl(compressed ? `${ANATOMY_DATA_FILE}.gz` : ANATOMY_DATA_FILE),
    { signal },
  );
  const buffer = await decodeModelResponse(response, null, compressed);
  const parsed = anatomyDataSchema.safeParse(JSON.parse(new TextDecoder().decode(buffer)));
  if (!parsed.success) throw new Error(`dữ liệu FMA sai cấu trúc: ${parsed.error.message}`);
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

/** `?view=` theo cùng lối `?structure=`: đổi URL để chia sẻ, không thêm mục lịch sử. */
function writeViewParam(value: string | null) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set("view", value);
  else url.searchParams.delete("view");
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
  const [anatomy, setAnatomy] = useState<AnatomyData | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState(initial);
  const [panel, setPanel] = useState<"layers" | "search" | null>(null);
  const [gallery, setGallery] = useState(false);
  // Ảnh thu nhỏ chỉ chụp sau lần mở lưới đầu tiên: mỗi ảnh là một lượt vẽ cả mô
  // hình, chụp ngay khi tải là giật khung trên máy yếu cho người không mở lưới.
  const [galleryOpened, setGalleryOpened] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const onThumbnail = useCallback(
    (id: string, url: string) => setThumbnails((m) => ({ ...m, [id]: url })),
    [],
  );
  const [details, setDetails] = useState(false);
  const [about, setAbout] = useState(false);
  const [chosen, setChosen] = useState<Concept | null>(null);
  const [focusDetail, setFocusDetail] = useState(false);
  /** Người đọc đã chạm/kéo lần nào chưa — để hạ độ nổi của dòng gợi ý thao tác. */
  const [interacted, setInteracted] = useState(false);
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

  const loaded = atlas !== null;
  useEffect(() => {
    if (!loaded) return;
    const abort = new AbortController();
    loadAnatomy(abort.signal)
      .then(setAnatomy)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("[human-atlas] không tải được dữ liệu FMA:", error);
      });
    return () => abort.abort();
  }, [loaded]);

  const index = useMemo(
    () => (atlas ? buildSearchIndex(atlas, anatomy) : null),
    [atlas, anatomy],
  );
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
  const activeView = viewParts(state.viewId);
  const viewHidden = useMemo(() => (activeView ? new Set(activeView.hide) : null), [activeView]);
  const visibleCount =
    atlas?.parts.filter((p) =>
      state.isolate
        ? state.selected.includes(p.id)
        : (viewHidden
            ? p.system !== "integumentary" && !viewHidden.has(p.id)
            : state.visible.includes(p.system)) || state.selected.includes(p.id),
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

  // Đổi hệ luôn về nguyên khối: độ tách đang kéo dở của hệ trước không có
  // nghĩa gì với hệ mới, và người đọc cần thấy hệ ấy ở đúng chỗ trong cơ thể trước.
  // Đụng tới tập hệ là rời góc nhìn: góc nhìn là một tập mảnh cố định, bật thêm
  // một hệ vào nó thì không còn là góc nhìn ấy nữa.
  const showOnly = (ids: SystemId[]) => {
    setDetails(false);
    leaveViewParam();
    setState((s) => ({ ...s, visible: ids, selected: [], isolate: false, explode: 0, viewId: null }));
  };

  const toggle = (id: SystemId) => {
    setDetails(false);
    leaveViewParam();
    setState((s) => ({
      ...s,
      selected: [],
      isolate: false,
      explode: 0,
      viewId: null,
      visible: s.visible.includes(id) ? s.visible.filter((x) => x !== id) : [...s.visible, id],
    }));
  };

  const reset = () => {
    // Giữ các hệ đang bật: "Đặt lại" là đặt lại CAMERA và độ tách cho thứ người
    // đọc đang xem, không phải bỏ lựa chọn hệ của họ.
    // Bộ đếm là "số lần bấm", không phải trạng thái: đưa zoomIn/zoomOut về 0 là
    // cảnh đọc thành một lượt thu nhỏ, và tween đó đè mất tween về khung vừa.
    setState((s) => ({
      ...initial,
      visible: s.visible,
      reset: s.reset + 1,
      focus: s.focus,
      zoomIn: s.zoomIn,
      zoomOut: s.zoomOut,
      fitFrame: s.fitFrame,
    }));
    setChosen(null);
    setDetails(false);
    setPanel(null);
    writeStructureParam(null);
    leaveViewParam();
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

  // ------------------------------------------------ deep link ?system=
  /*
   * `?system=nervous` mở viewer với đúng một hệ (thẻ hệ ở trang giới thiệu,
   * link từ bài viết — `systemHref()` trong systems.ts). Đọc bằng
   * useSearchParams nên Back/Forward của trình duyệt áp lại đúng hệ: rời một
   * `?system=` về trang trơn thì trả lại mọi hệ như mặc định.
   */
  const systemParam = useSearchParams().get("system");
  const lastSystemParam = useRef<string | null>(null);
  const showSystem = useCallback((id: SystemId) => {
    setChosen(null);
    setDetails(false);
    if (lastViewParam.current !== null) {
      lastViewParam.current = null;
      writeViewParam(null);
    }
    setState((s) => ({
      ...s,
      viewId: null,
      visible: [id],
      selected: [],
      isolate: false,
      explode: 0,
      view: "front",
      reset: s.reset + 1,
    }));
  }, []);
  // Bấm lại thẻ của hệ đang có trong URL — xem SYSTEM_REAPPLY_EVENT.
  useEffect(() => {
    const onReapply = (event: Event) => {
      const id = (event as CustomEvent<unknown>).detail;
      if (typeof id === "string" && isSystemId(id)) showSystem(id);
    };
    window.addEventListener(SYSTEM_REAPPLY_EVENT, onReapply);
    return () => window.removeEventListener(SYSTEM_REAPPLY_EVENT, onReapply);
  }, [showSystem]);
  useEffect(() => {
    const previous = lastSystemParam.current;
    if (systemParam === previous) return;
    lastSystemParam.current = systemParam;
    if (isSystemId(systemParam)) {
      showSystem(systemParam);
    } else if (isSystemId(previous)) {
      setState((s) => ({ ...s, visible: DEFAULT_VISIBLE, explode: 0, reset: s.reset + 1 }));
    }
  }, [systemParam, showSystem]);

  // ------------------------------------------------ góc nhìn ?view=
  /*
   * Chọn góc nhìn: mọi hệ trừ da (cảnh đọc `viewId` để ẩn thêm và khung
   * camera), danh sách hệ bật tương ứng, về nguyên khối. `?view=` ghi bằng
   * replaceState; mở link có `?view=` thì áp lại — kể cả khi có `?system=`,
   * vì góc nhìn cụ thể hơn.
   */
  const lastViewParam = useRef<string | null>(null);
  function leaveViewParam() {
    if (lastViewParam.current === null) return;
    lastViewParam.current = null;
    writeViewParam(null);
  }
  const selectView = useCallback(
    (id: string, writeUrl: boolean) => {
      if (!isUsableView(id)) return;
      setChosen(null);
      setDetails(false);
      setState((s) => ({
        ...s,
        viewId: id,
        visible: activeSystems.filter((x) => x !== "integumentary"),
        selected: [],
        isolate: false,
        explode: 0,
        rotate: false,
      }));
      if (writeUrl) {
        lastViewParam.current = id;
        writeViewParam(id);
      }
    },
    [activeSystems],
  );
  const viewParam = useSearchParams().get("view");
  useEffect(() => {
    if (viewParam === lastViewParam.current) return;
    lastViewParam.current = viewParam;
    if (viewParam && isUsableView(viewParam)) selectView(viewParam, false);
  }, [viewParam, selectView]);
  // Tập hệ của góc nhìn đọc từ bản đồ mảnh — link mở trước khi danh mục tải xong
  // thì tính lại một lần khi có dữ liệu.
  useEffect(() => {
    if (atlas && state.viewId) selectView(state.viewId, false);
    // Chỉ chạy khi danh mục vừa về, không mỗi lần đổi góc nhìn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atlas]);
  const closeGallery = useCallback(() => setGallery(false), []);
  const clearView = () => {
    const def = viewById(state.viewId);
    leaveViewParam();
    setState((s) => ({ ...s, viewId: null, visible: def ? [def.systemId] : s.visible, reset: s.reset + 1 }));
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

  /** Độ tách KHÔNG GIAN (nửa đầu slider là bóc lớp, cảnh vẫn nguyên khối). */
  const spread = peelToExplode(effectivePeel(state.explode, state.visible));
  // Thứ tự hiển thị chung với trang giới thiệu (`SYSTEM_ORDER`): bề mặt cơ thể
  // đứng đầu — lớp ngoài cùng, thứ người đọc thấy trước.
  const panelSystems = useMemo(
    () => SYSTEM_ORDER.filter((id) => activeSystems.includes(id)),
    [activeSystems],
  );

  const viewDef = viewById(state.viewId);
  const viewName = viewDef ? (locale === "vi" ? viewDef.name.vi : viewDef.name.en) : null;
  const caption = viewName && !state.isolate && spread < 0.05
    ? viewName
    : state.isolate
    ? chosen
      ? displayName(locale, chosen.id, chosen.name)
      : t("caption.isolated")
    : spread > 0.95
      ? t("caption.inventory")
      : spread > 0.05
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
    <TooltipProvider>
    <div
      className="relative isolate size-full overflow-hidden bg-[#eef0f1] text-foreground dark:bg-[#05070a]"
      onPointerDownCapture={interacted ? undefined : () => setInteracted(true)}
      onWheelCapture={interacted ? undefined : () => setInteracted(true)}
    >
      <AtlasErrorBoundary fallback={crashed}>
        {atlas && !failure && (
          <AnatomyScene
            key={attempt}
            atlas={atlas}
            state={{ ...state, inspectorOpen: detailOpen }}
            dark={dark}
            ariaLabel={t("canvasLabel")}
            scrollLabel={t("scrollBody")}
            labelFor={labelFor}
            onSelect={choosePart}
            onProgress={onProgress}
            onError={onError}
            onThumbnail={galleryOpened ? onThumbnail : undefined}
          />
        )}
      </AtlasErrorBoundary>

      {/* Viền tối nhẹ ở mép — của bản gốc, giúp mô hình nổi khỏi nền phẳng. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_51%_43%,transparent_35%,rgb(131_145_158/0.08)_100%)]"
      />

      {/* ---------------------------------------------------- tiêu đề */}
      <header data-atlas-avoid="top" className="pointer-events-none absolute top-3 left-4 z-10 max-w-[calc(100%-8rem)] sm:top-5 lg:left-6">
        <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-success" />
          {t("eyebrow")}
        </p>
        <h1 className="mt-1 font-display text-lg leading-tight min-[400px]:text-xl font-bold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground atlas-short:hidden">
          {/* Chỉ mảnh BodyParts3D — dòng này ghi nguồn đó; mảnh bổ sung có ghi công riêng. */}
          {t("meta", { count: PIECE_COUNT.toLocaleString(locale) })}
        </p>
      </header>

      <nav
        data-atlas-avoid="top"
        aria-label={t("search")}
        className="absolute top-3 right-3 z-20 flex items-center gap-2 sm:top-5 lg:right-6"
      >
        <Button
          variant="outline"
          className="bg-background/85 backdrop-blur"
          onClick={() => {
            setDetails(false);
            setPanel(null);
            setGallery(true);
            setGalleryOpened(true);
          }}
          aria-label={t("atlasViews.openLabel")}
          aria-haspopup="dialog"
        >
          <LayoutGrid aria-hidden />
          <span className="hidden sm:inline">{t("atlasViews.open")}</span>
        </Button>
        <Button
          variant="outline"
          className={cn("bg-background/85 backdrop-blur", panel === "search" && "bg-muted")}
          onClick={() => openPanel("search")}
          aria-label={t("search")}
          aria-expanded={panel === "search"}
        >
          <Search aria-hidden />
          {/* Nói rõ tìm GÌ — để không lẫn với ô tìm bài viết trên header. Chỉ
              hiện từ `sm`; điện thoại chỉ còn icon, tên đầy đủ ở aria-label. */}
          <span className="hidden sm:inline">{t("searchButton")}</span>
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
        systems={panelSystems}
        counts={counts}
        visible={state.visible}
        visibleCount={visibleCount}
        totalCount={atlas?.parts.length ?? PIECE_COUNT}
        locale={locale}
        presets={{ all: activeSystems, skeleton: ["skeletal"], organs: ORGAN_PRESET }}
        onClose={() => setPanel(null)}
        onToggle={toggle}
        onShowOnly={showOnly}
      />

      {gallery && (
        <ViewsGallery
          locale={locale}
          activeViewId={state.viewId ?? null}
          thumbnails={thumbnails}
          onChoose={(id) => {
            selectView(id, true);
            setGallery(false);
            setPanel(null);
          }}
          onClose={closeGallery}
        />
      )}

      {viewName && (
        <div
          data-atlas-avoid="top"
          className={cn(
            PANEL,
            "absolute z-20 flex items-center gap-1 rounded-full py-1 pr-1 pl-3 text-xs font-medium",
            "atlas-wide:top-5 atlas-wide:left-1/2 atlas-wide:-translate-x-1/2",
            "atlas-phone:top-[5.75rem] atlas-phone:left-4",
            "atlas-short:top-3 atlas-short:left-1/2 atlas-short:-translate-x-1/2",
          )}
        >
          <span>{t("atlasViews.chip", { name: viewName })}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 rounded-full"
            onClick={clearView}
            aria-label={t("atlasViews.clear", { name: viewName })}
          >
            <X aria-hidden />
          </Button>
        </div>
      )}

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
          anatomy={anatomy}
          focusOnOpen={focusDetail}
          onIsolate={() => setState((s) => ({ ...s, isolate: !s.isolate, explode: 0 }))}
          onChoosePart={choosePart}
          onClear={clearSelection}
          onClose={() => setDetails(false)}
        />
      )}

      {/* ------------------------------------------ điều khiển camera */}
      <nav
        data-atlas-avoid="right"
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
          <ToolButton
            key={v.id}
            label={t(`views.${v.key}`)}
            active={state.view === v.id}
            className="text-[11px] font-semibold atlas-short:hidden"
            disabled={spread > 0.8 && v.id !== "front"}
            onClick={() =>
              setState((s) => ({ ...s, view: v.id, reset: s.reset + 1, rotate: false }))
            }
          >
            <span aria-hidden>{t(`viewsShort.${v.key}`)}</span>
          </ToolButton>
        ))}
        <span aria-hidden className="mx-2 my-1 h-px bg-border atlas-short:hidden" />
        <ToolButton
          label={state.rotate ? t("pauseRotate") : t("rotate")}
          active={state.rotate}
          disabled={spread >= 0.4}
          onClick={() => setState((s) => ({ ...s, rotate: !s.rotate }))}
        >
          {state.rotate ? <Pause aria-hidden /> : <RotateCw aria-hidden />}
        </ToolButton>
        <ToolButton label={t("resetLabel")} onClick={reset}>
          <RotateCcw aria-hidden />
        </ToolButton>
        <span aria-hidden className="mx-2 my-1 h-px bg-border atlas-short:hidden" />
        {/* Zoom bằng nút: không phải ai cũng có con lăn hay biết chụm hai ngón. */}
        <ToolButton label={t("zoomInLabel")} onClick={() => setState((s) => ({ ...s, zoomIn: (s.zoomIn ?? 0) + 1 }))}>
          <ZoomIn aria-hidden />
        </ToolButton>
        <ToolButton label={t("zoomOutLabel")} onClick={() => setState((s) => ({ ...s, zoomOut: (s.zoomOut ?? 0) + 1 }))}>
          <ZoomOut aria-hidden />
        </ToolButton>
        <ToolButton label={t("fitLabel")} onClick={() => setState((s) => ({ ...s, fitFrame: (s.fitFrame ?? 0) + 1 }))}>
          <Scan aria-hidden />
        </ToolButton>
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
        data-atlas-avoid="bottom"
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
              {/* Điện thoại: thanh này chung hàng với hai nút, chỉ đủ chỗ cho nhãn ngắn. */}
              <span className="atlas-phone:hidden atlas-short:hidden">{t("explode")}</span>
              <span className="hidden atlas-phone:inline atlas-short:inline">{t("explodeShort")}</span>
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
                view: peelToExplode(effectivePeel(v / 100, s.visible)) > 0.6 ? "front" : s.view,
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

      <div
        className={cn(
          "absolute bottom-3 left-6 z-10 hidden items-center gap-4 text-xs atlas-wide:flex",
          // Chưa thao tác lần nào: đậm hơn một bậc để người mới thấy cách dùng;
          // sau cú chạm đầu tiên thì lùi về màu phụ — vẫn đọc được, không tranh
          // chỗ với mô hình.
          "transition-colors duration-700",
          interacted ? "text-muted-foreground" : "text-foreground/85",
        )}
      >
        <span>
          {spread > 0.8 ? t("hintPan") : t("hintOrbit")} • {t("hintZoom")} • {t("hintTap")}
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

      {/* Điện thoại: không có dòng gợi ý ở đáy (thanh điều khiển chiếm chỗ), nên
          hiện một viên gợi ý phía trên thanh cho tới lần chạm đầu tiên rồi ẩn.
          `pointer-events-none`: không bao giờ chặn cú chạm vào mô hình. */}
      {!interacted && progress >= 100 && !failure && (
        <p
          aria-hidden
          className="pointer-events-none absolute inset-x-3 bottom-[calc(6.75rem+env(safe-area-inset-bottom))] z-10 hidden justify-center atlas-phone:flex"
        >
          <span className="rounded-full bg-background/85 px-3 py-1.5 text-center text-xs text-foreground/85 shadow-sm backdrop-blur">
            {t("hintTouch")}
          </span>
        </p>
      )}

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
    </TooltipProvider>
  );
}

/**
 * Nút của cột điều khiển camera: chỉ có icon/chữ tắt, nên tên đầy đủ nằm ở
 * `aria-label` (cho trình đọc màn hình và màn cảm ứng) VÀ ở tooltip (cho chuột
 * và bàn phím — Radix mở tooltip cả khi focus bằng Tab). Không dùng `title`:
 * nó chồng thêm một tooltip thứ hai của trình duyệt.
 */
function ToolButton({
  label,
  active,
  className,
  children,
  ...props
}: ComponentProps<typeof Button> & { label: string; active?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          aria-pressed={active}
          className={cn(
            "rounded-xl",
            active && "bg-primary/15 text-primary-strong ring-1 ring-primary/40 ring-inset hover:bg-primary/20",
            className,
          )}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Nguồn dữ liệu giải phẫu — dùng chung cho bảng "Nguồn & ghi công" trong viewer
 * và cột bên của trang giới thiệu.
 *
 * Ba khối theo VAI TRÒ, không theo loại giấy tờ: mô hình 3D (BodyParts3D),
 * thuật ngữ (FMA), trình xem (Human Atlas). Khối "Sciencepedia" đã bỏ theo yêu
 * cầu chủ sản phẩm (2026-09-29): nguồn phần Sciencepedia viết nằm ngay dưới
 * chính nội dung ấy (danh sách hệ, bảng chi tiết), nhãn tên dịch ghép nằm ở
 * từng cấu trúc. Bản trước
 * gộp "tên tiếng Anh, Latin, đồng nghĩa, cha, TA98 lấy từ FMA" — sai một vế:
 * tên tiếng Anh hiển thị là tên của BodyParts3D (header OBJ), FMA chỉ cho
 * Latin, đồng nghĩa, cha và TA98. Mọi URL/giấy phép đọc từ `ATLAS_PROVENANCE`;
 * số mảnh/khái niệm từ hằng số, không viết trong chuỗi dịch.
 */
export function AboutCopy() {
  const t = useTranslations("humanAtlas.aboutSheet");
  const { model, terminology, viewer, lymphatic } = ATLAS_PROVENANCE;
  return (
    <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
      <SourceBlock
        heading={t("modelHeading")}
        name={`${model.name} ${model.version}`}
        credit={`© ${model.holder} · ${model.license}`}
        links={[
          [t("licenseLink"), model.licenseUrl],
          [t("sourceLink", { release: model.release }), model.sourceUrl],
          [t("publicationLink", { label: model.publication.label }), model.publication.url],
        ]}
      >
        {t("modelText", { pieces: PIECE_COUNT, concepts: CONCEPT_COUNT })}
      </SourceBlock>

      <SourceBlock
        heading={t("termsHeading")}
        name={`Foundational Model of Anatomy (FMA) ${terminology.version}`}
        credit={`© ${terminology.publisher} · ${terminology.license}`}
        links={[
          [t("releaseLink"), terminology.url],
          [t("licenseLink"), terminology.licenseFileUrl],
        ]}
      >
        {t("termsText")}
      </SourceBlock>

      <SourceBlock
        heading={t("lymphHeading")}
        name={lymphatic.name}
        credit={`© ${lymphatic.holder} · ${lymphatic.license}`}
        links={[
          [t("licenseLink"), lymphatic.licenseUrl],
          [t("lymphSourceLink"), lymphatic.sourceUrl],
          [t("lymphOriginalLink"), lymphatic.originalUrl],
        ]}
      >
        {t("lymphText")}
      </SourceBlock>

      <SourceBlock
        heading={t("viewerHeading")}
        name={viewer.name}
        credit={`${viewer.author} · ${viewer.license}`}
        links={[[t("viewerLink"), viewer.sourceUrl]]}
      >
        {t("viewerText")}
      </SourceBlock>

      <p className="text-xs">{t("disclaimer")}</p>
    </div>
  );
}

function SourceBlock({
  heading,
  name,
  credit,
  links = [],
  children,
}: {
  heading: string;
  name?: string;
  credit?: string;
  links?: (readonly [string, string])[];
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {heading}
      </h3>
      {name && <p className="mt-1 font-medium text-foreground">{name}</p>}
      <div className="mt-1">{children}</div>
      {credit && <p className="mt-1 text-xs">{credit}</p>}
      {links.length > 0 && (
        <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
          {links.map(([label, href]) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                // Hai link cùng chữ "Giấy phép" (BodyParts3D, FMA): tên nguồn vào
                // nhãn truy cập. Nhãn vẫn chứa chữ hiển thị (WCAG 2.5.3).
                aria-label={name ? `${label}: ${name}` : undefined}
                className="inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline"
              >
                {label}
                <ArrowUpRight aria-hidden className="size-3.5" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
