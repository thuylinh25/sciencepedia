"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

/**
 * Nạp bản đồ bề mặt mà KHÔNG treo cảnh 3D.
 *
 * Trước đây các texture được nạp bằng `useLoader`, vốn treo component cho tới
 * khi ảnh về. Cả cảnh nằm trong một Suspense nên trên mạng di động người xem
 * chỉ thấy một khung đen suốt hàng chục giây — và nếu Wikimedia trả 429 hoặc
 * một ảnh lỗi thì Suspense không bao giờ giải, khung đen đó là vĩnh viễn.
 *
 * Cách này thì ngược lại: cảnh vẽ ngay bằng màu phẳng của từng hành tinh, ảnh
 * về tới đâu thay tới đó. Ảnh nào hỏng thì hành tinh đó giữ màu phẳng, phần
 * còn lại không bị ảnh hưởng.
 */
export function useProgressiveTexture(
  /**
   * Để trống (`null`/`undefined`) thì hook không nạp gì và trả `null`.
   * Cần thế vì lớp mây là tuỳ chọn: chỉ Trái Đất có, và gọi `load("")` sẽ
   * bắn một request rỗng rồi rơi thẳng vào nhánh lỗi — im lặng nhưng vô ích.
   */
  url: string | null | undefined,
  /**
   * `"srgb"` cho ảnh MÀU (bản đồ bề mặt), `"linear"` cho ảnh DỮ LIỆU.
   *
   * Bản đồ mây dùng làm `alphaMap`: giá trị của nó là độ che phủ, không phải
   * màu. Giải mã sRGB trên một kênh dữ liệu sẽ kéo cong thang độ — mây mỏng
   * nhạt đi, mây dày đặc thêm. Mặc định giữ `"srgb"` để mọi chỗ gọi cũ không
   * đổi hành vi.
   */
  colorSpace: "srgb" | "linear" = "srgb",
): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }

    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    loader.load(
      url,
      (loaded) => {
        if (cancelled) {
          loaded.dispose();
          return;
        }
        // Ảnh equirectangular cần không gian màu sRGB, nếu không sẽ bị nhợt màu
        loaded.colorSpace =
          colorSpace === "linear"
            ? THREE.LinearSRGBColorSpace
            : THREE.SRGBColorSpace;
        loaded.anisotropy = 8;
        setTexture(loaded);
      },
      undefined,
      () => {
        // Hỏng thì im lặng giữ màu phẳng — không được phép làm vỡ cả cảnh
      },
    );

    return () => {
      cancelled = true;
    };
  }, [url, colorSpace]);

  useEffect(() => () => texture?.dispose(), [texture]);

  return texture;
}
