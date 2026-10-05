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
| #9–#11 + commit `195190c`, `ce3f79f` | Loạt **Tác động cột sống**: extract/build/import/publish, chỉ mục đốt sống ↔ bài trên Human Atlas, quyết định D-1…D-38. **3 bài đã PUBLISHED**: đau lưng cấp, đau thần kinh toạ, đau nửa đầu. |
| (cùng đợt) | Quy tắc Git và merge PR trong `CLAUDE.md` (mục "Git — commit, push, PR, merge"). |

Đã kiểm tra trước khi merge #12:
- `typecheck`, `lint`, `npm test` (73/73) và `build` đều xanh.
- Trên Postgres cục bộ: chụp desktop 1440 px và mobile 390 px, cả sáng lẫn tối. Không có cuộn ngang. Menu Khám phá vẫn đúng 7 lĩnh vực.

## 3. Việc đang dở / bước tiếp theo

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
4. **Q-2 (Tác động cột sống) còn mở.** Thuật ngữ cho bài "Tổng quan" phải do chủ sản phẩm giải nghĩa, máy không tự viết. Xem `sciencepedia/content/tac-dong-cot-song/source/proposals.md`.
5. **P-2, P-10, P-22 còn treo** tới khi có PDF tài liệu gốc để đối chiếu ảnh trang. Cả ba không ảnh hưởng chỉ mục.
6. **Tuỳ chọn, chưa quyết:** đặt khung lưu ý trên **trang bài** thuộc nhóm truyền thống. Hiện khung chỉ có ở trang danh mục, có chủ ý (xem mục 6). Làm thì cần chủ sản phẩm đồng ý.

## 4. Command hay dùng

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
- Tự động commit → push → PR → merge. Script ghi CSDL prod và publish thì do người chạy. Chi tiết: `CLAUDE.md`, mục Git.
- Thao tác GitHub (tạo PR, merge) đi qua công cụ GitHub MCP. Session cloud không có `gh`.

## 7. Vấn đề / blocker hiện tại

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

## 9. Kiểm tra sau khi triển khai

Sau khi Vercel deploy `main` và đã chạy `taxonomy:health -- --write`:

- [ ] Menu **Khám phá** vẫn đúng 7 mục: Vũ trụ, Sức khoẻ, Vật lý, Sinh học, Trái Đất và Khí hậu, Hoá học, Công nghệ và Kỹ thuật. Sau đường kẻ là "Bài viết" và "Danh mục".
- [ ] Bấm "Sức khoẻ" mở `/vi/categories/suc-khoe`. Trang có khung "Thông tin tham khảo, không phải tư vấn y tế", và mục "Chủ đề con" có thẻ theo thứ tự Cơ thể người → Tác động cột sống → Bấm huyệt → Y học cổ truyền → nhóm cũ.
- [ ] Ba thẻ truyền thống có nhãn "Phương pháp truyền thống". Icon đúng: người, nhịp, bàn tay, chiếc lá. Nếu thấy icon lấp lánh thì tên icon chưa có trong whitelist.
- [ ] `/vi/categories/bam-huyet`, `/vi/categories/y-hoc-co-truyen`, `/vi/categories/tac-dong-cot-song` có khung "Phương pháp truyền thống: mô tả không phải bằng chứng" và link "← Sức khoẻ".
- [ ] Bản `/en/...` hiển thị chữ tiếng Anh: "Subtopics", "Traditional practice".
- [ ] Desktop và mobile (≈390 px), cả sáng lẫn tối: không cuộn ngang, chữ trong khung đọc được.
- [ ] Ba bài Tác động cột sống vẫn mở được, và vẫn hiện trên `/human-atlas` khi chọn đốt sống.
