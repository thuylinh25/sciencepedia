"use client";

import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function BookmarkButton({ articleId }: { articleId: string }) {
  const t = useTranslations("article");
  const tAuth = useTranslations("auth");
  const { status } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();

    fetch(`/api/bookmarks?articleId=${articleId}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : { saved: false }))
      .then((data: { saved: boolean }) => setSaved(data.saved))
      .catch(() => undefined);

    return () => controller.abort();
  }, [articleId, status]);

  function toggle() {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    const next = !saved;
    setSaved(next); // cập nhật lạc quan, hoàn tác nếu request hỏng

    startTransition(async () => {
      try {
        const res = await fetch("/api/bookmarks", {
          method: next ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId }),
        });
        if (!res.ok) throw new Error(await res.text());
        toast.success(next ? t("bookmarked") : t("bookmark"));
      } catch {
        setSaved(!next);
        toast.error(tAuth("invalidCredentials"));
      }
    });
  }

  return (
    <Button
      variant={saved ? "accent" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
    >
      {saved ? (
        <BookmarkCheck className="size-4" />
      ) : (
        <Bookmark className="size-4" />
      )}
      {saved ? t("bookmarked") : t("bookmark")}
    </Button>
  );
}
