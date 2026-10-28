import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

import {
  asAstronomy,
  compassFor,
  equatorialAltAz,
  moonPhaseName,
  skyReport,
} from "./astro";

/**
 * Kiểm thử lớp thiên văn bằng CHÍNH tệp engine vendor mà trình duyệt sẽ
 * nạp — không mock: mock sẽ xanh cả khi ta gọi sai chữ ký thư viện, đúng
 * thứ lỗi mà lớp bọc này tồn tại để chặn. Mọi khẳng định đều là khoảng /
 * bất biến (không chốt phút chính xác): số thiên văn đúng vẫn phải nằm
 * trong khoảng, còn số bịa hay lệch múi giờ sẽ rơi ra ngoài.
 */
const require = createRequire(import.meta.url);
const engine = asAstronomy(
  require("../../../public/night-sky/astronomy.browser.js") as unknown,
);

const HA_NOI = { lat: 21.0285, lon: 105.8542 };
/** 19:00 giờ Hà Nội ngày 28/10/2026 — sau hoàng hôn, trăng gần tròn. */
const EVENING = new Date("2026-10-28T12:00:00Z");

test("buổi tối ở Hà Nội: Mặt Trời đã lặn sâu, trạng thái là đêm", () => {
  const report = skyReport(engine, HA_NOI.lat, HA_NOI.lon, EVENING);
  assert.ok(report.sun.altitudeDeg < -5, `alt=${report.sun.altitudeDeg}`);
  assert.equal(report.sun.state, "night");
  // Đã tối hẳn (dưới −18°) thì không còn "giờ tối hẳn" sắp tới nữa.
  assert.equal(report.sun.darkTime, null);
  assert.ok(report.sun.sunrise instanceof Date);
  assert.ok(report.sun.sunset instanceof Date);
});

test("Mặt Trăng gần tròn vào cuối tháng 10/2026", () => {
  const report = skyReport(engine, HA_NOI.lat, HA_NOI.lon, EVENING);
  assert.ok(
    report.moon.illumFraction >= 0.75 && report.moon.illumFraction <= 0.99,
    `illum=${report.moon.illumFraction}`,
  );
  assert.ok(report.moon.phaseAngleDeg >= 0 && report.moon.phaseAngleDeg < 360);
  assert.ok(report.moon.nextFullMoon instanceof Date);
  assert.ok(report.moon.nextNewMoon instanceof Date);
  assert.ok(report.moon.nextFullMoon > EVENING);
  assert.ok(report.moon.nextNewMoon > EVENING);
});

test("bảy hành tinh: độ cao/phương vị trong miền hợp lệ, giờ mọc lặn có kiểu đúng", () => {
  const report = skyReport(engine, HA_NOI.lat, HA_NOI.lon, EVENING);
  assert.equal(report.planets.length, 7);
  for (const planet of report.planets) {
    assert.ok(
      planet.altitudeDeg >= -90 && planet.altitudeDeg <= 90,
      `${planet.body} alt=${planet.altitudeDeg}`,
    );
    assert.ok(
      planet.azimuthDeg >= 0 && planet.azimuthDeg < 360,
      `${planet.body} az=${planet.azimuthDeg}`,
    );
    assert.ok(planet.rise === null || planet.rise instanceof Date, planet.body);
    assert.ok(planet.set === null || planet.set instanceof Date, planet.body);
    assert.ok(planet.compassVi.length > 0 && planet.compassEn.length > 0);
  }
});

test("la bàn tám hướng neo đúng bốn hướng chính", () => {
  assert.equal(compassFor(0).vi, "Bắc");
  assert.equal(compassFor(90).vi, "Đông");
  assert.equal(compassFor(180).en, "South");
  assert.equal(compassFor(270).vi, "Tây");
  assert.equal(compassFor(359).vi, "Bắc");
  assert.equal(compassFor(-45).en, "Northwest");
});

test("tám khoảng pha trăng neo đúng bốn mốc chính", () => {
  assert.equal(moonPhaseName(0).vi, "Trăng non");
  assert.equal(moonPhaseName(90).en, "First Quarter");
  assert.equal(moonPhaseName(180).vi, "Trăng tròn");
  assert.equal(moonPhaseName(270).en, "Last Quarter");
});

test("sao Bắc Cực nhìn từ Hà Nội cao xấp xỉ vĩ độ của người quan sát", () => {
  // Polaris ở gần thiên cực bắc: độ cao biểu kiến ≈ vĩ độ (21°) ± vài độ —
  // bất biến hình học, sai hệ toạ độ hay sai đơn vị RA là rơi ra ngoài ngay.
  const polaris = equatorialAltAz(engine, 2.5303, 89.2641, HA_NOI.lat, HA_NOI.lon, EVENING);
  assert.ok(
    polaris.altitudeDeg > 15 && polaris.altitudeDeg < 27,
    `alt=${polaris.altitudeDeg}`,
  );
});
