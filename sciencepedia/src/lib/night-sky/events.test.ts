import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

import { asAstronomy } from "./astro";
import { upcomingSkyEvents } from "./events";
import { utcToWallParts } from "./timezone";

/** Cùng kỷ luật với astro.test.ts: chạy bằng engine vendor thật, khẳng
 *  định bằng khoảng/bất biến và các mốc đã biết độc lập (trăng tròn
 *  24/11/2026 cũng là ngày siêu trăng trên lịch fanpage). */
const require = createRequire(import.meta.url);
const engine = asAstronomy(
  require("../../../public/night-sky/astronomy.browser.js") as unknown,
);

const TZ = "Asia/Ho_Chi_Minh";
const NOW = new Date("2026-10-29T00:00:00Z");

test("danh sách sự kiện: đã sắp xếp, đều ở phía trước, đủ 6 mục", () => {
  const events = upcomingSkyEvents(engine, TZ, NOW);
  assert.equal(events.length, 6);
  for (let i = 1; i < events.length; i += 1) {
    assert.ok(events[i].instant.getTime() >= events[i - 1].instant.getTime());
  }
  for (const event of events) {
    assert.ok(event.instant.getTime() > NOW.getTime() - 12 * 3_600_000);
  }
});

test("sự kiện đầu tiên từ 29/10/2026 là trăng mới 9/11", () => {
  const events = upcomingSkyEvents(engine, TZ, NOW);
  assert.equal(events[0].kind, "new-moon");
  const wall = utcToWallParts(TZ, events[0].instant);
  assert.equal(wall.year, 2026);
  assert.equal(wall.month, 11);
  assert.ok(wall.day >= 8 && wall.day <= 10);
});

test("có Leonids 17/11 và trăng tròn 24/11 được nhận diện siêu trăng", () => {
  const events = upcomingSkyEvents(engine, TZ, NOW, 8);
  const leonids = events.find((event) => event.id.startsWith("meteor-leonids"));
  assert.ok(leonids);
  const leoWall = utcToWallParts(TZ, leonids.instant);
  assert.equal(leoWall.month, 11);
  assert.equal(leoWall.day, 17);

  const full = events.find((event) => event.id === "full-moon-2026-11-24");
  assert.ok(full);
  assert.equal(full.nameVi, "Siêu trăng");
  assert.match(full.noteVi, /km/);
});

test("có Geminids 13/12 và đông chí quanh 21/12", () => {
  const events = upcomingSkyEvents(engine, TZ, NOW, 8);
  const geminids = events.find((event) => event.id.startsWith("meteor-geminids"));
  assert.ok(geminids);
  const gemWall = utcToWallParts(TZ, geminids.instant);
  assert.equal(gemWall.month, 12);
  assert.equal(gemWall.day, 13);

  const solstice = events.find((event) => event.id.startsWith("season-dec_solstice"));
  assert.ok(solstice);
  const solWall = utcToWallParts(TZ, solstice.instant);
  assert.equal(solWall.month, 12);
  assert.ok(solWall.day >= 20 && solWall.day <= 22);
});
