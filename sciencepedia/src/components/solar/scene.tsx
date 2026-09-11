"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

import { useProgressiveTexture } from "@/components/solar/use-progressive-texture";
import {
  ASTEROID_BELT,
  PLANETS,
  SUN,
  beltRadii,
  DWARF_PLANETS,
  educationalOrbit,
  educationalOrbitAu,
  MOONS,
  NAMED_ASTEROIDS,
  KUIPER_BELT,
  kuiperRadii,
  OORT_CLOUD,
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
  /** Vệ tinh của Trái Đất, Sao Mộc, Sao Thổ và Sao Hải Vương */
  showMoons: boolean;
  /** Hành tinh lùn ngoài Sao Hải Vương và ba tiểu hành tinh có tên */
  showDwarfs: boolean;
  /** Mặt phẳng hoàng đạo — mốc để đo mọi độ nghiêng quỹ đạo */
  showEcliptic: boolean;
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
/* ══════════════════════════════════════════════════ Quỹ đạo elip và nghiêng

   Ba đại lượng quyết định hình một quỹ đạo trong cảnh này:

   · bán trục lớn  — đã có, từ `educationalOrbit` hoặc `realScaleOrbit`
   · độ lệch tâm   — kéo vòng tròn thành elip và đẩy Mặt Trời khỏi tâm
   · độ nghiêng    — xoay cả mặt phẳng quỹ đạo quanh trục x

   ## Vì sao Mặt Trời không ở tâm elip

   Nó ở TIÊU ĐIỂM. Đó là định luật Kepler thứ nhất, và nó là toàn bộ lý do
   khoảng cách tới Mặt Trời thay đổi trong một vòng. Vẽ elip mà đặt Mặt Trời
   vào tâm thì có hình elip nhưng mất đúng cái ý nghĩa của nó: mọi điểm trên
   quỹ đạo vẫn cách đều, và người xem không hiểu vì sao lại phải vẽ elip.

   Khoảng cách từ tâm elip tới tiêu điểm là c = a·e, nên dịch cả quỹ đạo đi
   một đoạn c theo trục lớn là Mặt Trời rơi đúng vào tiêu điểm.

   ## Độ nghiêng nhỏ nhưng không bỏ được

   Tám hành tinh nghiêng dưới 7°, nhìn từ trên xuống gần như không thấy. Nhưng
   nghiêng cảnh đi một chút là thấy ngay các quỹ đạo không nằm trong cùng một
   mặt phẳng — và đó là lý do nhật thực không xảy ra mỗi tháng. Hành tinh lùn
   thì không cần nghiêng cảnh cũng thấy: Eris 44°. */

/** Điểm trên quỹ đạo tại góc `angle`, đã tính lệch tâm và nghiêng. */
function orbitPoint(
  semiMajor: number,
  eccentricity: number,
  inclinationRad: number,
  angle: number,
): THREE.Vector3 {
  const semiMinor = semiMajor * Math.sqrt(1 - eccentricity * eccentricity);
  // Dịch theo trục lớn để tiêu điểm — chỗ Mặt Trời đứng — về gốc toạ độ
  const focus = semiMajor * eccentricity;

  const x = Math.cos(angle) * semiMajor - focus;
  const z = Math.sin(angle) * semiMinor;

  // Xoay quanh trục x: mặt phẳng quỹ đạo nghiêng so với mặt phẳng hoàng đạo
  return new THREE.Vector3(
    x,
    -z * Math.sin(inclinationRad),
    z * Math.cos(inclinationRad),
  );
}

/**
 * Vành quỹ đạo, vẽ bằng ống mảnh chạy dọc đường elip.
 *
 * Dùng `TubeGeometry` chứ không `<line>` vì cùng lý do đã ghi ở quỹ đạo Mặt
 * Trời quanh Ngân Hà: WebGL ghim `linewidth` ở 1 pixel trên gần hết trình
 * duyệt, nên đường kẻ không dày lên khi phóng to và biến mất khi thu nhỏ.
 */
function OrbitPath({
  semiMajor,
  eccentricity,
  inclinationDeg,
  color = "#94a3b8",
  opacity = 0.25,
}: {
  semiMajor: number;
  eccentricity: number;
  inclinationDeg: number;
  color?: string;
  opacity?: number;
}) {
  const geometry = useMemo(() => {
    const inclination = THREE.MathUtils.degToRad(inclinationDeg);
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < 240; i += 1) {
      points.push(
        orbitPoint(
          semiMajor,
          eccentricity,
          inclination,
          (i / 240) * Math.PI * 2,
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(points, true, "centripetal");
    // Bề rộng tỉ lệ với bán kính: quỹ đạo ngoài xa hơn nên trông mảnh hơn nếu
    // mọi vành cùng một bề rộng tuyệt đối.
    return new THREE.TubeGeometry(
      curve,
      240,
      Math.max(0.012, semiMajor * 0.0016),
      6,
      true,
    );
  }, [semiMajor, eccentricity, inclinationDeg]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Mặt phẳng hoàng đạo — mặt phẳng quỹ đạo Trái Đất, mốc để đo mọi độ nghiêng.
 *
 * Vẽ bằng vài vòng tròn đồng tâm chứ không phải một mặt đĩa trong suốt: đĩa
 * trong suốt cộng dồn qua nhiều lớp sẽ thành một màn sữa che mất chính các
 * hành tinh, còn vòng tròn thì để lộ mọi thứ bên trong nó.
 */
function EclipticPlane({ radius }: { radius: number }) {
  const rings = useMemo(
    () => [0.25, 0.5, 0.75, 1].map((k) => radius * k),
    [radius],
  );

  return (
    <group>
      {rings.map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.03, r + 0.03, 128]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Vành đai tiểu hành tinh, giữa Sao Hoả và Sao Mộc.
 *
 * Vẽ bằng điểm chứ không bằng một vòng đặc: vành đai thật là những vật thể
 * rời rạc cách nhau hàng trăm nghìn kilômét, và một vòng liền mạch sẽ dạy sai
 * đúng cái điều dễ hiểu sai nhất về nó — phim ảnh hay vẽ nó dày đặc tới mức
 * phải lách qua.
 *
 * Ba chi tiết được giữ đúng:
 *
 * 1. **Khe Kirkwood.** Mật độ bị khoét ở những bán kính cộng hưởng với Sao
 *    Mộc. Đây là thứ đáng nhớ nhất về vành đai, và nó miễn phí về mặt vẽ.
 * 2. **Dày theo phương đứng.** Vành đai không phẳng như tờ giấy; quỹ đạo
 *    nghiêng tới hơn 20°, nên các điểm được rắc lệch khỏi mặt phẳng hoàng đạo.
 * 3. **Quay chậm hơn hành tinh trong.** Càng xa Mặt Trời càng chậm, nên vành
 *    đai quay chậm hơn Sao Hoả và nhanh hơn Sao Mộc.
 */
function AsteroidBelt({
  settings,
  locale,
  lowPower,
}: {
  settings: SceneSettings;
  locale: string;
  lowPower: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const [inner, outer] = beltRadii(settings.realScale);
  const count = lowPower ? 1100 : 2600;

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const base = new THREE.Color(ASTEROID_BELT.color);
    const span = ASTEROID_BELT.outerAu - ASTEROID_BELT.innerAu;

    // Bác bỏ theo mật độ: gieo ngẫu nhiên rồi loại điểm rơi vào khe Kirkwood.
    const keep = (au: number) => {
      for (const gap of ASTEROID_BELT.kirkwoodGaps) {
        const d = Math.abs(au - gap.au) / gap.width;
        if (d < 1 && Math.random() > d * d * 0.55) return false;
      }
      return true;
    };

    let guard = 0;
    while (positions.length < count * 3 && guard < count * 40) {
      guard += 1;
      const au = ASTEROID_BELT.innerAu + Math.random() * span;
      if (!keep(au)) continue;

      const t = (au - ASTEROID_BELT.innerAu) / span;
      const radius = inner + t * (outer - inner);
      const angle = Math.random() * Math.PI * 2;
      // Dày theo phương đứng, tỉ lệ với bán kính — vành đai là cái đĩa dày.
      const y = (Math.random() + Math.random() - 1) * (outer - inner) * 0.16;

      positions.push(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius,
      );
      const dim = 0.55 + Math.random() * 0.65;
      colors.push(base.r * dim, base.g * dim, base.b * dim);
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    buffer.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return buffer;
  }, [inner, outer, count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    if (!group.current || !settings.playing) return;
    group.current.rotation.y += delta * 0.045 * settings.speed;
  });

  return (
    <group ref={group}>
      <points geometry={geometry}>
        <pointsMaterial
          size={settings.realScale ? 0.16 : 0.12}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </points>

      {settings.showLabels && (
        <Html
          position={[0, 0, outer + (outer - inner) * 0.42]}
          center
          distanceFactor={22}
          occlude={false}
          wrapperClass="pointer-events-none"
        >
          <span className="rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-white backdrop-blur-sm">
            {locale === "en" ? ASTEROID_BELT.nameEn : ASTEROID_BELT.name}
          </span>
        </Html>
      )}
    </group>
  );
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
    : educationalOrbit(planet);
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

  /*
   * Góc trên quỹ đạo, giữ trong ref chứ không trong state: nó đổi mỗi khung
   * hình, và một state đổi 60 lần mỗi giây sẽ render lại cả cây React 60 lần
   * mỗi giây để vẽ đúng thứ mà three.js đã vẽ xong.
   */
  const angleRef = useRef(startAngle);
  const bodyRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!settings.playing) return;
    const step = delta * settings.speed;

    angleRef.current += step * planet.orbitSpeed * 0.28;

    /*
     * Đặt vị trí thay vì xoay một nhóm cha.
     *
     * Cách cũ để hành tinh ở khoảng cách cố định rồi xoay cả nhóm quanh trục
     * y — chỉ vẽ được vòng tròn. Quỹ đạo elip có bán kính đổi theo góc, và
     * quỹ đạo nghiêng còn có cả thành phần theo trục y, nên vị trí phải tính
     * từng khung.
     */
    if (bodyRef.current) {
      bodyRef.current.position.copy(
        orbitPoint(
          orbitRadius,
          planet.eccentricity,
          THREE.MathUtils.degToRad(planet.inclinationDeg),
          angleRef.current,
        ),
      );
    }

    if (spinRef.current) {
      spinRef.current.rotation.y += step * planet.spinSpeed * 0.6;
    }
  });

  const moons = MOONS.filter((moon) => moon.planetId === planet.id);

  return (
    <group ref={orbitRef}>
      <group
        ref={bodyRef}
        position={orbitPoint(
          orbitRadius,
          planet.eccentricity,
          THREE.MathUtils.degToRad(planet.inclinationDeg),
          startAngle,
        )}
      >
        {settings.showMoons &&
          moons.map((moon, index) => (
            <MoonBody
              key={moon.id}
              moon={moon}
              planetRadius={radius}
              planetRealRadiusKm={planet.realRadiusKm}
              index={index}
              settings={settings}
              locale={locale}
            />
          ))}

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

/**
 * Vành đai Kuiper.
 *
 * Thiếu nó thì mô hình dạy rằng Hệ Mặt Trời kết thúc ở Sao Hải Vương. Sao Hải
 * Vương chỉ là hành tinh ngoài cùng, không phải mép ngoài — ngoài quỹ đạo nó
 * còn một vành vật thể băng giá rộng 20 AU, và Sao Diêm Vương nằm trong đó.
 *
 * Mật độ dồn về vùng cộng hưởng 2:3 ở 39,4 AU, nơi Sao Hải Vương khoá các
 * "plutino" lại. Vành đai Kuiper dẹt hơn vành đai tiểu hành tinh nhiều nhưng
 * độ nghiêng quỹ đạo lại tản rộng hơn, nên bề dày theo phương đứng ở đây lớn
 * hơn tỉ lệ với bề rộng.
 */
function KuiperBelt({
  settings,
  locale,
  lowPower,
}: {
  settings: SceneSettings;
  locale: string;
  lowPower: boolean;
}) {
  const [inner, outer] = kuiperRadii(settings.realScale);
  const count = lowPower ? 900 : 2200;

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const base = new THREE.Color(KUIPER_BELT.color);
    const span = KUIPER_BELT.outerAu - KUIPER_BELT.innerAu;

    for (let i = 0; i < count; i += 1) {
      /*
       * Một phần ba số vật thể dồn quanh cộng hưởng 2:3, phần còn lại rải
       * đều. Rải đều hết thì vành trông như một cái đĩa trơn, mà điều đáng
       * nói nhất về vành đai Kuiper là nó có cấu trúc.
       */
      const au =
        Math.random() < 0.34
          ? KUIPER_BELT.resonanceAu + (Math.random() + Math.random() - 1) * 1.6
          : KUIPER_BELT.innerAu + Math.random() * span;

      const t = (au - KUIPER_BELT.innerAu) / span;
      const radius = inner + t * (outer - inner);
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() + Math.random() - 1) * (outer - inner) * 0.22;

      positions.push(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius,
      );
      const dim = 0.45 + Math.random() * 0.55;
      colors.push(base.r * dim, base.g * dim, base.b * dim);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [inner, outer, count]);

  return (
    <group>
      <points geometry={geometry}>
        <pointsMaterial
          size={settings.realScale ? 0.2 : 0.15}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.75}
          depthWrite={false}
        />
      </points>

      {settings.showLabels && (
        <Html
          position={[0, 0, outer * 1.04]}
          center
          distanceFactor={60}
          zIndexRange={[6, 0]}
        >
          <span className="rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] whitespace-nowrap text-slate-300 backdrop-blur">
            {locale === "en" ? KUIPER_BELT.nameEn : KUIPER_BELT.name}
          </span>
        </Html>
      )}
    </group>
  );
}

/**
 * Đám mây Oort — vỏ cầu theo sơ đồ, KHÔNG theo tỉ lệ.
 *
 * Đây là chỗ duy nhất trong cảnh mà tỉ lệ bị phá vỡ có chủ ý. Rìa trong của
 * đám mây Oort ở khoảng 2.000 AU; ngay cả với phép nén căn bậc hai nó đã rơi
 * ra 500 đơn vị cảnh, và rìa ngoài 100.000 AU thì ra 3.540 — xa gấp 45 lần
 * vành đai Kuiper, đủ để mọi thứ còn lại co về một chấm.
 *
 * Nên nó được vẽ như một vỏ mờ ngay ngoài vành đai Kuiper, và nhãn phải nói
 * đúng khoảng cách thật. Một sơ đồ có ghi chú thì trung thực; một sơ đồ không
 * ghi chú mới là nói dối.
 */
function OortShell({
  settings,
  locale,
}: {
  settings: SceneSettings;
  locale: string;
}) {
  const [, kuiperOuter] = kuiperRadii(settings.realScale);
  const radius = kuiperOuter * 1.22;

  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 24, 16]} />
        <meshBasicMaterial
          color={OORT_CLOUD.color}
          wireframe
          transparent
          opacity={0.07}
          depthWrite={false}
        />
      </mesh>

      {settings.showLabels && (
        <Html
          position={[0, radius * 0.62, 0]}
          center
          distanceFactor={60}
          zIndexRange={[6, 0]}
        >
          <span className="rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] whitespace-nowrap text-slate-300 backdrop-blur">
            {locale === "en" ? OORT_CLOUD.nameEn : OORT_CLOUD.name} ·{" "}
            {OORT_CLOUD.innerAu.toLocaleString(locale)}–
            {OORT_CLOUD.outerAu.toLocaleString(locale)} AU
          </span>
        </Html>
      )}
    </group>
  );
}

/**
 * Một vệ tinh, quay quanh hành tinh mẹ.
 *
 * ## Bán kính quỹ đạo phải nén, và nén rất mạnh
 *
 * Quỹ đạo Mặt Trăng rộng 384.400 km trong khi Trái Đất bán kính 6.371 km —
 * tỉ lệ 60:1. Vẽ đúng tỉ lệ đó thì ở cỡ Trái Đất trong cảnh này, Mặt Trăng
 * nằm cách xa hơn cả khoảng cách tới Sao Kim, và bốn vệ tinh của Sao Mộc
 * trải rộng hơn cả vành đai tiểu hành tinh.
 *
 * Nén bằng logarit của tỉ lệ thật giữ được THỨ TỰ — Io trong cùng, Callisto
 * ngoài cùng, đúng như thực tế — trong khi kéo cả bốn về khoảng 3 tới 5 lần
 * bán kính hành tinh. Cái mất là tỉ lệ khoảng cách; cái giữ là cấu trúc, và
 * ở khung hình này thì chỉ giữ được một trong hai.
 */
function MoonBody({
  moon,
  planetRadius,
  planetRealRadiusKm,
  index,
  settings,
  locale,
}: {
  moon: (typeof MOONS)[number];
  planetRadius: number;
  planetRealRadiusKm: number;
  index: number;
  settings: SceneSettings;
  locale: string;
}) {
  const group = useRef<THREE.Group>(null);
  const angle = useRef((index * Math.PI * 2) / 3);

  const orbit =
    planetRadius *
    (2 + Math.log10(moon.orbitKm / planetRealRadiusKm) * 1.6);

  // Bán kính vẽ theo tỉ lệ thật so với hành tinh, nhưng có sàn để vệ tinh
  // nhỏ nhất không teo thành vô hình.
  const size = Math.max(
    planetRadius * 0.09,
    planetRadius * (moon.realRadiusKm / planetRealRadiusKm) * 0.6,
  );

  useFrame((_, delta) => {
    if (!settings.playing || !group.current) return;
    /*
     * Dấu của `periodDays` mang thông tin: Triton âm vì nó nghịch hành, quay
     * ngược chiều Sao Hải Vương tự quay. Chia cho chu kỳ nên dấu đi thẳng vào
     * chiều quay, không cần xử lý riêng.
     */
    angle.current += (delta * settings.speed * 2.2) / moon.periodDays;
    group.current.position.set(
      Math.cos(angle.current) * orbit,
      0,
      Math.sin(angle.current) * orbit,
    );
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial color={moon.color} roughness={0.9} />
      </mesh>

      {settings.showLabels && (
        <Html center distanceFactor={26} zIndexRange={[8, 0]}>
          <span className="rounded-full bg-black/65 px-1.5 py-0.5 text-[9px] whitespace-nowrap text-white/80 backdrop-blur-sm">
            {locale === "en" ? moon.nameEn : moon.name}
          </span>
        </Html>
      )}
    </group>
  );
}

/**
 * Hành tinh lùn và ba tiểu hành tinh có tên.
 *
 * Chúng đứng yên chứ không chuyển động: chu kỳ của Eris là 558 năm, và ở tốc
 * độ mà Trái Đất đi hết một vòng trong vài giây thì Eris nhích được vài phần
 * nghìn độ — chuyển động không quan sát được, chỉ tốn thêm phép tính mỗi
 * khung hình.
 *
 * Vẽ chúng nhỏ và có nhãn chứ không theo tỉ lệ: Sao Diêm Vương bán kính 1.188
 * km, ở cùng tỉ lệ với Trái Đất thì nó nhỏ hơn một điểm ảnh.
 */
function OuterWorlds({
  settings,
  locale,
  onSelect,
}: {
  settings: SceneSettings;
  locale: string;
  onSelect: (id: string) => void;
}) {
  const place = (au: number, eccentricity: number, inclinationDeg: number, seed: string) => {
    const semiMajor = settings.realScale
      ? auToRealScaleSafe(au)
      : educationalOrbitAu(au);
    const angle =
      (([...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360) *
        Math.PI) /
      180;
    return {
      semiMajor,
      position: orbitPoint(
        semiMajor,
        eccentricity,
        THREE.MathUtils.degToRad(inclinationDeg),
        angle,
      ),
    };
  };

  return (
    <group>
      {DWARF_PLANETS.map((world) => {
        const { semiMajor, position } = place(
          world.au,
          world.eccentricity,
          world.inclinationDeg,
          world.id,
        );
        return (
          <group key={world.id}>
            {settings.showOrbits && (
              <OrbitPath
                semiMajor={semiMajor}
                eccentricity={world.eccentricity}
                inclinationDeg={world.inclinationDeg}
                color={world.color}
                opacity={0.18}
              />
            )}
            <group position={position}>
              <mesh
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(world.id);
                }}
                onPointerOver={() => (document.body.style.cursor = "pointer")}
                onPointerOut={() => (document.body.style.cursor = "auto")}
              >
                <sphereGeometry args={[0.22, 20, 20]} />
                <meshStandardMaterial color={world.color} roughness={0.9} />
              </mesh>

              {settings.showLabels && (
                <Html center distanceFactor={60} zIndexRange={[9, 0]}>
                  <span className="rounded-full bg-black/65 px-2 py-0.5 text-[10px] whitespace-nowrap text-white/85 backdrop-blur-sm">
                    {locale === "en" ? world.nameEn : world.name}
                  </span>
                </Html>
              )}
            </group>
          </group>
        );
      })}

      {NAMED_ASTEROIDS.map((asteroid) => {
        const { position } = place(asteroid.au, 0.08, 8, asteroid.id);
        return (
          <group key={asteroid.id} position={position}>
            <mesh>
              <sphereGeometry args={[0.1, 12, 12]} />
              <meshStandardMaterial color="#cbbda6" roughness={1} />
            </mesh>
            {settings.showLabels && (
              <Html center distanceFactor={40} zIndexRange={[8, 0]}>
                <span className="rounded-full bg-black/65 px-1.5 py-0.5 text-[9px] whitespace-nowrap text-white/75 backdrop-blur-sm">
                  {locale === "en" ? asteroid.nameEn : asteroid.name}
                </span>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

/** Bọc `auToRealScale` vì hàm đó không được xuất ra ngoài solar-data. */
function auToRealScaleSafe(au: number): number {
  return 6 + Math.log10(au + 1) * 46;
}

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

      <AsteroidBelt settings={settings} locale={locale} lowPower={lowPower} />
      <KuiperBelt settings={settings} locale={locale} lowPower={lowPower} />
      <OortShell settings={settings} locale={locale} />

      {settings.showEcliptic && (
        <EclipticPlane
          radius={
            settings.realScale
              ? realScaleOrbit(PLANETS[PLANETS.length - 1])
              : educationalOrbit(PLANETS[PLANETS.length - 1])
          }
        />
      )}

      {settings.showDwarfs && (
        <OuterWorlds settings={settings} locale={locale} onSelect={onSelect} />
      )}

      {PLANETS.map((planet) => (
        <group key={planet.id}>
          {settings.showOrbits && (
            <OrbitPath
              semiMajor={
                settings.realScale
                  ? realScaleOrbit(planet)
                  : educationalOrbit(planet)
              }
              eccentricity={planet.eccentricity}
              inclinationDeg={planet.inclinationDeg}
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
