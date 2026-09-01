# Sciencepedia

Bách khoa toàn thư khoa học hiện đại — song ngữ Việt/Anh, có mô hình 3D Hệ Mặt Trời và trợ lý AI hỏi đáp dựa trên chính kho bài viết.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma · **Supabase PostgreSQL** · **Supabase Storage** · Auth.js v5 · Meilisearch · React Three Fiber · next-intl · Google Gemini

## Kiến trúc

```
                    ┌──────────────────────────┐
   Trình duyệt ────▶ │       Next.js 15         │
                    │  App Router · RSC · SSR  │
                    └───┬──────────┬───────┬───┘
                        │          │       │
                 Prisma │          │       │ HTTP
                        ▼          │       ▼
        ┌───────────────────────┐  │  ┌──────────────┐
        │  Supabase PostgreSQL  │  │  │ Meilisearch  │
        │  (Supavisor pooler)   │  │  │  toàn văn    │
        └───────────────────────┘  │  └──────────────┘
                                   │ service role key
                                   ▼
                        ┌────────────────────┐
                        │  Supabase Storage  │
                        │   bucket ảnh       │
                        └────────────────────┘
```

Dữ liệu quan hệ đi qua Prisma tới Supabase PostgreSQL; ảnh nằm trong Supabase Storage và
được ghi **chỉ từ server** bằng service role key; chỉ mục tìm kiếm nằm ở Meilisearch và được
đồng bộ lại sau mỗi lần bài viết thay đổi.

---

## 1. Chạy nhanh

```bash
# 1. Tạo project trên https://supabase.com (Free tier là đủ)

# 2. Meilisearch chạy local
docker compose up -d

# 3. Cấu hình
cp .env.example .env
#    → DATABASE_URL  : Connection string → Transaction pooler (cổng 6543)
#    → DIRECT_URL    : Connection string → Direct connection (cổng 5432)
#    → NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY: Project Settings → API
#    → AUTH_SECRET   : openssl rand -base64 32
#    → GEMINI_API_KEY nếu muốn dùng trợ lý AI (https://aistudio.google.com/apikey)

# 4. Cài đặt và khởi tạo
npm install
npm run db:migrate     # dùng DIRECT_URL, tạo bảng trên Supabase
npm run storage:setup  # tạo bucket ảnh + kiểm tra quyền ghi/đọc
npm run db:seed        # admin + danh mục + bài viết mẫu + đẩy lên Meilisearch

# 5. Chạy
npm run dev            # http://localhost:3000
```

Tài khoản quản trị mặc định lấy từ `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` trong `.env`
(mặc định `admin@sciencepedia.dev` / `Admin@12345` — **đổi ngay trên môi trường thật**).

---

## 2. Cấu trúc thư mục

```
prisma/
  schema.prisma          Mô hình dữ liệu
  seed.ts                Script seed
  seed-data/
    cosmos.ts            ★ Nhánh Vũ trụ (làm trước)
    health.ts            ★ Nhánh Sức khoẻ (làm trước)
    other.ts             Vật lý / Sinh học / Trái Đất
messages/
  vi.json  en.json       Chuỗi giao diện hai ngôn ngữ
scripts/
  reindex.ts             Nạp lại Meilisearch
  import-notion.ts       Nhập nội dung từ Notion
supabase/
  storage-setup.sql      Tạo bucket ảnh + policy (chạy một lần)
src/
  app/
    [locale]/            Toàn bộ trang công khai + khu /admin
    api/                 Route handlers (auth, search, articles, bookmarks, upload, ai/chat)
    sitemap.ts robots.ts manifest.ts
  components/
    ui/                  shadcn/ui primitives
    layout/ article/ category/ search/ solar/ ai/ admin/ motion/
  lib/
    prisma.ts meili.ts storage.ts seo.ts validations.ts utils.ts
    solar-data.ts        Số liệu hành tinh (NASA)
    rate-limit.ts roles.ts rbac.ts highlight.ts
  server/
    queries.ts           Truy vấn đọc (có cache)
    actions/             Server Actions cho CRUD
  i18n/                  Cấu hình next-intl
  auth.ts                Auth.js v5
  middleware.ts          Định tuyến theo ngôn ngữ
```

