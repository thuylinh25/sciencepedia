# SciencePedia — Claude Code Guide

Bách khoa toàn thư khoa học. Code ở `sciencepedia/`, hệ agent/skill ở `.claude/`.

## Stack
Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind · shadcn/ui · **Prisma + Supabase Postgres** · Meilisearch (fallback: Postgres FTS) · next-auth v5 · next-intl (vi/en) · Vercel

> Lưu ý: DB truy cập qua **Prisma**, không qua Supabase client. Supabase chỉ dùng cho **Storage**. Đừng viết code truy vấn bảng bằng `@supabase/supabase-js`.

## Lệnh
```bash
npm run dev          # dev server
npm run typecheck    # tsc --noEmit  (phải xanh trước khi commit)
npm run lint
npm run build        # prisma generate && next build
npm run db:migrate   # tạo migration (cần DIRECT_URL)
npm run db:deploy    # apply migration trên prod
npm run db:seed
npm run search:reindex
```

## Hệ agent & skill

8 agent (`.claude/agents/`) — quyết định. 9 skill (`.claude/skills/`) — thực thi.

| Agent | Sở hữu | Skills |
|---|---|---|
| `project-orchestrator` | Định tuyến, thứ tự, gate | cả 9 |
| `knowledge-architect` | Entity, quan hệ, taxonomy, learning graph | `knowledge-graph-manager`, `category-manager`, `content-research` |
| `product-designer` | Sitemap, UX, navigation, search, learning path | `category-manager`, `knowledge-graph-manager`, `content-research` |
| `science-editor` | Độ chính xác khoa học — **quyền phủ quyết tuyệt đối** | `content-research`, `fact-check`, `article-generator` |
| `seo-expert` | SEO kỹ thuật, schema, cluster, internal link | `seo-optimizer`, `knowledge-graph-manager`, `category-manager` |
| `frontend-engineer` | Next.js, UI, hiệu năng, test | `image-finder`, `category-manager`, `knowledge-graph-manager` |
| `backend-architect` | Prisma/Supabase, search, RLS, schema, ops | `supabase-manager`, `knowledge-graph-manager` |
| `content-curator` | Chất lượng thư viện + chạy pipeline | `knowledge-graph-manager`, `content-research`, `fact-check` |

## Content pipeline — 11 bước bắt buộc

Không bỏ bước, không đảo thứ tự.

```
Topic Request
  1. content-research         thu thập + xếp hạng nguồn uy tín
  2. fact-check               thẩm định nguồn TRƯỚC khi viết
  3. article-generator        soạn bài từ nguồn đã thẩm định
  4. science-editor           duyệt / sửa / từ chối        [VETO]
  5. knowledge-graph-manager  entity + quan hệ có kiểu
  6. seo-optimizer            metadata, JSON-LD, internal link
  7. category-manager         xếp taxonomy (1 primary category)
  8. image-finder             ảnh + kiểm tra bản quyền
  9. translation              bản vi/en + thuật ngữ nhất quán
 10. supabase-manager         ghi revision, đổi state
 11. content-curator          kiểm tra cuối → Publish
```

**Vì sao thứ tự này:** research trước khi viết (viết theo trí nhớ sinh ra văn tự tin nhưng sai) · fact-check trước generate (sửa nguồn rẻ hơn viết lại bài) · editor trước graph/SEO/ảnh (đừng đầu tư vào bài sắp bị loại) · graph trước SEO/category (link và vị trí suy ra từ graph) · lưu trữ cuối cùng.

**Vòng sửa:** editor trả bài → về bước 3 (viết lại) hoặc bước 1 (nguồn kém). **Tối đa 2 vòng**, sau đó editor quyết publish-hoặc-bỏ. Một lỗi lặp 3 lần trong batch → dừng batch, sửa prompt.

## 3 gate cho mọi thay đổi
| Gate | Chủ | Kiểm |
|---|---|---|
| **Accuracy** | `science-editor` | Claim có nguồn, citation resolve, giữ nguyên mức độ dè dặt, có reviewer |
| **Technical** | `frontend-engineer` + `backend-architect` | typecheck, test, axe sạch, budget, không lộ secret |
| **SEO** | `seo-expert` | title/description duy nhất, canonical, JSON-LD hợp lệ, ≥3 internal link, server-rendered |

Gate accuracy **không có ngoại lệ**.

## Thứ tự ưu tiên khi xung đột
`science-editor` (chính xác) → `backend-architect` (bảo mật/dữ liệu) → `seo-expert` (index) → `frontend-engineer` (hiệu năng, a11y) → `knowledge-architect` (mô hình) → `product-designer` (thẩm mỹ)

## Quy tắc code
- **Static/ISR mặc định.** Route nội dung không dùng SSR. `export const revalidate` ở page.
- **Server Component mặc định.** `'use client'` đặt ở lá, kèm comment lý do.
- **Không fetch nội dung phía client.** Thân bài, citation, metadata phải có trong HTML đầu tiên.
- **Secret:** `SUPABASE_SERVICE_ROLE_KEY` chỉ trong module có `import "server-only"`.
- **HTML từ search phải qua `highlightToSafeHtml()`** — không đưa thẳng vào `dangerouslySetInnerHTML`.
- **Strict TS, không `any` ở biên.** Dữ liệu ngoài parse bằng Zod.
- **Ảnh:** luôn có kích thước; dùng `next/image`; remote host phải khai báo trong `next.config.ts`.
- **Song ngữ:** dùng `pick()` / `pickName()` từ `@/lib/i18n-content`, không hardcode.

## Tài liệu

| File | Giữ gì |
|---|---|
| `docs/architecture.md` | Quyết định kiến trúc — rendering, truy cập dữ liệu, đếm lượt đọc, knowledge graph, triển khai |
| `docs/design-system.md` | Token, quy tắc component, a11y, các đánh đổi đã chốt |
| `docs/content-rules.md` | Phán quyết biên tập — số liệu, trích dẫn, nhãn, provenance |
| `docs/process/` | agent-index · collaboration-workflow (có pipeline) · development-lifecycle · agent-dependency-graph |

Ba file đầu giữ **lý do**, không giữ mô tả code. Cấu trúc code thì đọc code; tài liệu chỉ ghi những gì đọc code không suy ra được.

## Memory Update Rules

Khi kiến trúc, agent, skill, schema database, workflow hoặc hệ thiết kế **thay đổi đáng kể**:

1. Cập nhật `CLAUDE.md`
2. Cập nhật file `docs/*` liên quan
3. Giữ tài liệu đồng bộ với code

**Thế nào là "đáng kể":** thêm/đổi token hoặc quy tắc component · đổi mô hình dữ liệu hoặc thêm migration · đổi cách render (static/ISR/dynamic) của một route nội dung · thêm hoặc đổi vai trò agent/skill · chốt một phán quyết biên tập mới · phát hiện một đánh đổi mà lần sau dễ bị "sửa lại cho đẹp".

**Ghi lý do, không ghi mô tả.** Một dòng nói *vì sao* đáng giá hơn một trang mô tả *cái gì* — code đã nói "cái gì" rồi, và mô tả thì lạc hậu ngay khi code đổi.

Sửa code mà không cập nhật tài liệu tương ứng là để lại nợ: quyết định mất lý do sẽ bị đảo ngược ở lần chạm tiếp theo.
