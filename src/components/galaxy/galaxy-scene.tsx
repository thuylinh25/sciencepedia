"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
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

const CORE_COLOR = new THREE.Color("#ffd9a0");
const MID_COLOR = new THREE.Color("#cbd5ff");
const ARM_COLOR = new THREE.Color("#7aa2ff");

/**
 * Đĩa sao: các điểm rải theo bốn nhánh xoắn ốc loga.
 *
 * Mỗi ngôi sao được đặt trên nhánh gần nhất rồi cộng thêm nhiễu tăng dần theo
 * bán kính — ở gần tâm nhánh gần như chồng lên nhau, ra ngoài rìa chúng loe ra.
 * Đó là lý do hình xoắn ốc rõ ở giữa và nhoè dần ra biên, giống ảnh thật.
 */
function useDiskGeometry(count: number) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scratch = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      // luỹ thừa < 1 dồn nhiều sao về phía trong
      const t = Math.pow(Math.random(), 0.65);
      const radius = t * DISK_RADIUS;

      const arm = (i % ARM_COUNT) / ARM_COUNT * Math.PI * 2;
      const spin = radius * ARM_SPIN * Math.PI;
      // nhiễu ngang: hẹp ở trong, loe ra ngoài
      const spread = 0.12 + 0.55 * t;
      const angle = arm + spin + gaussian() * spread;

      const jitter = gaussian() * 0.25 * (0.4 + t);
      const x = Math.cos(angle) * radius + jitter;
      const z = Math.sin(angle) * radius + jitter;
      // đĩa dày hơn ở tâm, mỏng dần ra rìa
      const y = gaussian() * DISK_THICKNESS * (1 + 3 * Math.exp(-radius / 2));

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // vàng ở lõi → trắng xanh ra rìa
      scratch
        .copy(CORE_COLOR)
        .lerp(MID_COLOR, Math.min(1, t * 1.8))
        .lerp(ARM_COLOR, Math.max(0, t * 1.4 - 0.4));
      const dim = 0.55 + Math.random() * 0.45;
      colors[i * 3] = scratch.r * dim;
      colors[i * 3 + 1] = scratch.g * dim;
      colors[i * 3 + 2] = scratch.b * dim;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [count]);
}

/** Phần phình trung tâm: đám sao già hình cầu dẹt, màu vàng cam. */
function useBulgeGeometry(count: number) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scratch = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      const r = Math.pow(Math.random(), 0.5) * BULGE_RADIUS;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      // nén theo trục đứng để thành hình thanh dẹt chứ không phải quả cầu
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.45;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * 0.75;

      scratch.setHSL(0.09, 0.75, 0.55 + Math.random() * 0.3);
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
  const disk = useDiskGeometry(48_000);
  const bulge = useBulgeGeometry(9_000);
  const halo = useHaloGeometry(700);

  useFrame((_, delta) => {
    if (!group.current || !settings.playing) return;
    // Thiên hà quay rất chậm; đây chỉ là tốc độ để nhìn cho dễ.
    group.current.rotation.y -= delta * 0.035 * settings.speed;
  });

  const sun = GALAXY_FEATURES.find((feature) => feature.id === "sun");

  return (
    <group ref={group}>
      <points geometry={disk}>
        <pointsMaterial
          size={0.035}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <points geometry={bulge}>
        <pointsMaterial
          size={0.05}
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
          size={0.06}
          sizeAttenuation
          color="#b9c6ff"
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Lõi sáng rực quanh Sagittarius A* */}
      <mesh onClick={() => onSelect("core")}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshBasicMaterial color="#fff0c8" toneMapped={false} />
      </mesh>
      <mesh scale={2.6}>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial
          color="#ffb347"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>

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
            <sphereGeometry args={[0.11, 20, 20]} />
            <meshBasicMaterial color="#fde047" toneMapped={false} />
          </mesh>
          <mesh scale={2.4}>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshBasicMaterial
              color="#fde047"
              transparent
              opacity={0.25}
              side={THREE.BackSide}
            />
          </mesh>
        </group>
      )}

      {settings.showLabels &&
        GALAXY_FEATURES.map((feature) => (
          <Html
            key={feature.id}
            position={[
              Math.cos(feature.angle) * feature.radius,
              feature.id === "core" ? 0.55 : 0.3,
              Math.sin(feature.angle) * feature.radius,
            ]}
            center
            distanceFactor={14}
            zIndexRange={[20, 0]}
          >
            <button
              type="button"
              onClick={() => onSelect(feature.id)}
              className="rounded-full border border-white/25 bg-black/55 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-white/85 backdrop-blur transition-colors hover:border-white/60 hover:text-white"
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
        // Nhìn nghiêng khi ở chế độ mặc định, gần như ngang đĩa khi bật "nhìn cạnh"
        position: settings.edgeOn ? [0, 0.6, 24] : [0, 14, 17],
        fov: 45,
      }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: false }}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={["#04060e"]} />
      <ambientLight intensity={0.4} />

      <Galaxy settings={settings} onSelect={onSelect} locale={locale} />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={45}
        zoomSpeed={0.7}
        rotateSpeed={0.55}
      />
    </Canvas>
  );
}
