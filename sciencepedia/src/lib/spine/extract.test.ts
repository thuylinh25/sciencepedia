import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { extractSection, parsePage, reviewFlags, type SectionExtract } from "./extract";

// Chạy: npx tsx --test src/lib/spine/extract.test.ts
// Chạy trên chính bản chép trang trong repo: test hỏng khi bản chép đổi là đúng ý —
// mọi thay đổi bản chép phải được nhìn lại.

const DIR = path.join(process.cwd(), "content/tac-dong-cot-song/source/pages");
const pages = readdirSync(DIR).sort().map((f) => parsePage(readFileSync(path.join(DIR, f), "utf8")));

const codesOf = (s: SectionExtract, variant: string, kind: string) =>
  s.variants
    .find((v) => v.id === variant)!
    .fields.filter((f) => f.kind === kind)
    .flatMap((f) => f.vertebrae?.codes.map((c) => c.code) ?? []);

test("đủ 43 trang, đánh số liên tục", () => {
  assert.deepEqual(pages.map((p) => p.pdfPage), Array.from({ length: 43 }, (_, i) => i + 1));
});

test("huyết áp cao: cấm C1–C3 (văn xuôi) phải được bắt, không rơi xuống mention", () => {
  const s = extractSection("huyet-ap-cao", [19, 19], pages);
  assert.deepEqual(codesOf(s, "benh-huyet-ap-cao", "avoid"), ["C1", "C2", "C3"]);
  assert.deepEqual(codesOf(s, "benh-huyet-ap-cao", "caution"), ["T6", "T10", "L3"]);
  const avoid = s.variants[0].fields.find((f) => f.kind === "avoid")!;
  assert.match(avoid.label, /vùng chẩm/); // vùng cấm không có mã vẫn phải hiện cho người duyệt
  assert.ok(!s.mentions.some((m) => m.vertebrae.codes.some((c) => c.code === "C1")));
});

test("nơi bệnh nằm KHÔNG thành nơi tác động: lao đốt sống T7, T8 là mention", () => {
  const s = extractSection("dau-lung-man-tinh", [4, 6], pages);
  const lao = s.mentions.find((m) => m.line.includes("lao đốt sống"));
  assert.deepEqual(lao?.vertebrae.codes.map((c) => c.code), ["T7", "T8"]);
  assert.deepEqual(codesOf(s, "dau-lung-do-nhiem-khuan-lao-dot", "primary"), []);
});

test("tiêu đề đậm một phần: nội dung sau tiêu đề vẫn được đọc", () => {
  const s = extractSection("dau-lung-man-tinh", [4, 6], pages);
  assert.ok(s.variants.some((v) => v.id === "dau-lung-do-thoai-hoa-voi-hoa"));
  assert.ok(s.mentions.some((m) => m.line.startsWith("Đau lưng do thoái hoá thường")));
});

test("bảng có nhãn: vai trò đọc từ nhãn, tam giác cơ không lẫn vào đốt", () => {
  const s = extractSection("huyet-ap-thap", [15, 16], pages);
  const v = s.variants.find((x) => x.id === "nguoi-met-moi-keo-dai-thoang-ngat")!;
  assert.deepEqual(v.fields.find((f) => f.kind === "primary")?.vertebrae?.codes.map((c) => c.code), [
    "C1", "T1", "T5", "T6", "T7", "T10",
  ]);
  assert.deepEqual(v.fields.find((f) => f.kind === "triangles")?.triangles, [1, 3, 4, 5]);
});

test("tiết cơ ngang là khái niệm riêng, không phải đốt sống", () => {
  const s = extractSection("benh-do-mo-hoi", [40, 40], pages);
  const v = s.variants.find((x) => x.id === "va-mo-hoi-nhu-tam")!;
  assert.deepEqual(v.fields.find((f) => f.kind === "triangles")?.muscleSegments, ["T8"]);
  assert.deepEqual(codesOf(s, "va-mo-hoi-nhu-tam", "primary"), ["T11"]);
});

test("mục chồng vai được liệt kê để người duyệt quyết", () => {
  const s = extractSection("thieu-nang-tuan-hoan-nao", [17, 18], pages);
  const flags = reviewFlags(s);
  assert.ok(flags.some((f) => f.startsWith("[lao-dao] T1 mang nhiều vai")));
});

test("đủ số thể theo bản gốc ở các mục dạng bảng", () => {
  const count = (id: string, range: [number, number]) => extractSection(id, range, pages).variants.length;
  assert.equal(count("huyet-ap-thap", [15, 16]), 10);
  assert.equal(count("thieu-nang-tuan-hoan-nao", [17, 18]), 16);
  assert.equal(count("sot", [35, 38]), 15);
  assert.equal(count("viem-dai-trang-man-tinh", [42, 43]), 9);
  assert.equal(count("mat-ngu", [41, 41]), 7);
});

test("trung tâm điều nhiệt: mã sau mô tả vùng là vùng điều nhiệt, không phải mã giải tỏa (D-28)", () => {
  const s = extractSection("dau-dau", [20, 32], pages);
  const thermo = (variant: string) =>
    s.variants.find((v) => v.id === variant)!.fields.find((f) => f.label.startsWith("Trung tâm điều nhiệt"))!.vertebrae?.codes.map((c) => c.code);
  assert.equal(thermo("dau-dau-vung-giua-lung-nong-cao"), undefined); // "Vùng đầu, T7-T11"
  assert.deepEqual(thermo("dau-dau-sot-ret-con-lung-gay"), ["C7", "T1"]); // "vùng đầu : C7 và T1"
  assert.deepEqual(thermo("dau-dau-sot-cao-kiem-chung-lung"), ["T7"]); // "…vùng đầu. Giải tỏa trọng điểm T7"
  assert.ok(!reviewFlags(s).some((f) => f.includes("phần giải tỏa có T7")));
});
