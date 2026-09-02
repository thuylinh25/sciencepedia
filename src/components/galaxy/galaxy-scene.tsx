"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Stars } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

import { cn } from "@/lib/utils";
import {
  ARM_COUNT,
  ARM_SPIN,
  BULGE_RADIUS,
  DISK_RADIUS,
  DISK_THICKNESS,
  GALAXY_FEATURES,
  SUN_RADIUS_UNITS,
} from "@/lib/galaxy-data";

export type CameraView = "top" | "side" | "free";

export type GalaxySettings = {
  playing: boolean;
  speed: number;
  showLabels: boolean;
  showSun: boolean;
  view: CameraView;
};

/**
 * Ba góc máy đặt sẵn. "free" không ép vị trí — người xem tự xoay, phóng to và
 * rê (giữ chuột phải hoặc hai ngón) tuỳ ý.
 *
 * Vị trí camera cho "top" và "side" được lerp tới chứ không đặt đột ngột: nhảy
 * cắt làm mất hoàn toàn cảm giác không gian, còn chuyển động mượt cho người
 * xem thấy đĩa xoay từ mặt phẳng ngang sang nhìn thẳng xuống.
 */
const VIEW_POSITIONS: Record<Exclude<CameraView, "free">, THREE.Vector3> = {
  top: new THREE.Vector3(0, 21, 0.01),
  side: new THREE.Vector3(0, 0.4, 23),
};

/** Xấp xỉ phân phối chuẩn bằng tổng ba số ngẫu nhiên đều — đủ tốt và rất rẻ. */
function gaussian(): number {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
}

const CORE_COLOR = new THREE.Color("#ffe0ad");
const MID_COLOR = new THREE.Color("#dfe4ff");
const ARM_COLOR = new THREE.Color("#7fa8ff");

/**
 * Sprite tròn mềm dùng chung cho mọi lớp điểm.
 *
 * Mặc định `pointsMaterial` vẽ mỗi điểm thành một hình vuông đặc — với hàng
 * chục nghìn điểm thì kết quả trông như nhiễu hạt chứ không ra sao. Một
 * gradient tròn mờ dần ở rìa cho mỗi điểm một quầng sáng nhỏ, và khi cộng dồn
 * theo kiểu additive thì các vùng dày đặc tự sáng lên thành mảng liền.
 */
function useStarSprite(): THREE.Texture {
  return useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      const half = size / 2;
      const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.2, "rgba(255,255,255,0.75)");
      gradient.addColorStop(0.45, "rgba(255,255,255,0.22)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

/** Quầng sáng khuếch tán của đĩa — lấp khoảng trống giữa các điểm sao. */
function useHazeTexture(): THREE.Texture {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      const half = size / 2;
      const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
      gradient.addColorStop(0, "rgba(255,226,178,0.55)");
      gradient.addColorStop(0.12, "rgba(255,206,150,0.30)");
      gradient.addColorStop(0.35, "rgba(176,190,255,0.13)");
      gradient.addColorStop(0.7, "rgba(120,150,255,0.05)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

/**
 * Một lớp sao của đĩa, rải theo bốn nhánh xoắn ốc loga.
 *
 * Đĩa được dựng bằng ba lớp có kích thước điểm khác nhau thay vì một lớp duy
 * nhất: sao thật không đều nhau về độ sáng, và một lớp đồng cỡ trông rất giả.
 * `spread` hẹp ở trong và loe dần ra ngoài nên hình xoắn rõ ở giữa, nhoè ở rìa
 * — đúng như ảnh chụp các thiên hà xoắn ốc.
 */
function useDiskGeometry(count: number, spreadScale: number) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scratch = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      // luỹ thừa < 1 dồn nhiều sao về phía trong
      const t = Math.pow(Math.random(), 0.62);
      const radius = t * DISK_RADIUS;

      const arm = ((i % ARM_COUNT) / ARM_COUNT) * Math.PI * 2;
      const spin = radius * ARM_SPIN * Math.PI;
      const spread = (0.09 + 0.45 * t) * spreadScale;
      const angle = arm + spin + gaussian() * spread;

      const jitter = gaussian() * 0.18 * (0.4 + t);
      positions[i * 3] = Math.cos(angle) * radius + jitter;
      // đĩa phồng ở tâm, mỏng dần ra rìa
      positions[i * 3 + 1] =
        gaussian() * DISK_THICKNESS * (1 + 4 * Math.exp(-radius / 1.8));
      positions[i * 3 + 2] = Math.sin(angle) * radius + jitter;

      // vàng ở lõi → trắng → xanh ra rìa
      scratch
        .copy(CORE_COLOR)
        .lerp(MID_COLOR, Math.min(1, t * 1.9))
        .lerp(ARM_COLOR, Math.max(0, t * 1.5 - 0.45));

      const dim = 0.5 + Math.random() * 0.5;
      colors[i * 3] = scratch.r * dim;
      colors[i * 3 + 1] = scratch.g * dim;
      colors[i * 3 + 2] = scratch.b * dim;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [count, spreadScale]);
}

/** Phần phình trung tâm: đám sao già hình thanh dẹt, màu vàng cam. */
function useBulgeGeometry(count: number) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scratch = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      const r = Math.pow(Math.random(), 0.45) * BULGE_RADIUS;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.4;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * 0.72;

      scratch.setHSL(0.095, 0.8, 0.55 + Math.random() * 0.32);
      colors[i * 3] = scratch.r;
      colors[i * 3 + 1] = scratch.g;
      colors[i * 3 + 2] = scratch.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [count]);
}

