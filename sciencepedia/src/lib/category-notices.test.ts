import { test } from "node:test";
import assert from "node:assert/strict";
import { categoryNotice } from "./category-notices";

test("ba nhóm truyền thống đã xóa (2026-10-28) không còn khung riêng — kế thừa khung Sức khoẻ", () => {
  for (const slug of ["tac-dong-cot-song", "bam-huyet", "y-hoc-co-truyen"]) {
    assert.equal(categoryNotice(slug, "suc-khoe"), "health");
  }
});

test("nhóm con mới dưới Sức khoẻ tự có khung y tế mà không sửa code", () => {
  assert.equal(categoryNotice("so-cuu", "suc-khoe"), "health");
  assert.equal(categoryNotice("suc-khoe", null), "health");
});

test("lĩnh vực khác không có khung", () => {
  assert.equal(categoryNotice("vat-ly", null), null);
  assert.equal(categoryNotice("co-hoc", "vat-ly"), null);
});
