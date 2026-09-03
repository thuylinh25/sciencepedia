import { writeFileSync } from "node:fs";
const OUT = "C:/Users/Admin/AppData/Local/Temp/claude/f--Website-Builder/4eecffce-1bde-48aa-9965-9c4ac18c598b/scratchpad/vaca";
const UA = "Mozilla/5.0 (compatible; SciencepediaBot/1.0; +https://sciencepedia-eight.vercel.app)";
const SITEMAP = "https://www.thienvanvietnam.org/sitemap.xml";
const SKIP = new Set(["21","25","27","34","35","47"]);
const WANT = (process.argv[2] ?? "").split(",").filter(Boolean);

function decode(html: string): string {
  let out = html;
  for (let i = 0; i < 5; i++) {
    const next = out.replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"')
      .replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">");
    if (next === out) break;
    out = next;
  }
  return out;
}
function stripTags(html: string): string {
  return decode(html
    .replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ")
    .replace(/<\/p>/gi,"\n\n").replace(/<br\s*\/?>/gi,"\n").replace(/<[^>]+>/g," "))
    .replace(/[ \t\u00a0]+/g," ").replace(/\n{3,}/g,"\n\n")
    .split("\n").map(l=>l.trim()).join("\n").trim();
}
function extract(html: string) {
  const title = decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "").trim();
  const author = stripTags(html.match(/Written by:\s*<span>([\s\S]{0,120}?)<\/span>/i)?.[1] ?? "");
  const created = html.match(/<time datetime="([^"]+)"/)?.[1] ?? null;
  const body = html.match(/<div[^>]*class="[^"]*com-content-article__body[^"]*"[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? "";
  let text = stripTags(body);
  const cut = text.indexOf("Vui lòng ghi rõ tên tác giả");
  if (cut > 0) text = text.slice(0, cut).trim();
  return { title, author, created, text };
}
async function main() {
  const xml = await (await fetch(SITEMAP, { headers: { "User-Agent": UA } })).text();
  const seen = new Map<string,string>();
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = decode(m[1]).replace(/\/\.\.\.\//g, "/");
    if (!url.includes("view=article")) continue;
    const catid = url.match(/catid=(\d+)/)?.[1];
    if (catid && SKIP.has(catid)) continue;
    const id = url.match(/[?&]id=(\d+)/)?.[1];
    if (id && !seen.has(id)) seen.set(id, url);
  }
  for (const id of WANT) {
    const url = seen.get(id);
    if (!url) { console.log(`!! ${id} không có trong sitemap`); continue; }
    const fetchUrl = url.replace("://thienvanvietnam.org", "://www.thienvanvietnam.org");
    try {
      const res = await fetch(fetchUrl, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
      const html = await res.text();
      const a = extract(html);
      writeFileSync(`${OUT}/${id}.txt`,
        `URL: ${url}\nTITLE: ${a.title}\nAUTHOR: ${a.author}\nCREATED: ${a.created}\nLEN: ${a.text.length}\n\n${a.text}\n`, "utf8");
      console.log(`ok ${id} len=${a.text.length} author="${a.author}" created=${a.created} :: ${a.title}`);
    } catch (e) {
      console.log(`!! ${id} ${(e as Error).message}`);
    }
  }
}
main();
