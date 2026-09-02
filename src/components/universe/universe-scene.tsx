"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
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
  locale,
  onSelect,
}: {
  sprite: THREE.Texture;
  showLabels: boolean;
  locale: string;
  onSelect: (id: string) => void;
}) {
  const pulse = useRef<THREE.Mesh>(null);

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

            {showLabels && (
              <Html
                position={[0, home ? 0.75 : 0.45, 0]}
                center
                distanceFactor={22}
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
  locale,
}: {
  showLabels: boolean;
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
          {showLabels && (
            <Html
              position={[
                0,
                (scale.radius as number) * 0.72,
                (scale.radius as number) * 0.72,
              ]}
              center
              distanceFactor={18}
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
        <ScaleShells showLabels={settings.showLabels} locale={locale} />
      )}

      <Landmarks
        sprite={sprite}
        showLabels={settings.showLabels}
        locale={locale}
        onSelect={onSelect}
      />
    </group>
  );
}

/** Đưa camera về khoảng cách mà thanh tỉ lệ đang chọn. */
function ScaleRig({ distance }: { distance: number }) {
  useFrame(({ camera }, delta) => {
    const current = camera.position.length();
    if (Math.abs(current - distance) < 0.05) return;
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

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        minDistance={4}
        maxDistance={60}
        zoomSpeed={0.7}
        rotateSpeed={0.5}
      />
    </Canvas>
  );
}
