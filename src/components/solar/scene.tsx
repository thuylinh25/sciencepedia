"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

import { useProgressiveTexture } from "@/components/solar/use-progressive-texture";
import {
  PLANETS,
  SUN,
  realScaleOrbit,
  realScaleRadius,
  type Planet,
} from "@/lib/solar-data";

export type SceneSettings = {
  playing: boolean;
  speed: number;
  showOrbits: boolean;
  showLabels: boolean;
  realScale: boolean;
};

// ------------------------------------------------------------------ Mặt Trời

function Sun({ radius }: { radius: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const map = useProgressiveTexture(SUN.texture);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05;
  });

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial
          key={map ? "textured" : "flat"}
          map={map}
          color={map ? "#ffffff" : SUN.color}
          toneMapped={false}
        />
      </mesh>

      {/* Quầng sáng: hai lớp cầu trong suốt, rẻ hơn nhiều so với bloom pass */}
      <mesh scale={1.18}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial
          color="#ffd166"
          transparent
          opacity={0.18}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh scale={1.45}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial
          color="#ff9e2c"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
        />
      </mesh>

      {/* decay=2 là suy giảm theo bình phương khoảng cách, nên cường độ phải lớn
          để các hành tinh ở bán kính 20-45 đơn vị vẫn được chiếu sáng đủ. */}
      <pointLight intensity={6000} distance={0} decay={2} color="#fff2d0" />
    </group>
  );
}

// ------------------------------------------------------------------ Quỹ đạo

/**
 * Vòng quỹ đạo. Dùng <primitive> với THREE.Line vì thẻ <line> của R3F trùng tên
 * với phần tử SVG <line> và bị TypeScript hiểu nhầm.
 * Đối tượng được memo hoá — nếu tạo mới mỗi lần render, R3F sẽ gắn lại liên tục.
 */
function OrbitRing({ radius }: { radius: number }) {
  const line = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2);
    const points = curve
      .getPoints(180)
      .map((point) => new THREE.Vector3(point.x, 0, point.y));

    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.14,
      }),
    );
  }, [radius]);

  useEffect(() => {
    return () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    };
  }, [line]);

  return <primitive object={line} />;
}

// ------------------------------------------------------------------ Hành tinh

function PlanetBody({
  planet,
  settings,
  selected,
  onSelect,
  locale,
  realLongitude,
}: {
  planet: Planet;
  settings: SceneSettings;
  selected: boolean;
  onSelect: (id: string) => void;
  locale: string;
  /** Kinh độ hoàng đạo thật lấy từ JPL Horizons, radian; undefined thì dùng góc tượng trưng */
  realLongitude?: number;
}) {
  const orbitRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Mesh>(null);

  // Bản đồ bề mặt về tới đâu thay tới đó; trước khi có thì dùng màu phẳng.
  const map = useProgressiveTexture(planet.texture);

  const orbitRadius = settings.realScale
    ? realScaleOrbit(planet)
    : planet.orbitRadius;
  const radius = settings.realScale
    ? realScaleRadius(planet)
    : planet.displayRadius;

  /**
   * Góc xuất phát trên quỹ đạo.
   *
   * Có dữ liệu Horizons thì dùng kinh độ hoàng đạo thật, nên cấu hình các hành
   * tinh trong cảnh khớp với bầu trời hôm nay. Không có thì quay lại góc suy ra
   * từ id — cố định để các hành tinh không chồng lên nhau, nhưng không mang ý
   * nghĩa vật lý nào.
   */
  const startAngle = useMemo(() => {
    if (realLongitude !== undefined) return realLongitude;
    return (
      ([...planet.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360) *
      (Math.PI / 180)
    );
  }, [planet.id, realLongitude]);

  useFrame((_, delta) => {
    if (!settings.playing) return;
    const step = delta * settings.speed;

    if (orbitRef.current) {
      orbitRef.current.rotation.y += step * planet.orbitSpeed * 0.28;
    }
    if (spinRef.current) {
      spinRef.current.rotation.y += step * planet.spinSpeed * 0.6;
    }
  });

  return (
    <group ref={orbitRef} rotation={[0, startAngle, 0]}>
      <group position={[orbitRadius, 0, 0]}>
        <mesh
          ref={spinRef}
          rotation={[0, 0, THREE.MathUtils.degToRad(planet.axialTilt)]}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(planet.id);
          }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <sphereGeometry args={[radius, 48, 48]} />
          <meshStandardMaterial
            key={map ? "textured" : "flat"}
            map={map}
            color={map ? "#ffffff" : planet.color}
            emissive={planet.emissive ?? "#000000"}
            emissiveIntensity={planet.emissive ? 0.22 : 0}
            roughness={0.82}
            metalness={0.06}
          />
        </mesh>

        {/* Vành đai (Sao Thổ, Sao Thiên Vương) */}
        {planet.ring && (
          <mesh
            rotation={[
              Math.PI / 2 + THREE.MathUtils.degToRad(planet.axialTilt - 90),
              0,
              0,
            ]}
          >
            <ringGeometry
              args={[radius * planet.ring.inner, radius * planet.ring.outer, 96]}
            />
            <meshBasicMaterial
              color={planet.ring.color}
              transparent
              opacity={planet.ring.opacity}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Vòng sáng đánh dấu hành tinh đang chọn */}
        {selected && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius * 1.5, radius * 1.62, 64]} />
            <meshBasicMaterial color="#ffd166" side={THREE.DoubleSide} />
          </mesh>
        )}

        {settings.showLabels && (
          <Html
            position={[0, radius + 0.55, 0]}
            center
            distanceFactor={22}
            occlude={false}
            wrapperClass="pointer-events-none"
          >
            <span className="rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-white backdrop-blur-sm">
              {locale === "en" ? planet.nameEn : planet.name}
            </span>
          </Html>
        )}
      </group>
    </group>
  );
}

// ------------------------------------------------------------------ Cảnh

export function SolarScene({
  settings,
  selectedId,
  onSelect,
  locale,
  longitudes,
}: {
  settings: SceneSettings;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  locale: string;
  /** Kinh độ hoàng đạo thật theo id hành tinh, nếu lấy được từ JPL Horizons */
  longitudes?: Record<string, number>;
}) {
  const sunRadius = settings.realScale ? 2.2 : SUN.displayRadius;

  return (
    <Canvas
      camera={{ position: [0, 26, 52], fov: 45, near: 0.1, far: 2000 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={["#05070f"]} />
      <ambientLight intensity={0.28} />

      <Stars
        radius={220}
        depth={70}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={0.4}
      />

      <Sun radius={sunRadius} />

      {PLANETS.map((planet) => (
        <group key={planet.id}>
          {settings.showOrbits && (
            <OrbitRing
              radius={
                settings.realScale ? realScaleOrbit(planet) : planet.orbitRadius
              }
            />
          )}
          <PlanetBody
            planet={planet}
            settings={settings}
            selected={selectedId === planet.id}
            onSelect={onSelect}
            locale={locale}
            realLongitude={longitudes?.[planet.id]}
          />
        </group>
      ))}

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        minDistance={8}
        maxDistance={220}
        maxPolarAngle={Math.PI * 0.85}
      />
    </Canvas>
  );
}

export default SolarScene;
