"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
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
  /**
   * Bản đồ mây, dùng làm `alphaMap` cho một vỏ cầu thứ hai.
   *
   * Tuỳ chọn và hiện chỉ Trái Đất có. Không phải vì các hành tinh khác không
   * có mây — Sao Kim phủ kín mây, Sao Mộc gần như toàn mây — mà vì bản đồ bề
   * mặt của chúng ĐÃ LÀ ảnh chụp tầng mây. Chồng thêm một lớp nữa lên đó là
   * vẽ mây hai lần.
   */
  clouds?: string;
  /**
   * Quầng khí quyển ở rìa đĩa. Chỉ đặt cho thiên thể thật sự có khí quyển
   * nhìn thấy được từ ngoài.
   */
  atmosphere?: { color: string; intensity?: number };
};

/**
 * Vỏ khí quyển — một mặt cầu lớn hơn hành tinh, vẽ MẶT TRONG.
 *
 * ## Vì sao `BackSide` chứ không `FrontSide`
 *
 * Vẽ mặt trong nghĩa là mảnh vẽ ra nằm ở nửa cầu XA. Với những mảnh rơi vào
 * giữa đĩa, chúng bị chính hành tinh che (phép kiểm độ sâu), nên không thấy.
 * Chỉ vành ngoài — chỗ vỏ cầu nhô ra khỏi silhouette của hành tinh — là lọt
 * qua. Kết quả là quầng sáng chỉ xuất hiện ở rìa, đúng thứ cần, mà không phải
 * viết một phép cắt nào.
 *
 * `depthWrite: false` để vỏ này không tự che các lớp trong suốt khác;
 * `AdditiveBlending` để nó cộng ánh sáng vào nền chứ không đè một lớp màu lên.
 *
 * Hằng `0.72` là chỗ vành bắt đầu sáng, số mũ 3 quyết định vành hẹp hay loe.
 * Hai con số này chọn bằng mắt trên đúng khung sẽ dùng — chúng là tham số
 * thẩm mỹ, không phải mệnh đề vật lý, nên chọn bằng mắt là đúng cách ở đây.
 */
