-- Bộ đếm lượt xem công khai theo mô hình/công cụ tương tác (bảng tổng quan
-- admin, mục "Lượt xem theo mô hình").
--
-- Một hàng cho mỗi `toolId` trong registry `src/lib/models.ts`, cộng dồn bằng
-- INSERT ... ON CONFLICT trong `incrementToolViews` (`src/server/queries.ts`)
-- — khoá chính `toolId` vừa là chống trùng vừa là đích của ON CONFLICT.
--
-- Tên/màu của công cụ KHÔNG nằm ở đây: registry trong code là nguồn sự thật,
-- bảng chỉ giữ con số. Hàng được tạo lười ở lượt xem đầu tiên; công cụ chưa ai
-- xem thì không có hàng, phía đọc tự hiểu là 0.
--
-- Chỉ CỘNG THÊM: bảng mới, không đụng bảng nào đang có. Bảng rỗng lúc tạo.
--
-- RLS bật, KHÔNG có policy — cùng tiền lệ `ContentActivity`: Supabase phơi
-- schema `public` qua PostgREST, và bộ đếm chỉ nên đổi qua route của app.
-- Prisma kết nối bằng role chủ bảng nên không bị RLS chặn (không FORCE).

-- CreateTable
CREATE TABLE "ToolViewStat" (
    "toolId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolViewStat_pkey" PRIMARY KEY ("toolId")
);

ALTER TABLE "ToolViewStat" ENABLE ROW LEVEL SECURITY;
