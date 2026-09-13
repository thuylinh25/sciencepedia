"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Cờ "đã tự tải lại một lần trong phiên này".
 *
 * Một cờ cho cả phiên, không phải một cờ cho mỗi lỗi: nếu lỗi không phải do
 * chunk cũ thì lần tải lại thứ hai cũng hỏng y hệt, và vòng lặp tải lại là
 * thứ tệ hơn hẳn một màn hình báo lỗi đứng yên. Đổi lại, lỗi chunk thứ hai
 * trong cùng một phiên sẽ không được tự chữa — người dùng còn nút "Thử lại".
 */
const RELOAD_FLAG = "sciencepedia:chunk-reloaded";

/**
 * Lỗi tải chunk: mã của trang đã đổi kể từ lúc tab này mở.
 *
 * Đây là lỗi phổ biến nhất ngay sau một lượt deploy, và nó luôn trông như một
 * lỗi ứng dụng dù ứng dụng không sai gì: trình duyệt giữ HTML cũ trong cache
 * (rất hay gặp trên điện thoại, nơi tab sống hàng tuần), HTML ấy trỏ tới các
 * tệp JS mang hash cũ, và bản deploy mới không còn tệp nào mang hash đó.
 *
 * Nhận diện bằng cả `name` lẫn `message` vì mỗi trình duyệt đặt một kiểu:
 * Chrome ném `ChunkLoadError`, Safari nói "Importing a module script failed",
 * Firefox nói "error loading dynamically imported module".
 */
function isChunkError(error: Error): boolean {
  if (error.name === "ChunkLoadError") return true;

  return /loading chunk|loading css chunk|dynamically imported module|module script failed/i.test(
    error.message,
  );
}

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    // Trong production hãy đẩy sang Sentry/Axiom thay vì chỉ log ra console
    console.error("[boundary]", error);

    if (!isChunkError(error)) return;

    try {
      if (sessionStorage.getItem(RELOAD_FLAG)) return;
      sessionStorage.setItem(RELOAD_FLAG, "1");
    } catch {
      // Chặn cookie/lưu trữ thì không có chỗ ghi cờ, mà không có cờ thì không
      // bảo đảm được là chỉ tải lại một lần. Thà không tự chữa còn hơn quay
      // vòng vô hạn.
      return;
    }

    setReloading(true);
    // `reset()` không cứu được lỗi chunk: nó dựng lại cây React bằng đúng
    // những tệp JS đã không tải được. Phải nạp lại trang để lấy HTML mới kèm
    // hash mới.
    window.location.reload();
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="size-12 text-destructive" />
      <h1 className="font-display text-2xl font-bold">
        {reloading ? t("errorReloading") : t("error")}
      </h1>

      {!reloading && <Button onClick={reset}>{t("retry")}</Button>}

      {/* Chi tiết kỹ thuật, gập lại.

          Trên điện thoại không có devtools, nên khi lỗi chỉ xảy ra ở đó thì
          màn hình này là kênh DUY NHẤT đưa được thông tin về. Bản trước chỉ in
          `digest` — mà digest chỉ tồn tại với lỗi phía server, đúng nửa không
          xảy ra trên máy người dùng. Một ảnh chụp màn hình báo "Đã có lỗi xảy
          ra" không kèm gì khác thì không chẩn đoán được gì, và đã mất một lượt
          hỏi đi hỏi lại vì thế.

          Gập lại vì người đọc bình thường không cần nó; ai đang báo lỗi thì mở
          ra chụp một tấm là đủ. */}
      <details className="group mt-2 max-w-full">
        <summary className="cursor-pointer list-none text-xs text-muted-foreground underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
          {t("errorDetails")}
        </summary>
        <p className="mt-2 max-w-xl font-mono text-xs leading-relaxed break-words text-muted-foreground">
          {error.name}: {error.message}
          {error.digest && (
            <>
              <br />
              digest {error.digest}
            </>
          )}
        </p>
      </details>
    </div>
  );
}
