import { test } from "node:test";
import assert from "node:assert/strict";
import { categoryNotice } from "./category-notices";

test("nhóm phương pháp truyền thống mang khung riêng, không kế thừa khung Sức khoẻ", () => {
  for (const slug of ["tac-dong-cot-song", "bam-huyet", "y-hoc-co-truyen"]) {
    assert.equal(categoryNotice(slug, "suc-khoe"), "traditional");
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
