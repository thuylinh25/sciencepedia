"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Facebook, Link2, Share2, Twitter } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ShareBar({ title, url }: { title: string; url: string }) {
  const t = useTranslations("article");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t("linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyLink"));
    }
  }

  async function nativeShare() {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title, url });
    } catch {
      // Người dùng đóng hộp thoại chia sẻ — không phải lỗi
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 text-xs font-medium text-muted-foreground">
        {t("share")}
      </span>

      <Button
        variant="outline"
        size="icon-sm"
        onClick={copy}
        aria-label={t("copyLink")}
      >
        {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      </Button>

      <Button variant="outline" size="icon-sm" asChild>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="X / Twitter"
        >
          <Twitter className="size-4" />
        </a>
      </Button>

      <Button variant="outline" size="icon-sm" asChild>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Facebook"
        >
          <Facebook className="size-4" />
        </a>
      </Button>

      <Button
        variant="outline"
        size="icon-sm"
        onClick={nativeShare}
        className="sm:hidden"
        aria-label={t("share")}
      >
        <Share2 className="size-4" />
      </Button>
    </div>
  );
}
