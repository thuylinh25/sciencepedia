import { test } from "node:test";
import assert from "node:assert/strict";
import GROUPS from "./group-descriptions.generated.json";
import { groupDescription } from "./group-descriptions";
import { viewById, viewKind, viewParts } from "./views";

const MAP = GROUPS as Record<string, { text: string; title: string; url: string }>;

test("mảnh trong nhóm có mô tả mượn mô tả của đúng nhóm đó", () => {
  const part = viewParts("coronary-arteries")!.focus[0];
  const g = groupDescription([part]);
  assert.equal(g?.viewId, "coronary-arteries");
  assert.equal(g?.name.vi, viewById("coronary-arteries")!.name.vi);
  assert.match(g!.url, /^https:\/\/(vi|en)\.wikipedia\.org\//);
});

test("mọi mục mô tả nhóm trỏ tới góc nhìn cấu trúc có thật, có câu và nguồn", () => {
  for (const [id, d] of Object.entries(MAP)) {
    const v = viewById(id);
    assert.ok(v && viewKind(v) === "structure", `${id} không phải góc nhìn cấu trúc`);
    assert.ok(d.text.trim().length > 0 && d.title && d.url, `${id} thiếu câu hoặc nguồn`);
  }
});

test("nhóm science-editor bỏ không có mô tả — thà trống còn hơn tả sai nhóm", () => {
  // Bài chỉ nói về đại não, sai cho các động mạch tiểu não trong nhóm.
  assert.equal(MAP["cerebral-arteries"], undefined);
  assert.equal(groupDescription([viewParts("cerebral-arteries")!.focus[0]]), null);
});
