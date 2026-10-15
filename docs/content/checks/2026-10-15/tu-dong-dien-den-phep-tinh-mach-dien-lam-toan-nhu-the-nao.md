# Phiếu thẩm định — Từ Dòng Điện Đến Phép Tính: Mạch Điện Làm Toán Như Thế Nào?

- **slug:** `tu-dong-dien-den-phep-tinh-mach-dien-lam-toan-nhu-the-nao`
- **Ngày thẩm định:** 2026-10-15
- **Trạng thái lúc thẩm định:** PUBLISHED · factCheck = PENDING · reviewedById rỗng · 0 nguồn · 0 link nội bộ · 0 link vào · chưa gắn entity
- **Danh mục:** `co-hoc` (Cơ học) — con của Vật lý, KHÔNG thuộc nhóm Sức khoẻ → không khung lưu ý y tế
- **Bản EN:** không có (`contentEn` rỗng) → không có mục D cho EN

## Phán quyết: **SỬA** (giữ PUBLISHED)

Nội dung chính xác ở mức phổ thông: digital = hai trạng thái điện áp, transistor = công tắc, cổng logic
(AND/OR/NOT/XOR) → bộ cộng (Adder) → ALU, máy tính tương tự dùng Ohm/Kirchhoff/Op-Amp, memristor +
chip thần kinh mô phỏng. Không có lỗi nâng mức chắc chắn hay mô hình sai. Vì vậy **không GỠ**.

Nhưng bài trượt toàn bộ gate xuất bản: **0 nguồn** (đây là mục chặn của skill), không SEO, 0 link nội bộ,
0 link vào, chưa gắn entity, chưa có người duyệt. **Không GIỮ nguyên** — phải gắn ≥3 nguồn bậc 1–2,
thêm link nội bộ + "Đọc thêm" + SEO. Những mục cần người (entity, byline, link vào, factCheck PASSED)
ghi ở E; bài đang đăng nên cứ giữ PUBLISHED trong lúc bổ khuyết (chủ sản phẩm chốt 2026-10-09).

Một điểm nội dung nhẹ: Op-Amp **một mình** (chỉ R + C) làm được cộng, trừ, tích phân, vi phân và nhân
với **hằng số**; nhân hai tín hiệu cần mạch nhân chuyên dụng. Câu hiện tại gộp "Nhân" vào như thể chỉ cần
R + C là hơi quá — sửa nhẹ ở B (không phải lỗi chặn).

---

## A. Chặn

| # | Vị trí | Loại | Vấn đề | Câu thay thế |
|---|--------|------|--------|--------------|
| A1 | Toàn bài | Thiếu nguồn | 0 nguồn — mục chặn của gate và của skill (<3 nguồn bậc 1–2). | Gắn 5 nguồn ở mục C (4 bậc 1 + 1 bậc 2). |

Không có lỗi chặn về **nội dung khoa học** (claim đều đúng, mức dè dặt giữ nguyên, sơ đồ hợp lý).

## B. Nên sửa

| # | Vị trí | Loại | Vấn đề | Câu thay thế |
|---|--------|------|--------|--------------|
| B1 | Mục "## Op-Amp..." | Overstatement nhẹ | "Khi kết hợp với điện trở và tụ điện, Op-Amp có thể thực hiện: … Nhân …" — nhân hai tín hiệu không làm được chỉ bằng R + C; cần mạch nhân chuyên dụng. | Đổi câu dẫn thành "Khi kết hợp với điện trở, tụ điện và một số mạch chuyên dụng, các mạch dựa trên Op-Amp có thể thực hiện:" (xem D). |
| B2 | 3 chỗ trong thân | Thiếu link nội bộ | 0/3 link nội bộ resolve. | Thêm 3 link giữa câu: *dòng điện* · *khớp thần kinh* · *năng lượng* (xem D). |
| B3 | Cuối bài | Thiếu "Đọc thêm" | Không có mục Đọc thêm. | Thêm 4 bài PUBLISHED + PASSED (mục reading trong plan). |
| B4 | SEO | Trống | `seoTitle`/`seoDescription`/`seoKeywords` đều null. | Văn bản ở D1–D3. **Engine đính chính không điền được trường rỗng** (`find:""` → lỗi), nên NGƯỜI đặt qua form /admin (xem E). |
| B5 | title + 10 tiêu đề mục | Trình bày | Viết hoa kiểu tiêu đề ("Máy Tính Kỹ Thuật Số"). Quy ước kho: viết hoa kiểu câu (giữ slug). | Đổi về sentence case (xem D). |

## C. Nguồn đề xuất

