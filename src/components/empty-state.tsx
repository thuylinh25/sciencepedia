import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Trạng thái "không có gì để hiện", dùng chung cho mọi trang.
 *
 * Trước đây mỗi nơi tự chế một kiểu: lưới bài viết có icon + một dòng chữ,
 * trang tìm kiếm có một thẻ <p> trần, trang đã lưu thì mượn luôn câu của lưới
 * bài viết ("Chưa có bài viết nào ở đây") — câu đó nói sai chuyện đang xảy ra.
 *
 * Hai quy tắc gói trong component này:
 *  1. Trạng thái rỗng phải nói ĐANG THIẾU GÌ, không nói chung chung.
 *  2. Trạng thái rỗng không bao giờ là ngõ cụt — luôn có ít nhất một lối đi
 *     tiếp (`children`).
 *
 * Server Component: chỉ hiển thị.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
  bordered = true,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  /** Lối đi tiếp: link duyệt lĩnh vực, nút quay lại, gợi ý tìm kiếm… */
  children?: ReactNode;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 px-6 py-16 text-center",
        bordered && "rounded-2xl border border-dashed",
        className,
      )}
    >
      {Icon && <Icon className="size-10 text-muted-foreground/60" aria-hidden />}

      <div className="space-y-1.5">
        <p className="font-display text-lg font-semibold text-balance">
          {title}
        </p>
        {description && (
          <p className="mx-auto max-w-md text-sm text-pretty text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}
