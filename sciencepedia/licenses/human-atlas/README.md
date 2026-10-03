# Human Atlas — giấy phép và ghi công

Bản đồ cơ thể người (`/[locale]/human-atlas`) dựa trên hai nguồn, mỗi nguồn một giấy phép:

| Phần | Nguồn | Giấy phép | Tệp |
|---|---|---|---|
| Mã trình xem (`src/components/human-atlas/anatomy-scene.tsx`, `src/lib/human-atlas/{explosion-layout,pointer-tap,model-download}.ts`, bảng màu và mô tả hệ) | Human Atlas — https://github.com/ashemag/human-atlas | MIT, © 2026 ashemag | `LICENSE` |
| Dữ liệu giải phẫu (hình học + tên, trên R2 dưới `human-atlas/<phiên bản>/`) | BodyParts3D 4.0, © The Database Center for Life Science | CC BY 4.0 | `ATTRIBUTION.md` |
| Thuật ngữ và phân loại (tên Latin, đồng nghĩa, cha is-a/part-of, mã TA98 — `data/anatomy/fma-structures.json`, trên R2 dưới `human-atlas/anatomy/`) | Foundational Model of Anatomy 5.1.0, © Structural Informatics Group, University of Washington | CC BY 4.0 | `FMA-ATTRIBUTION.md` |
| Tóm tắt / vị trí / chức năng (Level 2, `data/anatomy/content-l2.json`) — **câu chữ của Sciencepedia**, chỉ dữ kiện lấy từ sách | OpenStax, *Anatomy and Physiology 2e*, Rice University — https://openstax.org/details/books/anatomy-and-physiology-2e | CC BY-NC-SA 4.0 — dùng làm nguồn dữ kiện, KHÔNG chép/phỏng câu, không dùng hình; mỗi mục ghi nguồn tới đúng mục sách ngay dưới đoạn văn | — |
| Tóm tắt / vị trí / chức năng Level 2 viết từ 2026-10-03 — **câu chữ của Sciencepedia**, chỉ dữ kiện lấy từ bài | Wikipedia tiếng Anh, Wikimedia Foundation — https://en.wikipedia.org/ | CC BY-SA 4.0 — dùng làm nguồn dữ kiện, không chép/phỏng câu; mỗi mục ghi link tới đúng bài ngay dưới đoạn văn | — |

Hai tệp chép nguyên văn từ repo gốc, không sửa. Bản `ATTRIBUTION.md` cũng được đẩy lên R2 cạnh
dữ liệu (`scripts/upload-human-atlas.ts`) — CC BY 4.0 đòi ghi công đi theo bản phân phối lại.
Trên trang, ghi công hiển thị ở mục "Nguồn dữ liệu giải phẫu" và bảng "Nguồn & ghi công".

Sciencepedia không tạo ra bộ dữ liệu giải phẫu. Phần Sciencepedia thêm vào: tên tiếng Việt
(`src/lib/human-atlas/names-vi.ts`), bản dịch mô tả, liên kết tới bài viết.
