"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { categorySchema, type CategoryInput } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/server/actions/taxonomy";
import { CategoryIcon, ICON_NAMES } from "@/components/category-icon";
import { ImageUpload } from "@/components/admin/image-upload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  color: string;
  coverImage: string;
  parentId: string | null;
  parentName: string | null;
  order: number;
  articleCount: number;
};

const EMPTY: CategoryInput = {
  slug: "",
  name: "",
  nameEn: "",
  description: "",
  descriptionEn: "",
  icon: "Sparkles",
  color: "#3b82f6",
  coverImage: "",
  parentId: null,
  order: 0,
};

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: EMPTY,
  });

  function openCreate() {
    setEditing(null);
    reset(EMPTY);
    setOpen(true);
  }

  function openEdit(row: CategoryRow) {
    setEditing(row);
    reset({
      slug: row.slug,
      name: row.name,
      nameEn: row.nameEn,
      description: row.description,
      descriptionEn: row.descriptionEn,
      icon: row.icon || "Sparkles",
      color: row.color,
      coverImage: row.coverImage,
      parentId: row.parentId,
      order: row.order,
    });
    setOpen(true);
  }

  function onSubmit(values: CategoryInput) {
    startTransition(async () => {
      const payload = {
        ...values,
        slug: values.slug?.trim() || slugify(values.name),
      };
      const result = editing
        ? await updateCategory(editing.id, payload)
        : await createCategory(payload);

      if (result.ok) {
        toast.success(t("saved"));
        setOpen(false);
        router.refresh();
        return;
      }

      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          setError(field as keyof CategoryInput, {
            message: messages?.[0] ?? "",
          });
        }
      }
      toast.error(result.error);
    });
  }

  function remove(row: CategoryRow) {
    if (row.articleCount > 0) {
      toast.error(t("confirmDelete", { name: row.name }));
      return;
    }

    startTransition(async () => {
      const result = await deleteCategory(row.id);
      if (result.ok) {
        toast.success(t("deleted"));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const currentIcon = watch("icon");
  const currentColor = watch("color");

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          {t("newCategory")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("form.titleField")}</TableHead>
            <TableHead className="w-40">Slug</TableHead>
            <TableHead className="w-32">{t("categories")}</TableHead>
            <TableHead className="w-24 text-right">{t("articles")}</TableHead>
            <TableHead className="w-24 text-right">{t("edit")}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {categories.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <span className="flex items-center gap-2.5 font-medium">
                  <span
                    className="grid size-7 place-items-center rounded-lg"
                    style={{
                      backgroundColor: `${row.color}22`,
                      color: row.color,
                    }}
                  >
                    <CategoryIcon name={row.icon} className="size-4" />
                  </span>
                  {row.name}
                  <span className="text-xs font-normal text-muted-foreground">
                    {row.nameEn}
                  </span>
                </span>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {row.slug}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.parentName ?? "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.articleCount}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(row)}
                    aria-label={t("edit")}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(row)}
                    disabled={pending || row.articleCount > 0}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("edit") : t("newCategory")}
            </DialogTitle>
          </DialogHeader>

          <form
            id="category-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Tên (VI)</Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">Name (EN)</Label>
                <Input id="nameEn" {...register("nameEn")} />
                {errors.nameEn && (
                  <p className="text-xs text-destructive">
                    {errors.nameEn.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input id="cat-slug" className="font-mono" {...register("slug")} />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả (VI)</Label>
                <Textarea id="description" rows={3} {...register("description")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionEn">Description (EN)</Label>
                <Textarea
                  id="descriptionEn"
                  rows={3}
                  {...register("descriptionEn")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Controller
                  control={control}
                  name="icon"
                  render={({ field }) => (
                    <Select
                      value={field.value || "Sparkles"}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="icon">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_NAMES.map((name) => (
                          <SelectItem key={name} value={name}>
                            <span className="flex items-center gap-2">
                              <CategoryIcon name={name} className="size-4" />
                              {name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Màu</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(event) =>
                      setValue("color", event.target.value, {
                        shouldDirty: true,
                      })
                    }
                    className="size-10 shrink-0 cursor-pointer rounded-lg border bg-transparent"
                    aria-label="Màu"
                  />
                  <Input
                    id="color"
                    className="font-mono"
                    {...register("color")}
                  />
                </div>
                {errors.color && (
                  <p className="text-xs text-destructive">
                    {errors.color.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Thứ tự</Label>
                <Input
                  id="order"
                  type="number"
                  {...register("order", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentId">Danh mục cha</Label>
              <Controller
                control={control}
                name="parentId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? null : value)
                    }
                  >
                    <SelectTrigger id="parentId">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Không có —</SelectItem>
                      {categories
                        .filter((category) => category.id !== editing?.id)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Ảnh bìa danh mục</Label>
              <Controller
                control={control}
                name="coverImage"
                render={({ field }) => (
                  <ImageUpload
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    prefix="categories"
                  />
                )}
              />
            </div>

            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="mb-2 text-xs text-muted-foreground">Xem trước</p>
              <span
                className="grid size-12 place-items-center rounded-xl"
                style={{
                  backgroundColor: `${currentColor}22`,
                  color: currentColor,
                }}
              >
                <CategoryIcon name={currentIcon} className="size-6" />
              </span>
            </div>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" form="category-form" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
