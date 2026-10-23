"use client";

// Client: đổi "Cách vẽ" là đổi state của trình xem, vốn chỉ sống ở client.

import { useTranslations } from "next-intl";

import { ATLAS_LOOKS, type AtlasLook } from "@/lib/human-atlas/anatomy";
import { Button } from "@/components/ui/button";

/**
 * Cách vẽ lớp bối cảnh: Đặc (mặc định) · Bán trong suốt · Xuyên thấu.
 *
 * Nằm trong bảng bên trái (danh sách hệ và bảng "Cấu trúc"), không chỉ trên cột nút
 * bên phải: cột ấy ẩn bớt nút ở màn thấp (đã chạm nút trợ lý AI), còn bảng thì mở được
 * ở mọi khổ màn — điện thoại, xoay ngang (2026-10-23).
 */
export function LookPicker({ look, onChange }: { look: AtlasLook; onChange: (look: AtlasLook) => void }) {
  const t = useTranslations("humanAtlas");
  return (
    <div role="group" aria-label={t("look")} className="flex flex-wrap items-center gap-1 border-t py-2">
      {/* Xoay ngang: bảng hẹp, nhãn đẩy nút thứ ba xuống dòng — nhóm vẫn có aria-label. */}
      <span className="mr-0.5 px-1 text-xs text-muted-foreground atlas-short:sr-only">{t("look")}</span>
      {ATLAS_LOOKS.map((id) => (
        <Button
          key={id}
          size="sm"
          variant={look === id ? "secondary" : "ghost"}
          className="h-7 px-2 text-xs"
          aria-pressed={look === id}
          title={t(`lookHints.${id}`)}
          onClick={() => onChange(id)}
        >
          {t(`looks.${id}`)}
        </Button>
      ))}
    </div>
  );
}
