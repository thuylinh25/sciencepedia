"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import {
  BOX_HALF,
  COSMIC_LANDMARKS,
  FILAMENT_MAX_DISTANCE,
  NODE_COUNT,
  NODE_TIERS,
  UNIVERSE_SCALES,
  landmarkPosition,
} from "@/lib/universe-data";

export type UniverseSettings = {
  playing: boolean;
  speed: number;
  showFilaments: boolean;
  showScales: boolean;
  showLabels: boolean;
  /** Khoảng cách camera, do thanh tỉ lệ điều khiển */
  distance: number;
};

function gaussian(): number {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
}

/** Sprite tròn mềm — xem chú thích cùng tên ở galaxy-scene.tsx */
function useStarSprite(): THREE.Texture {
  return useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      const half = size / 2;
      const gradient = ctx.createRadialGradient(
        half,
        half,
        0,
        half,
        half,
        half,
      );
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.22, "rgba(255,255,255,0.7)");
      gradient.addColorStop(0.5, "rgba(255,255,255,0.18)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

/**
 * Vòng ngắm cho dấu "bạn đang ở đây".
 *
 * Chốt 2026-09-06. Sau khi sửa nhãn đè nhau thì lỗi còn lại lộ ra: nhãn đã
 * đọc được nhưng người xem vẫn không chỉ ra được Ngân Hà nằm ở chấm nào. Mốc
 * home trước đây chỉ là một sprite sáng hơn giữa hàng nghìn sprite sáng, cộng
 * một quầng ĐẬP NHỊP — mà quầng đập nhịp thì có lúc mờ gần hết, và đúng lúc
 * đó thì nó không đánh dấu gì cả.
 *
 * Vòng ngắm này tĩnh, không đập nhịp, và vẽ với `depthTest={false}` nên không
 * bị các thiên hà phía trước che. Một hình dạng KHÁC HẲN (vòng tròn có bốn
 * vạch chỉ vào tâm) đọc nhanh hơn nhiều so với "chấm sáng to hơn một chút".
 */
function useReticleSprite(): THREE.Texture {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      const half = size / 2;
      ctx.strokeStyle = "#fde047";
      ctx.lineCap = "round";

      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(half, half, size * 0.3, 0, Math.PI * 2);
      ctx.stroke();

      // Bốn vạch chỉ vào tâm, chừa khe hở để không lấp mất chính cái chấm.
      ctx.lineWidth = 9;
      for (let i = 0; i < 4; i++) {
        const angle = i * (Math.PI / 2);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(half + cos * size * 0.45, half + sin * size * 0.45);
        ctx.lineTo(half + cos * size * 0.36, half + sin * size * 0.36);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

type Node = { position: THREE.Vector3; weight: number };

/**
 * Mạng vũ trụ.
 *
 * Cách dựng: gieo các nút đám thiên hà, nối những nút đủ gần nhau thành sợi,
 * rồi rắc thiên hà dọc theo các sợi đó với nhiễu ngang nhỏ. Khoảng trống giữa
 * các sợi tự hình thành — đó chính là các void, và chúng chiếm phần lớn thể
 * tích vũ trụ.
 *
 * Đây là mô hình hình thái, không phải mô phỏng N-body: nó tái tạo dáng của
 * cấu trúc chứ không tính lực hấp dẫn giữa các khối vật chất tối.
 */
function useCosmicWeb() {
  return useMemo(() => {
    // 1. Gieo nút, dồn nhẹ về tâm để rìa khối không bị cắt cụt lộ liễu
    const nodes: Node[] = [];
    for (let i = 0; i < NODE_COUNT; i += 1) {
      const r = Math.pow(Math.random(), 0.75) * BOX_HALF;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      nodes.push({
        position: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta),
        ),
        weight: 0.35 + Math.pow(Math.random(), 2.2) * 1.9,
      });
    }

    // 2. Nối các nút đủ gần nhau, mỗi nút giới hạn số sợi để không thành lưới đặc
    const edges: [Node, Node][] = [];
    const degree = new Array(nodes.length).fill(0);
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        if (degree[i] >= 4 || degree[j] >= 4) continue;
        const distance = nodes[i].position.distanceTo(nodes[j].position);
        if (distance > FILAMENT_MAX_DISTANCE) continue;
        // sợi càng dài càng ít khả năng tồn tại
        if (Math.random() > 1 - distance / FILAMENT_MAX_DISTANCE) continue;
        edges.push([nodes[i], nodes[j]]);
        degree[i] += 1;
        degree[j] += 1;
      }
    }

    // 3. Rắc thiên hà: phần lớn nằm dọc sợi, phần còn lại tụ quanh nút
    const positions: number[] = [];
    const colors: number[] = [];
    const scratch = new THREE.Color();
    const supercluster = new THREE.Color(NODE_TIERS.supercluster.color);
    const cluster = new THREE.Color(NODE_TIERS.cluster.color);
    const galaxy = new THREE.Color(NODE_TIERS.galaxy.color);

    /**
     * `density` quyết định hạng: thiên hà lẻ nằm dọc sợi và trong void, cụm ở
     * quanh nút vừa, siêu cụm ở những nút nặng nhất. Ba màu tách bạch để mắt
     * đọc được cấu trúc thay vì thấy một mớ chấm giống nhau.
     */
    const push = (point: THREE.Vector3, density: number) => {
      positions.push(point.x, point.y, point.z);
      if (density > 0.85) scratch.copy(supercluster);
      else if (density > 0.55) scratch.copy(cluster);
      else scratch.copy(galaxy);
      const dim = 0.45 + Math.random() * 0.5;
      colors.push(scratch.r * dim, scratch.g * dim, scratch.b * dim);
    };

    for (const [a, b] of edges) {
      const count = Math.round(a.position.distanceTo(b.position) * 26);
      for (let k = 0; k < count; k += 1) {
        const t = Math.random();
        const point = a.position.clone().lerp(b.position, t);
        // thắt lại ở giữa sợi, phình ra ở hai đầu nút
        const thickness = 0.1 + 0.32 * Math.abs(t - 0.5);
        point.x += gaussian() * thickness;
        point.y += gaussian() * thickness;
        point.z += gaussian() * thickness;
        push(point, 0.35 + (1 - Math.abs(t - 0.5) * 2) * 0.15);
      }
    }

    for (const node of nodes) {
      const count = Math.round(node.weight * 130);
      for (let k = 0; k < count; k += 1) {
        const point = node.position.clone();
        const spread = node.weight * 0.34;
        point.x += gaussian() * spread;
        point.y += gaussian() * spread;
        point.z += gaussian() * spread;
        push(point, 0.75 + Math.random() * 0.3);
      }
    }

    // 4. Vài thiên hà lẻ trong void — void rỗng chứ không tuyệt đối trống
    for (let i = 0; i < 1800; i += 1) {
      const point = new THREE.Vector3(
        (Math.random() * 2 - 1) * BOX_HALF,
        (Math.random() * 2 - 1) * BOX_HALF,
        (Math.random() * 2 - 1) * BOX_HALF,
      );
      if (point.length() > BOX_HALF) continue;
      push(point, 0.05);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    // Đường sợi mảnh nối các nút, bật/tắt được
    const linePoints: THREE.Vector3[] = [];
    for (const [a, b] of edges) linePoints.push(a.position, b.position);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);

    // Nút sáng cho các đám lớn nhất
    const clusterPositions: number[] = [];
    for (const node of nodes) {
      if (node.weight < 1.5) continue;
      clusterPositions.push(node.position.x, node.position.y, node.position.z);
    }
    const clusterGeometry = new THREE.BufferGeometry();
    clusterGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(clusterPositions, 3),
    );

    return {
      geometry,
      lineGeometry,
      clusterGeometry,
      galaxyCount: positions.length / 3,
      filamentCount: edges.length,
    };
  }, []);
}

