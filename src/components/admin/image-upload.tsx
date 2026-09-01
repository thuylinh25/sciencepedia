"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

/**
 * Ô chọn ảnh cho khu quản trị: kéo thả hoặc bấm chọn, tải thẳng lên
 * Supabase Storage qua /api/upload, trả về public URL cho form.
 *
 * Vẫn cho phép dán URL ngoài (ảnh NASA, Unsplash…) — hostname phải được khai
 * báo trong next.config.ts thì <Image> mới hiển thị được.
 */
export function ImageUpload({
  value,
  onChange,
  prefix = "articles",
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  prefix?: string;
  className?: string;
}) {
  const t = useTranslations("admin.form");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function upload(file: File) {
    if (!ALLOWED.includes(file.type)) {
      toast.error(t("imageBadType"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t("imageTooLarge"));
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("prefix", prefix);

      const response = await fetch("/api/upload", { method: "POST", body });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "UPLOAD_FAILED");
      }

      onChange(data.url);
      toast.success(t("imageUploaded"));
    } catch (error) {
      const code = (error as Error).message;
      toast.error(
        code === "STORAGE_NOT_CONFIGURED" ? t("imageNotConfigured") : t("imageFailed"),
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  return (
    <div className={cn("space-y-3", className)}>
      {value ? (
        <div className="group relative overflow-hidden rounded-xl border">
          <div className="relative aspect-[16/9] bg-muted">
            <Image
              src={value}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 18rem"
              className="object-cover"
              // Ảnh do biên tập viên dán vào có thể ở host chưa khai báo;
              // khi đó next/image sẽ lỗi, nên bỏ tối ưu cho an toàn.
              unoptimized={!value.includes("/storage/v1/object/public/")}
            />
          </div>

          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              variant="glass"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="size-4" />
              {t("imageReplace")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => onChange("")}
              disabled={uploading}
            >
              <Trash2 className="size-4" />
              {t("imageRemove")}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={uploading}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors",
            dragging
              ? "border-accent bg-accent/10"
              : "hover:border-accent/60 hover:bg-muted/50",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t("imageUploading")}
              </span>
            </>
          ) : (
            <>
              <ImagePlus className="size-6 text-muted-foreground" />
              <span className="text-sm font-medium">{t("imageDropzone")}</span>
              <span className="text-xs text-muted-foreground">
                JPG · PNG · WebP · AVIF — tối đa 8 MB
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(",")}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">
          {t("imageOrUrl")}
        </label>
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://…"
          className="font-mono text-xs"
        />
      </div>
    </div>
  );
}
