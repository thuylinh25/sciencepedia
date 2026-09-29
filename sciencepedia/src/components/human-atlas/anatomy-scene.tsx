"use client";

// Client: WebGL, ResizeObserver và pointer event chỉ có ở trình duyệt.
// Module này chỉ được nạp qua `dynamic(..., { ssr: false })` trong
// `human-atlas.tsx`, nên three.js không lọt vào bundle của trang nào khác.

import { useEffect, useRef } from "react";
import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import partGroups from "@/lib/human-atlas/part-groups.generated.json";
import {
  GROUP_COLORS,
  LAYERS,
  SYSTEM_COLORS,
  SYSTEM_IDS,
  SYSTEM_LAYER,
  layerOpacity,
  peelToExplode,
  type Atlas,
  type SceneState,
  type SystemId,
} from "@/lib/human-atlas/anatomy";
import { atlasDataUrl } from "@/lib/human-atlas/assets";
import { createExplosionLayout } from "@/lib/human-atlas/explosion-layout";
import { decodeModelResponse } from "@/lib/human-atlas/model-download";
import { PointerTap } from "@/lib/human-atlas/pointer-tap";

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
};

/**
 * Nền. Tối là gần đen (#05070a) chứ không navy #131b29 như bản gốc: giải phẫu
 * là thứ duy nhất trong khung, nền không được có màu riêng. Khớp với nền của
 * khung trong `human-atlas.tsx` để không loé khi canvas chưa vẽ.
 */
