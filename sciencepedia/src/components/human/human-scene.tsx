"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

/**
 * Chiều cao mẫu, mét. Đây là cấp cuối của hành trình thu phóng nên con số phải
 * khớp với `metres` của cấp "human" trong `zoom-levels.ts`.
 */
export const HUMAN_HEIGHT_M = 1.7;

/**
 * Mốc giải phẫu tính theo TỈ LỆ chiều cao, không phải mét.
 *
 * Lấy từ bảng thông số đoạn cơ thể của Drillis & Contini (1966), bảng vẫn được
 * dùng trong cơ sinh học để dựng mô hình người từ một chiều cao cho trước. Giữ
 * dạng tỉ lệ để đổi `HUMAN_HEIGHT_M` là cả hình tự dựng lại đúng, và để người
 * đọc code thấy ngay đây là số đo thật chứ không phải ước lượng bằng mắt.
 */
const F = {
  headHeight: 0.13,
  shoulder: 0.818,
  chest: 0.72,
  elbow: 0.63,
  wrist: 0.485,
  hip: 0.53,
  knee: 0.285,
  ankle: 0.039,
  /** Khoảng cách giữa hai mỏm cùng vai */
  shoulderBreadth: 0.259,
  hipBreadth: 0.191,
  footLength: 0.152,
} as const;

const H = HUMAN_HEIGHT_M;

const Y = {
  top: H,
  chin: H - F.headHeight * H,
  shoulder: F.shoulder * H,
  chest: F.chest * H,
  elbow: F.elbow * H,
  wrist: F.wrist * H,
  hip: F.hip * H,
  knee: F.knee * H,
  ankle: F.ankle * H,
};

/**
 * Tâm khớp vai nằm vào trong so với mỏm cùng vai, và tâm khớp háng nằm vào
 * trong so với mép hông. Treo chi đúng ngay mép ngoài thì tay dính vào thân
 * và hình mất luôn đường eo.
 */
const SHOULDER_X = (F.shoulderBreadth * H) / 2 - 0.035;
const HIP_X = (F.hipBreadth * H) / 2 - 0.07;

const SKIN = "#c8d0dc";
const ACCENT = "#f472b6";

function skinMaterial() {
  return (
    <meshStandardMaterial color={SKIN} roughness={0.72} metalness={0.04} />
  );
}

/**
 * Một đoạn chi, dựng bằng capsule nối hai điểm.
 *
 * `CapsuleGeometry` luôn nằm dọc trục y và lấy tâm ở gốc, nên phải tự xoay:
 * quaternion đưa +y về đúng hướng của đoạn, rồi đặt tâm vào trung điểm.
 */
function Limb({
  from,
  to,
  radius,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius: number;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    return {
      position: a.clone().add(b).multiplyScalar(0.5),
      quaternion: q,
      // Capsule cao length + 2·radius, trừ hai chỏm cầu ra mới đúng đoạn cần vẽ
      length: Math.max(dir.length() - radius * 2, 0.001),
    };
  }, [from, to, radius]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <capsuleGeometry args={[radius, length, 6, 20]} />
      {skinMaterial()}
    </mesh>
  );
}

/**
 * Thân mình, dựng bằng `LatheGeometry`: xoay một đường viền bán kính quanh
 * trục đứng rồi ép dẹt theo trục z.
 *
 * Xoay một đường viền cho ra bề mặt liền và mượt; ghép hộp với khối cầu rời sẽ
 * lộ mối nối và thành ra đồ chơi lắp ráp. Mặt cắt người là hình bầu dục chứ
 * không tròn nên scale z xuống 0,7 — ở vòng ngực, đó là chu vi khoảng 92 cm,
 * đúng cỡ một người trưởng thành cao 1,7 m.
 */
