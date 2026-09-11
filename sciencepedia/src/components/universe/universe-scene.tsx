"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { buildCosmicWeb, voidDiameterMly } from "@/lib/cosmic-web";

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
function useReticleSprite(): THREE.Texture {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (ctx) {
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

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

/**
 * Sprite cho hạt sương của sợi vật chất.
 *
 * Khác hẳn sprite sao: không có lõi đặc, chỉ là một vệt mờ tắt dần đều từ tâm
 * ra mép. Một hạt đứng riêng gần như vô hình; thân sợi hiện ra từ chỗ hàng
 * trăm hạt chồng lên nhau. Đó là điều làm nó ra thể tích chứ không ra chấm.
 */
function useFogSprite(): THREE.Texture {
  return useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      const half = size / 2;
      const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
      gradient.addColorStop(0, "rgba(255,255,255,0.55)");
      gradient.addColorStop(0.45, "rgba(255,255,255,0.18)");
      gradient.addColorStop(0.75, "rgba(255,255,255,0.05)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

/**
 * Mạng vũ trụ. Toàn bộ phần dựng hình nằm ở `@/lib/cosmic-web`.
 *
 * Tách ra khỏi component vì nó là hình học thuần tuý, không đụng gì tới React
 * — và vì nó đủ dài để che khuất phần còn lại của file này nếu để lẫn vào.
 */
function useCosmicWeb() {
  return useMemo(() => buildCosmicWeb(), []);
}

/* ────────────────────────── Giãn nhãn, dùng chung ──────────────────────────

   Chốt 2026-09-06 sau khi nhãn đè lên nhau ở mức thu nhỏ mặc định.

   Trước đây mỗi nhóm nhãn tự lo lấy mình: `Landmarks` có logic tránh đè, còn
   `ScaleShells` thì không có gì cả. Hai nhóm render trong hai <group> tách
   biệt nên không nhóm nào biết nhóm kia đang chiếm chỗ nào — và một cơ chế
   tránh đè chỉ nhìn thấy một nửa số nhãn thì không phải cơ chế tránh đè.

   Phép đo cũ còn sai ở hai chỗ nữa, và cả hai đều làm khung va chạm lệch khỏi
   thứ đang thật sự hiện trên màn hình:

   1. Nó chiếu TÂM VẬT THỂ, trong khi <Html> được đặt lệch lên trên vài đơn vị
      thế giới. Hai điểm đó không rơi vào cùng một chỗ trên màn hình.
   2. Nó so hai tâm nhãn bằng một khung cứng 150×30 px, trong khi drei co giãn
      nhãn theo khoảng cách camera. Cùng một cặp nhãn, lúc thu nhỏ cách nhau
      30 px thật, lúc phóng to cách nhau 300 px — một ngưỡng cứng không thể
      đúng ở cả hai đầu, và nó cũng bỏ qua việc "Ngân Hà — bạn đang ở đây"
      rộng gấp đôi "Đám Virgo".

   Bản này chiếu ĐÚNG điểm neo của nhãn, ước lượng bề rộng theo số ký tự thật
   của từng nhãn, rồi nhân với đúng hệ số drei dùng. */

/**
 * Hệ số drei áp cho `<Html distanceFactor>`, chép từ `objectScale()` của nó:
 * `scale = distanceFactor / (2·tan(fov/2)·khoảng cách tới camera)`.
 *
 * Phải khớp chính xác. Sai số ở đây là sai số của khung va chạm, và nó biểu
 * hiện thành đúng cái lỗi ta đang sửa.
 */
function htmlScale(
  camera: THREE.Camera,
  anchor: THREE.Vector3,
  distanceFactor: number,
): number {
  const { fov } = camera as THREE.PerspectiveCamera;
  const vFOV = (fov * Math.PI) / 180;
  const dist = camera.position.distanceTo(anchor);
  return distanceFactor / (2 * Math.tan(vFOV / 2) * dist);
}

/* Bề rộng nhãn khi chưa co giãn, đo thô theo số ký tự.
   Đo DOM thật sẽ chính xác hơn nhưng không khả thi: nhãn bị ẩn thì không có
   DOM để mà đo, nên phép đo sẽ dao động qua lại giữa hai trạng thái. */
const CHAR_PX = 6.4;
const PAD_PX = 26;
const LABEL_PX_H = 26;
/** Khe hở tối thiểu: hai nhãn sát cạnh nhau vẫn khó đọc dù về hình học là không đè. */
const GAP_PX = 8;

/** Nhãn mốc nằm lệch lên trên chấm sáng; mốc "home" to hơn nên lệch nhiều hơn. */
const landmarkLabelY = (home: boolean) => (home ? 0.75 : 0.45);
const shellLabelPos = (radius: number): [number, number, number] => [
  0,
  radius * 0.72,
  radius * 0.72,
];
const LANDMARK_FACTOR = 22;
const SHELL_FACTOR = 18;

type LabelSlot = {
  id: string;
  anchor: THREE.Vector3;
  /** Bề rộng px khi scale = 1 */
  width: number;
  distanceFactor: number;
};

/**
 * Bỏ nhãn nào đè lên một nhãn đã giữ, xét theo thứ tự ưu tiên của `slots`.
 *
 * Không sửa bằng cách bóp méo khoảng cách giữa các mốc: khoảng cách ở đây là
 * số đo thật, chỉ hướng mới là bịa ra cho dễ nhìn. Nhãn bị ẩn hiện lại khi
 * người xem phóng to — đúng hành vi người ta chờ đợi.
 */
function useLabelDeclutter(slots: LabelSlot[], enabled: boolean): Set<string> {
  const { camera, size } = useThree();
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const lastKey = useRef("");

  useFrame(() => {
    if (!enabled) {
      if (lastKey.current !== "") {
        lastKey.current = "";
        setHidden(new Set());
      }
      return;
    }

    const kept: { x: number; y: number; hw: number; hh: number }[] = [];
    const next = new Set<string>();

    for (const slot of slots) {
      const ndc = slot.anchor.clone().project(camera);
      // z > 1 nghĩa là nằm sau camera; chiếu ra một điểm vô nghĩa
      if (ndc.z > 1) {
        next.add(slot.id);
        continue;
      }
      const x = (ndc.x * 0.5 + 0.5) * size.width;
      const y = (-ndc.y * 0.5 + 0.5) * size.height;
      const scale = htmlScale(camera, slot.anchor, slot.distanceFactor);
      const hw = (slot.width * scale + GAP_PX) / 2;
      const hh = (LABEL_PX_H * scale + GAP_PX) / 2;

      const clash = kept.some(
        (k) => Math.abs(k.x - x) < k.hw + hw && Math.abs(k.y - y) < k.hh + hh,
      );
      if (clash) next.add(slot.id);
      else kept.push({ x, y, hw, hh });
    }

    // Chỉ setState khi tập hợp thật sự đổi — setState mỗi khung hình sẽ khiến
    // React dựng lại cây này 60 lần một giây.
    const key = [...next].sort().join(",");
    if (key !== lastKey.current) {
      lastKey.current = key;
      setHidden(next);
    }
  });

  return hidden;
}

/**
 * Danh sách nhãn theo THỨ TỰ ƯU TIÊN — slot đứng trước thắng khi tranh chỗ.
 *
 * "Bạn đang ở đây" luôn thắng, sau đó tới mốc xa nhất: mốc xa nằm ở rìa và ít
 * tranh chỗ, giữ chúng thì phần trung tâm chỉ mất những nhãn mà zoom vào là
 * thấy lại.
 *
 * Vỏ tỉ lệ xếp sau toàn bộ mốc: vỏ mất nhãn thì vòng tròn vẫn còn đó để nhìn,
 * còn một mốc mất nhãn thì chỉ còn là một chấm sáng vô danh.
 */
function useLabelSlots(
  locale: string,
  showScales: boolean,
): LabelSlot[] {
  return useMemo(() => {
    const slots: LabelSlot[] = [];
    const textWidth = (text: string) => text.length * CHAR_PX + PAD_PX;

    const landmarks = [...COSMIC_LANDMARKS].sort(
      (a, b) =>
        Number(b.tier === "home") - Number(a.tier === "home") ||
        b.distanceMly - a.distanceMly,
    );
    for (const landmark of landmarks) {
      const home = landmark.tier === "home";
      const [x, y, z] = landmarkPosition(landmark);
      const text = locale === "en" ? landmark.nameEn : landmark.name;
      slots.push({
        id: landmark.id,
        anchor: new THREE.Vector3(x, y + landmarkLabelY(home), z),
        // Mốc home có thêm ngôi sao ở đầu nhãn
        width: textWidth(text) + (home ? 14 : 0),
        distanceFactor: LANDMARK_FACTOR,
      });
    }

    // Vỏ tỉ lệ đang tắt thì không chiếm chỗ của ai cả.
    if (showScales) {
      const shells = UNIVERSE_SCALES.filter(
        (scale) => scale.radius !== null,
      ).sort((a, b) => (b.radius as number) - (a.radius as number));
      for (const scale of shells) {
        slots.push({
          id: `shell-${scale.id}`,
          anchor: new THREE.Vector3(...shellLabelPos(scale.radius as number)),
          width: textWidth(locale === "en" ? scale.nameEn : scale.name),
          distanceFactor: SHELL_FACTOR,
        });
      }
    }

    return slots;
  }, [locale, showScales]);
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
  const reticle = useReticleSprite();

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
              <>
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
              </>
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
  const sprite = useStarSprite();
  const fogSprite = useFogSprite();
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
