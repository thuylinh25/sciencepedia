# Hệ thiết kế

Token, quy tắc và những đánh đổi đã chốt. Giá trị cụ thể đọc trong
`sciencepedia/src/app/globals.css`; file này giữ **lý do**, để lần sau không ai
"sửa lại cho đẹp" đúng chỗ vừa được cân nhắc.

Cập nhật: 2026-09-03

---

## Nguyên tắc token: tách vai trò nền khỏi vai trò chữ

Một màu ngữ nghĩa cần **hai** token khi nó vừa làm nền vừa làm chữ. Cùng một giá
trị không thể đạt contrast ở cả hai vai trò.

Ví dụ đã xảy ra: `--destructive` dùng làm màu chữ chỉ đạt ~3.9:1 trên nền sáng.
Nên có thêm `--destructive-strong` — đỏ đậm hơn, chỉ dùng cho **chữ trên nền sáng**.
`--destructive` giữ vai trò nền.

**Áp dụng quy tắc này cho mọi màu ngữ nghĩa mới.** Nếu bạn định viết
`text-<màu>` mà màu đó cũng đang được dùng làm `bg-<màu>`, dừng lại và tạo token
`-strong`.

## Token đang có

| Nhóm | Token | Dùng cho |
|---|---|---|
| Ngữ nghĩa | `--success`, `--warning`, `--destructive`, `--destructive-strong` | Trạng thái. Có token rồi thì **không** gọi `emerald-600`/`amber-700` thô của Tailwind — palette thô nằm ngoài tầm kiểm soát dark mode và contrast. |
| Nhịp dọc | `--space-section` (5rem), `--space-page` (3.5rem) | Utility `.section-gap`, `.page-pad`. Trước đó mỗi trang tự chọn `mt-24`/`mt-28`/`py-14`/`py-16`, không trang nào giống trang nào. |
| Bề ngang chữ | `--measure-prose` (42rem) | `.article-prose`. Trước là `max-w-none` cho ra ~85 ký tự/dòng, vượt ngưỡng đọc lâu. Quy tắc này phải đứng **sau** `max-width:65ch` của plugin typography để thắng. |

---

## Focus ring

Có quy tắc `:focus-visible` cơ sở trong `globals.css` đặt cả **kiểu và độ dày**
(`outline: 2px solid var(--ring); outline-offset: 2px`), loại trừ các `data-slot`
đã tự vẽ ring (button/input/textarea/select-trigger) để không vẽ chồng hai lớp.

Vì sao cần: trước đó chỉ có `* { @apply outline-ring/50 }` — chỉ đặt **màu**, nên
focus phụ thuộc viền mặc định trình duyệt và **biến mất hoàn toàn** ở mọi chỗ có
`outline-none`.

**Cảnh báo:** utility `outline-none` nằm ở layer `utilities` nên thắng quy tắc base.
Component nào dùng `outline-none` phải tự thêm ring — sửa tại chỗ, không trông chờ
quy tắc cơ sở. Đã xảy ra ở `sheet.tsx` và hai `DropdownMenuTrigger` trong
`site-header.tsx`.

---

## Đánh đổi đã chốt

**Badge lĩnh vực bỏ mã màu theo category.** Trước đây badge dùng
`style={{ backgroundColor: category.color, color: "#fff" }}`. `color` do biên tập
viên nhập vào CSDL — không có gì bảo đảm cặp (màu đó, chữ trắng) đạt 4.5:1. Vàng
nhạt là giá trị hợp lệ ở ô chọn màu và không đọc nổi.

Nay: nền tối cố định (`bg-space-900/75 text-star`) + **chấm màu** lĩnh vực. Chấp
nhận mất mã màu theo lĩnh vực để đổi lấy contrast bảo đảm ở mọi giá trị trong CSDL.

Cùng lý do, breadcrumb dùng chấm màu thay vì lấy màu CSDL làm màu chữ.

Nếu muốn lấy lại mã màu theo lĩnh vực: phải kiểm contrast **ngay tại ô chọn màu
trong admin**, không phải ở chỗ hiển thị.

**Vùng chạm 40px trên header.** Chuẩn nội bộ là 44px (AAA) và pagination đã theo
chuẩn đó. Riêng nút icon trên header giữ 40px vì ngân sách bề ngang header đã căn
rất sát ở 390px — xem comment trong `site-header.tsx`. 40px vẫn vượt xa ngưỡng AA
(2.5.8 yêu cầu 24px). Đây là ngoại lệ có chủ ý, không phải sót.

---

## Quy tắc component

**Mục lục.** Bản desktop và bản di động dùng chung `HeadingList` + hook
`useActiveHeading`. Bản di động dựng bằng `<details>` — nằm sẵn trong HTML đầu
tiên, mở/đóng không cần JS. Trước đó TOC là `hidden lg:block`, nghĩa là bài dài ở
390px chỉ còn nước cuộn.

**Id heading.** Sinh bằng `nodeToText()` đệ quy, không phải `String(children)`.
`String()` cho ra `"[object Object]"` khi heading chứa định dạng nội tuyến
(**đậm**, `code`, link) — id rác, mọi link TOC trỏ vào hư không. `extractHeadings`
trong `lib/utils.ts` cũng gỡ cú pháp link để id hai bên khớp nhau.

**`EmptyState`.** Hai quy tắc gói trong component: trạng thái rỗng phải nói **đang
thiếu gì** (không nói chung chung), và **không bao giờ là ngõ cụt** — `children`
luôn là lối đi tiếp. Đừng viết khối rỗng tự chế; nếu lý do rỗng khác nhau thì
truyền prop `empty`, đừng mượn câu của nơi khác.

**Breadcrumb.** `<nav aria-label>` + `<ol>` + `aria-current="page"`. Phải khớp cấu
trúc `BreadcrumbList` trong JSON-LD.

**Bảng trong thân bài.** Vùng cuộn ngang phải có `tabIndex={0}`, nếu không người
dùng bàn phím không xem được phần ngoài khung (WCAG 2.1.1).

---

## Chưa làm — cần quyết

**`prefers-reduced-motion` cho ba cảnh WebGL.** `galaxy-scene`, `universe-scene`,
`solar/scene`, `globe-scene` chạy `useFrame` tự xoay và không đọc thiết lập này.
Quy tắc CSS toàn cục chỉ tắt animation CSS, **không** chạm được vòng lặp rAF của
WebGL. Cần luồn `useReducedMotion()` vào từng `useFrame`.

**Bố cục hero trang bài viết.** `-mt-40` kéo khối tiêu đề đè lên ảnh bìa `52vh`.
Gradient che được phần dưới, nhưng contrast ở phần trên vùng chồng không bảo đảm
được về mặt toán học. Sửa đúng nghĩa là thiết kế lại hero.

**Ảnh bìa không có chỗ ghi nguồn/giấy phép.** `Article.coverImage` là `String?`
trần. Đây là lỗ hổng mô hình dữ liệu, không sửa được bằng UI.

**Ảnh trong Markdown vẫn dùng `<img>`** thay `next/image` vì không biết trước kích
thước (có `eslint-disable` giải thích). Muốn theo đúng chuẩn thì phải lưu
width/height khi nhập ảnh.
