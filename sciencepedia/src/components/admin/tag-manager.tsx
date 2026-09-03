"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { tagSchema, type TagInput } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { createTag, deleteTag, updateTag } from "@/server/actions/taxonomy";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type TagRow = {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  color: string;
  articleCount: number;
};

const EMPTY: TagInput = { slug: "", name: "", nameEn: "", color: "#64748b" };

export function TagManager({ tags }: { tags: TagRow[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<TagRow | null>(null);
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<TagInput>({
    resolver: zodResolver(tagSchema),
    defaultValues: EMPTY,
  });

  function openCreate() {
    setEditing(null);
    reset(EMPTY);
    setOpen(true);
  }

  function openEdit(row: TagRow) {
    setEditing(row);
    reset({
      slug: row.slug,
      name: row.name,
      nameEn: row.nameEn,
      color: row.color,
    });
    setOpen(true);
  }

  function onSubmit(values: TagInput) {
    startTransition(async () => {
      const payload = {
        ...values,
        slug: values.slug?.trim() || slugify(values.name),
      };
      const result = editing
        ? await updateTag(editing.id, payload)
        : await createTag(payload);

      if (result.ok) {
        toast.success(t("saved"));
        setOpen(false);
        router.refresh();
        return;
      }

      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          setError(field as keyof TagInput, { message: messages?.[0] ?? "" });
        }
      }
      toast.error(result.error);
    });
  }

  function remove(row: TagRow) {
    startTransition(async () => {
      const result = await deleteTag(row.id);
      if (result.ok) {
        toast.success(t("deleted"));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const currentColor = watch("color");

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          {t("newTag")}
        </Button>
      </div>

      <ul className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li
            key={tag.id}
            className="group flex items-center gap-2 rounded-full border py-1.5 pr-1.5 pl-3.5"
            style={{ borderColor: `${tag.color}66` }}
          >
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            <span className="text-sm font-medium">{tag.name}</span>
            <span className="text-xs text-muted-foreground">
              {tag.articleCount}
            </span>

            <button
              type="button"
              onClick={() => openEdit(tag)}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t("edit")}
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => remove(tag)}
              disabled={pending}
              className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={t("delete")}
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("edit") : t("newTag")}</DialogTitle>
          </DialogHeader>

          <form
            id="tag-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tag-name">Tên (VI)</Label>
                <Input id="tag-name" {...register("name")} />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag-nameEn">Name (EN)</Label>
                <Input id="tag-nameEn" {...register("nameEn")} />
                {errors.nameEn && (
                  <p className="text-xs text-destructive">
                    {errors.nameEn.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag-slug">Slug</Label>
              <Input id="tag-slug" className="font-mono" {...register("slug")} />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag-color">Màu</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentColor}
                  onChange={(event) =>
                    setValue("color", event.target.value, { shouldDirty: true })
                  }
                  className="size-10 shrink-0 cursor-pointer rounded-lg border bg-transparent"
                  aria-label="Màu"
                />
                <Input
                  id="tag-color"
                  className="font-mono"
                  {...register("color")}
                />
              </div>
            </div>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" form="tag-form" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
