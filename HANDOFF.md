# HANDOFF — Sciencepedia

Bàn giao 2026-10-05, để session ở tài khoản khác tiếp tục mà không cần đọc hội thoại cũ.
Đây là **trạng thái tạm thời**. Quy tắc lâu dài ở `CLAUDE.md`, lý do của quyết định ở `docs/`.
Việc nào xong thì sửa hoặc xoá dòng tương ứng ở đây. Khi tệp không còn gì đúng thì xoá hẳn.

---

## 1. Mục tiêu và trạng thái

Sciencepedia là bách khoa toàn thư khoa học song ngữ vi/en (Next.js 15 + Prisma/Supabase,
deploy trên Vercel). Code ở `sciencepedia/`, hệ agent/skill ở `.claude/`.

Mạch việc hiện tại là **loạt bài "Tác động cột sống"**: số hoá tài liệu *Phương pháp Tác
động Cột sống Việt Nam* (Chi hội Tác động cột sống Hà Nội, 43 trang, 14 chủ đề) thành bài
lưu trữ. Mỗi bài có hai phần: trích nguyên văn tài liệu, và kiến thức y khoa có nguồn kèm
khung cảnh báo. Đốt sống trong bài nối với trang `/human-atlas`.

| # | Chủ đề (manifest id) | Trang | Trạng thái |
|---|---|---|---|
| I | `dau-lung-cap` | 2–3 | bài viết xong, **PUBLISHED** (commit 195190c) |
| III | `dau-than-kinh-toa` | 7–11 | bài viết xong, đã qua science-editor; trạng thái DB: chưa xác minh được |
| IV | `dau-nua-dau` | 12–14 | như III |
| II | `dau-lung-man-tinh` | 4–6 | tệp biên tập xong, đã ở `main` (PR #13) |
| V | `huyet-ap-thap` | 15–16 | tệp biên tập xong, đã ở `main` (PR #13) |
| VI | `thieu-nang-tuan-hoan-nao` | 17–18 | tệp biên tập xong, nằm trong PR #14 |
| VII | `huyet-ap-cao` | 19 | tệp biên tập xong, nằm trong PR #14 |
| — | `dau-dau` | 20–32 | tệp biên tập xong, nằm trong PR #14 |
| — | `hen-suyen-ho-hap` | 33–34 | **chưa làm** |
| I | `sot` | 35–38 | **chưa làm** (vai đốt sống đã chốt: D-32…D-36, D-38) |
| II | `nhieu-mo-hoi-so-gio` | 39 | **chưa làm** |
| III | `benh-do-mo-hoi` | 40 | **chưa làm** |
| IV | `mat-ngu` | 41 | **chưa làm** |
| D | `viem-dai-trang-man-tinh` | 42–43 | **chưa làm** |

Bài mới (từ II trở đi) đều để `review.editor = "pending"` và `review.transcription = "pending"`.
Nghĩa là chưa qua science-editor, và bản chép chưa được đối chiếu với ảnh trang.
Chưa bài mới nào được ghi vào CSDL.

## 2. Việc vừa hoàn thành (session 2026-10-05)

- **Quyết định D-13…D-38** (PR #10): chủ sản phẩm duyệt phiếu `source/proposals.md`.
  Toàn kho còn 0 cờ review mở.
- **Máy trích và dựng bài** (`src/lib/spine/`):
  - Thêm các kiểu `apply` mới: `keepRole` (mã mang hai vai trong một thể thì giữ vai cao
    hơn) và `setSide`. `assign` nhận thêm `regions` và `note`. Một câu áp được nhiều quyết định.
  - Dòng "Trung tâm điều nhiệt" không còn bị đọc thành dòng giải tỏa (D-28).
  - "Giải tỏa trọng điểm …" trong văn xuôi không còn mở vai trọng điểm.
  - "Vùng S" tô cả khối xương cùng trên atlas (`atlasCodeOf`, D-37).
  - Render: cùng mã + cùng vai chỉ hiện bản có bên. Mapping được so với đoạn trích sau
    khi thu dấu chấm dẫn của bảng.
- **Quy tắc merge PR** được đưa vào `CLAUDE.md` (PR #11), sau đó mở rộng thành mục
  "Git — commit, push, PR, merge".
- **Năm tệp biên tập mới:** II, V, VI, VII, Đau đầu.

## 3. PR, nhánh và những gì đã vào `main`

Nhánh làm việc: `claude/cool-galileo-gyghv8`.

| PR | Nội dung | Trạng thái |
|---|---|---|
| #10 | D-13…D-38, `keepRole`/`setSide`, vùng S trên atlas | merged |
| #11 | Rule merge PR trong CLAUDE.md | merged |
| #13 | Bài II, V | merged |
| #14 | Bài VI, VII, Đau đầu; sửa extract/render; CLAUDE.md (mục Git) + HANDOFF.md | xem mục 9 của tệp này hoặc trên GitHub |
| #1, #4, #5 | PR của bot Vercel và nhánh khác | **không phải của mạch này** — đừng merge |

## 4. Việc đang làm dở

- Sáu chủ đề chưa làm (bảng ở mục 1), theo thứ tự tài liệu:
  hen-suyễn → sốt → nhiều mồ hôi → đổ mồ hôi → mất ngủ → viêm đại tràng.
- **Q-2** (thuật ngữ cho bài "Tổng quan" của loạt) **còn mở**. Chủ sản phẩm phải tự giải
  nghĩa các từ: trọng điểm, giải tỏa, tam giác cơ, tiết cơ, ba lớp cơ, trung tâm điều nhiệt…
  Máy không được tự viết định nghĩa. Mẫu đã có là "song chỉnh", ghi ở
  `source/manifest.json`, phần chú giải ký hiệu. Danh sách đầy đủ ở `source/proposals.md`, mục Q-2.
- Ba chỗ cần nhìn ảnh trang khi có PDF: P-2 (L1 hay L4, tr. 4), P-10 (T1 lặp, tr. 17),
  P-22 ("T4, L5", tr. 36). Cả ba đều không ảnh hưởng chỉ mục.

## 5. Bước tiếp theo

1. Kiểm PR #14. Nếu chưa merge mà đã đạt điều kiện thì merge theo `CLAUDE.md`.
2. Làm tiếp sáu chủ đề còn lại. Mỗi chủ đề làm như sau:
   1. Đọc `sciencepedia/content/tac-dong-cot-song/source/pages/pNN.md`.
   2. Xem danh sách thể và vai đốt sống.
   3. Lấy nguồn y khoa bậc 1–2.
   4. Viết `topics/<slug>.editorial.json`. Theo đúng khuôn của các tệp đã có: schema
      `Editorial` ở `src/lib/spine/schema.ts`; tối thiểu 3 nguồn; khối `safety` đặt trước
      phần trích; chủ đề rủi ro cao đặt `riskLevel: "high"`; `furtherReading` gồm ≥ 3 bài
      đã xuất bản.
   5. Chạy `npm run spine:build -- --write` và test.
   6. Commit, rồi mở PR khi xong vài bài.
3. Gửi các bài mới qua **science-editor** (bước 4 của pipeline, có quyền phủ quyết). Bài nào
   được duyệt thì đổi `review.editor` thành `"passed"`.
4. **Xuất bản do người chạy:** `npm run spine:import -- --write` (ghi DRAFT), sau đó
   `npm run spine:publish -- --write`. Lưu ý: `scripts/spine-publish.ts` hiện chỉ có 3 slug
   trong `SERIES`. Muốn xuất bản bài mới phải thêm slug vào đó, sau khi bài đã qua duyệt.
5. Khi chủ sản phẩm trả lời Q-2 thì dựng bài "Tổng quan".

## 6. Command

Chạy trong `sciencepedia/`:

```bash
npm install                      # npm ci đang báo lock lệch (thiếu @swc/helpers) — xem mục 9
npx prisma generate
npm run typecheck
npm run lint
npx tsx scripts/spine-extract.ts            # cờ review (phải 0 cờ mở); --write ghi extract
npm run spine:build                         # dựng khô: trích khớp nguyên văn, 0 mã chưa chắc
npm run spine:build -- --write              # ghi topic JSON, bản nháp vi/en, chỉ mục atlas
npx tsx --test src/lib/spine/*.test.ts      # test bộ trích / dựng / render / chỉ mục
npm run spine:import                        # khô — xem kế hoạch ghi DRAFT (cần CSDL)
npm run publish:check                       # rà điều kiện xuất bản (cần CSDL)
npm run taxonomy:health                     # nhóm con Sức khoẻ (khô; --write)
```

Biến môi trường cần có (chỉ ghi tên, giá trị nằm trong cấu hình môi trường hoặc `.env`, không
bao giờ commit): `DATABASE_URL`, `DIRECT_URL`, `CRON_SECRET`, các biến `CLOUDFLARE_R2_*`,
`MEILISEARCH_*`, `AUTH_*`. Xem `sciencepedia/.env.example`.

## 7. Cấu trúc: Sức khoẻ · Tác động cột sống · Bấm huyệt · Y học cổ truyền

- **Taxonomy:** bốn nhóm là danh mục CON của `suc-khoe` trong bảng `Category`: `co-the-nguoi`,
  `tac-dong-cot-song`, `bam-huyet`, `y-hoc-co-truyen`. Tạo bằng
  `scripts/seed-health-groups.ts` (`npm run taxonomy:health`). Các nhóm này **không lên menu**,
  mà hiện thành thẻ trên trang `/categories/suc-khoe`.
  Lý do ghi ở `docs/architecture.md`, mục "Nhóm con của Sức khoẻ".
- **Khung lưu ý:** `src/lib/category-notices.ts`. `suc-khoe` dùng loại `health`. Ba nhóm truyền
  thống dùng loại `traditional`: công dụng được mô tả theo trường phái, không phải hiệu quả đã
  chứng minh. Câu chữ ở `messages/*.json`, khoá `category.notice`.
- **Tác động cột sống:**
  - `sciencepedia/content/tac-dong-cot-song/`:
    - `source/pages/p01–p43.md`: bản chép nguyên văn, không sửa cho đẹp.
    - `source/manifest.json`: 14 mục và chú giải ký hiệu.
    - `source/decisions.json`: D-1…D-38, chỉ thêm, không đánh số lại.
    - `source/corrections.json`, `source/proposals.md`.
    - `extract/`: sinh ra, gồm `review-flags.md`.
    - `topics/*.editorial.json`: người viết. `topics/*.json`: máy sinh.
  - Máy ở `src/lib/spine/`: `extract`, `notation`, `assemble`, `render`, `schema`,
    `vertebrae`, `links`. Script ở `scripts/spine-*.ts`.
  - Bản nháp bài ở `docs/content/drafts/<slug>{,.en}.md`.
  - Chỉ mục atlas `src/lib/spine/index.generated.json` được `/human-atlas` đọc.
- **Bấm huyệt / Y học cổ truyền:** hiện mới có danh mục và khung lưu ý, **chưa có loạt bài**.
  Bài liên quan đã xuất bản: "Huyệt đạo và châm cứu…" (slug
  `huyet-dao-va-cham-cuu-khi-cua-dong-y-co-lien-he-gi-voi-khoa-hoc-hien-dai`). Bài này là
  đường link vào của loạt Tác động cột sống.

## 8. Quyết định quan trọng đã chốt trong session

Đã ghi vào `decisions.json` và `docs/content-rules.md`, mục "Tác động cột sống":

- "Thực hiện" phiếu đề xuất nghĩa là duyệt toàn bộ theo đề xuất mặc định. P-17 (C6, C7, T1
  bên phải) có căn cứ yếu, muốn đổi thì sửa D-29.
- Nơi bệnh nằm không phải nơi tác động. Mã đi cùng mốc đo, vị trí dị tật hay câu lý thuyết
  chung thì không vào chỉ mục.
- Một mã mang hai vai trong cùng một thể thì giữ vai cao hơn. Mỗi chỗ như vậy vẫn ghi một D-n
  riêng.
- "Vùng S" tô cả xương cùng. Các vùng khác ("các đốt sống cổ") không tô.
- Đoạn "Trẻ em sốt cao" (tr. 36): trích phần nhận định, bỏ câu mô tả thủ thuật (D-38).
- Định nghĩa huyết áp cao của tài liệu ("và") trích nguyên văn. Định nghĩa hiện hành ("hoặc")
  đặt trong khung, có nguồn.
- Đoạn trích dạng bảng: dấu chấm dẫn được thu thành "…". Dòng điều trị (giải tỏa, điều nhiệt)
  không đưa vào đoạn trích. Chỗ lược dòng thì ghi "…" để máy kiểm vẫn xác minh được nguyên văn.
- Quy trình Git và merge: xem `CLAUDE.md`, mục "Git — commit, push, PR, merge".

## 9. Vấn đề / blocker hiện tại

- **Proxy mạng của môi trường chặn hầu hết nguồn y khoa:** NHS, NINDS, NIAMS, CDC, WHO, NCBI,
  NICE, Mayo. Chỉ `medlineplus.gov` vào được. Vì vậy các bài mới chỉ dẫn MedlinePlus (vẫn là
  bậc 2, đủ 3 nguồn cho gate). Muốn đa dạng nguồn thì thêm các miền trên vào *Allowed domains*
  của môi trường.
- **Commons / Wikimedia bị chặn**, nên không kiểm được giấy phép ảnh mới. Bìa bài mới đang dùng
  lại hai ảnh đã kiểm từ trước. Khi mở được mạng thì thay bìa riêng cho từng bài.
- **CSDL Supabase không vào được** từ container (host pooler bị chặn). Vì vậy chưa xác minh
  được trạng thái DB của bài III và IV, và không chạy được `spine:import` hay `publish:check`.
- `npm ci` báo `package-lock.json` lệch `package.json` (thiếu `@swc/helpers`). Đang dùng
  `npm install` mà không commit lock. Nên có một PR riêng để đồng bộ lock bằng npm bản dự án dùng.
- MCP `code-review-graph` không kết nối được: trỏ vào đường dẫn Windows không tồn tại trong
  container.
- Bản nháp của các bài đã xuất bản có danh sách "Cùng loạt" trỏ tới bài chưa xuất bản. Đây
  chỉ là tệp nháp, chưa vào CSDL. Khi import hoặc publish nhớ kiểm link (`npm run links:fix`).

## 10. File quan trọng cần đọc

1. `CLAUDE.md`: quy tắc, pipeline, gate, Git.
2. `docs/content-rules.md`, mục "Tác động cột sống", cùng "Byline người duyệt" và "Trích nội dung".
3. `docs/architecture.md`, mục "Nhóm con của Sức khoẻ" và "Xuất bản tự động".
4. `sciencepedia/content/tac-dong-cot-song/source/decisions.json` và `proposals.md`.
5. `sciencepedia/src/lib/spine/schema.ts` (khuôn tệp biên tập) và `assemble.ts`.
6. Một tệp biên tập mẫu: `topics/dau-lung-cap-theo-tac-dong-cot-song.editorial.json` (dạng văn
   xuôi), `topics/huyet-ap-thap-theo-tac-dong-cot-song.editorial.json` (dạng bảng).
7. `scripts/spine-publish.ts` (danh sách `SERIES`, thứ tự xuất bản).

## 11. Kiểm tra sau khi triển khai

- Trước khi merge: `npm run typecheck`, `npm run lint`, test spine, `spine:build` không có ✖,
  `spine-extract` báo 0 cờ mở; trên PR thì status `Vercel` xanh.
- Kiểm thủ công đoạn trích: mọi mapping phải nằm dưới đoạn trích chứa nó. Mỗi thể có đốt
  sống phải có một dòng "Xem trên Bản đồ cơ thể người".
- Sau khi deploy: mở `/categories/suc-khoe` (thấy bốn thẻ nhóm con và khung lưu ý), mở
  `/human-atlas?structure=sacrum` (thấy bài Đau lưng cấp với vai "Liên quan", mã "vùng S"),
  mở bài đã xuất bản và kiểm link đốt sống mở đúng cấu trúc.
- Sau `spine:publish` (người chạy): `npm run publish:check`, rồi
  `npm run revalidate -- --slug <s>` nếu sửa bài ngoài form.
