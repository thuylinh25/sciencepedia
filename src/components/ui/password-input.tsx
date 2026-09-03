"use client";

// Client vì nút hiện/ẩn giữ state cục bộ. Là lá của cây form, không kéo theo
// gì lên trên.

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/**
 * Ô mật khẩu có nút hiện/ẩn.
 *
 * Ba điểm không hiển nhiên:
 *
 * 1. `type` đổi giữa "password" và "text" chứ không dùng thủ thuật CSS —
 *    trình quản lý mật khẩu nhận diện trường qua `type` và `autoComplete`,
 *    che bằng CSS sẽ làm chúng bỏ sót trường này.
 * 2. Nút là `tabIndex={-1}`. Người dùng bàn phím tab từ mật khẩu phải sang
 *    thẳng nút Đăng nhập; chen một nút phụ vào giữa làm chậm đúng luồng phổ
 *    biến nhất. Nút vẫn bấm được bằng chuột và vẫn đọc được bằng screen
 *    reader qua `aria-label`.
 * 3. Trạng thái luôn trả về "ẩn" khi submit xong không phải việc của component
 *    này — form tự unmount hoặc điều hướng đi.
 */
function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false);
  const t = useTranslations("auth");

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        // Chừa chỗ cho nút, nếu không chuỗi mật khẩu dài sẽ chạy xuống dưới nút
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        aria-pressed={visible}
        className={cn(
          "absolute inset-y-0 right-0 flex w-11 items-center justify-center",
          "rounded-r-xl text-muted-foreground transition-colors hover:text-foreground",
          "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
        )}
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}

export { PasswordInput };
