import * as THREE from "three";

import {
  BOX_HALF,
  FILAMENT_MAX_DISTANCE,
  MLY_PER_UNIT,
  NODE_COUNT,
  NODE_TIERS,
} from "@/lib/universe-data";

/**
 * Bộ sinh hình thái mạng vũ trụ.
 *
 * ## Vì sao không còn đường kẻ nối điểm
 *
 * Bản trước nối các nút bằng `lineSegments`. Hình thì gần đúng nhưng nó dạy
 * sai một điều: một đường kẻ sáng giữa hai chấm đọc ra là "tuyến đường", là
 * quan hệ giữa hai vật thể — trong khi filament không phải đường nối mà là
 * vật chất. Nó là một dải khí và vật chất tối dài hàng trăm triệu năm ánh
 * sáng, có bề dày, có mật độ, và các thiên hà nằm TRONG nó chứ không nằm ở
 * hai đầu nó.
 *
 * Nên ở đây không có đường kẻ nào. Sợi được dựng bằng hàng nghìn hạt sương
 * mờ chồng lấn, đặt dọc một đường cong với độ tán ngang thay đổi. Thứ hiện ra
 * là một dải sáng có thể tích, và hạt nào cũng mờ tới mức chỉ khi chồng nhau
 * mới thành hình — đúng cách các mô phỏng N-body được dựng ảnh.
 *
 * ## Vì sao sợi phải cong
 *
 * Đoạn thẳng giữa hai nút vẫn đọc ra là đường nối kể cả khi đã tán thành
 * sương. Mỗi sợi ở đây là một đường bậc hai với điểm giữa lệch ngẫu nhiên
 * theo phương vuông góc, nên không sợi nào trùng với đoạn thẳng nối hai đầu.
 *
 * ## Đây là hình thái, không phải mô phỏng
 *
 * Không có lực hấp dẫn nào được tính. Bộ sinh này tái tạo DÁNG của cấu trúc —
 * nút, sợi, tường, khoảng rỗng — chứ không suy ra nó từ vật lý. Số đo thật
 * nằm ở `UNIVERSE_SCALES` và `UNIVERSE_FACTS`.
 */

export type WebTier = keyof typeof NODE_TIERS | "group";

export type WebNode = {
  position: THREE.Vector3;
  /** Khối lượng quy ước, quyết định hạng và độ tụ của thiên hà quanh nút */
  weight: number;
  tier: WebTier;
};

export type CosmicVoid = {
  centre: THREE.Vector3;
  radius: number;
};

export type CosmicWeb = {
  /** Hạt sương dựng nên thân sợi — lớp cho ra cảm giác thể tích */
  filamentFog: THREE.BufferGeometry;
  /** Thiên hà: chấm nhỏ và sắc, nằm trong sợi và quanh nút */
  galaxies: THREE.BufferGeometry;
  /** Nút sáng cho cụm và siêu cụm */
  nodes: THREE.BufferGeometry;
  voids: CosmicVoid[];
  counts: {
    galaxies: number;
    filaments: number;
    superclusters: number;
    clusters: number;
    voids: number;
  };
};

/** Ngưỡng khối lượng phân hạng nút. */
const SUPERCLUSTER_WEIGHT = 1.75;
const CLUSTER_WEIGHT = 1.1;

/** Màu thân sợi khi ở xa nút — xám lam lạnh, nhạt hơn mọi thiên hà. */
const FILAMENT_COLD = new THREE.Color("#41527d");

/** Màu thân sợi khi tiến sát nút — vật chất dồn lại thì ấm và sáng hơn. */
const FILAMENT_WARM = new THREE.Color("#8fa6e8");

function gaussian(random: () => number): number {
  return (random() + random() + random() - 1.5) / 1.5;
}

