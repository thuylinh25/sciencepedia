import { test } from "node:test";
import assert from "node:assert/strict";
import { EXPLORE_TOOLS, MODEL_STEPS, toolImage } from "./models";

test("mọi trang công cụ có ảnh chia sẻ thật, không rơi về ảnh OG chữ", () => {
  for (const { href } of [...MODEL_STEPS, ...EXPLORE_TOOLS]) {
    assert.match(toolImage(href) ?? "", /^https:\/\/.+\.(jpe?g|png|webp)$/, href);
  }
});

test("đường dẫn không phải công cụ thì không có ảnh riêng", () => {
  assert.equal(toolImage("/articles"), undefined);
});
