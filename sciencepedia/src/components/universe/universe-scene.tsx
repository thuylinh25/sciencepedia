"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { buildCosmicWeb, voidDiameterMly } from "@/lib/cosmic-web";
import {
  useCanvasTexture,
  useRadialSprite,
  type GradientStop,
} from "@/lib/three/sprites";
import {
  LANDMARK_FACTOR,
  SHELL_FACTOR,
  landmarkLabelY,
  shellLabelPos,
  useLabelDeclutter,
  useLabelSlots,
} from "@/components/universe/label-layout";

import {
  COSMIC_LANDMARKS,
  NODE_TIERS,
  UNIVERSE_SCALES,
  landmarkPosition,
} from "@/lib/universe-data";

export type UniverseSettings = {
  playing: boolean;
  speed: number;
  /** Lớp sương dựng nên thân các sợi vật chất */
  showFilaments: boolean;
  /**
   * Chế độ khoa học: khoanh các khoảng rỗng lớn và ghi đường kính của chúng.
   */
  scientific: boolean;
  showScales: boolean;
  showLabels: boolean;
  /** Khoảng cách camera, do thanh tỉ lệ điều khiển */
  distance: number;
};

/**
 * Sprite tròn mềm — xem `radialSprite` ở `@/lib/three/sprites`.
 *
 * Các chặng màu ở đây KHÁC bản của galaxy-scene (0.22/0.5 so với 0.2/0.45).
 * Giữ nguyên chênh lệch đó: mạng vũ trụ thưa hơn đĩa thiên hà nhiều nên lõi
 * sprite phải đặc hơn một chút thì chấm mới đọc được khi đứng riêng lẻ.
 */
const STAR_SPRITE_SIZE = 64;
const STAR_STOPS: readonly GradientStop[] = [
  [0, "rgba(255,255,255,1)"],
  [0.22, "rgba(255,255,255,0.7)"],
  [0.5, "rgba(255,255,255,0.18)"],
  [1, "rgba(255,255,255,0)"],
];

/**
 * Vòng ngắm cho dấu "bạn đang ở đây".
 *
 * Chốt 2026-09-06. Sau khi sửa nhãn đè nhau thì lỗi còn lại lộ ra: nhãn đã
 * đọc được nhưng người xem vẫn không chỉ ra được Ngân Hà nằm ở chấm nào. Mốc
 * home trước đây chỉ là một sprite sáng hơn giữa hàng nghìn sprite sáng, cộng
 * một quầng ĐẬP NHỊP — mà quầng đập nhịp thì có lúc mờ gần hết, và đúng lúc
 * đó thì nó không đánh dấu gì cả.
 *
 * Vòng ngắm này tĩnh, không đập nhịp, và vẽ với `depthTest={false}` nên không
 * bị các thiên hà phía trước che. Một hình dạng KHÁC HẲN (vòng tròn có bốn
 * vạch chỉ vào tâm) đọc nhanh hơn nhiều so với "chấm sáng to hơn một chút".
 */
const RETICLE_SPRITE_SIZE = 256;
function drawReticle(ctx: CanvasRenderingContext2D, size: number) {
  const half = size / 2;
  ctx.strokeStyle = "#fde047";
  ctx.lineCap = "round";

  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(half, half, size * 0.3, 0, Math.PI * 2);
  ctx.stroke();

  // Bốn vạch chỉ vào tâm, chừa khe hở để không lấp mất chính cái chấm.
  ctx.lineWidth = 9;
  for (let i = 0; i < 4; i++) {
    const angle = i * (Math.PI / 2);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(half + cos * size * 0.45, half + sin * size * 0.45);
    ctx.lineTo(half + cos * size * 0.36, half + sin * size * 0.36);
    ctx.stroke();
  }
}

/**
 * Sprite cho hạt sương của sợi vật chất.
 *
 * Khác hẳn sprite sao: không có lõi đặc, chỉ là một vệt mờ tắt dần đều từ tâm
 * ra mép. Một hạt đứng riêng gần như vô hình; thân sợi hiện ra từ chỗ hàng
 * trăm hạt chồng lên nhau. Đó là điều làm nó ra thể tích chứ không ra chấm.
 */
const FOG_SPRITE_SIZE = 64;
const FOG_STOPS: readonly GradientStop[] = [
  [0, "rgba(255,255,255,0.55)"],
  [0.45, "rgba(255,255,255,0.18)"],
  [0.75, "rgba(255,255,255,0.05)"],
  [1, "rgba(255,255,255,0)"],
];

/**
 * Mạng vũ trụ. Toàn bộ phần dựng hình nằm ở `@/lib/cosmic-web`.
 *
 * Tách ra khỏi component vì nó là hình học thuần tuý, không đụng gì tới React
 * — và vì nó đủ dài để che khuất phần còn lại của file này nếu để lẫn vào.
 */
function useCosmicWeb() {
  return useMemo(() => buildCosmicWeb(), []);
}

