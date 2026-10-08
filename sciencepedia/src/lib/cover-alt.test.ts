import { test } from "node:test";
import assert from "node:assert/strict";

import { altFieldsToFill, isAltTiedToOldCover, parseCoverAlt } from "./cover-alt";

const R2_A = "https://pub-x.r2.dev/articles/2026/10/a-1024.webp";
const R2_B = "https://pub-x.r2.dev/articles/2026/10/b-1024.webp";

// ------------------------------------------------------------ parseCoverAlt

test("đọc JSON hợp lệ, làm sạch khoảng trắng", () => {
  assert.deepEqual(
    parseCoverAlt('{"vi":"  Sao Thổ và  vành đai\\n trên nền đen ","en":"Saturn and its rings on a black background"}'),
    { vi: "Sao Thổ và vành đai trên nền đen", en: "Saturn and its rings on a black background" },
  );
});

test("bóc JSON khỏi khối ```json và câu dẫn", () => {
  const text = 'Đây là kết quả:\n```json\n{"vi":"Sơ đồ tế bào gốc phân chia","en":"Diagram of a dividing stem cell"}\n```';
  assert.deepEqual(parseCoverAlt(text), {
    vi: "Sơ đồ tế bào gốc phân chia",
    en: "Diagram of a dividing stem cell",
  });
});

test("bỏ mở đầu thừa 'Ảnh của…' / 'An image of…' và viết hoa lại chữ đầu", () => {
  assert.deepEqual(
    parseCoverAlt('{"vi":"Hình ảnh cho thấy tinh vân màu cam","en":"An image of an orange nebula"}'),
    { vi: "Tinh vân màu cam", en: "An orange nebula" },
  );
});

test("giữ 'Ảnh chụp kính hiển vi…' — đó là chất liệu ảnh, không phải chữ thừa", () => {
  const alt = parseCoverAlt(
    '{"vi":"Ảnh chụp kính hiển vi điện tử của hồng cầu","en":"Electron micrograph of red blood cells"}',
  );
  assert.equal(alt?.vi, "Ảnh chụp kính hiển vi điện tử của hồng cầu");
});

test("bỏ ngoặc kép bọc ngoài", () => {
  assert.equal(parseCoverAlt('{"vi":"“Bộ xương người”","en":"\\"Human skeleton\\""}')?.en, "Human skeleton");
});

test("thiếu một thứ tiếng, rỗng, sai kiểu hay không phải JSON → null", () => {
  assert.equal(parseCoverAlt('{"vi":"Sao Hoả"}'), null);
  assert.equal(parseCoverAlt('{"vi":"","en":"Mars"}'), null);
  assert.equal(parseCoverAlt('{"vi":42,"en":"Mars"}'), null);
  assert.equal(parseCoverAlt("Xin lỗi, tôi không thấy ảnh."), null);
  assert.equal(parseCoverAlt(""), null);
});

test("quá trần 250 ký tự thì loại cả cặp, không cắt cụt", () => {
  const long = "a".repeat(251);
  assert.equal(parseCoverAlt(JSON.stringify({ vi: long, en: "Mars" })), null);
  assert.ok(parseCoverAlt(JSON.stringify({ vi: "a".repeat(250), en: "Mars" })));
});

// ------------------------------------------------------------ altFieldsToFill

test("không có ảnh bìa thì không tạo gì", () => {
  assert.deepEqual(altFieldsToFill({ cover: null, alt: { vi: "", en: "" } }), { vi: false, en: false });
  assert.deepEqual(altFieldsToFill({ cover: "  ", alt: { vi: null, en: null } }), { vi: false, en: false });
});

test("bài mới: chỉ điền ô trống", () => {
  assert.deepEqual(altFieldsToFill({ cover: R2_A, alt: { vi: "", en: "Mars" } }), { vi: true, en: false });
  assert.deepEqual(altFieldsToFill({ cover: R2_A, alt: { vi: "Sao Hoả", en: "Mars" } }), { vi: false, en: false });
});

test("ảnh không đổi: alt cũ giữ nguyên", () => {
  assert.deepEqual(
    altFieldsToFill({
      cover: R2_A,
      alt: { vi: "Sao Hoả", en: "Mars" },
      previousCover: R2_A,
      previousAlt: { vi: "Sao Hoả", en: "Mars" },
    }),
    { vi: false, en: false },
  );
});

test("ảnh đổi mà alt gửi lên y alt cũ trong CSDL → alt ấy tả ảnh cũ, tạo lại", () => {
  assert.deepEqual(
    altFieldsToFill({
      cover: R2_B,
      alt: { vi: "Sao Hoả", en: "Mars" },
      previousCover: R2_A,
      previousAlt: { vi: "Sao Hoả", en: "Mars" },
    }),
    { vi: true, en: true },
  );
});

test("ảnh đổi nhưng người biên tập đã gõ alt mới → không bao giờ ghi đè", () => {
  assert.deepEqual(
    altFieldsToFill({
      cover: R2_B,
      alt: { vi: "Sao Mộc và Vết Đỏ Lớn", en: "Mars" },
      previousCover: R2_A,
      previousAlt: { vi: "Sao Hoả", en: "Mars" },
    }),
    { vi: false, en: true },
  );
});

test("CSDL chưa có alt: ảnh đổi không biến ô đã gõ thành 'cũ'", () => {
  assert.deepEqual(
    altFieldsToFill({
      cover: R2_B,
      alt: { vi: "Sao Hoả", en: "" },
      previousCover: R2_A,
      previousAlt: { vi: null, en: null },
    }),
    { vi: false, en: true },
  );
});

// ------------------------------------------------------------ isAltTiedToOldCover

test("form: ô còn đúng chữ gắn với ảnh trước → xoá; đã sửa tay hay trống → để yên", () => {
  assert.equal(isAltTiedToOldCover("Sao Hoả", "Sao Hoả"), true);
  assert.equal(isAltTiedToOldCover("Sao Hoả đỏ", "Sao Hoả"), false);
  assert.equal(isAltTiedToOldCover("", ""), false);
  assert.equal(isAltTiedToOldCover("Sao Hoả", ""), false);
  assert.equal(isAltTiedToOldCover(undefined, "Sao Hoả"), false);
});