| # | Bậc | Trích dẫn | DOI/URL | Đã đọc gì | Dùng cho |
|---|-----|-----------|---------|-----------|----------|
| C1 | 1 | Strukov, Snider, Stewart, Williams. "The missing memristor found." *Nature* 453 (2008) 80–83. | 10.1038/nature06932 | Crossref xác minh tiêu đề/tạp chí/năm | memristor vừa lưu trạng thái vừa tính toán |
| C2 | 1 | Mead. "Neuromorphic electronic systems." *Proceedings of the IEEE* (1990). | 10.1109/5.58356 | Crossref xác minh tiêu đề/tạp chí/năm | chip thần kinh mô phỏng (neuromorphic) |
| C3 | 1 | Marković, Mizrahi, Querlioz, Grollier. "Physics for neuromorphic computing." *Nature Reviews Physics* 2 (2020). | 10.1038/s42254-020-0208-2 | Crossref xác minh tiêu đề/tạp chí/năm | neuromorphic giảm tiêu thụ năng lượng |
| C4 | 1 | Moore. "Cramming More Components onto Integrated Circuits." (1965; in lại *Proceedings of the IEEE* 1998). | 10.1109/JPROC.1998.658762 | Crossref xác minh tiêu đề/tác giả/tạp chí | hàng chục tỷ transistor trên một chip (mật độ tích hợp) |
| C5 | 2 | Computer History Museum. "Digital Logic" (exhibit *Revolution*). | https://www.computerhistory.org/revolution/digital-logic/12 | Trang trả 200; xác minh tồn tại | transistor làm công tắc → cổng logic → bộ cộng |

> Britannica (transistor / logic-gate / analog-computer / digital-computer): **trả 403 với curl, không dùng** — ghi theo quy tắc skill.
> DOI đều tra qua `api.crossref.org/works/<doi>`, không lấy từ trí nhớ.

## D. Đoạn thay thế NGUYÊN VĂN

Khối prose/field lấy qua `extractD` (headers `### Dn`). Mười câu đổi viết hoa tiêu đề mục (B5) ngắn,
thuần cơ học → viết thẳng chuỗi `replace` trong tệp plan (như bài não bộ 10-14), không qua D.

thay trường title — `### D0`

### D0

```markdown
Từ dòng điện đến phép tính: mạch điện làm toán như thế nào?
```

thay trường seoTitle — `### D1`

### D1

```markdown
Mạch điện làm toán như thế nào? Từ transistor đến phép tính
```

thay trường seoDescription — `### D2`

### D2

```markdown
Máy tính không "hiểu" toán học. Transistor, cổng logic và mạch cộng biến dòng điện thành phép cộng, trừ, nhân, chia; máy tính tương tự giải toán bằng chính các định luật vật lý.
```

thay trường seoKeywords — `### D3`

### D3

```markdown
mạch điện làm toán, transistor, cổng logic, hệ nhị phân, bộ cộng, máy tính tương tự, op-amp, memristor
```

thay câu "Khi kết hợp với điện trở và tụ điện, Op-Amp có thể thực hiện:" — `### D4`

### D4

```markdown
Khi kết hợp với điện trở, tụ điện và một số mạch chuyên dụng, các mạch dựa trên Op-Amp có thể thực hiện:
```

thay câu "điều khiển dòng điện để biểu diễn và xử lý thông tin" — `### D5`

### D5

```markdown
điều khiển [dòng điện](/articles/tu-electron-den-dong-dien-nguon-goc-cua-dien-nang) để biểu diễn và xử lý thông tin
```

thay câu "các khớp thần kinh trong não vừa lưu trữ vừa xử lý thông tin" — `### D6`

### D6

```markdown
[các khớp thần kinh trong não](/articles/nhung-su-gia-hoa-hoc-dieu-khien-hoat-dong-cua-nao-bo) vừa lưu trữ vừa xử lý thông tin
```

thay câu "giảm đáng kể mức tiêu thụ năng lượng của các hệ thống AI trong tương lai" — `### D7`

### D7

```markdown
giảm đáng kể mức tiêu thụ [năng lượng](/articles/nang-luong-la-gi) của các hệ thống AI trong tương lai
```

**Đổi viết hoa tiêu đề mục (B5), inline trong plan — không qua extractD:**

