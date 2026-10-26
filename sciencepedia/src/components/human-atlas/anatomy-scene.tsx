"use client";

// Client: WebGL, ResizeObserver và pointer event chỉ có ở trình duyệt.
// Module này chỉ được nạp qua `dynamic(..., { ssr: false })` trong
// `human-atlas.tsx`, nên three.js không lọt vào bundle của trang nào khác.

import { useEffect, useRef } from "react";
import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import partGroups from "@/lib/human-atlas/part-groups.generated.json";
import {
  GROUP_COLORS,
  LAYERS,
  SYSTEM_COLORS,
  SYSTEM_IDS,
  SYSTEM_LAYER,
  effectivePeel,
  layerOpacity,
  peelToExplode,
  type AnatomyLayer,
  type Atlas,
  type SceneState,
  type SystemId,
} from "@/lib/human-atlas/anatomy";
import { HUMAN_ATLAS_DATA_VERSION, atlasDataUrl } from "@/lib/human-atlas/assets";
import { createExplosionLayout } from "@/lib/human-atlas/explosion-layout";
import { decodeModelResponse } from "@/lib/human-atlas/model-download";
import { PointerTap } from "@/lib/human-atlas/pointer-tap";
import { sectionCap } from "@/lib/human-atlas/section";
import { THUMB_STYLE, fingerprint, prebakedThumbnail, readThumbnails, writeThumbnail } from "@/lib/human-atlas/thumbnail-cache";
import { ATLAS_VIEWS, hasCard, isSystemView, viewById, viewParts, type AtlasViewDef, type ViewDirection } from "@/lib/human-atlas/views";

/**
 * Cảnh giải phẫu 3D — port từ `app/scene.tsx` của Human Atlas
 * (https://github.com/ashemag/human-atlas, MIT, © 2026 ashemag).
 *
 * ## Vì sao three.js thuần chứ không viết lại bằng React Three Fiber
 *
 * Repo đã có R3F, nhưng cách vẽ của bản gốc mới là thứ làm atlas chạy nổi:
 * 2.234 mảnh gộp thành ~15 lượt vẽ mỗi khối (một lượt mỗi hệ), còn dịch
 * chuyển / ẩn hiện / tô sáng từng mảnh đi qua hai texture trạng thái đọc
 * trong vertex shader. Không có đối tượng React nào cho từng mảnh, và cảnh
 * chỉ vẽ lại khi có gì đó đổi. Viết lại theo lối khai báo của R3F là đổi
 * đúng phần đã được tối ưu lấy phần không cần.
 *
 * Những gì đã đổi so với bản gốc, và vì sao:
 * - URL dữ liệu dựng bằng `atlasDataUrl` (R2, có dấu vân) thay vì `/models/`.
 * - Lỗi báo bằng MÃ, chữ do giao diện dịch — bản gốc ghi cứng tiếng Anh.
 * - Nhãn khi rê chuột lấy từ `labelFor` để hiện tên tiếng Việt.
 * - Nền đổi theo theme sáng/tối của site.
 * - Rendering kiểu "medical visualization" (2026-09-29) — xem khối ghi chú
 *   "Ánh sáng & vật liệu" bên dưới.
 * - Thêm `state.focus`: camera bay tới cấu trúc đang chọn (deep link).
 * - Tìm bảng chi tiết bằng `data-atlas-*` trong chính khung, không
 *   `document.querySelector` theo tên lớp toàn cục.
 */

export type SceneError = "webgl" | "download" | "context-lost";

type Props = {
  atlas: Atlas;
  state: SceneState;
  dark: boolean;
  ariaLabel: string;
  /** Nhãn truy cập của thanh cuộn dọc ("Di chuyển dọc cơ thể"). */
  scrollLabel: string;
  labelFor: (partIndex: number) => string;
  onSelect: (partId: string) => void;
  onProgress: (percent: number) => void;
  onError: (code: SceneError) => void;
  /** Ảnh thu nhỏ của một góc nhìn, chụp từ chính mô hình sau khi tải xong. */
  onThumbnail?: (viewId: string, dataUrl: string) => void;
  /** Góc nhìn đang có thẻ trên màn (tab/hệ đang mở của lưới) — chụp và tải khối cho chúng trước. */
  thumbnailPriority?: readonly string[];
};

/**
 * Nền. Tối là gần đen (#05070a) chứ không navy #131b29 như bản gốc: giải phẫu
 * là thứ duy nhất trong khung, nền không được có màu riêng. Khớp với nền của
 * khung trong `human-atlas.tsx` để không loé khi canvas chưa vẽ.
 */
/** Độ đục lượt bóng mờ khi "Hiện giải phẫu xung quanh" ở chế độ Xuyên thấu (xem `ghostFade`). */
const SURROUND_FADE = 0.3;
/**
 * ## Kiểu atlas: mờ theo lớp, không mờ đều (2026-10-23)
 *
 * Chủ sản phẩm: xem thận mà cột sống, xương chậu trong suốt như phim X-quang thì
 * mất cảm giác thận nằm ở đâu. Atlas tham chiếu giữ xương ĐẶC; chỉ chỗ một lớp
 * che cấu trúc đang học mới mờ, và mờ theo loại mô — xương còn 45% (vẫn đọc ra
 * xương sườn nằm trước thận), cơ 25%, mô mềm 10%. Không xuống 10% cho xương:
 * mất xương là mất mốc định hướng. Dùng cho cả hai đường: lớp ngoài khi chọn một
 * cấu trúc sâu (`applyLayers`) và bối cảnh che cấu trúc chính (lượt "cửa sổ").
 */
const FADE_BY_LAYER: Record<AnatomyLayer, number> = {
  surface: 0.1,
  muscle: 0.25,
  skeleton: 0.45,
  organs: 0.1,
  vascular: 0.1,
  nervous: 0.1,
};
/**
 * Mờ theo HỆ: như lớp, trừ mô liên kết. Cân cơ thành bụng (bao cơ thẳng, cân cơ chéo) là
 * những tấm mỏng phủ cả bụng, màu trắng bạc bóng; ở 25% của lớp cơ chúng thành một màn
 * trắng che thận ở "Hiện giải phẫu xung quanh" (chụp thử 2026-10-23) → 12%.
 */
/**
 * "Bán trong suốt" (`SceneState.look`, 2026-10-23): cùng luật — chỉ lớp CHE cấu trúc đang xem
 * mới mờ — nhưng mờ 40–60% thay vì 10–45%, để thấy lớp ngoài nằm thế nào so với lớp trong (cơ
 * thành bụng trước thận) mà vẫn nhìn xuyên qua. Mô liên kết 30% (tấm trắng bạc, xem dưới). Đi
 * kèm MỘT lớp cửa sổ thay vì hai: hai lớp 50% chồng nhau đã 75%, gần như đặc.
 */
const FADE_SEMI: Record<AnatomyLayer, number> = {
  surface: 0.4,
  muscle: 0.5,
  skeleton: 0.6,
  organs: 0.45,
  vascular: 0.5,
  nervous: 0.5,
};
const fadeOf = (system: SystemId, semi = false) =>
  system === "connective" ? (semi ? 0.3 : 0.12) : (semi ? FADE_SEMI : FADE_BY_LAYER)[SYSTEM_LAYER[system]];
/**
 * Cạnh nhỏ nhất (mét) của khung camera quanh vùng chọn: một đốt sống chỉ 3–4 cm, khung
 * sát nó thì bóng mờ xung quanh chỉ là một mảng cơ, không nói được đốt nằm ở đâu.
 * 0,4 m ≈ bề ngang thân.
 */
const SURROUND_MIN_SIZE = 0.4;
/** Sàn zoom (m): trần phóng to của OrbitControls, cũng là sàn khung góc nhìn theo hệ. */
const MIN_DISTANCE = 0.07;
/** Lát `section` (~1,5 cm bề ngang): sàn chung chỉ cho nó ~⅓ khung. */
const SECTION_MIN_DISTANCE = 0.03;
const minDistanceFor = (def: AtlasViewDef | null | undefined) => (def?.band?.section ? SECTION_MIN_DISTANCE : MIN_DISTANCE);

export const SCENE_BACKGROUND = { light: "#eef0f1", dark: "#05070a" } as const;

/*
 * ## Bề mặt mô theo lối atlas (2026-09-30)
 *
 * Chủ sản phẩm so với Human Anatomy Atlas (chỉ tham chiếu, không lấy hình):
 * phổi ở đó hồng cá hồi, lốm đốm, bóng ướt; xương xám be có hạt và lỗ xốp; sụn
 * xanh xám hơi bóng; dây chằng trắng bạc có thớ. Mesh BodyParts3D/Z-Anatomy vẽ
 * một màu trơn nên trông như nhựa. Mesh không có UV → vân dựng bằng nhiễu 3D theo
 * toạ độ mô (mét). Chỉ đổi màu và độ nhám — không bump, không texture tải thêm.
 * Mỗi đoạn GLSL phải khai báo `tissueFine` (dùng để nhám không đều).
 */
const TISSUE_NOISE = `
float tissueHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float tissueNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(tissueHash(i), tissueHash(i + vec3(1, 0, 0)), f.x), mix(tissueHash(i + vec3(0, 1, 0)), tissueHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(tissueHash(i + vec3(0, 0, 1)), tissueHash(i + vec3(1, 0, 1)), f.x), mix(tissueHash(i + vec3(0, 1, 1)), tissueHash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
vec3 tissueHash3(vec3 p) {
  return fract(sin(vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)))) * 43758.5453);
}
// Khoảng cách tới lỗ gần nhất (nhiễu tế bào): lỗ TRÒN, thưa — ngưỡng trên nhiễu giá trị cho vệt gạch chữ nhật.
float tissueCell(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  float d = 1.0;
  for (int a = -1; a <= 1; a++)
    for (int b = -1; b <= 1; b++)
      for (int c = -1; c <= 1; c++) {
        vec3 g = vec3(float(a), float(b), float(c));
        vec3 h = tissueHash3(i + g);
        if (h.x > 0.3) continue;
        d = min(d, length(g + 0.15 + 0.7 * h - f) * (0.65 + 0.7 * h.y));
      }
  return d;
}
`;
type Surface = {
  /** Lớp phủ bóng (clearcoat) — mô ướt/sụn; không có thì giữ MeshStandardMaterial. */
  coat?: { clearcoat: number; clearcoatRoughness: number };
  /** GLSL chèn sau `color_fragment`: đổi `diffuseColor`, khai báo `tissueFine`. */
  glsl: string;
  /** Hệ số nhân `roughnessFactor`, theo `tissueFine`. */
  rough: string;
  /** Cần trục dài của mảnh (`vTissueAxis`: xyz trục, w độ thon dài) — vân dọc. */
  axis?: boolean;
  /** GLSL chèn SAU khi có pháp tuyến (`normal`), trước khi chiếu sáng: đổi `diffuseColor` theo độ cong. */
  lit?: string;
  /** Hệ số nhân ánh sáng gián tiếp khuếch tán (môi trường + đèn bán cầu) — mặt khuất tối hơn. */
  indirect?: string;
};
/**
 * Độ cong trên màn hình (1/m; lồi dương) từ đạo hàm pháp tuyến theo vị trí — khai báo
 * `tissueCurv`, `tissueCavity` (0–1, hốc). Dùng chung cho xương và cơ quan (xem `BONE`).
 */
const CURVATURE = `
vec3 cavDx = dFdx(vViewPosition);
vec3 cavDy = dFdy(vViewPosition);
float tissueCurv = -0.5 * (dot(dFdx(normal), cavDx) / max(dot(cavDx, cavDx), 1e-12) + dot(dFdy(normal), cavDy) / max(dot(cavDy, cavDy), 1e-12));
float tissueCavity = smoothstep(30.0, 170.0, -tissueCurv);
`;
/*
 * ## Xương kiểu minh hoạ atlas (2026-10-23)
 *
 * Chủ sản phẩm đưa ảnh mẫu "Các loại xương": vàng nâu ấm (bão hoà ~0,37), hốc và
 * kẽ nâu đậm, lỗ xốp thấy rõ, vân dọc thân xương dài, mép lồi sáng. Bản trước đo
 * ra bão hoà 0,10, tương phản p90/p10 1,4 (mẫu 2,0–3,2): trắng sữa, phẳng.
 *
 * - Lỗ xốp ~2,5 mm, sẫm NÂU (không xám); tắt dần khi một lỗ nhỏ hơn ~2 điểm ảnh
 *   (`fwidth`) — lỗ dưới điểm ảnh thành nhiễu lấp lánh khi xoay.
 * - Vân dọc: nhiễu kéo dài theo trục dài của hộp bao mảnh, chỉ ở xương thon dài.
 * - Hốc tối / mép sáng: độ cong tính trên màn hình từ đạo hàm pháp tuyến theo vị
 *   trí (đơn vị 1/m; lồi dương). Không cần nướng dữ liệu, chạy cả điện thoại. Lồi
 *   r ≈ 3 mm ≈ 330, hố r ≈ 5 mm ≈ −200. Pháp tuyến nội suy nên độ cong theo tam
 *   giác — ngưỡng để rộng cho khỏi lộ lưới.
 */
const BONE: Surface = {
  axis: true,
  glsl: `
float tissueCoarse = tissueNoise(vTissue * 30.0);
float tissueFine = tissueNoise(vTissue * 220.0 + 5.1);
vec3 tissueAlong = vTissueAxis.xyz * dot(vTissue, vTissueAxis.xyz);
float tissueStreakAA = 1.0 - smoothstep(0.35, 0.9, length(fwidth(vTissue * 260.0)));
float tissueStreak = tissueNoise((vTissue - tissueAlong) * 260.0 + tissueAlong * 9.0 + 2.7);
float tissuePoreAA = 1.0 - smoothstep(0.25, 0.6, length(fwidth(vTissue * 140.0)));
float tissuePore = (1.0 - smoothstep(0.08, 0.17, tissueCell(vTissue * 140.0))) * tissuePoreAA;
diffuseColor.rgb *= mix(0.7, 1.06, smoothstep(0.15, 0.9, tissueCoarse * 0.6 + tissueFine * 0.4));
diffuseColor.rgb *= mix(1.0, mix(0.8, 1.07, tissueStreak), vTissueAxis.w * tissueStreakAA);
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.4, 0.31, 0.24), tissuePore * 0.75);
`,
  lit:
    CURVATURE +
    `
float tissueRidge = smoothstep(60.0, 420.0, tissueCurv);
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.5, 0.37, 0.26), tissueCavity * 0.7);
diffuseColor.rgb = min(diffuseColor.rgb * (1.0 + 0.16 * tissueRidge) + 0.025 * tissueRidge, vec3(1.0));
`,
  // Đo 2026-10-23: màu đã khớp mẫu nhưng tương phản p90/p10 chỉ 1,2–1,5 (mẫu 2,0–3,2) —
  // fill gián tiếp (môi trường 0,36 + bán cầu) tô sáng đều mặt khuất. Chỉ hạ cho xương:
  // hạ chung thì cơ, sụn sẫm lại thành mảng đen trên thẻ (xem "Fill gián tiếp").
  indirect: "0.38 * (1.0 - 0.5 * tissueCavity)",
  rough: "0.88 + 0.24 * tissueFine",
};
/** Sụn: gần trơn, bóng nhẹ, loang rất khẽ. */
const CARTILAGE: Surface = {
  coat: { clearcoat: 0.3, clearcoatRoughness: 0.35 },
  glsl: `
float tissueFine = tissueNoise(vTissue * 120.0 + 2.3);
diffuseColor.rgb *= mix(0.9, 1.05, tissueNoise(vTissue * 40.0) * 0.6 + tissueFine * 0.4);
`,
  rough: "0.85 + 0.3 * tissueFine",
};
/*
 * ## Cơ quan và cơ (2026-10-23)
 *
 * Review: thận, gan, tim, ruột là một màu phẳng như nhựa; cơ không có thớ (3/10). Chỉ
 * nhiễu GIÁ TRỊ ở đây, không nhiễu tế bào 27 lần thử như lỗ xương: cơ và tạng phủ phần
 * lớn màn hình, tốc độ điện thoại chưa đo.
 *
 * - Cơ quan: bao tạng ướt bóng (clearcoat), loang lớn rất khẽ + hạt nhỏ, hốc tối theo độ
 *   cong (rốn thận, kẽ giữa các quai ruột, rãnh vành) và ánh sáng gián tiếp hạ nhẹ ở hốc.
 * - Cơ: thớ theo trục dài của hộp bao mảnh, CHỈ ở cơ thon dài gấp ~2,6 lần bề ngang
 *   (cơ may, nhị đầu, thẳng bụng). Cơ hình quạt (ngực lớn, chéo bụng, hoành) có trục hộp
 *   bao không phải hướng thớ — không vẽ thớ cho chúng còn hơn vẽ sai hướng.
 * - KHÔNG vẽ chuyển tiếp sang gân ở hai đầu cơ: dữ liệu chỉ có 4 mảnh gân, đoán gân theo
 *   đầu hộp bao là tô gân lên chỗ bám thịt — một khẳng định giải phẫu sai ("trống hơn sai").
 */
