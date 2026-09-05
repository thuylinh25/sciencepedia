# nang-luong-la-gi — hồ sơ pipeline (bước 1–10)

Chạy thử 2026-09-05. **Không có gì được ghi vào CSDL.** Đây là hồ sơ những gì
`supabase-manager` (bước 10) *sẽ* ghi, để lần chạy thật chỉ việc áp dụng.

Thân bài: `docs/content/drafts/nang-luong-la-gi.md` (đó là `Article.content`,
nguyên văn, không gồm file này).

---

## Bước 1–2 — Nguồn và thẩm định (`Source[]`)

Bảy nguồn, năm cơ quan độc lập, **cả bảy đều bậc 2**, không nguồn nào bị rút.
Cột "Đã mở" = đã tự tay fetch và đọc đoạn chống đỡ, không đọc qua bản tóm tắt.

| # | Tiêu đề | Cơ quan | Bậc | Đã mở | Truy cập |
|---|---|---|---:|---|---|
| 1 | Guide to the SI, ch. 4 | NIST | 2 | có | 2026-09-05 |
| 2 | The SI (measurement units) | BIPM | 2 | có | 2026-09-05 |
| 3 | What is energy? explained | U.S. EIA | 2 | có | 2026-09-05 |
| 4 | Forms of energy | U.S. EIA | 2 | có | 2026-09-05 |
| 5 | Conservation of Energy | NASA Glenn | 2 | có | 2026-09-05 |
| 6 | Mass-energy equation (glossary) | U.S. NRC | 2 | có | 2026-09-05 |
| 7 | Electron volt-joule relationship | NIST / CODATA 2022 | 2 | có | 2026-09-05 |

URL đầy đủ nằm trong khối dẫn nguồn cuối thân bài.

Gate cần ≥3 nguồn bậc ≤2 còn hiệu lực → **7/3, đạt**.

**Ghi chú quy trình.** Nguồn #2 (BIPM) ban đầu chỉ có từ đoạn tóm tắt của công
cụ tìm kiếm vì bản PDF của SI Brochure không parse được. `fact-check` quy tắc 1
("verify at the source, never at the summary") bắt phải mở lại — trang HTML của
BIPM cho đúng chuỗi `J = kg m2 s–2`, nên #2 mới được giữ. Nếu không mở được thì
nó đã bị loại, vì mệnh đề nó chống đỡ đã có #1 (NIST) kiểm trực tiếp.

### Bản đồ mệnh đề (claim map)

| Mệnh đề trong bài | Nguồn |
|---|---|
| "năng lượng là khả năng sinh công" là định nghĩa phổ thông của EIA | 3 |
| joule là đơn vị SI của "năng lượng, công và nhiệt lượng" | 1 |
| 1 J = 1 N·m = 1 kg·m²·s⁻² | 1, 2 |
| 1 eV = 1,602176634 × 10⁻¹⁹ J, chính xác, không sai số | 7 |
| điện tích nguyên tố là hằng số định nghĩa của SI (từ 2019) | 2 |
| hoá năng lưu trong liên kết giữa nguyên tử và phân tử | 4 |
| năng lượng hạt nhân lưu trong hạt nhân, thứ giữ hạt nhân lại với nhau | 4 |
| thế năng hấp dẫn "lưu trong độ cao của vật" | 4 |
| nhiệt năng đến từ chuyển động của nguyên tử và phân tử trong một chất | 4 |
| bức xạ là năng lượng điện từ truyền theo sóng ngang | 4 |
| điện năng do các hạt mang điện chở đi | 4 |
| K = ½mv² | 5 |
| trong một miền khảo sát, tổng năng lượng không đổi | 3, 5 |
| E = mc²: năng lượng đổi E thì khối lượng đổi E/c² | 6 |

### Báo cáo bất định (uncertainty report)

1. **S3 — thiếu nguồn trực tiếp.** Câu phản ví dụ "một khối khí đã cân bằng
   nhiệt với môi trường vẫn mang năng lượng rất lớn mà không sinh được chút
   công nào" đúng theo định luật hai nhiệt động lực học, nhưng **không** có
   đoạn chống đỡ trong source pack — nó suy từ kiến thức chuẩn. Giữ lại vì nó
   là chỗ duy nhất chặn người đọc hiểu "khả năng sinh công" thành định nghĩa
   đầy đủ. **Việc phải làm:** gắn nguồn khi bài #19 (ba định luật nhiệt động
   lực học) có nguồn riêng, rồi đưa vào hàng đợi làm mới.
