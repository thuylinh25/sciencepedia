"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Link, useRouter } from "@/i18n/navigation";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setServerError(
        data.error === "EMAIL_TAKEN" ? t("emailTaken") : t("invalidCredentials"),
      );
      return;
    }

    toast.success(t("registerSuccess"));

    // Đăng nhập luôn để người dùng không phải nhập lại
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    router.push(result?.error ? "/login" : "/");
    router.refresh();
  }

  const fields = [
    { name: "name" as const, label: t("name"), type: "text", autoComplete: "name" },
    { name: "email" as const, label: t("email"), type: "email", autoComplete: "email" },
    {
      name: "password" as const,
      label: t("password"),
      type: "password",
      autoComplete: "new-password",
    },
    {
      name: "confirmPassword" as const,
      label: t("confirmPassword"),
      type: "password",
      autoComplete: "new-password",
    },
  ];

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              aria-invalid={Boolean(errors[field.name])}
              {...register(field.name)}
            />
            {errors[field.name] && (
              <p className="text-xs text-destructive">
                {errors[field.name]?.message}
              </p>
            )}
          </div>
        ))}

        {serverError && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {t("register")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-primary">
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
