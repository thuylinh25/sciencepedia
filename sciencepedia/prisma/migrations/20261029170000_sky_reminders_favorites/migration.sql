-- Nhắc sự kiện thiên văn + thiên thể yêu thích cho người dùng đã đăng nhập
-- (mục chiến lược S1 của Mô phỏng bầu trời).
--
-- SkyEventReminder: một hàng cho mỗi (userId, eventId) — ảnh chụp tên/mốc/
-- múi giờ của sự kiện tại lúc đặt nhắc, vì events.ts tính lại sự kiện mỗi
-- lần mở trang còn thư nhắc phải gửi đúng mốc đã hứa. Cron hằng ngày
-- (/api/cron/sky-reminders) chọn các hàng `sentAt` trống mà `eventInstant`
-- còn cách ≤36 giờ, gửi một thư gộp cho mỗi người rồi đóng dấu `sentAt`.
--
-- SkyFavorite: chỉ giữ `targetId` là id trong catalog thiên thể phía code;
-- tên hiển thị tra lại từ catalog nên đổi tên không phải sửa dữ liệu.
--
-- Chỉ CỘNG THÊM: hai bảng mới, không đụng bảng nào đang có. Bảng rỗng lúc
-- tạo nên CREATE INDEX không khoá gì đáng kể.
--
-- RLS bật, KHÔNG có policy — cùng tiền lệ ContentActivity/ToolViewStat:
-- Supabase phơi schema `public` qua PostgREST, và đây là dữ liệu cá nhân
-- chỉ được đổi qua route của app bằng session của chính người dùng.
-- Prisma kết nối bằng role chủ bảng nên không bị RLS chặn (không FORCE).

-- CreateTable
CREATE TABLE "SkyEventReminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "eventInstant" TIMESTAMP(3) NOT NULL,
    "tz" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'vi',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkyEventReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkyFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkyFavorite_pkey" PRIMARY KEY ("id")
);

-- Cron quét các nhắc chưa gửi theo mốc sự kiện
CREATE INDEX "SkyEventReminder_eventInstant_sentAt_idx" ON "SkyEventReminder"("eventInstant", "sentAt");

-- Chống trùng: một người chỉ đặt một nhắc cho một sự kiện
CREATE UNIQUE INDEX "SkyEventReminder_userId_eventId_key" ON "SkyEventReminder"("userId", "eventId");

-- Danh sách yêu thích của một người, mới nhất trước
CREATE INDEX "SkyFavorite_userId_createdAt_idx" ON "SkyFavorite"("userId", "createdAt");

-- Chống trùng: một người chỉ lưu một lần cho một thiên thể
CREATE UNIQUE INDEX "SkyFavorite_userId_targetId_key" ON "SkyFavorite"("userId", "targetId");

-- AddForeignKey
ALTER TABLE "SkyEventReminder" ADD CONSTRAINT "SkyEventReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkyFavorite" ADD CONSTRAINT "SkyFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SkyEventReminder" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "SkyFavorite" ENABLE ROW LEVEL SECURITY;
