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
npm run sky:seed     # đồng bộ danh mục thiên thể sang bảng SkyObject (chạy khô, cần --write)
npm run glossary:check  # [[thuật ngữ]] nào trong bài đã xuất bản chưa có mục từ (chỉ đọc)
npm run links:fix     # link nội bộ trỏ slug đã chết — chạy khô, cần --write
npm run slugs:redirect # ghi 301 cho slug cũ, để link từ ngoài site thôi 404 (cần --write)

npm run publish:check # rà điều kiện xuất bản toàn kho (chỉ đọc)
npm run publish       # đổi state sang PUBLISHED — đường ghi DUY NHẤT, có gate
npm run pipeline      # chạy liên tục tới khi hết hạn mức (cần CLAUDE_CODE_OAUTH_TOKEN)
npm run pipeline -- --count 1   # chỉ làm 1 bài rồi dừng
```

> Xuất bản tự động: gate nằm trong `scripts/publish.ts`, không nằm trong prompt.
> Lý do và ba lớp phòng vệ ở `docs/architecture.md`, mục "Xuất bản tự động".

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
- **Ảnh tĩnh giao diện nằm trên Cloudflare R2**, không trong `public/`. Dựng URL bằng `assetUrl()` (`@/lib/asset`), đừng viết cứng.
- **Ảnh R2 render bằng `<AssetImage>`, KHÔNG bằng `next/image`.** Hạn mức Image Optimization của Vercel đã cạn (HTTP 402), nên các cỡ được dựng sẵn và tải thẳng từ R2. Thêm ảnh: tải lên R2 → `npm run images:variants -- --write` → `npm run assets:upload -- --write` → rồi mới commit `image-variants.json` (bản kê trỏ vào tên tệp có hash, đệm một năm — đẩy bản kê trước tệp là ảnh vỡ). Lý do đầy đủ: `docs/architecture.md`, mục "Ảnh tĩnh KHÔNG đi qua `/_next/image`".
- **Dán URL ảnh ngoài vào form quản trị thì tự về R2** kèm ghi công Commons, ngay trong lượt lưu (`src/lib/cover-intake.ts`). Hỏng thì vẫn lưu, bìa còn trỏ ra ngoài. `npm run covers:mirror -- --write` là lưới hứng cho những lượt hụt và cho ảnh do pipeline sinh ra — chạy `npm run images:credit -- --write` TRƯỚC nó, vì sao ảnh xong là mất dấu vết Commons.
- **Ảnh tải lên qua trang quản trị đi thẳng R2** (`/api/upload`), tự chuyển WebP và dựng sẵn các cỡ — không cần chạy script nào sau đó. Supabase Storage không còn nhận ảnh mới.
- **Song ngữ:** dùng `pick()` / `pickName()` từ `@/lib/i18n-content`, không hardcode.
- **Thuật ngữ `[[...]]`:** định nghĩa ngắn tra trên server lúc render, không fetch khi rê chuột. Giải thích do AI sinh **không bao giờ ghi vào CSDL** và luôn mang nhãn "do AI" — lý do: `docs/architecture.md`, mục "Thuật ngữ".

## Tài liệu

| File | Giữ gì |
|---|---|
| `docs/architecture.md` | Quyết định kiến trúc — rendering, truy cập dữ liệu, đếm lượt đọc, knowledge graph, triển khai |
| `docs/design-system.md` | Token, quy tắc component, a11y, các đánh đổi đã chốt |
| `docs/content-rules.md` | Phán quyết biên tập — độ dài bài, số liệu, trích dẫn, nhãn, provenance |
| `docs/process/diagnosis.md` | Quy tắc chẩn đoán — rút từ những lần sửa nhầm chỗ |
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

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**This project has a knowledge graph. Start with the code-review-graph
MCP tools to narrow scope, then read the source.** The graph is cheaper than scanning files and
gives you structural context (callers, dependents, test coverage) that file search cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

### Verify in the source

- Narrow scope with the graph, then read the source. Do not change code from graph output alone.
- For any non-trivial change, read the implementation and the relevant tests before concluding.
- Verify the exact source when touching behavior, database logic, migrations, retries, fallbacks,
  recovery, or compatibility code.
- When the graph and the source disagree, the source wins. The graph may be stale or may not
  model that relationship.
- An empty graph result can mean "not indexed" or "not statically visible", not "does not exist".

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes_tool` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context_tool` | Need source snippets for review — token-efficient |
| `get_impact_radius_tool` | Understanding blast radius of a change |
| `get_affected_flows_tool` | Finding which execution paths are impacted |
| `query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool` | Finding functions/classes by name or keyword |
| `get_architecture_overview_tool` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.
<!-- /code-review-graph MCP tools -->
