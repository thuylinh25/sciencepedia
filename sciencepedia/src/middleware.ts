import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Bỏ qua api, _next, và mọi file tĩnh có phần mở rộng
  matcher: ["/", "/(vi|en)/:path*", "/((?!api|_next|_vercel|.*\..*).*)"],
};
