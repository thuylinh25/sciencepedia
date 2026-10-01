import { test } from "node:test";
import assert from "node:assert/strict";
import { viName } from "./names-vi";
import { SUPPLEMENTS } from "./supplements";

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

test("mọi mảnh Z-Anatomy đều có tên tiếng Việt", () => {
  const missing = SUPPLEMENTS.flatMap((s) => s.parts).filter((p) => !viName(p.conceptId, p.name));
  assert.deepEqual(missing.map((p) => p.name), []);
});
