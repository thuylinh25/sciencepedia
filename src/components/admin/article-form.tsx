"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Eye, Loader2, Save, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { articleSchema, type ArticleInput } from "@/lib/validations";
import { readingTime, slugify } from "@/lib/utils";
import { createArticle, updateArticle } from "@/server/actions/articles";
import { ArticleContent } from "@/components/article/article-content";
import { ImageUpload } from "@/components/admin/image-upload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { id: string; name: string; color?: string };

export function ArticleForm({
  articleId,
  defaultValues,
  categories,
  tags,
}: {
  articleId?: string;
  defaultValues: ArticleInput;
  categories: Option[];
  tags: Option[];
}) {
  const t = useTranslations("admin");
  const tStatus = useTranslations("status");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<ArticleInput>({
    resolver: zodResolver(articleSchema),
    defaultValues,
  });

  const content = watch("content");
  const title = watch("title");
  const selectedTags = watch("tagIds");

  function generateSlug() {
    if (!title) return;
    setValue("slug", slugify(title), { shouldDirty: true });
  }

  function toggleTag(id: string) {
    const current = selectedTags ?? [];
    setValue(
      "tagIds",
      current.includes(id)
        ? current.filter((tagId) => tagId !== id)
        : [...current, id],
      { shouldDirty: true },
    );
  }

  function onSubmit(values: ArticleInput) {
    startTransition(async () => {
      const result = articleId
        ? await updateArticle(articleId, values)
        : await createArticle(values);

      if (result.ok) {
        toast.success(t("saved"));
        router.push("/admin/articles");
        router.refresh();
        return;
      }

      // Đưa lỗi phía server về đúng ô nhập
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          setError(field as keyof ArticleInput, {
            message: messages?.[0] ?? "",
          });
        }
      }
      toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        {/* ------------------------------------------------ Cột nội dung */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">{t("form.titleField")}</Label>
            <Input
              id="title"
              {...register("title")}
              aria-invalid={Boolean(errors.title)}
              className="h-12 text-lg"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">{t("form.slugField")}</Label>
            <div className="flex gap-2">
              <Input id="slug" {...register("slug")} className="font-mono" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generateSlug}
                aria-label={t("form.slugHint")}
              >
                <Wand2 className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("form.slugHint")}
            </p>
            {errors.slug && (
              <p className="text-xs text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <Tabs defaultValue="vi">
            <TabsList>
              <TabsTrigger value="vi">{t("form.contentVi")}</TabsTrigger>
              <TabsTrigger value="en">{t("form.contentEn")}</TabsTrigger>
              <TabsTrigger value="seo">{t("form.seo")}</TabsTrigger>
            </TabsList>

            {/* Tiếng Việt */}
            <TabsContent value="vi" className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="summary">{t("form.summaryField")}</Label>
                <Textarea id="summary" rows={3} {...register("summary")} />
                {errors.summary && (
                  <p className="text-xs text-destructive">
                    {errors.summary.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">{t("form.contentField")}</Label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      ~{readingTime(content ?? "")} phút
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreview((value) => !value)}
                    >
                      <Eye className="size-4" />
                      {t("preview")}
                    </Button>
                  </div>
                </div>

                {preview ? (
                  <div className="min-h-80 rounded-xl border p-6">
                    <ArticleContent markdown={content ?? ""} />
                  </div>
                ) : (
                  <Textarea
                    id="content"
                    rows={22}
                    className="font-mono text-sm"
                    {...register("content")}
                  />
                )}
                {errors.content && (
                  <p className="text-xs text-destructive">
                    {errors.content.message}
                  </p>
                )}
              </div>
            </TabsContent>

            {/* English */}
            <TabsContent value="en" className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="titleEn">{t("form.titleField")} (EN)</Label>
                <Input id="titleEn" {...register("titleEn")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summaryEn">{t("form.summaryField")} (EN)</Label>
                <Textarea id="summaryEn" rows={3} {...register("summaryEn")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contentEn">{t("form.contentField")} (EN)</Label>
                <Textarea
                  id="contentEn"
                  rows={22}
                  className="font-mono text-sm"
                  {...register("contentEn")}
                />
              </div>
            </TabsContent>

            {/* SEO */}
            <TabsContent value="seo" className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">{t("form.seoTitleField")}</Label>
                <Input id="seoTitle" maxLength={70} {...register("seoTitle")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seoDescription">{t("form.seoDescField")}</Label>
                <Textarea
                  id="seoDescription"
                  rows={3}
                  maxLength={300}
                  {...register("seoDescription")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seoKeywords">{t("form.seoKeywordsField")}</Label>
                <Input id="seoKeywords" {...register("seoKeywords")} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ------------------------------------------------ Cột thiết lập */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="space-y-4 rounded-2xl border bg-card p-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {t("form.organize")}
            </p>

            <div className="space-y-2">
              <Label htmlFor="status">{t("form.statusField")}</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"] as const).map(
                        (status) => (
                          <SelectItem key={status} value={status}>
                            {tStatus(status)}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">{t("form.categoryField")}</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="categoryId">
                      <SelectValue placeholder={t("form.categoryField")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && (
                <p className="text-xs text-destructive">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="featured">{t("form.featuredField")}</Label>
              <Controller
                control={control}
                name="featured"
                render={({ field }) => (
                  <Switch
                    id="featured"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border bg-card p-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {t("form.tagsField")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const active = selectedTags?.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    aria-pressed={active}
                  >
                    <Badge variant={active ? "default" : "outline"}>
                      {tag.name}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border bg-card p-5">
            <Label>{t("form.coverField")}</Label>
            <Controller
              control={control}
              name="coverImage"
              render={({ field }) => (
                <ImageUpload
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  prefix="articles"
                />
              )}
            />
            {errors.coverImage && (
              <p className="text-xs text-destructive">
                {errors.coverImage.message}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {pending ? t("saving") : t("save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={pending}
            >
              {t("cancel")}
            </Button>
          </div>

          {isDirty && (
            <p className="text-center text-xs text-muted-foreground">
              Có thay đổi chưa lưu
            </p>
          )}
        </aside>
      </div>
    </form>
  );
}
