# Deploy lên Vercel

Không cần VPS. Supabase lo database và ảnh; tìm kiếm chạy bằng full-text search
của Postgres nên **không cần host Meilisearch**.

---

## 1. Đưa code lên GitHub

```bash
cd F:\sciencepedia
git init
git add -A
git commit -m "Sciencepedia: bách khoa toàn thư khoa học"

gh repo create sciencepedia --private --source=. --push
# hoặc tạo repo trên github.com rồi:
#   git remote add origin https://github.com/<user>/sciencepedia.git
#   git branch -M main && git push -u origin main
```

`.env` đã nằm trong `.gitignore` — khoá bí mật không bị đẩy lên. Kiểm tra lại
trước khi push:

```bash
git ls-files | Select-String "^\.env$"   # phải không ra gì
```

## 2. Import vào Vercel

1. <https://vercel.com/new> → đăng nhập bằng GitHub
2. Import repo `sciencepedia`
3. Framework tự nhận **Next.js** — không cần đổi gì
4. Dán biến môi trường ở bước 3 **trước khi** bấm Deploy

Build command đã đặt trong `vercel.json`:
`prisma migrate deploy && prisma generate && next build` — migration tự chạy
mỗi lần deploy nên không phải làm tay.

`regions: ["icn1"]` (Seoul) vì Supabase project đang ở `ap-northeast-2`. Đặt
serverless function gần database giảm được vài chục ms mỗi truy vấn. Nếu đổi
region Supabase thì sửa lại chỗ này.

## 3. Biến môi trường

Danh sách trong yêu cầu ban đầu **thiếu 4 biến bắt buộc** — không có chúng thì
build đổ ngay hoặc đăng nhập không hoạt động. Đây là danh sách đầy đủ:

### Bắt buộc

| Biến | Ghi chú |
|---|---|
| `DATABASE_URL` | Supabase → Database → **Transaction pooler (6543)**. Xem cảnh báo bên dưới. |
| `DIRECT_URL` | Supabase → Database → **Direct connection (5432)**. `prisma migrate deploy` cần cái này. |
| `AUTH_SECRET` | `openssl rand -base64 32`. Thiếu là NextAuth không chạy. |
| `NEXT_PUBLIC_SITE_URL` | `https://<project>.vercel.app`. Ảnh hưởng canonical, sitemap, OG image. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API. **Không** thêm tiền tố `NEXT_PUBLIC_`. |

### Tuỳ chọn

| Biến | Không đặt thì sao |
|---|---|
| `GEMINI_API_KEY` | Trợ lý AI trả 503, phần còn lại của web vẫn chạy |
| `GEMINI_MODEL` | Mặc định `gemini-3.6-flash` |
| `OPENROUTER_API_KEY` | Không có dự phòng khi Gemini hết quota |
| `OPENROUTER_MODELS` | Mặc định `z-ai/glm-5.2:free,minimax/minimax-m3:free,google/gemma-4-31b-it:free` |
| `MEILISEARCH_HOST` | **Bỏ trống trên Vercel.** Tự dùng Postgres FTS. |
| `SUPABASE_STORAGE_BUCKET` | Mặc định `article-images` |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | Ẩn nút đăng nhập GitHub |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Ẩn nút đăng nhập Google |
| `NEXT_PUBLIC_SITE_NAME` | Mặc định `Sciencepedia` |

**Không cần** `AUTH_URL` trên Vercel — `AUTH_TRUST_HOST` đã bật và Auth.js tự
suy ra host từ request.

Ba biến trong `.env` local trỏ `localhost`, **đừng dán nguyên sang Vercel**:
`AUTH_URL` (bỏ trống), `MEILISEARCH_HOST` (bỏ trống → dùng Postgres FTS),
`NEXT_PUBLIC_SITE_URL` (đổi thành domain thật, nếu sai thì canonical, sitemap
và OG image đều sai theo).

### Type `Config` hay `Secret`

Vercel phân biệt hai loại. `Secret` mã hoá, **không đọc lại được** — kể cả
`vercel env pull` cũng chỉ trả `[SENSITIVE]`, nên khi nghi giá trị sai thì
không xác minh được, chỉ ghi đè được.

Mọi biến `NEXT_PUBLIC_*` **bắt buộc** là `Config`, Vercel chặn nếu để `Secret`:

> `NEXT_PUBLIC_` exposes this value to anyone visiting your site, so
> `NEXT_PUBLIC_SITE_URL` cannot be a Secret.

Hợp lý — Next.js nhúng thẳng các biến này vào JS gửi xuống trình duyệt, gọi
chúng là bí mật chỉ tạo cảm giác an toàn giả. Lưu ý biến tạo trước khi Vercel
áp luật này vẫn đang ở trạng thái `Secret`; đặt lại bằng:

```bash
vercel env add NEXT_PUBLIC_SITE_URL production,preview --force --type config --yes
```

### Cảnh báo về `connection_limit`

```
DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5&pool_timeout=20"
```

- **Mật khẩu phải percent-encode.** `!Abc@123` → `!Abc%40123`. Để nguyên dấu `@`
  thì connection string bị cắt sai chỗ.
- `connection_limit=1` là con số thường được khuyên cho serverless, nhưng
  **build sẽ đổ** với lỗi `P2024 Timed out fetching a new connection`: `next build`
  prerender nhiều trang song song. Dùng `5` cho cả build và runtime.

## 4. Sau lần deploy đầu

```bash
# Chạy từ máy local, trỏ vào Supabase production
npm run storage:setup   # tạo bucket ảnh (chạy một lần)
npm run db:seed         # dữ liệu mẫu — bỏ qua nếu tự nhập nội dung
```

