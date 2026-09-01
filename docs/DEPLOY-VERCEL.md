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

## Những điểm cần biết khi chạy trên Vercel

### Tìm kiếm chậm và kém hơn Meilisearch

Postgres FTS không chịu được lỗi chính tả (`"hô đen"` sai một dấu là mất kết
quả) và không có facet. Meilisearch xử lý được cả hai. Đã đo bộ 9 câu RAG:
**cả hai backend đều 9/9**, nên với kho 17 bài thì khác biệt không đáng kể —
nhưng khi kho lớn lên vài nghìn bài thì nên cân nhắc Meilisearch Cloud và đặt
lại `MEILISEARCH_HOST`. Code tự chuyển, không phải sửa gì.

### Rate limit không đáng tin trên serverless

`src/lib/rate-limit.ts` đếm trong bộ nhớ tiến trình. Vercel chạy nhiều lambda
độc lập, mỗi cái có bộ đếm riêng, nên hạn mức thực tế bị nhân lên theo số
instance đang sống. Với endpoint AI (tốn quota Gemini) đây là rủi ro thật.

Nếu mở public cho nhiều người dùng, thay bằng Upstash Redis:
`@upstash/ratelimit` + `@upstash/redis`, sửa đúng một file.

### Ảnh phải có hostname trong allowlist

`next.config.ts` → `images.remotePatterns` và `isAllowedImageUrl()` trong
`src/lib/utils.ts` phải khớp nhau. Đã cho phép: Supabase Storage, Unsplash,
NASA, Wikimedia.

### Soft-404

Slug không tồn tại hiển thị trang 404 nhưng trả HTTP 200 — hạn chế của
Next.js 15.5.4. Đã chặn index bằng `robots: noindex`. Chi tiết ở README.
