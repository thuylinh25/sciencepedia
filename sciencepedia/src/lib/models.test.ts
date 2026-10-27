import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EXPLORE_TOOLS,
  MODEL_STEPS,
  TOOL_VIEW_IDS,
  isToolViewId,
  toolImage,
} from "./models";

test("mọi trang công cụ có ảnh chia sẻ thật, không rơi về ảnh OG chữ", () => {
  for (const { href } of [...MODEL_STEPS, ...EXPLORE_TOOLS]) {
    assert.match(toolImage(href) ?? "", /^https:\/\/.+\.(jpe?g|png|webp)$/, href);
  }
});

test("đường dẫn không phải công cụ thì không có ảnh riêng", () => {
  assert.equal(toolImage("/articles"), undefined);
});

test("danh sách đếm lượt xem phủ đúng mọi mô hình và công cụ, không trùng", () => {
  const registryIds = [...MODEL_STEPS, ...EXPLORE_TOOLS].map((t) => t.id);
  assert.deepEqual([...TOOL_VIEW_IDS], registryIds);
  assert.equal(new Set(TOOL_VIEW_IDS).size, TOOL_VIEW_IDS.length);
  for (const id of registryIds) assert.equal(isToolViewId(id), true);
});

test("id lạ không được đếm lượt xem", () => {
  assert.equal(isToolViewId("khong-co-cong-cu-nay"), false);
  assert.equal(isToolViewId(""), false);
});
