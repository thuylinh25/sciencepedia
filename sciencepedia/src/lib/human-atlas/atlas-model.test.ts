import assert from "node:assert/strict";
import { test } from "node:test";

import { SYSTEM_IDS } from "./anatomy";
import { anatomicalSystem, viewStructures } from "./atlas-model";
import { SYSTEM_VIEWS, hasCard, viewById, viewKind, viewParts, viewStatus } from "./views";

// Chạy: npx tsx --test src/lib/human-atlas/atlas-model.test.ts

test("hệ hô hấp: một tổng quan + góc nhìn giải phẫu, không thẻ cấu trúc", () => {
  const system = anatomicalSystem("respiratory");
  assert.ok(system);
  assert.equal(system.overview?.def.id, "respiratory-overview");
  assert.ok(system.views.length >= 10, `chỉ ${system.views.length} góc nhìn`);
  assert.ok(system.views.every((v) => viewKind(v.def) === "group"));
  for (const id of ["respiratory-lung-position", "respiratory-pulmonary-circulation", "respiratory-laryngeal-muscles"]) {
    assert.ok(system.views.some((v) => v.def.id === id && v.usable), id);
  }
});

test("góc nhìn thiếu dữ liệu (missing) là unavailable — không lên lưới", () => {
  const def = { ...viewById("respiratory-lungs")!, id: "x-missing", missing: { vi: "thiếu", en: "missing" } };
  assert.equal(viewStatus(def), "unavailable");
  const system = anatomicalSystem("respiratory")!;
  assert.ok(system.views.every((v) => v.usable && v.status !== "unavailable"));
});

test("dựng một phần thì là partial, có thẻ và nói rõ phần thiếu", () => {
  const views = anatomicalSystem("respiratory")!.views;
  const expect = {
    "respiratory-nose": "khoang mũi",
    "respiratory-expiration-muscles": "cơ thẳng bụng",
    "respiratory-innervation": "thần kinh hoành",
  };
  for (const [id, gap] of Object.entries(expect)) {
    const v = views.find((x) => x.def.id === id);
    assert.equal(v?.status, "partial", id);
    assert.ok(v?.def.partial?.vi.includes(gap), id);
  }
});

test("mọi góc nhìn theo hệ có đánh giá chất lượng nội bộ", () => {
  for (const v of SYSTEM_VIEWS.filter((x) => x.systemId === "respiratory" && viewKind(x) === "group" && !x.missing)) {
    assert.ok(v.quality, v.id);
  }
});

test("phổi mờ làm bối cảnh cho cây phế quản, khí quản, cơ hít vào", () => {
  const lungs = new Set(viewParts("respiratory-lungs")!.focus);
  for (const id of ["respiratory-bronchial-tree", "respiratory-trachea-bronchi", "respiratory-inspiration-muscles"]) {
    const context = new Set(viewParts(id)!.context ?? []);
    assert.ok([...lungs].every((p) => context.has(p)), id);
  }
});

test("mọi hệ đều có mô hình với một tổng quan dùng được", () => {
  // Bề mặt cơ thể: không có góc nhìn (chủ sản phẩm bỏ, 2026-10-15) — da vẫn là lớp ngoài của mô hình.
  for (const id of SYSTEM_IDS.filter((x) => x !== "integumentary")) {
    const system = anatomicalSystem(id);
    assert.ok(system, id);
    assert.ok(system.overview?.usable, `${id}: không có tổng quan dùng được`);
  }
});

test("cấu trúc của mỗi góc nhìn theo hệ phủ đủ tập nổi bật, không chồng nhau", () => {
  const views = SYSTEM_VIEWS.filter((v) => viewKind(v) !== "structure" && !v.missing);
  for (const view of views) {
    const list = viewStructures(view.id);
    assert.ok(list.length > 0, `${view.id}: không có cấu trúc`);
    const all = list.flatMap((s) => s.parts);
    assert.equal(new Set(all).size, all.length, `${view.id}: cấu trúc chồng mảnh`);
    assert.deepEqual([...all].sort(), [...viewParts(view.id)!.focus].sort(), view.id);
    // Hàng "Phần còn lại" là lối thoát, không phải cách chia chính.
    assert.ok(!list.some((s) => s.rest), `${view.id}: còn mảnh không thuộc cấu trúc nào`);
  }
});

