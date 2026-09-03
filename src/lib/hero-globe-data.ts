import type { GlobeBody } from "@/components/solar/globe-scene";

/**
 * Trái Đất cho quả cầu trên hero.
 *
 * Tách khỏi `solar-data.ts` một cách có chủ ý: file đó chứa dữ liệu của cả
 * chín thiên thể kèm quỹ đạo, chu kỳ, nhiệt độ, mô tả song ngữ — kéo nguyên
 * nó vào bundle của trang chủ chỉ để lấy một đường dẫn ảnh và một góc nghiêng
 * là trả giá cho thứ không dùng tới.
 *
 * Ba trường phải khớp với `solar-data.ts`; đổi bên đó thì đổi cả ở đây.
 */
export const EARTH_GLOBE: GlobeBody = {
  texture:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Solarsystemscope_texture_2k_earth_daymap.jpg/1280px-Solarsystemscope_texture_2k_earth_daymap.jpg",
  fallbackColor: "#2e6fdb",
  axialTilt: 23.4,
};