/* ────────────────────────── Giãn nhãn, dùng chung ──────────────────────────

   Chốt 2026-09-06 sau khi nhãn đè lên nhau ở mức thu nhỏ mặc định.

   Trước đây mỗi nhóm nhãn tự lo lấy mình: `Landmarks` có logic tránh đè, còn
   `ScaleShells` thì không có gì cả. Hai nhóm render trong hai <group> tách
   biệt nên không nhóm nào biết nhóm kia đang chiếm chỗ nào — và một cơ chế
   tránh đè chỉ nhìn thấy một nửa số nhãn thì không phải cơ chế tránh đè.

   Phép đo cũ còn sai ở hai chỗ nữa, và cả hai đều làm khung va chạm lệch khỏi
   thứ đang thật sự hiện trên màn hình:

   1. Nó chiếu TÂM VẬT THỂ, trong khi <Html> được đặt lệch lên trên vài đơn vị
      thế giới. Hai điểm đó không rơi vào cùng một chỗ trên màn hình.
   2. Nó so hai tâm nhãn bằng một khung cứng 150×30 px, trong khi drei co giãn
      nhãn theo khoảng cách camera. Cùng một cặp nhãn, lúc thu nhỏ cách nhau
      30 px thật, lúc phóng to cách nhau 300 px — một ngưỡng cứng không thể
      đúng ở cả hai đầu, và nó cũng bỏ qua việc "Ngân Hà — bạn đang ở đây"
      rộng gấp đôi "Đám Virgo".

   Bản này chiếu ĐÚNG điểm neo của nhãn, ước lượng bề rộng theo số ký tự thật
   của từng nhãn, rồi nhân với đúng hệ số drei dùng. */