2. **S4** — chuỗi Mặt Trời → cây xanh → thức ăn → cơ bắp là mô tả minh hoạ,
   không phải mệnh đề định lượng; khâu quang hợp sẽ có nguồn ở bài #40.
3. **S4** — câu về "năng lượng tối" là khử nhầm lẫn tên gọi, trỏ sang bài đã có;
   không phải mệnh đề chịu tải của bài này.
4. **Câu hỏi mở giữ nguyên mức dè dặt.** Bài nói thẳng rằng vật lý không trả lời
   "năng lượng làm bằng gì". Không được "sửa cho gọn" thành một định nghĩa bản
   thể ở lần chạm sau — đó là mức dè dặt có chủ ý.

Kết luận `fact-check` (tiền soạn thảo): **pass**. Không có S1, không có S2.

---

## Bước 4 — `science-editor` [VETO]

**Duyệt.** Không có vòng sửa nào được kích hoạt.

Điểm đã soi kỹ:

- **Giữ nguyên cách phát biểu dè dặt của NRC.** Bài viết "khi năng lượng của một
  vật thay đổi một lượng E thì khối lượng thay đổi một lượng bằng E/c²", **không**
  viết "vật chất biến thành năng lượng". Cách nói sau là lỗi phổ biến và nó nói
  sai bản chất phương trình.
- **Không nâng cấp phân loại của EIA thành chuẩn.** EIA xếp nhiệt/ánh sáng/âm/điện
  vào nhóm "kinetic"; đó là quy ước sư phạm của EIA, không phải phân loại chuẩn
  của vật lý. Bài dùng cách chia chức năng (dự trữ / chuyển động / truyền đi) và
  nói rõ ngay tại chỗ rằng đây "không phải bảng phân loại chuẩn của vật lý".
- **0,98 J** = 0,1 kg × 9,80665 m/s² × 1 m. Phép tính hiện ra được, dùng giá trị
  gia tốc trọng trường tiêu chuẩn đã định nghĩa.
- **Bảo toàn năng lượng chỉ nhắc sơ**, đúng phạm vi: chủ đề #10 giữ phần phát
  biểu chính xác. Bài kết mục bằng một câu nói rõ điều đó.
- **E=mc² là mở rộng, không phải trọng tâm** — có câu giới hạn phạm vi ở cuối mục.

---

## Bước 5 — `knowledge-graph-manager`

### Entity

| Trường | Giá trị |
|---|---|
| `name` | Năng lượng |
| `nameEn` | Energy |
| `type` | `Quantity` |
| `slug` | `nang-luong` |
| `wikidata` | Q11379 |
| `symbol` | E |
| `siUnit` | joule (J) |
| `dimension` | M·L²·T⁻² |
| `aliases` | năng lượng, energy |

### Quan hệ có kiểu

Chỉ những quan hệ mà bài này thật sự chống đỡ được. Quan hệ trỏ tới entity chưa
tồn tại được ghi là **chờ**, không tạo entity rỗng.

| Từ | Kiểu | Tới | Trạng thái |
|---|---|---|---|
| Năng lượng | `MEASURED_IN` | Joule (đơn vị) | tạo mới cùng lượt |
| Năng lượng | `HAS_FORM` | Động năng · Thế năng · Nhiệt năng · Hoá năng · Năng lượng hạt nhân · Điện năng · Bức xạ | tạo mới cùng lượt (7) |
| Năng lượng | `CONSERVED_BY` | Định luật bảo toàn năng lượng | **chờ** bài #10 |
| Năng lượng | `RELATED_TO` | Khối lượng | **chờ** bài #3 |
| Năng lượng | `EQUIVALENT_TO` | Khối lượng (qua E=mc²) | **chờ** bài #3 |
| Năng lượng | `PREREQUISITE_FOR` | #10, #11, #19, #40, #41, #58 | **chờ** |
| `thuyet-tuong-doi-hep` | `EXTENDS` | Năng lượng | gắn được ngay (bài đã PUBLISHED) |