---

## 3. Tính năng

| Tính năng | Thực hiện ở đâu |
|---|---|
| CRUD bài viết | `src/server/actions/articles.ts`, form ở `components/admin/article-form.tsx` |
| Quản lý danh mục (lồng nhau) | `src/server/actions/taxonomy.ts`, `/admin/categories` |
| Hệ thống tag | `/admin/tags`, trang công khai `/tags` và `/tags/[slug]` |
| Tìm kiếm toàn văn | Meilisearch — `src/lib/meili.ts`, `/api/search`, ⌘K và trang `/search` |
| Tải ảnh lên | Supabase Storage — `src/lib/storage.ts`, `/api/upload`, kéo–thả ở `components/admin/image-upload.tsx` |
| Phân quyền | `Role` = USER / EDITOR / ADMIN — `src/lib/roles.ts`, chặn tại `app/[locale]/admin/layout.tsx` |
| SEO | `src/lib/seo.ts` (metadata + JSON-LD), `sitemap.ts`, `robots.ts`, hreflang vi/en |
| Dark mode | `next-themes` + token OKLCH trong `globals.css` |
| Responsive | Mobile-first, mọi bảng/biểu đồ đều cuộn ngang trong khung riêng |
| Mô hình 3D Hệ Mặt Trời | `components/solar/*` — R3F, nạp động `ssr: false`, có kiểm tra WebGL |
| Trợ lý AI | `/api/ai/chat` — Gemini + RAG từ Meilisearch, stream qua SSE |
| Dashboard quản trị | `/admin` — thống kê, bảng bài viết, đồng bộ Meilisearch |
| Song ngữ | `next-intl`, mỗi bài có trường `*En`; thiếu bản dịch thì hiển thị bản gốc kèm ghi chú |

### Vai trò

| Vai trò | Quyền |
|---|---|
| `USER` | Đọc, lưu bài, bình luận, dùng trợ lý AI |
| `EDITOR` | Thêm/sửa bài viết và thẻ, xuất bản |
| `ADMIN` | Toàn quyền: xoá bài, quản lý danh mục và người dùng, reindex |

Tài khoản đăng ký mới luôn là `USER`; nâng quyền thủ công tại `/admin/users`.

---

## 4. Trợ lý AI

`POST /api/ai/chat` nhận `{ messages, locale }` và trả về một luồng SSE:

| Sự kiện | Dữ liệu |
|---|---|
| `sources` | `{ slugs: string[] }` — các bài được dùng làm ngữ cảnh |
| `delta` | `{ text: string }` — từng đoạn văn bản |
| `error` | `{ code }` — `NOT_CONFIGURED` / `RATE_LIMITED` / `OVERLOADED` / `BLOCKED` / `MODEL_UNAVAILABLE` / `UPSTREAM_ERROR` |
| `done` | `{ usage, model }` |

### Nhà cung cấp và dự phòng

| Thứ tự | Nhà cung cấp | Model | Khi nào dùng |
|---|---|---|---|
| 1 | Google Gemini (`@google/genai`) | `GEMINI_MODEL`, mặc định `gemini-3.6-flash` | Luôn thử trước |
| 2 | OpenRouter (tương thích OpenAI) | `OPENROUTER_MODELS`, thử lần lượt | Khi Gemini 429 / 503 / 404 |

Logic ở `src/lib/ai.ts`. Chỉ chuyển nhà cung cấp khi **chưa gửi chữ nào** cho người dùng — nếu
đã stream ra một phần rồi mới lỗi thì chạy lại model khác sẽ tạo câu trả lời chắp vá hai giọng,
thà báo lỗi để người dùng gửi lại. Sự kiện SSE `provider` cho giao diện biết ai đang trả lời.

