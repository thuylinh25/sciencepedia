"use client";

import type { ReactNode } from "react";

import { usePathname } from "@/i18n/navigation";
import { isFocusedRoute } from "@/lib/auth-routes";

/**
 * Chỗ đặt footer của site, bỏ trống trên các trang xác thực.
 *
 * ## Vì sao là Client Component
 *
 * Layout của Next chỉ nhận `params`, không biết đường dẫn đang render. Thứ
 * duy nhất đọc được đường dẫn trong cây này là `usePathname`, và nó đòi
 * `"use client"`. Đây cũng chính là cách `SiteHeader` đang quyết định khi nào
 * rút gọn — cùng một nguồn sự thật, cùng một danh sách route.
 *
 * ## Vì sao `<SiteFooter />` vẫn truyền qua `children`
 *
 * `SiteFooter` là Server Component có truy vấn CSDL. Truyền nó xuống dưới
 * dạng `children` giữ nguyên điều đó — một Client Component không import nổi
 * một Server Component, nhưng render được cái đã dựng sẵn đưa vào.
 *
 * Cái giá: trên trang xác thực, footer vẫn được dựng ở server rồi mới bị bỏ
 * đi ở client. Truy vấn thì không tốn thêm gì thật (`getRootCategories` và
 * `getSiteStats` đã được cache, và bốn route này đều tĩnh nên chỉ chạy lúc
 * build). Đổi lấy điều đó là không phải di dời hai mươi thư mục route sang
 * một route group mới chỉ để layout biết mình đang ở đâu — một phép cấu trúc
 * lại đúng đắn hơn về lý thuyết nhưng chạm vào toàn bộ cây định tuyến.
 */
export function FooterSlot({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isFocusedRoute(pathname)) return null;

  return <>{children}</>;
}
