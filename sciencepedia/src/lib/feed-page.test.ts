import { test } from "node:test";
import assert from "node:assert/strict";
import { nextFeedOffset, parseFeedPage } from "./feed-page";

const page = (q: string) => parseFeedPage(new URLSearchParams(q));

test("không tham số: 20 bài đầu, như trước khi có phân trang", () => {
  assert.deepEqual(page(""), { limit: 20, offset: 0 });
});

test("limit kẹp trong 1..50", () => {
  assert.equal(page("limit=500").limit, 50);
  assert.equal(page("limit=-3").limit, 1);
  assert.equal(page("limit=7.9").limit, 7);
});

test("offset rác hoặc âm về 0", () => {
  assert.equal(page("offset=abc").offset, 0);
  assert.equal(page("offset=-10").offset, 0);
  assert.equal(page("offset=100").offset, 100);
});

test("trang đầy trỏ sang trang sau, trang thiếu là trang cuối", () => {
  assert.equal(nextFeedOffset({ limit: 50, offset: 0 }, 50), 50);
  assert.equal(nextFeedOffset({ limit: 50, offset: 50 }, 12), null);
});
