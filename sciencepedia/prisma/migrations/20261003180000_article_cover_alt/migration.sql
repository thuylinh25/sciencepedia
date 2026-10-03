-- Mô tả ảnh bìa (thuộc tính alt) cho bài viết.
--
-- Vì sao cần: ảnh bìa là ảnh lớn nhất trên trang bài nhưng từng render với
-- alt="" — trình đọc màn hình bỏ qua nó, và Google Images không có chữ nào để
-- hiểu ảnh nói gì. Mô tả cái ẢNH cho thấy, không lặp tiêu đề bài: tiêu đề đã
-- có ngay bên dưới, đọc hai lần là nhiễu.
--
-- Nullable: bài chưa có mô tả vẫn render alt="" như cũ (ảnh coi là trang trí)
-- thay vì một alt bịa ra từ tiêu đề.
ALTER TABLE "Article" ADD COLUMN "coverImageAlt" TEXT;
ALTER TABLE "Article" ADD COLUMN "coverImageAltEn" TEXT;
