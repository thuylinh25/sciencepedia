import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "Asia/Ho_Chi_Minh",
    // KHÔNG đặt `now` ở đây. next-intl serialize nó vào RSC/HTML của MỌI trang
    // ("now":"$D…"), nên mỗi lượt tái dựng ISR ra output khác dù dữ liệu y hệt —
    // và Vercel tính ISR Write cho mọi output đổi (docs/architecture.md, mục
    // "ISR phải tất định"). Cần thời gian tương đối thì truyền `now` tại chỗ.
  };
});
