"use client";
/* 'use client' vì chạy trong canvas WebGL qua useFrame của react-three-fiber. */

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Điểm đích trên màn hình, theo phần trăm bề rộng/cao của khung cảnh
 * (0–100). Phần trăm chứ không phải pixel: khung đổi cỡ theo màn hình, và
 * mọi lớp của hành trình thu phóng (CSS, canvas 2D, DOM) đều quy về khung.
 */
export type ZoomTargetPoint = { x: number; y: number };

/**
 * Hộp chứa điểm đích mà một cảnh ghi vào mỗi khung hình và hành trình đọc.
 *
 * Là ref chứ không phải state: điểm đổi 60 lần mỗi giây (đĩa Ngân Hà quay,
 * Trái Đất chạy quỹ đạo), đưa qua state sẽ render lại cả cây React theo nhịp
 * đó để vẽ lại đúng thứ three.js đã vẽ xong.
 */
export type ZoomTargetRef = { current: ZoomTargetPoint | null };

/**
 * Neo vô hình đặt tại vị trí của thiên thể đích trong một cảnh 3D; mỗi khung
 * hình chiếu vị trí thế giới của neo xuống toạ độ màn hình và ghi vào
 * `targetRef`.
 *
 * Đặt component này LÀM CON của nhóm mang thiên thể (nhóm quay của đĩa Ngân
 * Hà, nhóm thân của Trái Đất, nhóm mốc "nhà" của mạng vũ trụ) thì neo thừa
 * hưởng mọi phép biến đổi của cha — người viết cảnh không phải tự nhân ma
 * trận quay. Đích ra sau camera thì ghi `null`: hành trình hiểu là "không
 * nhắm được" và lùi về bay vào tâm như trước.
 */
export function TargetTracker({ targetRef }: { targetRef: ZoomTargetRef }) {
  const anchor = useRef<THREE.Group>(null);
  const world = useRef(new THREE.Vector3());
  const inCameraSpace = useRef(new THREE.Vector3());

  /* Cảnh bị gỡ (đổi cấp) thì xoá điểm: hành trình mà đọc phải toạ độ của một
     cảnh không còn tồn tại sẽ nhắm vào chỗ trống. */
  useEffect(
    () => () => {
      targetRef.current = null;
    },
    [targetRef],
  );

  useFrame(({ camera }) => {
    if (!anchor.current) return;
    anchor.current.getWorldPosition(world.current);

    /* Kiểm tra "sau lưng camera" trong không gian camera trước khi chiếu:
       phép chiếu phối cảnh của three lật dấu qua mặt phẳng camera, nên một
       điểm ở sau lưng vẫn cho ra toạ độ màn hình trông như thật — chỉ mirrored.
       Trong không gian camera, điểm nhìn thấy được có z âm. */
    inCameraSpace.current
      .copy(world.current)
      .applyMatrix4(camera.matrixWorldInverse);
    if (inCameraSpace.current.z > -0.1) {
      if (targetRef.current) targetRef.current = null;
      return;
    }

    const projected = world.current.project(camera);
    targetRef.current = {
      x: (projected.x * 0.5 + 0.5) * 100,
      y: (-projected.y * 0.5 + 0.5) * 100,
    };
  });

  return <group ref={anchor} />;
}