Chuỗi dự phòng mặc định: `z-ai/glm-5.2:free` → `minimax/minimax-m3:free` →
`google/gemma-4-31b-it:free`. Cần nhiều hơn một model vì pool `:free` dùng chung và bị 429
thường xuyên — trong lúc kiểm thử, glm-5.2 bị 429 và minimax nhận thay. Tránh model rò rỉ
chain-of-thought vào câu trả lời (đã loại `nvidia/nemotron-3.5-lightning:free` vì lý do đó).

Cách hoạt động: câu hỏi mới nhất được dùng để tìm 5 bài liên quan nhất trên Meilisearch, nội dung
các bài đó được đưa vào `systemInstruction` làm ngữ cảnh, và mô hình được yêu cầu trích dẫn theo
dạng `[slug-bai-viet]`. Lịch sử hội thoại được map sang định dạng Gemini — lượt của trợ lý dùng
role `model`, không phải `assistant`.

Không đặt `GEMINI_API_KEY` thì endpoint trả 503 và giao diện hiển thị thông báo tương ứng —
phần còn lại của trang web vẫn chạy bình thường.

**Chọn model.** `gemini-2.5-flash` đã ngừng mở cho người dùng mới (API trả 404 kèm hướng dẫn đổi
model). Liệt kê model đang khả dụng với key của bạn:

```bash
curl -H "x-goog-api-key: $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models
```

rồi đặt `GEMINI_MODEL` tương ứng. Nếu model trả 503 `high demand`, giao diện hiện thông báo
"đang quá tải" — đổi sang model khác hoặc thử lại sau.

---

## 5. Nhập nội dung từ Notion

```bash
NOTION_TOKEN=ntn_xxx NOTION_PAGE_ID=11246aed6be3... npm run import:notion
# hoặc chỉ vài mục:
NOTION_TOKEN=... NOTION_PAGE_ID=... npx tsx scripts/import-notion.ts "Vũ trụ" "Sức khoẻ"
```

Chuẩn bị: tạo internal integration tại <https://www.notion.so/my-integrations>, rồi mở trang
Notion → `⋯` → `Connections` → thêm integration đó. Trang private không thể truy cập nếu thiếu bước này.

Quy ước ánh xạ: mỗi trang con cấp 1 → **danh mục**, mỗi trang con bên trong → **bài viết**.
Mọi bài nhập vào đều ở trạng thái `DRAFT` để biên tập viên duyệt trước khi xuất bản.

---

## 6. Ảnh và Supabase Storage

`POST /api/upload` nhận `multipart/form-data`:

| Trường | Bắt buộc | Ghi chú |
|---|---|---|
| `file` | ✓ | JPG · PNG · WebP · AVIF · GIF, tối đa 8 MB |
| `prefix` | | Thư mục con, mặc định `articles` (danh mục dùng `categories`) |
| `alt` | | Mô tả ảnh, lưu vào bảng `Media` |

Trả về `{ id, url, path, alt }`. `url` là public URL, lưu thẳng vào `Article.coverImage`.

Nguyên tắc quyền:

- Bucket **công khai để đọc** — ảnh bài viết phải hiện với mọi khách truy cập.
- **Mọi thao tác ghi đi qua server**, dùng `SUPABASE_SERVICE_ROLE_KEY` trong `/api/upload`,
  và endpoint đó yêu cầu quyền `EDITOR` trở lên. Không có policy ghi nào cho `anon`, nên
  client không thể ghi thẳng vào bucket.
- `src/lib/storage.ts` được đánh dấu `server-only`: lỡ import từ Client Component thì build
  báo lỗi thay vì âm thầm đưa service role key vào bundle trình duyệt.

Đường dẫn file có dạng `articles/2026/09/<slug>-<random>.<ext>` — chia theo tháng để một
thư mục không phình lên hàng chục nghìn file, và tên có phần ngẫu nhiên nên ảnh là bất biến,
cache được 1 năm.

Bảng `Media` lưu `path` của mỗi lần tải lên. Chỉ giữ URL thì sau này không xoá được file
trong bucket, và cũng không biết ảnh nào đang mồ côi.