Rồi vào `https://<project>.vercel.app/api/health` để kiểm tra:

```json
{
  "status": "ok",
  "checks": {
    "database": { "ok": true },
    "search": { "ok": true, "active": "postgres" },
    "storage": { "ok": true }
  }
}
```

`search.active` phải là `postgres`. Nếu là `none` thì migration
`20260901130000_fix_unaccent_mapping` chưa chạy.

---

## Ba cạm bẫy đã làm đổ lần deploy đầu

Ghi lại để lần sau không mất thêm một buổi. Cả ba đều không có cảnh báo nào ở
giao diện Vercel — chỉ lộ ra khi đọc build log.

### Vercel nhận biến môi trường rỗng mà không báo gì

Triệu chứng: build chết ngay ở lệnh đầu của `buildCommand`.

```
Error code: P1012
Error validating datasource `db`: You must provide a nonempty direct URL.
The environment variable `DIRECT_URL` resolved to an empty string.
```

Đọc kỹ: **"resolved to an empty string"**, không phải `"not found"`. Nghĩa là
biến **có tồn tại** nhưng giá trị trống — dán thiếu, hoặc bấm Save khi ô còn
rỗng. Vercel chấp nhận value rỗng không một lời cảnh báo (kiểm chứng được:
`vercel env add X production --value ""` chạy trót lọt).

Hệ quả nguy hiểm hơn: biến rỗng **không** làm đổ build thì nó lặng lẽ làm hỏng
tính năng lúc chạy. `GEMINI_API_KEY` và `OPENROUTER_API_KEY` cùng rỗng khiến
trợ lý AI trả `503 NOT_CONFIGURED`, còn phần còn lại của web vẫn bình thường.

Cách kiểm nhanh không cần mở dashboard — biến type Secret không đọc lại được
giá trị, nên probe qua API thay vì đọc env:

```bash
# 400 INVALID_INPUT = key co that. 503 NOT_CONFIGURED = key rong.
curl -s -X POST -H "Content-Type: application/json" -d '{}' \
  https://<project>.vercel.app/api/ai/chat
```

### Deployment cũ giữ nguyên biến môi trường vĩnh viễn

Vercel gắn cứng env vào từng deployment **lúc deploy**. Sửa biến trong Settings
**không** áp ngược vào các deployment đã tạo — kể cả bản Preview mở hôm qua.
Sau khi sửa env bắt buộc phải **Redeploy**, và phải kiểm tra trên URL của
deployment mới, không phải URL cũ còn mở trong tab.

### npm 12 chặn install script, Prisma không tải được query engine

Trong build log, đoạn này trông như warning vô hại nhưng là lỗi thật sắp xảy ra:

```
npm warn allow-scripts 10 packages have install scripts not yet covered by allowScripts:
  @prisma/engines@6.19.3 (postinstall: node scripts/postinstall.js)
  sharp@0.34.5 (install: node install/check.js || npm run build)
```

npm 12 mặc định không chạy install script. `@prisma/engines` cần postinstall để
tải query engine binary. Máy local không lộ lỗi vì `node_modules` đã cài từ
trước bằng npm cũ; Vercel install sạch từ đầu nên mới thấy.

Đã khai báo sẵn trong `package.json` bằng `npm approve-scripts`. **Không pin
version** (`npm approve-scripts --no-allow-scripts-pin`): `package-lock.json`
đã khoá version rồi, pin thêm ở đây không tăng bảo mật mà mỗi lần bump dep là
build đổ lại. Đã dính đúng cái bẫy này khi `sharp` lên 0.35.4 trong lúc
`allowScripts` còn ghim `sharp@0.34.5`.

---

## Những điểm cần biết khi chạy trên Vercel

### Tìm kiếm chậm và kém hơn Meilisearch

Postgres FTS không chịu được lỗi chính tả (`"hô đen"` sai một dấu là mất kết
quả) và không có facet. Meilisearch xử lý được cả hai. Đã đo bộ 9 câu RAG:
**cả hai backend đều 9/9**, nên với kho 17 bài thì khác biệt không đáng kể —
nhưng khi kho lớn lên vài nghìn bài thì nên cân nhắc Meilisearch Cloud và đặt
lại `MEILISEARCH_HOST`. Code tự chuyển, không phải sửa gì.

### Rate limit — đã dùng chung qua Postgres

`src/lib/rate-limit.ts` có hai hàm, đừng nhầm:

- `rateLimitShared()` — đếm trong Postgres, **đúng cả khi chạy nhiều lambda**.
  Đây là hàm mà `/api/ai/chat`, `/api/upload` và `/api/auth/register` dùng, vì
  chúng tốn quota Gemini hoặc tạo dữ liệu.
- `rateLimit()` — đếm bằng `Map` trong bộ nhớ tiến trình. Mỗi lambda có bộ đếm
  riêng nên hạn mức thực tế bị nhân lên theo số instance đang sống. Chỉ dùng
  được cho những chỗ không quan trọng.

Nếu lượng truy cập lớn tới mức mỗi request thêm một round-trip Postgres là
đáng kể, cân nhắc Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`).

### Ảnh phải có hostname trong allowlist

`next.config.ts` → `images.remotePatterns` và `isAllowedImageUrl()` trong
`src/lib/utils.ts` phải khớp nhau. Đã cho phép: Supabase Storage, Unsplash,
NASA, Wikimedia.

### Soft-404

Slug không tồn tại hiển thị trang 404 nhưng trả HTTP 200 — hạn chế của
Next.js 15.5.4. Đã chặn index bằng `robots: noindex`. Chi tiết ở README.
