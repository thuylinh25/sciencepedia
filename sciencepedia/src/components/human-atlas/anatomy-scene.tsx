"use client";

// Client: WebGL, ResizeObserver và pointer event chỉ có ở trình duyệt.
// Module này chỉ được nạp qua `dynamic(..., { ssr: false })` trong
// `human-atlas.tsx`, nên three.js không lọt vào bundle của trang nào khác.

import { useEffect, useRef } from "react";
import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import {
  SYSTEM_COLORS,
  SYSTEM_IDS,
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
 * - Nền và bệ đổi theo theme sáng/tối của site. Vật liệu mô hình giữ nguyên.
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
  labelFor: (partIndex: number) => string;
  onSelect: (partId: string) => void;
  onProgress: (percent: number) => void;
  onError: (code: SceneError) => void;
};

const THEMES = {
  light: { clear: "#f2f3f3", ground: 0xd5d9dc, platform: 0xeeeeec, ring: 0x8c969f },
  dark: { clear: "#131b29", ground: 0x0a0f18, platform: 0x1a2230, ring: 0x6b7a8c },
};

/** Số khối tải song song — giữ như bản gốc: đủ lấp băng thông, không nghẽn kết nối. */
const PARALLEL_CHUNKS = 3;

export default function AnatomyScene({
  atlas,
  state,
  dark,
  ariaLabel,
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
    let layoutKey = "";
    let amount = 0;
    let lastState: SceneState | null = null;
    const abort = new AbortController();

    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      callbacks.current.onError("webgl");
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 768 ? 1.5 : 2));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
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
    controls.addEventListener("change", () => {
      dirty = true;
    });

    const pmrem = new T.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    room.dispose();
    pmrem.dispose();

    scene.add(new T.HemisphereLight(0xffffff, 0xa7acb2, 1.05));
    const key = new T.DirectionalLight(0xfffaf4, 2.3);
    key.position.set(-2, 4, 3);
    scene.add(key);
    const rim = new T.DirectionalLight(0xe9f0ff, 1.8);
    rim.position.set(2, 2, -3);
    scene.add(rim);

    const groundMaterial = new T.MeshStandardMaterial({ color: 0xd5d9dc, roughness: 1 });
    const ground = new T.Mesh(new T.CircleGeometry(30, 96), groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.019;
    scene.add(ground);
    const platformMaterial = new T.MeshStandardMaterial({
      color: 0xeeeeec,
      metalness: 0.12,
      roughness: 0.67,
    });
    const platform = new T.Mesh(new T.CylinderGeometry(0.68, 0.7, 0.028, 100), platformMaterial);
    platform.position.y = -0.016;
    scene.add(platform);
    const ringMaterial = new T.MeshBasicMaterial({
      color: 0x8c969f,
      transparent: true,
      opacity: 0.4,
      side: T.DoubleSide,
    });
    const ring = new T.Mesh(new T.RingGeometry(0.63, 0.632, 128), ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.001;
    scene.add(ring);
    const innerRing = new T.Mesh(
      new T.RingGeometry(0.55, 0.551, 128),
      new T.MeshBasicMaterial({
        color: 0xa4aeb8,
        transparent: true,
        opacity: 0.16,
        side: T.DoubleSide,
      }),
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.001;
    scene.add(innerRing);

    themeRef.current = (isDark: boolean) => {
      const theme = isDark ? THEMES.dark : THEMES.light;
      renderer.setClearColor(theme.clear);
      groundMaterial.color.set(theme.ground);
      platformMaterial.color.set(theme.platform);
      ringMaterial.color.set(theme.ring);
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

    const materialFor = (system: SystemId) => {
      const glass = system === "integumentary";
      const m = new T.MeshStandardMaterial({
        color: SYSTEM_COLORS[system] ?? "#aebbb8",
        metalness: 0.08,
        roughness: 0.53,
        side: T.DoubleSide,
        transparent: glass,
        opacity: glass ? 0.1 : 1,
        depthWrite: !glass,
      });
      m.onBeforeCompile = (shader) => {
        shader.uniforms.partState = { value: partTexture };
        shader.uniforms.selectionState = { value: selectionTexture };
        shader.uniforms.stateWidth = { value: width };
        shader.vertexShader =
          "attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth; varying float partVisible; varying float partSelected;\n" +
          shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); transformed += state.xyz; partVisible = state.w; partSelected = texture2D(selectionState, stateUv).r;",
        );
        shader.fragmentShader =
          "varying float partVisible; varying float partSelected;\n" + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <clipping_planes_fragment>",
          "#include <clipping_planes_fragment>\nif (partVisible < 0.5) discard;",
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <color_fragment>",
          "#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.85, 0.78), partSelected * 0.75);",
        );
      };
      materials.push(m);
      return m;
    };
    const mats = new Map(SYSTEM_IDS.map((id) => [id, materialFor(id)]));

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

      const groups = new Map<SystemId, T.BufferGeometry[]>();
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
        const pick = new T.Mesh(g);
        pick.matrixAutoUpdate = false;
        pickers[i] = pick;
        geometries.push(g);
        g.setAttribute(
          "partIndex",
          new T.BufferAttribute(new Float32Array(p.vertexCount).fill(i), 1),
        );
        const list = groups.get(p.system) ?? [];
        list.push(g);
        groups.set(p.system, list);
      });
      groups.forEach((gs, system) => {
        const geometry = mergeGeometries(gs, false);
        if (!geometry) throw new Error("merge");
        geometries.push(geometry);
        const mesh = new T.Mesh(geometry, mats.get(system));
        mesh.frustumCulled = false;
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
    const fit = (view: string, extent = 0) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const mobile = w < 768;
      const normalDistance = mobile
        ? Math.max(4.5, (1.8 * h) / Math.max(160, h - 350) / fovTan())
        : 4;
      const reservedHeight = mobile ? 350 : 270;
      const availableAspect = Math.max(
        0.35,
        (w - (mobile ? 40 : 340)) / Math.max(160, h - reservedHeight),
      );
      const atlasDistance =
        (Math.max(packingHeight, packingWidth / availableAspect) / fovTan()) *
        (h / Math.max(160, h - reservedHeight)) *
        1.08;
      const distance = T.MathUtils.lerp(normalDistance, Math.max(0.2, atlasDistance), extent);
      if (extent > 0.8) view = "front";
      const direction =
        view === "front"
          ? new T.Vector3(0, 0.02, 1)
          : view === "back"
            ? new T.Vector3(0, 0.02, -1)
            : view === "side"
              ? new T.Vector3(1, 0.02, 0)
              : new T.Vector3(0.35, 0.06, 1).normalize();
      controls.target.set(
        extent > 0.1 && w > 767 ? -packingWidth * 0.12 : 0,
        extent > 0.1 || mobile ? 0.85 : 0.68,
        0,
      );
      camera.position.copy(controls.target).addScaledVector(direction, distance);
      controls.update();
      dirty = true;
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
      controls.target.copy(center);
      camera.position.copy(center).addScaledVector(direction, distance);
      controls.update();
      dirty = true;
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

    const hasSolidVisible = () =>
      parts.some((p, i) => p.system !== "integumentary" && data[i * 4 + 3] > 0.5);

    const down = (e: PointerEvent) => {
      hover.hidden = true;
      tap.down(e.pointerId, e.clientX, e.clientY, e.pointerType === "touch" ? 12 : 5);
    };
    const move = (e: PointerEvent) => {
      tap.move(e.pointerId, e.clientX, e.clientY);
      if (e.buttons || amount < 0.5 || e.pointerType === "touch") {
        hover.hidden = true;
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
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      let nearest = Infinity;
      let found = -1;
      const hasSolid = hasSolidVisible();
      pickers.forEach((mesh, i) => {
        if (!mesh || data[i * 4 + 3] < 0.5 || (hasSolid && parts[i].system === "integumentary")) {
          return;
        }
        worldBox.copy(bounds[i]).translate(mesh.position);
        if (!raycaster.ray.intersectBox(worldBox, hitPoint)) return;
        const hits = raycaster.intersectObject(mesh, false);
        if (hits[0] && hits[0].distance < nearest) {
          nearest = hits[0].distance;
          found = i;
        }
      });
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

    // ------------------------------------------------------------ vòng vẽ
    const clock = new T.Clock();
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
      const moving = Math.abs(amount - s.explode) > 0.0001;
      if (moving) {
        amount = T.MathUtils.damp(amount, s.explode, 8, dt);
        dirty = true;
      }

      if (changed || moving || lastExtent < 0) {
        const visible = new Set(s.visible);
        const selection = new Set(s.selected);
        const visibleParts = parts.filter((p) =>
          s.isolate ? selection.has(p.id) : visible.has(p.system) || selection.has(p.id),
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
          const shown = s.isolate ? selected : visible.has(p.system) || selected;
          data[i * 4] = dx;
          data[i * 4 + 1] = dy;
          data[i * 4 + 2] = dz;
          data[i * 4 + 3] = shown ? 1 : 0;
          selectedData[i * 4] = selected ? 255 : 0;
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
        fit(s.view, amount);
        lastView = s.view;
        lastReset = s.reset;
      }
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
            let left = 20;
            let right = w - 20;
            let top = mobile ? 120 : 90;
            let bottom = h - 150;
            if (s.inspectorOpen) {
              const hostRect = el.getBoundingClientRect();
              const sheet = root.querySelector("[data-atlas-sheet]")?.getBoundingClientRect();
              if (landscape) {
                right = sheet ? sheet.left - hostRect.left - 16 : w - 335;
                top = 70;
                bottom = h - 110;
              } else if (mobile) {
                top = 110;
                bottom = (sheet ? sheet.top - hostRect.top : h * 0.55) - 16;
              } else {
                right = sheet ? sheet.left - hostRect.left - 16 : w - 370;
                left = w > 1100 ? 285 : 25;
              }
            }
            const availableWidth = Math.max(150, right - left);
            const availableHeight = Math.max(40, bottom - top);
            camera.setViewOffset(w, h, w / 2 - (left + right) / 2, h / 2 - (top + bottom) / 2, w, h);
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
            controls.target.copy(center);
            camera.position
              .copy(center)
              .add(new T.Vector3(0.2, 0.1, 1).normalize().multiplyScalar(distance));
            controls.update();
            dirty = true;
          }
        } else if (lastIsolate) {
          camera.clearViewOffset();
          fit(s.view, amount);
        }
        lastIsolate = isolateKey;
      }

      controls.enableRotate = amount < 0.8;
      controls.mouseButtons.LEFT = amount < 0.8 ? T.MOUSE.ROTATE : T.MOUSE.PAN;
      controls.touches.ONE = amount < 0.8 ? T.TOUCH.ROTATE : T.TOUCH.PAN;
      ground.visible = platform.visible = ring.visible = innerRing.visible =
        amount < 0.5 && !s.isolate;
      markers.visible = amount > 0.75;
      controls.autoRotate = s.rotate && !s.isolate && amount < 0.4;
      controls.autoRotateSpeed = 0.65;
      controls.update();
      if (controls.autoRotate) dirty = true;

      if (dirty) {
        renderer.render(scene, camera);
        targets = [];
        if (amount > 0.45) {
          const hasSolid = hasSolidVisible();
          const cw = el.clientWidth;
          const ch = el.clientHeight;
          parts.forEach((p, i) => {
            if (data[i * 4 + 3] < 0.5 || (hasSolid && p.system === "integumentary")) return;
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
      partTexture.dispose();
      selectionTexture.dispose();
      markerGeometry.dispose();
      markerMaterial.dispose();
      hover.remove();
      renderer.dispose();
      canvas.remove();
      themeRef.current = () => {};
    };
    // `dark`, `ariaLabel` chỉ đọc lần đầu; đổi theme đi qua `themeRef`, không dựng lại cảnh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atlas]);

  return <div ref={host} className="absolute inset-0" />;
}