| find (hiện tại) | replace |
|---|---|
| `## Máy Tính Kỹ Thuật Số: Toán Học Bằng Các Trạng Thái Điện` | `## Máy tính kỹ thuật số: toán học bằng các trạng thái điện` |
| `## Transistor: Công Tắc Của Thế Giới Số` | `## Transistor: công tắc của thế giới số` |
| `## Cổng Logic: Nền Tảng Của Mọi Phép Tính` | `## Cổng logic: nền tảng của mọi phép tính` |
| `## Máy Tính Cộng Số Như Thế Nào?` | `## Máy tính cộng số như thế nào?` |
| `## Máy Tính Tương Tự: Khi Vật Lý Trực Tiếp Giải Toán` | `## Máy tính tương tự: khi vật lý trực tiếp giải toán` |
| `### Định Luật Ohm` | `### Định luật Ohm` |
| `### Định Luật Kirchhoff` | `### Định luật Kirchhoff` |
| `## Op-Amp Và Những Phép Toán Cao Cấp` | `## Op-Amp và những phép toán cao cấp` |
| `## Tương Lai: Mạch Điện Mô Phỏng Não Bộ` | `## Tương lai: mạch điện mô phỏng não bộ` |
| `## Kết Luận` | `## Kết luận` |

**Đọc thêm** (reading, đều PUBLISHED + PASSED):
- Từ electron đến dòng điện: Nguồn gốc của điện năng — `tu-electron-den-dong-dien-nguon-goc-cua-dien-nang`
- Ứng dụng cơ học lượng tử: Từ nền tảng công nghệ hiện tại đến đột phá tương lai — `ung-dung-co-hoc-luong-tu-tu-nen-tang-cong-nghe-hien-tai-den-dot-pha-tuong-lai`
- Cơ học lượng tử: Thế giới kỳ lạ phía sau vật chất — `co-hoc-luong-tu-the-gioi-ky-la-phia-sau-vat-chat`
- Năng lượng là gì — `nang-luong-la-gi`

## E. Việc chưa làm / cần người

- **SEO (cần người, qua form):** đặt `seoTitle`/`seoDescription`/`seoKeywords` theo D1–D3 trong form /admin — engine đính chính không điền được trường đang null.
- **Entity (gate):** bài chưa gắn `entityId`. Cần `knowledge-graph-manager` tạo/gắn entity (vd. "Mạch điện tử" hoặc "Transistor"). Engine đính chính không gắn entity.
- **Người duyệt + factCheck (gate):** `reviewedById` rỗng, factCheck = PENDING. Sau khi đọc bản đã sửa, NGƯỜI chạy `scripts/pass-factcheck-2026-10-15.ts` để ký byline duyệt + đặt PASSED. Agent **không** tự ký, **không** tự đặt PASSED.
- **Link vào (gate):** 0 bài trỏ vào bài này. Đề xuất thêm backlink từ `tu-electron-den-dong-dien-nguon-goc-cua-dien-nang` (neo hợp: "dòng điện làm toán"/"mạch điện"). Làm khi đăng lại qua gate (mẫu `scripts/add-backlinks.ts`); bài đang PUBLISHED nên không chặn hiển thị.
- **Ảnh bìa — bản quyền:** credit "Ảnh: Getty Images". Getty là kho ảnh thương mại, ảnh có **giấy phép trả phí**, không miễn phí. Cần xác nhận giấy phép hợp lệ, hoặc thay bằng ảnh tự do (Wikimedia Commons / Unsplash) rồi cập nhật credit. **Chưa xem ảnh** nên không viết lại `coverImageAlt` (alt hiện có, mô tả vi mạch — hợp lý).
- **Kết quả kiểm máy (1b):** `publish:check` → CHẶN: factCheck PENDING · no reviewer · 0/3 nguồn · 0/3 link nội bộ · 0 link vào · no entity. `glossary:check`: bài không dùng `[[...]]` → không thiếu mục từ. Link VÀO: **không có**.

## F. Ghi chú thẩm định

- "hàng chục tỷ transistor trên một con chip chỉ vài centimet vuông": đúng với chip cao cấp hiện nay (ví dụ dòng Apple M-series tới hơn trăm tỷ transistor). Không nêu con số cụ thể nên rủi ro thấp; để nguyên, chống lưng bằng C4 (Moore).
- "1 + 1 = 10" (nhị phân = 2), "2A + 3A + 5A = 10A" (Kirchhoff): minh hoạ đúng, giữ nguyên.
- Sơ đồ `text` (Dòng điện → Bit → Cổng logic → Phép toán → AI) và khối HTML Ohm/flow: là sơ đồ lớp/trình tự hợp lý, không phải khung nhân quả sai — giữ.
- Op-Amp "Nhân": đã sửa câu dẫn ở B1/D cho chính xác, giữ nguyên danh sách để không phá bố cục.
- Không đổi nội dung mục kết luận ngoài việc chèn 1 link; không có claim nào cần hạ/nâng mức.
