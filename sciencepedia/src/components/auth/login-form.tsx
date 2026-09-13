"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Github, Loader2, Lock, Mail } from "lucide-react";

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

  const hasSocial = hasGithub || hasGoogle || hasFacebook;

  return (
    <div className="space-y-5 short:space-y-4 shorter:space-y-2">
      {/* Đăng nhập mạng xã hội đứng TRƯỚC form email.

          Thứ tự này là một phán quyết chứ không phải thẩm mỹ: người đã có tài
          khoản Google chỉ cần một cú bấm, còn form email đòi hai ô và một lần
          nhớ mật khẩu. Đặt đường rẻ nhất ở trên thì phần lớn người dùng không
          bao giờ phải đọc tới phần dưới.

          Cả khối chỉ hiện khi biến môi trường của nhà cung cấp thật sự có —
          `hasGoogle` và bạn của nó suy từ `process.env` ở `login/page.tsx`.
          Đây KHÔNG phải sự thận trọng thừa: đo ngày 2026-09-12 thì bản
          production trả về đúng một nhà cung cấp (`credentials`), nên một nút
          "Tiếp tục với Google" hiện vô điều kiện sẽ dẫn thẳng tới
          `/login?error=Configuration`. Một nút hứa thứ chưa chạy còn tệ hơn
          không có nút. */}
      {hasSocial && (
        <>
          <div className="grid gap-2 shorter:gap-1.5">
            {hasGoogle && (
              <Button
                type="button"
                variant="outline"
                className="w-full shorter:h-9"
                onClick={() => signIn("google", { callbackUrl: "/" })}
              >
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.98h5.27c-.23 1.37-1.6 4.02-5.27 4.02-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.81 0 3.02.77 3.71 1.44l2.53-2.44C16.85 3.86 14.72 3 12.18 3 6.98 3 2.77 7.2 2.77 12.4s4.21 9.4 9.41 9.4c5.43 0 9.03-3.82 9.03-9.2 0-.62-.07-1.09-.16-1.5Z"
                  />
                </svg>
                {t("continueWithProvider", { provider: "Google" })}
              </Button>
            )}
            {hasGithub && (
              <Button
                type="button"
                variant="outline"
                className="w-full shorter:h-9"
                onClick={() => signIn("github", { callbackUrl: "/" })}
              >
                <Github className="size-4" />
                {t("continueWithProvider", { provider: "GitHub" })}
              </Button>
            )}
            {hasFacebook && (
              <Button
                type="button"
                variant="outline"
                className="w-full shorter:h-9"
                onClick={() => signIn("facebook", { callbackUrl: "/" })}
              >
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.9h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z"
                  />
                </svg>
                {t("continueWithProvider", { provider: "Facebook" })}
              </Button>
            )}
          </div>

          {/* Dấu phân cách chỉ một chữ "Hoặc".

              Chữ cũ là "Hoặc tiếp tục với" — đúng khi khối mạng xã hội đứng
              SAU form, vì nó dẫn vào các nút phía dưới. Nay thứ tự đảo lại nên
              câu ấy trỏ nhầm hướng: thứ đứng dưới dấu phân cách là form email,
              không phải các nút. Một chữ "Hoặc" không trỏ hướng nào cả, nên nó
              đúng ở cả hai bố cục. */}
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">{t("or")}</span>
            <Separator className="flex-1" />
          </div>
        </>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 shorter:space-y-2"
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          {/* Icon nằm trong một ngăn riêng bên trái, ngăn cách bằng một vạch
              đứng — không phải icon thả nổi đè lên chỗ gõ chữ.

              Vạch ấy làm một việc cụ thể: nó cho con trỏ chuột biết chỗ nào
              bấm được để gõ. Icon thả nổi trong ô thì vùng bên trái nó trông
              như vẫn gõ được, và người dùng bấm vào đó rồi thấy con trỏ nhảy
              ra sau icon.

              `pointer-events-none` để bấm vào icon vẫn rơi vào ô nhập phía
              sau. Icon sáng lên theo ô qua `group-focus-within` đặt trên thẻ
              bọc — KHÔNG dùng `peer-focus` được, vì `peer-*` của Tailwind chỉ
              với tới phần tử ĐỨNG SAU phần tử mang `peer`, mà icon thì đứng
              trước ô nhập. */}
          <div className="group relative">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-11 items-center justify-center border-r border-input text-muted-foreground transition-colors group-focus-within:text-foreground"
            >
              <Mail className="size-4" />
            </span>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              className="h-12 bg-input/30 pl-14 shorter:h-10"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <div className="group relative">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-11 items-center justify-center border-r border-input text-muted-foreground transition-colors group-focus-within:text-foreground"
            >
              <Lock className="size-4" />
            </span>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              className="h-12 bg-input/30 pl-14 shorter:h-10"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}

          {/* "Quên mật khẩu?" đặt NGAY DƯỚI ô mật khẩu, không ở cuối form.

              Người dùng đi theo đúng thứ tự này: gõ mật khẩu → sai → tìm lối
              thoát. Lối thoát ấy phải nằm ở chỗ mắt vừa rời đi. Đặt nó cạnh
              "Chưa có tài khoản? Đăng ký" ở cuối form thì họ phải quét lại cả
              form, và một số sẽ bỏ cuộc trước khi thấy.

              Màu nâng từ `text-muted-foreground` lên `text-foreground/80`:
              ở mức cũ nó tụt xuống dưới ngưỡng dễ nhận trên nền thẻ, mà đây là
              lối thoát duy nhất của người quên mật khẩu. Vẫn dưới CTA chính
              một bậc — nó là `text-xs` và không có nền, nên không tranh chỗ. */}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-foreground/80 underline-offset-4 transition-colors hover:text-primary-strong hover:underline"
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

        {/* Nút đổi CHỮ khi đang gửi, không chỉ thêm spinner.

            Spinner một mình nói "có gì đó đang chạy"; nó không nói cái gì đang
            chạy. Trên một form đăng nhập, khoảng lặng giữa lúc bấm và lúc
            chuyển trang là đúng lúc người ta nghi trang bị treo và bấm lần
            hai. Chữ "Đang đăng nhập…" trả lời thẳng câu hỏi ấy.

            `disabled` chặn lần bấm thứ hai — `signIn` không idempotent, hai
            lượt gửi song song cho hai kết quả đua nhau. */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl text-base font-semibold shorter:h-10"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("loggingIn")}
            </>
          ) : (
            <>
              {t("login")}
              {/* Mũi tên chỉ ở trạng thái nghỉ. Lúc đang gửi, chỗ của nó là
                  spinner — giữ cả hai thì nút có hai thứ chuyển động cạnh
                  nhau và không thứ nào nói rõ điều gì. */}
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </form>

      {/* "Đăng ký" mang màu vàng thương hiệu và gạch chân khi rê chuột.

          Trước đây nó là `font-medium text-primary-strong` — cùng bậc với
          "Quên mật khẩu?", nên hai lối đi rất khác nhau trông như nhau. Người
          chưa có tài khoản mà không tìm ra nút đăng ký thì rời trang, và đó là
          mất mát đắt nhất trên chính trang này.

          Vẫn là LINK chứ không phải nút đặc: một trang đăng nhập chỉ được có
          một nút chính. Nâng nó thành nút thứ hai là buộc người ta chọn giữa
          hai khối màu vàng ngang nhau. */}
      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link
          href="/register"
          className="font-semibold text-primary underline-offset-4 transition-colors hover:text-primary-strong hover:underline"
        >
          {t("register")}
        </Link>
      </p>
    </div>
  );
}