/**
 * Bộ sinh số giả ngẫu nhiên có hạt giống (mulberry32).
 *
 * `Math.random()` cho ra một vũ trụ khác nhau mỗi lần dựng lại component, nên
 * không thể so hai lần chạy để biết một thay đổi có đúng ý không, và ảnh chụp
 * màn hình trong tài liệu thì lần nào cũng lệch. Có hạt giống thì hình cố
 * định, mà vẫn không phải nhúng kèm một tệp dữ liệu toạ độ.
 */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tierOf(weight: number): WebTier {
  if (weight >= SUPERCLUSTER_WEIGHT) return "supercluster";
  if (weight >= CLUSTER_WEIGHT) return "cluster";
  return "group";
}

/**
 * Một sợi: đường cong bậc hai giữa hai nút.
 *
 * Điểm giữa bị đẩy lệch theo một phương vuông góc với trục nối. Biên độ lệch
 * tỉ lệ với chiều dài sợi — sợi ngắn gần như thẳng, sợi dài võng rõ, đúng như
 * hình dạng trong các lát cắt khảo sát bầu trời.
 */
function filamentCurve(
  a: THREE.Vector3,
  b: THREE.Vector3,
  random: () => number,
): THREE.QuadraticBezierCurve3 {
  const axis = b.clone().sub(a);
  const length = axis.length();

  // Một vector bất kỳ không song song với trục, để lấy tích có hướng
  const seed = Math.abs(axis.y) < 0.9 * length
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0);
  const perpendicular = axis.clone().cross(seed).normalize();
  perpendicular.applyAxisAngle(
    axis.clone().normalize(),
    random() * Math.PI * 2,
  );

  const mid = a
    .clone()
    .lerp(b, 0.5)
    .addScaledVector(perpendicular, (random() - 0.5) * length * 0.42);

  return new THREE.QuadraticBezierCurve3(a, mid, b);
}