/**
 * Hệ số drei áp cho `<Html distanceFactor>`, chép từ `objectScale()` của nó:
 * `scale = distanceFactor / (2·tan(fov/2)·khoảng cách tới camera)`.
 *
 * Phải khớp chính xác. Sai số ở đây là sai số của khung va chạm, và nó biểu
 * hiện thành đúng cái lỗi ta đang sửa.
 */
function htmlScale(
  camera: THREE.Camera,
  anchor: THREE.Vector3,
  distanceFactor: number,
): number {
  const { fov } = camera as THREE.PerspectiveCamera;
  const vFOV = (fov * Math.PI) / 180;
  const dist = camera.position.distanceTo(anchor);
  return distanceFactor / (2 * Math.tan(vFOV / 2) * dist);
}

/* Bề rộng nhãn khi chưa co giãn, đo thô theo số ký tự.
   Đo DOM thật sẽ chính xác hơn nhưng không khả thi: nhãn bị ẩn thì không có
   DOM để mà đo, nên phép đo sẽ dao động qua lại giữa hai trạng thái. */
const CHAR_PX = 6.4;
const PAD_PX = 26;
const LABEL_PX_H = 26;
/** Khe hở tối thiểu: hai nhãn sát cạnh nhau vẫn khó đọc dù về hình học là không đè. */
const GAP_PX = 8;

/** Nhãn mốc nằm lệch lên trên chấm sáng; mốc "home" to hơn nên lệch nhiều hơn. */
const landmarkLabelY = (home: boolean) => (home ? 0.75 : 0.45);
const shellLabelPos = (radius: number): [number, number, number] => [
  0,
  radius * 0.72,
  radius * 0.72,
];
const LANDMARK_FACTOR = 22;
const SHELL_FACTOR = 18;

type LabelSlot = {
  id: string;
  anchor: THREE.Vector3;
  /** Bề rộng px khi scale = 1 */
  width: number;
  distanceFactor: number;
};

/**
 * Bỏ nhãn nào đè lên một nhãn đã giữ, xét theo thứ tự ưu tiên của `slots`.
 *
 * Không sửa bằng cách bóp méo khoảng cách giữa các mốc: khoảng cách ở đây là
 * số đo thật, chỉ hướng mới là bịa ra cho dễ nhìn. Nhãn bị ẩn hiện lại khi
 * người xem phóng to — đúng hành vi người ta chờ đợi.
 */
function useLabelDeclutter(slots: LabelSlot[], enabled: boolean): Set<string> {
  const { camera, size } = useThree();
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const lastKey = useRef("");

  useFrame(() => {
    if (!enabled) {
      if (lastKey.current !== "") {
        lastKey.current = "";
        setHidden(new Set());
      }
      return;
    }

    const kept: { x: number; y: number; hw: number; hh: number }[] = [];
    const next = new Set<string>();

    for (const slot of slots) {
      const ndc = slot.anchor.clone().project(camera);
      // z > 1 nghĩa là nằm sau camera; chiếu ra một điểm vô nghĩa
      if (ndc.z > 1) {
        next.add(slot.id);
        continue;
      }
      const x = (ndc.x * 0.5 + 0.5) * size.width;
      const y = (-ndc.y * 0.5 + 0.5) * size.height;
      const scale = htmlScale(camera, slot.anchor, slot.distanceFactor);
      const hw = (slot.width * scale + GAP_PX) / 2;
      const hh = (LABEL_PX_H * scale + GAP_PX) / 2;

      const clash = kept.some(
        (k) => Math.abs(k.x - x) < k.hw + hw && Math.abs(k.y - y) < k.hh + hh,
      );
      if (clash) next.add(slot.id);
      else kept.push({ x, y, hw, hh });
    }

    // Chỉ setState khi tập hợp thật sự đổi — setState mỗi khung hình sẽ khiến
    // React dựng lại cây này 60 lần một giây.
    const key = [...next].sort().join(",");
    if (key !== lastKey.current) {
      lastKey.current = key;
      setHidden(next);
    }
  });

  return hidden;
}