const organ = (opts: { fine: number; coarse: number; mottle: number; cavity: number; coat?: number }): Surface => ({
  coat: { clearcoat: opts.coat ?? 0.45, clearcoatRoughness: 0.32 },
  glsl: `
float tissueCoarse = tissueNoise(vTissue * ${opts.coarse.toFixed(1)});
float tissueFine = tissueNoise(vTissue * ${opts.fine.toFixed(1)} + 4.7);
diffuseColor.rgb *= mix(${(1 - opts.mottle).toFixed(3)}, 1.05, smoothstep(0.1, 0.9, tissueCoarse * 0.65 + tissueFine * 0.35));
`,
  lit:
    CURVATURE +
    `
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.55, 0.42, 0.42), tissueCavity * ${opts.cavity.toFixed(2)});
`,
  indirect: "0.8 * (1.0 - 0.4 * tissueCavity)",
  rough: "0.85 + 0.3 * tissueFine",
});
const MUSCLE: Surface = {
  axis: true,
  glsl: `
float tissueFine = tissueNoise(vTissue * 160.0 + 3.3);
vec3 tissueAlong = vTissueAxis.xyz * dot(vTissue, vTissueAxis.xyz);
vec3 tissueAcross = vTissue - tissueAlong;
float tissueFiberAA = 1.0 - smoothstep(0.35, 0.9, length(fwidth(vTissue * 420.0)));
float tissueFiber = tissueNoise(tissueAcross * 420.0 + tissueAlong * 10.0 + 6.1);
float tissueBundle = tissueNoise(tissueAcross * 95.0 + tissueAlong * 3.0 + 1.3);
float tissueStrap = smoothstep(0.6, 1.0, vTissueAxis.w);
diffuseColor.rgb *= mix(0.9, 1.04, tissueFine);
// Thớ nhỏ hơn ~2 điểm ảnh thì thay bằng giá trị trung bình của nó: khỏi lấp lánh khi xoay.
diffuseColor.rgb *= mix(1.0, mix(0.8, 1.07, mix(0.275, tissueFiber * 0.55, tissueFiberAA) + tissueBundle * 0.45), tissueStrap);
`,
  rough: "0.9 + 0.2 * tissueFine",
};
const SURFACES: Record<string, Surface> = {
  muscular: MUSCLE,
  "respiratory.pharynx": MUSCLE,
  cardiac: organ({ fine: 150, coarse: 35, mottle: 0.12, cavity: 0.6, coat: 0.5 }),
  "urinary.kidney": organ({ fine: 170, coarse: 40, mottle: 0.12, cavity: 0.65, coat: 0.55 }),
  "urinary.bladder": organ({ fine: 150, coarse: 40, mottle: 0.1, cavity: 0.5 }),
  "digestive.liver": organ({ fine: 380, coarse: 45, mottle: 0.16, cavity: 0.55, coat: 0.55 }),
  "digestive.stomach": organ({ fine: 160, coarse: 30, mottle: 0.14, cavity: 0.6 }),
  "digestive.esophagus": organ({ fine: 160, coarse: 40, mottle: 0.12, cavity: 0.5 }),
  "digestive.small_intestine": organ({ fine: 170, coarse: 35, mottle: 0.12, cavity: 0.7 }),
  "digestive.large_intestine": organ({ fine: 170, coarse: 35, mottle: 0.14, cavity: 0.7 }),
  // Tuỵ, lách: tiểu thuỳ — loang mạnh hơn, ít bóng.
  "digestive.pancreas": organ({ fine: 260, coarse: 90, mottle: 0.22, cavity: 0.55, coat: 0.25 }),
  "lymphatic.spleen": organ({ fine: 200, coarse: 45, mottle: 0.14, cavity: 0.5, coat: 0.45 }),
  // Phổi: mảng ~1,5 cm, hạt ~5 mm, chấm sẫm thưa ~2 mm; màng phổi ướt bóng.
  "respiratory.lung": {
    coat: { clearcoat: 0.35, clearcoatRoughness: 0.38 },
    glsl: `
float tissueCoarse = tissueNoise(vTissue * 65.0);
float tissueFine = tissueNoise(vTissue * 210.0 + 7.3);
float tissueSpeck = smoothstep(0.8, 0.93, tissueNoise(vTissue * 520.0 + 3.1));
diffuseColor.rgb *= mix(0.72, 1.1, smoothstep(0.2, 0.85, tissueCoarse * 0.65 + tissueFine * 0.35));
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.36, 0.2, 0.24), tissueSpeck * 0.6);
`,
    rough: "0.8 + 0.45 * tissueFine",
  },
  skeletal: BONE,
  "respiratory.concha": BONE,
  "skeletal.cartilage": CARTILAGE,
  "respiratory.cartilage": CARTILAGE,
  // Dây chằng/gân (mô liên kết): thớ mảnh ~2 mm, bóng bạc. Hướng thớ không có
  // trong dữ liệu — nhiễu kéo dài theo hai trục chéo nhau, đủ gợi "sợi".
  connective: {
    coat: { clearcoat: 0.45, clearcoatRoughness: 0.3 },
    glsl: `
float tissueFine = tissueNoise(vTissue * vec3(520.0, 45.0, 520.0));
float tissueFiber = max(tissueFine, tissueNoise(vTissue * vec3(45.0, 520.0, 45.0).zxy + 4.2));
diffuseColor.rgb *= mix(0.82, 1.08, tissueFiber);
`,
    rough: "0.75 + 0.4 * tissueFine",
  },
};

/** Số khối tải song song — giữ như bản gốc: đủ lấp băng thông, không nghẽn kết nối. */
const PARALLEL_CHUNKS = 3;

