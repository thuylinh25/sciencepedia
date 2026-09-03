"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    // Trong production hãy đẩy sang Sentry/Axiom thay vì chỉ log ra console
    console.error("[boundary]", error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="size-12 text-destructive" />
      <h1 className="font-display text-2xl font-bold">{t("error")}</h1>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">
          {error.digest}
        </p>
      )}
      <Button onClick={reset}>{t("retry")}</Button>
    </div>
  );
}
