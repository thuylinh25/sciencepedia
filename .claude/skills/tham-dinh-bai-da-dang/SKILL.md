---
name: tham-dinh-bai-da-dang
description: Thẩm định một bài ĐÃ PUBLISHED (thường là bài đăng thẳng qua form /admin, 0 nguồn, factCheck PENDING) — viết phiếu thẩm định A–F có đoạn thay thế nguyên văn, rồi biến phiếu thành script đính chính chạy được. Dùng khi chủ sản phẩm bảo "thẩm định bài X", khi có bài mới lên trang chưa qua gate, hoặc khi người đọc báo lỗi một bài đang đăng.
---

# Thẩm định bài đã đăng

Bài đã lên trang mà chưa qua 11 bước pipeline. Skill này gom hai việc thành một quy trình cố định:
**phiếu thẩm định** (science-editor quyết) → **script đính chính** (máy áp nguyên văn phiếu). Rút từ ba đợt
2026-10-08/09 (13 bài), mọi lỗi lặp được ghi ở mục "Danh sách kiểm".

Agent chủ trì: `science-editor`. Gọi lần lượt `content-research` → `fact-check` (chế độ **Audit**) — skill này
không thay hai skill đó, nó quy định đầu vào, thứ tự và định dạng đầu ra.

## Bước 1 — Đọc bài (chỉ đọc)

Script tạm trong `sciencepedia/scripts/tmp-*.ts` (Prisma cần node_modules của repo), chạy
`npx tsx --env-file-if-exists=.env`, **xoá ngay sau khi chạy**. Lấy: `title, summary, content, seoTitle,
seoDescription, coverImage, coverImageAlt, coverImageCredit, status, factCheck, reviewedById, category,
sources, contentEn`. Ghi lại danh mục: con của `suc-khoe` thì có khung lưu ý y tế, chỗ khác thì không
(`@/lib/category-notices`).

## Bước 2 — Nguồn và claim

1. `content-research`: tìm nguồn bậc 1–2 cho chủ đề, **≥3 nguồn độc lập**. Cơ quan (NHS, CDC, NHLBI,
   NINDS, NIA, WHO, NASA, NOAA, NIST) cho lời khuyên và số liệu nền.
2. `fact-check` chế độ Audit: tách bài thành claim nguyên tử, mỗi claim một phán quyết.
3. Mọi DOI tra **Crossref** (`api.crossref.org/works/<doi>`) — tiêu đề, tạp chí, năm khớp. Abstract/toàn văn
   qua **Europe PMC REST** hoặc **PubMed E-utilities** khi trang chặn (WebFetch hay bị 403). Trang trả 403 thì
   **không dùng**, ghi vào phiếu.
4. Phiếu ghi rõ **đọc gì** cho từng nguồn: "Abstract", "Toàn văn (PMCxxxx) các đoạn: …", "Chỉ xác minh tồn
   tại". Nguồn chỉ xác minh tồn tại không làm căn cứ cho con số.
5. **Cấm**: MedlinePlus `/ency/` (A.D.A.M.), OpenStax — giấy phép không cho AI đọc (`docs/content-rules.md`).

## Bước 3 — Danh sách kiểm (mỗi mục đã từng là lỗi thật)

**Chặn nếu sai:**
- 0 nguồn hoặc <3 nguồn bậc 1–2.
- **Nâng mức chắc chắn**: cơ chế đang tranh luận viết như đã biết (migraine "giãn mạch"; đau đầu căng thẳng
  "co cơ"), "potential immortality" thành "bất tử".
- **Bỏ vế đối trọng / ngoại lệ trong cùng câu nguồn** — nặng nhất ở lời khuyên sức khoẻ: tăng đạm bỏ ngoại lệ
  bệnh thận nặng; "uống đủ nước" bỏ ngoại lệ suy tim; đái tháo đường "thận trọng" khi nguồn nói "không bao
  giờ đi chân trần". **Lời khuyên an toàn phải bằng hoặc chặt hơn nguồn, không nhẹ hơn.**
- **Bài sức khoẻ có lời khuyên tự làm mà thiếu mục "## Khi nào nên đi khám"** (dấu hiệu khám, khám gấp, cấp
  cứu — theo NHS/NINDS/NIA). Bắt buộc kể cả khi bài nằm ngoài nhóm Sức khoẻ.
