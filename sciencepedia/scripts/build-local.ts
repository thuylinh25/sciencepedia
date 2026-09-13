/**
 * Chạy `next build` với pool kết nối rộng hơn, CHỈ cho tiến trình build.
 *
 * ## Vì sao cần
 *
 * `next build` prerender 267 trang bằng nhiều worker song song, mỗi worker giữ
 * một PrismaClient riêng. `DATABASE_URL` hiện cho 5 kết nối, nên lượt build
 * đều đặn chết ở khoảng trang thứ 200 với `P2024 — Timed out fetching a new
 * connection from the connection pool`. Không phải lỗi mã: biên dịch xong,
 * 200 trang đầu render đúng, chỉ là hết chỗ trong pool.
 *
 * ## Vì sao không sửa thẳng `.env`
 *
 * `connection_limit` cao là đúng cho một lượt build chạy một lần rồi thoát, và
 * SAI cho `next dev` hay một script chạy nền — chúng sẽ giữ hàng chục kết nối
 * mở suốt phiên và giành chỗ với chính lượt build sau. Nên giá trị cao chỉ
 * sống trong đúng tiến trình cần nó.
 *
 * Script KHÔNG in `DATABASE_URL` ra đâu cả; nó chỉ đọc, thêm tham số, rồi
 * truyền xuống tiến trình con.
 */
import { spawnSync } from "node:child_process";

const LIMIT = 20;

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("Chưa có DATABASE_URL. Chạy qua `npm run build:local`.");
  process.exit(1);
}

/* Giữ nguyên mọi tham số sẵn có, chỉ ghi đè `connection_limit`. Dùng URL của
   Node thay vì nối chuỗi bằng tay: chuỗi kết nối đã có sẵn tham số của pooler
   Supabase, và nối tay là cách chắc chắn làm hỏng một trong số đó. */
const url = new URL(raw);
url.searchParams.set("connection_limit", String(LIMIT));

console.log(`Build với connection_limit=${LIMIT} (chỉ trong tiến trình này).`);

const result = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: url.toString() },
});

process.exit(result.status ?? 1);
