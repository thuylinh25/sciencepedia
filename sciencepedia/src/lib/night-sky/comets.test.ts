import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

import { asAstronomy } from "./astro";
import {
  HALLEY_APPARITIONS,
  cometHeliocentricEqj,
  halleyReport,
} from "./comets";

/**
 * Kiểm thử lớp sao chổi bằng engine vendor thật (như astro.test.ts) và
 * bằng các dấu mốc ĐÃ GHI TRONG LỊCH SỬ quan trắc của Halley — cận nhật
 * 9/2/1986 và lần tiến gần Trái Đất nhất 0,42 AU ngày 11/4/1986. Nếu
 * phần tử quỹ đạo hay phép lan truyền Kepler lệch, các mốc này rơi khỏi
 * khoảng ngay.
 */
const require = createRequire(import.meta.url);
const engine = asAstronomy(
  require("../../../public/night-sky/astronomy.browser.js") as unknown,
);

const HA_NOI = { lat: 21.0285, lon: 105.8542 };

test("tại mốc cận nhật, khoảng cách tới Mặt Trời bằng q của quỹ đạo", () => {
  const el = HALLEY_APPARITIONS[0].elements;
  const helio = cometHeliocentricEqj(el, new Date(el.tpMs));
  assert.ok(Math.abs(helio.rAu - el.qAu) < 0.005, `r=${helio.rAu}`);
});

test("tiến gần Trái Đất nhất 11/4/1986 ở ~0,42 AU (mốc lịch sử)", () => {
  const report = halleyReport(
    engine,
    HA_NOI.lat,
    HA_NOI.lon,
    new Date("1986-04-11T00:00:00Z"),
  );
  assert.ok(report, "phải có báo cáo trong cửa sổ 1986");
  assert.ok(
    report.deltaAu > 0.4 && report.deltaAu < 0.45,
    `delta=${report.deltaAu}`,
  );
});

test("rạng sáng 19/3/1986 ở Hà Nội: sao chổi cao ~27°, sáng ~cấp 5", () => {
  // 05:00 giờ Hà Nội = 22:00 UTC hôm trước.
  const report = halleyReport(
    engine,
    HA_NOI.lat,
    HA_NOI.lon,
    new Date("1986-03-18T22:00:00Z"),
  );
  assert.ok(report);
  assert.equal(report.apparitionId, "1986");
  assert.equal(report.forecast, false);
  assert.ok(
    report.altitudeDeg > 24 && report.altitudeDeg < 29,
    `alt=${report.altitudeDeg}`,
  );
  assert.ok(
    report.azimuthDeg > 128 && report.azimuthDeg < 140,
    `az=${report.azimuthDeg}`,
  );
  assert.ok(
    report.magnitudeEst > 4.5 && report.magnitudeEst < 5.5,
    `mag=${report.magnitudeEst}`,
  );
});

test("đêm cận nhật 9/2/1986: sao chổi ở sâu dưới chân trời Hà Nội", () => {
  // Đây là lý do khoảnh khắc Halley 1986 KHÔNG còn đặt ở đêm cận nhật:
  // lúc 21:00 sao chổi ở khoảng −49°, sát Mặt Trời 8°.
  const report = halleyReport(
    engine,
    HA_NOI.lat,
    HA_NOI.lon,
    new Date("1986-02-09T14:00:00Z"),
  );
  assert.ok(report);
  assert.ok(report.altitudeDeg < -40, `alt=${report.altitudeDeg}`);
});

test("ngoài cửa sổ hai lần ghé thì không có báo cáo (năm 2026)", () => {
  assert.equal(
    halleyReport(engine, HA_NOI.lat, HA_NOI.lon, new Date("2026-10-29T00:00:00Z")),
    null,
  );
});

test("rạng sáng 16/7/2061: dự báo cao ~22°, sáng ~cấp 3", () => {
  // 04:00 giờ Hà Nội = 21:00 UTC hôm trước.
  const report = halleyReport(
    engine,
    HA_NOI.lat,
    HA_NOI.lon,
    new Date("2061-07-15T21:00:00Z"),
  );
  assert.ok(report);
  assert.equal(report.apparitionId, "2061");
  assert.equal(report.forecast, true);
  assert.ok(
    report.altitudeDeg > 19 && report.altitudeDeg < 25,
    `alt=${report.altitudeDeg}`,
  );
  assert.ok(
    report.magnitudeEst > 2.6 && report.magnitudeEst < 3.8,
    `mag=${report.magnitudeEst}`,
  );
});
