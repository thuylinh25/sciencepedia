import { test } from "node:test";
import assert from "node:assert/strict";

import { SKY_MOMENTS } from "./moments";
import { findSkyLocation } from "./locations";
import { utcToWallParts } from "./timezone";

/**
 * Kiểm thử dữ liệu "Máy thời gian": mỗi khoảnh khắc phải neo được vào một
 * nơi danh mục thật, múi giờ phải là IANA hợp lệ, và thời điểm đọc theo
 * giờ tường tại nơi đó phải đúng ngày/giờ mà lời kể hứa — lệch một múi là
 * cả câu chuyện lịch sử lệch theo.
 */

test("mọi khoảnh khắc neo vào nơi danh mục có thật và múi giờ IANA hợp lệ", () => {
  assert.ok(SKY_MOMENTS.length >= 5);
  for (const moment of SKY_MOMENTS) {
    const location = findSkyLocation(moment.locationId);
    assert.ok(location, `${moment.id}: thiếu nơi ${moment.locationId}`);
    assert.ok(
      moment.instant instanceof Date && !Number.isNaN(moment.instant.getTime()),
      `${moment.id}: thời điểm không hợp lệ`,
    );
    // Intl ném RangeError nếu múi giờ không phải IANA hợp lệ.
    assert.doesNotThrow(
      () => new Intl.DateTimeFormat("en-US", { timeZone: location.tz }),
      `${moment.id}: múi giờ ${location.tz}`,
    );
    assert.ok(moment.labelVi.length > 0 && moment.labelEn.length > 0);
    assert.ok(moment.blurbVi.length > 0 && moment.blurbEn.length > 0);
  }
});

test("Apollo 11: 20:17 UTC ngày 20/7/1969, đọc từ Houston là 15:17", () => {
  const apollo = SKY_MOMENTS.find((moment) => moment.id === "apollo-11");
  assert.ok(apollo);
  assert.equal(apollo.instant.toISOString(), "1969-07-20T20:17:00.000Z");
  const wall = utcToWallParts("America/Chicago", apollo.instant);
  assert.deepEqual(
    [wall.year, wall.month, wall.day, wall.hour, wall.minute],
    [1969, 7, 20, 15, 17],
  );
});

test("Nhật thực 1995: đọc từ múi giờ Việt Nam là 09:30 ngày 24/10/1995", () => {
  const eclipse = SKY_MOMENTS.find(
    (moment) => moment.id === "eclipse-vietnam-1995",
  );
  assert.ok(eclipse);
  const wall = utcToWallParts("Asia/Ho_Chi_Minh", eclipse.instant);
  assert.deepEqual(
    [wall.year, wall.month, wall.day, wall.hour, wall.minute],
    [1995, 10, 24, 9, 30],
  );
});

test("Các khoảnh khắc còn lại giữ đúng ngày/giờ tường đã hứa", () => {
  const expected: Record<string, [number, number, number, number, number]> = {
    "halley-1986": [1986, 3, 19, 5, 0],
    "halley-2061": [2061, 7, 16, 4, 0],
    "independence-1945": [1945, 9, 2, 19, 0],
  };
  for (const [id, parts] of Object.entries(expected)) {
    const moment = SKY_MOMENTS.find((item) => item.id === id);
    assert.ok(moment, id);
    const wall = utcToWallParts("Asia/Ho_Chi_Minh", moment.instant);
    assert.deepEqual(
      [wall.year, wall.month, wall.day, wall.hour, wall.minute],
      parts,
      id,
    );
  }
});