`DELETE /api/upload` nhận `{ path }` hoặc `{ url }`; `EDITOR` chỉ xoá được ảnh mình đã tải,
`ADMIN` xoá được mọi ảnh.

---

## 7. Ghi chú vận hành

**Kết nối Supabase.** `DATABASE_URL` phải trỏ vào Supavisor (cổng 6543) kèm `?pgbouncer=true`.
`DIRECT_URL` (cổng 5432) chỉ dùng cho `prisma migrate` — pooler ở chế độ transaction không
chạy được DDL và prepared statement mà Prisma Migrate cần.

Hai chỗ dễ vấp, cả hai đều đã gặp thật khi dựng dự án này:

- **Mật khẩu phải percent-encode.** Dấu `@` trong mật khẩu sẽ cắt connection string sai chỗ:
  `!Abc@123` → `!Abc%40123`.
- **`connection_limit=1` làm hỏng `next build`.** Build prerender nhiều trang song song, để 1
  sẽ dính `P2024 Timed out fetching a new connection from the connection pool`. Dùng
  `connection_limit=10&pool_timeout=20` cho dev và build; chỉ hạ về 1 khi chạy serverless,
  vì ở đó mỗi instance là một tiến trình riêng.

**Meilisearch.** Bài viết được đồng bộ tự động sau mỗi lần tạo/sửa (`syncArticle`). Bài chưa
`PUBLISHED` sẽ bị gỡ khỏi index. Nếu index lệch, chạy `npm run search:reindex` hoặc bấm
"Đồng bộ Meilisearch" trong dashboard.

### Điều chỉnh độ liên quan của tìm kiếm

Bốn quyết định dưới đây đến từ đo đạc trên chính dữ liệu dự án, không phải phỏng đoán. Muốn đổi
thì chạy lại bộ ca kiểm thử RAG trước.

**Không dùng `stopWords`.** stopWords loại từ khỏi *index*, nên truy vấn chứa chúng khớp rỗng:
bật stopWords thì `"What is CRISPR?"` trả **rỗng** trong khi `"CRISPR"` trả đúng bài. Thay vào
đó lọc từ đệm ở *phía truy vấn* bằng `cleanQuery()`.

**Lọc từ đệm phía truy vấn là bắt buộc**, không phải tối ưu thêm. `matchingStrategy: "frequency"`
giữ lại những từ *hiếm* nhất; một từ không tồn tại trong kho (`"tell"`, `"me"`) là hiếm nhất
tuyệt đối nên được giữ và ép kết quả về rỗng. `"Tell me about the gut microbiome"` trả rỗng cho
tới khi có `cleanQuery()`.

**Hai matchingStrategy, không phải một.** Không chiến lược nào thắng mọi kiểu truy vấn:

| Truy vấn | `frequency` | `last` |
|---|---|---|
| `How does deep sleep affect memory?` | đúng | sai |
| `Vi sao Sao Hoa co mau do? Tra loi ngan.` | sai | đúng |

Cái sai vẫn trả kết quả khác rỗng nên không thể dùng "rỗng thì thử cái kia". Do đó
`searchArticles` (trang /search, cần phân trang + facet) chạy `frequency` rồi hạ xuống `last`
nếu rỗng; còn `searchSlugsForContext` (RAG, cần độ phủ) chạy **song song cả hai** rồi gộp theo
hạng tốt nhất.

**Không đưa `views:desc` vào `rankingRules`.** Để đó thì bài nhiều lượt xem nhưng ít liên quan
vẫn vượt lên trên bài khớp chính xác. Muốn xếp theo độ phổ biến thì dùng `sort=popular`.

**Thân bài không có trong kết quả search.** `body`/`bodyEn` nằm trong `searchableAttributes`
nhưng không nằm trong `displayedAttributes`, nên `hit.body` luôn `undefined`. RAG lấy nội dung
từ Postgres — Meilisearch chỉ dùng để xếp hạng.

