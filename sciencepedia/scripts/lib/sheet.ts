/**
 * Hàm thuần cho quy trình thẩm định (skill `tham-dinh-bai-da-dang`): trích văn bản thay từ phiếu,
 * và kiểm HTML thô không bị vỡ khi áp fix. Tách khỏi `corrections.ts` để test không cần Prisma.
 */

const FENCE = /^(`{3,}|~{3,})(.*)$/;

/**
 * Trích các khối ```` ```markdown ```` dưới mỗi tiêu đề `### D<n> …` của phiếu, tới hết mục D
 * (tiêu đề `## <chữ>. …` kế tiếp). Một mục có nhiều khối thì khoá là `D<n>_0`, `D<n>_1`, …
 *
 * Phải theo dõi code fence: khối thay thế một mục bắt đầu bằng chính dòng `## <tiêu đề>`, nên
 * cắt theo tiêu đề mà không biết mình đang trong fence là cắt nhầm giữa khối — lỗi đã gặp đợt
 * 09/10 với bộ trích viết tay từng đợt.
 */
export function extractD(sheet: string): Record<string, string> {
  const lines = sheet.replace(/\r\n/g, "\n").split("\n");
  const blocks: Record<string, string[]> = {};
  let id: string | null = null;
  let fence: { marker: string; capture: string[] | null } | null = null;

  for (const line of lines) {
    if (fence) {
      const close = FENCE.exec(line);
      if (close && close[1][0] === fence.marker[0] && close[1].length >= fence.marker.length && !close[2].trim()) {
        if (fence.capture && id) (blocks[id] ??= []).push(fence.capture.join("\n"));
        fence = null;
      } else fence.capture?.push(line);
      continue;
    }
    const open = FENCE.exec(line);
    if (open) {
      fence = { marker: open[1], capture: id && open[2].trim() === "markdown" ? [] : null };
      continue;
    }
    const d = /^### (D\d+)\b/.exec(line);
    if (d) {
      id = d[1];
      continue;
    }
    if (/^## \S/.test(line)) id = null;
  }
  if (fence) throw new Error("phiếu có code fence chưa đóng");

  const out: Record<string, string> = {};
  for (const [key, list] of Object.entries(blocks)) {
    list.forEach((text, i) => {
      out[list.length > 1 ? `${key}_${i}` : key] = text;
    });
  }
  return out;
}

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b[^<>]*?(\/?)>/g;

/** Số thẻ mở trừ số thẻ đóng, theo từng tên thẻ (bỏ thẻ rỗng và thẻ tự đóng). */
export function tagBalance(text: string): Map<string, number> {
  const balance = new Map<string, number>();
  for (const [, close, name, selfClose] of text.matchAll(TAG)) {
    const tag = name.toLowerCase();
    if (VOID.has(tag) || selfClose) continue;
    balance.set(tag, (balance.get(tag) ?? 0) + (close ? -1 : 1));
  }
  return balance;
}

/**
 * Thẻ nào bị lệch THÊM sau khi sửa (so với bản trước). So với bản trước chứ không đòi bằng 0:
 * bài cũ đã lệch sẵn thì không chặn việc sửa chỗ khác. Lỗi đã gặp đợt 09/10: chuỗi tìm cắt ở
 * `</div>` của div con, bản sau sửa thừa một `</div>` của div ngoài.
 */
export function tagDrift(before: string, after: string): string[] {
  const a = tagBalance(before);
  const b = tagBalance(after);
  const names = new Set([...a.keys(), ...b.keys()]);
  return [...names].filter((t) => (a.get(t) ?? 0) !== (b.get(t) ?? 0)).map((t) => `<${t}> ${a.get(t) ?? 0} → ${b.get(t) ?? 0}`);
}