function Torso() {
  const geometry = useMemo(() => {
    const profile: Array<[number, number]> = [
      [0.012, 0.775],
      [0.105, 0.79],
      [0.148, 0.845],
      [0.162, Y.hip],
      [0.152, 0.955],
      [0.14, 1.04],
      [0.152, 1.14],
      [0.172, Y.chest],
      [0.185, 1.32],
      [0.175, Y.shoulder],
      [0.105, 1.43],
      [0.055, 1.452],
    ];
    return new THREE.LatheGeometry(
      profile.map(([x, y]) => new THREE.Vector2(x, y)),
      48,
    );
  }, []);

  return (
    <mesh geometry={geometry} scale={[1, 1, 0.7]}>
      {skinMaterial()}
    </mesh>
  );
}

function Figure({ spinning }: { spinning: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current && spinning) group.current.rotation.y += delta * 0.22;
  });

  const armX = SHOULDER_X;
  const footZ = (F.footLength * H) / 2 - 0.05;

  return (
    <group ref={group}>
      <Torso />

      {/* Cổ và đầu. Đầu là khối cầu ép ba trục: dài trước–sau, hẹp hai bên */}
      <Limb from={[0, 1.44, 0]} to={[0, 1.505, 0.004]} radius={0.053} />
      <mesh
        position={[0, (Y.chin + Y.top) / 2, 0.004]}
        scale={[0.075, 0.112, 0.094]}
      >
        <sphereGeometry args={[1, 40, 32]} />
        {skinMaterial()}
      </mesh>

      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Khối vai bo tròn chỗ tay nối vào thân */}
          <mesh
            position={[side * (armX - 0.01), Y.shoulder - 0.012, 0]}
            scale={[0.062, 0.055, 0.058]}
          >
            <sphereGeometry args={[1, 24, 20]} />
            {skinMaterial()}
          </mesh>

          <Limb
            from={[side * armX, Y.shoulder - 0.015, 0]}
            to={[side * (armX + 0.03), Y.elbow, 0.012]}
            radius={0.049}
          />
          <Limb
            from={[side * (armX + 0.03), Y.elbow, 0.012]}
            to={[side * (armX + 0.05), Y.wrist, 0.022]}
            radius={0.039}
          />
          {/* Bàn tay là một khối dẹt, không tách ngón: ở tỉ lệ toàn thân, ngón
              tay chỉ thành mấy chấm lởm chởm chứ không đọc ra là ngón */}
          <mesh
            position={[side * (armX + 0.055), Y.wrist - 0.085, 0.024]}
            scale={[0.032, 0.085, 0.055]}
          >
            <sphereGeometry args={[1, 20, 16]} />
            {skinMaterial()}
          </mesh>

          <Limb
            from={[side * HIP_X, Y.hip - 0.04, 0]}
            to={[side * (HIP_X + 0.005), Y.knee, 0.004]}
            radius={0.074}
          />
          <Limb
            from={[side * (HIP_X + 0.005), Y.knee, 0.004]}
            to={[side * (HIP_X + 0.002), Y.ankle + 0.02, -0.004]}
            radius={0.053}
          />
          <mesh position={[side * (HIP_X + 0.002), Y.ankle + 0.012, footZ]}>
            <boxGeometry args={[0.088, 0.062, F.footLength * H]} />
            {skinMaterial()}
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Thước đo dựng cạnh hình người.
 *
 * Cột và vạch đều là khối đặc chứ không phải `<line>`: WebGL ghim `linewidth`
 * ở 1 pixel trên gần hết trình duyệt, nên đường kẻ không dày lên khi phóng to
 * và mảnh như sợi tóc khi thu nhỏ. Khối đặc có bề rộng thật trong cảnh nên co
 * giãn cùng mọi thứ khác — đúng việc một cái thước phải làm.
 */
