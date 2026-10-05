"use client";

// Client: khung atlas chỉ được tải khi người đọc bấm — trước đó đây là một nút,
// không một byte nào của three.js hay mô hình giải phẫu đi kèm trang bài.

import { useEffect, useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Box, Loader2, Maximize2, X } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * Bản đồ cơ thể người nhúng ngay trong bài, tại chỗ link
 * `[…](/human-atlas?structure=…#atlas-embed)` do `npm run spine:build` sinh.
 *
 * ## Vì sao iframe tới chính trang `/human-atlas?embed=1`
 *
 * Bố cục atlas đáp ứng theo CỠ MÀN HÌNH (`atlas-wide`, `atlas-phone` là media query),
 * không theo cỡ khung chứa. Dựng component thẳng vào một khung 640 px trên màn hình
 * rộng thì nó vẫn bày đủ giao diện desktop — đã thử, bảng hệ và tiêu đề che nửa mô
 * hình. Iframe có viewport riêng, nên atlas tự chọn đúng bố cục cho cỡ khung; URL
 * (`?structure=`, `?view=`) đổi trong iframe, không chạm URL trang bài. Cùng một
 * trang, cùng mô hình trên R2 (đệm `immutable`) — không có bản sao model nào.
 *
 * ## Vì sao bấm mới tải, và mỗi lúc một khung
 *
 * Atlas là ~3.500 dòng client cộng danh mục và ~10 MB hình học — nhúng sẵn vào bài
 * là bắt người chỉ đọc chữ tải cả mô hình (yêu cầu gốc: "chỉ load Atlas khi người
 * dùng yêu cầu"). Mỗi khung là một WebGL context; mở khung mới thì khung cũ đóng.
 */
const OPEN_EVENT = "atlas-embed:open";

export function AtlasEmbed({ href, label }: { href: string; label: string }) {
  const t = useTranslations("article.atlasEmbed");
  const locale = useLocale();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const structure = new URL(href, "https://x.invalid").searchParams.get("structure") ?? "";

  useEffect(() => {
    const onOpen = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) setOpen(false);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [id]);

  if (!structure) return null;
  const query = `structure=${encodeURIComponent(structure).replace(/%2C/g, ",")}`;

  const show = () => {
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
    setLoaded(false);
    setOpen(true);
  };

  return (
    <div className="not-prose my-6">
      {!open ? (
        <Button type="button" variant="outline" onClick={show} className="h-auto min-h-10 whitespace-normal">
          <Box aria-hidden />
          {label.replace(/\s*→\s*$/, "")}
        </Button>
      ) : (
        <figure className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5">
            <figcaption className="text-xs text-muted-foreground">{t("caption")}</figcaption>
            <div className="flex shrink-0 items-center gap-1">
              <Button asChild size="sm" variant="ghost">
                <Link href={`/human-atlas?${query}#atlas-viewer`}>
                  <Maximize2 aria-hidden />
                  <span className="max-sm:sr-only">{t("fullscreen")}</span>
                </Link>
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label={t("close")}>
                <X aria-hidden />
              </Button>
            </div>
          </div>
          <div className="relative h-[70vh] max-h-[640px] min-h-[420px] bg-[#eef0f1] dark:bg-[#05070a]">
            {!loaded && (
              <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground" role="status">
                <span className="flex items-center gap-2">
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                  {t("loading")}
                </span>
              </div>
            )}
            <iframe
              src={`/${locale}/human-atlas?embed=1&${query}`}
              title={t("caption")}
              onLoad={() => setLoaded(true)}
              allow="fullscreen"
              className={`absolute inset-0 size-full border-0 transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
            />
          </div>
        </figure>
      )}
    </div>
  );
}
