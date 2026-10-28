"use client";
/* 'use client' vì chạy trong canvas WebGL qua useFrame của react-three-fiber. */

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import type { ZoomTargetWorldRef } from "@/components/zoom/target-tracker";

/** Thời gian trượt camera, mili giây — mục 3 của P2 ("khoảng 300 ms"). */
export const CENTER_MS = 300;

/**
 * Hộp lệnh "đưa đích về giữa khung": hành trình ghi một hàm vào đây, cảnh
 * hiện tại nhận lệnh qua rig. Là ref vì người gọi và người thực hiện ở hai
 * phía của canvas WebGL, và lệnh chỉ có nghĩa trong khoảnh khắc bấm.
 */
export type CenterTargetRef = { current: (() => void) | null };

/** Phần tối thiểu của OrbitControls mà rig cần — tránh phụ thuộc kiểu đầy
    đủ của three-stdlib ở mọi nơi rig xuất hiện. */
type ControlsLike = {
  target: THREE.Vector3;
  enabled: boolean;
  update: () => void;
};

/**
 * Trượt camera cho thiên thể đích về giữa khung trong ~300 ms (mục 3 của P2).
 *
 * "Trượt" theo nghĩa đen: camera và tâm điều khiển cùng tịnh tiến một vector
 * `đích − tâm hiện tại`, giữ nguyên hướng nhìn và khoảng cách. Cảnh vật lướt
 * ngang qua khung cho tới khi đích nằm giữa — không xoay, không phóng, nên
 * người xem không mất phương hướng như khi camera nhảy góc. Sau cú trượt, cú
 * lao của hành trình xuất phát từ giữa khung, dễ đọc nhất.
 *
 * Cú trượt cũng là phương án cứu khi người xem đã kéo xoay cho đích ra khỏi
 * khung hoặc ra sau camera: đích không còn toạ độ màn hình, nhưng vị trí 3D
 * của nó (`worldRef`, do `TargetTracker` ghi) thì luôn có, và tịnh tiến theo
 * vector đó đưa nó về giữa bất kể nó đang lẩn ở đâu.
 *
 * Trong lúc trượt, điều khiển bị khoá: người xem kéo chen vào sẽ giành
 * camera với rig, và 300 ms là quá ngắn để đáng đánh nhau.
 */
export function CenterTargetRig({
  centerRef,
  worldRef,
}: {
  centerRef: CenterTargetRef;
  worldRef: ZoomTargetWorldRef;
}) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as unknown as
    | ControlsLike
    | null;
  const anim = useRef<{
    start: number;
    fromPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    delta: THREE.Vector3;
  } | null>(null);

  useEffect(() => {
    centerRef.current = () => {
      const point = worldRef.current;
      if (!point || !controls) return;
      const delta = point.clone().sub(controls.target);
      /* Đích đã ở tâm điều khiển thì không có gì phải trượt. */
      if (delta.lengthSq() < 1e-8) return;
      anim.current = {
        start: performance.now(),
        fromPos: camera.position.clone(),
        fromTarget: controls.target.clone(),
        delta,
      };
      controls.enabled = false;
    };
    return () => {
      centerRef.current = null;
    };
  }, [camera, centerRef, controls, worldRef]);

  useFrame(() => {
    const current = anim.current;
    if (!current || !controls) return;
    const t = Math.min((performance.now() - current.start) / CENTER_MS, 1);
    /* easeInOutQuad: rời chỗ chậm, lướt nhanh ở giữa, cập bến chậm — cùng
       ngữ pháp tăng/hãm tốc của lớp bay. */
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    camera.position
      .copy(current.fromPos)
      .addScaledVector(current.delta, eased);
    controls.target
      .copy(current.fromTarget)
      .addScaledVector(current.delta, eased);
    controls.update();
    if (t >= 1) {
      anim.current = null;
      controls.enabled = true;
    }
  });

  return null;
}