const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  void main() {
    float rim = pow(max(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
    gl_FragColor = vec4(uColor, rim * uIntensity);
  }
`;

function Atmosphere({
  color,
  intensity,
}: {
  color: string;
  intensity: number;
}) {
  // Uniforms phải giữ nguyên tham chiếu giữa các lần render, nếu không
  // three sẽ dựng lại chương trình shader mỗi khung.
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
    }),
    [color, intensity],
  );

  return (
    /* `renderOrder` tường minh: 2 cho khí quyển, 1 cho mây.

       Vỏ mây và vỏ khí quyển đều trong suốt và đều có tâm tại gốc toạ độ. Ba
       thứ ấy cộng lại làm phép sắp xếp mặc định của three — sắp theo khoảng
       cách tới camera — mất căn cứ: hai vật cùng tâm thì cùng khoảng cách, và
       thứ tự rơi vào tay thuật toán sắp xếp chứ không ai định. Nó sẽ chạy
       đúng phần lớn thời gian rồi đổi ở một góc nhìn nào đó, tức loại lỗi
       không tái hiện được theo yêu cầu.

       Số thứ tự cố định thì không còn gì để đoán. */
    <mesh renderOrder={2}>
      <sphereGeometry args={[1.09, 64, 64]} />
      <shaderMaterial
        vertexShader={ATMOSPHERE_VERTEX}
        fragmentShader={ATMOSPHERE_FRAGMENT}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Tốc độ quay, đơn vị radian trên giây.
 *
 * Đo bằng ĐỘ TRÊN GIÂY chứ không bằng cảm nhận, theo đúng quy tắc chuyển
 * động trong docs/design-system.md.
 *
 * 0,18 rad/s của bản trước là 10,3°/s — một vòng 35 giây. Nhanh tới mức quả
 * cầu tự kéo mắt về phía nó và người đọc khó dừng lại ở một vùng bề mặt để
 * nhìn cho kỹ, mà nhìn kỹ mới là việc khối này sinh ra để phục vụ.
 *
 * 0,06 rad/s là 3,4°/s — một vòng gần hai phút. Cùng nhịp đã chốt cho thiên
 * hà ở hero: đủ để thấy rõ là đang sống nếu nhìn vài giây, không đủ để giành
 * sự chú ý khỏi phần chữ bên cạnh.
 *
 * Mây giữ nguyên tỉ lệ 0,75 so với bề mặt, để chúng vẫn trôi tương đối.
 */
const SURFACE_SPIN = 0.06;
const CLOUD_SPIN = SURFACE_SPIN * 0.75;

function Body({ body, spinning }: { body: GlobeBody; spinning: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Group>(null);
  // Ảnh về tới đâu thay tới đó; chưa có thì quả cầu vẫn vẽ bằng màu phẳng,
  // nên trên mạng chậm người xem không bao giờ gặp một khung đen trống.
  const map = useProgressiveTexture(body.texture);
  // "linear" chứ không "srgb": tấm này dùng làm alphaMap, giá trị của nó là
  // độ che phủ chứ không phải màu. Xem chú thích trong chính hook.
  const cloudMap = useProgressiveTexture(body.clouds, "linear");

  useFrame((_, delta) => {
    if (!spinning) return;
    if (ref.current) ref.current.rotation.y += delta * SURFACE_SPIN;
    // Mây chậm hơn bề mặt chừng một phần tư. Chạy trong một group RIÊNG chứ
    // không lồng trong group bề mặt — lồng vào thì nó thừa hưởng trọn vòng
    // quay của mặt đất và không bao giờ trôi tương đối được.
    if (cloudRef.current) cloudRef.current.rotation.y += delta * CLOUD_SPIN;
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

      {/* Vỏ mây, lớn hơn bề mặt 1%.

          `meshStandardMaterial` chứ không `meshBasicMaterial`: mây phải ĂN
          SÁNG như mặt đất, nếu không thì nửa đêm của hành tinh sẽ có một dải
          mây trắng sáng trưng vắt ngang — thứ trông sai ngay cả với người
          không biết vì sao nó sai.

          `alphaMap` chứ không `map`: tấm của Solar System Scope là mây trắng
          trên nền đen. Đưa vào `map` thì nền đen ấy được vẽ ra thành một lớp
          đen phủ kín hành tinh. Đưa vào `alphaMap` thì đen = trong suốt,
          trắng = đục, và chỉ mây còn lại.

          `depthWrite={false}` để vỏ trong suốt này không chặn chính nó ở
          những chỗ hai mảnh mây chồng lên nhau. */}
      {body.clouds && (
        <group ref={cloudRef}>
          <mesh renderOrder={1}>
            <sphereGeometry args={[1.01, 64, 64]} />
            <meshStandardMaterial
              key={cloudMap ? "clouds" : "no-clouds"}
              alphaMap={cloudMap}
              color="#ffffff"
              transparent
              opacity={0.75}
              depthWrite={false}
              roughness={1}
              metalness={0}
            />
          </mesh>
        </group>
      )}

      {body.atmosphere && (
        <Atmosphere
          color={body.atmosphere.color}
          intensity={body.atmosphere.intensity ?? 1}
        />
      )}

      {/* Trục quay, để thấy rõ độ nghiêng */}
      <mesh>
        <cylinderGeometry args={[0.004, 0.004, 2.9, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.28} />
      </mesh>
    </group>
  );
}

/**
 * Người dùng có bật "giảm chuyển động" trong hệ điều hành không.
 *
 * Trường sao của drei dao động kích thước theo `speed`. Đó là chuyển động
 * mới do lượt này thêm vào, nên nó phải hỏi trước — khác với vòng quay của
 * hành tinh, vốn CHÍNH LÀ nội dung đang được trình bày.
 *
 * Đọc trong `useEffect` chứ không lúc render: `window` không tồn tại ở phía
 * máy chủ, và một giá trị khác nhau giữa hai phía sẽ làm lệch hydrate.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function GlobeScene({
  body,
  spinning,
  distance = 3.2,
  interactive = true,
  transparent = false,
  starfield,
}: {
  body: GlobeBody;
  spinning: boolean;
  /**
   * Cho phép xoay/thu phóng bằng chuột. Tắt ở những chỗ quả cầu chỉ là hình
   * minh hoạ — `OrbitControls` bắt sự kiện `wheel` trên canvas, nên để bật
   * trong một khối trang trí giữa trang sẽ khiến người đọc đưa con trỏ qua đó
   * rồi cuộn mà trang đứng im. Đó là lỗi rất khó đoán ra nguyên nhân.
   */
  interactive?: boolean;
  /**
   * Bỏ nền đen của cảnh để canvas hoà vào nền phía sau. Trang mô hình cần nền
   * đen riêng; hero thì đã có nền vũ trụ của nó và một hình chữ nhật đen đè
   * lên sẽ lộ mép.
   */
  transparent?: boolean;
  /**
   * Trường sao nền. Mặc định BẬT khi cảnh có nền riêng, TẮT khi cảnh trong
   * suốt — ở chế độ trong suốt, trang phía sau đã có trường sao CSS của nó,
   * và hai trường sao chồng nhau ở hai mật độ khác nhau đọc ra thành nhiễu.
   */
  starfield?: boolean;
  /**
   * Khoảng cách camera tới tâm quả cầu, đơn vị bán kính.
   *
   * Mặc định 3,2 cho vừa cả quả cầu vào khung. Hành trình thu phóng hạ xuống
   * 1,9 để dựng cấp "châu lục": cùng một quả cầu, chỉ khác chỗ đứng — khung
   * nhìn khi đó bao khoảng 5.000 km bề mặt, còn đường chân trời cong vẫn ở
   * trong hai mép ngang.
   */
  distance?: number;
}) {
  const showStars = starfield ?? !transparent;
  const reducedMotion = usePrefersReducedMotion();

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
      gl={{ alpha: transparent }}
    >
      {!transparent && <color attach="background" args={["#05070f"]} />}

      {/* Trường sao nền, mật độ thấp.

          Nền phẳng một màu làm hành tinh trôi trong hư không và mất hẳn cảm
          giác xa gần. Vài trăm điểm sáng mờ đủ để mắt có mốc, và vì chúng nằm
          ở bán kính rất lớn nên chúng gần như đứng yên khi người xem xoay —
          đúng như bầu trời thật.

          `count` cố tình thấp và `saturation={0}` để sao trắng chứ không màu
          mè: đây là nền, không phải nội dung. `speed` rất chậm vì một trường
          sao lấp lánh nhanh sẽ tranh chú ý với chính hành tinh. */}
      {showStars && (
        <Stars
          radius={90}
          depth={45}
          count={700}
          factor={2.6}
          saturation={0}
          fade
          speed={reducedMotion ? 0 : 0.25}
        />
      )}

      {/* Mặt Trời tự sáng nên không cần đèn; các thiên thể khác lấy sáng từ
          một nguồn lệch bên để thấy được đường phân giới ngày–đêm. */}
      {!body.emissive && (
        <>
          {/* Ambient nhích 0,22 → 0,30 và thêm một đèn phụ rất yếu chiếu
              ngược hướng đèn chính.

              Mục đích là nửa ĐÊM vẫn đọc ra hình cầu thay vì tan vào nền đen.
              Dùng đèn phụ chứ không chỉ nâng ambient: ambient nâng đều cả hai
              nửa nên nó làm nhạt luôn đường phân giới ngày–đêm — thứ đắt nhất
              trong cảnh này. Một đèn hướng ngược lại chỉ vuốt sáng phần rìa
              của nửa tối, giữ nguyên chỗ giao nhau.

              0,30 và 0,32 là mức giữ được đường phân giới còn nhìn rõ. Nâng
              nữa thì hành tinh bắt đầu trông như được chiếu đèn phòng chụp. */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[4, 1.5, 3]} intensity={2.6} />
          <directionalLight position={[-5, -1.5, -3]} intensity={0.32} />
        </>
      )}

      <Body body={body} spinning={spinning} />

      {interactive && (
        <OrbitControls
          enablePan
          minDistance={Math.min(1.15, distance * 0.9)}
          maxDistance={7}
          zoomSpeed={0.6}
          rotateSpeed={0.5}
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        />
      )}
    </Canvas>
  );
}
