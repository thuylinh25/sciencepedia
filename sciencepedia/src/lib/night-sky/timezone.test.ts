import { test } from "node:test";
import assert from "node:assert/strict";

import {
  dayWindowStartUtc,
  fromInputValueInTz,
  gmtOffsetLabel,
  isSameLocalDay,
  localDayTimeUtc,
  meteorShowerPeak,
  toInputValueInTz,
  utcToWallParts,
  wallTimeToUtc,
} from "./timezone";

/**
 * Giờ tường ↔ UTC: các ca chốt ở đây là ca mà Phase 1 đã sai (giờ nhập
 * hiểu theo máy người đọc thay vì nơi quan sát) và ca đổi giờ mùa — lệch
 * một giờ là cả bầu trời trên trang sai theo.
 */

test("19:00 giờ tường Hà Nội là 12:00Z", () => {
  const utc = wallTimeToUtc("Asia/Ho_Chi_Minh", {
    year: 2026,
    month: 10,
    day: 28,
    hour: 19,
    minute: 0,
  });
  assert.equal(utc.toISOString(), "2026-10-28T12:00:00.000Z");
});

test("đi vòng UTC → giờ tường → UTC không đổi thời điểm", () => {
  const instant = new Date("2026-03-29T01:30:00Z"); // ngày châu Âu đổi giờ
  for (const tz of ["Asia/Ho_Chi_Minh", "Europe/Paris", "America/New_York", "Australia/Sydney"]) {
    const wall = utcToWallParts(tz, instant);
    const back = wallTimeToUtc(tz, wall);
    assert.equal(back.getTime(), instant.getTime(), tz);
  }
});

test("New York: mùa hè lệch −4, mùa đông lệch −5", () => {
  const summer = wallTimeToUtc("America/New_York", {
    year: 2026, month: 7, day: 1, hour: 12, minute: 0,
  });
  const winter = wallTimeToUtc("America/New_York", {
    year: 2026, month: 1, day: 15, hour: 12, minute: 0,
  });
  assert.equal(summer.toISOString(), "2026-07-01T16:00:00.000Z");
  assert.equal(winter.toISOString(), "2026-01-15T17:00:00.000Z");
});

test("ô nhập datetime-local đọc và ghi theo giờ tường của nơi xem", () => {
  const instant = new Date("2026-10-28T12:00:00Z");
  assert.equal(toInputValueInTz("Asia/Tokyo", instant), "2026-10-28T21:00");
  assert.equal(
    fromInputValueInTz("Asia/Tokyo", "2026-10-28T21:00")?.getTime(),
    instant.getTime(),
  );
  assert.equal(fromInputValueInTz("Asia/Tokyo", "không-phải-giờ"), null);
});

test("nhãn GMT rút gọn đúng cho múi nguyên giờ và múi lẻ", () => {
  const instant = new Date("2026-10-28T12:00:00Z");
  assert.equal(gmtOffsetLabel("Asia/Ho_Chi_Minh", instant), "GMT+7");
  assert.equal(gmtOffsetLabel("Asia/Kathmandu", instant), "GMT+5:45");
});

test("ngày địa phương và mốc nửa đêm theo ngày của nơi xem", () => {
  const evening = new Date("2026-10-28T12:00:00Z"); // 19:00 cùng ngày ở Hà Nội
  assert.ok(isSameLocalDay("Asia/Ho_Chi_Minh", evening, new Date("2026-10-28T16:59:00Z")));
  assert.ok(!isSameLocalDay("Asia/Ho_Chi_Minh", evening, new Date("2026-10-28T17:00:00Z")));
  // "Nửa đêm nay" = 00:00 ở CUỐI ngày địa phương đang xem = 17:00Z.
  const midnight = localDayTimeUtc("Asia/Ho_Chi_Minh", evening, 1, 0, 0);
  assert.equal(midnight.toISOString(), "2026-10-28T17:00:00.000Z");
});

test("cửa sổ trượt thời gian neo vào trưa gần nhất không vượt quá giờ đang xem", () => {
  const tz = "Asia/Ho_Chi_Minh";
  // Buổi tối 19:00 28/10 (= 12:00Z): cửa sổ mở từ trưa cùng ngày = 05:00Z.
  assert.equal(
    dayWindowStartUtc(tz, new Date("2026-10-28T12:00:00Z")).toISOString(),
    "2026-10-28T05:00:00.000Z",
  );
  // Buổi sáng 09:40 29/10 (= 02:40Z): thuộc cửa sổ của ĐÊM trước — neo
  // vẫn là trưa 28/10. Đây là ca đã làm thanh trượt nhảy nhiều ngày khi
  // kéo qua nửa đêm (kiểm thử Phase 3, 2026-10-28).
  assert.equal(
    dayWindowStartUtc(tz, new Date("2026-10-29T02:40:00Z")).toISOString(),
    "2026-10-28T05:00:00.000Z",
  );
  // Đúng 00:00 29/10 (= 17:00Z 28/10): giữa cửa sổ, neo trưa 28/10.
  assert.equal(
    dayWindowStartUtc(tz, new Date("2026-10-28T17:00:00Z")).toISOString(),
    "2026-10-28T05:00:00.000Z",
  );
  // Đúng 12:00 29/10 (= 05:00Z): mốc này mở cửa sổ MỚI của ngày 29/10.
  assert.equal(
    dayWindowStartUtc(tz, new Date("2026-10-29T05:00:00Z")).toISOString(),
    "2026-10-29T05:00:00.000Z",
  );
  // Múi có DST: 10:00 EDT 28/10 (= 14:00Z) neo về trưa 27/10 EDT = 16:00Z.
  assert.equal(
    dayWindowStartUtc("America/New_York", new Date("2026-10-28T14:00:00Z")).toISOString(),
    "2026-10-27T16:00:00.000Z",
  );
});

test("chip Leonids: hiện trong cửa sổ 45 ngày trước cực đại, neo 19:00 giờ nơi xem", () => {
  const at = new Date("2026-10-28T12:00:00Z");
  const leonids = meteorShowerPeak("Asia/Ho_Chi_Minh", at, 11, 17, 19, 0);
  assert.equal(leonids.visible, true);
  assert.equal(leonids.instant.toISOString(), "2026-11-17T12:00:00.000Z");
  // Tháng 3 thì cả hai trận mưa sao băng đều ngoài cửa sổ.
  const march = new Date("2026-03-15T12:00:00Z");
  assert.equal(meteorShowerPeak("Asia/Ho_Chi_Minh", march, 11, 17, 19, 0).visible, false);
  assert.equal(meteorShowerPeak("Asia/Ho_Chi_Minh", march, 12, 13, 19, 0).visible, false);
});