export function buildCosmicWeb(seed = 20260911): CosmicWeb {
  const random = seededRandom(seed);

  // ------------------------------------------------------------- 1. Gieo nút
  const nodes: WebNode[] = [];
  for (let i = 0; i < NODE_COUNT; i += 1) {
    const r = Math.pow(random(), 0.75) * BOX_HALF;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const weight = 0.35 + Math.pow(random(), 2.2) * 1.9;
    nodes.push({
      position: new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      ),
      weight,
      tier: tierOf(weight),
    });
  }

  // ------------------------------------------------------------- 2. Nối sợi
  const curves: Array<{ curve: THREE.QuadraticBezierCurve3; mass: number }> = [];
  const degree = new Array(nodes.length).fill(0);

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      if (degree[i] >= 4 || degree[j] >= 4) continue;
      const distance = nodes[i].position.distanceTo(nodes[j].position);
      if (distance > FILAMENT_MAX_DISTANCE) continue;
      // Sợi càng dài càng ít khả năng tồn tại
      if (random() > 1 - distance / FILAMENT_MAX_DISTANCE) continue;

      curves.push({
        curve: filamentCurve(nodes[i].position, nodes[j].position, random),
        // Sợi nối hai nút nặng thì dày và sáng hơn
        mass: (nodes[i].weight + nodes[j].weight) / 2,
      });
      degree[i] += 1;
      degree[j] += 1;
    }
  }

  // ------------------------------------------ 3. Sương thân sợi và thiên hà
  const fogPos: number[] = [];
  const fogColor: number[] = [];
  const galaxyPos: number[] = [];
  const galaxyColor: number[] = [];

  const scratch = new THREE.Color();
  const superclusterColor = new THREE.Color(NODE_TIERS.supercluster.color);
  const clusterColor = new THREE.Color(NODE_TIERS.cluster.color);
  const galaxyColorBase = new THREE.Color(NODE_TIERS.galaxy.color);

  for (const { curve, mass } of curves) {
    const length = curve.getLength();

    /*
     * Mật độ hạt dồn về hai đầu. `t` rải theo phân bố hình chữ U: lấy một số
     * đều rồi đẩy nó ra xa 0,5. Nhờ vậy chỗ tiếp giáp nút đặc lại và thân sợi
     * thưa dần — đúng yêu cầu "mật độ tăng dần về phía các nút giao", và cũng
     * là lý do mắt đọc ra nút là nút chứ không phải một chấm to.
     */
    /*
     * 75 hạt mỗi đơn vị dài là trần đặt theo tốc độ lấp điểm ảnh, không phải
     * theo thẩm mỹ. Hạt sương vẽ bằng phép cộng dồn nên GPU phải chạm vào mọi
     * điểm ảnh của mọi hạt, kể cả phần trong suốt. Ở 260 hạt mỗi đơn vị thì
     * lớp này có 304 nghìn hạt, mỗi hạt phủ chừng 30 px ở khoảng cách xem
     * thường — hơn 200 triệu điểm ảnh mỗi khung hình, đủ làm sụt khung hình
     * trên máy không có card rời. Ở 75 thì còn khoảng 88 nghìn hạt, và độ dày
     * được bù lại bằng cỡ hạt nhỏ hơn cùng độ đậm cao hơn ở chỗ vẽ.
     */
    const fogCount = Math.round(length * 75 * (0.6 + mass * 0.4));
    for (let k = 0; k < fogCount; k += 1) {
      const u = random();
      const t = 0.5 + Math.sign(u - 0.5) * Math.pow(Math.abs(u - 0.5) * 2, 0.62) * 0.5;
      const point = curve.getPoint(t);

      // Thắt ở giữa, loe ra hai đầu nơi sợi tan vào nút
      const edge = Math.abs(t - 0.5) * 2;
      const radius = (0.12 + 0.55 * Math.pow(edge, 2.2)) * (0.7 + mass * 0.3);

      point.x += gaussian(random) * radius;
      point.y += gaussian(random) * radius;
      point.z += gaussian(random) * radius;
      fogPos.push(point.x, point.y, point.z);

      // Càng gần nút càng ấm và sáng — màu chính là bản đồ mật độ
      scratch.copy(FILAMENT_COLD).lerp(FILAMENT_WARM, Math.pow(edge, 1.6));
      const dim = 0.35 + random() * 0.65;
      fogColor.push(scratch.r * dim, scratch.g * dim, scratch.b * dim);
    }

    // Thiên hà nằm trong sợi, bám sát trục hơn hạt sương
    const galaxyCount = Math.round(length * 22);
    for (let k = 0; k < galaxyCount; k += 1) {
      const t = random();
      const point = curve.getPoint(t);
      const radius = 0.06 + 0.16 * Math.abs(t - 0.5);
      point.x += gaussian(random) * radius;
      point.y += gaussian(random) * radius;
      point.z += gaussian(random) * radius;
      galaxyPos.push(point.x, point.y, point.z);

      const dim = 0.4 + random() * 0.5;
      galaxyColor.push(
        galaxyColorBase.r * dim,
        galaxyColorBase.g * dim,
        galaxyColorBase.b * dim,
      );
    }
  }

  // ------------------------------------------------- 4. Thiên hà tụ quanh nút
  const nodePos: number[] = [];
  const nodeColor: number[] = [];
  let superclusters = 0;
  let clusters = 0;

  for (const node of nodes) {
    const tint =
      node.tier === "supercluster"
        ? superclusterColor
        : node.tier === "cluster"
          ? clusterColor
          : galaxyColorBase;

    if (node.tier === "supercluster") superclusters += 1;
    if (node.tier === "cluster") clusters += 1;

    const count = Math.round(node.weight * 150);
    for (let k = 0; k < count; k += 1) {
      const spread = node.weight * 0.3 * Math.pow(random(), 0.55);
      const point = node.position.clone();
      point.x += gaussian(random) * spread;
      point.y += gaussian(random) * spread;
      point.z += gaussian(random) * spread;
      galaxyPos.push(point.x, point.y, point.z);

      const dim = 0.45 + random() * 0.55;
      galaxyColor.push(tint.r * dim, tint.g * dim, tint.b * dim);
    }

    if (node.tier === "group") continue;
    nodePos.push(node.position.x, node.position.y, node.position.z);
    nodeColor.push(tint.r, tint.g, tint.b);
  }

  // ------------------------------ 5. Thiên hà lẻ trong void — rỗng, không trống
  for (let i = 0; i < 1500; i += 1) {
    const point = new THREE.Vector3(
      (random() * 2 - 1) * BOX_HALF,
      (random() * 2 - 1) * BOX_HALF,
      (random() * 2 - 1) * BOX_HALF,
    );
    if (point.length() > BOX_HALF) continue;
    galaxyPos.push(point.x, point.y, point.z);
    const dim = 0.18 + random() * 0.22;
    galaxyColor.push(
      galaxyColorBase.r * dim,
      galaxyColorBase.g * dim,
      galaxyColorBase.b * dim,
    );
  }

  // -------------------------------------------------------- 6. Tìm các void
  const voids = findVoids(nodes, random);

  const make = (position: number[], color: number[]) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(position, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(color, 3));
    return geometry;
  };

  return {
    filamentFog: make(fogPos, fogColor),
    galaxies: make(galaxyPos, galaxyColor),
    nodes: make(nodePos, nodeColor),
    voids,
    counts: {
      galaxies: galaxyPos.length / 3,
      filaments: curves.length,
      superclusters,
      clusters,
      voids: voids.length,
    },
  };
}

