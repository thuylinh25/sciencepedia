import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Tham số pool gắn thêm vào `DATABASE_URL` ngay trong mã.
 *
 * ## Vì sao phải làm ở đây chứ không sửa biến môi trường
 *
 * Build trên Vercel chết ở bước dựng 268 trang tĩnh, luôn quanh trang thứ 60:
 *
 *     P2024 — Timed out fetching a new connection from the connection pool
 *     (pool timeout: 10, connection limit: 13)
 *
 * `DATABASE_URL` trỏ pooler Supabase (cổng 6543, `pgbouncer=true`) và KHÔNG
 * khai `connection_limit`. Thiếu nó thì Prisma tự lấy `số CPU × 2 + 1`, ra 13
 * trên máy build. Next dựng trang tĩnh bằng nhiều worker song song, mỗi worker
 * một PrismaClient riêng — nên con số thật đập vào pooler là 13 nhân số
 * worker, vượt xa sức chứa của pooler ở gói Hobby.
 *
 * Đặt tham số vào URL trong mã thay vì sửa biến môi trường trên Vercel vì hai
 * lẽ: giá trị này là thuộc tính của CÁCH ứng dụng dùng CSDL, không phải của
 * môi trường triển khai — và để nó ở đây thì mọi môi trường (local, preview,
 * production) đều nhận cùng một hành vi, không phụ thuộc ai nhớ sửa dashboard.
 *
 * ## Vì sao HẠ `connection_limit` chứ không nâng
 *
 * Phản xạ đầu tiên là nâng giới hạn lên. Sai hướng: lỗi này là Prisma chờ quá
 * lâu để lấy được một kết nối RẢNH trong pool của chính nó, nghĩa là tất cả 13
 * kết nối đang bận — phía CSDL mới là chỗ nghẽn. Nâng giới hạn chỉ dồn thêm
 * kết nối vào pooler đang tắc và làm mọi truy vấn cùng chậm đi.
 *
 * 5 kết nối mỗi worker giữ tổng số nằm trong sức chứa pooler. Truy vấn thứ sáu
 * xếp hàng trong Prisma — chậm hơn, nhưng xếp hàng thì xong, còn tắc thì hỏng.
 *
 * `pool_timeout` nâng từ 10 lên 30 giây: lúc dựng tĩnh, một truy vấn chờ vài
 * giây là bình thường và không ai ngồi nhìn. Thà build lâu thêm một phút còn
 * hơn build hỏng.
 */
function datasourceUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;

  try {
    const url = new URL(raw);
    // Không ghi đè nếu đã khai sẵn — biến môi trường vẫn là tiếng nói cuối.
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "5");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "30");
    }
    return url.toString();
  } catch {
    // URL lạ dạng thì trả nguyên bản: mất phần chỉnh pool còn hơn mất kết nối.
    return raw;
  }
}

const url = datasourceUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(url ? { datasourceUrl: url } : {}),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
