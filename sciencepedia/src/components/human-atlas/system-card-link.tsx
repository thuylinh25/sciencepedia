"use client";
// Client vì cần onClick: bấm lại thẻ của hệ đang có trong URL phải áp lại hệ đó
// (URL không đổi thì viewer không biết người đọc vừa bấm).

import type { ComponentProps } from "react";

import { Link } from "@/i18n/navigation";
import { SYSTEM_REAPPLY_EVENT } from "@/lib/human-atlas/systems";
import type { SystemId } from "@/lib/human-atlas/anatomy";

export function SystemCardLink({
  system,
  onClick,
  ...props
}: ComponentProps<typeof Link> & { system: SystemId }) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (new URLSearchParams(window.location.search).get("system") !== system) return;
        // Cùng URL: bỏ điều hướng (router đi tới chính nó rồi đặt lại vị trí cuộn,
        // đè mất lệnh cuộn bên dưới), áp lại hệ và tự cuộn về khung xem.
        event.preventDefault();
        window.dispatchEvent(new CustomEvent<SystemId>(SYSTEM_REAPPLY_EVENT, { detail: system }));
        document.getElementById("atlas-viewer")?.scrollIntoView({ behavior: "instant" });
      }}
    />
  );
}
