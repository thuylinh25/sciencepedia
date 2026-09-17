-- Từ điển thuật ngữ — định nghĩa ngắn hiện khi người đọc rê chuột vào `[[...]]`.
--
-- Migration này chỉ THÊM một bảng mới, không chạm bảng đang có, nên chạy được
-- trên CSDL production mà không khoá ghi.
--
-- `aliases` có chỉ mục GIN: trang bài viết tra mục từ bằng `aliases && ARRAY[...]`
-- (Prisma `hasSome`), và không có GIN thì đó là quét toàn bảng mỗi lần render.

-- CreateTable
CREATE TABLE "GlossaryTerm" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "termEn" TEXT,
    "shortDef" TEXT NOT NULL,
    "shortDefEn" TEXT,
    "fullDef" TEXT,
    "fullDefEn" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "image" TEXT,
    "imageCredit" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlossaryTerm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GlossaryTerm_slug_key" ON "GlossaryTerm"("slug");

-- CreateIndex
CREATE INDEX "GlossaryTerm_aliases_idx" ON "GlossaryTerm" USING GIN ("aliases");

-- CreateIndex
CREATE INDEX "GlossaryTerm_entityId_idx" ON "GlossaryTerm"("entityId");

-- AddForeignKey
-- ON DELETE SET NULL: xoá entity khỏi graph không được kéo theo định nghĩa.
-- Mục từ chỉ mất phần "bài viết liên quan" suy từ entity.
ALTER TABLE "GlossaryTerm" ADD CONSTRAINT "GlossaryTerm_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
