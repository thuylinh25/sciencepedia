import { defineRouting } from "next-intl/routing";

export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  // Tắt dò theo Accept-Language: đây là bách khoa toàn thư tiếng Việt, người
  // đọc mở bằng trình duyệt đặt tiếng Anh vẫn phải vào bản tiếng Việt trước.
  // Bật lên thì một máy cài tiếng Anh sẽ bị đẩy sang /en — nơi phần lớn bài
  // chưa có contentEn, tức là một kho gần như trống.
  localeDetection: false,
});
