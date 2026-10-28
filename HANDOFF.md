# HANDOFF — Sciencepedia

> Ảnh chụp trạng thái công việc tại **2026-10-09**, cập nhật **2026-10-27** để session mới
> (tài khoản khác) làm tiếp mà không cần đọc hội thoại cũ. Quy tắc lâu dài nằm ở
> `CLAUDE.md` — đọc file đó trước.
> File này là trạng thái tạm: cập nhật hoặc xoá mục khi việc xong.
> Không có secret trong file này; giá trị thật nằm ở `.env` (không commit) và Vercel.
>
> Ghi chú bản cập nhật 2026-10-27: đối chiếu git log tới HEAD `7174e21` (2026-10-26);
> riêng mục "Thống kê lượt xem theo mô hình" đã cập nhật tới merge PR #134 (2026-10-27).
> Mục nào thuộc CSDL/production — không kiểm chứng được từ repo — thì giữ nguyên trạng
> thái cũ và ghi rõ "chưa kiểm lại"; mục nào kiểm được từ repo thì ghi nguồn kiểm.

## 1. Mục tiêu và trạng thái

Sciencepedia là bách khoa toàn thư khoa học song ngữ vi/en. Code nằm ở `sciencepedia/`
(Next.js 15, Prisma + Supabase Postgres, deploy Vercel từ `main`). Hệ agent/skill nằm ở `.claude/`.

Đợt hiện tại tích hợp nhóm **Tác động cột sống / Bấm huyệt / Y học cổ truyền** vào nhánh
**Sức khoẻ**. Có hai yêu cầu: không làm rối menu, và luôn tách rõ mô tả truyền thống với
bằng chứng khoa học.

Cập nhật 2026-10-27: phần chính của đợt Tác động cột sống đã xong (14 bài PUBLISHED);
trọng tâm công việc từ 2026-10-10 tới HEAD đã chuyển sang **Human Atlas** (đào sâu hệ
thần kinh, lưới góc nhìn theo hệ kiểu Human Anatomy Atlas, chất liệu bề mặt theo ảnh
HAA), **thẩm định nối tiếp từng bài** đăng qua /admin, và **Hành trình thu phóng**
(đợt 2026-10-26). Việc biên tập còn treo của nhánh Sức khoẻ vẫn ở mục 2.

**ĐÓNG ĐỢT 2026-10-28 — Linh quyết định xóa hẳn mảng truyền thống.** Ba danh mục
Tác động cột sống / Bấm huyệt / Y học cổ truyền cùng 14 bài Tác động cột sống bị
xóa khỏi CSDL bằng `npm run taxonomy:remove-traditional -- --write` (script có
sao lưu + sửa link chết trong bài Huyệt đạo; bước ghi CSDL là bước người chạy).
Phía code: gỡ 3 slug khỏi `seed-health-groups.ts` và `category-notices.ts`.
Mọi việc treo của đợt này ở mục 2 (xếp bài Huyệt đạo, nội dung Bấm huyệt / Y học
cổ truyền, Q-2/P-2/P-10/P-22, PDF nguồn) đều hết hiệu lực. Pipeline spine
(`src/lib/spine/`, `scripts/spine-*`, `content/tac-dong-cot-song/`) đã được gỡ
khỏi repo ngay sau đó cùng ngày theo quyết định "dọn luôn" của Linh (PR dọn
pipeline spine), gồm cả tích hợp chỉ mục đốt sống ↔ bài trong trang Human Atlas.

## 2. Việc đang dở / bước tiếp theo

### Thẩm định bài đăng thẳng qua /admin

Quy trình: skill `tham-dinh-bai-da-dang` (phiếu A–F ở `docs/content/checks/<ngày>/`, engine `scripts/lib/corrections.ts`, script đợt `npm run corrections:<MMDD>`). Chủ sản phẩm chốt: bài **giữ PUBLISHED** trong lúc sửa; agent **tự chạy** script đính chính; agent **không ký byline** (người chạy `scripts/pass-factcheck-*.ts`); **không dùng Meilisearch**.

