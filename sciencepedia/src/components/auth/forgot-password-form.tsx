"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, MailCheck } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Ô xin liên kết đặt lại mật khẩu.
 *
 * ## Vì sao màn hình thành công KHÔNG nói "đã gửi tới email của bạn"
 *
 * Câu trả lời phải giống hệt nhau dù email có tài khoản hay không — nếu không,
 * ô này thành công cụ dò xem một địa chỉ có đăng ký ở đây hay chưa. Nên chữ
 * hiện ra là "nếu địa chỉ này có tài khoản, thư đang trên đường", và nó đúng
 * trong cả hai trường hợp.
 *
 * Cùng lý do, form không phân biệt lỗi gửi thư với thành công.
 */
export function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError("");

    try {
      const response = await fetch(`/api/auth/reset?locale=${locale}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.status === 429) {
        setError(t("tooManyRequests"));
        return;
      }

      setSent(true);
    } catch {
      setError(t("networkError"));
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-2xl border bg-muted/40 p-5">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-primary-strong" />
          <p className="text-sm leading-relaxed">{t("forgotSent")}</p>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-primary-strong hover:underline"
        >
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="forgot-email">{t("email")}</Label>
        <Input
          id="forgot-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={sending}>
        {sending && <Loader2 className="size-4 animate-spin" />}
        {t("sendResetLink")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary-strong">
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
