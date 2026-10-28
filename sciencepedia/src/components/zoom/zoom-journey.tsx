"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Loader2, ZoomIn, ZoomOut } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { EARTH_CLOUDS_TEXTURE, PLANETS } from "@/lib/solar-data";
import {
  ZOOM_LEVELS,
  magnitude,
  stepRatio,
  type ZoomLevel,
} from "@/lib/zoom-levels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WarpTransition } from "@/components/zoom/warp-transition";
import type {
  ZoomTargetPoint,
  ZoomTargetRef,
} from "@/components/zoom/target-tracker";

const UniverseScene = dynamic(
  () =>
    import("@/components/universe/universe-scene").then((m) => m.UniverseScene),
  { ssr: false },
);
const GalaxyScene = dynamic(
  () => import("@/components/galaxy/galaxy-scene").then((m) => m.GalaxyScene),
  { ssr: false },
);
const SolarScene = dynamic(
  () => import("@/components/solar/scene").then((m) => m.SolarScene),
  { ssr: false },
);
const GlobeScene = dynamic(
  () => import("@/components/solar/globe-scene").then((m) => m.GlobeScene),
  { ssr: false },
);

/** Thời gian chuyển cấp, mili giây.

    900 → 1300 khi thêm lớp bay xuyên không gian: dưới chừng 1,2 giây thì tên
    lửa chưa kịp đọc ra là tên lửa đã mất hút, chỉ còn một vệt loé. */
const FADE_MS = 1300;

/** Tổng `deltaY` cần gom trước khi một lượt cuộn tính là một nấc. Bàn di chuột
    bắn hàng chục sự kiện nhỏ cho một cú vuốt; chuột có nấc bắn ~100 mỗi nấc. */
const WHEEL_THRESHOLD = 60;

/** 27 → 10²⁷. Dùng `<sup>` chứ không ký tự mũ Unicode: font mono của trang
    thiếu glyph ⁴–⁹, trình duyệt vá bằng font khác và số mũ lệch cỡ. */
