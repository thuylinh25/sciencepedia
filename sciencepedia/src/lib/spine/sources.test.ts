import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

/*
 * Bách khoa A.D.A.M. trên MedlinePlus (`/ency/`) cấm dùng cho hệ AI khi chưa có văn bản đồng ý —
 * docs/content-rules.md, "MedlinePlus: trang chủ đề dùng được, bách khoa /ency/ thì không".
 * Ba bài đã xuất bản còn dùng, gỡ theo đường đính chính; xong thì xoá khỏi danh sách này.
 */
const AWAITING_CORRECTION = new Set([
  "dau-lung-cap-theo-tac-dong-cot-song",
  "dau-nua-dau-theo-tac-dong-cot-song",
  "dau-than-kinh-toa-theo-tac-dong-cot-song",
]);

const TOPICS = path.join(process.cwd(), "content/tac-dong-cot-song/topics");

test("tệp biên tập không dẫn nguồn bách khoa A.D.A.M. (medlineplus.gov/ency)", () => {
  const offenders = readdirSync(TOPICS)
    .filter((f) => f.endsWith(".editorial.json"))
    .filter((f) => !AWAITING_CORRECTION.has(f.replace(".editorial.json", "")))
    .filter((f) => readFileSync(path.join(TOPICS, f), "utf8").includes("medlineplus.gov/ency/"));
  assert.deepEqual(offenders, []);
});
