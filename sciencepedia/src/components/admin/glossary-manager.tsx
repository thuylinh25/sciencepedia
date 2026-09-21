"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ExternalLink, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Link, useRouter } from "@/i18n/navigation";
import { slugify } from "@/lib/utils";
import { glossaryTermSchema, type GlossaryTermInput } from "@/lib/validations";
import {
  createGlossaryTerm,
  deleteGlossaryTerm,
  updateGlossaryTerm,
} from "@/server/actions/glossary";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/image-upload";
import { ScrollStrip } from "@/components/ui/scroll-strip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type GlossaryRow = {
  id: string;
  slug: string;
  term: string;
  termEn: string | null;
  shortDef: string;
  shortDefEn: string | null;
  fullDef: string | null;
  fullDefEn: string | null;
  aliases: string[];
  category: string | null;
  image: string | null;
  imageCredit: string | null;
  /**
   * Mục từ đang mang dấu duyệt. Chỉ cần biết CÓ hay KHÔNG: form dùng nó để
   * báo trước rằng sửa nội dung sẽ gỡ dấu, chứ không hiện tên người duyệt.
   */
  reviewed: boolean;
  /** Số bài đã xuất bản đang dùng `[[khoá]]` này. */
  usage: number;
};

const EMPTY: GlossaryTermInput = {
  slug: "",
  term: "",
  termEn: "",
  shortDef: "",
  shortDefEn: "",
  fullDef: "",
  fullDefEn: "",
  aliases: "",
  category: "",
  image: "",
  imageCredit: "",
};