test("cấu trúc lớn thắng cấu trúc con; cấu trúc dùng lại ở nhiều góc nhìn", () => {
  const lungs = viewStructures("respiratory-lungs").map((s) => s.id);
  assert.deepEqual(lungs, ["right-lung", "left-lung"]);
  const ids = (v: string) => viewStructures(v).map((s) => s.id);
  assert.ok(ids("respiratory-lung-position").includes("right-lung"));
  assert.ok(ids("respiratory-lung-position").includes("diaphragm"));
  assert.ok(ids("respiratory-inspiration-muscles").includes("diaphragm"));
  // Mở thẳng một cấu trúc chia được (?view=right-lung): bảng là ba thuỳ.
  assert.deepEqual(ids("right-lung"), ["right-upper-lobe", "right-middle-lobe", "right-lower-lobe"]);
  // Cấu trúc không chia được: một hàng là chính nó.
  assert.deepEqual(ids("trachea"), ["trachea"]);
});

test("não chia sâu: mở cấu trúc cha ra đúng các con, không còn mảnh lẻ", () => {
  const expect: Record<string, string[]> = {
    "cerebral-cortex": ["frontal-lobe", "parietal-lobe", "temporal-lobe", "occipital-lobe", "insula", "limbic-gyri"],
    "frontal-lobe": ["precentral-gyrus", "superior-frontal-gyrus", "middle-frontal-gyrus", "inferior-frontal-gyrus", "orbital-gyri"],
    "parietal-lobe": ["postcentral-gyrus", "superior-parietal-lobule", "inferior-parietal-lobule"],
    "inferior-parietal-lobule": ["supramarginal-gyrus", "angular-gyrus"],
    "temporal-lobe": ["superior-temporal-gyrus", "middle-temporal-gyrus", "inferior-temporal-gyrus", "fusiform-gyrus"],
    "hippocampus-amygdala": ["hippocampus", "amygdala", "septum-telencephalon"],
    diencephalon: ["thalamus", "geniculate-bodies", "hypothalamus", "mammillary-body", "epithalamus"],
    brainstem: ["midbrain", "pons", "medulla-oblongata"],
    "brain-ventricles": ["lateral-ventricles", "third-ventricle", "cerebral-aqueduct", "fourth-ventricle", "choroid-plexus"],
    // CIT168: chất đen tách phần đặc / phần lưới; id cũ là cha.
    "substantia-nigra": ["substantia-nigra-compacta", "substantia-nigra-reticulata"],
    // Đám rối và dây chi: con phủ kín cha — mở dây ra là đúng các nhánh.
    "brachial-plexus": ["brachial-plexus-roots", "brachial-plexus-trunks", "brachial-plexus-divisions", "brachial-plexus-posterior-cord"],
    "median-nerve": ["median-nerve-trunk", "anterior-interosseous-nerve", "median-nerve-muscular-branches", "median-nerve-palmar-branch", "median-nerve-digital-branches", "median-ulnar-communicating-branch"],
    "ulnar-nerve": [
      "ulnar-nerve-trunk",
      "ulnar-nerve-muscular-branches",
      "ulnar-nerve-palmar-branch",
      "ulnar-nerve-dorsal-branch",
      "ulnar-nerve-superficial-branch",
      "ulnar-nerve-deep-branch",
      "ulnar-nerve-palmar-digital-branches",
      "ulnar-nerve-dorsal-digital-branches",
    ],
    "radial-nerve": [
      "radial-nerve-trunk",
      "radial-nerve-muscular-branches",
      "radial-nerve-cutaneous-branches",
      "radial-nerve-superficial-branch",
      "radial-nerve-deep-branch",
      "posterior-interosseous-nerve",
      "radial-nerve-dorsal-digital-branches",
    ],
    "tibial-nerve": ["tibial-nerve-trunk", "plantar-nerves"],
    "plantar-nerves": ["medial-plantar-nerve", "lateral-plantar-nerve"],
  };
  for (const [view, children] of Object.entries(expect)) {
    const list = viewStructures(view);
    assert.ok(!list.some((s) => s.rest), `${view}: còn mảnh không thuộc cấu trúc con`);
    assert.deepEqual(list.map((s) => s.id), children, view);
  }
});

test("góc nhìn không cấu trúc nào khớp thì không có bảng", () => {
  assert.deepEqual(viewStructures("skull"), []);
  assert.deepEqual(viewStructures(null), []);
});

test("cấp cấu trúc không có thẻ (không chụp ảnh thu nhỏ)", () => {
  assert.equal(hasCard(viewById("trachea")!), false);
  assert.equal(hasCard(viewById("respiratory-lungs")!), true);
  assert.equal(hasCard(viewById("skull")!), true);
});
