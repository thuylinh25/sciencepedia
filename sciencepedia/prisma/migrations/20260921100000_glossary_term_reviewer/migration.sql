-- Dấu vết người duyệt cho mục từ điển thuật ngữ.
--
-- Vì sao cần: gate accuracy đòi mọi thứ xuất bản mang tên người duyệt và ngày
-- duyệt ĐỌC ĐƯỢC. Trước migration này, hai thông tin ấy chỉ nằm trong `notes`
-- của `prisma/seed-data/glossary.json` — chữ tự do, không truy vấn được,
-- không hiện ra đâu cả, và `notes` còn không nằm trong nhóm trường mà
-- `scripts/seed-glossary.ts` ghi xuống. Tức là trên CSDL KHÔNG có dấu vết
-- duyệt nào, trong khi định nghĩa vẫn hiện trong tooltip của mọi bài.
--
-- `reviewedById` trỏ `User` chứ không phải chuỗi, giống `Article.reviewedById`:
-- docs/content-rules.md (mục "Byline người duyệt") chốt byline là tài khoản tổ
-- chức "Ban biên tập Sciencepedia" và đòi nhất quán. Khoá ngoại biến sự nhất
-- quán ấy thành ràng buộc, thay vì một quy ước ai cũng phải nhớ.
--
-- Cả hai cột NULLABLE và migration này KHÔNG backfill: 12 mục từ đầu tiên
-- không có dấu vết duyệt trong nguồn nào cả. Suy ngày từ `createdAt` hay gán
-- `science-editor` vì "chắc là vậy" là bịa byline. Ô trống nói đúng sự thật.
-- Việc điền cho 30 mục đã có ghi chú duyệt là của `npm run glossary:seed`,
-- không phải của migration — dữ liệu đi theo file nguồn, không nhúng vào DDL.
--
-- Chỉ CỘNG THÊM: không đổi tên, không xoá, không đổi kiểu cột nào đang có.
--
-- Về khoá: `ADD COLUMN` nullable không kèm DEFAULT chỉ sửa catalog, không ghi
-- lại bảng. `CREATE INDEX` để nguyên (không CONCURRENTLY) vì Prisma chạy
-- migration trong một transaction và CONCURRENTLY không chạy được trong
-- transaction — đánh đổi này chấp nhận được ở đây vì `GlossaryTerm` có 42
-- hàng, khoá ghi tính bằng mili giây. Nếu bảng này lớn lên tới hàng trăm
-- nghìn hàng thì chỉ mục sau phải tách ra chạy CONCURRENTLY ngoài transaction.
-- `ADD CONSTRAINT ... FOREIGN KEY` có quét kiểm tra hàng cũ, nhưng cả 42 hàng
-- đang NULL nên không có gì để kiểm.

-- AlterTable
ALTER TABLE "GlossaryTerm" ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- CreateIndex
-- Có chỉ mục vì truy vấn thật sẽ là "những mục từ do tài khoản X duyệt" khi rà
-- lại một đợt duyệt, và để khoá ngoại không phải quét bảng khi một `User` bị
-- xoá (ON DELETE SET NULL).
CREATE INDEX "GlossaryTerm_reviewedById_idx" ON "GlossaryTerm"("reviewedById");

-- AddForeignKey
-- ON DELETE SET NULL: xoá tài khoản không được kéo theo mục từ. Mất byline thì
-- mục từ quay về trạng thái "chưa ai ký" — đúng sự thật, và gate sẽ bắt lại.
ALTER TABLE "GlossaryTerm" ADD CONSTRAINT "GlossaryTerm_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