/**
 * Khoanh vùng những khoảng rỗng lớn nhất.
 *
 * Không đi tìm biên thật của void — việc đó cần một phép phân hoạch không
 * gian, và kết quả cũng chỉ để vẽ mấy vòng mờ. Ở đây gieo điểm thử, giữ lại
 * điểm xa mọi nút nhất, rồi nở một quả cầu quanh nó tới khi chạm nút gần
 * nhất. Loại các quả cầu chồng nhau để không vẽ cùng một khoảng rỗng hai lần.
 *
 * Bán kính có ý nghĩa thật: nhân với `MLY_PER_UNIT` ra đường kính tính bằng
 * triệu năm ánh sáng, và con số đó nằm trong dải 100–300 mà quan sát cho.
 */
function findVoids(nodes: WebNode[], random: () => number): CosmicVoid[] {
  const candidates: CosmicVoid[] = [];

  for (let i = 0; i < 900; i += 1) {
    const centre = new THREE.Vector3(
      (random() * 2 - 1) * BOX_HALF,
      (random() * 2 - 1) * BOX_HALF,
      (random() * 2 - 1) * BOX_HALF,
    );
    // Bỏ điểm quá gần rìa khối: quả cầu ở đó rỗng chỉ vì mô hình hết chỗ
    if (centre.length() > BOX_HALF * 0.7) continue;

    let nearest = Infinity;
    for (const node of nodes) {
      const d = centre.distanceTo(node.position);
      if (d < nearest) nearest = d;
    }
    if (nearest < 1.6) continue;
    candidates.push({ centre, radius: nearest });
  }

  candidates.sort((a, b) => b.radius - a.radius);

  const kept: CosmicVoid[] = [];
  for (const candidate of candidates) {
    if (kept.length >= 7) break;
    const overlaps = kept.some(
      (other) =>
        other.centre.distanceTo(candidate.centre) <
        (other.radius + candidate.radius) * 0.75,
    );
    if (!overlaps) kept.push(candidate);
  }
  return kept;
}

/** Đường kính một khoảng rỗng, tính bằng triệu năm ánh sáng. */
export function voidDiameterMly(cosmicVoid: CosmicVoid): number {
  return Math.round(cosmicVoid.radius * 2 * MLY_PER_UNIT);
}
