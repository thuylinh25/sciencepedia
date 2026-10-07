import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

/*
 * Bách khoa A.D.A.M. trên MedlinePlus (`/ency/`) cấm dùng cho hệ AI khi chưa có văn bản đồng ý —
 * docs/content-rules.md, "MedlinePlus: trang chủ đề dùng được, bách khoa /ency/ thì không".
 * Trang chủ đề `medlineplus.gov/<chủ-đề>.html` (NLM soạn) vẫn dùng được.
 */
const TOPICS = path.join(process.cwd(), "content/tac-dong-cot-song/topics");

test("tệp biên tập không dẫn nguồn bách khoa A.D.A.M. (medlineplus.gov/ency)", () => {
  const offenders = readdirSync(TOPICS)
    .filter((f) => f.endsWith(".editorial.json"))
    .filter((f) => readFileSync(path.join(TOPICS, f), "utf8").includes("medlineplus.gov/ency/"));
  assert.deepEqual(offenders, []);
});
