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
export function useProgressiveTexture(url: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
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
        loaded.colorSpace = THREE.SRGBColorSpace;
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
  }, [url]);

  useEffect(() => () => texture?.dispose(), [texture]);

  return texture;
}