function Ruler({ locale }: { locale: string }) {
  const fmt = (value: number) =>
    `${value.toFixed(1).replace(".", locale === "en" ? "." : ",")} m`;

  const ticks = useMemo(() => {
    const out: Array<{ y: number; major: boolean }> = [];
    for (let i = 1; i * 0.1 < H - 1e-6; i += 1) {
      const y = Number((i * 0.1).toFixed(1));
      out.push({ y, major: Math.abs(y * 2 - Math.round(y * 2)) < 1e-6 });
    }
    return out;
  }, []);

  return (
    <group position={[-0.58, 0, 0]}>
      <mesh position={[0, H / 2, 0]}>
        <cylinderGeometry args={[0.005, 0.005, H, 8]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.55} />
      </mesh>

      {ticks.map(({ y, major }) => (
        <mesh key={y} position={[major ? 0.035 : 0.018, y, 0]}>
          <boxGeometry args={[major ? 0.07 : 0.036, 0.006, 0.006]} />
          <meshBasicMaterial
            color={ACCENT}
            transparent
            opacity={major ? 0.6 : 0.3}
          />
        </mesh>
      ))}

      {/* Vạch đỉnh: chốt đúng con số mà cấp này nói tới */}
      <mesh position={[0.05, H, 0]}>
        <boxGeometry args={[0.1, 0.009, 0.009]} />
        <meshBasicMaterial color={ACCENT} toneMapped={false} />
      </mesh>

      <Html position={[-0.04, H, 0]} center distanceFactor={2.2}>
        <span className="rounded-full border border-pink-300/50 bg-pink-400/15 px-2 py-0.5 font-mono text-[11px] whitespace-nowrap text-pink-100 backdrop-blur">
          {fmt(H)}
        </span>
      </Html>

      {[0.5, 1, 1.5].map((value) => (
        <Html
          key={value}
          position={[-0.05, value, 0]}
          center
          distanceFactor={2.2}
        >
          <span className="font-mono text-[10px] whitespace-nowrap text-white/45">
            {fmt(value)}
          </span>
        </Html>
      ))}
    </group>
  );
}

/**
 * Cấp cuối của hành trình thu phóng: một con người, dựng bằng hình học thủ tục
 * thay vì minh hoạ bằng ảnh.
 *
 * Không nạp model GLTF nào. Hình sinh ra từ chính bảng tỉ lệ nhân trắc phía
 * trên, nên nó vừa không kéo theo một tệp nhị phân vài MB kèm một giấy phép
 * phải đi kiểm, vừa đúng tỉ lệ theo nghĩa đo được — đúng điều cấp này cần nói:
 * mọi con số ở sáu cấp trên đều do sinh vật cao 1,7 m này đo ra.
 */
export function HumanScene({
  locale,
  spinning = true,
  interactive = true,
}: {
  locale: string;
  spinning?: boolean;
  /** Xem chú thích cùng tên ở `GlobeScene` — tắt ở chỗ hình chỉ để trang trí */
  interactive?: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0.55, 1.15, 3.05], fov: 42 }}
      dpr={[1, 2]}
      /*
       * Đo khung bằng offsetWidth/offsetHeight. Hành trình thu phóng đặt
       * `transform: scale` lên đúng div bọc canvas để hoà mờ giữa hai cấp, mà
       * getBoundingClientRect() tính cả transform nên sẽ đo nhầm kích thước đã
       * bị thu nhỏ rồi giữ nguyên cỡ đó. Xem chú thích dài ở `GlobeScene`.
       */
      resize={{ offsetSize: true }}
    >
      <color attach="background" args={["#05070f"]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4.5, 3]} intensity={2.2} />
      {/* Đèn viền phía sau tách bóng người ra khỏi nền đen */}
      <directionalLight
        position={[-3, 2, -2.5]}
        intensity={0.9}
        color={ACCENT}
      />

      <Figure spinning={spinning} />
      <Ruler locale={locale} />

      {/* Lưới ô 10 cm: đặt ngay dưới chân một đơn vị đo mà mắt đọc được */}
      <gridHelper
        args={[4, 40, "#1e293b", "#131c2e"]}
        position={[0, 0.001, 0]}
      />

      {interactive && (
        <OrbitControls
          target={[0, 0.85, 0]}
          enablePan={false}
          minDistance={0.9}
          maxDistance={7}
          // Chặn camera chui xuống dưới sàn, ở đó chỉ thấy mặt lưng của lưới
          maxPolarAngle={Math.PI / 2 - 0.05}
          zoomSpeed={0.6}
          rotateSpeed={0.5}
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        />
      )}
    </Canvas>
  );
}