function PowerOfTen({ exp }: { exp: number }) {
  return (
    <>
      10<sup className="ml-px text-[0.75em]">{exp}</sup>
    </>
  );
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

/** Tâm khung — đích dự phòng khi không nhắm được đích thật (đích ra khỏi
    khung sau khi người xem kéo xoay, hoặc ở sau camera). Bay vào tâm là hành
    vi cũ trước P2; giữ nó làm phương án lùi thì một cú kéo xấu chỉ làm mất
    độ chính xác của một lượt chuyển, không làm hỏng cả hành trình. */
const CENTER: ZoomTargetPoint = { x: 50, y: 50 };

/** Điểm đích dùng được hay không: phải nằm trong khung. Ngoài khung thì
    phóng quanh nó chỉ kéo cảnh đi ngang, đọc không ra "lao vào chấm đó". */
function usableTarget(point: ZoomTargetPoint | null): ZoomTargetPoint | null {
  if (!point) return null;
  return point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100
    ? point
    : null;
}

/** Góc xuất phát của tàu trong lớp bay, phần trăm khung (xem keyframes
    `warp-ship-*` trong globals.css: điểm đầu của chiều vào, điểm cuối của
    chiều ra). */
const SHIP_START: ZoomTargetPoint = { x: 28, y: 74 };

/**
 * Hướng mũi tàu cho một chuyến bay từ `from` tới `to`.
 *
 * Tàu vẽ mũi hướng phải. Bay về phía phải thì xoay thẳng theo hướng bay;
 * bay về phía trái thì lật gương (`flip: -1`) rồi mới xoay — xoay 180° sẽ
 * lộn buồng lái xuống dưới, cùng lý do lớp bay trước đây dùng `scaleX(-1)`
 * cho chiều ra. `aspect` là tỉ lệ rộng/cao của khung: toạ độ đang là phần
 * trăm, hai trục khác đơn vị thật, không quy đổi thì góc lệch theo khung.
 */
function shipPose(
  from: ZoomTargetPoint,
  to: ZoomTargetPoint,
  aspect: number,
): { rot: number; flip: 1 | -1 } {
  const theta =
    (Math.atan2(to.y - from.y, (to.x - from.x) * aspect) * 180) / Math.PI;
  if (theta >= -90 && theta <= 90) return { rot: theta, flip: 1 };
  return { rot: 180 - theta, flip: -1 };
}

/**
 * Vòng đánh dấu đích cấp kế tiếp, nổi trên cảnh hiện tại.
 *
 * Vị trí đọc từ `targetRef` bằng rAF và ghi thẳng vào style: đích di chuyển
 * liên tục (đĩa quay, Trái Đất chạy) mà đưa qua state thì cả cây React render
 * lại 60 lần mỗi giây. Đích ra khỏi khung thì vòng mờ hẳn đi — không có vòng
 * nào để bấm, và nút Thu vào vẫn còn đó với phương án lùi vào tâm.
 */
function TargetMarker({
  targetRef,
  color,
  label,
  ariaLabel,
  reducedMotion,
  onActivate,
}: {
  targetRef: ZoomTargetRef;
  color: string;
  label: string;
  ariaLabel: string;
  reducedMotion: boolean;
  onActivate: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      const point = usableTarget(targetRef.current);
      if (el) {
        if (point) {
          el.style.left = `${point.x}%`;
          el.style.top = `${point.y}%`;
          el.style.opacity = "1";
          el.style.pointerEvents = "auto";
        } else {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetRef]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onActivate}
      aria-label={ariaLabel}
      className="absolute z-10 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-300 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
      style={{ left: "50%", top: "50%", opacity: 0, pointerEvents: "none" }}
    >
      {/* Vòng lan toả + vòng tĩnh + chấm tâm: cùng ngữ pháp với vòng đập ở
          dấu Mặt Trời và vòng ngắm của mạng vũ trụ trong cảnh 3D. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-full border-2",
          !reducedMotion && "zoom-target-ring",
        )}
        style={{ borderColor: color }}
      />
      <span
        aria-hidden
        className="absolute inset-0 rounded-full border-2"
        style={{ borderColor: color }}
      />
      <span
        aria-hidden
        className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span
        className="absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap backdrop-blur"
        style={{
          borderColor: color,
          color,
          backgroundColor: "rgb(0 0 0 / 0.45)",
        }}
      >
        {label}
      </span>
    </button>
  );
}

/*
 * Ba cảnh trong hành trình đều BẬT nhãn, giống hệt trang mô hình đầy đủ.
 *
 * Trước đây tắt hết để khung trông gọn. Nhưng gọn ở đây đổi bằng việc người
 * xem nhìn một đĩa sao mà không biết nhánh nào là nhánh nào, chấm nào là Mặt
 * Trời — và hành trình này tồn tại để chỉ ra đúng những thứ đó. Một cảnh đẹp
 * mà không đọc được thì không dạy gì.
 */
function LevelScene({
  level,
  locale,
  targetRef,
}: {
  level: ZoomLevel;
  locale: string;
  /** Hộp để cảnh ghi toạ độ màn hình của đích cấp kế tiếp (Ngân Hà trong
      mạng vũ trụ, Mặt Trời trong đĩa, Trái Đất trên quỹ đạo). Cấp Trái Đất
      không có cấp kế tiếp nên không dùng. */
  targetRef?: ZoomTargetRef;
}) {
  const earth = PLANETS.find((planet) => planet.id === "earth");


  switch (level.id) {
    case "universe":
      return (
        <UniverseScene
          settings={{
            playing: true,
            speed: 1,
            showFilaments: true,
            scientific: false,
            showScales: false,
            showLabels: true,
            distance: 26,
          }}
          locale={locale}
          targetRef={targetRef}
        />
      );
    case "milky-way":
      return (
        <GalaxyScene
          settings={{
            playing: true,
            speed: 1,
            showLabels: true,
            showSun: true,
            showObjects: true,
            view: "free",
            tour: false,
            scientific: false,
          }}
          onSelect={() => {}}
          locale={locale}
          onTourStep={() => {}}
          onTourEnd={() => {}}
          targetRef={targetRef}
        />
      );
    case "solar-system":
      return (
        <SolarScene
          settings={{
            playing: true,
            speed: 1,
            showOrbits: true,
            showLabels: true,
            realScale: false,
            showMoons: false,
            showDwarfs: false,
            showEcliptic: false,
          }}
          selectedId={null}
          onSelect={() => {}}
          locale={locale}
          targetRef={targetRef}
        />
      );
    case "earth":
      return earth ? (
        <GlobeScene
          body={{
            texture: earth.texture,
            fallbackColor: earth.color,
            axialTilt: earth.axialTilt,
            clouds: EARTH_CLOUDS_TEXTURE,
            /* Xanh lam nhạt, cường độ dưới 1.

               Màu lấy theo thứ gây ra nó: khí quyển sáng ở rìa vì phân tử khí
               tán xạ ánh sáng bước sóng ngắn mạnh hơn — cùng cơ chế làm bầu
               trời xanh. Nên một quầng xanh lam là mô tả đúng, không phải một
               lựa chọn màu.

               0,85 chứ không 1: ở cường độ đầy, vành sáng bắt đầu đè lên
               đường bờ biển ở rìa đĩa và nuốt mất chi tiết đúng chỗ mắt hay
               nhìn nhất. */
            atmosphere: { color: "#6ba8ff", intensity: 0.85 },
          }}
          spinning
          /* 3,2 → 3,6: lùi camera ra chừng 12%, tức đĩa Trái Đất nhỏ đi chừng
             ấy trong khung.

             Lùi camera chứ không thu nhỏ quả cầu: thu nhỏ mesh sẽ kéo theo cả
             vỏ mây và vỏ khí quyển phải tính lại bán kính, và ba con số phải
             đi cùng nhau mãi mãi. Đổi chỗ đứng thì chỉ một con số đổi.

             Nó cũng chừa chỗ cho quầng khí quyển: ở 3,2 vành sáng chạm sát
             mép khung trên và dưới, nên thứ vừa thêm vào lại bị xén. */
          distance={3.6}
        />
      ) : null;
    default:
      return null;
  }
}

/**
 * Hành trình thu phóng bốn cấp.
 *
 * Mỗi lúc chỉ có một cảnh được gắn, trừ khoảng gần một giây lúc chuyển cấp khi
 * cả hai cùng tồn tại để hoà mờ. Chuyển động phóng to nằm ở lớp CSS chứ không
 * ở camera: cảnh đi ra phóng to dần rồi mờ đi, cảnh đi vào bắt đầu từ nhỏ rồi
 * lớn lên. Nhờ vậy không phải sửa gì bên trong ba cảnh đã có, và mỗi cảnh vẫn
 * giữ nguyên tỉ lệ riêng của nó.
 *
 * Phủ lên trên là lớp bay xuyên không gian (`WarpTransition`): vệt sao và một
 * tên lửa lao vào tâm khi thu vào, bay ngược ra khi thu ra — chủ sản phẩm yêu
 * cầu 2026-10-03. Người bật "giảm chuyển động" không thấy lớp này.
 *
 * Từ P2, "tâm" ở trên là đích thật của cấp kế tiếp trong cảnh — Ngân Hà,
 * Mặt Trời, Trái Đất — do các cảnh báo ra qua `target-tracker.tsx`, và cả
 * ba lớp (phóng của cảnh cũ, vệt sao, tàu) cùng nhắm vào đó; cảnh hiện tại
 * còn hiện một vòng "Phóng vào đây" tại đích. Trước P2 mọi lớp đều nhắm tâm
 * khung: Ngân Hà → Hệ Mặt Trời lao vào lõi thiên hà, Hệ Mặt Trời → Trái Đất
 * lao vào Mặt Trời — hình ảnh dạy sai vị trí trên một trang dạy tỉ lệ.
 */
export function ZoomJourney() {
  const t = useTranslations("zoom");
  const tSolar = useTranslations("solar");
  const locale = useLocale();

  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [index, setIndex] = useState(0);
  const [outgoing, setOutgoing] = useState<{
    id: string;
    direction: "in" | "out";
    /** Tăng mỗi lượt chuyển — làm `key` để lớp bay chạy lại từ đầu khi bấm
        liên tiếp, kể cả hai lượt cùng chiều. */
    seq: number;
  } | null>(null);
  const seq = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timer = useRef<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  /* Một hộp đích cho mỗi cấp, cảnh của cấp đó ghi toạ độ màn hình của cấp
     kế tiếp vào hộp của mình (xem `target-tracker.tsx`). Tạo một lần rồi giữ
     nguyên danh tính qua mọi lần render: cảnh nhận hộp qua props, hộp đổi
     chủ là neo trong cảnh mất chỗ ghi. */
  const targetRefs = useRef<ZoomTargetRef[]>([]);
  if (targetRefs.current.length === 0) {
    targetRefs.current = ZOOM_LEVELS.map(() => ({ current: null }));
  }

  /* Điểm đích "sống" cho lớp bay đọc mỗi khung hình. Thu vào thì chốt ở lúc
     bấm (ảnh chụp vị trí Trái Đất đúng khoảnh khắc đó); lùi ra thì effect bên
     dưới chép liên tục từ hộp của cảnh cha vừa gắn. */
  const focusRef = useRef<ZoomTargetPoint | null>(null);

  /* Thông số tàu cho lượt chuyển hiện tại. Keyframes CSS chốt giá trị lúc
     hoạt ảnh bắt đầu nên tàu phải có số trước khi lớp bay gắn; chiều lùi ra
     phải chờ cảnh cha báo đích nên state này có thể đến trễ vài khung — lớp
     bay chỉ gắn khi state khớp `seq` của lượt chuyển. */
  const [ship, setShip] = useState<{
    seq: number;
    x: number;
    y: number;
    rot: number;
    flip: 1 | -1;
  } | null>(null);
  const shipTimer = useRef<number | null>(null);

  useEffect(() => {
    setWebgl(supportsWebGL());
    setReducedMotion(prefersReducedMotion());
  }, []);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
    if (shipTimer.current) window.clearTimeout(shipTimer.current);
  }, []);

  const frameAspect = useCallback(() => {
    const frame = frameRef.current;
    if (!frame || frame.clientHeight === 0) return 16 / 10;
    return frame.clientWidth / frame.clientHeight;
  }, []);

  /* Ghi tâm phóng vào biến CSS trên khung: hai lớp cảnh (transform-origin),
     quầng tối của lớp bay đều đọc từ đây. Ghi thẳng vào style chứ không qua
     state — chiều lùi ra cập nhật theo từng khung hình. */
  const writeFocusVars = useCallback((point: ZoomTargetPoint) => {
    const frame = frameRef.current;
    if (!frame) return;
    frame.style.setProperty("--ox", `${point.x}%`);
    frame.style.setProperty("--oy", `${point.y}%`);
  }, []);

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= ZOOM_LEVELS.length || next === index) return;
      const direction = next > index ? "in" : "out";
      seq.current += 1;
      const thisSeq = seq.current;

      if (shipTimer.current) window.clearTimeout(shipTimer.current);

      if (direction === "in") {
        /* Chốt đích NGAY lúc bấm, từ hộp của cảnh sắp rời: Trái Đất đang
           chạy trên quỹ đạo, chậm một nhịp là tàu lao vào chỗ nó vừa rời. */
        const focus =
          usableTarget(targetRefs.current[index]?.current ?? null) ?? CENTER;
        focusRef.current = focus;
        writeFocusVars(focus);
        const pose = shipPose(SHIP_START, focus, frameAspect());
        setShip({ seq: thisSeq, x: focus.x, y: focus.y, ...pose });
      } else {
        /* Lùi ra: đích nằm trong cảnh cha CHƯA gắn, chưa có toạ độ. Xoá
           điểm cũ, chờ effect chép điểm mới; quá 250 ms mà cảnh cha vẫn
           chưa báo được (đích sau camera chẳng hạn) thì lùi về tâm. */
        focusRef.current = null;
        setShip(null);
        shipTimer.current = window.setTimeout(() => {
          focusRef.current = CENTER;
          const pose = shipPose(CENTER, SHIP_START, frameAspect());
          setShip({ seq: thisSeq, x: CENTER.x, y: CENTER.y, ...pose });
        }, 250);
      }

      setOutgoing({ id: ZOOM_LEVELS[index].id, direction, seq: thisSeq });
      setIndex(next);

      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setOutgoing(null), FADE_MS);
    },
    [frameAspect, index, writeFocusVars],
  );

  /* Trong lúc lùi ra, chép đích từ hộp của cảnh cha vào điểm sống + biến CSS
     + thông số tàu (lần đầu có đích). Cảnh cha vừa gắn nên vài khung đầu hộp
     còn trống; đĩa Ngân Hà lại quay và Trái Đất chạy nên phải chép liên tục
     suốt lượt chuyển, không chốt sớm. */
  useEffect(() => {
    if (!outgoing || outgoing.direction !== "out") return;
    let raf = 0;
    const tick = () => {
      const point = usableTarget(targetRefs.current[index]?.current ?? null);
      if (point) {
        focusRef.current = point;
        writeFocusVars(point);
        setShip((current) =>
          current && current.seq === outgoing.seq
            ? current
            : {
                seq: outgoing.seq,
                x: point.x,
                y: point.y,
                ...shipPose(point, SHIP_START, frameAspect()),
              },
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [frameAspect, index, outgoing, writeFocusVars]);

  /* Hết lượt chuyển thì gỡ tâm phóng: lớp cảnh về scale 1, để lại biến thì
     lượt sau (nếu không ghi đè) phóng quanh một điểm của cảnh khác. */
  useEffect(() => {
    if (outgoing) return;
    const frame = frameRef.current;
    if (!frame) return;
    frame.style.removeProperty("--ox");
    frame.style.removeProperty("--oy");
  }, [outgoing]);

  /* Con lăn đổi cấp, theo quy ước bản đồ: cuộn tới (deltaY < 0) là thu vào.

     Bắt ở pha capture trên khung và chặn lan xuống canvas: các cảnh dùng
     OrbitControls, vốn cũng lấy con lăn để đẩy camera. Để cả hai cùng chạy
     thì một cú cuộn vừa đổi cấp vừa dí camera vào cảnh mới. Trong hành trình
     này thu phóng là đổi cấp; kéo vẫn xoay, chụm hai ngón vẫn đẩy camera.

     Ở cấp đầu/cuối, cuộn theo chiều không còn cấp thì KHÔNG chặn mặc định —
     trang cuộn tiếp, người đọc không bị kẹt trong khung cao gần một màn hình. */
  const goRef = useRef(go);
  const indexRef = useRef(index);
  useEffect(() => {
    goRef.current = go;
    indexRef.current = index;
  }, [go, index]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let acc = 0;
    let lastEvent = 0;
    let lockedUntil = 0;

    const onWheel = (event: WheelEvent) => {
      event.stopPropagation();
      const step = event.deltaY < 0 ? 1 : -1;
      const target = indexRef.current + step;
      if (target < 0 || target >= ZOOM_LEVELS.length) return;
      event.preventDefault();

      const now = performance.now();
      if (now < lockedUntil) return;
      if (now - lastEvent > 200) acc = 0;
      lastEvent = now;
      acc += event.deltaY;
      if (Math.abs(acc) < WHEEL_THRESHOLD) return;

      acc = 0;
      /* Khoá đến hết lượt chuyển: đà quán tính của bàn di chuột còn bắn sự
         kiện cả giây sau khi nhấc tay, không khoá thì một cú vuốt nhảy hai cấp. */
      lockedUntil = now + FADE_MS;
      goRef.current(target);
    };

    frame.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () =>
      frame.removeEventListener("wheel", onWheel, { capture: true });
  }, [webgl]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      "+": index + 1,
      "=": index + 1,
      ArrowLeft: index - 1,
      "-": index - 1,
      Home: 0,
      End: ZOOM_LEVELS.length - 1,
    };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    go(next);
  };

  const level = ZOOM_LEVELS[index];
  const ratio = stepRatio(index);
  const name = (item: ZoomLevel) => (locale === "en" ? item.nameEn : item.name);
  const note = locale === "en" ? level.noteEn : level.note;
  /* Một chữ số có nghĩa: "khoảng 700 nghìn", không phải "705.550" — kích
     thước mỗi cấp vốn là ước lượng tròn, sáu chữ số là độ chính xác giả. */
  const factor =
    ratio &&
    new Intl.NumberFormat(locale, {
      notation: "compact",
      compactDisplay: "long",
      maximumSignificantDigits: 1,
    }).format(ratio);
  const outgoingLevel = outgoing
    ? (ZOOM_LEVELS.find((item) => item.id === outgoing.id) ?? level)
    : level;

  if (webgl === false) {
    return (
      <div className="grid h-[70vh] place-items-center rounded-2xl border border-dashed bg-muted/30 px-6 text-center">
        <p className="max-w-md text-muted-foreground">{tSolar("webglError")}</p>
      </div>
    );
  }

  /* Trên điện thoại khung thấp hơn 4rem: nút "Hỏi AI" nổi ở góc phải-dưới màn
     hình, khung cao `100dvh − 14rem` thì đáy khung — chỗ nút "Thu vào" — nằm
     đúng dưới nút nổi đó. */
  return (
    <>
      <div
        ref={frameRef}
        tabIndex={0}
        role="region"
        aria-label={t("frameLabel")}
        aria-describedby="zoom-hint"
        onKeyDown={onKeyDown}
        className="relative h-[calc(100dvh-18rem)] min-h-[24rem] w-full sm:h-[calc(100dvh-14rem)] sm:min-h-[28rem] overflow-hidden rounded-2xl border bg-[#02030a] focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
      >
        {webgl === null ? (
          <div className="grid h-full place-items-center text-sm text-white/60">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <>
            {/* Cảnh đang rời đi: phóng to rồi mờ dần */}
            {outgoing && (
              <div
                key={`out-${outgoing.id}`}
                className="zoom-layer-out absolute inset-0"
                style={{
                  ["--zoom-ms" as string]: `${FADE_MS}ms`,
                  /* Lao qua cảnh cũ: phóng lớn hẳn chứ không chỉ nhích —
                     cảm giác bay xuyên qua nó, không phải lùi khỏi nó. */
                  ["--zoom-to" as string]:
                    outgoing.direction === "in" ? "2.6" : "0.35",
                }}
              >
                <LevelScene
                  level={outgoingLevel}
                  locale={locale}
                  targetRef={
                    targetRefs.current[
                      ZOOM_LEVELS.findIndex(
                        (item) => item.id === outgoingLevel.id,
                      )
                    ]
                  }
                />
              </div>
            )}

            <div
              key={`in-${level.id}`}
              className="zoom-layer-in absolute inset-0"
              style={{
                ["--zoom-ms" as string]: `${FADE_MS}ms`,
                ["--zoom-from" as string]:
                  outgoing?.direction === "out" ? "2.6" : "0.35",
              }}
            >
              <LevelScene
                level={level}
                locale={locale}
                targetRef={targetRefs.current[index]}
              />
            </div>

            {/* Lớp bay chỉ gắn khi thông số tàu của ĐÚNG lượt này đã có:
                chiều vào có ngay lúc bấm, chiều ra chờ cảnh cha báo đích
                (hoặc quá hạn thì dùng tâm). Vệt sao đọc điểm sống mỗi khung
                nên tự bám đích đang di chuyển. */}
            {outgoing && !reducedMotion && ship && ship.seq === outgoing.seq && (
              <WarpTransition
                key={`warp-${outgoing.seq}`}
                direction={outgoing.direction}
                durationMs={FADE_MS}
                focusRef={focusRef}
                shipX={ship.x}
                shipY={ship.y}
                shipRot={ship.rot}
                shipFlip={ship.flip}
              />
            )}

            {/* Vòng đánh dấu đích cấp kế tiếp — bấm vào cũng là thu vào.
                Đang chuyển cấp thì ẩn: đích của cảnh cũ không còn ý nghĩa
                khi cảnh mới đang lớn lên. */}
            {!outgoing && index < ZOOM_LEVELS.length - 1 && (
              <TargetMarker
                targetRef={targetRefs.current[index]}
                color={ZOOM_LEVELS[index + 1].color}
                label={t("zoomInHere")}
                ariaLabel={t("zoomInHereTo", {
                  name: name(ZOOM_LEVELS[index + 1]),
                })}
                reducedMotion={reducedMotion}
                onActivate={() => go(index + 1)}
              />
            )}
          </>
        )}

        {/* ------------------------------------------------ Cấp hiện tại (HUD)
            Trong khung, góc trên-trái. Trước đây cả khối nằm dưới khung để
            khỏi che cảnh, nhưng khung cao gần một màn hình nên ở màn laptop
            thường khối đó rơi khỏi màn: người xem bấm qua bốn cấp mà không
            biết mình đang ở đâu. Trong khung chỉ giữ tên + kích thước + bội
            số (ba dòng ngắn, không bắt chuột); đoạn mô tả vẫn ở dưới. */}
        <div className="pointer-events-none absolute top-4 left-4 max-w-[17rem] rounded-xl bg-black/35 px-3 py-2 backdrop-blur-sm">
          <p className="text-[11px] text-white/70">
            {t("levelOf", { step: index + 1, total: ZOOM_LEVELS.length })}
          </p>
          <h2
            className="font-display text-lg leading-tight font-bold sm:text-xl"
            style={{ color: level.color }}
          >
            {name(level)}
          </h2>
          <p className="font-mono text-sm text-white/80">
            {locale === "en" ? level.sizeEn : level.size}
            <span className="text-white/50">
              {" · "}
              <PowerOfTen exp={magnitude(level)} /> m
            </span>
          </p>
          {factor && (
            <p className="mt-1 text-xs text-white/60">
              {t("nextIsSmaller", { factor })}
            </p>
          )}
          {note && <p className="mt-1 text-xs text-amber-200/90">{note}</p>}
        </div>

        <p
          id="zoom-hint"
          className="pointer-events-none absolute top-4 right-4 hidden text-right text-xs text-white/45 sm:block"
        >
          {t("hint")}
        </p>

        {/* Đọc tên cấp mới cho trình đọc màn hình — HUD ở trên đổi chữ nhưng
            không phải vùng live, nên tự nó không được đọc. */}
        <p className="sr-only" aria-live="polite">
          {t("levelOf", { step: index + 1, total: ZOOM_LEVELS.length })}:{" "}
          {name(level)}, {locale === "en" ? level.sizeEn : level.size}
        </p>

        {/* --------------------------------------------- Điều khiển thu phóng
            Bốn chấm không chữ → thanh cấp có tên và bậc độ lớn: chấm chỉ nói
            "có bốn thứ", không nói đang ở đâu trên trục tỉ lệ. Trên điện thoại
            chỉ ô đang chọn hiện tên, các ô khác còn mỗi 10ⁿ. */}
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
          <Button
            size="sm"
            variant="glass"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label={t("zoomOut")}
            className="h-9 gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
          >
            <ZoomOut className="size-4" />
            <span className="hidden sm:inline">{t("zoomOut")}</span>
          </Button>

          <ol
            aria-label={t("levels")}
            className="flex items-stretch gap-1 rounded-full border border-white/15 bg-black/40 p-1 backdrop-blur-sm"
          >
            {ZOOM_LEVELS.map((step, i) => (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={name(step)}
                  aria-current={i === index ? "step" : undefined}
                  className={cn(
                    "flex min-h-9 flex-col items-center justify-center rounded-full px-2 leading-none transition-colors sm:px-3",
                    i === index
                      ? "bg-white text-[#02030a]"
                      : "text-white/70 hover:bg-white/15 hover:text-white",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium whitespace-nowrap",
                      i !== index && "hidden sm:inline",
                    )}
                  >
                    {locale === "en" ? step.shortNameEn : step.shortName}
                  </span>
                  <span className="mt-0.5 font-mono text-[10px] whitespace-nowrap opacity-70">
                    <PowerOfTen exp={magnitude(step)} />
                    <span className={cn(i !== index && "hidden sm:inline")}>
                      {" "}m
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <Button
            size="sm"
            variant="glass"
            onClick={() => go(index + 1)}
            disabled={index === ZOOM_LEVELS.length - 1}
            aria-label={t("zoomIn")}
            className="h-9 gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
          >
            <span className="hidden sm:inline">{t("zoomIn")}</span>
            <ZoomIn className="size-4" />
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------ Mô tả cấp hiện tại */}
      <div className="mt-3">
        <div className="min-w-0">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {locale === "en" ? level.blurbEn : level.blurb}
          </p>
          {level.href && (
            <Link
              href={level.href}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
            >
              {t("openFull")}
              <ExternalLink className="size-3.5" />
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