Đã thẩm định tiếp (theo git log, sau ảnh chụp 2026-10-09): 12/10 "Hội chứng thiếu máu",
"Chế độ khẩn cấp mạn tính", "Nón ánh sáng quá khứ", "Bí ẩn bầu trời đêm"; 14/10 ba bài
(điểm kỳ dị, Big Bounce, não bộ tạo điện) và thống nhất thuật ngữ nơron · hố đen ·
lý thuyết dây toàn kho; 15/10 bài sao lấp lánh, "Từ dòng điện đến phép tính"; 23/10
"Lòng dũng cảm và sự tò mò" (bản EN bổ sung 26/10); 26/10 "Lời hứa của toán học và sự
im lặng của vũ trụ", "Khi bộ não rảnh rỗi…" (kèm gắn entity Mạng lưới mặc định).
Quy tắc mới từ 2026-10-26 (PR #119): thẩm định luôn gọi translation — bài chưa có bản EN
thì dịch cả bài.

Các mục treo dưới đây: đến 2026-10-27 chưa thấy commit xử lý; trạng thái trên CSDL
chưa kiểm lại.

- **Bài kim cương:** ảnh bìa chủ sản phẩm tự bổ sung (gate còn chặn vì thiếu ảnh).
- **Bản thiết kế chung của sự sống:** ảnh bìa không ghi công, không rõ gốc — chủ sản phẩm bổ sung nguồn hoặc thay bằng Commons "Homology vertebrates-en.svg" (CC BY-SA 4.0; phiếu mục E). Hai bài này chưa có entity.
- **Phạm vi thẩm định** (chủ sản phẩm chốt 2026-10-09): chỉ thẩm định bài **chưa có dấu duyệt** (factCheck khác PASSED hoặc không byline). Bài đã ký thì không tự thẩm định lại, kể cả 108 bài chưa có phiếu (55 bài lượt duyệt hàng loạt 30/09); chỉ làm khi chủ sản phẩm yêu cầu cụ thể. Kiểm 2026-10-09 tối: 0 bài chưa có dấu duyệt.
- **Sarcopenia:** tên Việt chưa chốt (tiêu đề còn "Chứng teo cơ…", rộng hơn sarcopenia — cần người tra thuật ngữ Bộ Y tế/hội lão khoa); `seoKeywords` cũ, link Runner's High yếu, danh sách thực phẩm giàu đạm chưa nguồn.
- **Sóng điện từ:** số liệu tần số/công suất là của Mỹ (ghi rõ "ở Mỹ"); muốn số Việt Nam cần văn bản quy hoạch tần số.
- **Chính tả** "hóa" (52 bài) / "hoá" (34 bài) chưa thống nhất. Thuật ngữ đã chốt cho cả kho: "tích lũy đột biến", "đa hiệu đối kháng", "than chì" (không "graphit").

### Sức khoẻ / Tác động cột sống

Cả 14 bài Tác động cột sống đã PUBLISHED; nguồn MedlinePlus `/ency/` đã gỡ hết (CSDL còn 0).

Kiểm lại 2026-10-27 từ repo: `proposals.md` vẫn ghi Q-2 còn mở và P-2, P-10, P-22 chờ
PDF (mục 3–4 dưới đây còn nguyên); trong repo chưa có nội dung nào cho Bấm huyệt /
Y học cổ truyền ngoài khung danh mục (`category-notices.ts`, `seed-health-groups.ts`)
— hai nhóm vẫn 0 bài; chưa thấy commit hay script nào xếp lại bài Huyệt đạo (việc trên
CSDL, không kiểm chứng được từ repo).

1. **Xếp bài vào nhóm mới** (nhóm con Cơ thể người, Bấm huyệt, Y học cổ truyền đã có trên production 2026-10-09) (category-manager, bước 7). Ứng viên rõ nhất: bài Huyệt đạo `huyet-dao-va-cham-cuu-khi-cua-dong-y-co-lien-he-gi-voi-khoa-hoc-hien-dai` (hiện ở `sinh-ly-va-trao-doi-chat`) → `bam-huyet` hoặc `y-hoc-co-truyen`. Cần quyết định biên tập.
2. **Nội dung cho Bấm huyệt và Y học cổ truyền.** Hai nhóm sẽ 0 bài nên tự `noindex`. Bài mới phải đi đủ pipeline 11 bước.
3. **Q-2 còn mở.** Thuật ngữ cho bài "Tổng quan" phải do chủ sản phẩm giải nghĩa. Xem `sciencepedia/content/tac-dong-cot-song/source/proposals.md`.
4. **P-2, P-10, P-22 còn treo** tới khi có PDF tài liệu gốc để đối chiếu ảnh trang. Không ảnh hưởng chỉ mục.
5. **Góp ý không chặn còn treo:** Sốt (dấu hiệu 999 riêng cho trẻ dưới 5 tuổi từ trang viêm màng não/nhiễm trùng huyết NHS; ngưỡng 38°C/39°C NHS xếp 999), Hen (xịt lại sau 10 phút; không tự lái xe).
6. **Tuỳ chọn, chưa quyết:** khung lưu ý trên **trang bài** thuộc nhóm truyền thống (hiện chỉ ở trang danh mục, có chủ ý — mục 5).

### Human Atlas — cách vẽ kiểu atlas (cập nhật 2026-10-27)

Đã xong (PR #101–#108): kiểu atlas là mặc định; "Cách vẽ" có ba kiểu Đặc / Bán trong suốt / Xuyên thấu (bảng bên trái, mọi khổ màn); xương kiểu minh hoạ; khung AO = khung thường × AO; loại mảnh ở đỉnh; bề mặt cơ quan, thớ cơ, phía sau tối dần; bối cảnh thận có cơ thắt lưng lớn + cơ hoành (science-editor PASS). Lý do từng việc: `docs/architecture.md`, mục Human Atlas.

Đã xong tiếp (2026-10-15 → 2026-10-26, theo git log): lưới góc nhìn theo hệ kiểu Human Anatomy Atlas cho hệ cơ (theo động tác), xương, tiêu hoá, bạch huyết, sinh dục; ảnh thu nhỏ lưới chụp sẵn lên R2 (THUMB_STYLE 6 tính đến 2026-10-26); hệ thần kinh đào sâu — não chia tới từng hồi, nhân sâu từ Allen/CIT168/Neudorfer, nhập Z-Anatomy đợt 1–2, lát cắt tuỷ theo cao độ và mặt cắt ngang tuỷ cổ; lát cắt ngang ngực cho hệ bạch huyết; mảnh đang chọn nổi rõ (xung quanh lùi tối), bỏ chọn cấu trúc sâu không còn loang lổ (PR #121–#122).

Còn lại:
1. **Đo trên điện thoại thật.** Mọi số đo là Intel UHD 730 (Chrome D3D11) hoặc SwiftShader. Shader xương có nhiễu tế bào 27 lần thử mỗi điểm ảnh. Cần FPS trên một máy Android tầm trung. (Chưa thấy commit nào xử lý tính đến 2026-10-27.) **Công cụ đo đã có (2026-10-27):** mở `/vi/human-atlas?fps=1` trên điện thoại — góc dưới phải hiện FPS hiện tại / trung bình / ms mỗi khung kèm GPU + DPR + khổ màn (`fps-meter.tsx`, chỉ chạy khi có tham số). Quy trình: đợi mô hình tải xong, xoay đều tay ~10 giây ở 3 kịch bản (toàn thân, một view hệ, một cấu trúc zoom gần) rồi ghi số TB của từng kịch bản + dòng ngữ cảnh GPU/DPR. Vẫn chờ người cầm máy Android tầm trung chạy và gửi lại số.
2. **Chưa có số đo tốc độ tin được trên desktop.** Lần chạy lặp lại lệch ~2 ms/khung. Đo khi đang chọn cấu trúc thì "Tự xoay" không chạy (con số 31 ms từng ghi là đo trang đứng yên). Kéo chuột qua Playwright cho 3–17 ms, nhiễu theo nhịp sự kiện. Đo đúng cách: bộ đếm khung trong trang + chạy xen kẽ cũ/mới ≥3 lần.
3. **Thớ cơ hình quạt: vẫn chưa vẽ theo hướng thớ.** Nhưng gân và dây chằng đã vẽ từ 2026-10-26 (xám lam, thớ dọc như ảnh HAA, `c78f257`) và cơ đã có thớ đỏ thẫm theo từng cơ (`ae8faf0`) — phần "cố ý không vẽ" trước đây chỉ còn đúng với hướng thớ hình quạt. Đoán theo hộp bao vẫn là sai giải phẫu.
4. **Dữ liệu thiếu cơ vuông thắt lưng, cơ ngang bụng — ĐÃ BỔ SUNG 2026-10-27 (PR #143).** Nhập từ Z-Anatomy theo đường nối thêm (append-only, giữ nguyên byte 605 mảnh cũ) cùng hạnh nhân khẩu cái; view hạnh nhân hết `missing`, hai view cơ bỏ ghi chú thiếu hai cơ này. Lý do + quy trình: `docs/architecture.md`, mục Z-Anatomy. Còn treo phần người làm: nướng ảnh thu nhỏ cho view `lymphatic-tonsils` (mới dựng được) và chụp lại ảnh `muscle-lower-back`/`muscle-abdomen-pelvis` (khung đã đổi) bằng `scripts/bake-atlas-thumbnails.ts --write` trên máy có GPU, rồi ngắm lại gallery bạch huyết/cơ trên bản deploy.
5. **Đo bằng số theo ảnh mẫu: đã làm một phần.** Cơ và dây chằng/gân đã chỉnh theo ảnh HAA (2026-10-26). Phần cơ quan: chưa thấy commit ghi đã đo median/bão hoà/tương phản như đã làm với xương — cần xác nhận lại trước khi coi là xong.
6. **Trang so sánh trước/sau** (artifact riêng tư) còn ảnh trước PR #103. (Artifact riêng tư, không kiểm chứng được từ repo.)

### Thống kê lượt xem theo mô hình — đã merge, còn bước CSDL (2026-10-27)

PR #134 đã merge vào `main` (merge commit `3460769`): bảng mới `ToolViewStat` + migration `20261027090000_tool_view_stat`, route `POST /api/tools/[id]/view`, `ToolViewTracker` gắn ở 7 trang công cụ, mục "Lượt xem theo mô hình" ở bảng tổng quan admin. Lý do thiết kế: `docs/architecture.md`, mục "Đếm lượt xem theo mô hình". Typecheck/lint/test xanh, check Vercel của PR pass (bản build trên Vercel có CSDL nên qua cả prerender — build ở máy agent chết ở bước này vì không với tới CSDL được, blocker mạng ở mục 6). **Việc người phải làm ngay:** chạy `npx prisma migrate deploy` trên prod — bảng chưa có trên prod (đã kiểm qua Supabase REST 2026-10-27); tới khi chạy, route ghi lượt xem trả 204 êm và mục thống kê chưa có số, không có lỗi nào lộ ra ngoài. Ghi chú thêm: mục "Lượt xem theo lĩnh vực" ở admin từng hiển thị SỐ BÀI theo lĩnh vực thay vì lượt xem — chủ sản phẩm đã chọn đổi thành lượt xem thật (tổng views của bài PUBLISHED, groupBy categoryId trong `getAdminStats`), sửa ở PR đi kèm ghi chú này.

### Hành trình thu phóng — đợt 2026-10-26

Tính năng cũ (trang `/zoom`, từ 09/2026: hành trình qua các cấp từ vũ trụ xuống Trái Đất và các cấp sinh học). Đợt 2026-10-26: tàu vũ trụ bạc thay tên lửa khi chuyển cấp (PR #131); HUD cấp trong khung, thanh cấp 10ⁿ, cuộn chuột/phím đổi cấp (PR #133, HEAD hiện tại). Chưa ghi việc treo nào cho tính năng này — có thì bổ sung vào đây.

## 3. Command hay dùng

Tác động cột sống: ĐÃ GỠ 2026-10-28 (dữ liệu + pipeline) — không còn lệnh nào;
xem ghi chú đóng đợt ở mục 1.


```bash
cd sciencepedia
npm install                 # (npm ci đang lỗi: lockfile lệch, xem mục 6)
npm run typecheck && npm run lint && npm test
npm run build               # cần DATABASE_URL; không có CSDL thì build vẫn qua nhưng bỏ prerender
npm run dev

npm run taxonomy:health     # nhóm con Sức khoẻ (chạy khô; --write)
npm run spine:extract | spine:build | spine:import   # Tác động cột sống (chạy khô; --write)
npm run spine:publish       # NGƯỜI chạy — ghi byline duyệt
npm run publish:check       # rà điều kiện xuất bản (chỉ đọc)
npm run revalidate -- --slug <s>
```

Kiểm UI cục bộ không cần CSDL prod. Dựng Postgres tạm, chạy `npx prisma migrate deploy`, rồi lần lượt:
`npm run db:seed`, `npm run taxonomy:tier2 -- --write`, `npm run taxonomy:tech -- --write`,
`npm run taxonomy:health -- --write`. Cuối cùng chạy `npm run build && npx next start`.

Theme mặc định là **dark** (`defaultTheme="dark"`). Muốn chụp giao diện sáng thì đặt
`localStorage.theme = "light"`; giả lập `prefers-color-scheme` thôi là chưa đủ.

## 4. Cấu trúc Sức khoẻ / Tác động cột sống / Bấm huyệt / YHCT

```
Khám phá (menu)  → chỉ 7 lĩnh vực gốc (Category.parentId = null), đọc từ CSDL
  Sức khoẻ  /categories/suc-khoe   (khung "health")
  ├── Cơ thể người        co-the-nguoi        (kế thừa "health")
  ├── Tác động cột sống   tac-dong-cot-song   (khung "traditional", nhãn trên thẻ)
  ├── Bấm huyệt           bam-huyet           (khung "traditional")
  ├── Y học cổ truyền     y-hoc-co-truyen     (khung "traditional")
  └── Giấc ngủ, Dinh dưỡng, Miễn dịch… (nhóm cũ, kế thừa "health")
```

- **Dữ liệu:** bảng `Category` (`parentId`, `order`). Không có bảng hay hệ danh mục riêng. Thêm "Sơ cứu", "Bệnh học"… là thêm một hàng (form `/admin/categories` hoặc script), không sửa code menu hay trang.
- **Trang lĩnh vực:** `src/app/[locale]/categories/[slug]/page.tsx` hiển thị `category.children` thành lưới `CategoryCard`, áp dụng cho mọi lĩnh vực có con.
- **Khung lưu ý:**
  - Gán loại theo slug ở `src/lib/category-notices.ts`. Câu chữ vi/en nằm ở `messages/*.json` → `category.notice.*`. Component là `src/components/category/category-notice.tsx`.
  - Nhóm con không khai báo thì kế thừa lưu ý của cha.
  - Nhóm truyền thống mới phải được thêm slug vào `NOTICES`.
- **Icon:** phải nằm trong whitelist `src/components/category-icon.tsx`. Tên thiếu sẽ rơi về `Sparkles` mà không báo lỗi.
- **Tác động cột sống:**
  - Dữ liệu ở `sciencepedia/content/tac-dong-cot-song/` (`source/` gồm bản chép trang, `decisions.json`, `corrections.json`; `topics/`). Code ở `src/lib/spine/`.
  - Chỉ mục đốt sống ↔ bài nằm ở `src/lib/spine/index.generated.json`, không ở CSDL.

## 5. Quyết định đã chốt (2026-10-05)

- **Không** đưa Tác động cột sống, Bấm huyệt, Y học cổ truyền thành mục cấp 1 trong menu Khám phá. **Không** dùng submenu bay sang phải. Đường vào các nhóm là thẻ trên trang Sức khoẻ.
- Trên trang danh mục, danh mục con hiện thành thẻ thay cho hàng chip. Áp dụng chung cho mọi lĩnh vực để không phải viết cứng slug.
- Lời lưu ý nằm trong **code**, không trong CSDL. Mỗi câu là phán quyết biên tập có bản vi/en; một ô sửa được trong form quản trị dễ trôi khỏi lần duyệt.
- Nội dung truyền thống chỉ là **mô tả theo trường phái**, không phải hiệu quả đã chứng minh. Bằng chứng hiện đại được nêu riêng và có nguồn. Không hướng dẫn tự thực hiện. Không biến nội dung thành tư vấn chẩn đoán hay điều trị.
- Khung lưu ý chỉ đặt ở trang danh mục, **chưa** đặt ở trang bài. Lý do: bài Tác động cột sống đã có nhãn "Tư liệu lưu trữ" và khung cảnh báo riêng từng bệnh, và chủ sản phẩm đã nhiều lần gỡ nhãn thừa khỏi các bài này.
- Tài liệu Tác động cột sống được lưu như tư liệu, xếp nguồn bậc 4, nên không bao giờ tự đưa bài qua gate. Chi tiết: `docs/content-rules.md`, mục "Tác động cột sống".
- "Thực hiện" một phiếu đề xuất nghĩa là duyệt toàn bộ theo đề xuất mặc định. P-17 (C6, C7, T1 bên phải) có căn cứ yếu, muốn đổi thì sửa D-29. Một mã mang hai vai trong cùng một thể thì giữ vai cao hơn, và mỗi chỗ vẫn ghi một D-n. "Vùng S" tô cả xương cùng; vùng khác không tô. Đoạn "Trẻ em sốt cao" bỏ câu mô tả thủ thuật (D-38).
- Tự động commit → push → PR → merge. Chi tiết: `CLAUDE.md`, mục Git. Từ 2026-10-09: script đính chính (`corrections:*`), `npm run publish` do agent tự chạy; ký byline duyệt (`pass-factcheck-*`, `spine:publish`) vẫn do người.
- Thao tác GitHub (tạo PR, merge) đi qua công cụ GitHub MCP. Session cloud không có `gh`.

## 6. Vấn đề / blocker hiện tại

- **Proxy mạng của môi trường cloud chặn hầu hết nguồn y khoa**: NHS, NINDS, NIAMS, CDC, WHO, NCBI, NICE, Mayo. Chỉ `medlineplus.gov` vào được, nên các bài nháp mới chỉ dẫn MedlinePlus (bậc 2, vẫn đủ 3 nguồn cho gate). Muốn đa dạng nguồn thì thêm các miền này vào *Allowed domains* của môi trường. (Ghi nhận ở môi trường cloud đợt 2026-10; môi trường làm việc 2026-10-27 chưa kiểm lại ba mục chặn mạng/CSDL trong mục này.)
- **Commons / Wikimedia bị chặn**, nên không kiểm được giấy phép ảnh mới. Bìa của các bài nháp mới đang dùng lại hai ảnh cột sống đã kiểm.
- **CSDL Supabase không vào được** từ container (host pooler bị chặn), nên không chạy được `spine:import` hay `publish:check` từ session agent.

- **Chưa chạy `taxonomy:health` trên prod** (kiểm 2026-10-09; chưa kiểm lại — trạng thái production không thấy được từ repo) — xem mục 2, "Sức khoẻ / Tác động cột sống" bước 1.
- **`package-lock.json` lệch `package.json`** (thiếu `@swc/helpers@0.5.23`), nên `npm ci` lỗi. Tạm thời dùng `npm install` rồi `git checkout package-lock.json`. Sửa hẳn bằng một PR riêng chạy `npm install` và commit lockfile. (Kiểm 2026-10-27: chưa có PR sửa riêng; lockfile vẫn ghi `@swc/helpers` 0.5.15 trong khi trong lockfile có chỗ đòi >=0.5.17 — chạy lại `npm ci` để xác nhận lỗi còn hay đã hết trước khi sửa.)
- **MCP `code-review-graph` không kết nối được trong cloud.** Cấu hình trỏ tới đường dẫn Windows. `CLAUDE.md` bảo dùng graph trước, nhưng khi không có thì đọc source trực tiếp.
- **Bộ phân loại an toàn của chế độ auto** từng chặn agent tự commit thay đổi quy tắc Git trong `CLAUDE.md` (lý do: "Self-Modification"). Nếu lặp lại, người dùng commit tay hoặc thêm quyền.

## 7. File quan trọng cần đọc

1. `CLAUDE.md`: quy tắc, pipeline, gate, Git.
2. `docs/architecture.md`: các mục "Nhóm con của Sức khoẻ", "Tác động cột sống — chỉ mục…", "Xuất bản tự động", "Một cơ chế invalidation".
3. `docs/content-rules.md`: các mục "Tác động cột sống", "Byline người duyệt".
4. `sciencepedia/src/app/[locale]/categories/[slug]/page.tsx`, `src/lib/category-notices.ts`, `src/components/category/*`.
5. `sciencepedia/src/components/layout/site-header.tsx`: menu Khám phá. Giữ nguyên, chỉ liệt kê lĩnh vực gốc.
6. `sciencepedia/scripts/seed-health-groups.ts`, `scripts/spine-*.ts`.
7. `sciencepedia/content/tac-dong-cot-song/source/proposals.md`: Q-2 và P còn treo.
8. `sciencepedia/content/tac-dong-cot-song/source/decisions.json`: D-1…D-41, chỉ thêm, không đánh số lại.
9. `sciencepedia/src/lib/spine/schema.ts`, `assemble.ts`, `render.ts`, cùng các tệp biên tập mẫu ở `topics/`.

## 8. Kiểm tra sau khi triển khai

Sau khi Vercel deploy `main` và đã chạy `taxonomy:health -- --write`:

- [ ] Menu **Khám phá** vẫn đúng 7 mục: Vũ trụ, Sức khoẻ, Vật lý, Sinh học, Trái Đất và Khí hậu, Hoá học, Công nghệ và Kỹ thuật. Sau đường kẻ là "Bài viết" và "Danh mục".
- [ ] Bấm "Sức khoẻ" mở `/vi/categories/suc-khoe`. Trang có khung "Thông tin tham khảo, không phải tư vấn y tế", và mục "Chủ đề con" có thẻ theo thứ tự Cơ thể người → Tác động cột sống → Bấm huyệt → Y học cổ truyền → nhóm cũ.
- [ ] Ba thẻ truyền thống có nhãn "Phương pháp truyền thống". Icon đúng: người, nhịp, bàn tay, chiếc lá. Nếu thấy icon lấp lánh thì tên icon chưa có trong whitelist.
- [ ] `/vi/categories/bam-huyet`, `/vi/categories/y-hoc-co-truyen`, `/vi/categories/tac-dong-cot-song` có khung "Phương pháp truyền thống: mô tả không phải bằng chứng" và link "← Sức khoẻ".
- [ ] Bản `/en/...` hiển thị chữ tiếng Anh: "Subtopics", "Traditional practice".
- [ ] Desktop và mobile (≈390 px), cả sáng lẫn tối: không cuộn ngang, chữ trong khung đọc được.
- [ ] `/human-atlas?structure=sacrum` thấy bài Đau lưng cấp với vai "Liên quan" và mã "vùng S".
- [ ] Ba bài Tác động cột sống vẫn mở được, và vẫn hiện trên `/human-atlas` khi chọn đốt sống.