export default function AnatomyScene({
  atlas,
  state,
  dark,
  ariaLabel,
  scrollLabel,
  labelFor,
  onSelect,
  onProgress,
  onError,
  onThumbnail,
  thumbnailPriority,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(state);
  const callbacks = useRef({ onSelect, onProgress, onError, labelFor, onThumbnail, thumbnailPriority });
  const themeRef = useRef<(dark: boolean) => void>(() => {});
  latest.current = state;
  callbacks.current = { onSelect, onProgress, onError, labelFor, onThumbnail, thumbnailPriority };

  useEffect(() => {
    themeRef.current(dark);
  }, [dark]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const root = el.parentElement ?? el;

    let disposed = false;
    let frame = 0;
    let dirty = true;
    let lastView = "";
    let lastReset = -1;
    // Bắt đầu từ 0 chứ không từ giá trị hiện tại: deep link tăng `focus` TRƯỚC khi
    // chunk của cảnh này tải xong, và lấy giá trị hiện tại là bỏ lỡ đúng lần đó.
    let lastFocus = 0;
    // Lượt resize đầu tiên gọi `fit()` và đặt lại camera — bay tới cấu trúc trước
    // lượt ấy là bị ghi đè ngay. Chờ khung có kích thước thật rồi mới bay.
    let sized = false;
    let lastIsolate = "";
    let lastVisibleKey = "";
    let layoutKey = "";
    /** Vị trí slider đã làm mượt (0–1). `amount` là độ tách không gian suy ra từ nó. */
    let peel = 0;
    let amount = 0;
    let lastState: SceneState | null = null;
    const abort = new AbortController();

    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        // Canvas trong suốt, nền do khung DOM (`human-atlas.tsx`) tô: đổi theme không
        // phải vẽ lại nền, và ảnh thu nhỏ đọc ra nền trong suốt. (Lý do đầu tiên —
        // composer của AO tone-map nền hai lần, #05070a thành navy — đã hết từ khi
        // khung AO vẽ thẳng ra canvas, xem "AO".)
        alpha: true,
        // Stencil cho kiểu atlas: đánh dấu điểm ảnh của cấu trúc chính để bối cảnh
        // che nó vẽ mờ, còn lại vẽ đặc (xem "Bối cảnh kiểu atlas"). r163+ mặc định tắt.
        stencil: true,
        powerPreference: "high-performance",
      });
    } catch {
      callbacks.current.onError("webgl");
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 768 ? 1.5 : 2));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    // Mặt phẳng cắt theo vật liệu (góc nhìn "Mặt cắt …") — tắt thì không tốn gì.
    renderer.localClippingEnabled = true;
    renderer.domElement.className = "block size-full touch-none";
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-label", ariaLabel);
    el.appendChild(renderer.domElement);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(34, 1, 0.005, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(1.4, 1.05, 3.6);
    controls.target.set(0, 0.85, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.085;
    controls.minDistance = MIN_DISTANCE;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI * 0.96;
    // Zoom quanh TÂM, không theo con trỏ (đổi 2026-09-29): zoomToCursor dời tâm
    // nhìn theo chuột — phóng to lệch trái, thu nhỏ lệch phải, bị báo hai lần.
    // Xem dọc cơ thể khi đã phóng to là việc của thanh cuộn dọc.
    controls.zoomToCursor = false;
    controls.addEventListener("change", () => {
      dirty = true;
    });

    /*
     * ## Ánh sáng & vật liệu (2026-09-29)
     *
     * Bản gốc chiếu kiểu phòng trưng bày: đèn bán cầu 1.05 + RoomEnvironment
     * cường độ đầy đủ tắm đều mọi mặt, nên xương trắng và PHẲNG — hốc mắt, kẽ
     * sườn, thân đốt sống không có vùng tối để mắt đọc ra hình khối. Đèn lại
     * cố định trong không gian: xoay ra sau là nhìn vào mặt tối.
     *
     * Nay: ba đèn định hướng GẮN VÀO CAMERA (key trên-trái-trước mạnh, fill
     * phải yếu, rim từ sau để tách viền khỏi nền) — góc nào cũng được chiếu như
     * nhau, như đèn chụp ảnh y khoa đi theo máy. Môi trường và đèn bán cầu chỉ
     * còn đủ để mặt khuất không đen kịt. Vật liệu `metalness` 0: mô không phải
     * kim loại, và 0.08 của bản gốc chính là thứ cho cảm giác nhựa.
     *
     * Không có texture nào để "giữ": dữ liệu chỉ có vị trí, pháp tuyến, chỉ số
     * — không UV. Màu mỗi hệ là màu phẳng trong `SYSTEM_COLORS`.
     */
    const pmrem = new T.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    // Fill gián tiếp (2026-09-30): môi trường 0,28 + đèn bán cầu có mặt đất gần đen
    // (0x14161a) để mặt khuất của cơ, sụn sẫm màu gần như chỉ còn key light — những
    // mảng đen trên thẻ góc nhìn. Nâng vừa đủ để mặt khuất có màu; không tăng key,
    // để phổi, xương sáng không cháy (ACES vẫn nén vùng sáng).
    scene.environmentIntensity = 0.36;
    room.dispose();
    pmrem.dispose();

    const hemisphere = new T.HemisphereLight(0xf2eee6, 0x363a42, 0.42);
    scene.add(hemisphere);
    scene.add(camera);
    const cameraLight = (color: number, intensity: number, x: number, y: number, z: number) => {
      // Đèn định hướng chỉ cần HƯỚNG: vị trí so với đích, cả hai theo camera.
      const light = new T.DirectionalLight(color, intensity);
      light.position.set(x, y, z);
      light.target.position.set(0, 0, 0);
      camera.add(light, light.target);
      return light;
    };
    cameraLight(0xfff4e6, 2.5, -1.3, 1.7, 1.2); // key
    cameraLight(0xe6edfb, 0.55, 1.7, 0.1, 0.8); // fill
    cameraLight(0xdfe7ff, 1.35, 0.7, 1.1, -2.4); // rim, từ sau mô hình về phía camera

    // Nền do khung DOM tô (xem `alpha: true`); theme đổi thì vẽ lại cho chắc.
    renderer.setClearColor(0x000000, 0);
    themeRef.current = () => {
      dirty = true;
    };
    themeRef.current(dark);

    // ---------------------------------------------- texture trạng thái mảnh
    const parts = atlas.parts;
    const width = T.MathUtils.ceilPowerOfTwo(parts.length);
    const data = new Float32Array(width * 4);
    const partTexture = new T.DataTexture(data, width, 1, T.RGBAFormat, T.FloatType);
    partTexture.needsUpdate = true;
    const selectedData = new Uint8Array(width * 4);
    const selectionTexture = new T.DataTexture(selectedData, width, 1);
    selectionTexture.needsUpdate = true;
    /*
     * Màu mô của từng mảnh (tuyến tính) cho lượt bối cảnh — cùng bảng màu với vật
     * liệu thường (nhóm → hệ). Lượt đó dùng MỘT vật liệu ghi đè cho mọi mảnh nên
     * màu phải tra theo `partIndex`, không lấy được từ vật liệu.
     */
    // Kênh A: độ đục khi mảnh bối cảnh CHE cấu trúc chính ở kiểu atlas (`FADE_BY_LAYER`).
    const tintData = new Float32Array(width * 4);
    parts.forEach((p, i) => {
      const key = p.group ?? (partGroups as Record<string, string>)[p.id] ?? p.system;
      const c = new T.Color(GROUP_COLORS[key] ?? SYSTEM_COLORS[p.system] ?? "#aebbb8");
      tintData.set([c.r, c.g, c.b, fadeOf(p.system)], i * 4);
    });
    const tintTexture = new T.DataTexture(tintData, width, 1, T.RGBAFormat, T.FloatType);
    tintTexture.needsUpdate = true;
    /** Kênh A đang theo thang nào — đổi khi khung xem đổi "Cách vẽ", và quanh ảnh thu nhỏ (luôn atlas). */
    let tintSemi = false;
    const setTintFade = (semiStyle: boolean) => {
      if (semiStyle === tintSemi) return;
      tintSemi = semiStyle;
      parts.forEach((p, i) => (tintData[i * 4 + 3] = fadeOf(p.system, semiStyle)));
      tintTexture.needsUpdate = true;
    };

    const materials: T.Material[] = [];
    /*
     * Vật liệu của mesh dùng để RAYCAST (không bao giờ vẽ): DoubleSide, khớp với
     * vật liệu vẽ. Mesh mặc định là FrontSide — mảnh hở hay nhìn từ phía sau thì
     * thứ người đọc THẤY được lại không bấm trúng được.
     */
    const pickMaterial = new T.MeshBasicMaterial({ side: T.DoubleSide });
    materials.push(pickMaterial);
    const geometries: T.BufferGeometry[] = [];
    const pickers: (T.Mesh | undefined)[] = [];
    const centers = parts.map((p) =>
      new T.Vector3()
        .fromArray(p.bounds[0])
        .add(new T.Vector3().fromArray(p.bounds[1]))
        .multiplyScalar(0.5),
    );
    const offsets: T.Vector3[] = [];
    const bounds = parts.map(
      (p) => new T.Box3(new T.Vector3().fromArray(p.bounds[0]), new T.Vector3().fromArray(p.bounds[1])),
    );
    const systemIndex = parts.map((p) => SYSTEM_IDS.indexOf(p.system));
    /*
     * Trục dài của từng mảnh cho vân dọc thân xương dài (`BONE`): cạnh dài nhất của
     * hộp bao — mesh không có UV hay hướng thớ, hộp bao có sẵn trong metadata. Thô
     * với xương chéo/cong (sườn), nên kênh A = độ thon dài: chỉ mảnh dài gấp ~2,5
     * lần bề ngang mới có vân; đốt sống, xương cổ tay không có.
     */
    const axisData = new Float32Array(width * 4);
    bounds.forEach((b, i) => {
      const size = b.getSize(new T.Vector3()).toArray();
      const order = [0, 1, 2].sort((a, c) => size[c] - size[a]);
      axisData[i * 4 + order[0]] = 1;
      axisData[i * 4 + 3] = T.MathUtils.smoothstep(size[order[0]] / Math.max(size[order[1]], 1e-4), 1.8, 3.2);
    });
    const axisTexture = new T.DataTexture(axisData, width, 1, T.RGBAFormat, T.FloatType);
    axisTexture.needsUpdate = true;

    const markerPositions = new Float32Array(parts.length * 3);
    const markerGeometry = new T.BufferGeometry();
    markerGeometry.setAttribute("position", new T.BufferAttribute(markerPositions, 3));
    const markerMaterial = new T.PointsMaterial({
      color: 0x64748b,
      size: 5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.72,
      depthTest: false,
    });
    markerMaterial.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <clipping_planes_fragment>",
        "#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;",
      );
    };
    const markers = new T.Points(markerGeometry, markerMaterial);
    markers.frustumCulled = false;
    markers.renderOrder = 10;
    markers.visible = false;
    scene.add(markers);

    // Nhãn khi rê chuột — chỉ bật ở chế độ tách, nơi các mảnh nhỏ khó nhắm.
    const hover = document.createElement("div");
    hover.className =
      "pointer-events-none absolute z-40 max-w-[250px] rounded-lg bg-foreground/95 px-3 py-2 text-xs leading-snug text-background shadow-lg";
    hover.setAttribute("role", "tooltip");
    hover.hidden = true;
    el.appendChild(hover);

    type Target = {
      index: number;
      x: number;
      y: number;
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
    let targets: Target[] = [];
    const projected = new T.Vector3();
    const findTarget = (x: number, y: number, radius: number) => {
      let best = -1;
      let score = Infinity;
      for (const t of targets) {
        const dx = Math.max(t.left - x, 0, x - t.right);
        const dy = Math.max(t.top - y, 0, y - t.bottom);
        const distance = Math.hypot(dx, dy);
        if (distance > radius) continue;
        const candidate = distance + Math.hypot(t.x - x, t.y - y) * 0.025;
        if (candidate < score) {
          score = candidate;
          best = t.index;
        }
      }
      return best;
    };

    /** 1 trong lượt bối cảnh đặc của kiểu atlas: vật liệu thường vẽ CHỈ mảnh bối cảnh. */
    const contextPass = { value: 0 };
    /*
     * ## Chiều sâu: phía sau tối dần (2026-10-23)
     *
     * Review: cấu trúc sau và trước điểm nhìn sáng như nhau, nên khối đọc thành mặt phẳng.
     * Không shadow map: thêm một lượt depth cả cảnh (~2,3 triệu tam giác) MỖI khung xoay;
     * chỉ vẽ khi đứng yên thì lại "nhảy" như AO cũ. Thay bằng tối dần theo độ sâu: từ mặt
     * phẳng qua tâm nhìn ra sau, tới −30% ở `DEPTH_SPAN` × khoảng cách camera. Bóng tiếp xúc
     * là việc của GTAO sẵn có (chỉ desktop).
     */
    const depthFocus = { value: 1 };
    const depthRange = { value: 1 };
    /** Tâm nhìn của lượt đang vẽ: ảnh thu nhỏ đặt khung riêng, khung xem dùng `controls.target`. */
    let depthTarget: T.Vector3 | null = null;
    const DEPTH_SPAN = 0.12;
    const DEPTH_GLSL = "uniform float depthFocus; uniform float depthRange;\n";
    const DEPTH_DIM = "outgoingLight *= 1.0 - 0.3 * smoothstep(0.0, 1.0, (-vViewPosition.z - depthFocus) / depthRange);\n#include <opaque_fragment>";
    const materialFor = (system: SystemId, color: string, key = "") => {
      const skin = key === "integumentary.skin";
      const surface = SURFACES[key];
      // Da: vật liệu "physical" để có sheen — lớp ánh mềm ở mép như lông tơ trên
      // da thật, thứ làm da ảnh atlas trông ấm và có khối. Mô có lớp phủ bóng
      // (phổi, sụn, dây chằng — `SURFACES`) cũng "physical". Còn lại giữ Standard.
      const m = new (skin || surface?.coat ? T.MeshPhysicalMaterial : T.MeshStandardMaterial)({
        color,
        metalness: 0,
        // Xương mờ như xương thật; mô mềm ẩm hơn; da có vùng sáng dịu (0,52).
        roughness: system === "skeletal" ? 0.74 : skin ? 0.52 : system === "integumentary" ? 0.68 : 0.6,
        side: T.DoubleSide,
        // Độ đậm do `applyLayers()` đặt theo slider — bắt đầu đục.
        transparent: false,
        opacity: 1,
        ...(skin ? { sheen: 0.45, sheenColor: new T.Color("#f0b9a3"), sheenRoughness: 0.55 } : {}),
        ...(surface?.coat ?? {}),
      });
      // three.js gom chương trình shader theo khoá này — mặc định là MÃ NGUỒN của
      // `onBeforeCompile`, giống nhau ở mọi vật liệu ở đây. Không tách theo bề mặt
      // thì xương dùng lại shader trơn đã biên dịch trước, vân không bao giờ hiện.
      m.customProgramCacheKey = () => (surface ? `surface:${key}` : "plain");
      m.onBeforeCompile = (shader) => {
        shader.uniforms.partState = { value: partTexture };
        shader.uniforms.selectionState = { value: selectionTexture };
        shader.uniforms.stateWidth = { value: width };
        shader.uniforms.contextPass = contextPass;
        shader.uniforms.depthFocus = depthFocus;
        shader.uniforms.depthRange = depthRange;
        shader.fragmentShader = DEPTH_GLSL + shader.fragmentShader.replace("#include <opaque_fragment>", DEPTH_DIM);
        shader.vertexShader =
          "attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth; uniform float contextPass; varying float partVisible; varying float partSelected; varying float partHovered; varying float partContext;\n" +
          (surface ? "varying vec3 vTissue;\n" : "") +
          (surface?.axis ? "uniform sampler2D partAxis; varying vec4 vTissueAxis;\n" : "") +
          shader.vertexShader;
        if (surface?.axis) shader.uniforms.partAxis = { value: axisTexture };
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); transformed += state.xyz; partVisible = state.w; vec4 pick = texture2D(selectionState, stateUv); partSelected = pick.r; partHovered = pick.b; partContext = pick.a;" +
            // Toạ độ TRƯỚC khi tách (`position`, không `transformed`): vân dính vào mô khi kéo slider.
            (surface ? " vTissue = position;" : "") +
            (surface?.axis ? " vTissueAxis = texture2D(partAxis, stateUv);" : ""),
        );
        /*
         * Mảnh ẩn, và mảnh BỐI CẢNH của góc nhìn theo hệ (kênh A của texture chọn) ở lượt
         * chính — lượt bối cảnh vẽ nó sau (xem "Bối cảnh kiểu atlas") — bị loại ở ĐỈNH:
         * đẩy ra ngoài clip space, cả tam giác rơi trước khi rasterize (`partIndex` như
         * nhau trên mọi đỉnh của một mảnh). Bản trước `discard` ở fragment: GPU vẫn tô
         * mọi điểm ảnh của 2 triệu tam giác dưới da đục rồi mới bỏ, và một `discard` có
         * mặt trong shader là tắt early-z cho cả vật liệu.
         */
        shader.vertexShader = shader.vertexShader.replace(
          "#include <project_vertex>",
          "#include <project_vertex>\nif (partVisible < 0.5 || (partContext > 0.5 && partSelected < 0.5) != (contextPass > 0.5)) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);",
        );
        shader.fragmentShader =
          "varying float partVisible; varying float partSelected; varying float partHovered; varying float partContext;\n" + shader.fragmentShader;
        /*
         * Mảnh đang chọn GIỮ NGUYÊN màu và bề mặt: chỉ có viền sáng cyan ở rìa
         * (fresnel). Bản gốc trộn 75% sang xanh ngọc — một khối neon, mất hình khối.
         * Bản 2026-09-30 còn ám cyan 12% + phát sáng nền 0,06: trên mô sẫm (thận
         * #8f3f36) cộng lại thành tím nhạt, như một cơ quan khác (review 2026-10-23).
         */
        if (surface)
          shader.fragmentShader =
            "varying vec3 vTissue;\n" + (surface.axis ? "varying vec4 vTissueAxis;\n" : "") + TISSUE_NOISE + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\n" + (surface?.glsl ?? ""));
        if (surface) {
          // Bóng không đều theo vân: bề mặt thật không nhám đều như nhựa.
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <roughnessmap_fragment>",
            `#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor * (${surface.rough}), 0.0, 1.0);`,
          );
        }
        if (surface?.indirect) {
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <aomap_fragment>",
            `#include <aomap_fragment>\nreflectedLight.indirectDiffuse *= ${surface.indirect};`,
          );
        }
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <emissivemap_fragment>",
          "#include <emissivemap_fragment>\n" +
            (surface?.lit ?? "") +
            "float selectRim = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.5);\ntotalEmissiveRadiance += vec3(0.30, 0.72, 1.0) * partSelected * 0.65 * selectRim;\n// Rê chuột: viền sáng trắng ngà, yếu hơn viền chọn — gợi ý bấm được, không giành vai chọn.\ntotalEmissiveRadiance += vec3(0.95, 0.92, 0.85) * partHovered * (1.0 - partSelected) * (0.03 + 0.3 * selectRim);",
        );
      };
      materials.push(m);
      return m;
    };

    /*
     * ## Bối cảnh = lượt vẽ bóng mờ (2026-09-30)
     *
     * Mảnh bối cảnh của góc nhìn theo hệ (xem khí quản mà vẫn thấy thanh quản,
     * phế quản) vẽ thành lớp xám xanh trong suốt, như atlas tham chiếu. Bản đầu
     * dùng ô cờ (bỏ nửa điểm ảnh) để khỏi đụng thứ tự vẽ; trên màn DPR 1 nó thành
     * lưới sọc, thu nhỏ thì moiré — chủ sản phẩm chê "chưa đẹp".
     *
     * Màu mô thật (2026-10-02): bối cảnh mang màu của chính mảnh — xương ngà, phổi
     * hồng, da — như ảnh atlas tham chiếu, không còn một màu xám xanh. Xám xanh ở
     * độ đục 0,2 trên nền tối đọc thành mảng đen trong thẻ (Mũi, Cơ thở ra, Thần
     * kinh hệ hô hấp — chủ sản phẩm: "không để màu đen"). Độ đục nâng lên ~0,4–0,65
     * để màu đọc được; cấu trúc chính vẫn hiện vì nó đục và ghi depth trước.
     *
     * Không bật `transparent` trên vật liệu thường: mảnh bối cảnh chung vật liệu và
     * lượt vẽ với mảnh nổi bật. Thay vào đó: lượt chính bỏ mảnh bối cảnh; lượt hai
     * vẽ LẠI cảnh với `scene.overrideMaterial = ghostMaterial`, không xoá bộ đệm,
     * không ghi depth — nên cấu trúc chính vẫn che phần bối cảnh nằm sau nó. Đỉnh
     * không phải bối cảnh bị đẩy ra ngoài clip space, khỏi tô điểm ảnh.
     *
     * Từ 2026-10-23 cách vẽ ấy là chế độ "Xuyên thấu" (`SceneState.xray`), không
     * còn mặc định — xem "Bối cảnh kiểu atlas" ở `drawScene`.
     */
    const ghostMaterial = new T.MeshStandardMaterial({
      color: "#ffffff",
      metalness: 0,
      roughness: 0.6,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      // Chỉ mặt trước: hai mặt cộng dồn thành một khối xám gần đục.
      side: T.FrontSide,
    });
    /**
     * Độ đục chung của lượt bóng mờ. Góc nhìn theo hệ chỉ có vài mảnh bối cảnh → 1.
     * "Hiện giải phẫu xung quanh" lấy cả cơ thể làm bối cảnh: hàng chục lớp cơ, mạch,
     * tạng chồng nhau ở 0,55 cộng lại gần đục và che mất vùng chọn — hạ xuống.
     */
    const ghostFade = { value: 1 };
    /** 1 = Xuyên thấu (tự sáng theo viền); 0 = lượt "cửa sổ" của kiểu atlas (chiếu sáng thật). */
    const ghostXray = { value: 1 };
    ghostMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.ghostFade = ghostFade;
      shader.uniforms.ghostXray = ghostXray;
      shader.uniforms.depthFocus = depthFocus;
      shader.uniforms.depthRange = depthRange;
      shader.uniforms.partState = { value: partTexture };
      shader.uniforms.selectionState = { value: selectionTexture };
      shader.uniforms.partTint = { value: tintTexture };
      shader.uniforms.stateWidth = { value: width };
      shader.vertexShader =
        "attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform sampler2D partTint; uniform float stateWidth; varying float ghostOn; varying vec3 ghostTint; varying float ghostWindow;\n" +
        shader.vertexShader
          .replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\nvec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); transformed += state.xyz; vec4 pick = texture2D(selectionState, stateUv); ghostOn = step(0.5, state.w) * step(0.5, pick.a) * (1.0 - step(0.5, pick.r)); vec4 tint = texture2D(partTint, stateUv); ghostTint = tint.rgb; ghostWindow = tint.a;",
          )
          .replace(
            "#include <project_vertex>",
            "#include <project_vertex>\nif (ghostOn < 0.5) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);",
          );
      shader.fragmentShader =
        "uniform float ghostFade; uniform float ghostXray; varying float ghostOn; varying vec3 ghostTint; varying float ghostWindow;\n" +
        DEPTH_GLSL +
        shader.fragmentShader
          .replace("#include <opaque_fragment>", DEPTH_DIM)
          .replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\nif (ghostOn < 0.5) discard;")
          .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= ghostTint;")
          /*
           * Kiểu X-quang (2026-09-30): bối cảnh TỰ SÁNG theo viền (fresnel), không theo
           * đèn. Bản trước chiếu sáng như mô thật ở độ đục 0,2: mặt quay khỏi key light
           * gần đen, và 20% của gần-đen chồng lên nền tối là những mảng xám đen — phổi
           * mờ quanh cây phế quản, thành xương khoang mũi, lồng ngực quanh dây thần kinh
           * "chìm" (chủ sản phẩm báo). Viền đục hơn lõi; mức đục chung xem ghi chú
           * "Màu mô thật" ở trên.
           */
          .replace(
            "#include <emissivemap_fragment>",
            "#include <emissivemap_fragment>\nfloat ghostRim = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.0);\n" +
              "if (ghostXray > 0.5) {\ntotalEmissiveRadiance += diffuseColor.rgb * (0.16 + 0.3 * ghostRim);\ndiffuseColor.a *= (0.72 + 0.5 * ghostRim) * ghostFade;\n" +
              // Cửa sổ atlas: mô chiếu sáng như lượt đặc, chỉ đục theo lớp; viền đậm hơn chút
              // để vẫn đọc ra mép xương sườn trước thận. Phát sáng rất nhẹ: mặt khuất ở 10–25%
              // đục không thành vệt đen trên cấu trúc chính.
              "} else {\ntotalEmissiveRadiance += diffuseColor.rgb * 0.06;\ndiffuseColor.a = min(1.0, ghostWindow * (0.85 + 0.6 * ghostRim));\n}",
          );
    };
    ghostMaterial.customProgramCacheKey = () => "ghost";
    materials.push(ghostMaterial);
    /** Góc nhìn đang có mảnh bối cảnh hiện — khi đó mới cần lượt bóng mờ. */
    let ghostActive = false;
    /** "Hiện giải phẫu xung quanh" đang bật (xem `SceneState.surround`). */
    let surroundOn = false;
    /** "Xuyên thấu" (`SceneState.look`): bối cảnh vẽ kiểu X-quang như trước 2026-10-23. */
    let xray = false;
    /** "Bán trong suốt" (`SceneState.look`): kiểu atlas, lớp che mờ 40–60% (`FADE_SEMI`). */
    let semi = false;
    const setStencil = (list: Iterable<T.Material>, func: T.StencilFunc | null, ref = 0, zPass: T.StencilOp = T.KeepStencilOp) => {
      for (const m of list) {
        m.stencilWrite = func !== null;
        if (func === null) continue;
        m.stencilFunc = func;
        m.stencilRef = ref;
        m.stencilZPass = zPass;
      }
    };
    /**
     * Số lớp bối cảnh tối đa vẽ mờ đè lên cấu trúc chính. Thận ở toàn thân nằm sau 2–3 lớp cơ
     * thành bụng, mạc, ruột, phúc mạc: mỗi lớp 10–25% mà chồng hết thì gần đục, thành mảng
     * trắng che kín thận (chụp thử 2026-10-23). Stencil cấu trúc chính = số này, mỗi lớp trừ 1.
     */
    const WINDOW_LAYERS = 2;
    /** Stencil của cấu trúc chính ở kiểu atlas; lượt cửa sổ trừ dần xuống `TARGET - WINDOW_LAYERS`. */
    const TARGET_STENCIL = 255;
    /*
     * ## Lớp mờ không tự chồng lên chính nó (2026-10-23)
     *
     * Mỗi nhóm vật liệu gộp nhiều mảnh vào một lượt vẽ: ruột non là hàng chục quai trong
     * cùng một lượt. Mờ 10% mà 20 quai chồng nhau thì còn 1 − 0,9²⁰ ≈ 88% đục — mảng
     * trắng hồng che kín thận ở "Hiện giải phẫu xung quanh". Nên mỗi LƯỢT VẼ mờ chỉ được tô
     * một lớp trên mỗi điểm ảnh: lượt thứ k thử "k > stencil" rồi ghi k. Số thứ tự cấp theo
     * đúng thứ tự three.js vẽ (`onBeforeRender` của mesh), nên lượt sau luôn vẽ được lên
     * lượt trước — mô KHÁC nhau vẫn chồng (cơ trước ruột), chỉ một mô không chồng chính nó.
     * k < TARGET_STENCIL − WINDOW_LAYERS nên không bao giờ vẽ đè cấu trúc chính.
     */
    const TRANSLUCENT_MAX = TARGET_STENCIL - WINDOW_LAYERS - 1;
    let translucentSeq = 0;
    let limitTranslucent = false;
    const limitHook: T.Object3D["onBeforeRender"] = (_r, _s, _c, _g, material) => {
      if (!material.transparent || material === ghostMaterial) return;
      const on = limitTranslucent && translucentSeq < TRANSLUCENT_MAX;
      material.stencilWrite = on;
      if (!on) return;
      material.stencilFunc = T.GreaterStencilFunc;
      material.stencilRef = ++translucentSeq;
      material.stencilZPass = T.ReplaceStencilOp;
    };
    /*
     * ## Bối cảnh kiểu atlas (2026-10-23)
     *
     * Mặc định nay là kiểu atlas: bối cảnh (cột sống, xương chậu quanh thận…) vẽ ĐẶC
     * bằng chính vật liệu của nó — vân xương, AO — để người đọc thấy thận nằm ở
     * đâu. Nhưng bối cảnh hay BAO cấu trúc chính (phổi quanh phế quản, đốt sống
     * quanh tuỷ): vẽ đặc cả thì cấu trúc chính biến mất. Nên ba lượt:
     *
     *   1. Lượt chính: cấu trúc chính, ghi stencil = TARGET_STENCIL ở mọi điểm ảnh của nó.
     *   2. Bối cảnh, vật liệu thật, chỉ ở chỗ không phải cấu trúc chính; lớp mờ của nó
     *      không tự chồng (xem "Lớp mờ không tự chồng"). Bối cảnh nằm SAU cấu trúc chính
     *      đã bị depth loại sẵn.
     *   3. "Cửa sổ": bối cảnh nằm TRƯỚC cấu trúc chính (stencil gần TARGET), vẽ mờ theo lớp
     *      (`FADE_BY_LAYER`) bằng vật liệu ghi đè, chiếu sáng thật, không ghi depth; mỗi
     *      lớp trừ stencil 1, nên không quá WINDOW_LAYERS lớp chồng lên nhau.
     *
     * Đổi `stencil*` trên vật liệu là trạng thái GL, không biên dịch lại shader. Lát
     * `band` không cắt bối cảnh: lượt 2 dùng vật liệu thật (có mặt cắt), nên đẩy mặt
     * cắt ra xa trong lượt ấy. Xuyên thấu (`xray`) giữ nguyên đường cũ: lượt chính
     * rồi một lượt bóng mờ tự sáng.
     */
    const opaqueMats = () => [...mats.values()].filter((m) => !m.transparent);
    /*
     * Mỗi lượt chỉ đưa vào những mesh có mảnh cần vẽ ở lượt ấy. Shader đã loại mảnh ẩn ở
     * đỉnh, nhưng vẫn chạy vertex shader cho MỌI đỉnh của mọi mesh: góc nhìn thận có
     * ~40 mảnh hiện mà ba lượt vẽ vẫn đi qua 2,3 triệu đỉnh mỗi lượt. Tính theo vật liệu
     * (một nhóm mô = một vật liệu, có thể nhiều mesh: mỗi khối tải một mesh, cộng nắp mặt
     * cắt) từ chính mảng trạng thái CPU (`data`, `selectedData`) — ảnh thu nhỏ sửa hai
     * mảng ấy trước khi vẽ nên cũng đúng.
     */
    const drawn: T.Mesh[] = [];
    const mainMats = new Set<T.Material>();
    const contextMats = new Set<T.Material>();
    const sortParts = () => {
      mainMats.clear();
      contextMats.clear();
      for (let i = 0; i < parts.length; i++) {
        if (data[i * 4 + 3] < 0.5) continue;
        const context = selectedData[i * 4 + 3] > 127 && selectedData[i * 4] < 128;
        (context ? contextMats : mainMats).add(partMaterial[i]);
      }
    };
    const showOnly = (keep: Set<T.Material>) => {
      const hidden: T.Object3D[] = [];
      for (const o of [...drawn, ...capGroup.children]) {
        if (!o.visible || keep.has((o as T.Mesh).material as T.Material)) continue;
        o.visible = false;
        hidden.push(o);
      }
      return hidden;
    };
    const restore = (hidden: T.Object3D[]) => hidden.forEach((o) => (o.visible = true));
    const drawScene = (atlasStyle = !xray, semiStyle = semi) => {
      const solidContext = ghostActive && atlasStyle;
      const windowLayers = semiStyle ? 1 : WINDOW_LAYERS;
      setTintFade(semiStyle);
      translucentSeq = 0;
      // `limitHook` chỉ chạm vật liệu đang mờ, nên stencil nó gán ở lượt trước còn nằm
      // lại khi vật liệu đục trở lại (bỏ chọn tim → xương hết mờ): xương đục vẫn thử
      // "k > stencil", tự loại mặt trước của chính nó → loang lổ (2026-10-26). Xoá mỗi khung.
      setStencil(mats.values(), null);
      sortParts();
      depthFocus.value = Math.max(camera.position.distanceTo(depthTarget ?? controls.target), 0.01);
      depthRange.value = DEPTH_SPAN * depthFocus.value;
      // Lượt chính có cấu trúc chính ghi TARGET_STENCIL: lớp mờ của lượt này không giới hạn,
      // vì phép thử "k > stencil" sẽ chặn nó ngay trên cấu trúc chính (hiếm: chọn mảnh sâu
      // trong góc nhìn có bối cảnh). Không có bối cảnh đặc thì giới hạn như thường.
      limitTranslucent = atlasStyle && !solidContext;
      if (solidContext) setStencil(opaqueMats(), T.AlwaysStencilFunc, TARGET_STENCIL, T.ReplaceStencilOp);
      let hidden = showOnly(mainMats);
      renderer.render(scene, camera);
      restore(hidden);
      if (!ghostActive) {
        limitTranslucent = false;
        return;
      }
      const autoClear = renderer.autoClear;
      const markersShown = markers.visible;
      renderer.autoClear = false;
      markers.visible = false;
      hidden = showOnly(contextMats);
      if (solidContext) {
        // Bối cảnh đặc: chỉ ở chỗ KHÔNG phải cấu trúc chính (stencil < TARGET − WINDOW_LAYERS).
        setStencil(opaqueMats(), T.GreaterStencilFunc, TARGET_STENCIL - windowLayers);
        limitTranslucent = true;
        const cuts = contextUncut ? clipList.map((p) => p.constant) : [];
        if (contextUncut) clipList.forEach((p) => (p.constant = 1e6));
        contextPass.value = 1;
        renderer.render(scene, camera);
        contextPass.value = 0;
        cuts.forEach((c, k) => (clipList[k].constant = c));
        limitTranslucent = false;
        setStencil(mats.values(), null);
        // Qua khi stencil > TARGET − WINDOW_LAYERS, mỗi lớp vẽ trừ 1 — tối đa WINDOW_LAYERS lớp.
        setStencil([ghostMaterial], T.LessStencilFunc, TARGET_STENCIL - windowLayers, T.DecrementStencilOp);
        ghostXray.value = 0;
      }
      scene.overrideMaterial = ghostMaterial;
      renderer.render(scene, camera);
      scene.overrideMaterial = null;
      if (solidContext) {
        setStencil([ghostMaterial], null);
        ghostXray.value = 1;
      }
      restore(hidden);
      markers.visible = markersShown;
      renderer.autoClear = autoClear;
    };
    /*
     * Một vật liệu mỗi NHÓM cơ quan (gan, tuỵ, não, dây thần kinh… —
     * `part-groups.generated.json`), còn lại một vật liệu mỗi hệ. Mảnh cùng nhóm
     * vẫn gộp chung một lượt vẽ; bảng nhóm tra một lần lúc dựng, không mỗi khung.
     */
    const groupOf = partGroups as Record<string, string>;
    const keyOf = (p: (typeof parts)[number]) => p.group ?? groupOf[p.id] ?? p.system;
    const mats = new Map<string, T.MeshStandardMaterial>();
    const matsBySystem = new Map<SystemId, T.MeshStandardMaterial[]>();
    const keyOfMaterial = new Map<T.Material, string>();
    const materialForKey = (key: string, system: SystemId) => {
      let m = mats.get(key);
      if (!m) {
        m = materialFor(system, GROUP_COLORS[key] ?? SYSTEM_COLORS[system] ?? "#aebbb8", key);
        mats.set(key, m);
        keyOfMaterial.set(m, key);
        matsBySystem.set(system, [...(matsBySystem.get(system) ?? []), m]);
      }
      return m;
    };
    parts.forEach((p) => materialForKey(keyOf(p), p.system));
    const partMaterial = parts.map((p) => mats.get(keyOf(p))!);
    /*
     * ## Các lớp (2026-09-29)
     *
     * Slider "Tách các lớp" bóc từ ngoài vào: da → cơ → xương… (`layerOpacity`
     * trong anatomy.ts), rồi mới tách không gian (`peelToExplode`). Độ đậm đặt
     * trên VẬT LIỆU của từng hệ — một vật liệu mỗi hệ đã có sẵn, không nhân bản
     * cho 2.234 mảnh. Lớp đang mờ: `transparent`, không ghi depth (lớp trong
     * hiện qua), vẽ sau lớp đục (`renderOrder` theo độ sâu, ngoài cùng vẽ cuối).
     *
     * Chọn một cấu trúc ở SÂU (tim) khi các lớp ngoài còn đục: mọi lớp nằm
     * ngoài nó mờ xuống, để lớp ngoài không che mất thứ người đọc vừa chọn —
     * theo lớp (`FADE_BY_LAYER`: xương 45%, cơ 25%, da 10%), chỉ mặt trước: hai mặt
     * ở 45% cộng dồn mặt trong của xương thành bóng X-quang. Xuyên thấu giữ mức
     * cũ, mọi lớp 18%, hai mặt.
     *
     * Chọn một CƠ QUAN (kiểu atlas): các nhóm cơ quan khác cũng mờ còn 10% — cùng
     * lớp nội tạng nên luật "lớp ngoài" không chạm tới, mà ruột non nằm ngay trước
     * thận, che kín nó (chụp thử 2026-10-23). Mạch, thần kinh là lớp sâu hơn: giữ đục.
     *
     * Kênh G của texture chọn = mảnh thuộc lớp đang mờ: pass AO bỏ qua nó
     * (lớp trong suốt mà đổ bóng AO là tối sầm cả cơ thể).
     */
    const DIMMED = 0.18;
    const VESSELS_AROUND_ORGAN = 0.4; // cả thần kinh
    const ORGANS = LAYERS.indexOf("organs");
    const alphaBySystem = new Map<SystemId, number>(SYSTEM_IDS.map((id) => [id, 1]));
    /** Độ đục theo nhóm vật liệu (`keyOf`) — cơ quan cùng hệ có thể khác nhau, xem trên. */
    const alphaByKey = new Map<string, number>();
    const layerIndex = (system: SystemId) => LAYERS.indexOf(SYSTEM_LAYER[system]);
    const partIndexById = new Map(parts.map((p, i) => [p.id, i]));
    const applyLayers = (selected: string[]) => {
      let deepest = -1;
      const selectedKeys = new Set<string>();
      for (const id of selected) {
        const i = partIndexById.get(id);
        if (i === undefined) continue;
        deepest = Math.max(deepest, layerIndex(parts[i].system));
        selectedKeys.add(keyOf(parts[i]));
      }
      // Cấu trúc CHÍNH của góc nhìn đang mở không mờ theo luật "cơ quan khác": bấm thận
      // trong "Toàn bộ hệ tiết niệu" mà bàng quang về 10% thì thành khối nâu đen như
      // mô hoại tử (review 2026-10-23). Luật ấy dành cho thứ ngoài góc nhìn (ruột).
      const view = viewSet(latest.current.viewId);
      const keep = new Set(selectedKeys);
      if (view?.only) view.focus.forEach((i) => keep.add(keyOf(parts[i])));
      for (const system of SYSTEM_IDS) {
        let alpha = layerOpacity(SYSTEM_LAYER[system], effectivePeel(peel, latest.current.visible));
        const faded = layerIndex(system) < deepest;
        if (faded) alpha = Math.min(alpha, xray ? DIMMED : fadeOf(system, semi));
        alphaBySystem.set(system, alpha);
        const organPicked = !xray && deepest === ORGANS;
        const siblings = organPicked && layerIndex(system) === ORGANS;
        // Mạch, thần kinh nằm lớp sâu hơn nên luật lớp ngoài không chạm tới; đục 100% thì
        // động/tĩnh mạch bão hoà, rồi dây thần kinh vàng phủ kín bụng, thận không tách khỏi
        // nền (review + chụp thử 2026-10-23) → 40%.
        const vessels = organPicked && (SYSTEM_LAYER[system] === "vascular" || SYSTEM_LAYER[system] === "nervous");
        for (const m of matsBySystem.get(system) ?? []) {
          const key = keyOfMaterial.get(m) ?? system;
          const sibling = (siblings || vessels) && !keep.has(key);
          const around = vessels ? (semi ? FADE_SEMI.vascular : VESSELS_AROUND_ORGAN) : (semi ? FADE_SEMI : FADE_BY_LAYER).organs;
          const a = sibling ? Math.min(alpha, around) : alpha;
          alphaByKey.set(key, a);
          const solid = a > 0.999;
          const side = (faded || sibling) && !xray ? T.FrontSide : T.DoubleSide;
          m.opacity = solid ? 1 : a;
          m.transparent = !solid;
          m.depthWrite = solid;
          // `side` là tham số chương trình (DOUBLE_SIDED) — phải báo three biên dịch lại.
          if (m.side !== side) {
            m.side = side;
            m.needsUpdate = true;
          }
        }
      }
    };
    const alphaOf = (i: number) => alphaByKey.get(keyOf(parts[i])) ?? alphaBySystem.get(parts[i].system) ?? 1;
    /** Nhóm vẫn vẽ khi da còn đục (xem `underSkin`). */
    const SKIN_VISIBLE = new Set(["sensory.ear", "sensory.sclera", "sensory.iris"]);

    /** Góc nhìn → chỉ số mảnh (tính một lần mỗi góc nhìn, không mỗi khung). */
    /** `framed`: mảnh camera khung vào = tập nổi bật + `camera.frame` (views.ts). */
    type ViewSet = { focus: Set<number>; hide: Set<number>; context: Set<number>; framed: Set<number>; only: boolean };
    const viewSets = new Map<string, ViewSet | null>();
    const viewSet = (id: string | null | undefined) => {
      if (!id) return null;
      if (!viewSets.has(id)) {
        const ids = viewParts(id);
        const toIndex = (list: string[] = []) =>
          new Set(list.map((pid) => partIndexById.get(pid)).filter((i): i is number => i !== undefined));
        viewSets.set(
          id,
          ids
            ? {
                focus: toIndex(ids.focus),
                hide: toIndex(ids.hide),
                context: toIndex(ids.context),
                framed: toIndex([...ids.focus, ...(ids.frame ?? [])]),
                only: isSystemView(viewById(id)),
              }
            : null,
        );
      }
      return viewSets.get(id) ?? null;
    };
    /**
     * Mảnh có trong góc nhìn không. Theo vùng: mọi hệ trừ da, trừ `hide`. Theo
     * hệ: CHỈ tập nổi bật + bối cảnh — tách riêng cấu trúc, không dời mảnh.
     */
    const inView = (view: ViewSet, system: SystemId, i: number) =>
      view.only ? view.focus.has(i) || view.context.has(i) : system !== "integumentary" && !view.hide.has(i);
    const isContext = (view: ViewSet | null, i: number) => !!view?.only && view.context.has(i);
    /** Mảnh người đọc ẩn trong góc nhìn đang mở (`hiddenIn`) — tính lại khi state đổi. */
    let userHidden = new Set<number>();

    /*
     * Mặt phẳng cắt của góc nhìn: `clip` (một mặt, cắt cả bối cảnh) hoặc `band`
     * (lát ngang giữa hai cao độ đã sinh, bối cảnh KHÔNG cắt — đốt sống mờ trọn
     * vẹn cạnh đoạn tuỷ). Gắn/gỡ `clippingPlanes` hay đổi SỐ mặt đổi shader
     * (NUM_CLIPPING_PLANES) nên chỉ đụng vật liệu khi chữ ký (số mặt, bối cảnh có
     * cắt) THỰC SỰ đổi; giá trị mặt là uniform, đổi tự do. Vật liệu thay thế của
     * AO cũng phải cắt, không thì phần đã bỏ vẫn đổ bóng lên mặt cắt.
     */
    const planePool = [new T.Plane(), new T.Plane()];
    let clipList: T.Plane[] = [];
    let clipKey = "";
    /** Lát `band`: bối cảnh vẽ trọn — raycast cũng không lọc nó theo lát. */
    let contextUncut = false;
    /*
     * Nắp mặt cắt của lát `section`: một mesh mỗi nhóm vật liệu, dùng CHÍNH vật liệu
     * nhóm và thuộc tính `partIndex` — nên ẩn/chọn/rê chuột/bối cảnh mờ theo mảnh như
     * thân mảnh, không cần đường riêng. Đặt hơi dưới mặt cắt đỉnh để mặt cắt không
     * xén mất nắp. `capPickers`: raycast trúng nắp (thân mảnh bị cắt, nhìn từ trên
     * không còn gì để trúng). Dựng lại khi đổi góc nhìn và khi một khối về sau.
     */
    const capGroup = new T.Group();
    scene.add(capGroup);
    const capPickers = new Map<number, T.Mesh>();
    /** Hộp các nắp của tập nổi bật — khung camera của lát `section`. */
    const capBox = new T.Box3();
    let capKey = "";
    /** Nắp vừa có lần đầu (khối về sau khi đã khung) — vòng trạng thái khung lại. */
    let capsRefit = false;
    const buildCaps = (id: string | null | undefined) => {
      const def = viewSet(id) ? viewById(id) : null;
      const top = def?.band?.section ? viewParts(id)?.band?.top : undefined;
      const view = viewSet(id);
      const key = top !== undefined && view ? `${id}|${pickers.filter(Boolean).length}` : "";
      if (key === capKey) return;
      capKey = key;
      for (const m of [...capGroup.children, ...capPickers.values()] as T.Mesh[]) m.geometry.dispose();
      capGroup.clear();
      capPickers.clear();
      capBox.makeEmpty();
      if (top === undefined || !view) return;
      const y = top - 1e-5;
      const byKey = new Map<string, { system: SystemId; list: T.BufferGeometry[] }>();
      for (const i of [...view.focus, ...view.context]) {
        const g = pickers[i]?.geometry;
        if (!g?.index) continue;
        const cap = sectionCap(g.attributes.position.array, g.index.array, y);
        if (!cap) continue;
        const cg = new T.BufferGeometry();
        cg.setAttribute("position", new T.BufferAttribute(cap.positions, 3));
        cg.setAttribute("normal", new T.BufferAttribute(new Float32Array(cap.positions.length).map((_, k) => (k % 3 === 1 ? 1 : 0)), 3));
        cg.setAttribute("partIndex", new T.BufferAttribute(new Float32Array(cap.positions.length / 3).fill(i), 1));
        cg.setIndex(new T.BufferAttribute(cap.indices, 1));
        cg.computeBoundingBox();
        cg.computeBoundingSphere();
        const pick = new T.Mesh(cg, pickMaterial);
        pick.matrixAutoUpdate = false;
        capPickers.set(i, pick);
        if (view.focus.has(i)) capBox.union(cg.boundingBox!);
        const k = keyOf(parts[i]);
        const entry = byKey.get(k) ?? { system: parts[i].system, list: [] };
        entry.list.push(cg);
        byKey.set(k, entry);
      }
      byKey.forEach(({ system, list }, k) => {
        const merged = mergeGeometries(list, false);
        if (!merged) return;
        const mesh = new T.Mesh(merged, materialForKey(k, system));
        mesh.frustumCulled = false;
        mesh.onBeforeRender = limitHook;
        mesh.renderOrder = LAYERS.length - LAYERS.indexOf(SYSTEM_LAYER[system]);
        capGroup.add(mesh);
      });
    };
    const applyClip = (id: string | null | undefined) => {
      buildCaps(id);
      const def = viewSet(id) ? viewById(id) : null;
      // Sàn zoom chỉ theo góc nhìn ĐANG MỞ — ảnh thu nhỏ cũng gọi applyClip cho góc nhìn khác.
      if (id === latest.current.viewId) controls.minDistance = minDistanceFor(def);
      const band = def ? viewParts(id)?.band : undefined;
      const next: T.Plane[] = [];
      if (def?.clip) next.push(planePool[0].set(new T.Vector3(...def.clip.normal).normalize(), def.clip.constant));
      // Giữ y ≥ đáy và y ≤ đỉnh.
      if (band?.bottom !== undefined) next.push(planePool[next.length].set(new T.Vector3(0, 1, 0), -band.bottom));
      if (band?.top !== undefined) next.push(planePool[next.length].set(new T.Vector3(0, -1, 0), band.top));
      const cutContext = !!def?.clip || !!def?.band?.section;
      contextUncut = next.length > 0 && !cutContext;
      const key = `${next.length}|${cutContext}`;
      if (key === clipKey) {
        dirty = true;
        return;
      }
      clipKey = key;
      clipList = next;
      const targets: T.Material[] = [...materials];
      if (aoPass) targets.push(aoPass.normalMaterial);
      for (const m of targets) {
        const on = next.length > 0 && (m !== ghostMaterial || cutContext);
        m.clippingPlanes = on ? clipList : null;
        m.needsUpdate = true;
      }
      dirty = true;
    };
    /** Lát ngang của góc nhìn kẹp hộp khung: 10 cm tuỷ cổ không khung theo cả 49 cm tuỷ. */
    const clampToBand = (box: T.Box3, id: string | null | undefined) => {
      const band = viewSet(id) ? viewParts(id)?.band : undefined;
      if (!band || box.isEmpty()) return box;
      // Lát `section`: khung theo NẮP. Kẹp y không đủ — x/z của hộp vẫn trải theo cả
      // tuỷ cong (z lệch ~5 cm), lát hiện nhỏ và lệch khỏi tâm (chụp thử C5).
      if (viewById(id)?.band?.section) {
        buildCaps(id);
        if (!capBox.isEmpty()) {
          box.min.x = capBox.min.x;
          box.max.x = capBox.max.x;
          box.min.z = capBox.min.z;
          box.max.z = capBox.max.z;
        }
      }
      if (band.top !== undefined) box.max.y = Math.min(box.max.y, band.top);
      if (band.bottom !== undefined) box.min.y = Math.max(box.min.y, band.bottom);
      return box;
    };

    /*
     * ## AO (ambient occlusion) — chỉ desktop, chỉ khi đứng yên
     *
     * GTAO của three.js vẽ lại cảnh bằng MeshNormalMaterial thay thế — vật liệu
     * ấy không biết shader dịch chuyển/ẩn mảnh ở trên, nên dùng nguyên bản thì
     * mảnh đã tắt vẫn đổ bóng và mảnh đã tách đổ bóng ở chỗ cũ. Vá chính vật
     * liệu thay thế đó bằng cùng đoạn shader.
     *
     * Giá: thêm một lượt vẽ ~2,3 triệu tam giác + một pass toàn màn. Để không
     * trả giá ấy lúc xoay, AO chỉ vẽ khi cảnh đứng yên ~140 ms: xoay/zoom vẽ
     * thường, dừng tay thì một khung có AO thay vào. Máy yếu / màn cảm ứng /
     * khung hẹp không bật (`wantsAO`).
     *
     * Khung AO = khung thường × AO (2026-10-23). Bản trước vẽ cảnh qua EffectComposer
     * vào bộ đệm HalfFloat tuyến tính rồi OutputPass mới tone-map: lớp mờ trộn trong
     * không gian tuyến tính, nên dừng tay là lớp xương 45% trông như 70% và cả khung
     * "nhảy". Nay khung đứng yên vẽ y như khung đang xoay (`drawScene` thẳng ra canvas),
     * GTAO chỉ tính bộ đệm AO, rồi một quad nhân AO lên canvas. Canvas đã tone-map sRGB
     * nên AO lấy luỹ thừa `AO_GAMMA` — nhân thẳng AO tuyến tính là hốc tối hơn trước.
     */
    const wantsAO =
      matchMedia("(pointer: fine)").matches &&
      el.clientWidth >= 900 &&
      (navigator.hardwareConcurrency ?? 4) >= 4;
    const AO_GAMMA = 1 / 2.2;
    let aoPass: GTAOPass | null = null;
    let aoQuad: FullScreenQuad | null = null;
    const aoMultiply = new T.ShaderMaterial({
      uniforms: { tAO: { value: null }, gamma: { value: AO_GAMMA } },
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader:
        "uniform sampler2D tAO; uniform float gamma; varying vec2 vUv; void main() { gl_FragColor = vec4(vec3(pow(texture2D(tAO, vUv).r, gamma)), 1.0); }",
      transparent: true,
      depthTest: false,
      depthWrite: false,
      // canvas.rgb *= AO; alpha giữ nguyên (nền trong suốt vẫn trong suốt).
      blending: T.CustomBlending,
      blendEquation: T.AddEquation,
      blendSrc: T.DstColorFactor,
      blendDst: T.ZeroFactor,
      blendSrcAlpha: T.ZeroFactor,
      blendDstAlpha: T.OneFactor,
    });
    materials.push(aoMultiply);
    const sizeAO = () => {
      const pixelRatio = renderer.getPixelRatio();
      aoPass?.setSize(el.clientWidth * pixelRatio, el.clientHeight * pixelRatio);
    };
    if (wantsAO) {
      try {
        aoPass = new GTAOPass(scene, camera, el.clientWidth, el.clientHeight);
        // Bán kính 10 cm (trước 6 cm): kẽ đốt sống, hố chậu, khe giữa tạng mới đủ tối (review 2026-10-23).
        aoPass.updateGtaoMaterial({ radius: 0.1, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: 12 });
        aoPass.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
        // Chỉ tính bộ đệm AO (`pdRenderTarget`); nhân lên canvas là việc của `aoQuad`.
        aoPass.output = GTAOPass.OUTPUT.Off;
        aoPass.normalMaterial.onBeforeCompile = (shader) => {
          shader.uniforms.partState = { value: partTexture };
          shader.uniforms.selectionState = { value: selectionTexture };
          shader.uniforms.stateWidth = { value: width };
          shader.vertexShader =
            "attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth;\n" +
            shader.vertexShader
              .replace(
                "#include <begin_vertex>",
                "#include <begin_vertex>\nvec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); transformed += state.xyz; float partVisible = state.w * (1.0 - texture2D(selectionState, stateUv).g);",
              )
              .replace("#include <project_vertex>", "#include <project_vertex>\nif (partVisible < 0.5) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);");
        };
        aoQuad = new FullScreenQuad(aoMultiply);
        aoMultiply.uniforms.tAO.value = aoPass.pdRenderTarget.texture;
        sizeAO();
      } catch (error) {
        console.warn("[human-atlas] AO tắt:", error);
        aoPass?.dispose();
        aoPass = null;
        aoQuad = null;
      }
    }
    /** Khung đứng yên: vẽ như mọi khung, rồi nhân AO lên canvas. */
    const drawWithAO = () => {
      if (!aoPass || !aoQuad) return;
      renderer.setRenderTarget(null);
      drawScene();
      // writeBuffer/readBuffer không dùng khi `output` là Off. Bối cảnh vẽ đặc cũng đổ AO.
      const hidden = showOnly(new Set([...mainMats, ...contextMats]));
      aoPass.render(renderer, null as unknown as T.WebGLRenderTarget, null as unknown as T.WebGLRenderTarget, 0, false);
      restore(hidden);
      renderer.setRenderTarget(null);
      const autoClear = renderer.autoClear;
      renderer.autoClear = false;
      aoQuad.render(renderer);
      renderer.autoClear = autoClear;
    };
    let lastChange = performance.now();
    let aoFresh = false;

    // ------------------------------------------------------ tải hình học
    /*
     * ## Chỉ tải khối của những mảnh đang VẼ (2026-10-01)
     *
     * Hình học là 18 khối dùng chung (~44 MB nén; một cấu trúc nằm ở đúng một
     * khối). Bản trước tải cả 18 khối ngay khi mở trang và chỉ bấm được khi xong
     * hết — 45 MB, ~9 s. Nhưng khung mặc định là da ĐỤC: mọi lớp trong bị
     * `underSkin` bỏ khỏi lượt vẽ, nên thứ người đọc thấy chỉ cần da + tai + mắt
     * — khối 0, 10, 11 và da chia nhỏ, ~10 MB.
     *
     * Nên tập khối cần tải suy từ CHÍNH `isShown` của vòng vẽ (không một danh
     * sách riêng dễ lệch): mỗi lần trạng thái đổi — kéo "Tách các lớp", bật hệ,
     * mở góc nhìn, chọn một cấu trúc từ ô tìm — khối của mảnh vừa hiện được xếp
     * lên đầu hàng đợi. Lưới góc nhìn mở thì tải nốt phần còn lại cho ảnh thu
     * nhỏ. Khối đã tải không bao giờ gỡ; tệp trên R2 đệm `immutable` một năm.
     *
     * `onProgress` báo tiến độ của tập ĐANG CẦN, không phải của cả 18 khối:
     * 100% = mọi thứ đáng lẽ đang thấy đã có trên màn.
     */
    const chunkState = new Uint8Array(atlas.chunks.length); // 0 chưa · 1 đang tải · 2 xong
    /** Khối của các mảnh đang vẽ — tải trước. */
    let wanted: number[] = [];
    /** Lưới góc nhìn đã mở: khối cho ảnh thu nhỏ, tải sau `wanted`. */
    let galleryWanted = false;
    /** Đã đọc xong đệm ảnh thu nhỏ: chỉ từ đó mới tải khối / chụp cho lưới. */
    let thumbCacheRead = false;
    let activeLoads = 0;
    let loadFailed = false;
    let lastPercent = -1;
    /** Tập khối đầu tiên đã đủ: từ đó bấm/rê chuột được, kể cả khi khối khác đang về. */
    let interactive = false;
    const loadChunk = async (ci: number) => {
      const chunk = atlas.chunks[ci];
      const compressed = !!chunk.gzip && typeof DecompressionStream !== "undefined";
      const response = await fetch(atlasDataUrl(compressed ? chunk.gzip! : chunk.url), {
        signal: abort.signal,
      });
      const buffer = await decodeModelResponse(response, chunk.bytes, compressed);
      if (disposed) return;

      const groups = new Map<string, { system: SystemId; list: T.BufferGeometry[] }>();
      parts.forEach((p, i) => {
        if (p.chunk !== ci) return;
        const g = new T.BufferGeometry();
        g.setAttribute(
          "position",
          new T.BufferAttribute(new Float32Array(buffer, p.positions, p.vertexCount * 3), 3),
        );
        // Pháp tuyến int16 chuẩn hoá trên GPU: giữ cả atlas gọn trong bộ nhớ.
        g.setAttribute(
          "normal",
          new T.BufferAttribute(new Int16Array(buffer, p.normals, p.vertexCount * 3), 3, true),
        );
        g.setIndex(new T.BufferAttribute(new Uint32Array(buffer, p.indices, p.indexCount), 1));
        g.boundingBox = bounds[i].clone();
        g.computeBoundingSphere();
        const pick = new T.Mesh(g, pickMaterial);
        pick.matrixAutoUpdate = false;
        pickers[i] = pick;
        geometries.push(g);
        g.setAttribute(
          "partIndex",
          new T.BufferAttribute(new Float32Array(p.vertexCount).fill(i), 1),
        );
        const key = keyOf(p);
        const entry = groups.get(key) ?? { system: p.system, list: [] };
        entry.list.push(g);
        groups.set(key, entry);
      });
      groups.forEach(({ system, list: gs }, key) => {
        const geometry = mergeGeometries(gs, false);
        if (!geometry) throw new Error("merge");
        geometries.push(geometry);
        const mesh = new T.Mesh(geometry, materialForKey(key, system));
        mesh.frustumCulled = false;
        mesh.onBeforeRender = limitHook;
        // Ngoài cùng vẽ cuối: lớp mờ phải vẽ sau những gì nó phủ lên.
        mesh.renderOrder = LAYERS.length - LAYERS.indexOf(SYSTEM_LAYER[system]);
        scene.add(mesh);
        drawn.push(mesh);
      });
      // Nắp có khi khối của lát về — trước đó góc nhìn đã khung theo hộp tạm. Khung lại
      // qua đúng đường "đổi góc nhìn" của vòng trạng thái: gọi `fit` thẳng từ đây thì
      // camera dừng giữa chừng (đo: đích lệch 1,6 cm khỏi nắp, lát rơi ra ngoài khung).
      // Khung lại mỗi lần hộp nắp ĐỔI, không chỉ lần đầu: lát ngực có nắp ở nhiều khối
      // (tuyến ức về trước, hạch và mạch bạch huyết về sau) — chỉ khung theo khối đầu thì
      // camera phóng sát vào tuyến ức (đo 2026-10-23).
      const capsBefore = capBox.clone();
      buildCaps(latest.current.viewId);
      if (!capBox.isEmpty() && !capBox.equals(capsBefore)) capsRefit = true;
      lastState = null;
      dirty = true;
    };

    /**
     * Khối cho ảnh còn phải chụp: thẻ đang hiện trên lưới trước, rồi theo thứ tự
     * thẻ. Ảnh đã có trong đệm đã rời `thumbQueue` nên không kéo khối nào về.
     */
    const galleryChunks = () => {
      const order = new Set<number>();
      for (const id of thumbOrder()) thumbChunks(id).forEach((c) => order.add(c));
      return [...order];
    };
    const reportProgress = () => {
      const done = wanted.filter((c) => chunkState[c] === 2).length;
      // `floor`: 100% chỉ khi đủ thật — 17/18 khối không được hiện thành 100.
      const percent = wanted.length ? Math.floor((done / wanted.length) * 100) : 100;
      if (percent === 100) interactive = true;
      if (percent !== lastPercent) {
        lastPercent = percent;
        callbacks.current.onProgress(percent);
      }
    };
    const pump = () => {
      while (!disposed && !loadFailed && activeLoads < PARALLEL_CHUNKS) {
        const next =
          wanted.find((c) => chunkState[c] === 0) ??
          (galleryWanted && thumbCacheRead ? galleryChunks().find((c) => chunkState[c] === 0) : undefined);
        if (next === undefined) return;
        chunkState[next] = 1;
        activeLoads += 1;
        loadChunk(next)
          .then(
            () => {
              chunkState[next] = 2;
            },
            (error: unknown) => {
              if (disposed || (error instanceof DOMException && error.name === "AbortError")) return;
              loadFailed = true;
              console.error("[human-atlas] tải hình học thất bại:", error);
              callbacks.current.onError("download");
            },
          )
          .finally(() => {
            activeLoads -= 1;
            if (disposed) return;
            reportProgress();
            pump();
          });
      }
    };
    /** Tập khối của trạng thái hiện tại — gọi mỗi lần tập mảnh đang vẽ được tính lại. */
    const demand = (chunks: Iterable<number>) => {
      const next = [...new Set(chunks)].sort((a, b) => a - b);
      if (next.length === wanted.length && next.every((c, i) => c === wanted[i])) return;
      wanted = next;
      reportProgress();
      pump();
    };

    // ------------------------------------------------------------ camera
    const fovTan = () => 2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2));

    /** Hướng NHÌN TỪ — +x là bên trái người mẫu (xem `ViewDirection`). */
    const NAMED_DIRECTIONS: Record<string, readonly [number, number, number]> = {
      front: [0, 0.02, 1],
      back: [0, 0.02, -1],
      side: [1, 0.02, 0],
      left: [1, 0.02, 0],
      right: [-1, 0.02, 0],
      anterolateral: [0.7, 0.08, 0.7],
      posterolateral: [0.7, 0.08, -0.7],
      // Không thẳng đứng hẳn: `frameBox` cần trục "lên" không trùng hướng nhìn.
      superior: [0, 1, 0.3],
      inferior: [0, -1, 0.3],
    };
    const viewDirection = (view: string | ViewDirection): T.Vector3 =>
      new T.Vector3(...(typeof view !== "string" ? view : (NAMED_DIRECTIONS[view] ?? [0.35, 0.06, 1]))).normalize();

    /**
     * Phần khung còn nhìn thấy mô hình: cả khung trừ các bảng nổi đánh dấu
     * `data-atlas-avoid="top|bottom|left|right"` (tiêu đề, ô tìm, danh sách hệ,
     * cột camera, thanh tách lớp). Đo DOM thật thay vì trừ số cứng, để bảng đổi
     * cỡ theo breakpoint thì khung tự theo.
     */
    const usableRect = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const host = el.getBoundingClientRect();
      let left = 0;
      let right = w;
      let top = 0;
      let bottom = h;
      root.querySelectorAll<HTMLElement>("[data-atlas-avoid]").forEach((node) => {
        const r = node.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return; // đang ẩn (display: none)
        const side = node.dataset.atlasAvoid;
        // Mẩu ở góc (tiêu đề, ô tìm) không phải dải ngang: trừ cả chiều cao cho
        // chúng là thu cơ thể xuống ~50% khung dù đầu không hề chạm chúng.
        const corner = r.width < w * 0.4;
        if (side === "top") top = corner ? top : Math.max(top, r.bottom - host.top);
        else if (side === "bottom") bottom = Math.min(bottom, r.top - host.top);
        // Bảng dọc rộng quá nửa khung là lớp nổi tạm (danh sách hệ trên điện
        // thoại) — né nó thì mô hình co lại mỗi lần mở danh sách.
        else if (r.width > w * 0.5) return;
        else if (side === "left") left = Math.max(left, r.right - host.left);
        else if (side === "right") right = Math.min(right, r.left - host.left);
      });
      // Khung quá chật (điện thoại xoay ngang): bỏ né theo chiều đó, dùng cả khung.
      if (right - left < w * 0.35) [left, right] = [0, w];
      if (bottom - top < h * 0.35) [top, bottom] = [0, h];
      return { w, h, left, right, top, bottom };
    };

    /**
     * Hộp bao của các hệ đang bật; không hệ nào thì cả cơ thể.
     *
     * Đang tách thì tính theo vị trí HIỆN TẠI của mảnh (đã cộng độ dời), không
     * theo vị trí nguyên khối. Ở pha toả ra mỗi hệ trượt theo một hướng riêng;
     * bật một hệ duy nhất (vd. thần kinh) là cả khối dời lệch lên phải — khung
     * theo hộp nguyên khối thì mô hình trôi ra góc màn hình.
     */
    const shifted = new T.Box3();
    /** Toàn thân ở nguyên khối — mốc cho trần phóng to của hệ cục bộ. */
    const fullBox = new T.Box3();
    bounds.forEach((b) => fullBox.union(b));
    const MAX_MAGNIFY = 3.5;
    const visibleBox = () => {
      const on = new Set(latest.current.visible);
      const box = new T.Box3();
      const displaced = amount > 0.001;
      // Góc nhìn: khung theo tập NỔI BẬT; mảnh làm mờ chỉ là bối cảnh.
      const view = viewSet(latest.current.viewId);
      if (view) {
        // Cấu trúc đã ẩn không giữ chỗ trong khung ("Vừa khung" sau khi ẩn lồng ngực).
        view.framed.forEach((i) => {
          if (userHidden.has(i)) return;
          box.union(shifted.copy(bounds[i]).translate(new T.Vector3(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])));
        });
        if (!box.isEmpty()) return clampToBand(box, latest.current.viewId);
      }
      parts.forEach((p, i) => {
        if (!displaced) {
          if (on.has(p.system)) box.union(bounds[i]);
          return;
        }
        // Đang tách: chỉ mảnh đang hiện (lớp đã mờ hẳn bị ẩn và nằm lại chỗ cũ).
        if (data[i * 4 + 3] > 0) box.union(shifted.copy(bounds[i]).translate(new T.Vector3(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])));
      });
      if (box.isEmpty()) bounds.forEach((b) => box.union(b));
      return box;
    };

    /*
     * ## Cỡ khung mặc định (2026-09-29)
     *
     * Chiều cao hộp bao trên màn = min(FILL × chiều cao khung xem,
     * (1 − 2 × PAD) × chiều cao vùng quan sát). FILL 74% desktop, 70% tablet,
     * 68% điện thoại; PAD 6% mỗi đầu. Đo thật (bộ xương, nhìn thẳng): 71% / 69% /
     * 64% khung xem — thấp hơn FILL vì khoảng cách tính tới MẶT GẦN của hộp.
     *
     * FILL tính trên CẢ khung xem (dưới thanh điều hướng của site), không trên
     * vùng quan sát: bản trước lấy 70% của vùng đã trừ thanh "Tách các lớp" —
     * một phần trăm của một phần trăm — nên bộ xương chỉ ~50% màn hình. Vế thứ
     * hai giữ đầu và bàn chân cách mép trên và thanh trượt, vì cơ thể căn giữa
     * trong VÙNG QUAN SÁT: to hơn nữa là bàn chân chui sau thanh trượt.
     */
    const frameFill = (w: number) => (w < 768 ? 0.68 : w < 1024 ? 0.7 : 0.74);

    /*
     * ## Tâm ngang (2026-09-29)
     *
     * Căn giữa CANVAS, không giữa vùng trống: bản trước đặt mô hình giữa danh
     * sách hệ (trái) và cột camera (phải), nên mô hình lệch phải ~100 px so với
     * thanh "Tách các lớp" và dòng chú thích — vốn canh giữa trang (báo lỗi
     * 2026-09-29). Nay chỉ né bảng khi mô hình THẬT SỰ chạm bảng: dời vừa đủ để
     * mép mô hình cách bảng `EDGE` px; hẹp tới mức không né được thì mới về giữa
     * vùng trống như cũ. Chiều dọc giữ căn theo vùng trống (tiêu đề, thanh dưới).
     */
    const EDGE = 16;
    /** Nửa bề ngang (px) mô hình ở khung vừa gần nhất — `recenter` dùng lại. */
    let frameHalfPx = 0;
    const centerOffsetX = (rect: ReturnType<typeof usableRect>, halfPx: number) => {
      const lo = rect.left + halfPx + EDGE;
      const hi = rect.right - halfPx - EDGE;
      const cx = lo <= hi ? Math.min(hi, Math.max(lo, rect.w / 2)) : (rect.left + rect.right) / 2;
      return rect.w / 2 - cx;
    };
    const FRAME_PAD = 0.06;
    const SYSTEM_VIEW_FILL = 0.74;
    const corner = new T.Vector3();

    /**
     * Đặt `box` vào giữa vùng trống, nhìn theo `direction`. Chiếu 8 góc hộp lên
     * hai trục màn hình của camera để lấy bề rộng/cao THẬT theo góc nhìn (hộp
     * nhìn nghiêng rộng hơn nhìn thẳng), rồi giải khoảng cách từ FOV dọc và tỉ
     * lệ khung. Tâm vùng trống lệch khỏi tâm canvas thì bù bằng view offset
     * của camera — xoay vẫn quanh cấu trúc, không quanh tâm canvas.
     */
    const frameBox = (
      box: T.Box3,
      direction: T.Vector3,
      rect: ReturnType<typeof usableRect>,
      aspect = camera.aspect,
      /**
       * Góc nhìn theo hệ: sàn khoảng cách hạ từ 0,12 m xuống trần zoom của
       * OrbitControls (nắp thanh môn 3–4 cm ở sàn cũ chỉ còn nửa khung), và lấp
       * theo vùng trống (xem `fillY`).
       */
      systemView = false,
      /** Tỉ lệ lấp vùng trống của góc nhìn theo hệ (ảnh thu nhỏ lấp nhiều hơn khung xem). */
      systemFill = SYSTEM_VIEW_FILL,
      /** Sàn khoảng cách của góc nhìn theo hệ — `minDistanceFor(def)`. */
      systemFloor = MIN_DISTANCE,
    ) => {
      const floor = systemView ? systemFloor : 0.12;
      const worldUp =
        Math.abs(direction.y) > 0.99 ? new T.Vector3(0, 0, 1) : new T.Vector3(0, 1, 0);
      const right = new T.Vector3().crossVectors(worldUp, direction).normalize();
      const up = new T.Vector3().crossVectors(direction, right).normalize();
      const center = box.getCenter(new T.Vector3());
      let minR = Infinity;
      let maxR = -Infinity;
      let minU = Infinity;
      let maxU = -Infinity;
      let nearest = -Infinity;
      for (let c = 0; c < 8; c++) {
        corner
          .set(
            c & 1 ? box.max.x : box.min.x,
            c & 2 ? box.max.y : box.min.y,
            c & 4 ? box.max.z : box.min.z,
          )
          .sub(center);
        const r = corner.dot(right);
        const u = corner.dot(up);
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minU = Math.min(minU, u);
        maxU = Math.max(maxU, u);
        nearest = Math.max(nearest, corner.dot(direction));
      }
      const target = center
        .clone()
        .addScaledVector(right, (minR + maxR) / 2)
        .addScaledVector(up, (minU + maxU) / 2);
      const tanHalf = fovTan() / 2;
      // Góc nhìn theo hệ (có `floor` riêng): lấp 74% chiều cao VÙNG TRỐNG, không của cả
      // khung — cơ quan cao như khí quản mà lấp theo cả khung là đè lên chip góc nhìn
      // và thanh "Tách các lớp" (~93% vùng trống, đo 2026-09-29).
      const fillY =
        systemView
          ? ((rect.bottom - rect.top) * systemFill) / rect.h
          : Math.min(frameFill(rect.w) * rect.h, (rect.bottom - rect.top) * (1 - 2 * FRAME_PAD)) / rect.h;
      const fillX = ((rect.right - rect.left) * (1 - 2 * FRAME_PAD)) / rect.w;
      // Tính tới MẶT GẦN của hộp (+ nearest): mặt ấy hiện to nhất trên màn.
      const distance =
        Math.max(
          (maxU - minU) / 2 / (tanHalf * fillY),
          (maxR - minR) / 2 / (tanHalf * aspect * fillX),
          floor,
        ) + Math.max(0, nearest);
      // Bề ngang trên màn tính ở MẶT GẦN (mặt hiện to nhất), như khoảng cách.
      const halfPx =
        (((maxR - minR) / 2) * (rect.w / 2)) / (tanHalf * aspect * Math.max(1e-3, distance - Math.max(0, nearest)));
      return {
        target,
        distance,
        halfPx,
        offsetX: centerOffsetX(rect, halfPx),
        offsetY: rect.h / 2 - (rect.top + rect.bottom) / 2,
      };
    };

    // View offset hiện tại — tween nội suy nó cùng vị trí camera.
    let offsetX = 0;
    let offsetY = 0;
    const applyOffset = (x: number, y: number) => {
      offsetX = x;
      offsetY = y;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) camera.clearViewOffset();
      else camera.setViewOffset(w, h, x, y, w, h);
    };

    /**
     * Chuyển camera ngắn (320 ms, ease-out) giữa hai khung. Nội suy HƯỚNG nhìn
     * bằng quaternion chứ không nội suy thẳng vị trí: đi từ nhìn trước sang
     * nhìn sau theo đường thẳng sẽ xuyên qua tâm mô hình.
     */
    type Tween = {
      start: number;
      ms: number;
      fromTarget: T.Vector3;
      toTarget: T.Vector3;
      fromDir: T.Vector3;
      turn: T.Quaternion;
      fromDistance: number;
      toDistance: number;
      fromOffset: [number, number];
      toOffset: [number, number];
    };
    let tween: Tween | null = null;
    const TWEEN_MS = 320;
    /** Chuyển sang một góc nhìn: dài hơn đổi hướng thường, để mắt theo kịp chỗ mới. */
    const VIEW_TWEEN_MS = 650;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const identity = new T.Quaternion();
    const step = new T.Quaternion();

    const place = (
      target: T.Vector3,
      direction: T.Vector3,
      distance: number,
      offset: [number, number],
      animate: boolean,
      ms = TWEEN_MS,
    ) => {
      if (!animate || reducedMotion.matches) {
        tween = null;
        applyOffset(offset[0], offset[1]);
        controls.target.copy(target);
        camera.position.copy(target).addScaledVector(direction, distance);
        controls.update();
        dirty = true;
        return;
      }
      const fromDir = camera.position.clone().sub(controls.target);
      const fromDistance = fromDir.length();
      fromDir.normalize();
      tween = {
        start: performance.now(),
        ms,
        fromTarget: controls.target.clone(),
        toTarget: target.clone(),
        fromDir,
        turn: new T.Quaternion().setFromUnitVectors(fromDir, direction.clone().normalize()),
        fromDistance,
        toDistance: distance,
        fromOffset: [offsetX, offsetY],
        toOffset: offset,
      };
      dirty = true;
    };

    const runTween = (now: number) => {
      if (!tween) return;
      const raw = Math.min(1, (now - tween.start) / tween.ms);
      const k = 1 - (1 - raw) ** 3;
      step.slerpQuaternions(identity, tween.turn, k);
      controls.target.lerpVectors(tween.fromTarget, tween.toTarget, k);
      camera.position
        .copy(tween.fromDir)
        .applyQuaternion(step)
        .multiplyScalar(T.MathUtils.lerp(tween.fromDistance, tween.toDistance, k))
        .add(controls.target);
      applyOffset(
        T.MathUtils.lerp(tween.fromOffset[0], tween.toOffset[0], k),
        T.MathUtils.lerp(tween.fromOffset[1], tween.toOffset[1], k),
      );
      if (raw >= 1) tween = null;
      dirty = true;
    };
    // Người đọc tự kéo/cuộn thì dừng tween ngay — không giằng camera với họ.
    controls.addEventListener("start", () => {
      tween = null;
    });

    /**
     * Khung cho trạng thái hiện tại: vừa hộp bao THẬT của các mảnh đang hiện
     * (đã cộng độ dời) trong vùng trống. Thanh "Tách các lớp" kéo tới đâu hộp
     * bao nở tới đó, camera lùi theo — không nhảy.
     *
     * KHÔNG nội suy giữa khung nguyên khối và khung lưới giả định (bản cũ: tâm
     * y = 0,85, khoảng cách của lưới đầy đủ). Ở 91% slider mảnh mới đi 40%
     * đường tới ô lưới, nên tâm nội suy thấp hơn tâm thật của đám mảnh — bấm
     * "Vừa khung" là mô hình trôi lên, mất nửa trên.
     *
     * KHÔNG dùng khoảng cách cố định: bản cũ đặt 4 m cho mọi tập hệ, nên chỉ
     * bật hệ tiêu hoá (cao ~0,6 m) thì mô hình còn bằng một phần ba khung.
     *
     * `keepDirection`: giữ góc người đọc đang xoay tới (khi bật/tắt hệ), chỉ
     * đổi tâm và khoảng cách. Nút góc nhìn và "Đặt lại" thì về hướng chuẩn.
     */
    const fit = (view: string, animate = false, keepDirection = false, ms = TWEEN_MS) => {
      if (el.clientWidth === 0 || el.clientHeight === 0) return;
      const preset = viewSet(latest.current.viewId) ? viewById(latest.current.viewId) : null;
      // Hướng của góc nhìn áp tới khi người đọc tự bấm một hướng (Trước/Bên/Sau).
      // Lưới tách hẳn chỉ đọc được khi nhìn thẳng (xoay cũng tắt từ mốc này).
      const heading: string | ViewDirection = amount > 0.8 ? "front" : (preset && viewHeading ? preset.direction : view);
      const direction =
        keepDirection && amount < 0.05
          ? camera.position.clone().sub(controls.target).normalize()
          : viewDirection(heading);
      const rect = usableRect();
      const frame = frameBox(
        visibleBox(),
        direction,
        rect,
        camera.aspect,
        isSystemView(preset),
        preset?.camera?.fill,
        minDistanceFor(preset),
      );
      const fittedDistance = frame.distance;
      // Hệ cục bộ (não, tim, tiêu hoá) không phóng tới đủ 74%: tối đa gấp
      // MAX_MAGNIFY lần cỡ toàn thân, để não 17 cm không lấp cả màn. Chỉ ở
      // nguyên khối — lưới tách thì khung theo lưới.
      if (amount < 0.05 && !preset) {
        const whole = frameBox(fullBox, direction, rect);
        frame.distance = Math.max(frame.distance, whole.distance / MAX_MAGNIFY);
      }
      // Trần zoom ra: lùi được gấp 4 khung vừa — đủ để thấy toàn cảnh, chưa tới
      // mức mô hình thành một chấm giữa màn.
      controls.maxDistance = Math.max(6, frame.distance * 4);
      // Khoảng cách vừa bị nâng (trần phóng to) thì mô hình nhỏ lại theo cùng tỉ lệ.
      frameHalfPx = frame.halfPx * (fittedDistance / Math.max(1e-3, frame.distance));
      frame.offsetX = centerOffsetX(rect, frameHalfPx);
      place(frame.target, direction, frame.distance, [frame.offsetX, frame.offsetY], animate, ms);
    };

    /** Bay tới hộp bao của những mảnh đang chọn, giữ nguyên phần còn lại của cơ thể. */
    const focusSelection = (selected: string[]) => {
      const wanted = new Set(selected);
      const box = new T.Box3();
      parts.forEach((p, i) => {
        if (wanted.has(p.id)) {
          box.union(
            bounds[i].clone().translate(new T.Vector3(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])),
          );
        }
      });
      if (box.isEmpty()) return;
      const center = box.getCenter(new T.Vector3());
      const size = box.getSize(new T.Vector3());
      const distance = Math.min(
        6,
        Math.max(0.35, (Math.max(size.x, size.y, size.z) / fovTan()) * 2.6),
      );
      const direction = camera.position.clone().sub(controls.target).normalize();
      tween = null;
      controls.target.copy(center);
      camera.position.copy(center).addScaledVector(direction, distance);
      controls.update();
      dirty = true;
    };

    /*
     * ## Di chuyển dọc khi phóng to (2026-09-29)
     *
     * Zoom = độ phóng; thanh cuộn dọc = vị trí xem dọc cơ thể; kéo = góc nhìn.
     * Ba thứ độc lập. Thanh cuộn KHÔNG cuộn DOM: nó dời target của camera (và
     * camera theo cùng một đoạn) theo trục Y. Giới hạn tính từ hộp bao các hệ
     * đang bật, cộng đệm: ở đầu thanh thấy trọn đỉnh đầu, ở cuối thấy trọn bàn
     * chân. Cơ thể còn vừa khung thì không có phạm vi, thanh ẩn, và target bị
     * kéo dần về giữa — zoom ra tới lúc vừa là cơ thể tự căn giữa, không nhảy.
     * Chỉ ở nguyên khối, ngoài "xem riêng" và ngoài lúc camera đang chuyển.
     */
    let boxKey = "";
    let cachedBox = new T.Box3();
    const currentBox = () => {
      // `capKey`: hộp của lát `section` đổi khi nắp dựng xong (khối về sau). Không có nó,
      // bản cache cũ (x/z theo cả tuỷ) làm `updateScroll` kéo tâm lệch khỏi nắp ~1,7 cm.
      const key = `${latest.current.viewId ?? ""}|${latest.current.visible.join(",")}|${capKey}`;
      if (key !== boxKey) {
        cachedBox = visibleBox();
        boxKey = key;
      }
      return cachedBox;
    };
    const scrollRange = () => {
      const box = currentBox();
      const rect = usableRect();
      const distance = camera.position.distanceTo(controls.target);
      // Chiều cao thế giới mà vùng quan sát chứa được, ở mặt phẳng của target.
      const viewHeight = fovTan() * distance * ((rect.bottom - rect.top) / Math.max(1, rect.h));
      const pad = viewHeight * 0.05;
      const lo = box.min.y - pad + viewHeight / 2;
      const hi = box.max.y + pad - viewHeight / 2;
      const center = (box.min.y + box.max.y) / 2;
      return lo < hi ? { lo, hi, center, overflow: true, viewHeight, total: box.max.y - box.min.y + 2 * pad } : { lo: center, hi: center, center, overflow: false, viewHeight, total: 1 };
    };
    const shiftY = (dy: number) => {
      controls.target.y += dy;
      camera.position.y += dy;
      dirty = true;
    };
    const navActive = () => amount < 0.05 && !latest.current.isolate && !tween;

    const track = document.createElement("div");
    track.className = "absolute top-[18%] right-1.5 bottom-[18%] z-20 w-2 rounded-full bg-white/[0.06] touch-none";
    track.setAttribute("role", "scrollbar");
    track.setAttribute("aria-orientation", "vertical");
    track.setAttribute("aria-label", scrollLabel);
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    track.tabIndex = 0;
    track.hidden = true;
    const thumb = document.createElement("div");
    thumb.className = "absolute inset-x-0 rounded-full bg-white/35 hover:bg-white/55";
    track.appendChild(thumb);
    root.appendChild(track);

    /** 0 = đỉnh đầu, 1 = bàn chân. */
    const scrollTo = (fraction: number) => {
      const range = scrollRange();
      if (!range.overflow) return;
      const f = Math.min(1, Math.max(0, fraction));
      shiftY(range.hi - f * (range.hi - range.lo) - controls.target.y);
    };
    let dragOffset: number | null = null;
    const trackFraction = (clientY: number) => {
      const r = track.getBoundingClientRect();
      const thumbH = thumb.getBoundingClientRect().height;
      return (clientY - r.top - (dragOffset ?? thumbH / 2)) / Math.max(1, r.height - thumbH);
    };
    const trackDown = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const t = thumb.getBoundingClientRect();
      dragOffset = e.target === thumb ? e.clientY - t.top : t.height / 2;
      track.setPointerCapture(e.pointerId);
      scrollTo(trackFraction(e.clientY));
    };
    const trackMove = (e: PointerEvent) => {
      if (dragOffset === null) return;
      scrollTo(trackFraction(e.clientY));
    };
    const trackUp = () => {
      dragOffset = null;
    };
    const trackKey = (e: KeyboardEvent) => {
      const range = scrollRange();
      if (!range.overflow) return;
      const stepY = range.viewHeight * (e.key === "PageUp" || e.key === "PageDown" ? 0.8 : 0.1);
      const dy = { ArrowUp: stepY, PageUp: stepY, ArrowDown: -stepY, PageDown: -stepY }[e.key];
      if (e.key === "Home") shiftY(range.hi - controls.target.y);
      else if (e.key === "End") shiftY(range.lo - controls.target.y);
      else if (dy) shiftY(dy);
      else return;
      e.preventDefault();
    };
    track.addEventListener("pointerdown", trackDown);
    track.addEventListener("pointermove", trackMove);
    track.addEventListener("pointerup", trackUp);
    track.addEventListener("pointercancel", trackUp);
    track.addEventListener("keydown", trackKey);

    const recenterDir = new T.Vector3();
    const recenterDelta = new T.Vector3();
    /** Giữ target trong phạm vi hợp lệ và vẽ thanh theo vị trí hiện tại. */
    const updateScroll = () => {
      if (!navActive()) {
        track.hidden = true;
        return;
      }
      const range = scrollRange();
      const y = controls.target.y;
      if (!range.overflow) {
        // Vừa khung: kéo dần về giữa (không nhảy), thanh ẩn — theo CẢ HAI trục màn
        // hình. Trước chỉ kéo trục dọc; zoom theo con trỏ dời tâm sang ngang, thu
        // nhỏ lại là mô hình nằm lệch hẳn một bên. Chỉ dời vuông góc hướng nhìn:
        // khoảng cách và góc xoay giữ nguyên.
        const dir = recenterDir.copy(camera.position).sub(controls.target).normalize();
        const want = frameBox(currentBox(), dir, usableRect()).target;
        const delta = recenterDelta.copy(want).sub(controls.target);
        delta.addScaledVector(dir, -delta.dot(dir));
        if (delta.lengthSq() > 1e-8) {
          delta.multiplyScalar(0.25);
          controls.target.add(delta);
          camera.position.add(delta);
          dirty = true;
        }
        track.hidden = true;
        return;
      }
      if (y > range.hi) shiftY(range.hi - y);
      else if (y < range.lo) shiftY(range.lo - y);
      const fraction = (range.hi - controls.target.y) / (range.hi - range.lo);
      const size = Math.max(0.08, Math.min(1, range.viewHeight / range.total));
      thumb.style.height = `${size * 100}%`;
      thumb.style.top = `${fraction * (1 - size) * 100}%`;
      track.setAttribute("aria-valuenow", String(Math.round(fraction * 100)));
      track.hidden = false;
    };

    const resize = () => {
      layoutKey = "";
      lastState = null;
      // `fit()` bên dưới đặt camera về toàn thân. Đang "xem riêng" thì phải căn lại
      // cấu trúc sau đó — khoá so sánh có chứa tỉ lệ khung, nhưng lượt resize thứ
      // hai với CÙNG tỉ lệ (đo được khi tải trang) không đổi khoá, và cấu trúc bị
      // bỏ lại nhỏ xíu ở giữa khung toàn thân.
      lastIsolate = "";
      renderer.setPixelRatio(
        Math.min(devicePixelRatio, el.clientWidth < 768 || el.clientHeight < 600 ? 1.5 : 2),
      );
      camera.aspect = el.clientWidth / Math.max(1, el.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight, false);
      sizeAO();
      fit(latest.current.view);
      sized = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    /*
     * Bảng quanh mô hình đổi cỡ / ẩn hiện mà khung canvas KHÔNG đổi (danh sách
     * hệ mở ra trên điện thoại xoay ngang) → căn lại tâm vùng quan sát. Chỉ dời
     * view offset — không đụng target, khoảng cách hay góc người đọc đang xem.
     */
    const recenter = () => {
      if (!sized || latest.current.isolate || tween) return;
      const rect = usableRect();
      applyOffset(centerOffsetX(rect, frameHalfPx), rect.h / 2 - (rect.top + rect.bottom) / 2);
      dirty = true;
    };
    const panels = new ResizeObserver(recenter);
    root.querySelectorAll<HTMLElement>("[data-atlas-avoid]").forEach((node) => panels.observe(node));

    /*
     * ## Ảnh thu nhỏ của góc nhìn (2026-09-29)
     *
     * Chụp từ chính mô hình, không ảnh tĩnh: vẽ góc nhìn vào một góc của canvas
     * (scissor), chép ra canvas 2D NGAY trong cùng tác vụ (bộ đệm vẽ WebGL còn
     * nguyên tới lúc trình duyệt ghép khung), rồi vẽ đè cảnh thật lên — người
     * đọc không thấy khung nào lạ. Mỗi khung chỉ chụp một góc nhìn để không
     * giật; camera chính mượn tạm rồi trả lại (đèn gắn vào nó).
     *
     * Ảnh được đệm trong IndexedDB (`thumbnail-cache.ts`). Đổi cách vẽ dưới đây
     * thì tăng `THUMB_STYLE`, không thì người đọc cũ thấy ảnh kiểu cũ mãi.
     */
    const THUMB_W = 240;
    const THUMB_H = 300;
    const thumbQueue = ATLAS_VIEWS.filter((v) => hasCard(v) && !v.missing && viewParts(v.id)).map((v) => v.id);
    /** Khối mà ảnh của một góc nhìn vẽ tới — cùng điều kiện `inView` với `renderThumbnail`. */
    const thumbChunkSets = new Map<string, Set<number>>();
    const thumbChunks = (id: string) => {
      let set = thumbChunkSets.get(id);
      if (!set) {
        const view = viewSet(id);
        set = new Set(view ? parts.flatMap((p, i) => (inView(view, p.system, i) ? [p.chunk] : [])) : []);
        thumbChunkSets.set(id, set);
      }
      return set;
    };
    /*
     * Thứ tự chụp: thẻ đang hiện trên lưới trước (2026-10-21). Bản trước chụp
     * theo thứ tự registry — "Theo vùng" rồi lần lượt từng hệ — nên mở tab "Hệ
     * xương" phải chờ vài chục ảnh của thẻ khuất, mỗi ảnh ~150 ms, cộng thời gian
     * tải gần đủ khối vì góc nhìn theo vùng vẽ gần cả cơ thể.
     */
    const thumbOrder = () => {
      const first = (callbacks.current.thumbnailPriority ?? []).filter((id) => thumbQueue.includes(id));
      return first.length ? [...first, ...thumbQueue.filter((id) => !first.includes(id))] : thumbQueue;
    };
    /** Thẻ kế tiếp đã đủ hình học để chụp (lấy khỏi hàng đợi), hoặc undefined. */
    const nextThumbnail = () => {
      // Khung quá nhỏ thì chưa lấy khỏi hàng đợi: `renderThumbnail` sẽ bỏ qua và
      // thẻ ấy đứng "Đang dựng ảnh…" mãi (điện thoại, lúc đang đổi cỡ).
      if (!thumbCacheRead || el.clientWidth < THUMB_W || el.clientHeight < THUMB_H) return undefined;
      const id = thumbOrder().find((v) => [...thumbChunks(v)].every((c) => chunkState[c] === 2));
      if (id) thumbQueue.splice(thumbQueue.indexOf(id), 1);
      return id;
    };
    /** Khoá đệm của một góc nhìn — đổi dữ liệu, định nghĩa hay mã mảnh là khoá đổi. */
    const atlasPrint = fingerprint(
      JSON.stringify([HUMAN_ATLAS_DATA_VERSION, parts.length, atlas.chunks.map((c) => [c.url, c.gzip, c.bytes])]),
    );
    const thumbKey = (id: string) => {
      const def = viewById(id);
      return def ? `${THUMB_STYLE}:${atlasPrint}:${fingerprint(JSON.stringify([def, viewParts(id)]))}` : null;
    };
    /*
     * `?thumbs=capture`: bỏ qua ảnh chụp sẵn để chụp lại tất cả — chỉ dành cho
     * `scripts/bake-atlas-thumbnails.ts`, không thì lượt chụp lại đọc về chính
     * ảnh R2 cũ.
     */
    const recapture = new URLSearchParams(location.search).get("thumbs") === "capture";
    /** Lần đầu mở lưới: ảnh chụp sẵn trên R2, rồi ảnh đã đệm, chỉ chụp phần còn thiếu. */
    const loadThumbCache = () => {
      if (!recapture) {
        for (const id of [...thumbQueue]) {
          const url = prebakedThumbnail(id, thumbKey(id));
          if (!url) continue;
          thumbQueue.splice(thumbQueue.indexOf(id), 1);
          callbacks.current.onThumbnail?.(id, url);
        }
      }
      void (recapture ? Promise.resolve(new Map<string, string>()) : readThumbnails(thumbKey)).then((found) => {
        if (disposed) return;
        found.forEach((url, id) => {
          const at = thumbQueue.indexOf(id);
          if (at < 0) return;
          thumbQueue.splice(at, 1);
          callbacks.current.onThumbnail?.(id, url);
        });
        thumbCacheRead = true;
        pump();
      });
    };
    const thumbBox = new T.Box3();
    const renderThumbnail = (id: string) => {
      const view = viewSet(id);
      const def = viewById(id);
      const pixelRatio = renderer.getPixelRatio();
      if (!view || !def || el.clientWidth < THUMB_W || el.clientHeight < THUMB_H) return;
      // Vẽ gấp đôi rồi thu nhỏ (khi khung đủ chỗ): dây thần kinh 1–2 mm hẹp hơn một điểm
      // ảnh ở 240 px, khử răng cưa trộn nó với bối cảnh thành xám — thẻ "Thần kinh hệ hô
      // hấp" trông như lưới đen (2026-09-30). Gấp đôi giữ được màu của nét mảnh.
      const ss = el.clientWidth >= THUMB_W * 2 && el.clientHeight >= THUMB_H * 2 ? 2 : 1;
      const savedData = data.slice();
      const savedSelected = selectedData.slice();
      // Ảnh thu nhỏ có bối cảnh như khung xem: xương chậu quanh bàng quang, phổi quanh
      // cây phế quản — thẻ nói cấu trúc nằm ở ĐÂU. Bản 2026-09-30 bỏ bối cảnh vì ô cờ
      // thu nhỏ 240 px thành moiré; bối cảnh nay vẽ bằng `drawScene` (kiểu atlas),
      // không còn ô cờ.
      let hasContext = false;
      parts.forEach((p, i) => {
        data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = 0;
        data[i * 4 + 3] = inView(view, p.system, i) ? 1 : 0;
        selectedData[i * 4] = selectedData[i * 4 + 1] = selectedData[i * 4 + 2] = 0;
        const context = data[i * 4 + 3] > 0 && isContext(view, i);
        selectedData[i * 4 + 3] = context ? 255 : 0;
        hasContext ||= context;
      });
      partTexture.needsUpdate = true;
      selectionTexture.needsUpdate = true;
      thumbBox.makeEmpty();
      view.framed.forEach((i) => thumbBox.union(bounds[i]));
      clampToBand(thumbBox, id);
      const direction = viewDirection(def.direction);
      // Nhãn nằm DƯỚI vùng vẽ của thẻ (2026-09-30), không phủ lên ảnh nữa: khung
      // cấu trúc giữa thẻ, chừa lề đều trên dưới như ảnh atlas. Bản trước chừa 20%
      // đáy cho dải nhãn gradient.
      const rect = { w: THUMB_W, h: THUMB_H, left: 0, right: THUMB_W, top: THUMB_H * 0.06, bottom: THUMB_H * 0.94 };
      const frame = frameBox(thumbBox, direction, rect, THUMB_W / THUMB_H, isSystemView(def), def.camera?.thumbnailFill ?? 0.86, minDistanceFor(def));

      const savedPosition = camera.position.clone();
      const savedQuaternion = camera.quaternion.clone();
      const savedAspect = camera.aspect;
      const markersShown = markers.visible;
      markers.visible = false;
      camera.clearViewOffset();
      camera.aspect = THUMB_W / THUMB_H;
      // Tâm vùng trên nhãn lệch khỏi tâm thẻ — bù bằng view offset, như khung xem chính.
      camera.setViewOffset(THUMB_W, THUMB_H, frame.offsetX, frame.offsetY, THUMB_W, THUMB_H);
      camera.updateProjectionMatrix();
      camera.position.copy(frame.target).addScaledVector(direction, frame.distance);
      camera.lookAt(frame.target);
      camera.updateMatrixWorld(true);

      applyClip(id);
      // Độ đậm của vật liệu theo lớp bóc của KHUNG XEM (applyLayers), mà lớp bóc
      // tính theo tập hệ đang bật: đang ở "Phổi" (không hệ cơ) thì cơ coi như đã
      // bóc, opacity 0 — ảnh bìa "Cơ hít vào" chỉ còn bóng xương sườn (2026-09-30).
      // Mở một góc nhìn luôn về nguyên khối, nên ảnh bìa chụp mọi lớp đục.
      const savedLayers = materials.map((m) => [m.opacity, m.transparent, m.depthWrite, m.side] as const);
      matsBySystem.forEach((list) =>
        list.forEach((m) => {
          m.opacity = 1;
          m.transparent = false;
          m.depthWrite = true;
          if (m.side !== T.DoubleSide) {
            m.side = T.DoubleSide;
            m.needsUpdate = true;
          }
        }),
      );
      renderer.setScissorTest(true);
      renderer.setViewport(0, 0, THUMB_W * ss, THUMB_H * ss);
      renderer.setScissor(0, 0, THUMB_W * ss, THUMB_H * ss);
      renderer.clear();
      // Ảnh thu nhỏ luôn kiểu atlas, bất kể khung xem đang Xuyên thấu: ảnh chụp sẵn
      // trên R2 dùng chung cho mọi người đọc (đổi kiểu này thì tăng `THUMB_STYLE`).
      const ghostWas = ghostActive;
      ghostActive = hasContext;
      depthTarget = frame.target;
      drawScene(true, false);
      depthTarget = null;
      ghostActive = ghostWas;
      const out = document.createElement("canvas");
      out.width = THUMB_W;
      out.height = THUMB_H;
      const drawn = renderer.domElement;
      const ctx2d = out.getContext("2d");
      if (ctx2d) ctx2d.imageSmoothingQuality = "high";
      ctx2d
        ?.drawImage(
          drawn,
          0,
          drawn.height - THUMB_H * ss * pixelRatio,
          THUMB_W * ss * pixelRatio,
          THUMB_H * ss * pixelRatio,
          0,
          0,
          THUMB_W,
          THUMB_H,
        );
      renderer.setScissorTest(false);
      materials.forEach((m, i) => {
        const side = savedLayers[i][3];
        if (m.side !== side) {
          m.side = side;
          m.needsUpdate = true;
        }
        [m.opacity, m.transparent, m.depthWrite] = savedLayers[i];
      });
      applyClip(latest.current.viewId);
      renderer.setViewport(0, 0, el.clientWidth, el.clientHeight);

      camera.position.copy(savedPosition);
      camera.quaternion.copy(savedQuaternion);
      camera.aspect = savedAspect;
      applyOffset(offsetX, offsetY);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      markers.visible = markersShown;
      data.set(savedData);
      selectedData.set(savedSelected);
      partTexture.needsUpdate = true;
      selectionTexture.needsUpdate = true;
      dirty = true;
      const url = out.toDataURL("image/webp", 0.85);
      callbacks.current.onThumbnail?.(id, url);
      const key = thumbKey(id);
      if (key) void writeThumbnail(id, key, url);
    };

    // ------------------------------------------------------------ chọn mảnh
    const raycaster = new T.Raycaster();
    const pointer = new T.Vector2();
    const tap = new PointerTap();
    const worldBox = new T.Box3();
    const hitPoint = new T.Vector3();
    const canvas = renderer.domElement;

    /** Mảnh bấm được: đang hiện và lớp của nó đủ đậm (lớp mờ để bấm xuyên qua). */
    // Bóng mờ quanh vùng chọn không bấm được: chạm vào đốt sống nằm sau lớp cơ mờ
    // phải trúng đốt sống, không trúng lớp cơ người đọc chỉ dùng để định vị.
    const pickable = (i: number) =>
      data[i * 4 + 3] > 0.5 && alphaOf(i) >= 0.5 && (!surroundOn || selectedData[i * 4] > 0);

    /** Mảnh gần nhất dưới một điểm màn hình, hoặc -1. Lọc bằng hộp bao trước khi xét tam giác. */
    const pickAt = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      let nearest = Infinity;
      let found = -1;
      pickers.forEach((mesh, i) => {
        if (!mesh || !pickable(i)) return;
        worldBox.copy(bounds[i]).translate(mesh.position);
        if (!raycaster.ray.intersectBox(worldBox, hitPoint)) return;
        // Hộp bao đã xa hơn mảnh trúng gần nhất thì khỏi xét tam giác.
        if (raycaster.ray.origin.distanceTo(hitPoint) > nearest) return;
        const hits = raycaster.intersectObject(mesh, false);
        // Đang cắt: bỏ các điểm trúng nằm ở nửa đã bị cắt đi (raycast không biết clipping).
        const cut = clipList.length > 0 && !(contextUncut && isContext(viewSet(latest.current.viewId), i));
        const cap = capPickers.get(i);
        if (cap && !cap.position.equals(mesh.position)) {
          // Nắp dời theo mảnh khi tách lớp (shader cộng cùng độ dời theo partIndex).
          cap.position.copy(mesh.position);
          cap.updateMatrixWorld(true);
        }
        const capHit = cap ? raycaster.intersectObject(cap, false)[0] : undefined;
        const bodyHit = cut ? hits.find((h) => clipList.every((p) => p.distanceToPoint(h.point) >= 0)) : hits[0];
        const hit = capHit && (!bodyHit || capHit.distance < bodyHit.distance) ? capHit : bodyHit;
        if (hit && hit.distance < nearest) {
          nearest = hit.distance;
          found = i;
        }
      });
      return found;
    };

    /*
     * ## Rê chuột ở nguyên khối (2026-09-29)
     *
     * Trước đây chỉ chế độ tách mới có phản hồi khi rê chuột; nguyên khối thì
     * mô hình "chết" cho tới lúc bấm. Nay mảnh dưới con trỏ sáng viền nhẹ và
     * hiện tên. pointermove chỉ ghi toạ độ; raycast chạy TỐI ĐA một lần mỗi
     * khung trong vòng vẽ — di chuột nhanh không nhân số lần raycast. Không
     * chạy khi đang kéo, với cảm ứng, hay trước khi tải xong.
     */
    let hoverQueued: { x: number; y: number } | null = null;
    let hovered = -1;
    const setHovered = (index: number) => {
      if (index === hovered) return;
      if (hovered >= 0) selectedData[hovered * 4 + 2] = 0;
      if (index >= 0) selectedData[index * 4 + 2] = 255;
      hovered = index;
      selectionTexture.needsUpdate = true;
      dirty = true;
    };
    const leave = () => {
      hoverQueued = null;
      setHovered(-1);
      hover.hidden = true;
    };

    const down = (e: PointerEvent) => {
      hover.hidden = true;
      setHovered(-1);
      tap.down(e.pointerId, e.clientX, e.clientY, e.pointerType === "touch" ? 12 : 5);
    };
    const move = (e: PointerEvent) => {
      tap.move(e.pointerId, e.clientX, e.clientY);
      if (e.buttons || e.pointerType === "touch") {
        leave();
        return;
      }
      if (amount < 0.5) {
        hoverQueued = { x: e.clientX, y: e.clientY };
        return;
      }
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const index = findTarget(x, y, 12);
      hover.hidden = index < 0;
      canvas.style.cursor = index < 0 ? "grab" : "pointer";
      if (index >= 0) {
        hover.textContent = callbacks.current.labelFor(index);
        hover.style.left = `${Math.max(8, Math.min(x + 14, el.clientWidth - 260))}px`;
        hover.style.top = `${Math.max(8, Math.min(y + 18, el.clientHeight - 55))}px`;
      }
    };
    const cancel = (e: PointerEvent) => tap.cancel(e.pointerId);
    const up = (e: PointerEvent) => {
      const validTap = tap.up(e.pointerId, e.clientX, e.clientY);
      if (!validTap || !interactive) return;
      const rect = canvas.getBoundingClientRect();
      let found = pickAt(e.clientX, e.clientY);
      if (found < 0 && amount > 0.45) {
        found = findTarget(
          e.clientX - rect.left,
          e.clientY - rect.top,
          e.pointerType === "touch" ? 24 : 16,
        );
      }
      if (found >= 0) {
        hover.hidden = true;
        callbacks.current.onSelect(parts[found].id);
      }
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", cancel);
    canvas.addEventListener("pointerleave", leave);

    // ------------------------------------------------------------ vòng vẽ
    const clock = new T.Clock();
    let lastZoomSteps = 0;
    let lastFitFrame = 0;
    let lastViewId: string | null = null;
    /** true từ lúc vào góc nhìn tới lúc người đọc tự đổi hướng. */
    let viewHeading = false;
    let lastExtent = -1;
    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const s = latest.current;

      const changed =
        lastState?.visible !== s.visible ||
        lastState?.selected !== s.selected ||
        lastState?.isolate !== s.isolate ||
        lastState?.surround !== s.surround ||
        lastState?.look !== s.look ||
        lastState?.viewId !== s.viewId ||
        lastState?.hiddenIn !== s.hiddenIn;
      // Bật/tắt lớp da hay cơ đổi thang slider (`effectivePeel`) — tính lại độ tách.
      if (changed) amount = peelToExplode(effectivePeel(peel, s.visible));
      const moving = Math.abs(peel - s.explode) > 0.0001;
      if (moving) {
        peel = T.MathUtils.damp(peel, s.explode, 8, dt);
        amount = peelToExplode(effectivePeel(peel, s.visible));
        dirty = true;
      }

      if (changed || moving || lastExtent < 0) {
        // Lưới xếp lại (bật/tắt hệ lúc đang tách) thì khung lại — SAU khi mảnh đã
        // dời tới ô mới, vì `fit()` đo hộp bao theo vị trí hiện tại của mảnh.
        let refit = false;
        xray = s.look === "xray";
        semi = s.look === "semi";
        applyLayers(s.selected);
        const visible = new Set(s.visible);
        const selection = new Set(s.selected);
        surroundOn = !!s.surround && !s.isolate && selection.size > 0;
        const view = viewSet(s.viewId);
        userHidden =
          view && s.viewId && s.hiddenIn?.viewId === s.viewId
            ? new Set(s.hiddenIn.parts.map((id) => partIndexById.get(id)).filter((i): i is number => i !== undefined))
            : new Set();
        // Góc nhìn: mọi hệ trừ da, trừ những mảnh góc nhìn ẩn thêm (`views.ts`).
        const inScope = (p: (typeof parts)[number], i: number) =>
          view ? inView(view, p.system, i) : visible.has(p.system);
        // Da còn đục hoàn toàn thì lớp trong không thấy được — trừ những chỗ mạch
        // và cơ nông của BodyParts3D lòi qua da vài mm (vệt đỏ/xanh ở cổ, cẳng
        // chân). Không vẽ chúng lúc ấy: hết vệt, và bớt ~2 triệu tam giác. Mắt
        // (giác quan) giữ lại vì nằm sau khe mi hở. Kéo slider hay chọn cấu trúc
        // sâu là da mờ đi, lớp trong hiện lại.
        const skinSolid =
          !s.isolate && !view && visible.has("integumentary") && (alphaBySystem.get("integumentary") ?? 0) >= 0.999;
        // Qua khe mi chỉ thấy lòng trắng + mống mắt; giác mạc, thể thuỷ tinh… che
        // mất chúng. Tai ngoài nằm NGOÀI da nên luôn vẽ.
        const underSkin = (p: (typeof parts)[number]) =>
          skinSolid && p.system !== "integumentary" && !SKIN_VISIBLE.has(keyOf(p));
        // Lớp đã mờ hẳn (da sau 20%) không chiếm ô trong lưới tách.
        // Quanh vùng chọn không vẽ da: một lớp vỏ mờ phủ cả người làm nhoè mọi thứ
        // bên trong, như atlas tham chiếu (cơ, xương, mạch, thần kinh mờ — không da).
        const isShown = (p: (typeof parts)[number], i: number) =>
          !userHidden.has(i) &&
          !(surroundOn && p.system === "integumentary" && !selection.has(p.id)) &&
          (s.isolate ? selection.has(p.id) : inScope(p, i) || selection.has(p.id)) &&
          (s.isolate || selection.has(p.id) || (alphaOf(i) > 0.01 && !underSkin(p)));
        const visibleParts = parts.filter(isShown);
        // Thứ đáng lẽ đang thấy mà chưa có hình học → tải ngay (xem "Chỉ tải khối…").
        demand(visibleParts.map((p) => p.chunk));
        const nextLayoutKey =
          visibleParts.map((p) => p.id).join(",") + ":" + camera.aspect.toFixed(3);
        if (nextLayoutKey !== layoutKey) {
          const layout = createExplosionLayout(visibleParts, camera.aspect);
          parts.forEach((p, i) => {
            const cell = layout.cells.get(p.id);
            offsets[i] = cell ? new T.Vector3(cell.x, cell.y + 0.85, 0) : centers[i].clone();
          });
          layoutKey = nextLayoutKey;
          refit = amount > 0.05 && !s.isolate;
        }

        let ghostNext = false;
        parts.forEach((p, i) => {
          const c = centers[i];
          const destination = offsets[i];
          const angle = (systemIndex[i] / SYSTEM_IDS.length) * Math.PI * 2;
          let dx: number;
          let dy: number;
          let dz: number;
          if (amount <= 0.45) {
            const t = amount / 0.45;
            dx = Math.sin(angle) * t * 0.48;
            dy = (c.y - 0.85) * t * 0.28;
            dz = Math.cos(angle) * t * 0.48;
          } else {
            const t = (amount - 0.45) / 0.55;
            dx = T.MathUtils.lerp(Math.sin(angle) * 0.48, destination.x - c.x, t);
            dy = T.MathUtils.lerp((c.y - 0.85) * 0.28, destination.y - c.y, t);
            dz = T.MathUtils.lerp(Math.cos(angle) * 0.48, -c.z, t);
          }
          const selected = selection.has(p.id);
          const shown = isShown(p, i);
          data[i * 4] = dx;
          data[i * 4 + 1] = dy;
          data[i * 4 + 2] = dz;
          data[i * 4 + 3] = shown ? 1 : 0;
          const context = surroundOn ? !selected : isContext(view, i);
          if (context && shown) ghostNext = true;
          selectedData[i * 4] = selected ? 255 : 0;
          // Bối cảnh trong suốt (Xuyên thấu) không đổ bóng AO — AO tô tối cả mảng mờ.
          // Kiểu atlas vẽ nó đặc, nên có AO như mọi mô khác.
          selectedData[i * 4 + 1] = alphaOf(i) < 0.999 || (context && xray) ? 255 : 0;
          selectedData[i * 4 + 3] = context ? 255 : 0;
          if (shown) {
            markerPositions[i * 3] = c.x + dx;
            markerPositions[i * 3 + 1] = c.y + dy;
            markerPositions[i * 3 + 2] = c.z + dz;
          } else {
            markerPositions.fill(10000, i * 3, i * 3 + 3);
          }
          const mesh = pickers[i];
          if (mesh) {
            mesh.position.set(dx, dy, dz);
            mesh.updateMatrix();
            mesh.updateMatrixWorld(true);
          }
        });
        if (refit) fit(s.view);
        ghostActive = ghostNext;
        ghostFade.value = surroundOn ? SURROUND_FADE : 1;
        partTexture.needsUpdate = true;
        selectionTexture.needsUpdate = true;
        markerGeometry.attributes.position.needsUpdate = true;
        lastState = s;
        lastExtent = amount;
        dirty = true;
      }

      if (s.view !== lastView || s.reset !== lastReset) {
        // Trong góc nhìn, `reset` chỉ tăng khi người đọc bấm một nút hướng (kể cả
        // nút đang sáng) — "Đặt lại" và thẻ hệ đều rời góc nhìn trước. Bấm là trả
        // quyền chọn hướng cho người đọc.
        if (lastView !== "" && (s.view !== lastView || (s.viewId && s.reset !== lastReset))) viewHeading = false;
        // Lượt đầu (chưa có góc nhìn nào) đặt thẳng; về sau thì chuyển mượt.
        fit(s.view, sized && lastView !== "");
        lastView = s.view;
        lastReset = s.reset;
        lastVisibleKey = s.visible.join(",");
      }
      // Đổi góc nhìn → bay tới nó. Tập hệ đổi cùng lượt, nên đồng bộ khoá để khối
      // dưới không khung lại lần hai theo hướng cũ.
      if ((s.viewId ?? null) !== lastViewId || capsRefit) {
        capsRefit = false;
        applyClip(s.viewId);
        lastViewId = s.viewId ?? null;
        viewHeading = !!s.viewId;
        lastVisibleKey = s.visible.join(",");
        if (!s.isolate) fit(s.view, sized, false, VIEW_TWEEN_MS);
      }
      // Tập hệ đang bật đổi (chọn một hệ, bật/tắt, "Tất cả") → khung lại theo hộp
      // bao mới, giữ góc xoay hiện tại. Chỉ ở nguyên khối, ngoài "xem riêng".
      // Không khung lại khi chỉ chọn một mảnh hay mở bảng chi tiết: đó là lúc
      // người đọc vừa tự zoom tới chỗ mình muốn.
      const visibleKey = s.visible.join(",");
      if (visibleKey !== lastVisibleKey) {
        lastVisibleKey = visibleKey;
        if (sized && !s.isolate && amount < 0.05 && s.visible.length > 0) {
          fit(s.view, true, true);
        }
      }
      runTween(performance.now());
      if (moving && !s.isolate) fit(amount > 0.5 ? "front" : s.view);

      if (sized && s.focus !== lastFocus) {
        lastFocus = s.focus;
        if (!s.isolate && amount < 0.05) focusSelection(s.selected);
      }

      // Xem riêng và "giải phẫu xung quanh" khung cùng một vùng chọn; xung quanh thì
      // nới hộp ra (`SURROUND_MIN_SIZE`) để thấy vùng chọn nằm ở đâu trên cơ thể.
      const framed = s.isolate || surroundOn;
      const isolateKey = framed
        ? `${s.selected.join(",")}:${s.reset}:${s.inspectorOpen}:${camera.aspect}:${surroundOn}`
        : "";
      if (isolateKey !== lastIsolate || (s.isolate && moving)) {
        if (framed) {
          const box = new T.Box3();
          parts.forEach((p, i) => {
            if (s.selected.includes(p.id)) {
              box.union(
                bounds[i]
                  .clone()
                  .translate(new T.Vector3(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])),
              );
            }
          });
          if (!box.isEmpty()) {
            const center = box.getCenter(new T.Vector3());
            const size = box.getSize(new T.Vector3());
            if (surroundOn) size.max(new T.Vector3(SURROUND_MIN_SIZE, SURROUND_MIN_SIZE, 0));
            const w = el.clientWidth;
            const h = el.clientHeight;
            const mobile = w < 768;
            const landscape = w > h && h <= 600;
            // Cùng vùng trống với khung toàn thân (đã trừ tiêu đề, danh sách hệ,
            // cột camera, thanh dưới), rồi trừ thêm bảng chi tiết. Bản cũ viết
            // cứng `left = 25` cho màn ≤ 1100 px, nên ở 1024 px cấu trúc "xem
            // riêng" nằm ngay sau danh sách hệ.
            const rect = usableRect();
            const top = rect.top;
            let { left, right, bottom } = rect;
            if (s.inspectorOpen) {
              const hostRect = el.getBoundingClientRect();
              const sheet = root.querySelector("[data-atlas-sheet]")?.getBoundingClientRect();
              if (mobile && !landscape) {
                bottom = Math.min(bottom, (sheet ? sheet.top - hostRect.top : h * 0.55) - 16);
              } else {
                right = Math.min(right, (sheet ? sheet.left - hostRect.left : w - 370) - 16);
              }
              // Hai bảng kẹp quá chặt (màn hẹp): bỏ né danh sách hệ, giữ né bảng chi tiết.
              if (right - left < 200) left = 16;
            }
            const availableWidth = Math.max(150, right - left);
            const availableHeight = Math.max(40, bottom - top);
            const distance = Math.max(
              0.07,
              (Math.max(
                (size.y * h) / availableHeight,
                (size.x * w) / availableWidth / camera.aspect,
                size.z,
              ) /
                fovTan()) *
                1.35,
            );
            controls.maxDistance = Math.max(40, distance * 2);
            place(
              center,
              new T.Vector3(0.2, 0.1, 1).normalize(),
              distance,
              [w / 2 - (left + right) / 2, h / 2 - (top + bottom) / 2],
              sized && !moving,
            );
          }
        } else if (lastIsolate) {
          fit(s.view, true);
        }
        lastIsolate = isolateKey;
      }

      // Rê chuột: một raycast mỗi khung, chỉ khi con trỏ vừa đổi chỗ.
      if (hoverQueued && interactive && amount < 0.5) {
        const { x, y } = hoverQueued;
        hoverQueued = null;
        const index = pickAt(x, y);
        setHovered(index);
        canvas.style.cursor = index < 0 ? "grab" : "pointer";
        const rect = el.getBoundingClientRect();
        hover.hidden = index < 0;
        if (index >= 0) {
          hover.textContent = callbacks.current.labelFor(index);
          hover.style.left = `${Math.max(8, Math.min(x - rect.left + 14, el.clientWidth - 260))}px`;
          hover.style.top = `${Math.max(8, Math.min(y - rect.top + 18, el.clientHeight - 55))}px`;
        }
      } else if (amount >= 0.5 && hovered >= 0) {
        setHovered(-1);
      }

      // Nút phóng to / thu nhỏ / vừa khung: bộ đếm như `reset`, chuyển mượt.
      const zoomSteps = (s.zoomIn ?? 0) - (s.zoomOut ?? 0);
      if (zoomSteps !== lastZoomSteps) {
        const factor = zoomSteps > lastZoomSteps ? 0.78 : 1 / 0.78;
        lastZoomSteps = zoomSteps;
        const direction = camera.position.clone().sub(controls.target).normalize();
        const distance = T.MathUtils.clamp(
          camera.position.distanceTo(controls.target) * factor,
          controls.minDistance,
          controls.maxDistance,
        );
        place(controls.target.clone(), direction, distance, [offsetX, offsetY], true);
      }
      if ((s.fitFrame ?? 0) !== lastFitFrame) {
        lastFitFrame = s.fitFrame ?? 0;
        fit(s.view, true, true);
      }

      controls.enableRotate = amount < 0.8;
      controls.mouseButtons.LEFT = amount < 0.8 ? T.MOUSE.ROTATE : T.MOUSE.PAN;
      controls.touches.ONE = amount < 0.8 ? T.TOUCH.ROTATE : T.TOUCH.PAN;
      markers.visible = amount > 0.75;
      controls.autoRotate = s.rotate && !s.isolate && amount < 0.4;
      controls.autoRotateSpeed = 0.65;
      controls.update();
      if (controls.autoRotate) dirty = true;
      // Lưới góc nhìn mở lần đầu → tải nốt khối cho ảnh thu nhỏ, sau khối đang cần.
      if (!galleryWanted && callbacks.current.onThumbnail) {
        galleryWanted = true;
        loadThumbCache();
      }
      // Một ảnh thu nhỏ mỗi khung, khi khối của thẻ ấy đã về và camera đứng yên.
      const nextThumb = sized && !tween && callbacks.current.onThumbnail ? nextThumbnail() : undefined;
      if (nextThumb) renderThumbnail(nextThumb);
      if (dirty) updateScroll();

      const now = performance.now();
      if (dirty) {
        lastChange = now;
        aoFresh = false;
      } else if (aoPass && !(ghostActive && xray) && !aoFresh && !tween && now - lastChange > 140) {
        // Đứng yên đủ lâu: một khung có AO thay cho khung thường.
        drawWithAO();
        // GTAOPass khôi phục clear color qua get/set — giữ chắc alpha 0.
        renderer.setClearColor(0x000000, 0);
        aoFresh = true;
      }
      if (dirty) {
        // Đang thay đổi (xoay, zoom, tách lớp) → vẽ thường, không AO.
        drawScene();
        targets = [];
        if (amount > 0.45) {
          const cw = el.clientWidth;
          const ch = el.clientHeight;
          parts.forEach((p, i) => {
            if (!pickable(i)) return;
            let left = Infinity;
            let right = -Infinity;
            let top = Infinity;
            let bottom = -Infinity;
            for (let corner = 0; corner < 8; corner++) {
              projected
                .set(
                  p.bounds[corner & 1 ? 1 : 0][0] + data[i * 4],
                  p.bounds[corner & 2 ? 1 : 0][1] + data[i * 4 + 1],
                  p.bounds[corner & 4 ? 1 : 0][2] + data[i * 4 + 2],
                )
                .project(camera);
              const x = ((projected.x + 1) * cw) / 2;
              const y = ((1 - projected.y) * ch) / 2;
              left = Math.min(left, x);
              right = Math.max(right, x);
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
            projected
              .copy(centers[i])
              .add(new T.Vector3(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]))
              .project(camera);
            if (projected.z < -1 || projected.z > 1) return;
            targets.push({
              index: i,
              x: ((projected.x + 1) * cw) / 2,
              y: ((1 - projected.y) * ch) / 2,
              left,
              right,
              top,
              bottom,
            });
          });
        }
        dirty = false;
      }
    };
    animate();

    const contextLost = (e: Event) => {
      e.preventDefault();
      callbacks.current.onError("context-lost");
    };
    canvas.addEventListener("webglcontextlost", contextLost);

    return () => {
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      panels.disconnect();
      controls.dispose();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("webglcontextlost", contextLost);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      scene.traverse((o) => {
        if (o instanceof T.Mesh && !geometries.includes(o.geometry)) {
          o.geometry.dispose();
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m: T.Material) => m.dispose());
        }
      });
      env.dispose();
      aoPass?.dispose();
      aoQuad?.dispose();
      partTexture.dispose();
      selectionTexture.dispose();
      tintTexture.dispose();
      axisTexture.dispose();
      markerGeometry.dispose();
      markerMaterial.dispose();
      hover.remove();
      track.remove();
      renderer.dispose();
      canvas.remove();
      themeRef.current = () => {};
    };
    // `dark`, `ariaLabel` chỉ đọc lần đầu; đổi theme đi qua `themeRef`, không dựng lại cảnh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atlas]);

  return <div ref={host} className="absolute inset-0" />;
}
