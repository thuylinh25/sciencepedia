"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Github, Loader2 } from "lucide-react";

import { Link, useRouter } from "@/i18n/navigation";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function LoginForm({
  hasGithub,
  hasGoogle,
  hasFacebook,
}: {
  hasGithub: boolean;
  hasGoogle: boolean;
  hasFacebook: boolean;
}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);

    const result = await signIn("credentials", {
      ...values,
      redirect: false,
    });

    if (result?.error) {
      setServerError(t("invalidCredentials"));
      return;
    }

    router.push(searchParams.get("callbackUrl") ?? "/");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}

          {/* "Quên mật khẩu?" đặt NGAY DƯỚI ô mật khẩu, không ở cuối form.

              Người dùng đi theo đúng thứ tự này: gõ mật khẩu → sai → tìm lối
              thoát. Lối thoát ấy phải nằm ở chỗ mắt vừa rời đi. Đặt nó cạnh
              "Chưa có tài khoản? Đăng ký" ở cuối form thì họ phải quét lại cả
              form, và một số sẽ bỏ cuộc trước khi thấy. */}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary-strong"
            >
              {t("forgotLink")}
            </Link>
          </div>
        </div>

        {serverError && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {t("login")}
        </Button>
      </form>

      {(hasGithub || hasGoogle || hasFacebook) && (
        <>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {t("continueWith")}
            </span>
            <Separator className="flex-1" />
          </div>

          <div className="grid gap-2">
            {hasGithub && (
              <Button
                type="button"
                variant="outline"
                onClick={() => signIn("github", { callbackUrl: "/" })}
              >
                <Github className="size-4" />
                GitHub
              </Button>
            )}
            {hasFacebook && (
              <Button
                type="button"
                variant="outline"
                onClick={() => signIn("facebook", { callbackUrl: "/" })}
              >
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.9h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z"
                  />
                </svg>
                Facebook
              </Button>
            )}
            {hasGoogle && (
              <Button
                type="button"
                variant="outline"
                onClick={() => signIn("google", { callbackUrl: "/" })}
              >
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.98h5.27c-.23 1.37-1.6 4.02-5.27 4.02-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.81 0 3.02.77 3.71 1.44l2.53-2.44C16.85 3.86 14.72 3 12.18 3 6.98 3 2.77 7.2 2.77 12.4s4.21 9.4 9.41 9.4c5.43 0 9.03-3.82 9.03-9.2 0-.62-.07-1.09-.16-1.5Z"
                  />
                </svg>
                Google
              </Button>
            )}
          </div>
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-medium text-primary-strong">
          {t("register")}
        </Link>
      </p>
    </div>
  );
}
