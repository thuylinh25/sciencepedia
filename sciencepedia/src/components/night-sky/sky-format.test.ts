import { test } from "node:test";
import assert from "node:assert/strict";

import { fmtDecDm, fmtRaHm, placeCursorBox } from "./sky-format";

/**
 * Ô đọc toạ độ tại con trỏ in RA/Dec tới phút — sai một phút là người
 * đọc trỏ nhầm sao. Các ca chốt ở đây là ca làm tròn dồn qua mốc
 * (giờ, độ, vòng 24h) và ca dấu của xích vĩ quanh 0°, là hai chỗ một
 * hàm tách phần nguyên/phần lẻ ngây thơ sẽ sai.
 */

test("fmtRaHm: giờ + phút theo kiểu ô toạ độ", () => {
  assert.equal(fmtRaHm(0), "0h 00m");
  assert.equal(fmtRaHm(266.25), "17h 45m"); // tâm Ngân Hà, ca mẫu của ô toạ độ
  assert.equal(fmtRaHm(262.5), "17h 30m");
  assert.equal(fmtRaHm(16), "1h 04m"); // phút < 10 vẫn đệm 0
});

test("fmtRaHm: làm tròn dồn qua mốc giờ và vòng 24h", () => {
  assert.equal(fmtRaHm(359.999), "0h 00m"); // 1440 phút → vòng về 0h
  assert.equal(fmtRaHm(360), "0h 00m");
  assert.equal(fmtRaHm(-15), "23h 00m"); // đầu vào âm vẫn chuẩn hoá về [0, 360)
});

test("fmtDecDm: độ + phút cung có dấu", () => {
  assert.equal(fmtDecDm(-29), "−29° 00′"); // ca mẫu của ô toạ độ
  assert.equal(fmtDecDm(41.2693), "+41° 16′"); // M31
  assert.equal(fmtDecDm(-5.3911), "−5° 23′");
  assert.equal(fmtDecDm(-0.5), "−0° 30′"); // độ 0 vẫn giữ dấu trừ
  assert.equal(fmtDecDm(0), "+0° 00′");
});

test("fmtDecDm: làm tròn dồn qua mốc độ, không in −0°", () => {
  assert.equal(fmtDecDm(29.9999), "+30° 00′");
  assert.equal(fmtDecDm(-0.004), "+0° 00′"); // tròn về 0 phút thì mất dấu trừ
  assert.equal(fmtDecDm(89.9999), "+90° 00′");
});

test("placeCursorBox: ô lệch phải/xuống theo con trỏ ở giữa khung", () => {
  const frame = { width: 1000, height: 600 };
  const box = { width: 300, height: 32 };
  assert.deepEqual(placeCursorBox({ x: 500, y: 300 }, box, frame), {
    left: 516,
    top: 318,
  });
});

test("placeCursorBox: chạm mép phải/dưới thì lật sang phía đối diện", () => {
  const frame = { width: 1000, height: 600 };
  const box = { width: 300, height: 32 };
  // Sát mép phải: 990 + 16 + 300 vượt khung → ô sang trái con trỏ.
  assert.deepEqual(placeCursorBox({ x: 990, y: 300 }, box, frame), {
    left: 674,
    top: 318,
  });
  // Sát mép dưới: 590 + 18 + 32 vượt khung → ô lên trên con trỏ.
  assert.deepEqual(placeCursorBox({ x: 500, y: 590 }, box, frame), {
    left: 516,
    top: 540,
  });
  // Góc dưới-phải: lật cả hai chiều.
  assert.deepEqual(placeCursorBox({ x: 990, y: 590 }, box, frame), {
    left: 674,
    top: 540,
  });
});

test("placeCursorBox: khung nhỏ hơn ô thì kẹp về lề, không toạ độ âm", () => {
  const placed = placeCursorBox(
    { x: 100, y: 50 },
    { width: 300, height: 32 },
    { width: 200, height: 100 },
  );
  assert.equal(placed.left, 4);
  assert.ok(placed.top >= 4);
});
