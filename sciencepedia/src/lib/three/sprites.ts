import { useMemo } from "react";
import * as THREE from "three";

/**
 * Sprite vẽ bằng canvas, dùng chung cho các scene ba chiều.
 *
 * Mọi lớp điểm trong `galaxy-scene` và `universe-scene` đều cần một texture
 * tròn mờ dần: `pointsMaterial` mặc định vẽ mỗi điểm thành hình vuông đặc, và
 * với hàng chục nghìn điểm thì kết quả trông như nhiễu hạt. Trước đây mỗi
 * scene tự dựng lấy canvas của mình, nên cùng một "sprite sao" tồn tại hai bản
 * với gradient stop đã lệch nhau — sửa một bên không kéo theo bên kia.
 *
 * Ở đây chỉ gom phần KHUNG (tạo canvas, lấy context, đóng thành CanvasTexture).
 * Gradient stop vẫn do từng scene truyền vào, vì nó là lựa chọn thị giác của
 * scene đó chứ không phải hằng số dùng chung.
 */

/** Một chặng màu của gradient: vị trí 0→1 và màu CSS tại đó. */
export type GradientStop = readonly [offset: number, color: string];

/**
 * Dựng texture từ một hàm vẽ tuỳ ý.
 *
 * `ctx` có thể là null khi trình duyệt từ chối cấp context 2d; khi đó ta vẫn
 * trả về texture rỗng thay vì ném lỗi, để scene mất sprite chứ không sập.
 */
export function canvasTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Texture gradient tròn, toả từ tâm ra mép. */
export function radialSprite(
  size: number,
  stops: readonly GradientStop[],
): THREE.Texture {
  return canvasTexture(size, (ctx) => {
    const half = size / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
    for (const [offset, color] of stops) gradient.addColorStop(offset, color);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  });
}

/**
 * Bản hook của `radialSprite`.
 *
 * `stops` cố tình KHÔNG nằm trong mảng phụ thuộc: các scene truyền vào một
 * hằng số ở tầng module, và nếu truyền literal thì so sánh tham chiếu sẽ dựng
 * lại texture mỗi lần render — đắt hơn nhiều so với lợi ích.
 */
export function useRadialSprite(
  size: number,
  stops: readonly GradientStop[],
): THREE.Texture {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => radialSprite(size, stops), [size]);
}

/** Bản hook của `canvasTexture`, cho sprite không phải gradient tròn. */
export function useCanvasTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
): THREE.Texture {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => canvasTexture(size, draw), [size]);
}
