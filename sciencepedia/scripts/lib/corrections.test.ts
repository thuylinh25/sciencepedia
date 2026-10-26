import assert from "node:assert/strict";
import { test } from "node:test";

import { applyFix } from "./corrections";

const fill = { field: "contentEn", fill: "## Intro\n\nText.", why: "bản EN" } as const;

test("fill điền trường trống", () => {
  assert.equal(applyFix("", fill, "t"), "## Intro\n\nText.");
});

test("fill chạy lại ra 0 fix", () => {
  assert.equal(applyFix("## Intro\n\nText.\n", fill, "t"), null);
});

test("fill không đè trường đã có chữ khác", () => {
  assert.throws(() => applyFix("Old text", fill, "t"), /không đè/);
});