**Cảnh báo tính toàn vẹn.** Graph hiện **rỗng: 0 entity, 41/41 bài `entityId = null`**.
Bài này sẽ là entity đầu tiên. Nghĩa là nó không có cluster hub nào trỏ vào, và
7 quan hệ `HAS_FORM` ở trên trỏ tới các entity chưa có bài. Đó là trạng thái
chấp nhận được cho bài mở nhánh, nhưng phải theo dõi: nếu bài #2–#6 không lấp
kịp, đây thành một entity cô lập.

---

## Bước 6 — `seo-optimizer`

| Trường | Giá trị | Đếm |
|---|---|---:|
| `title` (thẻ) | Năng lượng là gì? Định nghĩa, đơn vị joule và các dạng năng lượng | 63 |
| `metaDescription` | Năng lượng là đại lượng đo bằng joule (1 J = 1 kg·m²·s⁻²). Tìm hiểu định nghĩa, các dạng động năng, thế năng, nhiệt, hoá học, hạt nhân, điện — và vì sao tổng của chúng không đổi. | 178 |
| `canonical` | `https://sciencepedia.vn/vi/articles/nang-luong-la-gi` | |
| `slug` | `nang-luong-la-gi` | |
| `readingTime` | 5 | |

Cả hai chuỗi đã đối chiếu với 41 title/description đang có: **không trùng**.

### Link nội bộ — 5 link, cả 5 resolve

Gate cần ≥3 link Markdown `](/articles/<slug>)` trỏ tới bài **đã PUBLISHED**.
Đã đối chiếu với tập slug lấy từ `npm run publish:check`:

| Trỏ tới | Có trong tập PUBLISHED | Ngữ cảnh |
|---|---|---|
| `mat-troi` | có | mở bài — nơi năng lượng hạt nhân được giải phóng |
| `van-dong-va-tim-mach` | có | mở bài — hoá năng trong cơ thể |
| `cuc-quang` | có | mục bức xạ |
| `thuyet-tuong-doi-hep` | có | mục E=mc² |
| `vat-chat-toi-va-nang-luong-toi` | có | khử nhầm lẫn "năng lượng tối" |

**5/3 — đạt.** Không có link chết.

> Lưu ý cho `seo-expert`: cả 41 bài kia hiện **0/3 link nội bộ**, nên bài này ra
> đời không có link *vào*. Cần một lượt riêng thêm link từ `mat-troi`,
> `van-dong-va-tim-mach`, `thuyet-tuong-doi-hep` trỏ ngược lại — nếu không, đây
> là bài mồ côi theo đúng định nghĩa dù chính nó trỏ đi 5 chỗ.

### JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Năng lượng là gì",
  "description": "Năng lượng là đại lượng đo bằng joule (1 J = 1 kg·m²·s⁻²). Định nghĩa, các dạng năng lượng, và vì sao tổng của chúng không đổi.",
  "inLanguage": "vi",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://sciencepedia.vn/vi/articles/nang-luong-la-gi"
  },
  "about": {
    "@type": "Thing",
    "name": "Năng lượng",
    "sameAs": "https://www.wikidata.org/wiki/Q11379"
  },
  "image": "https://upload.wikimedia.org/wikipedia/commons/5/57/Hydroelectric_dam.svg",
  "datePublished": "2026-09-05",
  "dateModified": "2026-09-05",
  "publisher": {
    "@type": "Organization",
    "name": "SciencePedia"
  },
  "citation": [
    { "@type": "CreativeWork", "name": "NIST Guide to the SI, Chapter 4", "url": "https://www.nist.gov/pml/special-publication-811/nist-guide-si-chapter-4-two-classes-si-units-and-si-prefixes" },
    { "@type": "CreativeWork", "name": "The SI", "url": "https://www.bipm.org/en/measurement-units" },
    { "@type": "CreativeWork", "name": "Conservation of Energy", "url": "https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/conservation-of-energy/" },
    { "@type": "CreativeWork", "name": "Mass-energy equation", "url": "https://www.nrc.gov/reading-rm/basic-ref/glossary/mass-energy-equation" }
  ]
}
```

---

## Bước 7 — `category-manager`

| Trường | Giá trị |
|---|---|
| `primaryCategory` | Vật lý → **Nhiệt và Năng lượng** |
| Số primary | 1 (đúng quy tắc) |
| `tags` | `nang-luong`, `joule`, `don-vi-do`, `nhiet-dong-luc-hoc` |

**ĐÂY LÀ ĐỀ XUẤT TẠM, CHƯA THỰC HIỆN ĐƯỢC.**

`vat-ly` hiện là **danh mục gốc phẳng, chưa có danh mục con tầng 2** — danh mục
"Nhiệt và Năng lượng" *chưa tồn tại trong CSDL*. Tên trên lấy đúng theo nhánh
tầng 2 mà `knowledge-architect` đã hoạch định trong `docs/content/topic-queue.md`
("Vật lý → Cơ học · Nhiệt và Năng lượng · Vật chất và Nguyên tử · Điện từ và Ánh
sáng · Vật lý hiện đại").

Vì lượt này không ghi CSDL nên đề xuất này không tốn gì. Nhưng **bài không thể
publish thật cho tới khi tầng 2 được tạo**, vì URL phụ thuộc taxonomy: đổ bài
vào `vat-ly` phẳng rồi chia lại sau là phải version rồi migrate, không sửa tại
chỗ được. Việc tạo tầng 2 thuộc `backend-architect` / `category-manager` ở một
lượt khác (`npm run taxonomy:tier2`).

---

## Bước 8 — `image-finder`

| Trường | Giá trị |
|---|---|
| `coverImage` | `https://upload.wikimedia.org/wikipedia/commons/5/57/Hydroelectric_dam.svg` |
| Mô tả | "Schematic diagram of Hydroelectric power plant" |
| Tác giả | Tennessee Valley Authority; bản SVG của Tomia |
| Giấy phép | **CC BY-SA 3.0** (file còn cấp song song GFDL 1.2+ và CC BY 2.5) |
| `coverImageCredit` | Tennessee Valley Authority; bản SVG của Tomia — CC BY-SA 3.0, qua Wikimedia Commons |
| Nguồn | https://commons.wikimedia.org/wiki/File:Hydroelectric_dam.svg |
| Đã kiểm bản quyền | có — mở trang file, đọc đúng tên bản mẫu giấy phép |

**Vì sao chọn hình này.** Nó vẽ đúng chuỗi chuyển hoá mà mục "Chuyển hoá, và điều
không đổi" mô tả: thế năng hấp dẫn của nước trên cao → động năng dòng chảy →
điện năng. Một sơ đồ minh hoạ đúng lập luận của bài, không phải ảnh trang trí.

Ghi công **không** nằm trong thân bài — nằm ở `coverImageCredit`, đúng
`docs/content-rules.md`. Đã kiểm: thân bài không khớp mẫu ghi công chép tay.

`upload.wikimedia.org` **đã** có trong `remotePatterns` của
`sciencepedia/next.config.ts` — không cần đổi cấu hình frontend.

---

## Bước 9 — `translation`

`locale: en` — phần mở đầu và bảng thuật ngữ. Bản đầy đủ dịch ở lượt chạy thật.

**titleEn:** What Is Energy?
**summaryEn:** Energy is a scalar quantity measured in joules (1 J = 1 kg·m²·s⁻²).
This article covers the working definition and its limits, the SI unit, the main
forms of energy, and why the total never changes.

> The word "energy" appears in nearly every article on the natural sciences —
> from the reactions inside the Sun to the calories a person burns while
> exercising. But what is it?
>
> The most familiar phrasing — "energy is the ability to do work" — is the
> definition the U.S. Energy Information Administration uses for general
> readers. It is convenient and correct in most everyday situations, but it is
> not rigorous: a body of gas already in thermal equilibrium with its
> surroundings still carries a great deal of energy while being unable to do any
> work at all.

### Bảng thuật ngữ đối chiếu

