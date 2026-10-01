/**
 * Tra Wikipedia cho gloss giải phẫu — dùng chung bởi `atlas-descriptions.ts`
 * (cấu trúc chính) và `atlas-group-descriptions.ts` (nhóm cấu trúc).
 */

export const UA = "SciencePedia/1.0 (https://sciencepedia; linhlt@newwave.com.vn)";

export type Summary = { lang: "vi" | "en"; title: string; url: string; extract: string; qid?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** fetch có thử lại: 429/5xx thì lùi dần; 404 trả null ngay (miss thật). */
export async function fetchRetry(url: string, init?: RequestInit, tries = 4): Promise<Response | null> {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, init);
    if (res.ok) return res;
    if (res.status === 404) return null;
    if (res.status === 429 || res.status >= 500) {
      const ra = Number(res.headers.get("retry-after"));
      await sleep(Number.isFinite(ra) && ra > 0 ? ra * 1000 : 400 * 2 ** i);
      continue;
    }
    return null; // 4xx khác: bỏ
  }
  return null;
}

/** REST summary của Wikipedia; bỏ trang định hướng. Kèm `wikibase_item` (Qid). */
export async function wikipediaSummary(lang: "vi" | "en", title: string): Promise<Summary | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  const res = await fetchRetry(url, { headers: { "User-Agent": UA } });
  if (!res) return null;
  const j = (await res.json()) as {
    type?: string;
    extract?: string;
    titles?: { canonical?: string };
    wikibase_item?: string;
    content_urls?: { desktop?: { page?: string } };
  };
  if (j.type === "disambiguation") return null;
  const extract = (j.extract ?? "").trim();
  if (!extract || /\bmay refer to\b|\bcó thể (là|đề cập)\b/i.test(extract)) return null;
  const canonical = j.titles?.canonical ?? title;
  return {
    lang,
    title: canonical,
    url: j.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(canonical)}`,
    // Nguyên văn tiếng Việt chỉ câu đầu: câu thứ hai của bài vi hay là câu so sánh dịch vụng
    // ("…vốn có kích thước…" ở Xương quay). Bản en lấy 2 câu — đằng nào cũng qua science-editor dịch.
    extract: firstSentences(extract, lang === "vi" ? 1 : 2),
    qid: j.wikibase_item,
  };
}

/** Qid → tên bài tiếng Việt (nếu có), một SPARQL cho nhiều Qid. */
export async function viTitlesForQids(qids: string[]): Promise<Map<string, string>> {
  if (qids.length === 0) return new Map();
  const values = qids.map((q) => `wd:${q}`).join(" ");
  const query = `
SELECT ?item ?vi WHERE {
  VALUES ?item { ${values} }
  ?vi schema:about ?item; schema:isPartOf <https://vi.wikipedia.org/> .
}`;
  const res = await fetch("https://query.wikidata.org/sparql", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/sparql-results+json",
      "User-Agent": UA,
    },
    body: new URLSearchParams({ query }),
  });
  if (!res.ok) throw new Error(`Wikidata Qid→vi ${res.status}`);
  const json = (await res.json()) as { results: { bindings: Array<Record<string, { value: string }>> } };
  const map = new Map<string, string>();
  for (const b of json.results.bindings) {
    const qid = b.item.value.split("/entity/")[1];
    map.set(qid, decodeURIComponent(b.vi.value.split("/wiki/")[1]));
  }
  return map;
}

/** Cắt còn tối đa n câu; giữ dấu chấm. Đủ cho một gloss. */
export function firstSentences(text: string, n: number): string {
  // Dấu chấm giữa hai chữ số là số thập phân ("0.5g"), không phải hết câu — cắt ở đó
  // từng biến câu Tuyến yên thành "5g nằm ở sàn não thất ba…".
  const parts = text.match(/(?:[^.!?]|(?<=\d)\.(?=\d))+[.!?]+(\s|$)/g);
  if (!parts) return text;
  return parts.slice(0, n).join("").trim();
}


export async function pool<T, R>(items: T[], size: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return out;
}

