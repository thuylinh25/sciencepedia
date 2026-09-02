"use client";

import { useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export type GlobeBody = {
  texture: string;
  /** Độ nghiêng trục quay, tính bằng độ */
  axialTilt: number;
  /** Thiên thể tự phát sáng (Mặt Trời) thì không cần được chiếu sáng */
  emissive?: boolean;
  ring?: { inner: number; outer: number; color: string; opacity: number };
};

function Body({ body, spinning }: { body: GlobeBody; spinning: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const map = useLoader(THREE.TextureLoader, body.texture);

  // Ảnh equirectangular cần không gian màu sRGB, nếu không sẽ bị nhợt màu
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

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
            <meshBasicMaterial map={map} toneMapped={false} />
          ) : (
            <meshStandardMaterial map={map} roughness={0.92} metalness={0} />
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
}: {
  body: GlobeBody;
  spinning: boolean;
}) {
  return (
    <Canvas camera={{ position: [0, 0.5, 3.2], fov: 42 }} dpr={[1, 2]}>
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
        minDistance={1.6}
        maxDistance={7}
        zoomSpeed={0.6}
        rotateSpeed={0.5}
      />
    </Canvas>
  );
}
