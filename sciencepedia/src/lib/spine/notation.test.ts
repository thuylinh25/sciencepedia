import assert from "node:assert/strict";
import { test } from "node:test";

import { parseVertebraList, parseZones } from "./notation";

// Chạy: npx tsx --test src/lib/spine/notation.test.ts
// Mọi chuỗi đầu vào dưới đây chép nguyên từ bản scan — trang PDF ghi bên cạnh.

const codes = (raw: string) => parseVertebraList(raw).codes.map((c) => c.code);

test("dạng nén: số trần kế thừa nhóm đứng trước", () => {
  assert.deepEqual(codes("T2,3,7,8"), ["T2", "T3", "T7", "T8"]); // p02
  assert.deepEqual(codes("T3.4.5"), ["T3", "T4", "T5"]); // p05
  assert.deepEqual(codes("T5.6.7.11.12"), ["T5", "T6", "T7", "T11", "T12"]); // p43
  assert.deepEqual(codes("C1; 2; 3"), ["C1", "C2", "C3"]); // p19
  assert.deepEqual(codes("L2,3. S1,2"), ["L2", "L3", "S1", "S2"]); // p41
  assert.deepEqual(codes("T1,2,3. T6"), ["T1", "T2", "T3", "T6"]); // p41
  assert.deepEqual(codes("T10,L1.2.3.4.5, S1.2.3.4"), ["T10", "L1", "L2", "L3", "L4", "L5", "S1", "S2", "S3", "S4"]); // p43
  assert.deepEqual(codes("C3, 4,5,6,7, T4"), ["C3", "C4", "C5", "C6", "C7", "T4"]); // p31
});

test("từ nối và từ đệm không làm hỏng danh sách", () => {
  const r = parseVertebraList("L4,5 và S1"); // p03
  assert.deepEqual(r.codes.map((c) => c.code), ["L4", "L5", "S1"]);
  assert.deepEqual(r.issues, []);
  assert.ok(r.codes.every((c) => c.confidence === "exact"));
  assert.deepEqual(codes("L1,L5 hoặc S1"), ["L1", "L5", "S1"]); // p04
  assert.deepEqual(codes("C1, C2, T6, T10 và L3"), ["C1", "C2", "T6", "T10", "L3"]); // p29
  assert.deepEqual(codes("Song chỉnh L3// S3"), ["L3", "S3"]); // p36
  assert.deepEqual(codes("Các đốt sống TĐ : C6,T9,L3,S3".split(":")[1]), ["C6", "T9", "L3", "S3"]); // p36
});

