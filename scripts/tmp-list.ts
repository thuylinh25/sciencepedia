const SITEMAP = "https://www.thienvanvietnam.org/sitemap.xml";
const UA = "Mozilla/5.0 (compatible; SciencepediaBot/1.0; +https://sciencepedia-eight.vercel.app)";
const SKIP = new Set(["21","25","27","34","35","47"]);
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
async function main() {
  const res = await fetch(SITEMAP, { headers: { "User-Agent": UA } });
  const xml = await res.text();
  const seen = new Map<string,string>();
  let locs = 0;
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    locs++;
    const url = decode(m[1]).replace(/\/\.\.\.\//g, "/");
    if (!url.includes("view=article")) continue;
    const catid = url.match(/catid=(\d+)/)?.[1];
    if (catid && SKIP.has(catid)) continue;
    const id = url.match(/[?&]id=(\d+)/)?.[1];
    if (id && !seen.has(id)) seen.set(id, url);
  }
  console.error(`locs=${locs} eligible=${seen.size}`);
  for (const [id, url] of [...seen].sort((a,b)=>Number(a[0])-Number(b[0]))) {
    const slugPart = url.match(/[?&]id=\d+:([^&]*)/)?.[1] ?? "";
    const catid = url.match(/catid=(\d+)/)?.[1] ?? "";
    console.log(`${id}\tcat=${catid}\t${slugPart}`);
  }
}
main();
