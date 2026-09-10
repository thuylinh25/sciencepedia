-- Thiên thể có toạ độ — chỗ neo giữa bài viết và bản đồ bầu trời.
--
-- Migration này chỉ THÊM: một enum mới, một bảng mới, một cột nullable trên
-- bảng đang có. Không đổi tên, không xoá, không đổi kiểu cột nào, nên chạy
-- được trên bảng đang có dữ liệu mà không khoá ghi lâu.
--
-- `ra`/`dec` để TEXT chứ không DOUBLE PRECISION: catalog công bố toạ độ dạng
-- sexagesimal ("00 42 44.330") và người biên tập chép nguyên chuỗi đó từ
-- SIMBAD sang, nên cái nằm trong CSDL đúng bằng cái đọc được ở nguồn — không
-- có bước làm tròn nào chen vào giữa. Quy đổi sang độ nằm ở tầng ứng dụng
-- (src/lib/sky-coords.ts).
--
-- `catalogId` UNIQUE: mã catalog là định danh thật của một thiên thể. Hai hàng
-- cùng mang "M31" nghĩa là hai bộ toạ độ cho cùng một vật, tức là một trong
-- hai sai mà không có cách nào biết là cái nào.

-- CreateEnum
CREATE TYPE "SkyObjectType" AS ENUM ('GALAXY', 'NEBULA', 'STAR', 'CLUSTER', 'BLACK_HOLE', 'PLANET', 'OTHER');

-- CreateTable
CREATE TABLE "SkyObject" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "objectName" TEXT NOT NULL,
    "objectNameEn" TEXT,
    "ra" TEXT NOT NULL,
    "dec" TEXT NOT NULL,
    "fovDeg" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "survey" TEXT,
    "objectType" "SkyObjectType" NOT NULL DEFAULT 'OTHER',
    "constellation" TEXT,
    "constellationEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkyObject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SkyObject_catalogId_key" ON "SkyObject"("catalogId");

-- CreateIndex
CREATE INDEX "SkyObject_objectType_idx" ON "SkyObject"("objectType");

-- AlterTable
ALTER TABLE "Article" ADD COLUMN "skyObjectId" TEXT;

-- CreateIndex
CREATE INDEX "Article_skyObjectId_idx" ON "Article"("skyObjectId");

-- AddForeignKey
-- ON DELETE SET NULL: xoá một thiên thể khỏi danh mục không được kéo theo bài
-- viết. Bài mất khối bản đồ, phần chữ vẫn nguyên.
ALTER TABLE "Article" ADD CONSTRAINT "Article_skyObjectId_fkey" FOREIGN KEY ("skyObjectId") REFERENCES "SkyObject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
