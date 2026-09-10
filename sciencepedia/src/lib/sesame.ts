import { z } from "zod";

/**
 * Sesame — dịch vụ giải tên thiên thể của CDS.
 *
 * Dùng làm lớp dự phòng cho `findSkyTarget`: danh mục viết cứng lo những cái
 * tên người đọc tìm nhiều nhất, Sesame lo phần đuôi dài (mọi thứ có trong
 * SIMBAD, NED và VizieR).
 *
 * ## Vì sao gọi thẳng từ trình duyệt chứ không qua route của chúng ta
 *
 * CDS trả `Access-Control-Allow-Origin: *`, nên trình duyệt gọi thẳng được.
 * Bọc thêm một route handler thì được cache và giấu được CDS, nhưng đổi lại
 * mỗi lượt tra cứu thành một lần chạy hàm serverless — trả tiền cho việc
 * chuyển tiếp một chuỗi 3 KB. Lượt tra cứu là thưa và người dùng chủ động,
 * nên không đáng.
 *
 * Đánh đổi phải biết trước: nếu CDS chặn origin của chúng ta hoặc đổi định
 * dạng, tính năng này ngừng chạy và ô tìm kiếm chỉ còn danh mục cứng — vẫn
 * đủ dùng, không vỡ trang.
 *
 * ## Định dạng
 *
 * `-oI` cho ra text thuần; dòng cần lấy bắt đầu bằng `%J`:
 *
 *     %J 187.70593077 +12.39112325 = 12 30 49.423  +12 23 28.04
 *
 * Hai số đầu là RA và Dec tính bằng độ, hệ ICRS/J2000.
 */
const SESAME_URL = "https://cds.unistra.fr/cgi-bin/nph-sesame/-oI/SNV";

/** Toạ độ hợp lệ mới được đi tiếp — Sesame là dữ liệu ngoài biên hệ thống. */
const resolvedSchema = z.object({
  ra: z.number().min(0).max(360),
  dec: z.number().min(-90).max(90),
});

export type SesameResult = z.infer<typeof resolvedSchema>;

/**
 * Giải một tên thành toạ độ, hoặc `null` nếu không có kết quả.
 *
 * Không ném lỗi: chỗ gọi là một ô tìm kiếm, và mọi lý do thất bại — không tìm
 * thấy, mạng hỏng, quá hạn — đều dẫn tới cùng một việc phải làm là báo "không
 * tìm thấy". Phân biệt chúng chỉ làm phức tạp chỗ gọi mà không đổi kết quả.
 */
export async function resolveObjectName(
  name: string,
  signal?: AbortSignal,
): Promise<SesameResult | null> {
  const query = name.trim();
  if (!query) return null;

  try {
    const response = await fetch(
      `${SESAME_URL}?${encodeURIComponent(query)}`,
      {
        signal: signal ?? AbortSignal.timeout(8000),
        headers: { Accept: "text/plain" },
      },
    );
    if (!response.ok) return null;

    const text = await response.text();
    const match = text.match(/^%J\s+([\d.+-]+)\s+([\d.+-]+)/m);
    if (!match) return null;

    const parsed = resolvedSchema.safeParse({
      ra: Number(match[1]),
      dec: Number(match[2]),
    });

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