/**
 * Danh sách nhãn theo THỨ TỰ ƯU TIÊN — slot đứng trước thắng khi tranh chỗ.
 *
 * "Bạn đang ở đây" luôn thắng, sau đó tới mốc xa nhất: mốc xa nằm ở rìa và ít
 * tranh chỗ, giữ chúng thì phần trung tâm chỉ mất những nhãn mà zoom vào là
 * thấy lại.
 *
 * Vỏ tỉ lệ xếp sau toàn bộ mốc: vỏ mất nhãn thì vòng tròn vẫn còn đó để nhìn,
 * còn một mốc mất nhãn thì chỉ còn là một chấm sáng vô danh.
 */
function useLabelSlots(
  locale: string,
  showScales: boolean,
): LabelSlot[] {
  return useMemo(() => {
    const slots: LabelSlot[] = [];
    const textWidth = (text: string) => text.length * CHAR_PX + PAD_PX;

    const landmarks = [...COSMIC_LANDMARKS].sort(
      (a, b) =>
        Number(b.tier === "home") - Number(a.tier === "home") ||
        b.distanceMly - a.distanceMly,
    );
    for (const landmark of landmarks) {
      const home = landmark.tier === "home";
      const [x, y, z] = landmarkPosition(landmark);
      const text = locale === "en" ? landmark.nameEn : landmark.name;
      slots.push({
        id: landmark.id,
        anchor: new THREE.Vector3(x, y + landmarkLabelY(home), z),
        // Mốc home có thêm ngôi sao ở đầu nhãn
        width: textWidth(text) + (home ? 14 : 0),
        distanceFactor: LANDMARK_FACTOR,
      });
    }

    // Vỏ tỉ lệ đang tắt thì không chiếm chỗ của ai cả.
    if (showScales) {
      const shells = UNIVERSE_SCALES.filter(
        (scale) => scale.radius !== null,
      ).sort((a, b) => (b.radius as number) - (a.radius as number));
      for (const scale of shells) {
        slots.push({
          id: `shell-${scale.id}`,
          anchor: new THREE.Vector3(...shellLabelPos(scale.radius as number)),
          width: textWidth(locale === "en" ? scale.nameEn : scale.name),
          distanceFactor: SHELL_FACTOR,
        });
      }
    }

    return slots;
  }, [locale, showScales]);
}

/**
 * Các cấu trúc có thật, kèm dấu "bạn đang ở đây" ở gốc toạ độ.
 *
 * Mô hình trước mọi chấm sáng như nhau nên mắt không biết nhìn vào đâu. Ở đây
 * vị trí của chúng ta được đánh dấu bằng một vòng sáng đập nhịp ngay giữa, và
 * các mốc quen thuộc được gắn tên — đó là những điểm neo để đọc phần còn lại.
 */