| vi | en | Ghi chú |
|---|---|---|
| năng lượng | energy | |
| công | work | |
| nhiệt lượng | amount of heat | đúng cách gọi của NIST |
| động năng | kinetic energy | |
| thế năng hấp dẫn | gravitational potential energy | |
| nhiệt năng | thermal energy | **không** dịch là "heat" |
| hoá năng | chemical energy | |
| năng lượng hạt nhân | nuclear energy | |
| điện năng | electrical energy | |
| bức xạ | radiant energy | |
| đại lượng vô hướng | scalar quantity | |
| đơn vị dẫn xuất | derived unit | |
| hệ kín | closed system | |
| bảo toàn năng lượng | conservation of energy | |
| điện tích nguyên tố | elementary charge | |

Quy tắc đã chốt: **`nhiệt năng` ≠ `heat`.** "Heat" trong vật lý là năng lượng
*đang truyền*, còn `nhiệt năng` là năng lượng *đang có* trong chất. Dịch lẫn hai
thứ này là đúng lỗi mà bài #11 sinh ra để sửa.

---

## Bước 10 — `supabase-manager` (MÔ PHỎNG — không ghi CSDL)

Đây là bản ghi mà lượt chạy thật sẽ tạo. **Không lệnh ghi nào được chạy trong
lượt này.**

```
Article {
  slug             "nang-luong-la-gi"
  title            "Năng lượng là gì"
  titleEn          "What Is Energy?"
  status           DRAFT        ← không đổi sang PUBLISHED trong lượt chạy thử
  content          <docs/content/drafts/nang-luong-la-gi.md, nguyên văn>
  readingTime      5
  factCheck        PASSED
  reviewedById     <science-editor>
  reviewedAt       2026-09-05
  entityId         <Entity "Năng lượng", Q11379>   ← chờ tạo
  categoryId       <Category "Nhiệt và Năng lượng"> ← CHƯA TỒN TẠI, chặn
  coverImage       https://upload.wikimedia.org/wikipedia/commons/5/57/Hydroelectric_dam.svg
  coverImageCredit "Tennessee Valley Authority; bản SVG của Tomia — CC BY-SA 3.0, qua Wikimedia Commons"
  sources          7 bản ghi, tất cả tier = 2, retractedAt = null
}
```

Ghi revision: `revision 1`, `DRAFT`. Đổi state sang `PUBLISHED` **chỉ** qua
`npm run publish`, là đường ghi duy nhất và có gate — không sửa cột `status`
bằng tay.

---

## Bước 11 — Tự kiểm theo `scripts/check-publish.ts`

Đo bằng chính hàm `prose()` import từ `scripts/check-publish.ts`, không viết lại
logic.

| Điều kiện máy kiểm | Ngưỡng | Bài này | |
|---|---|---|---|
| `factCheck = PASSED` | bắt buộc | PASSED | đạt |
| có `reviewedById` + `reviewedAt` | bắt buộc | có | đạt |
| nguồn bậc ≤2 còn hiệu lực | ≥3 | **7** | đạt |
| nguồn đã bị rút | 0 | 0 | đạt |
| link nội bộ resolve được | ≥3 | **5** | đạt |
| có `entityId` | bắt buộc | có (chờ tạo) | đạt |
| độ dài văn xuôi | 3.000–5.000 | **4.973** | đạt |
| khối dẫn nguồn bị `prose()` cắt | — | cắt 752 ký tự | đạt |
| `readingTime` khớp ~200 từ/phút | ±1 | 5 (1.049 từ → 5) | đạt |
| có ảnh bìa | bắt buộc | có | đạt |
| ghi công ảnh chép tay trong thân bài | không được có | không có | đạt |
| có `coverImageCredit` | mức CẢNH | có | đạt |

**12/12 điều kiện máy kiểm — không có mục CHẶN nào.**

### Rủi ro còn lại

1. **Biên độ dài chỉ còn 27 ký tự.** 4.973 / 5.000. Thêm một câu là vượt trần và
   bài bị chặn. Ai sửa bài này sau phải chạy lại phép đo, đừng ước lượng bằng mắt.
2. **Danh mục tầng 2 chưa tồn tại** — chặn publish thật (xem bước 7).
3. **Không có link vào** — cần một lượt thêm link ngược từ các bài đã có.
