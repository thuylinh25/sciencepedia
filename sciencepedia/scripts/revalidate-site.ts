/**
 * Báo cho site đang chạy rằng bài viết vừa đổi trong CSDL.
 *
 * Script ghi CSDL chạy ngoài Next nên không gọi được `revalidateTag`. Không báo
 * thì trang chủ vẫn hiện bản cũ tới 2 phút, trang bài tới 5 phút — và lượt
 * truy cập đầu tiên sau đó vẫn nhận bản cũ (stale-while-revalidate). Hàm này
 * gọi `POST /api/revalidate`, tức đúng `revalidateArticles` mà form quản trị
 * dùng: một cơ chế, không phải hai.
 *
 * Cần `CRON_SECRET` (cùng giá trị trên Vercel) và `NEXT_PUBLIC_SITE_URL` trong
 * `.env`; `REVALIDATE_URL` ghi đè URL khi muốn trỏ vào máy local.
 *
 * KHÔNG ném lỗi: lúc gọi tới đây CSDL đã ghi xong, báo thất bại sẽ khiến
 * người gọi tưởng việc ghi hỏng và làm lại. Thiếu cấu hình hay gọi hỏng thì in
 * cảnh báo to, kèm lệnh chạy lại, và trả `false`.
 */
export async function revalidateSite(slugs: readonly string[]): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const base = process.env.REVALIDATE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const unique = [...new Set(slugs)];
  const retry = `npm run revalidate --${unique.slice(0, 3).map((s) => ` --slug ${s}`).join("")}${unique.length > 3 ? " …" : ""}`;

  if (!secret || !base) {
    console.warn(
      "\n⚠ CHƯA làm mới cache site: thiếu CRON_SECRET hoặc NEXT_PUBLIC_SITE_URL trong .env.\n" +
        "  Trang chủ tự cập nhật sau ≤ 2 phút, trang bài ≤ 5 phút.\n" +
        `  Muốn ngay: đặt CRON_SECRET (giá trị trên Vercel) rồi chạy  ${retry}`,
    );
    return false;
  }

  // Chia lô theo giới hạn của route (MAX_SLUGS); không có slug vẫn gửi một lô
  // để trang chủ và danh sách được làm mới.
  const batches: string[][] = [];
  for (let i = 0; i < unique.length; i += 100) batches.push(unique.slice(i, i + 100));
  if (batches.length === 0) batches.push([]);

  try {
    const revalidated: string[] = [];
    for (const batch of batches) {
      const response = await fetch(new URL("/api/revalidate", base), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slugs: batch }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${await response.text()}`);
      }
      const body = (await response.json()) as { revalidated: string[] };
      revalidated.push(...body.revalidated);
    }
    console.log(
      `✓ Đã làm mới cache ${new URL(base).host}: trang chủ, danh sách bài` +
        (revalidated.length ? `, ${revalidated.length} trang bài` : ""),
    );
    return true;
  } catch (error) {
    console.warn(
      `\n⚠ Làm mới cache site THẤT BẠI (${(error as Error).message}).\n` +
        "  CSDL đã ghi xong; trang chủ tự cập nhật sau ≤ 2 phút, trang bài ≤ 5 phút.\n" +
        `  Chạy lại:  ${retry}`,
    );
    return false;
  }
}