function Landmarks({
  sprite,
  showLabels,
  hiddenLabels,
  locale,
  onSelect,
}: {
  sprite: THREE.Texture;
  showLabels: boolean;
  /** Tính ở `Web` bằng `useLabelDeclutter`, chung với nhãn vỏ tỉ lệ. */
  hiddenLabels: Set<string>;
  locale: string;
  onSelect: (id: string) => void;
}) {
  const pulse = useRef<THREE.Mesh>(null);
  const reticle = useReticleSprite();

  // Chỉ còn nhịp đập của dấu "bạn đang ở đây". Việc giãn nhãn đã chuyển lên
  // `Web` để nó nhìn thấy cả nhãn vỏ tỉ lệ — xem `useLabelDeclutter`.
  useFrame(({ clock }) => {
    if (!pulse.current) return;
    const phase = (clock.elapsedTime % 2.4) / 2.4;
    pulse.current.scale.setScalar(1 + phase * 3);
    (pulse.current.material as THREE.Material).opacity = 0.5 * (1 - phase);
  });

  return (
    <group>
      {COSMIC_LANDMARKS.map((landmark) => {
        const position = landmarkPosition(landmark);
        const home = landmark.tier === "home";
        const color =
          landmark.tier === "home"
            ? "#fde047"
            : NODE_TIERS[landmark.tier].color;

        return (
          <group key={landmark.id} position={position}>
            {home && (
              <>
                <mesh ref={pulse}>
                  <sphereGeometry args={[0.28, 20, 20]} />
                  <meshBasicMaterial
                    color="#fde047"
                    transparent
                    opacity={0.5}
                    depthWrite={false}
                    side={THREE.BackSide}
                  />
                </mesh>

                {/* Vòng ngắm tĩnh — thứ thật sự trả lời "Ngân Hà ở đâu".
                    depthTest tắt để thiên hà phía trước không che mất nó. */}
                <sprite scale={[2.6, 2.6, 2.6]} renderOrder={10}>
                  <spriteMaterial
                    map={reticle}
                    transparent
                    opacity={0.95}
                    depthWrite={false}
                    depthTest={false}
                  />
                </sprite>

                {/* Cuống nối chấm với nhãn. Không có nó thì cái nhãn chỉ là
                    một viên thuốc lơ lửng gần đó, không chỉ đích xác chấm nào. */}
                <mesh position={[0, landmarkLabelY(true) / 2 + 0.14, 0]} renderOrder={10}>
                  <cylinderGeometry
                    args={[0.014, 0.014, landmarkLabelY(true) - 0.28, 6]}
                  />
                  <meshBasicMaterial
                    color="#fde047"
                    transparent
                    opacity={0.7}
                    depthWrite={false}
                    depthTest={false}
                  />
                </mesh>
              </>
            )}

            <sprite
              scale={home ? [1.5, 1.5, 1.5] : [0.85, 0.85, 0.85]}
              onClick={() => onSelect(landmark.id)}
              onPointerOver={() => (document.body.style.cursor = "pointer")}
              onPointerOut={() => (document.body.style.cursor = "auto")}
            >
              <spriteMaterial
                map={sprite}
                color={color}
                transparent
                opacity={home ? 1 : 0.9}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </sprite>

            {showLabels && !hiddenLabels.has(landmark.id) && (
              <Html
                position={[0, landmarkLabelY(home), 0]}
                center
                distanceFactor={LANDMARK_FACTOR}
                zIndexRange={[20, 0]}
              >
                <button
                  type="button"
                  onClick={() => onSelect(landmark.id)}
                  className={
                    home
                      ? "rounded-full border border-yellow-300/70 bg-yellow-300/15 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap backdrop-blur"
                      : "rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] font-medium whitespace-nowrap backdrop-blur transition-colors hover:border-white/60"
                  }
                  style={{ color }}
                >
                  {home ? "⭐ " : ""}
                  {locale === "en" ? landmark.nameEn : landmark.name}
                </button>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

function ScaleShells({
  showLabels,
  hiddenLabels,
  locale,
}: {
  showLabels: boolean;
  /** Cùng tập với nhãn mốc — vỏ tỉ lệ trước đây không tránh đè gì cả. */
  hiddenLabels: Set<string>;
  locale: string;
}) {
  return (
    <group>
      {UNIVERSE_SCALES.filter((scale) => scale.radius !== null).map((scale) => (
        <group key={scale.id}>
          <mesh>
            <sphereGeometry args={[scale.radius as number, 48, 32]} />
            <meshBasicMaterial
              color={scale.color}
              wireframe
              transparent
              opacity={0.16}
              depthWrite={false}
            />
          </mesh>
          {showLabels && !hiddenLabels.has(`shell-${scale.id}`) && (
            <Html
              position={shellLabelPos(scale.radius as number)}
              center
              distanceFactor={SHELL_FACTOR}
              zIndexRange={[20, 0]}
            >
              <span
                className="rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap backdrop-blur"
                style={{ color: scale.color }}
              >
                {locale === "en" ? scale.nameEn : scale.name}
              </span>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}

function Web({
  settings,
  locale,
  onSelect,
}: {
  settings: UniverseSettings;
  locale: string;
  onSelect: (id: string) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const sprite = useStarSprite();
  const { geometry, lineGeometry, clusterGeometry } = useCosmicWeb();

  // Một lượt giãn nhãn cho CẢ mốc lẫn vỏ tỉ lệ. Phải nằm ở đây chứ không nằm
  // trong hai component con: hai lượt riêng thì không lượt nào biết lượt kia
  // đã chiếm chỗ nào, và đó chính là lỗi nhãn đè lên nhau.
  const labelSlots = useLabelSlots(locale, settings.showScales);
  const hiddenLabels = useLabelDeclutter(labelSlots, settings.showLabels);

  useFrame((_, delta) => {
    if (!group.current || !settings.playing) return;
    group.current.rotation.y += delta * 0.03 * settings.speed;
  });

  return (
    <group ref={group}>
      <points geometry={geometry}>
        <pointsMaterial
          map={sprite}
          size={0.075}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.75}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <points geometry={clusterGeometry}>
        <pointsMaterial
          map={sprite}
          size={0.5}
          sizeAttenuation
          color="#ffd9a8"
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {settings.showFilaments && (
        <lineSegments geometry={lineGeometry}>
          <lineBasicMaterial
            color="#5b7cff"
            transparent
            opacity={0.07}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}

      {settings.showScales && (
        <ScaleShells
          showLabels={settings.showLabels}
          hiddenLabels={hiddenLabels}
          locale={locale}
        />
      )}

      <Landmarks
        sprite={sprite}
        showLabels={settings.showLabels}
        hiddenLabels={hiddenLabels}
        locale={locale}
        onSelect={onSelect}
      />
    </group>
  );
}

/** Đưa camera về khoảng cách mà thanh tỉ lệ đang chọn. */
function ScaleRig({ distance }: { distance: number }) {
  const previous = useRef(distance);
  // Chỉ ép camera khi thanh tỉ lệ vừa đổi; xong thì trả quyền lại cho người xem
  const animating = useRef(false);

  if (previous.current !== distance) {
    previous.current = distance;
    animating.current = true;
  }

  useFrame(({ camera }, delta) => {
    if (!animating.current) return;

    const current = camera.position.length();
    if (Math.abs(current - distance) < 0.05) {
      animating.current = false;
      return;
    }

    const next = THREE.MathUtils.lerp(
      current,
      distance,
      Math.min(1, delta * 2),
    );
    camera.position.setLength(next);
  });

  return null;
}

export function UniverseScene({
  settings,
  locale,
  onSelect,
}: {
  settings: UniverseSettings;
  locale: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <Canvas
      /**
       * Đo khung bằng offsetWidth/offsetHeight thay vì getBoundingClientRect().
       *
       * Hành trình thu phóng đặt `transform: scale` lên đúng div bọc canvas để
       * hoà mờ giữa hai cấp. getBoundingClientRect() tính cả transform, nên lúc
       * mount canvas đo được kích thước đã bị thu nhỏ rồi giữ nguyên cỡ đó —
       * kết quả là cảnh 3D nằm gọn ở góc trên trái, chừa hai dải đen. offsetSize
       * đọc kích thước bố cục thật, không bị transform làm sai.
       */
      resize={{ offsetSize: true }}
      camera={{ position: [0, 8, 26], fov: 45, near: 0.1, far: 400 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
    >
      <color attach="background" args={["#02030a"]} />
      {/* Sương làm điểm ở xa chìm dần vào nền: không có nó thì mọi chấm sáng
          như nhau và cấu trúc trông phẳng như một mạng lưới hai chiều. */}
      <fog attach="fog" args={["#02030a", 14, 52]} />

      <Web
        settings={settings}
        locale={locale}
        onSelect={onSelect ?? (() => {})}
      />

      <ScaleRig distance={settings.distance} />

      {/* Khai báo thẳng thao tác chạm thay vì dựa vào mặc định: một ngón xoay,
          hai ngón vừa chụm để phóng to thu nhỏ vừa rê. Pan phải bật, nếu không
          thì cử chỉ hai ngón mặc định (DOLLY_PAN) bị vô hiệu một nửa. */}
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableDamping
        dampingFactor={0.06}
        minDistance={2}
        maxDistance={70}
        zoomSpeed={0.8}
        rotateSpeed={0.5}
        panSpeed={0.7}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
    </Canvas>
  );
}
