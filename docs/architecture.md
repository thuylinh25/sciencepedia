# Kiến trúc

Ghi lại **vì sao** hệ thống được dựng như hiện tại. Cấu trúc code thì đọc code;
file này chỉ giữ những quyết định mà đọc code không suy ra được.

Cập nhật: 2026-09-02

---

## Truy cập dữ liệu

**Prisma, không phải Supabase client.** Supabase chỉ dùng cho Storage. Không viết
truy vấn bảng bằng `@supabase/supabase-js`.

`DATABASE_URL` trỏ Transaction pooler (6543), `DIRECT_URL` trỏ Direct connection
(5432). `prisma migrate deploy` cần `DIRECT_URL` — pooler không chạy migration được.

`SUPABASE_SERVICE_ROLE_KEY` chỉ được import trong module có `import "server-only"`.

---

## Rendering

**Static/ISR mặc định. Route nội dung không dùng SSR.** Thân bài, citation,
metadata phải có trong HTML đầu tiên — không fetch nội dung phía client.

**Server Component mặc định.** `'use client'` đặt ở lá, kèm comment lý do.

### Build không cần database

Mọi `generateStaticParams` đều bọc `try/catch` trả `[]` khi truy vấn hỏng:

```ts
// src/app/[locale]/articles/[slug]/page.tsx
try {
  const slugs = await getPublishedSlugs();
  return slugs.slice(0, 50).map(({ slug }) => ({ slug }));
} catch (error) {
  console.warn("[build] bỏ qua prerender bài viết:", (error as Error).message);
  return [];
}
```

Hệ quả: `next build` chạy được với `DATABASE_URL` giả, chỉ prerender ít trang hơn.
Đã kiểm chứng 2026-09-02. Đừng "sửa" các khối try/catch này thành throw — chúng
là chủ ý, không phải nuốt lỗi cẩu thả.

---

## Đếm lượt đọc — vì sao đếm từ trình duyệt

Trang bài viết đặt `revalidate = 300` và được prerender sẵn, nên phần lớn lượt
truy cập được phục vụ thẳng từ cache. Server component không chạy lại, `after()`
cũng không chạy theo. Đếm trong server component cho ra **số lần trang được dựng
lại**, không phải lượt đọc — đo thực tế: sáu lượt truy cập liên tiếp, con số đứng
nguyên.

Luồng hiện tại:

```
view-counter.tsx (client, lá)
  → POST /api/articles/[id]/view
  → incrementViews()
```

Hai lớp chặn lạm dụng: chốt `sessionStorage` phía trình duyệt (F5 không cộng thêm)
và rate limit theo IP trong route. Bộ đếm rate limit nằm trong RAM, không phải
Postgres — thiệt hại tối đa nếu bị lạm dụng chỉ là con số hiển thị bị thổi, không
đáng một lệnh ghi DB mỗi request.

**Trạng thái dữ liệu 2026-09-02:** `views` = 0 trên toàn bộ bài. Không phải cơ chế
hỏng — project Vercel mới tạo ~24 giờ trước, chưa có lưu lượng. Đừng kết luận
"hệ thống không đo" khi thấy cột này rỗng.

---

## Knowledge graph

Schema đã có và **đã apply lên prod**: `Entity`, `Relationship`, enum `EntityType` /
`RelationType` (gồm `PREREQUISITE_OF`) / `FactCheckState`. `Article.entityId` nullable.

Query đã viết sẵn trong `src/server/queries.ts`: `getPrerequisites()`,
`getRelatedByGraph()`.

**Nhưng graph đang rỗng.** Đo 2026-09-02 bằng `npm run graph:check`:

```
Entity: 0 · Relationship: 0 · Article: 35 · Article có entity: 0/35
```

Không có seed, không có script nào ghi vào `Entity`. Hệ quả: mọi tính năng dựa vào
graph (learning path, related-by-graph, prerequisite) hiện không có dữ liệu để chạy.
Việc phải làm trước là để `knowledge-architect` gắn 35 bài vào graph — dựng UI trước
sẽ ra trang rỗng.

Kiểm lại bất cứ lúc nào: `npm run graph:check` (chỉ đọc, không có lệnh ghi).

---

## Triển khai

Vercel, project `sciencepedia`, region `icn1` (Seoul — gần Supabase `ap-northeast-2`;
đổi region Supabase thì sửa `vercel.json`).

Build command trong `vercel.json`:

```
prisma migrate deploy && prisma generate && next build
```