/** Quầng thiên hà: các cụm sao cầu rải thưa quanh đĩa. */
function useHaloGeometry(count: number) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const r = BULGE_RADIUS + Math.pow(Math.random(), 0.4) * DISK_RADIUS * 1.15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [count]);
}

function StarLayer({
  geometry,
  sprite,
  size,
  opacity,
}: {
  geometry: THREE.BufferGeometry;
  sprite: THREE.Texture;
  size: number;
  opacity: number;
}) {
  return (
    <points geometry={geometry}>
      <pointsMaterial
        map={sprite}
        size={size}
        sizeAttenuation
        vertexColors
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Galaxy({
  settings,
  onSelect,
  locale,
}: {
  settings: GalaxySettings;
  onSelect: (id: string | null) => void;
  locale: string;
}) {
  const group = useRef<THREE.Group>(null);
  const sprite = useStarSprite();
  const haze = useHazeTexture();

  // Ba lớp: nhiều sao mờ nhỏ, ít sao vừa, rất ít sao sáng to
  const faint = useDiskGeometry(34_000, 1);
  const medium = useDiskGeometry(11_000, 0.85);
  const bright = useDiskGeometry(2_200, 0.7);
  const bulge = useBulgeGeometry(9_000);
  const halo = useHaloGeometry(600);

  useFrame((_, delta) => {
    if (!group.current || !settings.playing) return;
    // Thiên hà quay rất chậm; đây chỉ là tốc độ để nhìn cho dễ.
    group.current.rotation.y -= delta * 0.035 * settings.speed;
  });

  const sun = GALAXY_FEATURES.find((feature) => feature.id === "sun");

  return (
    <group ref={group}>
      {/* Quầng khuếch tán nằm dưới các lớp sao, cho đĩa có nền sáng liền mạch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DISK_RADIUS * 2.7, DISK_RADIUS * 2.7]} />
        <meshBasicMaterial
          map={haze}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <StarLayer geometry={faint} sprite={sprite} size={0.055} opacity={0.55} />
      <StarLayer geometry={medium} sprite={sprite} size={0.11} opacity={0.7} />
      <StarLayer geometry={bright} sprite={sprite} size={0.24} opacity={0.9} />

      <points geometry={bulge}>
        <pointsMaterial
          map={sprite}
          size={0.085}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.75}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <points geometry={halo}>
        <pointsMaterial
          map={sprite}
          size={0.13}
          sizeAttenuation
          color="#c3cdff"
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Lõi rực sáng quanh Sagittarius A* — ba lớp quầng lồng nhau */}
      <mesh onClick={() => onSelect("core")}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial color="#fff6df" toneMapped={false} />
      </mesh>
      {[
        { scale: 2.4, color: "#ffd8a0", opacity: 0.3 },
        { scale: 5, color: "#ffb45e", opacity: 0.12 },
        { scale: 9, color: "#ff8f3c", opacity: 0.05 },
      ].map((layer) => (
        <mesh key={layer.scale} scale={layer.scale}>
          <sphereGeometry args={[0.3, 24, 24]} />
          <meshBasicMaterial
            color={layer.color}
            transparent
            opacity={layer.opacity}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {settings.showSun && sun && (
        <SunMarker sprite={sprite} onSelect={onSelect} />
      )}

      {settings.showLabels &&
        GALAXY_FEATURES.map((feature) => {
          const isSun = feature.id === "sun";
          const height = feature.id === "core" ? 0.9 : isSun ? LABEL_HEIGHT : 0.35;
          return (
            <Html
              key={feature.id}
              position={[
                Math.cos(feature.angle) * feature.radius,
                height,
                Math.sin(feature.angle) * feature.radius,
              ]}
              center
              distanceFactor={14}
              zIndexRange={[20, 0]}
            >
              <button
                type="button"
                onClick={() => onSelect(feature.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap backdrop-blur transition-colors",
                  isSun
                    ? "border-yellow-300/70 bg-yellow-300/15 hover:border-yellow-200"
                    : "border-white/25 bg-black/60 hover:border-white/70",
                )}
                style={{ color: feature.color }}
              >
                {isSun ? "☀ " : ""}
                {locale === "en" ? feature.nameEn : feature.name}
              </button>
            </Html>
          );
        })}
    </group>
  );
}

/** Chiều cao của nhãn Mặt Trời so với mặt phẳng đĩa. */
const LABEL_HEIGHT = 1.6;

/**
 * Đánh dấu vị trí Mặt Trời.
 *
 * Chỉ một chấm sáng thì lẫn hẳn vào hàng chục nghìn chấm sáng khác, còn nhãn
 * treo lơ lửng phía trên lại khiến người xem tưởng Mặt Trời nằm ở chỗ cái nhãn.
 * Nên ở đây có ba thứ cùng lúc: một đường dẫn nối nhãn xuống đúng vị trí, một
 * vòng sáng đập nhịp, và quầng vàng quanh chấm.
 */
function SunMarker({
  sprite,
  onSelect,
}: {
  sprite: THREE.Texture;
  onSelect: (id: string) => void;
}) {
  const ring = useRef<THREE.Mesh>(null);
  const sun = GALAXY_FEATURES.find((feature) => feature.id === "sun");

  useFrame(({ clock }) => {
    if (!ring.current) return;
    // Nhịp đập 2 giây: to dần rồi mờ đi, lặp lại
    const phase = (clock.elapsedTime % 2) / 2;
    const scale = 1 + phase * 2.6;
    ring.current.scale.setScalar(scale);
    const material = ring.current.material as THREE.Material;
    material.opacity = 0.55 * (1 - phase);
  });

  if (!sun) return null;

  const x = Math.cos(sun.angle) * SUN_RADIUS_UNITS;
  const z = Math.sin(sun.angle) * SUN_RADIUS_UNITS;

  return (
    <group position={[x, 0, z]}>
      {/* Đường dẫn từ nhãn xuống đúng vị trí trong đĩa */}
      <mesh position={[0, LABEL_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, LABEL_HEIGHT, 6]} />
        <meshBasicMaterial color="#fde047" transparent opacity={0.45} />
      </mesh>

      {/* Vòng sáng đập nhịp */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.26, 48]} />
        <meshBasicMaterial
          color="#fde047"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh
        onClick={() => onSelect("sun")}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <sphereGeometry args={[0.1, 20, 20]} />
        <meshBasicMaterial color="#fff8c4" toneMapped={false} />
      </mesh>

      <sprite scale={[1.1, 1.1, 1.1]}>
        <spriteMaterial
          map={sprite}
          color="#ffe066"
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  );
}

/**
 * Đưa camera về góc đặt sẵn khi người xem đổi chế độ.
 *
 * Chuyển động được nội suy dần thay vì nhảy cắt: nhìn thấy đĩa nghiêng dần từ
 * mặt phẳng ngang lên thẳng đứng chính là thứ cho biết đây là vật thể ba chiều
 * chứ không phải một tấm ảnh. Khi tới đủ gần đích thì ngừng ép, trả quyền điều
 * khiển lại cho người xem.
 */
function CameraRig({
  view,
  controls,
}: {
  view: CameraView;
  controls: React.RefObject<OrbitControlsImpl | null>;
}) {
  const settled = useRef(true);
  const previous = useRef<CameraView>(view);

  if (previous.current !== view) {
    previous.current = view;
    settled.current = view === "free";
  }

  useFrame(({ camera }, delta) => {
    if (settled.current || view === "free") return;

    const target = VIEW_POSITIONS[view];
    camera.position.lerp(target, Math.min(1, delta * 2.4));
    controls.current?.target.lerp(new THREE.Vector3(0, 0, 0), Math.min(1, delta * 2.4));
    controls.current?.update();

    if (camera.position.distanceTo(target) < 0.15) {
      camera.position.copy(target);
      settled.current = true;
    }
  });

  return null;
}

export function GalaxyScene({
  settings,
  onSelect,
  locale,
}: {
  settings: GalaxySettings;
  onSelect: (id: string | null) => void;
  locale: string;
}) {
  const controls = useRef<OrbitControlsImpl>(null);

  return (
    <Canvas
      camera={{ position: [0, 13, 16], fov: 45 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={["#03050c"]} />

      {/* Nền sao xa, cho cảm giác chiều sâu — giống trang Hệ Mặt Trời */}
      <Stars
        radius={90}
        depth={60}
        count={2600}
        factor={3}
        saturation={0}
        fade
        speed={0.2}
      />

      <Galaxy settings={settings} onSelect={onSelect} locale={locale} />

      <CameraRig view={settings.view} controls={controls} />

      {/* Rê được bằng chuột phải hoặc hai ngón: không có nó thì thiên hà luôn
          nằm giữa khung và người xem không bao giờ bay vào trong đĩa được. */}
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.06}
        minDistance={1.5}
        maxDistance={60}
        zoomSpeed={0.8}
        rotateSpeed={0.55}
        panSpeed={0.7}
      />
    </Canvas>
  );
}