export const SCENE_BACKGROUND = { light: "#eef0f1", dark: "#05070a" } as const;

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
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(state);
  const callbacks = useRef({ onSelect, onProgress, onError, labelFor });
  const themeRef = useRef<(dark: boolean) => void>(() => {});
  latest.current = state;
  callbacks.current = { onSelect, onProgress, onError, labelFor };

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
    let ready = false;
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
        // Canvas trong suốt, nền do khung DOM (`human-atlas.tsx`) tô. Lý do: đường
        // vẽ có AO (EffectComposer) xoá render target bằng giá trị sRGB rồi
        // OutputPass áp ACES + sRGB LẦN NỮA lên nó — #05070a thành navy
        // (20,29,39) chỉ ở những khung có AO. Không vẽ nền thì không lệch được.
        alpha: true,
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
    controls.minDistance = 0.07;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI * 0.96;
    // Zoom về phía con trỏ: điểm giải phẫu đang nhìn đứng yên khi phóng to,
    // thay vì cơ thể trượt ra khỏi khung quanh tâm cố định.
    controls.zoomToCursor = true;
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
    scene.environmentIntensity = 0.28;
    room.dispose();
    pmrem.dispose();

    const hemisphere = new T.HemisphereLight(0xf2eee6, 0x14161a, 0.32);
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
    let packingWidth = 1;
    let packingHeight = 1;

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

    const materialFor = (system: SystemId, color: string) => {
      const m = new T.MeshStandardMaterial({
        color,
        metalness: 0,
        // Xương mờ như xương thật; da mờ nhất (không bóng như sáp); mô mềm ẩm hơn.
        roughness: system === "skeletal" ? 0.74 : system === "integumentary" ? 0.68 : 0.6,
        side: T.DoubleSide,
        // Độ đậm do `applyLayers()` đặt theo slider — bắt đầu đục.
        transparent: false,
        opacity: 1,
      });
      m.onBeforeCompile = (shader) => {
        shader.uniforms.partState = { value: partTexture };
        shader.uniforms.selectionState = { value: selectionTexture };
        shader.uniforms.stateWidth = { value: width };
        shader.vertexShader =
          "attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth; varying float partVisible; varying float partSelected; varying float partHovered;\n" +
          shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); transformed += state.xyz; partVisible = state.w; vec4 pick = texture2D(selectionState, stateUv); partSelected = pick.r; partHovered = pick.b;",
        );
        shader.fragmentShader =
          "varying float partVisible; varying float partSelected; varying float partHovered;\n" + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <clipping_planes_fragment>",
          "#include <clipping_planes_fragment>\nif (partVisible < 0.5) discard;",
        );
        /*
         * Mảnh đang chọn GIỮ màu và bề mặt của nó: chỉ ám cyan 12%, cộng viền
         * sáng cyan ở rìa (fresnel) và phát sáng rất khẽ. Bản gốc trộn 75% sang
         * xanh ngọc — mảnh chọn thành một khối neon, mất luôn hình khối.
         */
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <color_fragment>",
          "#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.45, 0.82, 0.95), partSelected * 0.12);",
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <emissivemap_fragment>",
          "#include <emissivemap_fragment>\nfloat selectRim = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.5);\ntotalEmissiveRadiance += vec3(0.30, 0.72, 1.0) * partSelected * (0.06 + 0.55 * selectRim);\n// Rê chuột: viền sáng trắng ngà, yếu hơn viền chọn — gợi ý bấm được, không giành vai chọn.\ntotalEmissiveRadiance += vec3(0.95, 0.92, 0.85) * partHovered * (1.0 - partSelected) * (0.03 + 0.3 * selectRim);",
        );
      };
      materials.push(m);
      return m;
    };
    /*
     * Một vật liệu mỗi NHÓM cơ quan (gan, tuỵ, não, dây thần kinh… —
     * `part-groups.generated.json`), còn lại một vật liệu mỗi hệ. Mảnh cùng nhóm
     * vẫn gộp chung một lượt vẽ; bảng nhóm tra một lần lúc dựng, không mỗi khung.
     */
    const groupOf = partGroups as Record<string, string>;
    const keyOf = (p: (typeof parts)[number]) => groupOf[p.id] ?? p.system;
    const mats = new Map<string, T.MeshStandardMaterial>();
    const matsBySystem = new Map<SystemId, T.MeshStandardMaterial[]>();
    const materialForKey = (key: string, system: SystemId) => {
      let m = mats.get(key);
      if (!m) {
        m = materialFor(system, GROUP_COLORS[key] ?? SYSTEM_COLORS[system] ?? "#aebbb8");
        mats.set(key, m);
        matsBySystem.set(system, [...(matsBySystem.get(system) ?? []), m]);
      }
      return m;
    };
    parts.forEach((p) => materialForKey(keyOf(p), p.system));
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
     * ngoài nó mờ xuống 18%, để lớp ngoài không che mất thứ người đọc vừa chọn.
     *
     * Kênh G của texture chọn = mảnh thuộc lớp đang mờ: pass AO bỏ qua nó
     * (lớp trong suốt mà đổ bóng AO là tối sầm cả cơ thể).
     */
    const DIMMED = 0.18;
    const alphaBySystem = new Map<SystemId, number>(SYSTEM_IDS.map((id) => [id, 1]));
    const layerIndex = (system: SystemId) => LAYERS.indexOf(SYSTEM_LAYER[system]);
    const partIndexById = new Map(parts.map((p, i) => [p.id, i]));
    const applyLayers = (selected: string[]) => {
      let deepest = -1;
      for (const id of selected) {
        const i = partIndexById.get(id);
        if (i !== undefined) deepest = Math.max(deepest, layerIndex(parts[i].system));
      }
      for (const system of SYSTEM_IDS) {
        let alpha = layerOpacity(SYSTEM_LAYER[system], peel);
        if (layerIndex(system) < deepest) alpha = Math.min(alpha, DIMMED);
        alphaBySystem.set(system, alpha);
        const solid = alpha > 0.999;
        for (const m of matsBySystem.get(system) ?? []) {
          m.opacity = solid ? 1 : alpha;
          m.transparent = !solid;
          m.depthWrite = solid;
        }
      }
    };
    const alphaOf = (i: number) => alphaBySystem.get(parts[i].system) ?? 1;

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
     */
    const wantsAO =
      matchMedia("(pointer: fine)").matches &&
      el.clientWidth >= 900 &&
      (navigator.hardwareConcurrency ?? 4) >= 4;
    let composer: EffectComposer | null = null;
    let aoPass: GTAOPass | null = null;
    if (wantsAO) {
      try {
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        aoPass = new GTAOPass(scene, camera, el.clientWidth, el.clientHeight);
        aoPass.updateGtaoMaterial({ radius: 0.06, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: 12 });
        aoPass.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
        aoPass.blendIntensity = 0.85;
        aoPass.normalMaterial.onBeforeCompile = (shader) => {
          shader.uniforms.partState = { value: partTexture };
          shader.uniforms.selectionState = { value: selectionTexture };
          shader.uniforms.stateWidth = { value: width };
          shader.vertexShader =
            "attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth; varying float partVisible;\n" +
            shader.vertexShader.replace(
              "#include <begin_vertex>",
              "#include <begin_vertex>\nvec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); transformed += state.xyz; partVisible = state.w * (1.0 - texture2D(selectionState, stateUv).g);",
            );
          shader.fragmentShader =
            "varying float partVisible;\n" +
            shader.fragmentShader.replace(
              "#include <clipping_planes_fragment>",
              "#include <clipping_planes_fragment>\nif (partVisible < 0.5) discard;",
            );
        };
        composer.addPass(aoPass);
        composer.addPass(new OutputPass());
      } catch (error) {
        console.warn("[human-atlas] AO tắt:", error);
        composer?.dispose();
        composer = null;
        aoPass = null;
      }
    }
    let lastChange = performance.now();
    let aoFresh = false;

    // ------------------------------------------------------ tải hình học
    let loaded = 0;
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
        // Ngoài cùng vẽ cuối: lớp mờ phải vẽ sau những gì nó phủ lên.
        mesh.renderOrder = LAYERS.length - LAYERS.indexOf(SYSTEM_LAYER[system]);
        scene.add(mesh);
      });
      lastState = null;
      loaded += 1;
      callbacks.current.onProgress(Math.round((loaded / atlas.chunks.length) * 100));
      dirty = true;
    };

    void (async () => {
      try {
        let cursor = 0;
        await Promise.all(
          Array.from({ length: PARALLEL_CHUNKS }, async () => {
            while (cursor < atlas.chunks.length) {
              const i = cursor++;
              await loadChunk(i);
            }
          }),
        );
        if (!disposed) {
          ready = true;
          dirty = true;
        }
      } catch (error) {
        if (!disposed && !(error instanceof DOMException && error.name === "AbortError")) {
          console.error("[human-atlas] tải hình học thất bại:", error);
          callbacks.current.onError("download");
        }
      }
    })();

    // ------------------------------------------------------------ camera
    const fovTan = () => 2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2));

    const viewDirection = (view: string) =>
      view === "front"
        ? new T.Vector3(0, 0.02, 1).normalize()
        : view === "back"
          ? new T.Vector3(0, 0.02, -1).normalize()
          : view === "side"
            ? new T.Vector3(1, 0.02, 0).normalize()
            : new T.Vector3(0.35, 0.06, 1).normalize();

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
    const visibleBox = () => {
      const on = new Set(latest.current.visible);
      const box = new T.Box3();
      const displaced = amount > 0.001;
      parts.forEach((p, i) => {
        if (!on.has(p.system)) return;
        if (!displaced) box.union(bounds[i]);
        else box.union(shifted.copy(bounds[i]).translate(new T.Vector3(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])));
      });
      if (box.isEmpty()) bounds.forEach((b) => box.union(b));
      return box;
    };

    /**
     * Hộp bao chiếm bao nhiêu chiều cao VÙNG QUAN SÁT: 70% desktop, 67% tablet,
     * 64% điện thoại. Vùng quan sát đã trừ thanh "Tách các lớp" và bảng dọc hai
     * bên; mẩu ở góc không tính (xem `usableRect`). Bản cũ tính 72% nhưng trừ
     * cả tiêu đề góc trái như một dải ngang — bộ xương ra ~50% màn hình.
     */
    const frameFill = (w: number) => (w < 768 ? 0.64 : w < 1024 ? 0.67 : 0.7);
    const corner = new T.Vector3();

    /**
     * Đặt `box` vào giữa vùng trống, nhìn theo `direction`. Chiếu 8 góc hộp lên
     * hai trục màn hình của camera để lấy bề rộng/cao THẬT theo góc nhìn (hộp
     * nhìn nghiêng rộng hơn nhìn thẳng), rồi giải khoảng cách từ FOV dọc và tỉ
     * lệ khung. Tâm vùng trống lệch khỏi tâm canvas thì bù bằng view offset
     * của camera — xoay vẫn quanh cấu trúc, không quanh tâm canvas.
     */
    const frameBox = (box: T.Box3, direction: T.Vector3, rect: ReturnType<typeof usableRect>) => {
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
      const fill = frameFill(rect.w);
      const fillY = ((rect.bottom - rect.top) * fill) / rect.h;
      const fillX = ((rect.right - rect.left) * fill) / rect.w;
      // Tính tới MẶT GẦN của hộp (+ nearest): mặt ấy hiện to nhất trên màn.
      const distance =
        Math.max(
          (maxU - minU) / 2 / (tanHalf * fillY),
          (maxR - minR) / 2 / (tanHalf * camera.aspect * fillX),
          0.12,
        ) + Math.max(0, nearest);
      return {
        target,
        distance,
        offsetX: rect.w / 2 - (rect.left + rect.right) / 2,
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
    const identity = new T.Quaternion();
    const step = new T.Quaternion();

    const place = (
      target: T.Vector3,
      direction: T.Vector3,
      distance: number,
      offset: [number, number],
      animate: boolean,
    ) => {
      if (!animate) {
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
      const raw = Math.min(1, (now - tween.start) / TWEEN_MS);
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
     * Khung cho trạng thái hiện tại. Nguyên khối (`extent` 0): vừa hộp bao các
     * hệ đang bật trong vùng trống. Tách hẳn (`extent` 1): khoảng cách của lưới
     * xếp mảnh như bản gốc. Ở giữa thì nội suy — thanh "Tách các lớp" kéo tới
     * đâu camera lùi tới đó, không nhảy.
     *
     * KHÔNG dùng khoảng cách cố định: bản cũ đặt 4 m cho mọi tập hệ, nên chỉ
     * bật hệ tiêu hoá (cao ~0,6 m) thì mô hình còn bằng một phần ba khung.
     *
     * `keepDirection`: giữ góc người đọc đang xoay tới (khi bật/tắt hệ), chỉ
     * đổi tâm và khoảng cách. Nút góc nhìn và "Đặt lại" thì về hướng chuẩn.
     */
    const fit = (view: string, extent = 0, animate = false, keepDirection = false) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === 0 || h === 0) return;
      const mobile = w < 768;
      if (extent > 0.8) view = "front";
      const direction =
        keepDirection && extent < 0.05
          ? camera.position.clone().sub(controls.target).normalize()
          : viewDirection(view);
      const frame = frameBox(visibleBox(), direction, usableRect());

      const reservedHeight = mobile ? 350 : 270;
      const availableAspect = Math.max(
        0.35,
        (w - (mobile ? 40 : 340)) / Math.max(160, h - reservedHeight),
      );
      const atlasDistance =
        (Math.max(packingHeight, packingWidth / availableAspect) / fovTan()) *
        (h / Math.max(160, h - reservedHeight)) *
        1.08;
      const explodedTarget = new T.Vector3(w > 767 ? -packingWidth * 0.12 : 0, 0.85, 0);

      const distance = T.MathUtils.lerp(frame.distance, Math.max(0.2, atlasDistance), extent);
      // Trần zoom ra: lùi được gấp 4 khung vừa — đủ để thấy toàn cảnh, chưa tới
      // mức mô hình thành một chấm giữa màn.
      controls.maxDistance = Math.max(6, distance * 4);
      place(
        frame.target.clone().lerp(explodedTarget, extent),
        direction,
        distance,
        [frame.offsetX * (1 - extent), frame.offsetY * (1 - extent)],
        animate,
      );
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
      const key = latest.current.visible.join(",");
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

    /** Giữ target trong phạm vi hợp lệ và vẽ thanh theo vị trí hiện tại. */
    const updateScroll = () => {
      if (!navActive()) {
        track.hidden = true;
        return;
      }
      const range = scrollRange();
      const y = controls.target.y;
      if (!range.overflow) {
        // Vừa khung: kéo dần về giữa (không nhảy), thanh ẩn.
        if (Math.abs(y - range.center) > 1e-4) shiftY((range.center - y) * 0.25);
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
      composer?.setPixelRatio(renderer.getPixelRatio());
      composer?.setSize(el.clientWidth, el.clientHeight);
      fit(latest.current.view, amount);
      sized = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    // ------------------------------------------------------------ chọn mảnh
    const raycaster = new T.Raycaster();
    const pointer = new T.Vector2();
    const tap = new PointerTap();
    const worldBox = new T.Box3();
    const hitPoint = new T.Vector3();
    const canvas = renderer.domElement;

    /** Mảnh bấm được: đang hiện và lớp của nó đủ đậm (lớp mờ để bấm xuyên qua). */
    const pickable = (i: number) => data[i * 4 + 3] > 0.5 && alphaOf(i) >= 0.5;

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
        if (hits[0] && hits[0].distance < nearest) {
          nearest = hits[0].distance;
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
      if (!validTap || !ready) return;
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
    let lastExtent = -1;
    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const s = latest.current;

      const changed =
        lastState?.visible !== s.visible ||
        lastState?.selected !== s.selected ||
        lastState?.isolate !== s.isolate;
      const moving = Math.abs(peel - s.explode) > 0.0001;
      if (moving) {
        peel = T.MathUtils.damp(peel, s.explode, 8, dt);
        amount = peelToExplode(peel);
        dirty = true;
      }

      if (changed || moving || lastExtent < 0) {
        applyLayers(s.selected);
        const visible = new Set(s.visible);
        const selection = new Set(s.selected);
        // Lớp đã mờ hẳn (da sau 20%) không chiếm ô trong lưới tách.
        const visibleParts = parts.filter(
          (p, i) =>
            (s.isolate ? selection.has(p.id) : visible.has(p.system) || selection.has(p.id)) &&
            (s.isolate || selection.has(p.id) || alphaOf(i) > 0.01),
        );
        const nextLayoutKey =
          visibleParts.map((p) => p.id).join(",") + ":" + camera.aspect.toFixed(3);
        if (nextLayoutKey !== layoutKey) {
          const layout = createExplosionLayout(visibleParts, camera.aspect);
          packingWidth = layout.width;
          packingHeight = layout.height;
          parts.forEach((p, i) => {
            const cell = layout.cells.get(p.id);
            offsets[i] = cell ? new T.Vector3(cell.x, cell.y + 0.85, 0) : centers[i].clone();
          });
          layoutKey = nextLayoutKey;
          if (amount > 0.05 && !s.isolate) fit(s.view, Math.max(0, (amount - 0.3) / 0.7));
        }

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
          const shown =
            (s.isolate ? selected : visible.has(p.system) || selected) &&
            (s.isolate || selected || alphaOf(i) > 0.01);
          data[i * 4] = dx;
          data[i * 4 + 1] = dy;
          data[i * 4 + 2] = dz;
          data[i * 4 + 3] = shown ? 1 : 0;
          selectedData[i * 4] = selected ? 255 : 0;
          selectedData[i * 4 + 1] = alphaOf(i) < 0.999 ? 255 : 0;
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
        partTexture.needsUpdate = true;
        selectionTexture.needsUpdate = true;
        markerGeometry.attributes.position.needsUpdate = true;
        lastState = s;
        lastExtent = amount;
        dirty = true;
      }

      if (s.view !== lastView || s.reset !== lastReset) {
        // Lượt đầu (chưa có góc nhìn nào) đặt thẳng; về sau thì chuyển mượt.
        fit(s.view, amount, sized && lastView !== "");
        lastView = s.view;
        lastReset = s.reset;
        lastVisibleKey = s.visible.join(",");
      }
      // Tập hệ đang bật đổi (chọn một hệ, bật/tắt, "Tất cả") → khung lại theo hộp
      // bao mới, giữ góc xoay hiện tại. Chỉ ở nguyên khối, ngoài "xem riêng".
      // Không khung lại khi chỉ chọn một mảnh hay mở bảng chi tiết: đó là lúc
      // người đọc vừa tự zoom tới chỗ mình muốn.
      const visibleKey = s.visible.join(",");
      if (visibleKey !== lastVisibleKey) {
        lastVisibleKey = visibleKey;
        if (sized && !s.isolate && amount < 0.05 && s.visible.length > 0) {
          fit(s.view, amount, true, true);
        }
      }
      runTween(performance.now());
      if (moving && !s.isolate) fit(amount > 0.5 ? "front" : s.view, Math.max(0, (amount - 0.3) / 0.7));

      if (sized && s.focus !== lastFocus) {
        lastFocus = s.focus;
        if (!s.isolate && amount < 0.05) focusSelection(s.selected);
      }

      const isolateKey = s.isolate
        ? `${s.selected.join(",")}:${s.reset}:${s.inspectorOpen}:${camera.aspect}`
        : "";
      if (isolateKey !== lastIsolate || (s.isolate && moving)) {
        if (s.isolate) {
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
          fit(s.view, amount, true);
        }
        lastIsolate = isolateKey;
      }

      // Rê chuột: một raycast mỗi khung, chỉ khi con trỏ vừa đổi chỗ.
      if (hoverQueued && ready && amount < 0.5) {
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
        fit(s.view, amount, true, true);
      }

      controls.enableRotate = amount < 0.8;
      controls.mouseButtons.LEFT = amount < 0.8 ? T.MOUSE.ROTATE : T.MOUSE.PAN;
      controls.touches.ONE = amount < 0.8 ? T.TOUCH.ROTATE : T.TOUCH.PAN;
      markers.visible = amount > 0.75;
      controls.autoRotate = s.rotate && !s.isolate && amount < 0.4;
      controls.autoRotateSpeed = 0.65;
      controls.update();
      if (controls.autoRotate) dirty = true;
      if (dirty) updateScroll();

      const now = performance.now();
      if (dirty) {
        lastChange = now;
        aoFresh = false;
      } else if (composer && !aoFresh && !tween && now - lastChange > 140) {
        // Đứng yên đủ lâu: một khung có AO thay cho khung thường.
        composer.render();
        // GTAOPass khôi phục clear color qua get/set — giữ chắc alpha 0.
        renderer.setClearColor(0x000000, 0);
        aoFresh = true;
      }
      if (dirty) {
        // Đang thay đổi (xoay, zoom, tách lớp) → vẽ thường, không AO.
        renderer.render(scene, camera);
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
      composer?.dispose();
      partTexture.dispose();
      selectionTexture.dispose();
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