/**
 * Các cấu trúc có thật, kèm dấu "bạn đang ở đây" ở gốc toạ độ.
 *
 * Mô hình trước mọi chấm sáng như nhau nên mắt không biết nhìn vào đâu. Ở đây
 * vị trí của chúng ta được đánh dấu bằng một vòng sáng đập nhịp ngay giữa, và
 * các mốc quen thuộc được gắn tên — đó là những điểm neo để đọc phần còn lại.
 */
/**
 * Giữ dấu "bạn đang ở đây" ở nguyên một cỡ trên màn hình, bất kể camera đứng
 * gần hay xa.
 *
 * Dấu này vốn có kích thước cố định trong không gian cảnh: quả cầu bán kính
 * 0,28 đơn vị cộng vòng ngắm 2,6. Ở tầm nhìn mặc định, cách chừng 55 đơn vị,
 * đó là một chấm nhỏ đúng ý. Nhưng bay vào tới 3–5 đơn vị — đúng việc người
 * xem sẽ làm để tìm xem Ngân Hà nằm ở đâu — thì cùng cái chấm đó phình thành
 * một khối trắng chiếm nửa khung, và nó che mất chính thứ nó đang chỉ.
 *
 * Cách chữa là cho tỉ lệ chạy tỉ lệ thuận với khoảng cách tới camera: hai đại
 * lượng triệt tiêu nhau trong phép chiếu phối cảnh, nên cỡ trên màn hình
 * không đổi. Chặn trên để ở khoảng cách rất xa nó không nở thành một đốm.
 *
 * Chỉ áp cho dấu home. Các mốc khác là thiên thể có vị trí và kích thước
 * tương đối với nhau; phóng to mà chúng không lớn lên thì mới là sai.
 */
