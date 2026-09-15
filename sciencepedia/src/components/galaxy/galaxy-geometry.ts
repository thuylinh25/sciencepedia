import { useMemo } from "react";
import * as THREE from "three";

import {
  ARM_COUNT,
  ARM_SPIN,
  BULGE_RADIUS,
  DISK_RADIUS,
  DISK_THICKNESS,
} from "@/lib/galaxy-data";

/**
 * Sinh hình học cho các lớp sao của Ngân Hà.
 *
 * Tách khỏi `galaxy-scene.tsx` vì đây là toán thuần: nhận số điểm, trả về
 * BufferGeometry. Không đụng tới scene graph, không giữ ref, không vẽ gì —
 * nên đọc và chỉnh được độc lập với phần dựng cảnh.
 */

/** Xấp xỉ phân phối chuẩn bằng tổng ba số ngẫu nhiên đều — đủ tốt và rất rẻ. */
function gaussian(): number {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
}

const CORE_COLOR = new THREE.Color("#ffe0ad");
const MID_COLOR = new THREE.Color("#dfe4ff");
const ARM_COLOR = new THREE.Color("#7fa8ff");

/**
 * Một lớp sao của đĩa, rải theo bốn nhánh xoắn ốc loga.
 *
 * Đĩa được dựng bằng ba lớp có kích thước điểm khác nhau thay vì một lớp duy
 * nhất: sao thật không đều nhau về độ sáng, và một lớp đồng cỡ trông rất giả.
 * `spread` hẹp ở trong và loe dần ra ngoài nên hình xoắn rõ ở giữa, nhoè ở rìa
 * — đúng như ảnh chụp các thiên hà xoắn ốc.
 */
export function useDiskGeometry(count: number, spreadScale: number) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scratch = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      // luỹ thừa < 1 dồn nhiều sao về phía trong
      const t = Math.pow(Math.random(), 0.62);
      const radius = t * DISK_RADIUS;

      const arm = ((i % ARM_COUNT) / ARM_COUNT) * Math.PI * 2;
      const spin = radius * ARM_SPIN * Math.PI;
      const spread = (0.09 + 0.45 * t) * spreadScale;
      const angle = arm + spin + gaussian() * spread;

      const jitter = gaussian() * 0.18 * (0.4 + t);
      positions[i * 3] = Math.cos(angle) * radius + jitter;
      // đĩa phồng ở tâm, mỏng dần ra rìa
      positions[i * 3 + 1] =
        gaussian() * DISK_THICKNESS * (1 + 4 * Math.exp(-radius / 1.8));
      positions[i * 3 + 2] = Math.sin(angle) * radius + jitter;

      // vàng ở lõi → trắng → xanh ra rìa
      scratch
        .copy(CORE_COLOR)
        .lerp(MID_COLOR, Math.min(1, t * 1.9))
        .lerp(ARM_COLOR, Math.max(0, t * 1.5 - 0.45));

      const dim = 0.5 + Math.random() * 0.5;
      colors[i * 3] = scratch.r * dim;
      colors[i * 3 + 1] = scratch.g * dim;
      colors[i * 3 + 2] = scratch.b * dim;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [count, spreadScale]);
}

/** Phần phình trung tâm: đám sao già hình thanh dẹt, màu vàng cam. */
export function useBulgeGeometry(count: number) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scratch = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      const r = Math.pow(Math.random(), 0.45) * BULGE_RADIUS;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.4;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * 0.72;

      scratch.setHSL(0.095, 0.8, 0.55 + Math.random() * 0.32);
      colors[i * 3] = scratch.r;
      colors[i * 3 + 1] = scratch.g;
      colors[i * 3 + 2] = scratch.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [count]);
}

/** Quầng thiên hà: các cụm sao cầu rải thưa quanh đĩa. */
export function useHaloGeometry(count: number) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const r =
        BULGE_RADIUS + Math.pow(Math.random(), 0.4) * DISK_RADIUS * 1.15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [count]);
}
