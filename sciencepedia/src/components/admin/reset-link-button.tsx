"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Copy, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { issueResetLink } from "@/server/actions/taxonomy";
import { Button } from "@/components/ui/button";

/**
 * Nút sinh liên kết đặt lại mật khẩu cho một tài khoản.
 *
 * ## Vì sao liên kết hiện trên màn hình chứ không gửi thư
 *
 * Gửi thư chỉ chạy khi tên miền đã xác minh trong Resend. Trước đó, người dùng
 * mất mật khẩu không có đường nào lấy lại tài khoản. Đây là đường đó — quản
 * trị viên sinh liên kết rồi chuyển tay qua kênh họ tin được.
 *
 * ## Vì sao liên kết KHÔNG hiện sẵn mà phải bấm
 *
 * Nó là một mật khẩu tạm dùng được một lần. Hiện sẵn trên bảng người dùng
 * nghĩa là ai đứng sau lưng quản trị viên, hay bất kỳ ảnh chụp màn hình nào
 * của trang này, cũng chiếm được tài khoản. Mỗi lần bấm là một token MỚI và
 * token cũ bị huỷ, nên một liên kết đã lộ sẽ chết ngay lần bấm sau.
 *
 * ## Vì sao có nút chép
 *
 * Liên kết dài hơn 120 ký tự và bôi đen bằng tay rất dễ hụt một ký tự — một
 * token thiếu một ký tự thì báo "liên kết không hợp lệ", và người ta sẽ đổ lỗi
 * cho tính năng chứ không cho thao tác chép.
 */
export function ResetLinkButton({ email }: { email: string }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  function generate() {
    startTransition(async () => {
      const result = await issueResetLink(email, locale);
      if (result.ok) {
        setLink(result.data.link);
        setCopied(false);
      } else {
        toast.error(
          result.error === "NO_SUCH_USER" ? t("noSuchUser") : result.error,
        );
      }
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success(t("linkCopied"));
    } catch {
      // Clipboard API cần ngữ cảnh bảo mật; khi không có thì người dùng vẫn
      // bôi đen được ô chữ bên dưới.
      toast.error(t("copyFailed"));
    }
  }

  if (link) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <input
            readOnly
            value={link}
            onFocus={(event) => event.currentTarget.select()}
            className="w-full rounded-lg border bg-muted/40 px-2 py-1 font-mono text-[11px]"
          />
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={copy}
            aria-label={t("copyLink")}
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {t("resetLinkHint")}
        </p>
      </div>
    );
  }

  return (
    <Button size="sm" variant="ghost" onClick={generate} disabled={pending}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <KeyRound className="size-4" />
      )}
      {t("resetLink")}
    </Button>
  );
}
