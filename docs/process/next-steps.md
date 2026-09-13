# Việc đang dở

Cập nhật 2026-09-13. Mọi con số dưới đây **đo trong lượt cập nhật**, không chép
lại từ bản trước — bản trước sai đúng ở chỗ nó chép.

## Đã đóng từ bản trước

**Tín hiệu tin cậy ở header bài — XONG,** nhưng không theo cách bản cũ đề xuất.
Bản cũ đòi một chỉ báo ngắn neo xuống khối `ReviewStatus` đầy đủ ở cuối bài.
Thực tế khối đầy đủ đã bị gỡ hẳn (commit 10836c1) vì cồng kềnh, và điều đó để
lại một lỗi nặng hơn: `lib/seo.ts` vẫn phát `reviewedBy` + `dateReviewed` trong
JSON-LD trong khi trang không còn hiển thị gì — tức khai báo dữ liệu không nhìn
thấy được, đúng thứ nguyên tắc structured data cấm. Nay là **một dòng trong
`<header>`**, và điều kiện hiển thị khớp đúng điều kiện phát JSON-LD. Đây mới
là bài học đáng giữ: lệch một bên là quay lại đúng lỗi ấy.

**Bảng `Entity` / `Relationship` không còn rỗng.** Bản cũ ghi "đang RỖNG" và
kết luận rằng related concepts vẫn chạy fallback tag/category. Đo lại:

| | |
|---|---|
| Entity | 67 |
| Relationship | 127 |
| Bài PUBLISHED có `entityId` | **48 / 57** |

Nên `getRelatedForArticle` đã chạy bằng graph thật cho phần lớn kho. Chín bài
còn thiếu `entityId` là phần dư, không phải tình trạng chung.

## Còn mở — đã kiểm lại trong lượt này, cả ba vẫn đúng

**1. Breadcrumb hiển thị lệch với JSON-LD.** JSON-LD khai 3 cấp (Sciencepedia →
Danh mục → Bài), UI chỉ hiện "Bài viết / Danh mục". `getArticleBySlug` **đã
select `category.parent`** nhưng trang không render — `grep "category.parent"`
trên `src/app/[locale]/articles/[slug]/page.tsx` không ra dòng nào. Cây lồng
nhau (Vũ trụ › Hệ Mặt Trời › Sao Hoả) vì thế không bao giờ hiện. Google yêu cầu
markup phản ánh nội dung nhìn thấy — cùng một lỗi loại với chuyện `reviewedBy`
vừa đóng ở trên.

**2. `getPrerequisites` vẫn là code chết.** Khai ở `src/server/queries.ts:852`,
không chỗ nào gọi. "Cần đọc trước" hữu ích ở ĐẦU bài, không phải cuối. Nay đã
có 67 entity nên khối này sẽ thật sự trả về kết quả — điều kiện chặn nó ở bản
trước đã hết.

**3. Độ dài dòng.** `src/app/[locale]/articles/[slug]/page.tsx:345` vẫn là
`max-w-3xl`, cho ~78 ký tự mỗi dòng, trên ngưỡng 75.

**Chưa quy được trách nhiệm:** route bài viết 209 kB First Load JS trên budget
120 kB. Cần chạy `@next/bundle-analyzer` trước khi đoán. Nghi `next-auth/react`
(`useSession` trong nút bookmark) và framer-motion vào mọi trang qua
`AssistantLauncher`.

## Nợ nội dung — lớn hơn nợ giao diện

| | |
|---|---|
| Bài PUBLISHED | 57 |
| `factCheck = PENDING` | **41** |
| Có `reviewedById` | **16 / 57** |

Trong 41 bài PENDING, 9 bài không có Source nào (đã rà 2026-09-11, xem
`corrections.md`) và **32 bài còn lại chưa rà nội dung**. Phép đo 2026-09-12:

- **29/32** dưới ngưỡng 3 nguồn bậc 1–2
- **28/32** không có DOI nào
- **20/32** chỉ có đúng một nguồn

`su-song-tren-trai-dat-4-ti-nam` mang 26 con số trên đúng một nguồn.

**Điều này đổi bản chất việc rà.** Nút thắt không phải claim lệch nguồn mà là
bảng nguồn gần như không tồn tại, nên phải tách "thiếu dẫn nhưng đúng" khỏi
"sai" — hai thứ xử khác nhau, và chỉ đọc nguồn thật mới phân biệt được.

## Hai chuyện hạ tầng cần biết trước khi chạy lượt sau

**Pool cơ sở dữ liệu chỉ 5 kết nối.** Một lượt `npm run build` prerender 267
trang và tự nó gần cạn pool; chạy đồng thời với agent dùng Prisma thì build
chết với `P2024 — Timed out fetching a new connection`. Đã xảy ra 2026-09-13.
**Đừng chạy build và agent cùng lúc**, và script agent nên đọc CSDL một lượt
rồi làm việc trên tệp.

**`.next` nằm trong thư mục OneDrive.** Một lượt build khác hỏng ở bước cuối với
`ENOENT: rename '.next\export\500.html'`, và trong repo có sẵn các thư mục
`.next-stale-*` — dấu vết OneDrive giành tệp giữa chừng. Nên loại `.next` khỏi
phạm vi đồng bộ.

**Mã thoát của một đường ống không phải mã thoát của build.** `npm run build |
tail` trả về mã của `tail`, luôn là 0. Lượt 2026-09-13 đã báo nhầm "build xanh"
đúng vì thế. Ghi mã thoát thật bằng `npm run build > log 2>&1; echo $?`.
