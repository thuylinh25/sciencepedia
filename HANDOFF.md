# HANDOFF — Sciencepedia

> Ảnh chụp trạng thái công việc tại **2026-10-05**, để session mới (tài khoản khác) làm tiếp
> mà không cần đọc hội thoại cũ. Quy tắc lâu dài nằm ở `CLAUDE.md` — đọc file đó trước.
> File này là trạng thái tạm: cập nhật hoặc xoá mục khi việc xong.
> Không có secret trong file này; giá trị thật nằm ở `.env` (không commit) và Vercel.

## 1. Mục tiêu và trạng thái

Sciencepedia là bách khoa toàn thư khoa học song ngữ vi/en. Code nằm ở `sciencepedia/`
(Next.js 15, Prisma + Supabase Postgres, deploy Vercel từ `main`). Hệ agent/skill nằm ở `.claude/`.

Đợt hiện tại tích hợp nhóm **Tác động cột sống / Bấm huyệt / Y học cổ truyền** vào nhánh
**Sức khoẻ**. Có hai yêu cầu: không làm rối menu, và luôn tách rõ mô tả truyền thống với
bằng chứng khoa học.

## 2. Việc vừa hoàn thành (đã ở `main`)

| PR | Nội dung |
|---|---|
| [#12](https://github.com/thuylinh25/sciencepedia/pull/12) | Nhóm con của Sức khoẻ hiện thành **thẻ** trên trang lĩnh vực. Thêm khung lưu ý `health`/`traditional`, script `taxonomy:health` và icon `Activity`/`Hand`/`PersonStanding`. Merge commit `ee70edd`. |
| #9–#11 + commit `195190c`, `ce3f79f` | Loạt **Tác động cột sống**: extract/build/import/publish, chỉ mục đốt sống ↔ bài trên Human Atlas, quyết định D-1…D-41. **3 bài đã PUBLISHED**: đau lưng cấp, đau thần kinh toạ, đau nửa đầu. |
| [#13](https://github.com/thuylinh25/sciencepedia/pull/13) (session khác) | Thêm 2 bài Tác động cột sống **ở dạng bản nháp, `review.editor = pending`**: Đau lưng mãn tính (chủ đề II) và Huyết áp thấp (chủ đề V, `riskLevel high`, có khung cấp cứu đặt trước phần trích). Nguồn chỉ có MedlinePlus vì NHS/NINDS/NIAMS bị proxy mạng chặn. **Chưa qua science-editor, chưa import, chưa publish.** |
| [#14](https://github.com/thuylinh25/sciencepedia/pull/14) | Thêm 3 bài Tác động cột sống, cũng ở dạng nháp với `review.editor = pending`: Thiểu năng tuần hoàn não (VI), Huyết áp cao (VII), Các bệnh về đau đầu (53 thể). Cả ba `riskLevel high`. Sửa máy: (a) "Giải tỏa trọng điểm …" trong văn xuôi không còn mở vai trọng điểm; (b) render bỏ mã trùng không bên; (c) mapping được so với đoạn trích sau khi thu dấu chấm dẫn. Nhánh `claude/cool-galileo-gyghv8`. |
| [#10](https://github.com/thuylinh25/sciencepedia/pull/10) | D-13…D-38 (duyệt phiếu `proposals.md`). Thêm `apply` mới `keepRole`/`setSide`; `assign` nhận `regions`/`note`. "Vùng S" tô cả xương cùng (`atlasCodeOf`). Toàn kho còn 0 cờ review mở. |
| (cùng đợt) | Quy tắc Git và merge PR trong `CLAUDE.md` (mục "Git — commit, push, PR, merge"). |

Đã kiểm tra trước khi merge #12:
- `typecheck`, `lint`, `npm test` (73/73) và `build` đều xanh.
- Trên Postgres cục bộ: chụp desktop 1440 px và mobile 390 px, cả sáng lẫn tối. Không có cuộn ngang. Menu Khám phá vẫn đúng 7 lĩnh vực.

## 3. Việc đang dở / bước tiếp theo

**Tiến độ loạt Tác động cột sống: 14 chủ đề, làm theo thứ tự trong tài liệu — đã soạn đủ 14 (2026-10-07). CSDL: 3 PUBLISHED, 11 bài còn lại chưa import.**

| Chủ đề (manifest id) | Trang | Trạng thái |
|---|---|---|
| `dau-lung-cap`, `dau-than-kinh-toa`, `dau-nua-dau` | 2–3, 7–11, 12–14 | PUBLISHED |
| `dau-lung-man-tinh`, `huyet-ap-thap` | 4–6, 15–16 | nháp, đã ở `main` (#13) |
| `thieu-nang-tuan-hoan-nao`, `huyet-ap-cao`, `dau-dau` | 17–32 | nháp (#14) |
| `hen-suyen-ho-hap` | 33–34 | nháp, đã ở `main` (#16): 12 thể, nguồn NHS + NHLBI + MedlinePlus, `riskLevel high` |
| `sot` | 35–38 | nháp, đã ở `main` (#16): 15 thể, 8 nguồn NHS + MedlinePlus; khung nêu co giật do sốt đơn thuần vô hại (MedlinePlus) — đối lập câu "di chứng bại não" của tài liệu, cần science-editor xem kỹ |
| `nhieu-mo-hoi-so-gio` | 39 | nháp, đã ở `main` (#17): 5 thể, 6 mapping, nguồn NHS + MedlinePlus, `riskLevel normal` |
| `benh-do-mo-hoi` | 40 | nháp, đã ở `main` (#18): 6 thể, 10 mapping, khung sốc nhiệt; câu "tác động C1 và S1,S2" (thể 6) không trích, không chỉ mục — chủ sản phẩm quyết |
| `mat-ngu` | 41 | nháp, đã ở `main` (#21); science-editor vòng 2 PASS (2026-10-07), `editor` còn `pending` chờ chủ sản phẩm xác nhận + quyết MedlinePlus: 6 thể, 14 mapping, nguồn NHS + MedlinePlus + NHLBI, `riskLevel normal`; khung nêu hồi hộp kèm đau ngực/khó thở/ngất là cấp cứu (thể 5). Mục 7 "Mất ngủ kéo dài" chỉ có tiêu đề trong bản scan → bỏ (D-41, chủ sản phẩm) |
| `viem-dai-trang-man-tinh` | 42–43 | nháp, đã ở `main` (#22); science-editor vòng 2 PASS (2026-10-07), `editor` còn `pending`: 9 thể, 34 mapping, 6 nguồn NHS + NIDDK, `riskLevel high`. Không trích các câu "Chữa … lớp ngoài/trong" và câu tài liệu tự nhận "đạt kết quả khá"; đoạn viêm cấp đưa vào mục không áp dụng. Tài liệu viết "điều trị nội khoa rất hạn chế" — trái NIDDK (thuốc giảm viêm đưa bệnh vào lui bệnh); science-editor xem |

**Cách làm một chủ đề:**
1. Đọc `source/pages/pNN.md`.
2. Lấy nguồn bậc 1–2.
3. Viết `topics/<slug>.editorial.json` theo schema `Editorial` (`src/lib/spine/schema.ts`):
   - tối thiểu 3 nguồn;
   - `safety` đặt trước phần trích;
   - chủ đề rủi ro cao đặt `riskLevel: "high"`;
   - `furtherReading` gồm ≥ 3 bài đã xuất bản;
   - `review` để `pending`, trừ `mapping: passed` khi mọi cờ đã có D-n.
4. Đoạn trích phải là nguyên văn:
   - Ở dạng bảng, dấu chấm dẫn thu thành "…"; chỗ lược dòng cũng ghi "…".
   - Không đưa dòng điều trị (giải tỏa, điều nhiệt) vào trích.
   - Mỗi mapping phải nằm dưới đoạn trích chứa raw của nó.
   - Mẫu: `dau-lung-cap…editorial.json` (văn xuôi), `huyet-ap-thap…editorial.json` (bảng), `dau-dau…editorial.json` (khối thăm khám).
5. Chạy `npm run spine:build -- --write` và test spine, rồi commit và mở PR.


1. **[NGƯỜI chạy, ưu tiên cao] Tạo 4 nhóm con trên CSDL production.** PR #12 mới chỉ có code.
   ```bash
   cd sciencepedia
   npm run taxonomy:health            # chạy khô: xem kế hoạch
   npm run taxonomy:health -- --write # ghi
   ```
   - Script tạo `co-the-nguoi`, `bam-huyet`, `y-hoc-co-truyen` nếu chưa có. Với `tac-dong-cot-song` (do `spine:import` tạo) nó chỉ đặt `order` và không đổi tên/mô tả.
   - Thứ tự hiển thị: Cơ thể người → Tác động cột sống → Bấm huyệt → Y học cổ truyền → các nhóm con cũ (Giấc ngủ, Dinh dưỡng, Miễn dịch…).
   - Script **dừng** nếu một slug đã nằm dưới lĩnh vực khác: chuyển nhánh là quyết định của category-manager.
   - Cần `.env` có `DATABASE_URL`. Muốn làm mới cache ngay thì thêm `CRON_SECRET` và `NEXT_PUBLIC_SITE_URL`. Không có thì trang `/categories/suc-khoe` tự mới sau ≤ 5 phút (ISR 300 s).
2. **Xếp bài vào nhóm mới** (category-manager, bước 7 của pipeline). Hiện chưa chuyển bài nào. Ứng viên rõ nhất: bài Huyệt đạo `huyet-dao-va-cham-cuu-khi-cua-dong-y-co-lien-he-gi-voi-khoa-hoc-hien-dai` → `bam-huyet` hoặc `y-hoc-co-truyen`. Cần quyết định biên tập.
3. **Nội dung cho Bấm huyệt và Y học cổ truyền.** Hai nhóm này đang 0 bài nên tự `noindex`. Bài mới phải đi đủ pipeline 11 bước.
4. **Hai bài nháp mới của PR #13** (đau lưng mãn tính, huyết áp thấp) phải qua science-editor rồi mới `review.editor = passed`, sau đó `spine:build` → `spine:import` → người chạy `spine:publish`. Cần cân nhắc bổ sung nguồn bậc 1–2 ngoài MedlinePlus khi mạng cho phép. Hiện `spine:publish` chỉ liệt kê 3 bài trong `SERIES`, nên phải thêm hai slug mới vào đó.
5. **Q-2 (Tác động cột sống) còn mở.** Thuật ngữ cho bài "Tổng quan" phải do chủ sản phẩm giải nghĩa, máy không tự viết. Xem `sciencepedia/content/tac-dong-cot-song/source/proposals.md`.
6. **P-2, P-10, P-22 còn treo** tới khi có PDF tài liệu gốc để đối chiếu ảnh trang. Cả ba không ảnh hưởng chỉ mục.
7. **Tuỳ chọn, chưa quyết:** đặt khung lưu ý trên **trang bài** thuộc nhóm truyền thống. Hiện khung chỉ có ở trang danh mục, có chủ ý (xem mục 6). Làm thì cần chủ sản phẩm đồng ý.

## 4. Command hay dùng

Tác động cột sống:
`npx tsx scripts/spine-extract.ts` (phải báo 0 cờ mở) · `npm run spine:build` (không có ✖) ·
`npx tsx --test src/lib/spine/*.test.ts`.


```bash
cd sciencepedia
npm install                 # (npm ci đang lỗi: lockfile lệch, xem mục 7)
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

## 5. Cấu trúc Sức khoẻ / Tác động cột sống / Bấm huyệt / YHCT

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

## 6. Quyết định đã chốt (2026-10-05)

- **Không** đưa Tác động cột sống, Bấm huyệt, Y học cổ truyền thành mục cấp 1 trong menu Khám phá. **Không** dùng submenu bay sang phải. Đường vào các nhóm là thẻ trên trang Sức khoẻ.
- Trên trang danh mục, danh mục con hiện thành thẻ thay cho hàng chip. Áp dụng chung cho mọi lĩnh vực để không phải viết cứng slug.
- Lời lưu ý nằm trong **code**, không trong CSDL. Mỗi câu là phán quyết biên tập có bản vi/en; một ô sửa được trong form quản trị dễ trôi khỏi lần duyệt.
- Nội dung truyền thống chỉ là **mô tả theo trường phái**, không phải hiệu quả đã chứng minh. Bằng chứng hiện đại được nêu riêng và có nguồn. Không hướng dẫn tự thực hiện. Không biến nội dung thành tư vấn chẩn đoán hay điều trị.
- Khung lưu ý chỉ đặt ở trang danh mục, **chưa** đặt ở trang bài. Lý do: bài Tác động cột sống đã có nhãn "Tư liệu lưu trữ" và khung cảnh báo riêng từng bệnh, và chủ sản phẩm đã nhiều lần gỡ nhãn thừa khỏi các bài này.
- Tài liệu Tác động cột sống được lưu như tư liệu, xếp nguồn bậc 4, nên không bao giờ tự đưa bài qua gate. Chi tiết: `docs/content-rules.md`, mục "Tác động cột sống".
- "Thực hiện" một phiếu đề xuất nghĩa là duyệt toàn bộ theo đề xuất mặc định. P-17 (C6, C7, T1 bên phải) có căn cứ yếu, muốn đổi thì sửa D-29. Một mã mang hai vai trong cùng một thể thì giữ vai cao hơn, và mỗi chỗ vẫn ghi một D-n. "Vùng S" tô cả xương cùng; vùng khác không tô. Đoạn "Trẻ em sốt cao" bỏ câu mô tả thủ thuật (D-38).
- Tự động commit → push → PR → merge. Script ghi CSDL prod và publish thì do người chạy. Chi tiết: `CLAUDE.md`, mục Git.
- Thao tác GitHub (tạo PR, merge) đi qua công cụ GitHub MCP. Session cloud không có `gh`.

## 7. Vấn đề / blocker hiện tại

- **Proxy mạng của môi trường cloud chặn hầu hết nguồn y khoa**: NHS, NINDS, NIAMS, CDC, WHO, NCBI, NICE, Mayo. Chỉ `medlineplus.gov` vào được, nên các bài nháp mới chỉ dẫn MedlinePlus (bậc 2, vẫn đủ 3 nguồn cho gate). Muốn đa dạng nguồn thì thêm các miền này vào *Allowed domains* của môi trường.
- **Commons / Wikimedia bị chặn**, nên không kiểm được giấy phép ảnh mới. Bìa của các bài nháp mới đang dùng lại hai ảnh cột sống đã kiểm.
- **CSDL Supabase không vào được** từ container (host pooler bị chặn), nên không chạy được `spine:import` hay `publish:check` từ session agent.
- Bản nháp (`docs/content/drafts/`) của các bài đã xuất bản có danh sách "Cùng loạt" trỏ tới bài chưa xuất bản. Đây chỉ là tệp, chưa vào CSDL. Khi import hoặc publish nhớ kiểm link (`npm run links:fix`).

- **Chưa chạy `taxonomy:health` trên prod.** Session agent không có `.env` prod (xem mục 3.1).
- **`package-lock.json` lệch `package.json`** (thiếu `@swc/helpers@0.5.23`), nên `npm ci` lỗi. Tạm thời dùng `npm install` rồi `git checkout package-lock.json`. Sửa hẳn bằng một PR riêng chạy `npm install` và commit lockfile.
- **MCP `code-review-graph` không kết nối được trong cloud.** Cấu hình trỏ tới đường dẫn Windows. `CLAUDE.md` bảo dùng graph trước, nhưng khi không có thì đọc source trực tiếp.
- **Bộ phân loại an toàn của chế độ auto** từng chặn agent tự commit thay đổi quy tắc Git trong `CLAUDE.md` (lý do: "Self-Modification"). Nếu lặp lại, người dùng commit tay hoặc thêm quyền.

## 8. File quan trọng cần đọc

1. `CLAUDE.md`: quy tắc, pipeline, gate, Git.
2. `docs/architecture.md`: các mục "Nhóm con của Sức khoẻ", "Tác động cột sống — chỉ mục…", "Xuất bản tự động", "Một cơ chế invalidation".
3. `docs/content-rules.md`: các mục "Tác động cột sống", "Byline người duyệt".
4. `sciencepedia/src/app/[locale]/categories/[slug]/page.tsx`, `src/lib/category-notices.ts`, `src/components/category/*`.
5. `sciencepedia/src/components/layout/site-header.tsx`: menu Khám phá. Giữ nguyên, chỉ liệt kê lĩnh vực gốc.
6. `sciencepedia/scripts/seed-health-groups.ts`, `scripts/spine-*.ts`.
7. `sciencepedia/content/tac-dong-cot-song/source/proposals.md`: Q-2 và P còn treo.
8. `sciencepedia/content/tac-dong-cot-song/source/decisions.json`: D-1…D-41, chỉ thêm, không đánh số lại.
9. `sciencepedia/src/lib/spine/schema.ts`, `assemble.ts`, `render.ts`, cùng các tệp biên tập mẫu ở `topics/`.

## 9. Kiểm tra sau khi triển khai

Sau khi Vercel deploy `main` và đã chạy `taxonomy:health -- --write`:

- [ ] Menu **Khám phá** vẫn đúng 7 mục: Vũ trụ, Sức khoẻ, Vật lý, Sinh học, Trái Đất và Khí hậu, Hoá học, Công nghệ và Kỹ thuật. Sau đường kẻ là "Bài viết" và "Danh mục".
- [ ] Bấm "Sức khoẻ" mở `/vi/categories/suc-khoe`. Trang có khung "Thông tin tham khảo, không phải tư vấn y tế", và mục "Chủ đề con" có thẻ theo thứ tự Cơ thể người → Tác động cột sống → Bấm huyệt → Y học cổ truyền → nhóm cũ.
- [ ] Ba thẻ truyền thống có nhãn "Phương pháp truyền thống". Icon đúng: người, nhịp, bàn tay, chiếc lá. Nếu thấy icon lấp lánh thì tên icon chưa có trong whitelist.
- [ ] `/vi/categories/bam-huyet`, `/vi/categories/y-hoc-co-truyen`, `/vi/categories/tac-dong-cot-song` có khung "Phương pháp truyền thống: mô tả không phải bằng chứng" và link "← Sức khoẻ".
- [ ] Bản `/en/...` hiển thị chữ tiếng Anh: "Subtopics", "Traditional practice".
- [ ] Desktop và mobile (≈390 px), cả sáng lẫn tối: không cuộn ngang, chữ trong khung đọc được.
- [ ] `/human-atlas?structure=sacrum` thấy bài Đau lưng cấp với vai "Liên quan" và mã "vùng S".
- [ ] Ba bài Tác động cột sống vẫn mở được, và vẫn hiện trên `/human-atlas` khi chọn đốt sống.
