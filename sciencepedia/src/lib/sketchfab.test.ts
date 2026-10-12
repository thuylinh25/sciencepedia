import { test } from "node:test";
import assert from "node:assert/strict";

import { parseSketchfabId } from "./sketchfab";

const ID = "ee42d146c1e94f3b8804a1230c4dfe10";

test("link trang model: id ở cuối tên", () => {
  assert.equal(parseSketchfabId(`https://sketchfab.com/3d-models/light-cone-space-time-model-${ID}`), ID);
  assert.equal(parseSketchfabId(`sketchfab.com/3d-models/light-cone-space-time-model-${ID}?utm_source=x#top`), ID);
});

test("link nhúng và id trần", () => {
  assert.equal(parseSketchfabId(`https://sketchfab.com/models/${ID}/embed?autostart=1`), ID);
  assert.equal(parseSketchfabId(`  ${ID.toUpperCase()} `), ID);
});

test("nguyên đoạn iframe của nút Embed", () => {
  const code = `<div class="sketchfab-embed-wrapper"> <iframe title="Light Cone" frameborder="0" allowfullscreen src="https://sketchfab.com/models/${ID}/embed"> </iframe> <p><a href="https://sketchfab.com/3d-models/light-cone-${ID}?utm_medium=embed">Light Cone</a></p></div>`;
  assert.equal(parseSketchfabId(code), ID);
});

test("không nhận: trống, link rút gọn, host khác, id sai độ dài", () => {
  assert.equal(parseSketchfabId(""), null);
  assert.equal(parseSketchfabId(undefined), null);
  assert.equal(parseSketchfabId("https://skfb.ly/oABCd"), null);
  assert.equal(parseSketchfabId(`https://example.com/3d-models/x-${ID}`), null);
  assert.equal(parseSketchfabId(`https://sketchfab.com/3d-models/x-${ID}ff`), null);
  assert.equal(parseSketchfabId(ID.slice(1)), null);
});
