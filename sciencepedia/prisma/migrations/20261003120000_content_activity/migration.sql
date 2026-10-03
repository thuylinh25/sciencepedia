-- Lịch sử xem nội dung của người dùng đã đăng nhập (bài viết, mô hình Atlas).
--
-- Một hàng cho mỗi (userId, contentType, contentId), cập nhật dồn bằng
-- INSERT ... ON CONFLICT trong `src/server/activity.ts` — khoá UNIQUE dưới đây
-- vừa là chống trùng vừa là đích của ON CONFLICT, nên hai tab ghi cùng lúc
-- không tạo được hai hàng.
--
-- Chỉ CỘNG THÊM: bảng mới, enum mới, không đụng bảng nào đang có. Bảng rỗng
-- lúc tạo nên CREATE INDEX không khoá gì đáng kể.
--
-- RLS bật, KHÔNG có policy: Supabase phơi schema `public` qua PostgREST, và đây
-- là dữ liệu hành vi cá nhân — khoá anon/authenticated không được đọc nó.
-- Prisma kết nối bằng role chủ bảng nên không bị RLS chặn (không FORCE).

-- CreateEnum
CREATE TYPE "ActivityContentType" AS ENUM ('ARTICLE', 'MODEL');

-- CreateTable
CREATE TABLE "ContentActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentType" "ActivityContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "label" TEXT,
    "firstViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewCount" INTEGER NOT NULL DEFAULT 1,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContentActivity_pkey" PRIMARY KEY ("id")
);

-- Trang chi tiết của admin: lịch sử một người, mới nhất trước
CREATE INDEX "ContentActivity_userId_lastViewedAt_idx" ON "ContentActivity"("userId", "lastViewedAt" DESC);

-- Chống trùng + đích ON CONFLICT; tiền tố (userId, contentType) cũng phục vụ
-- phép đếm theo loại ở bảng Users — không cần chỉ mục riêng cho contentType.
CREATE UNIQUE INDEX "ContentActivity_userId_contentType_contentId_key" ON "ContentActivity"("userId", "contentType", "contentId");

-- AddForeignKey
ALTER TABLE "ContentActivity" ADD CONSTRAINT "ContentActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContentActivity" ENABLE ROW LEVEL SECURITY;
