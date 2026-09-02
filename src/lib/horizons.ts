import "server-only";

import { unstable_cache } from "next/cache";

/**
 * Vị trí thật của các hành tinh, lấy từ API Horizons của JPL/NASA.
 *
 * Horizons không trả header CORS nên trình duyệt không gọi thẳng được — phải
 * đi qua máy chủ của mình. Kết quả được cache 6 giờ: hành tinh nhanh nhất là
 * Sao Thuỷ cũng chỉ đi khoảng 4 độ mỗi ngày, nên sai số sau 6 giờ dưới 1 độ,
 * trong khi việc gọi lại mỗi lượt truy cập là bất lịch sự với máy chủ của họ.
 *
 * Nếu gọi hỏng, hàm trả về `null` và cảnh 3D quay lại dùng góc tượng trưng —
 * trang không được phép vỡ chỉ vì một API bên ngoài không phản hồi.
 */

/** Mã thiên thể trong Horizons: tâm hành tinh, không phải tâm khối hệ. */
const BODY_IDS: Record<string, string> = {
  mercury: "199",
  venus: "299",
  earth: "399",
  mars: "499",
  jupiter: "599",
  saturn: "699",
  uranus: "799",
  neptune: "899",
};

export type PlanetPositions = {
  /** Ngày ứng với vị trí, dạng YYYY-MM-DD (UTC) */
  epoch: string;
  /** Kinh độ hoàng đạo nhật tâm, radian, theo id hành tinh */
  longitudes: Record<string, number>;
};

function isoDay(offsetDays = 0): string {
  return new Date(Date.now() + offsetDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/**
 * Lấy toạ độ nhật tâm của một thiên thể rồi quy ra kinh độ hoàng đạo.
 *
 * Chỉ cần góc trên mặt phẳng hoàng đạo: cảnh 3D vẽ mọi quỹ đạo trên cùng một
 * mặt phẳng, nên thành phần Z (độ nghiêng quỹ đạo, lớn nhất cũng chỉ 7 độ ở
 * Sao Thuỷ) không dùng tới.
 */
async function fetchLongitude(
  id: string,
  start: string,
  stop: string,
): Promise<number | null> {
  const params = new URLSearchParams({
    format: "text",
    COMMAND: `'${id}'`,
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'VECTORS'",
    // 500@10 = tâm Mặt Trời
    CENTER: "'500@10'",
    START_TIME: `'${start}'`,
    STOP_TIME: `'${stop}'`,
    STEP_SIZE: "'1 d'",
    VEC_TABLE: "'1'",
    OUT_UNITS: "'AU-D'",
    REF_PLANE: "'ECLIPTIC'",
  });

  const response = await fetch(
    `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`,
    { signal: AbortSignal.timeout(15_000) },
  );
  if (!response.ok) return null;

  const text = await response.text();
  // Khối dữ liệu nằm giữa hai mốc $$SOE và $$EOE; lấy bản ghi đầu tiên
  const block = text.match(/\$\$SOE([\s\S]*?)\$\$EOE/);
  if (!block) return null;

  const vector = block[1].match(
    /X\s*=\s*(-?[\d.]+E?[+-]?\d*)\s*Y\s*=\s*(-?[\d.]+E?[+-]?\d*)/i,
  );
  if (!vector) return null;

  const x = Number(vector[1]);
  const y = Number(vector[2]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  return Math.atan2(y, x);
}

export const getPlanetPositions = unstable_cache(
  async (): Promise<PlanetPositions | null> => {
    const start = isoDay(0);
    const stop = isoDay(1);

    const results = await Promise.allSettled(
      Object.entries(BODY_IDS).map(async ([planet, id]) => {
        const longitude = await fetchLongitude(id, start, stop);
        return [planet, longitude] as const;
      }),
    );

    const longitudes: Record<string, number> = {};
    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const [planet, longitude] = result.value;
      if (longitude !== null) longitudes[planet] = longitude;
    }

    // Thiếu quá nửa thì coi như hỏng — hiển thị nửa thật nửa tượng trưng còn
    // tệ hơn là nói thẳng rằng đây là vị trí minh hoạ.
    if (Object.keys(longitudes).length < Object.keys(BODY_IDS).length) {
      return null;
    }

    return { epoch: start, longitudes };
  },
  ["planet-positions"],
  { revalidate: 21_600, tags: ["planet-positions"] },
);

/** Bọc lại để lỗi mạng không làm hỏng cả trang. */
export async function tryGetPlanetPositions(): Promise<PlanetPositions | null> {
  try {
    return await getPlanetPositions();
  } catch (error) {
    console.warn(
      "[horizons] không lấy được vị trí hành tinh:",
      (error as Error).message,
    );
    return null;
  }
}
