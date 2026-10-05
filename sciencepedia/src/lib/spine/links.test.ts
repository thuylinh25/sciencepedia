import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { SPINE_LINKS } from "./links";
import { Topic } from "./schema";
import { SACRAL_REGION_LABEL, VERTEBRAE, atlasCodeOf, codesForFma, type VertebraCode } from "./vertebrae";

// Chạy: npx tsx --test src/lib/spine/links.test.ts

const DIR = path.join(process.cwd(), "content/tac-dong-cot-song/topics");
const topics = readdirSync(DIR)
  .filter((f) => f.endsWith(".json") && !f.endsWith(".editorial.json"))
  .map((f) => Topic.parse(JSON.parse(readFileSync(path.join(DIR, f), "utf8"))));

test("chỉ mục atlas khớp topic — chạy lại `npm run spine:build -- --write` nếu hỏng", () => {
  const expected = new Map<string, Set<string>>();
  for (const t of topics) {
    for (const m of t.variants.flatMap((v) => v.mappings)) {
      const atlas = atlasCodeOf(m);
      if (!atlas) continue;
      const fma = VERTEBRAE.get(atlas)!.fma;
      if (!expected.has(fma)) expected.set(fma, new Set());
      expected.get(fma)!.add(`${t.slug}:${m.role}`);
    }
  }
  const actual = new Map(
    Object.entries(SPINE_LINKS).map(([fma, links]) => [fma, new Set(links.flatMap((l) => l.roles.map((r) => `${l.slug}:${r}`)))]),
  );
  assert.deepEqual(actual, expected);
});

test("mọi khoá là FMA của một đốt sống, mã đi kèm đúng khoá", () => {
  for (const [fma, links] of Object.entries(SPINE_LINKS)) {
    const codes = codesForFma(fma);
    assert.ok(codes.length > 0, `${fma} không phải khái niệm đốt sống`);
    for (const l of links) {
      for (const c of l.codes) {
        // "S" = "vùng S" (D-37): chỉ được nằm ở khoá xương cùng.
        const ok = c === SACRAL_REGION_LABEL ? codes.includes("S1") : codes.includes(c as VertebraCode);
        assert.ok(ok, `${c} không thuộc ${fma}`);
      }
    }
  }
});

test("L5 trỏ về bài đau thần kinh tọa với vai 'liên quan' (D-6)", () => {
  const l5 = SPINE_LINKS[VERTEBRAE.get("L5")!.fma];
  assert.deepEqual(l5.find((l) => l.slug === "dau-than-kinh-toa-theo-tac-dong-cot-song")?.roles, ["related"]);
});
