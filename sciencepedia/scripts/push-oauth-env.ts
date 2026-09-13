/**
 * Đẩy bốn biến OAuth cùng `AUTH_URL` từ `.env` local lên Vercel production.
 *
 * ## Vì sao cần
 *
 * Đo 2026-09-13: `/api/auth/providers` trên production chỉ trả về
 * `credentials`. Mã thì đúng — `src/auth.ts` gắn provider theo điều kiện
 * `if (ID && SECRET)` — và `vercel env ls` cho thấy bốn biến CÓ TÊN. Nên khả
 * năng còn lại duy nhất là giá trị của chúng rỗng hoặc là chuỗi mẫu.
 *
 * ## Giá trị không đi qua màn hình
 *
 * Script đọc `.env`, ghi thẳng vào stdin của `vercel env add`, và không in
 * giá trị nào — chỉ in TÊN biến và kết quả. Nó cũng từ chối chạy nếu một giá
 * trị trông như chuỗi mẫu, để không đẩy rác lên thay rác.
 *
 * `vercel env add` từ chối biến đã tồn tại, nên phải `rm` trước. Hai lệnh ấy
 * không nguyên tử: nếu `add` hỏng giữa chừng thì biến biến mất khỏi
 * production. Vì vậy script kiểm giá trị TRƯỚC khi xoá bất cứ thứ gì.
 */
import { spawnSync } from "node:child_process";

const NAMES = [
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "AUTH_GITHUB_ID",
  "AUTH_GITHUB_SECRET",
] as const;

/** Địa chỉ production thật, lấy từ alias của Vercel. */
const AUTH_URL = "https://sciencepedia-sciencepedia.vercel.app";

const PLACEHOLDER = /^(your|xxx|changeme|todo|placeholder|<|test|dummy)/i;

const write = process.argv.includes("--write");

function check(): Map<string, string> {
  const values = new Map<string, string>();
  let bad = false;

  for (const name of NAMES) {
    const v = process.env[name];
    if (!v) {
      console.log(`  ${name.padEnd(20)} ✘ không có trong .env`);
      bad = true;
      continue;
    }
    if (PLACEHOLDER.test(v) || v.includes("your-")) {
      console.log(`  ${name.padEnd(20)} ✘ trông như chuỗi mẫu`);
      bad = true;
      continue;
    }
    /* Kiểm hình dạng riêng cho Google: client id của Google LUÔN kết thúc
       bằng `.apps.googleusercontent.com`. Một chuỗi không có đuôi ấy thì chắc
       chắn sai, và biết trước còn hơn biết sau khi đã ghi lên production. */
    if (name === "AUTH_GOOGLE_ID" && !v.endsWith(".apps.googleusercontent.com")) {
      console.log(`  ${name.padEnd(20)} ✘ không kết thúc bằng .apps.googleusercontent.com`);
      bad = true;
      continue;
    }
    console.log(`  ${name.padEnd(20)} ✔ hợp lệ (len ${v.length})`);
    values.set(name, v);
  }

  values.set("AUTH_URL", AUTH_URL);
  console.log(`  ${"AUTH_URL".padEnd(20)} ✔ ${AUTH_URL}`);

  if (bad) {
    console.log("\nCó biến không dùng được. KHÔNG đẩy gì cả.");
    process.exit(1);
  }
  return values;
}

function vercel(args: string[], input?: string) {
  return spawnSync("npx", ["vercel", ...args], {
    input,
    encoding: "utf8",
    shell: true,
  });
}

function main() {
  console.log("Kiểm giá trị trong .env trước khi chạm vào production:\n");
  const values = check();

  if (!write) {
    console.log("\nChạy khô. Thêm `--write` để đẩy thật.");
    return;
  }

  console.log("\nĐẩy lên Vercel production:\n");
  for (const [name, value] of values) {
    // Xoá bản cũ. Có thể không tồn tại — đó không phải lỗi.
    vercel(["env", "rm", name, "production", "--yes"]);

    const add = vercel(["env", "add", name, "production"], value + "\n");
    const ok = add.status === 0;
    console.log(`  ${name.padEnd(20)} ${ok ? "✔ đã đặt" : "✘ HỎNG"}`);
    if (!ok) {
      // In stderr chứ KHÔNG in giá trị.
      console.log("    " + (add.stderr ?? "").trim().split("\n").slice(-2).join(" | "));
    }
  }

  console.log(
    "\nBiến môi trường chỉ có hiệu lực ở bản dựng MỚI — phải deploy lại.",
  );
}

main();
