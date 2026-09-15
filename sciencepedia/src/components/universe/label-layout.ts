import { useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import {
  COSMIC_LANDMARKS,
  UNIVERSE_SCALES,
  landmarkPosition,
} from "@/lib/universe-data";

/* ────────────────────────── Giãn nhãn, dùng chung ──────────────────────────

   Chốt 2026-09-06 sau khi nhãn đè lên nhau ở mức thu nhỏ mặc định.

   Trước đây mỗi nhóm nhãn tự lo lấy mình: `Landmarks` có logic tránh đè, còn
   `ScaleShells` thì không có gì cả. Hai nhóm render trong hai <group> tách
   biệt nên không nhóm nào biết nhóm kia đang chiếm chỗ nào — và một cơ chế
   tránh đè chỉ nhìn thấy một nửa số nhãn thì không phải cơ chế tránh đè.

   Phép đo cũ còn sai ở hai chỗ nữa, và cả hai đều làm khung va chạm lệch khỏi
   thứ đang thật sự hiện trên màn hình:

   1. Nó chiếu TÂM VẬT THỂ, trong khi <Html> được đặt lệch lên trên vài đơn vị
      thế giới. Hai điểm đó không rơi vào cùng một chỗ trên màn hình.
   2. Nó so hai tâm nhãn bằng một khung cứng 150×30 px, trong khi drei co giãn
      nhãn theo khoảng cách camera. Cùng một cặp nhãn, lúc thu nhỏ cách nhau
      30 px thật, lúc phóng to cách nhau 300 px — một ngưỡng cứng không thể
      đúng ở cả hai đầu, và nó cũng bỏ qua việc "Ngân Hà — bạn đang ở đây"
      rộng gấp đôi "Đám Virgo".

   Bản này chiếu ĐÚNG điểm neo của nhãn, ước lượng bề rộng theo số ký tự thật
   của từng nhãn, rồi nhân với đúng hệ số drei dùng. */

/**
 * Hệ số drei áp cho `<Html distanceFactor>`, chép từ `objectScale()` của nó:
 * `scale = distanceFactor / (2·tan(fov/2)·khoảng cách tới camera)`.
 *
 * Phải khớp chính xác. Sai số ở đây là sai số của khung va chạm, và nó biểu
 * hiện thành đúng cái lỗi ta đang sửa.
 */
function htmlScale(
  camera: THREE.Camera,
  anchor: THREE.Vector3,
  distanceFactor: number,
): number {
  const { fov } = camera as THREE.PerspectiveCamera;
  const vFOV = (fov * Math.PI) / 180;
  const dist = camera.position.distanceTo(anchor);
  return distanceFactor / (2 * Math.tan(vFOV / 2) * dist);
}

/* Bề rộng nhãn khi chưa co giãn, đo thô theo số ký tự.
   Đo DOM thật sẽ chính xác hơn nhưng không khả thi: nhãn bị ẩn thì không có
   DOM để mà đo, nên phép đo sẽ dao động qua lại giữa hai trạng thái. */
const CHAR_PX = 6.4;
const PAD_PX = 26;
const LABEL_PX_H = 26;
/** Khe hở tối thiểu: hai nhãn sát cạnh nhau vẫn khó đọc dù về hình học là không đè. */
const GAP_PX = 8;

/** Nhãn mốc nằm lệch lên trên chấm sáng; mốc "home" to hơn nên lệch nhiều hơn. */
export const landmarkLabelY = (home: boolean) => (home ? 0.75 : 0.45);
export const shellLabelPos = (radius: number): [number, number, number] => [
  0,
  radius * 0.72,
  radius * 0.72,
];
/*
 * Nhãn to bằng distanceFactor / khoảng cách tới camera, nên càng lại gần
 * càng phình. Ở 22 thì lúc bay vào giữa mạng vũ trụ một cái nhãn chiếm gần
 * nửa bề ngang khung và che mất chính cấu trúc nó đang chỉ vào. 13 giữ nhãn
 * đọc được ở tầm nhìn mặc định mà không nuốt hình khi phóng to.
 */
export const LANDMARK_FACTOR = 13;
export const SHELL_FACTOR = 11;

export type LabelSlot = {
  id: string;
  anchor: THREE.Vector3;
  /** Bề rộng px khi scale = 1 */
  width: number;
  distanceFactor: number;
};

/**
 * Bỏ nhãn nào đè lên một nhãn đã giữ, xét theo thứ tự ưu tiên của `slots`.
 *
 * Không sửa bằng cách bóp méo khoảng cách giữa các mốc: khoảng cách ở đây là
 * số đo thật, chỉ hướng mới là bịa ra cho dễ nhìn. Nhãn bị ẩn hiện lại khi
 * người xem phóng to — đúng hành vi người ta chờ đợi.
 */
export function useLabelDeclutter(slots: LabelSlot[], enabled: boolean): Set<string> {
  const { camera, size } = useThree();
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const lastKey = useRef("");

  useFrame(() => {
    if (!enabled) {
      if (lastKey.current !== "") {
        lastKey.current = "";
        setHidden(new Set());
      }
      return;
    }

    const kept: { x: number; y: number; hw: number; hh: number }[] = [];
    const next = new Set<string>();

    for (const slot of slots) {
      const ndc = slot.anchor.clone().project(camera);
      // z > 1 nghĩa là nằm sau camera; chiếu ra một điểm vô nghĩa
      if (ndc.z > 1) {
        next.add(slot.id);
        continue;
      }
      const x = (ndc.x * 0.5 + 0.5) * size.width;
      const y = (-ndc.y * 0.5 + 0.5) * size.height;
      const scale = htmlScale(camera, slot.anchor, slot.distanceFactor);
      const hw = (slot.width * scale + GAP_PX) / 2;
      const hh = (LABEL_PX_H * scale + GAP_PX) / 2;

      const clash = kept.some(
        (k) => Math.abs(k.x - x) < k.hw + hw && Math.abs(k.y - y) < k.hh + hh,
      );
      if (clash) next.add(slot.id);
      else kept.push({ x, y, hw, hh });
    }

    // Chỉ setState khi tập hợp thật sự đổi — setState mỗi khung hình sẽ khiến
    // React dựng lại cây này 60 lần một giây.
    const key = [...next].sort().join(",");
    if (key !== lastKey.current) {
      lastKey.current = key;
      setHidden(next);
    }
  });

  return hidden;
}

/**
 * Danh sách nhãn theo THỨ TỰ ƯU TIÊN — slot đứng trước thắng khi tranh chỗ.
 *
 * "Bạn đang ở đây" luôn thắng, sau đó tới mốc xa nhất: mốc xa nằm ở rìa và ít
 * tranh chỗ, giữ chúng thì phần trung tâm chỉ mất những nhãn mà zoom vào là
 * thấy lại.
 *
 * Vỏ tỉ lệ xếp sau toàn bộ mốc: vỏ mất nhãn thì vòng tròn vẫn còn đó để nhìn,
 * còn một mốc mất nhãn thì chỉ còn là một chấm sáng vô danh.
 */
export function useLabelSlots(
  locale: string,
  showScales: boolean,
): LabelSlot[] {
  return useMemo(() => {
    const slots: LabelSlot[] = [];
    const textWidth = (text: string) => text.length * CHAR_PX + PAD_PX;

    const landmarks = [...COSMIC_LANDMARKS].sort(
      (a, b) =>
        Number(b.tier === "home") - Number(a.tier === "home") ||
        b.distanceMly - a.distanceMly,
    );
    for (const landmark of landmarks) {
      const home = landmark.tier === "home";
      const [x, y, z] = landmarkPosition(landmark);
      const text = locale === "en" ? landmark.nameEn : landmark.name;
      slots.push({
        id: landmark.id,
        anchor: new THREE.Vector3(x, y + landmarkLabelY(home), z),
        // Mốc home có thêm ngôi sao ở đầu nhãn
        width: textWidth(text) + (home ? 14 : 0),
        distanceFactor: LANDMARK_FACTOR,
      });
    }

    // Vỏ tỉ lệ đang tắt thì không chiếm chỗ của ai cả.
    if (showScales) {
      const shells = UNIVERSE_SCALES.filter(
        (scale) => scale.radius !== null,
      ).sort((a, b) => (b.radius as number) - (a.radius as number));
      for (const scale of shells) {
        slots.push({
          id: `shell-${scale.id}`,
          anchor: new THREE.Vector3(...shellLabelPos(scale.radius as number)),
          width: textWidth(locale === "en" ? scale.nameEn : scale.name),
          distanceFactor: SHELL_FACTOR,
        });
      }
    }

    return slots;
  }, [locale, showScales]);
}
