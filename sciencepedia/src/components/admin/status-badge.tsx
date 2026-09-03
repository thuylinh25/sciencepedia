import { useTranslations } from "next-intl";
import type { ArticleStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const VARIANT: Record<
  ArticleStatus,
  "default" | "secondary" | "accent" | "outline"
> = {
  DRAFT: "secondary",
  REVIEW: "accent",
  PUBLISHED: "default",
  ARCHIVED: "outline",
};

export function StatusBadge({ status }: { status: ArticleStatus }) {
  const t = useTranslations("status");
  return <Badge variant={VARIANT[status]}>{t(status)}</Badge>;
}
