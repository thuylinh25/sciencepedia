import { test } from "node:test";
import assert from "node:assert/strict";
import { viName, viNameStatus } from "./names-vi";
import { SUPPLEMENTS } from "./supplements";
import REVIEWED from "./names-vi.reviewed.json";

test("mảnh Z-Anatomy: trái/phải đứng cuối cả tên, ngoặc số dây sọ sau cùng", () => {
  assert.equal(viName("ZA-nerve-to-mylohyoid-muscle", "Left nerve to mylohyoid muscle"), "thần kinh cơ hàm móng trái");
  assert.equal(
    viName("ZA-anterior-division-of-inferior-trunk-of-brachial-plexus", "Right anterior division of inferior trunk of brachial plexus"),
    "ngành trước thân dưới đám rối cánh tay phải",
  );
  assert.equal(viName("ZA-facial-nerve-vii", "Left facial nerve (VII)"), "thần kinh mặt trái (VII)");
});

test("tên BodyParts3D giữ trái/phải sau cụm nó bổ nghĩa", () => {
  assert.equal(viName("FMA23119", "Right lobe of thymus"), "thùy phải tuyến ức");
});

test("tên cấu trúc chính đã duyệt thắng bản ghép và không mang nhãn", () => {
  // Bản ghép ra "đĩa gian đốt sống đốt sống ngực 8" — lặp chữ, không nói đĩa nằm ở đâu.
  assert.equal(viName("FMA13505", "Intervertebral disk of eighth thoracic vertebra"), "đĩa gian đốt sống ngực 8–9");
  assert.equal(viNameStatus("FMA13505", "Intervertebral disk of eighth thoracic vertebra"), "reviewed");
  // science-editor để lại (nhãn FMA mơ hồ) → vẫn là bản ghép chưa duyệt.
  assert.equal(viNameStatus("FMA19728", "superficial perineal muscle"), "machine-translated");
});

test("số thứ tự viết bằng chữ số: <cụm danh từ> <số> <bên>", () => {
  // Một cách cho cả mô hình (139 tên dùng chữ số khi chốt): "xương sườn 7 phải", "cơ giun bàn chân 1 phải".
  const words = Object.entries(REVIEWED.names).filter(([, vi]) => /(^|\s)thứ (nhất|hai|ba|tư|năm|sáu|bảy|tám|chín|mười)(\s|$)/.test(vi));
  assert.deepEqual(words, []);
  assert.equal(viName("FMA37717", "First lumbrical of right foot"), "cơ giun bàn chân 1 phải");
});

test("mọi mảnh Z-Anatomy đều có tên tiếng Việt", () => {
  const missing = SUPPLEMENTS.flatMap((s) => s.parts).filter((p) => !viName(p.conceptId, p.name));
  assert.deepEqual(missing.map((p) => p.name), []);
});
