"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import type { Role } from "@prisma/client";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { updateUserRole } from "@/server/actions/taxonomy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: Role;
  disabled?: boolean;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const labels: Record<Role, string> = {
    USER: t("roleUser"),
    EDITOR: t("roleEditor"),
    ADMIN: t("roleAdmin"),
  };

  function change(next: string) {
    startTransition(async () => {
      const result = await updateUserRole(userId, next as Role);
      if (result.ok) {
        toast.success(t("saved"));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Select
      value={role}
      onValueChange={change}
      disabled={disabled || pending}
    >
      <SelectTrigger size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(["USER", "EDITOR", "ADMIN"] as Role[]).map((value) => (
          <SelectItem key={value} value={value}>
            {labels[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
