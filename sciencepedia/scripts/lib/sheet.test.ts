import assert from "node:assert/strict";
import { test } from "node:test";

import { extractD, tagBalance, tagDrift } from "./sheet";

const SHEET = [
  "# Thẩm định — X",
  "",
  "## D. Đoạn thay thế",
  "",
  "### D0 — thay `title`, `summary`",
  "",
  "```markdown",
  "Tiêu đề mới",
  "```",
  "",
  "```markdown",
  "Tóm tắt mới",
  "```",
  "",
  "### D1 — thay toàn mục \"## Cũ\"",
  "",
  "```markdown",
  "## Mục mới",
  "",
  "Đoạn có khối ```` ```text ```` nằm giữa dòng.",
  "",
  "## Mục thứ hai trong cùng khối",
  "```",
  "",
  "### D2 — thêm mục mới",
  "",
  "```markdown",
  "## Cuối",
  "```",
  "",
  "## E. Việc chưa làm",
  "",
  "```markdown",
  "không thuộc mục D",
  "```",
].join("\r\n");

test("extractD lấy đủ khối, không cắt ở dòng ## nằm trong fence", () => {
  const d = extractD(SHEET);
  assert.deepEqual(Object.keys(d), ["D0_0", "D0_1", "D1", "D2"]);
  assert.equal(d.D0_0, "Tiêu đề mới");
  assert.equal(d.D0_1, "Tóm tắt mới");
  assert.equal(d.D1, "## Mục mới\n\nĐoạn có khối ```` ```text ```` nằm giữa dòng.\n\n## Mục thứ hai trong cùng khối");
  assert.equal(d.D2, "## Cuối");
});

test("extractD báo lỗi khi fence không đóng", () => {
  assert.throws(() => extractD("### D1 — x\n```markdown\n## mở mà không đóng"), /chưa đóng/);
});

test("tagBalance bỏ thẻ rỗng, thẻ tự đóng và dấu < trong văn", () => {
  const b = tagBalance('<div style="a"><br><img src="x"/><span>x < 5</span></div><div>');
  assert.equal(b.get("div"), 1);
  assert.equal(b.get("span"), 0);
  assert.equal(b.has("br"), false);
  assert.equal(b.has("img"), false);
});

test("tagDrift bắt </div> thừa sau khi thay khối lồng nhau", () => {
  const before = "<div>\n  <div>a</div>\n</div>\n\n## Mục";
  const cutAtInner = before.replace("<div>\n  <div>a</div>", "<div>\n  <div>b</div>\n</div>");
  assert.deepEqual(tagDrift(before, cutAtInner), ["<div> 0 → -1"]);
  const whole = before.replace("<div>\n  <div>a</div>\n</div>", "<div>\n  <div>b</div>\n</div>");
  assert.deepEqual(tagDrift(before, whole), []);
});

test("tagDrift không chặn bài đã lệch sẵn khi chỗ sửa không đụng thẻ", () => {
  assert.deepEqual(tagDrift("<div>cũ", "<div>mới"), []);
});
