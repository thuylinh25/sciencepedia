"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

import {
  ARM_COUNT,
  ARM_SPIN,
  BULGE_RADIUS,
  DISK_RADIUS,
  DISK_THICKNESS,
  GALAXY_FEATURES,
  SUN_RADIUS_UNITS,
} from "@/lib/galaxy-data";

export type GalaxySettings = {
  playing: boolean;
  speed: number;
  showLabels: boolean;
  showSun: boolean;
  edgeOn: boolean;
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

      {/* Vị trí Mặt Trời */}
      {settings.showSun && sun && (
        <group
          position={[
            Math.cos(sun.angle) * SUN_RADIUS_UNITS,
            0,
            Math.sin(sun.angle) * SUN_RADIUS_UNITS,
          ]}
        >
          <mesh onClick={() => onSelect("sun")}>
            <sphereGeometry args={[0.09, 20, 20]} />
            <meshBasicMaterial color="#fff3b0" toneMapped={false} />
          </mesh>
          <sprite scale={[0.9, 0.9, 0.9]}>
            <spriteMaterial
              map={sprite}
              color="#ffe066"
              transparent
              opacity={0.8}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
        </group>
      )}

      {settings.showLabels &&
        GALAXY_FEATURES.map((feature) => (
          <Html
            key={feature.id}
            position={[
              Math.cos(feature.angle) * feature.radius,
              feature.id === "core" ? 0.75 : 0.35,
              Math.sin(feature.angle) * feature.radius,
            ]}
            center
            distanceFactor={14}
            zIndexRange={[20, 0]}
          >
            <button
              type="button"
              onClick={() => onSelect(feature.id)}
              className="rounded-full border border-white/25 bg-black/60 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap backdrop-blur transition-colors hover:border-white/70"
              style={{ color: feature.color }}
            >
              {locale === "en" ? feature.nameEn : feature.name}
            </button>
          </Html>
        ))}
    </group>
  );
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
  return (
    <Canvas
      camera={{
        // Nhìn nghiêng khi mặc định, gần như ngang đĩa khi bật "nhìn cạnh"
        position: settings.edgeOn ? [0, 0.5, 23] : [0, 13, 16],
        fov: 45,
      }}
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

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        minDistance={3}
        maxDistance={45}
        zoomSpeed={0.7}
        rotateSpeed={0.55}
      />
    </Canvas>
  );
}
