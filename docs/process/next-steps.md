# Việc đang dở — UI/UX trang bài viết

Ghi lúc kết thúc phiên trước khi khởi động lại để nạp agent/skill.
Chủ sở hữu: `product-designer` (thiết kế) + `frontend-engineer` (triển khai).

## Trạng thái code

Đã xong, build xanh (197/197 trang, typecheck + lint sạch):
- Knowledge graph: `Entity`, `Relationship`, `Article.entityId` — migration `20260902090000` **đã apply lên DB thật**
- Truy xuất biên tập: `reviewedById`, `reviewedAt`, `lastVerifiedAt`, `factCheck`; `Source.tier/doi/retractedAt`
- `ScholarlyArticle` JSON-LD + `reviewedBy`, `citation`, `about.sameAs`
- `ReviewStatus`, `SearchDeadEnd`, `global-error.tsx`
- Skip link đã i18n; `PlanetGlobe` chặn phía máy chủ

Chưa commit. Không có gì đang hỏng.

## Ba việc cần làm

### 1. Tín hiệu tin cậy đang ở sai chỗ  — ưu tiên cao nhất
Header bài hiện: tác giả → ngày → thời gian đọc → **lượt xem**.
Người đọc quyết định có tin bài không trong 5 giây đầu, nhưng khối `ReviewStatus`
lại nằm cuối bài sau ~3000 chữ. `views` đang đứng ngang hàng với metadata tin cậy.

→ Thêm chỉ báo ngắn ở header ("Đã thẩm định · <tên>"), neo xuống khối đầy đủ.
→ Tách `views` khỏi cụm đó.
Tham chiếu: `.claude/agents/science-editor.md`, `.claude/agents/product-designer.md`.

### 2. Breadcrumb hiển thị lệch với JSON-LD
JSON-LD khai 3 cấp (Sciencepedia → Danh mục → Bài). UI chỉ hiện "Bài viết / Danh mục".
`getArticleBySlug` **đã select `category.parent`** nhưng trang không render →
cây lồng nhau (Vũ trụ › Hệ Mặt Trời › Sao Hoả) không bao giờ hiện.
Google yêu cầu markup phản ánh nội dung nhìn thấy.

→ Render đủ: Trang chủ › [danh mục cha] › danh mục › bài. Đồng bộ với `breadcrumbJsonLd`.
File: `src/app/[locale]/articles/[slug]/page.tsx` ~dòng 190.

### 3. `getPrerequisites` là code chết
Đã viết trong `src/server/queries.ts` nhưng chưa gắn vào giao diện.
"Cần đọc trước" hữu ích ở ĐẦU bài, không phải cuối.

→ Thêm khối "Cần đọc trước" phía trên nội dung, chỉ hiện khi `article.entityId` có
và truy vấn trả về kết quả.

### Việc nhỏ
- Độ dài dòng ~78ch, quá ngưỡng 75ch → `max-w-3xl` thành `max-w-[68ch]`
- Route bài viết 209 kB First Load JS, budget là 120 kB. Chưa quy được trách nhiệm
  chính xác — cần chạy `@next/bundle-analyzer`. Nghi: `next-auth/react` (`useSession`
  trong nút bookmark) và framer-motion vào mọi trang qua `AssistantLauncher`.

## Dữ liệu cần nạp
Bảng `Entity`/`Relationship` đang RỖNG. Chừng nào chưa có entity thì related vẫn
chạy fallback tag/category, và mục 3 không hiện gì. Cần `knowledge-architect`
dựng entity cho các bài đã có.
