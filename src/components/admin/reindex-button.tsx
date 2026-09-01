"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ReindexButton() {
  const t = useTranslations("admin");
  const [running, setRunning] = useState(false);

  async function reindex() {
    setRunning(true);
    try {
      const response = await fetch("/api/admin/reindex", { method: "POST" });
      const data = (await response.json()) as {
        indexed?: number;
        error?: string;
      };

      if (!response.ok) throw new Error(data.error ?? "REINDEX_FAILED");
      toast.success(t("reindexed", { count: data.indexed ?? 0 }));
    } catch {
      toast.error(t("reindex"));
    } finally {
      setRunning(false);
    }
  }

  return (
    <Button variant="outline" onClick={reindex} disabled={running}>
      {running ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <RefreshCw className="size-4" />
      )}
      {running ? t("reindexing") : t("reindex")}
    </Button>
  );
}
