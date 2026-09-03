"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { ArticleStatus } from "@prisma/client";
import { ExternalLink, Eye, EyeOff, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Link, useRouter } from "@/i18n/navigation";
import { deleteArticle, toggleArticleStatus } from "@/server/actions/articles";
import { formatDate, formatNumber } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Row = {
  id: string;
  slug: string;
  title: string;
  status: ArticleStatus;
  featured: boolean;
  views: number;
  updatedAt: Date;
  category: { name: string; nameEn: string; color: string };
};

export function AdminArticleTable({
  articles,
  locale,
}: {
  articles: Row[];
  locale: string;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<Row | null>(null);

  function toggle(row: Row) {
    startTransition(async () => {
      const result = await toggleArticleStatus(row.id);
      if (result.ok) {
        toast.success(t("saved"));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    const row = toDelete;

    startTransition(async () => {
      const result = await deleteArticle(row.id);
      setToDelete(null);

      if (result.ok) {
        toast.success(t("deleted"));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("form.titleField")}</TableHead>
            <TableHead className="w-36">{t("categories")}</TableHead>
            <TableHead className="w-28">{t("form.statusField")}</TableHead>
            <TableHead className="w-20 text-right">{t("totalViews")}</TableHead>
            <TableHead className="w-28">{t("save")}</TableHead>
            <TableHead className="w-40 text-right">{t("edit")}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {articles.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">
                <span className="flex items-center gap-2">
                  {row.featured && (
                    <Star className="size-3.5 shrink-0 fill-accent text-accent" />
                  )}
                  <Link
                    href={`/admin/articles/${row.id}/edit`}
                    className="hover:text-primary-strong"
                  >
                    {row.title}
                  </Link>
                </span>
              </TableCell>

              <TableCell>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: row.category.color }}
                  />
                  {locale === "en" ? row.category.nameEn : row.category.name}
                </span>
              </TableCell>

              <TableCell>
                <StatusBadge status={row.status} />
              </TableCell>

              <TableCell className="text-right tabular-nums">
                {formatNumber(row.views, locale)}
              </TableCell>

              <TableCell className="text-muted-foreground">
                {formatDate(row.updatedAt, locale)}
              </TableCell>

              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => toggle(row)}
                    disabled={pending}
                    aria-label={
                      row.status === "PUBLISHED" ? t("unpublish") : t("publish")
                    }
                  >
                    {row.status === "PUBLISHED" ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>

                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link
                      href={`/articles/${row.slug}`}
                      aria-label={t("preview")}
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                  </Button>

                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link
                      href={`/admin/articles/${row.id}/edit`}
                      aria-label={t("edit")}
                    >
                      <Pencil className="size-4" />
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setToDelete(row)}
                    aria-label={t("delete")}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete")}</DialogTitle>
            <DialogDescription>
              {t("confirmDelete", { name: toDelete?.title ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={pending}
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