**Migration tự chạy mỗi lần deploy.** Không phải chạy tay, và cũng có nghĩa là một
deploy sẽ đẩy schema prod đi theo code — cân nhắc điều đó khi deploy một nhánh có
migration đi trước `main`.

Production deploy từ `main`. Xem `docs/process/` cho quy trình phát hành.

---

## Tìm kiếm

Meilisearch, fallback Postgres FTS. HTML highlight từ search **phải** đi qua
`highlightToSafeHtml()` — không đưa thẳng vào `dangerouslySetInnerHTML`.

---

## Song ngữ

next-intl, hai locale `vi`/`en`. Mọi chuỗi mới phải có mặt ở **cả** `messages/vi.json`
và `messages/en.json`. Nội dung song ngữ trong DB dùng `pick()` / `pickName()` từ
`@/lib/i18n-content`, không hardcode.

Cấm fallback hiển thị tiếng Việt trong trang tiếng Anh, cấm dịch máy tại runtime.

## Xuất bản tự động — gate ở đâu và vì sao ở đó

Thêm 2026-09-05.

Pipeline 11 bước chạy được không cần người ngồi cạnh, qua `npm run pipeline`
(`scripts/pipeline.ts`, dùng `@anthropic-ai/claude-agent-sdk`). Ba quyết định
đáng ghi lại, vì lần sau đều dễ bị "sửa cho gọn".

**Không viết lại hệ agent bằng TypeScript.** Agent SDK chính là Claude Code
đóng gói thành thư viện, nên nó nạp thẳng `.claude/agents/` và `.claude/skills/`.
Viết một bản triển khai thứ hai cho máy chủ là tạo ra hai bản sẽ trôi khỏi nhau,
và lần lệch đầu tiên phát hiện được sẽ là qua một bài sai đã lên production.

**Chạy trên GitHub Actions, không phải Vercel.** Hai lý do độc lập, mỗi lý do
đủ để một mình quyết định: hàm Vercel cắt ở 60 giây trong khi một bài mất hàng
chục phút; và `CLAUDE_CODE_OAUTH_TOKEN` (gói đăng ký, không cần API key) chỉ
được Claude Code / Agent SDK đọc — `@anthropic-ai/sdk` không đọc nó, nên đường
cũ qua `src/lib/rewrite.ts` vẫn cần API key riêng.

**Gate nằm trong đường ghi, không nằm trong prompt.** Dặn agent "nhớ kiểm tra
trước khi publish" là lời khuyên; nó hỏng đúng vào ngày không ai ngồi xem. Thay
vào đó:

| Lớp | Ở đâu | Chặn được gì |
|---|---|---|
| Khoá | `scripts/publish.ts` | Không qua `check-publish` thì không đổi state, kể cả người gọi là con người |
| Hàng rào | hook `PreToolUse` trong `pipeline.ts` | Lệnh đổi lược đồ, ghi CSDL bằng lệnh một dòng, `git push` |
| Hạ tầng | không đặt `DIRECT_URL` trong CI | `prisma migrate` không chạy được dù hai lớp trên thủng |

Hàng rào **không kín** — agent viết được một file rồi chạy file đó. Nó tồn tại
để chặn lối đi thẳng và nâng chi phí đường vòng; thứ thật sự giữ là lớp khoá.

`scripts/check-publish.ts` là chỗ duy nhất định nghĩa điều kiện xuất bản, và nó
**chỉ đọc** — một cái gate tự sửa dữ liệu để làm chính mình xanh là gate vô
dụng. Hai mức CHẶN / CẢNH tách nhau vì gộp lại thì hoặc quá chặt (chặn bài hợp
lệ, rồi người ta học cách bỏ qua nó) hoặc quá lỏng.

**`settingSources: ["project"]`, cố ý bỏ "local" và "user".**
`.claude/settings.local.json` nằm trong `.gitignore` nên **không có trong
checkout của CI** — mọi lệnh cấm phải khai lại trong hook, không được trông vào
file đó. Cấu hình chạy được trên máy dev mà biến mất trên máy chủ là dạng cấu
hình tệ nhất.

**Người viết và người duyệt khác model.** `pipeline.ts` ghi đè
`science-editor` sang Opus. Cùng một model chấm bài của chính nó thì cái nó bỏ
sót lúc viết nó cũng bỏ sót lúc chấm — sai sót tương quan, và "đã duyệt" thành
một con dấu rỗng. Đây là gate yếu hơn người duyệt thật; đừng đọc nó như tương
đương.
