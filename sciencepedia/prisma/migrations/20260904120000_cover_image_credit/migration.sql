-- Ghi công ảnh bìa.
--
-- Vì sao cần: 6 trong 13 ảnh bìa mới dùng giấy phép CC BY hoặc CC BY-SA, tức
-- BẮT BUỘC ghi công ngay tại chỗ hiển thị. Trước migration này schema chỉ có
-- `coverImage` là một chuỗi URL trần — không có chỗ nào lưu tác giả hay giấy
-- phép, và không component nào hiển thị được. Đó là nợ tuân thủ giấy phép, và
-- nó có từ trước chứ không phải mới sinh ra.
--
-- Migration này chỉ THÊM cột nullable. Không đổi tên, không xoá, không đổi kiểu
-- cột đang có, nên chạy được trên bảng đang có dữ liệu mà không khoá ghi lâu.
--
-- Dùng TEXT chứ không VARCHAR: nội dung là Markdown có link tới trang gốc trên
-- Wikimedia, và những link đó dài.

ALTER TABLE "Article" ADD COLUMN "coverImageCredit" TEXT;
ALTER TABLE "Article" ADD COLUMN "coverImageCreditEn" TEXT;

ALTER TABLE "Category" ADD COLUMN "coverImageCredit" TEXT;
ALTER TABLE "Category" ADD COLUMN "coverImageCreditEn" TEXT;
