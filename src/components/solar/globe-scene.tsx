"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { useProgressiveTexture } from "@/components/solar/use-progressive-texture";

export type GlobeBody = {
  texture: string;
  /** Màu dùng khi bản đồ bề mặt chưa tải xong hoặc tải hỏng */
  fallbackColor: string;
  /** Độ nghiêng trục quay, tính bằng độ */
  axialTilt: number;
  /** Thiên thể tự phát sáng (Mặt Trời) thì không cần được chiếu sáng */
  emissive?: boolean;
  ring?: { inner: number; outer: number; color: string; opacity: number };
};

function Body({ body, spinning }: { body: GlobeBody; spinning: boolean }) {
  const ref = useRef<THREE.Group>(null);
  // Ảnh về tới đâu thay tới đó; chưa có thì quả cầu vẫn vẽ bằng màu phẳng,
  // nên trên mạng chậm người xem không bao giờ gặp một khung đen trống.
  const map = useProgressiveTexture(body.texture);

  useFrame((_, delta) => {
    if (ref.current && spinning) ref.current.rotation.y += delta * 0.18;
  });

  return (
    // Nghiêng trục đúng bằng độ nghiêng thật của thiên thể
    <group rotation={[THREE.MathUtils.degToRad(body.axialTilt), 0, 0]}>
      <group ref={ref}>
        <mesh>
          <sphereGeometry args={[1, 96, 96]} />
          {body.emissive ? (
            <meshBasicMaterial
              key={map ? "textured" : "flat"}
              map={map}
              color={map ? "#ffffff" : body.fallbackColor}
              toneMapped={false}
            />
          ) : (
            <meshStandardMaterial
              key={map ? "textured" : "flat"}
              map={map}
              color={map ? "#ffffff" : body.fallbackColor}
              roughness={0.92}
              metalness={0}
            />
          )}
        </mesh>

        {body.ring && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[body.ring.inner, body.ring.outer, 128]} />
            <meshBasicMaterial
              color={body.ring.color}
              transparent
              opacity={body.ring.opacity}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      {/* Trục quay, để thấy rõ độ nghiêng */}
      <mesh>
        <cylinderGeometry args={[0.004, 0.004, 2.9, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.28} />
      </mesh>
    </group>
  );
}

export function GlobeScene({
  body,
  spinning,
  distance = 3.2,
}: {
  body: GlobeBody;
  spinning: boolean;
  /**
   * Khoảng cách camera tới tâm quả cầu, đơn vị bán kính.
   *
   * Mặc định 3,2 cho vừa cả quả cầu vào khung. Hành trình thu phóng hạ xuống
   * ~1,25 để dựng cấp "châu lục": cùng một quả cầu, chỉ khác chỗ đứng — bề mặt
   * lúc đó lấp đầy khung nhìn đúng như khi bay thấp trên hành tinh.
   */
  distance?: number;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0.5, distance], fov: 42 }}
      dpr={[1, 2]}
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
    >
      <color attach="background" args={["#05070f"]} />

      {/* Mặt Trời tự sáng nên không cần đèn; các thiên thể khác lấy sáng từ
          một nguồn lệch bên để thấy được đường phân giới ngày–đêm. */}
      {!body.emissive && (
        <>
          <ambientLight intensity={0.22} />
          <directionalLight position={[4, 1.5, 3]} intensity={2.6} />
        </>
      )}

      <Body body={body} spinning={spinning} />

      <OrbitControls
        enablePan={false}
        minDistance={Math.min(1.15, distance * 0.9)}
        maxDistance={7}
        zoomSpeed={0.6}
        rotateSpeed={0.5}
      />
    </Canvas>
  );
}