function HomeMarkerScale({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const world = useRef(new THREE.Vector3());

  useFrame(({ camera }) => {
    if (!group.current) return;
    group.current.getWorldPosition(world.current);
    const distance = camera.position.distanceTo(world.current);
    // 1/55 giữ đúng cỡ mà tầm nhìn mặc định đang cho
    group.current.scale.setScalar(
      THREE.MathUtils.clamp(distance / 55, 0.06, 1.4),
    );
  });

  return <group ref={group}>{children}</group>;
}

function Landmarks({
  sprite,
  showLabels,
  hiddenLabels,
  locale,
  onSelect,
}: {
  sprite: THREE.Texture;
  showLabels: boolean;
  /** Tính ở `Web` bằng `useLabelDeclutter`, chung với nhãn vỏ tỉ lệ. */
  hiddenLabels: Set<string>;
  locale: string;
  onSelect: (id: string) => void;
}) {
  const pulse = useRef<THREE.Mesh>(null);
  const reticle = useCanvasTexture(RETICLE_SPRITE_SIZE, drawReticle);

  // Chỉ còn nhịp đập của dấu "bạn đang ở đây". Việc giãn nhãn đã chuyển lên
  // `Web` để nó nhìn thấy cả nhãn vỏ tỉ lệ — xem `useLabelDeclutter`.
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
              <HomeMarkerScale>
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

                {/* Vòng ngắm tĩnh — thứ thật sự trả lời "Ngân Hà ở đâu".
                    depthTest tắt để thiên hà phía trước không che mất nó. */}
                <sprite scale={[2.6, 2.6, 2.6]} renderOrder={10}>
                  <spriteMaterial
                    map={reticle}
                    transparent
                    opacity={0.95}
                    depthWrite={false}
                    depthTest={false}
                  />
                </sprite>

                {/* Cuống nối chấm với nhãn. Không có nó thì cái nhãn chỉ là
                    một viên thuốc lơ lửng gần đó, không chỉ đích xác chấm nào. */}
                <mesh position={[0, landmarkLabelY(true) / 2 + 0.14, 0]} renderOrder={10}>
                  <cylinderGeometry
                    args={[0.014, 0.014, landmarkLabelY(true) - 0.28, 6]}
                  />
                  <meshBasicMaterial
                    color="#fde047"
                    transparent
                    opacity={0.7}
                    depthWrite={false}
                    depthTest={false}
                  />
                </mesh>
              </HomeMarkerScale>
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

            {showLabels && !hiddenLabels.has(landmark.id) && (
              <Html
                position={[0, landmarkLabelY(home), 0]}
                center
                distanceFactor={LANDMARK_FACTOR}
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
  hiddenLabels,
  locale,
}: {
  showLabels: boolean;
  /** Cùng tập với nhãn mốc — vỏ tỉ lệ trước đây không tránh đè gì cả. */
  hiddenLabels: Set<string>;
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
          {showLabels && !hiddenLabels.has(`shell-${scale.id}`) && (
            <Html
              position={shellLabelPos(scale.radius as number)}
              center
              distanceFactor={SHELL_FACTOR}
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
  const sprite = useRadialSprite(STAR_SPRITE_SIZE, STAR_STOPS);
  const fogSprite = useRadialSprite(FOG_SPRITE_SIZE, FOG_STOPS);
  const web = useCosmicWeb();

  // Một lượt giãn nhãn cho CẢ mốc lẫn vỏ tỉ lệ. Phải nằm ở đây chứ không nằm
  // trong hai component con: hai lượt riêng thì không lượt nào biết lượt kia
  // đã chiếm chỗ nào, và đó chính là lỗi nhãn đè lên nhau.
  const labelSlots = useLabelSlots(locale, settings.showScales);
  const hiddenLabels = useLabelDeclutter(labelSlots, settings.showLabels);

  useFrame((_, delta) => {
    if (!group.current || !settings.playing) return;
    group.current.rotation.y += delta * 0.03 * settings.speed;
  });

  return (
    <group ref={group}>
      {/* ---------------------------------------------- Thân các sợi vật chất
          Lớp này KHÔNG phải đường nối. Trước đây chỗ này là `lineSegments`
          nối tâm hai nút, và một đường kẻ sáng giữa hai chấm thì người xem
          đọc ra là tuyến đường — là quan hệ giữa hai vật thể. Filament không
          phải đường nối mà là vật chất: một dải khí và vật chất tối dày hàng
          chục triệu năm ánh sáng, thiên hà nằm TRONG nó chứ không ở hai đầu.

          Nên nó được dựng bằng hàng nghìn hạt mờ chồng lấn. Mỗi hạt một mình
          gần như vô hình; hình chỉ hiện ra ở chỗ chúng chồng nhau, đúng cách
          các mô phỏng N-body được dựng ảnh. */}
      {settings.showFilaments && (
        <points geometry={web.filamentFog}>
          <pointsMaterial
            map={fogSprite}
            size={0.42}
            sizeAttenuation
            vertexColors
            transparent
            opacity={0.26}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      <points geometry={web.galaxies}>
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

      <points geometry={web.nodes}>
        <pointsMaterial
          map={sprite}
          size={0.5}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {settings.scientific && (
        <Voids voids={web.voids} showLabels={settings.showLabels} />
      )}

      {settings.showScales && (
        <ScaleShells
          showLabels={settings.showLabels}
          hiddenLabels={hiddenLabels}
          locale={locale}
        />
      )}

      <Landmarks
        sprite={sprite}
        showLabels={settings.showLabels}
        hiddenLabels={hiddenLabels}
        locale={locale}
        onSelect={onSelect}
      />
    </group>
  );
}

/**
 * Khoanh các khoảng rỗng lớn — chỉ ở chế độ khoa học.
 *
 * Void là thứ khó thấy nhất trong mạng vũ trụ, vì mắt đọc chỗ SÁNG chứ không
 * đọc chỗ tối: người xem thấy sợi và nút, rồi kết luận phần còn lại là nền.
 * Nhưng phần còn lại mới chiếm gần hết thể tích, và đó là điều đáng nói nhất
 * về cấu trúc lớn.
 *
 * Vẽ bằng lưới cầu thưa thay vì mặt cầu trong suốt: mặt trong suốt cộng dồn
 * qua nhiều lớp sẽ thành một khối sữa che mất chính các sợi, còn lưới thì để
 * lộ mọi thứ bên trong nó.
 */
function Voids({
  voids,
  showLabels,
}: {
  voids: import("@/lib/cosmic-web").CosmicVoid[];
  showLabels: boolean;
}) {
  return (
    <group>
      {voids.map((cosmicVoid, index) => (
        <group
          key={index}
          position={[
            cosmicVoid.centre.x,
            cosmicVoid.centre.y,
            cosmicVoid.centre.z,
          ]}
        >
          <mesh>
            <sphereGeometry args={[cosmicVoid.radius, 14, 10]} />
            <meshBasicMaterial
              color="#64748b"
              wireframe
              transparent
              opacity={0.13}
              depthWrite={false}
            />
          </mesh>

          {showLabels && (
            <Html center distanceFactor={SHELL_FACTOR} zIndexRange={[8, 0]}>
              <span className="rounded-full bg-slate-900/70 px-2 py-0.5 font-mono text-[10px] whitespace-nowrap text-slate-300 backdrop-blur">
                {voidDiameterMly(cosmicVoid).toLocaleString()} Mly
              </span>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}

/** Đưa camera về khoảng cách mà thanh tỉ lệ đang chọn. */
function ScaleRig({ distance }: { distance: number }) {
  const previous = useRef(distance);
  // Chỉ ép camera khi thanh tỉ lệ vừa đổi; xong thì trả quyền lại cho người xem
  const animating = useRef(false);

  if (previous.current !== distance) {
    previous.current = distance;
    animating.current = true;
  }

  useFrame(({ camera }, delta) => {
    if (!animating.current) return;

    const current = camera.position.length();
    if (Math.abs(current - distance) < 0.05) {
      animating.current = false;
      return;
    }

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

      {/* Khai báo thẳng thao tác chạm thay vì dựa vào mặc định: một ngón xoay,
          hai ngón vừa chụm để phóng to thu nhỏ vừa rê. Pan phải bật, nếu không
          thì cử chỉ hai ngón mặc định (DOLLY_PAN) bị vô hiệu một nửa. */}
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableDamping
        dampingFactor={0.06}
        minDistance={2}
        maxDistance={70}
        zoomSpeed={0.8}
        rotateSpeed={0.5}
        panSpeed={0.7}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
    </Canvas>
  );
}