**Rate limit.** `src/lib/rate-limit.ts` lưu bộ đếm trong bộ nhớ tiến trình — đủ cho một
instance. Khi chạy nhiều instance (Vercel, Kubernetes), thay bằng Redis/Upstash.

**Cache.** Truy vấn đọc dùng `unstable_cache` với tag `articles` / `categories` / `tags`;
Server Actions gọi `revalidateTag` sau khi ghi.

**Lượt xem** được tăng trong `after()` nên không làm chậm thời gian phản hồi trang. `after()`
cũng chạy khi prerender, nên `incrementViews` tự bỏ qua khi `NEXT_PHASE` là
`phase-production-build` — nếu không, mỗi lần deploy lại cộng khống một lượt cho từng bài
được dựng sẵn.

**Ảnh ngoài** phải khai báo hostname trong `next.config.ts` → `images.remotePatterns`, và
danh sách đó phải khớp với `isAllowedImageUrl` trong `src/lib/utils.ts` — chỗ này chặn ngay
lúc lưu để biên tập viên không dán được URL mà `next/image` sẽ từ chối lúc chạy.

### Hạn chế đã biết: soft-404

Slug không tồn tại (`/vi/articles/khong-co`) hiển thị đúng trang 404 nhưng trả **HTTP 200**.
Đây là hạn chế của Next.js 15.5.4 khi `notFound()` được gọi trong route có tham số động.
Đã loại trừ từng khả năng bằng thực nghiệm: không phải do ISR (`revalidate`), không phải do
`not-found.tsx` tuỳ biến, không phải do middleware của next-intl, và `force-dynamic` cũng
không sửa được.

Biện pháp đang dùng: `generateMetadata` trả `robots: { index: false, follow: false }` khi
không tìm thấy bản ghi, ở cả ba trang `articles/[slug]`, `categories/[slug]`, `tags/[slug]`.
Google sẽ không đưa các URL đó vào chỉ mục dù status là 200. Khi Next sửa lỗi này, có thể
gỡ đoạn đó đi.

---

## 8. Triển khai

```bash
npm run build     # đã bao gồm prisma generate
npm run start
```

Checklist trước khi lên production:

- [ ] `AUTH_SECRET` mới, không dùng lại giá trị dev
- [ ] `NEXT_PUBLIC_SITE_URL` trỏ đúng domain thật (ảnh hưởng canonical, sitemap, OG)
- [ ] `DATABASE_URL` dùng pooler 6543 + `pgbouncer=true`; serverless thêm `connection_limit=1`
- [ ] `DIRECT_URL` chỉ đặt ở nơi chạy migration, không cần trong runtime của app
- [ ] `SUPABASE_SERVICE_ROLE_KEY` là biến server (không có tiền tố `NEXT_PUBLIC_`)
- [ ] Đã chạy `supabase/storage-setup.sql`; kiểm tra bucket không có policy ghi cho `anon`
- [ ] Bật Point-in-Time Recovery hoặc lịch backup cho project Supabase
- [ ] `MEILI_MASTER_KEY` mạnh; client chỉ dùng khoá search-only nếu gọi trực tiếp
- [ ] Đổi mật khẩu tài khoản seed
- [ ] `npm run db:deploy` thay vì `db:push`
- [ ] Đặt `GEMINI_API_KEY` nếu bật trợ lý AI

---

## 9. Lệnh thường dùng

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy dev server |
| `npm run typecheck` | Kiểm tra TypeScript |
| `npm run lint` | ESLint |
| `npm run db:studio` | Mở Prisma Studio |
| `npm run db:seed` | Nạp lại dữ liệu mẫu |
| `npm run storage:setup` | Tạo/cập nhật bucket ảnh trên Supabase Storage |
| `npm run search:reindex` | Nạp lại Meilisearch |
| `npm run import:notion` | Nhập từ Notion |

---

## Giấy phép

Mã nguồn: MIT. Nội dung bài viết: CC BY-SA 4.0.