export function GlossaryManager({ terms }: { terms: GlossaryRow[] }) {
  const t = useTranslations("admin");
  const tg = useTranslations("admin.glossaryForm");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<GlossaryRow | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<GlossaryTermInput>({
    resolver: zodResolver(glossaryTermSchema),
    defaultValues: EMPTY,
  });

  const visible = useMemo(() => {
    const needle = slugify(query);
    if (!needle) return terms;
    // Tìm theo slug: gõ "dong luong" vẫn ra "Động lượng góc" mà không cần dấu
    return terms.filter(
      (row) =>
        row.slug.includes(needle) ||
        row.aliases.some((alias) => alias.includes(needle)),
    );
  }, [terms, query]);

  function openCreate() {
    setEditing(null);
    reset(EMPTY);
    setOpen(true);
  }

  function openEdit(row: GlossaryRow) {
    setEditing(row);
    reset({
      slug: row.slug,
      term: row.term,
      termEn: row.termEn ?? "",
      shortDef: row.shortDef,
      shortDefEn: row.shortDefEn ?? "",
      fullDef: row.fullDef ?? "",
      fullDefEn: row.fullDefEn ?? "",
      aliases: row.aliases.join(", "),
      category: row.category ?? "",
      image: row.image ?? "",
      imageCredit: row.imageCredit ?? "",
    });
    setOpen(true);
  }

  function onSubmit(values: GlossaryTermInput) {
    startTransition(async () => {
      const result = editing
        ? await updateGlossaryTerm(editing.id, values)
        : await createGlossaryTerm(values);

      if (result.ok) {
        // Lượt sửa vừa gỡ byline "đã duyệt" khỏi mục từ. Không nói ra thì biên
        // tập viên chỉ phát hiện khi tình cờ mở trang công khai.
        if (result.data.stampCleared) {
          toast.warning(t("reviewStampCleared"), { duration: 8000 });
        } else {
          toast.success(t("saved"));
        }
        setOpen(false);
        router.refresh();
        return;
      }

      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          setError(field as keyof GlossaryTermInput, { message: messages?.[0] ?? "" });
        }
      }
      toast.error(result.error);
    });
  }

  function remove(row: GlossaryRow) {
    // Xoá mục từ = mọi [[khoá]] trỏ vào nó tụt về chữ thường, lặng lẽ. Nói
    // thẳng số bài bị ảnh hưởng trước khi hỏi.
    const warning = row.usage > 0 ? tg("deleteUsage", { count: row.usage }) : "";
    if (!confirm(`${t("confirmDelete", { name: row.term })}\n\n${warning}`.trim())) return;

    startTransition(async () => {
      const result = await deleteGlossaryTerm(row.id);
      if (result.ok) {
        toast.success(t("deleted"));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const shortDef = watch("shortDef") ?? "";
  const term = watch("term") ?? "";

  /* Hai con số phụ đứng cạnh tổng số, không phải trang trí: chúng là hai việc
     tồn đọng duy nhất của kho thuật ngữ — mục chưa dịch, và mục chưa bài nào
     dùng (ứng viên để xoá hoặc để đi cài `[[...]]` vào bài). Không có chúng
     thì phải cuộn hết bảng mới biết còn bao nhiêu. */
  const stats = useMemo(
    () => ({
      missingEn: terms.filter((row) => !row.shortDefEn).length,
      unused: terms.filter((row) => row.usage === 0).length,
    }),
    [terms],
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full max-w-xl flex-wrap items-center gap-x-3 gap-y-1.5">
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tg("search")}
              className="pl-9"
              aria-label={tg("search")}
            />
          </div>

          {/* Đang lọc thì tổng số một mình nói dối: bảng chỉ còn vài dòng mà
              con số vẫn là cả kho. Nên khi có bộ lọc, hiện "đang thấy/tổng". */}
          <p
            aria-live="polite"
            className="text-sm tabular-nums text-muted-foreground"
          >
            <span className="font-medium text-foreground">
              {query
                ? tg("countFiltered", {
                    visible: visible.length,
                    total: terms.length,
                  })
                : tg("count", { count: terms.length })}
            </span>
            {stats.missingEn > 0 && (
              <span> · {tg("countMissingEn", { count: stats.missingEn })}</span>
            )}
            {stats.unused > 0 && (
              <span> · {tg("countUnused", { count: stats.unused })}</span>
            )}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          {t("newGlossaryTerm")}
        </Button>
      </div>

      <ScrollStrip className="rounded-2xl border" trackClassName="-mt-1" tabIndex={0}>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">{tg("term")}</th>
              <th className="px-4 py-3 font-medium">{tg("shortDef")}</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">{tg("usage")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {visible.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-medium">{row.term}</p>
                  <p className="font-mono text-xs text-muted-foreground">{row.slug}</p>
                  {row.aliases.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {tg("aliases")}: {row.aliases.join(", ")}
                    </p>
                  )}
                </td>
                <td className="max-w-md px-4 py-3 text-muted-foreground">
                  {row.shortDef}
                  {!row.shortDefEn && (
                    <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent-foreground">
                      {tg("missingEn")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums">{row.usage}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/glossary/${row.slug}`}
                      target="_blank"
                      className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={t("preview")}
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={t("edit")}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(row)}
                      disabled={pending}
                      className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t("delete")}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {visible.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  {tg("empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </ScrollStrip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader className="text-left">
            <DialogTitle>{editing ? editing.term : t("newGlossaryTerm")}</DialogTitle>
          </DialogHeader>

          {/* Báo TRƯỚC khi gõ, không chỉ sau khi lưu: biết mình sắp mất dấu
              duyệt có thể đổi quyết định sửa hay không. */}
          {editing?.reviewed && (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
              {t("reviewStampWarning")}
            </p>
          )}

          <form
            id="glossary-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="g-term">{tg("term")} (VI)</Label>
                <Input id="g-term" {...register("term")} />
                {errors.term && (
                  <p className="text-xs text-destructive">{errors.term.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="g-termEn">{tg("term")} (EN)</Label>
                <Input id="g-termEn" {...register("termEn")} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="g-slug">Slug</Label>
                <Input
                  id="g-slug"
                  className="font-mono"
                  placeholder={slugify(term)}
                  {...register("slug")}
                />
                <p className="text-xs text-muted-foreground">{tg("slugHint")}</p>
                {errors.slug && (
                  <p className="text-xs text-destructive">{errors.slug.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="g-category">{tg("category")}</Label>
                <Input id="g-category" placeholder="Vật lý" {...register("category")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="g-aliases">{tg("aliases")}</Label>
              <Input
                id="g-aliases"
                placeholder="mô-men động lượng, angular momentum"
                {...register("aliases")}
              />
              <p className="text-xs text-muted-foreground">{tg("aliasesHint")}</p>
              {errors.aliases && (
                <p className="text-xs text-destructive">{errors.aliases.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="g-shortDef">{tg("shortDef")} (VI)</Label>
                {/* Đếm ngược ngay tại ô: 320 là chỗ tooltip bắt đầu che mất bài */}
                <span
                  className={`text-xs tabular-nums ${shortDef.length > 320 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {shortDef.length}/320
                </span>
              </div>
              <Textarea id="g-shortDef" rows={3} {...register("shortDef")} />
              <p className="text-xs text-muted-foreground">{tg("shortDefHint")}</p>
              {errors.shortDef && (
                <p className="text-xs text-destructive">{errors.shortDef.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="g-shortDefEn">{tg("shortDef")} (EN)</Label>
              <Textarea id="g-shortDefEn" rows={3} {...register("shortDefEn")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="g-fullDef">{tg("fullDef")} (VI)</Label>
              <Textarea id="g-fullDef" rows={6} {...register("fullDef")} />
              <p className="text-xs text-muted-foreground">{tg("fullDefHint")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="g-fullDefEn">{tg("fullDef")} (EN)</Label>
              <Textarea id="g-fullDefEn" rows={6} {...register("fullDefEn")} />
            </div>

            <div className="space-y-2">
              <Label>{tg("image")}</Label>
              <ImageUpload
                value={watch("image") ?? ""}
                onChange={(url) => setValue("image", url, { shouldDirty: true })}
                prefix="glossary"
              />
              {errors.image && (
                <p className="text-xs text-destructive">{errors.image.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="g-imageCredit">{tg("imageCredit")}</Label>
              <Input id="g-imageCredit" {...register("imageCredit")} />
              <p className="text-xs text-muted-foreground">{tg("imageCreditHint")}</p>
            </div>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" form="glossary-form" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