- **Mô hình sai / sơ đồ sai**: khối ```` ```text ```` mũi tên thường đóng khung nhân quả không nguồn; sơ đồ sai
  là lỗi nội dung, không phải trình bày.
- **Câu "vì sao tiến hoá…" tự thêm**, văn mục đích luận ("cơ thể được thiết kế", "loài chọn", "để đối phó").
- **Lập luận từ im lặng** ("không có bằng chứng cho thấy X tối ưu") khi nguồn có bằng chứng ngược lại.
- **Chủ thể bị nới rộng**: kết quả thiết bị trong nhà kể như đi chân trần; một loài kể như mọi loài.
- **Tự mâu thuẫn** trong bài, hoặc **mâu thuẫn với bài đã PASSED** trong kho (grep CSDL theo từ khoá chủ đề).
  Bài PASSED mà sai thì ghi ở mục E — không tự sửa bài khác trong phiếu này.
- Con số không nguồn ("sau tuổi 30", "2–3 buổi", "phần nghìn giây"): bỏ, không làm tròn cho có vẻ đúng.
- Xung đột lợi ích của tác giả nghiên cứu được dẫn mà bài không nêu.

**Nên sửa:** viết hoa kiểu câu cho tiêu đề và tiêu đề mục (giữ slug); `seoTitle`/`seoDescription` mang cùng
claim sai thì sửa cùng; ghi công ảnh; ảnh bìa và alt (**agent không viết alt cho ảnh chưa xem** — tải về, xem
bằng Read, rồi mới kết luận); "Đọc thêm" ≥3 bài **PUBLISHED + factCheck PASSED**, không trỏ bài đang mâu
thuẫn với bản sửa.

## Bước 4 — Phiếu

`docs/content/checks/<YYYY-MM-DD>/<slug>.md`, mẫu: `docs/content/checks/2026-10-08/cai-gia-cua-su-bat-tu-…md`.

- Đầu phiếu: slug, trạng thái lúc thẩm định, **phán quyết GIỮ / SỬA / GỠ** kèm lý do vì sao không chọn mức kia.
- **A. Chặn** · **B. Nên sửa** — bảng `# | Vị trí | Loại | Vấn đề | Câu thay thế`. Vấn đề trích nguồn cụ thể.
- **C. Nguồn đề xuất** — bậc, trích dẫn, DOI/URL, **đã đọc gì**, dùng cho mục nào.
- **D. Đoạn thay thế NGUYÊN VĂN**, mỗi khối mở bằng một trong các dạng script áp được:
  `thay toàn mục "## <tiêu đề HIỆN TẠI nguyên văn>"` · `thay trường summary` / `seoDescription` / … ·
  `thêm mục mới trước "## <tiêu đề hiện tại>"` · `xoá toàn mục "## …"` · `thay câu "<nguyên văn>"`.
  Khối văn bản đặt trong ```` ```markdown ````. Không có backtick hay `${` trong khối.
- **E. Việc chưa làm / cần người** — quyết định của chủ sản phẩm, thuật ngữ chưa chốt, ảnh, bài khác cần thẩm định.
- **F. Ghi chú thẩm định** — chỗ đã cân nhắc mà không đưa vào D và vì sao.

## Bước 5 — Script đính chính

Engine: `sciencepedia/scripts/lib/corrections.ts` (`runCorrections`, kiểu `Plan`/`Fix`).

1. Mỗi bài một tệp `scripts/data/corrections-<đợt>/<tên>.ts` export một `Plan`. **Trích khối D bằng chương
   trình** (regex trên phiếu) thay vì chép tay — chép tay là chỗ sai nguyên văn.
2. Script đợt `scripts/apply-corrections-<ngày>.ts` gọi `runCorrections([...])`; thêm `corrections:<MMDD>`
   vào `package.json`. Ghi quyết định của chủ sản phẩm vào chú thích đầu script.
3. **Mặc định giữ PUBLISHED** (không `toDraft`), kể cả khi phiếu khuyến nghị DRAFT — chỉ đặt khi chủ sản phẩm
   bảo rõ cho bài đó. Lý do: DRAFT kéo theo cả chuỗi đăng lại (byline, link vào, entity, readingTime).
4. Kiểm trên bản chép CSDL bằng `applyFix`, rồi chạy khô thật: mọi fix khớp đúng một chỗ, ≥3 nguồn bậc 1–2,
   "Đọc thêm" đều PUBLISHED. `--dump <dir>` in bản sau sửa — đọc lại ít nhất phần đầu và mục an toàn.
5. Một mục `docs/content/corrections.md` cho mỗi bài: Cũ → Mới → Căn cứ, chỉ những claim thật sự đổi
   (đối chiếu với bản dump, không với phiếu).
6. typecheck + eslint, commit → PR → merge (CLAUDE.md, mục Git).
7. **Agent tự chạy** `npm run corrections:<MMDD>` (khô) rồi `-- --write`; chạy lại phải ra 0 fix. Kiểm trang thật
   bằng curl tìm một cụm của bản mới.

## Ranh giới — không bao giờ

- **Không ký byline duyệt, không đặt `factCheck = PASSED`.** Byline nói một người/tổ chức đã soi bài; agent ký
  lên bài chính agent thẩm định là mạo danh — quyền chạy lệnh không đổi điều này. Viết
  `scripts/pass-factcheck-<ngày>.ts` cho NGƯỜI chạy trong Terminal sau khi đọc bản đã sửa.
- Không ghi CSDL trong lúc thẩm định (bước 1–4 chỉ đọc).
- Bài về DRAFT muốn đăng lại: gate `npm run publish` còn đòi entity, readingTime đúng và ≥1 link vào từ bài
  PUBLISHED — link vào chỉ ghi khi bài đã có byline, ngay trước publish (mẫu `scripts/republish-prep-2026-10-09.ts`).

## Báo lại cho chủ sản phẩm

Phán quyết · số mục chặn/nên sửa · 1–2 lỗi nặng nhất bằng lời thường · những gì cần người quyết. Lỗi lặp lần
thứ ba trong đợt → đề xuất thêm quy tắc vào `article-generator` (CLAUDE.md: "lặp 3 lần thì sửa prompt").