test("khoảng: bung ra, đánh dấu expanded", () => {
  const r = parseVertebraList("C1- C5; T1- T10"); // p17
  assert.equal(r.codes.length, 15);
  assert.equal(r.codes.find((c) => c.code === "C1")?.confidence, "exact");
  assert.equal(r.codes.find((c) => c.code === "C3")?.confidence, "expanded");
  assert.deepEqual(codes("T10,12 L1->L5 S1->5"), [
    "T10", "T12", "L1", "L2", "L3", "L4", "L5", "S1", "S2", "S3", "S4", "S5",
  ]); // p05
  assert.deepEqual(codes("T1 – T8"), ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"]); // p17
  assert.deepEqual(codes("C4 – C7 ; T1,T2,T5,T7,T8 ; L4, L5; S1- S4"), [
    "C4", "C5", "C6", "C7", "T1", "T2", "T5", "T7", "T8", "L4", "L5", "S1", "S2", "S3", "S4",
  ]); // p27
});

test("D = T (ký hiệu dorsal), có ghi chú để người duyệt thấy", () => {
  const r = parseVertebraList("C6,7, D11"); // p30
  assert.deepEqual(r.codes.map((c) => c.code), ["C6", "C7", "T11"]);
  const t11 = r.codes.find((c) => c.code === "T11")!;
  assert.equal(t11.confidence, "expanded");
  assert.match(t11.note ?? "", /dorsal/);
  assert.deepEqual(codes("C7, D1"), ["C7", "T1"]); // p30
});

test("F đứng riêng sau mã = bên phải của mã đó", () => {
  const r = parseVertebraList("T6 F"); // p19
  assert.deepEqual(r.codes, [{ code: "T6", confidence: "exact", side: "right" }]);
  assert.deepEqual(r.issues, []);
});

test("\"bên phải\" sau nhiều mã: gắn bên, nhưng hỏi lại phạm vi", () => {
  const r = parseVertebraList("C7; T1; T2; T3 bên phải"); // p19
  assert.deepEqual(r.codes.map((c) => c.code), ["C7", "T1", "T2", "T3"]);
  assert.ok(r.codes.every((c) => c.side === "right" && c.confidence === "uncertain"));
  assert.equal(r.issues.length, 1);
  const single = parseVertebraList("T3 bên phải"); // p19
  assert.deepEqual(single.codes, [{ code: "T3", confidence: "exact", side: "right" }]);
});

test("T đứng riêng giữa danh sách: không đoán, hạ uncertain", () => {
  const r = parseVertebraList("T2 T,3T7 T8"); // p08
  assert.deepEqual(r.codes.map((c) => c.code), ["T2", "T3", "T7", "T8"]);
  assert.ok(r.codes.every((c) => c.confidence === "uncertain"));
  assert.ok(r.issues.some((i) => i.includes('"T"')));
});

test("dừng ở tam giác cơ / lớp: số của hệ khác không thành đốt", () => {
  const r = parseVertebraList("T7 thuộc Tam giác cơ 4, lớp cơ sâu"); // p36
  assert.deepEqual(r.codes.map((c) => c.code), ["T7"]);
  assert.equal(r.remainder, "thuộc Tam giác cơ 4, lớp cơ sâu");
  assert.deepEqual(codes("các đốt sống cổ, L3,L5 rối loạn"), ["L3", "L5"]); // p24
  assert.deepEqual(codes("Tiết cơ ngang T8"), []); // p40 — không bao giờ là T8
});

test("vùng không bung thành đốt", () => {
  const r = parseVertebraList("các đốt sống cổ và T11"); // p22
  assert.deepEqual(r.codes.map((c) => c.code), ["T11"]);
  assert.deepEqual(r.regions, ["cervical"]);
  assert.deepEqual(r.issues, []);
  const v = parseVertebraList("Vùng cổ và T6, T7"); // p27
  assert.deepEqual(v.regions, ["cervical"]);
  assert.deepEqual(v.codes.map((c) => c.code), ["T6", "T7"]);
  const s = parseVertebraList("vùng S"); // p03
  assert.deepEqual(s.regions, ["sacral"]);
  assert.deepEqual(s.codes, []);
  assert.deepEqual(parseVertebraList("vùng hông S3").codes.map((c) => c.code), ["S3"]); // p23
});

test("mã ngoài giải phẫu bị từ chối, không lặng lẽ nhận", () => {
  const r = parseVertebraList("T13, L6");
  assert.deepEqual(r.codes, []);
  assert.equal(r.issues.length, 2);
});

test("vùng nhiệt độ: T/F đứng riêng = trái/phải", () => {
  assert.deepEqual(parseZones("Đầu, mặt, cổ, ngực T,sườn F"), [
    { zone: "Đầu" }, { zone: "mặt" }, { zone: "cổ" },
    { zone: "ngực", side: "left" }, { zone: "sườn", side: "right" },
  ]); // p32
  assert.deepEqual(parseZones("Đầu F giảm, chẩm"), [{ zone: "Đầu giảm", side: "right" }, { zone: "chẩm" }]); // p32
  assert.deepEqual(parseZones("Cổ gáy lạnh, ngực trái nóng"), [
    { zone: "Cổ gáy lạnh" }, { zone: "ngực nóng", side: "left" },
  ]); // p15
  assert.deepEqual(parseZones("Ngực trái- cổ phải- thắt lưng"), [
    { zone: "Ngực", side: "left" }, { zone: "cổ", side: "right" }, { zone: "thắt lưng" },
  ]); // p33
});
