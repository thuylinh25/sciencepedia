"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { Role } from "@prisma/client";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { adminUserSchema, type AdminUserInput } from "@/lib/validations";
import { createUser } from "@/server/actions/taxonomy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Form tạo tài khoản, gập lại cho tới khi được bấm mở.
 *
 * ## Vì sao gập
 *
 * Trang này chủ yếu để XEM và sửa quyền; tạo tài khoản là việc hiếm. Một form
 * bốn ô luôn mở sẽ đẩy bảng người dùng — thứ người ta vào đây để nhìn — xuống
 * dưới nếp gấp mỗi lần mở trang.
 *
 * ## Vì sao mật khẩu hiện được
 *
 * `PasswordInput` có nút hiện/ẩn, và ở đây nó quan trọng hơn ở trang đăng
 * nhập: quản trị viên phải ĐỌC ĐƯỢC mật khẩu vừa đặt để chuyển cho người dùng.
 * Một ô che kín hoàn toàn buộc họ phải gõ mật khẩu ra chỗ khác trước, và chỗ
 * khác ấy thường là một tệp ghi chú không ai xoá.
 */
export function UserCreate() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdminUserInput>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: { name: "", email: "", password: "", role: "USER" },
  });

  const role = watch("role");

  const roleLabels: Record<Role, string> = {
    USER: t("roleUser"),
    EDITOR: t("roleEditor"),
    ADMIN: t("roleAdmin"),
  };

  function onSubmit(values: AdminUserInput) {
    startTransition(async () => {
      const result = await createUser(values);
      if (result.ok) {
        toast.success(t("userCreated"));
        reset();
        setOpen(false);
        router.refresh();
      } else {
        /* In đúng mã lỗi từ server thay vì một câu chung chung: "EMAIL_TAKEN"
           nói được việc phải làm tiếp, còn "Có lỗi xảy ra" thì không. */
        toast.error(
          result.error === "EMAIL_TAKEN" ? t("emailTaken") : result.error,
        );
      }
    });
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" />
        {t("addUser")}
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2"
    >
      <div className="space-y-1.5">
        <Label htmlFor="user-name">{t("userName")}</Label>
        <Input id="user-name" autoComplete="off" {...register("name")} />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="user-email">{t("userEmail")}</Label>
        <Input
          id="user-email"
          type="email"
          autoComplete="off"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="user-password">{t("userPassword")}</Label>
        <PasswordInput
          id="user-password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="user-role">{t("role")}</Label>
        <Select
          value={role}
          onValueChange={(value) =>
            setValue("role", value as Role, { shouldDirty: true })
          }
        >
          <SelectTrigger id="user-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["USER", "EDITOR", "ADMIN"] as Role[]).map((value) => (
              <SelectItem key={value} value={value}>
                {roleLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {t("addUser")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            reset();
            setOpen(false);
          }}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
