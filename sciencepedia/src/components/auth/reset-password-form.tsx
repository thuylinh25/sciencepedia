"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

/**
 * Ô đặt mật khẩu mới.
 *
 * ## Vì sao token đọc bằng `window.location`, không bằng `useSearchParams`
 *
 * `useSearchParams` buộc cây component phải nằm trong `<Suspense>` và đẩy
 * route sang render động. Trang này là static và chỉ cần token ở phía client
 * sau khi đã hydrate, nên đọc thẳng từ URL trong `useEffect` là đủ và giữ được
 * trang ở dạng tĩnh.
 *
 * ## Vì sao kiểm độ mạnh mật khẩu ở CẢ hai phía
 *
 * Ở đây để người dùng biết ngay khi gõ; ở API vì kiểm phía client không phải
 * một lớp bảo vệ — ai cũng gọi thẳng endpoint được.
 */
export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  const weak =
    password.length > 0 &&
    (password.length < 8 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        setError(
          data.error === "EXPIRED"
            ? t("resetExpired")
            : data.error === "TOO_MANY_REQUESTS"
              ? t("tooManyRequests")
              : t("resetInvalid"),
        );
        return;
      }

      setDone(true);
      // Ba giây đủ để đọc dòng xác nhận, rồi tự sang trang đăng nhập.
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError(t("networkError"));
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border bg-muted/40 p-5">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary-strong" />
        <p className="text-sm leading-relaxed">{t("resetDone")}</p>
      </div>
    );
  }

  // Không có token thì không có gì để làm ở đây — đừng hiện một form vô dụng.
  if (!token) {
    return (
      <div className="space-y-5">
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {t("resetInvalid")}
        </p>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary-strong hover:underline"
        >
          {t("forgotTitle")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="new-password">{t("newPassword")}</Label>
        <PasswordInput
          id="new-password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">{t("passwordRule")}</p>
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={saving || weak}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        {t("savePassword")}
      </Button>
    </form>
  );
}
