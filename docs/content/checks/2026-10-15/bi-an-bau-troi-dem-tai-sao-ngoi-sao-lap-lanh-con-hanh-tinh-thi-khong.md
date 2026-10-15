# Phiếu thẩm định — Vì sao ngôi sao lấp lánh còn hành tinh thì không?

Slug: `bi-an-bau-troi-dem-tai-sao-ngoi-sao-lap-lanh-con-hanh-tinh-thi-khong` · Trạng thái: PUBLISHED, factCheck PASSED, có byline (ký 2026-10-12) · Danh mục: Quan sát bầu trời (không khung lưu ý).
Khởi phát: `science-editor` đọc chéo khi dịch bản EN (đợt `en-translate` 2026-10-15) và nêu 5 điểm; chủ sản phẩm bảo sửa cả VI lẫn EN (2026-10-15).

## A. Chặn (phải sửa)

- **A1 — Con số không nguồn.** "…ở mức chi tiết tốt hơn khoảng mười lần so với độ phân giải của mắt người", gán cho "các nhà thiên văn". Đã đọc lại cả 8 nguồn của bài: không nguồn nào nêu tỉ lệ này (HKO chỉ giải thích vì sao hành tinh không lấp lánh; Osborn 2015, Dravins 1997 bàn về độ lấp lánh trong trắc quang; Lazio 2004 là lấp lánh liên sao ở dải radio). Theo `docs/content-rules.md` (số liệu phải có nguồn) và nguyên tắc "trống hơn sai": bỏ con số và phần gán cho "các nhà thiên văn", giữ ý đã được lập luận trong chính bài.

## B. Nên sửa

- **B1 — Số liệu gắn thời điểm thiếu mốc.** "Hubble ở độ cao khoảng 480 km". Đã kiểm nguồn NASA "About Hubble" (science.nasa.gov, truy cập 2026-10-15): *"Orbiting 300 miles (483 km) above Earth's surface"*. Con số **đúng nguồn**; nhận định ban đầu "NASA ghi 515–540 km" là từ trí nhớ, không có căn cứ, bị bác. Chỉ thêm mốc "theo NASA, năm 2026" vì độ cao quỹ đạo thay đổi theo thời gian; hẹn thẩm định lại sau 12 tháng.
- **B2 — Khái quát hơi quá.** "Chỉ cần một chiếc ống nhòm là đã thấy hành tinh không nhỏ như các ngôi sao." Nguồn HKO viết đúng ý này ("A pair of binoculars is enough to show that they are not small"), nhưng với hành tinh mờ, ở xa, đĩa khó nhận qua ống nhòm phổ thông. Thu hẹp về hành tinh sáng (Sao Mộc, Sao Kim) — bằng hoặc chặt hơn nguồn. Bảng so sánh giữ nguyên (mức tóm tắt, câu văn đã nêu rõ).
- **B3 — Đơn giản hoá mất chính xác.** "Các chòm sao nằm dọc theo đường ấy chính là các chòm sao hoàng đạo." Đường hoàng đạo còn đi qua chòm Xà Phu, không thuộc 12 chòm hoàng đạo truyền thống. Viết "phần lớn"; chi tiết để bài [các chòm sao hoàng đạo] đã link.

Không sửa: "Các hành tinh luôn xuất hiện gần đường này" — đúng về thực chất (lệch vài độ là "gần").

## C. Nguồn (đã kiểm tồn tại)

Không thêm nguồn. Căn cứ dùng:
- NASA Science — *About Hubble* (https://science.nasa.gov/mission/hubble/overview/about-hubble/): toàn văn trang, đoạn mở đầu và mục "Spaceflight Statistics" (483 km).
- Hong Kong Observatory — *Why do stars twinkle?*: toàn văn, đoạn về hành tinh và ống nhòm.

## D. Đoạn thay thế

### D1 — `content`: thay câu Hubble

```markdown
Bay quanh Trái Đất ở độ cao khoảng 480 km (theo NASA, năm 2026), kính **Hubble** tránh được những méo mó do khí quyển gây ra.
```

### D2 — `content`: thay đoạn "nhìn tinh hơn mắt"

```markdown
Điều thú vị là hiệu ứng này "nhìn" tinh hơn mắt: bằng mắt thường, ngôi sao và hành tinh đều chỉ là những chấm sáng, vậy mà chỉ riêng việc ngôi sao lấp lánh còn hành tinh thì không đã cho thấy chúng khác nhau về kích thước góc.
```

### D3 — `content`: thay câu ống nhòm

```markdown
Với những hành tinh sáng như Sao Mộc hay Sao Kim, chỉ cần một chiếc ống nhòm là đã thấy chúng không nhỏ như các ngôi sao.
```

### D4 — `content`: thay câu chòm sao hoàng đạo

```markdown
Phần lớn các chòm sao nằm dọc theo đường ấy là [các chòm sao hoàng đạo](/articles/cac-chom-sao-hoang-dao).
```

### D5 — `contentEn`: thay câu Hubble

```markdown
Orbiting Earth at an altitude of about 480 km (according to NASA, as of 2026), the **Hubble** telescope avoids the distortions caused by the atmosphere.
```

### D6 — `contentEn`: thay đoạn "sees more finely"

```markdown
Interestingly, this effect "sees" more finely than the eye: to the naked eye, stars and planets are all just points of light, yet the mere fact that stars twinkle while planets do not shows that they differ in angular size.
```

### D7 — `contentEn`: thay câu ống nhòm

```markdown
For bright planets such as Jupiter or Venus, a pair of binoculars is enough to see that they are not as small as the stars.
```

### D8 — `contentEn`: thay câu chòm sao hoàng đạo

```markdown
Most of the constellations lying along that path are [the zodiac constellations](/articles/cac-chom-sao-hoang-dao).
```

## E. Việc chưa làm / cần người

- Đính chính đổi claim (bỏ một con số, thu hẹp hai câu) → engine `clearReview`: gỡ byline, factCheck về PENDING. Bài **giữ PUBLISHED**, nhưng rời `/api/feed/verified` tới khi người duyệt đọc bản mới và ký lại.
- Bài fanpage "Sao lấp lánh" không chứa các câu bị sửa (chỉ tiêu đề + tóm tắt) — không cần sửa bài Facebook.

## F. Ghi chú thẩm định

- Đọc: bản VI hiện tại (CSDL, 2026-10-15), bản EN `docs/content/checks/2026-10-15/en-translate/…en.md` (đã ghi vào CSDL), 8 nguồn của bài.
- Skill đã dùng: `fact-check` (Audit, 5 claim do `science-editor` nêu), `translation` (D5–D8 khớp D1–D4).
- Con số: tập số của bản VI và EN sau sửa vẫn khớp nhau (480, 2026 ở cả hai; bỏ "mười"/"ten" ở cả hai).
