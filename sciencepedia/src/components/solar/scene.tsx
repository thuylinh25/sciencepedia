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
      ([...planet.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
        360) *
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
              args={[
                radius * planet.ring.inner,
                radius * planet.ring.outer,
                96,
              ]}
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
  interactive = true,
  transparent = false,
  cameraDistance,
  lowPower = false,
}: {
  settings: SceneSettings;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  locale: string;
  /**
   * Cho phép xoay/thu phóng bằng chuột. Tắt ở những chỗ cảnh chỉ là hình minh
   * hoạ — OrbitControls bắt sự kiện wheel trên canvas, nên để bật trong một
   * khối trang trí giữa trang sẽ khiến người đọc đưa con trỏ qua đó rồi cuộn
   * mà trang đứng im. Lỗi đó rất khó đoán ra nguyên nhân.
   */
  interactive?: boolean;
  /**
   * Bỏ nền đen của cảnh để canvas hoà vào nền phía sau. Trang Hệ Mặt Trời cần
   * nền đen riêng; khối giới thiệu ở trang chủ đã có nền vũ trụ của nó và một
   * hình chữ nhật đen đè lên sẽ lộ mép.
   */
  transparent?: boolean;
  /**
   * Đẩy camera ra xa để cả đĩa lọt khung. Mặc định (không truyền) giữ nguyên
   * góc máy của trang /solar-system.
   *
   * Cần cho khối xem trước ở trang chủ: khung ở đó hẹp hơn nhiều, và ở khoảng
   * cách mặc định thì quỹ đạo ngoài chạy ra khỏi mép canvas — hành tinh đi qua
   * đó bị **cắt cụt theo một đường thẳng đứng**, trông như lỗi render.
   */
  cameraDistance?: number;
  /**
   * Hạ chi phí dựng hình cho màn hình nhỏ.
   *
   * Điện thoại có mật độ điểm ảnh cao nhất nhưng GPU yếu nhất, nên `dpr` 2 ở
   * đó là dựng gấp bốn số điểm ảnh trên phần cứng kém gấp mấy lần — đúng tổ hợp
   * làm cảnh tụt khung hình và máy nóng lên. Ghim `dpr` 1.25 và giảm số sao là
   * hai chỗ đắt nhất, trong khi hình dạng cảnh không đổi.
   *
   * KHÔNG bớt hành tinh hay bỏ texture: người xem trên điện thoại phải thấy
   * cùng một Hệ Mặt Trời với người xem trên máy tính, chỉ khác độ mịn.
   */
  lowPower?: boolean;
  /** Kinh độ hoàng đạo thật theo id hành tinh, nếu lấy được từ JPL Horizons */
  longitudes?: Record<string, number>;
}) {
  const sunRadius = settings.realScale ? 2.2 : SUN.displayRadius;

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
      camera={{
        position: cameraDistance
          ? [0, cameraDistance * 0.5, cameraDistance]
          : [0, 26, 52],
        fov: 45,
        near: 0.1,
        far: 2000,
      }}
      dpr={lowPower ? [1, 1.25] : [1, 2]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        alpha: transparent,
      }}
      onPointerMissed={() => onSelect(null)}
    >
      {!transparent && <color attach="background" args={["#05070f"]} />}
      <ambientLight intensity={0.28} />

      {/* Lớp sao chạy ở MỌI trường hợp, kể cả khung trong suốt.

          Từng bị tắt khi `transparent` để trị một mảng sáng cạnh thẳng ở mép
          canvas. Chẩn đoán đó sai: mảng sáng đến từ nền đục và mặt nạ toả
          tròn, cả hai đã gỡ. Tắt lớp sao chỉ làm khối mất hết chiều sâu — đã
          bị báo "mất hết hiệu ứng ngôi sao xung quanh".

          `fade` bật sẵn nên sao ở xa mờ dần, không tạo cạnh cứng. */}
      <Stars
        radius={220}
        depth={70}
        count={lowPower ? 1800 : 5000}
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

      {interactive && (
        <OrbitControls
          enablePan
          enableDamping
          dampingFactor={0.06}
          minDistance={8}
          maxDistance={220}
          maxPolarAngle={Math.PI * 0.85}
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        />
      )}
    </Canvas>
  );
}

export default SolarScene;
