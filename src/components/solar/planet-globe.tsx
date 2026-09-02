"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Maximize2, Pause, Play } from "lucide-react";

import { PLANETS, SUN, TEXTURE_CREDIT } from "@/lib/solar-data";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { GlobeBody } from "@/components/solar/globe-scene";

const GlobeScene = dynamic(
  () => import("@/components/solar/globe-scene").then((mod) => mod.GlobeScene),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center bg-[#05070f]">
        <Loader2 className="size-5 animate-spin text-white/50" />
      </div>
    ),
  },
);

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

/**
 * Quả cầu 3D của một thiên thể, gắn dưới phần mở đầu bài viết tương ứng.
 *
 * Trả về `null` khi slug không phải một thiên thể trong Hệ Mặt Trời, nên trang
 * bài viết có thể gọi vô điều kiện mà không cần tự kiểm tra.
 */
export function PlanetGlobe({ slug }: { slug: string }) {
  const t = useTranslations("solar");
  const locale = useLocale() as Locale;

  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [spinning, setSpinning] = useState(true);

  useEffect(() => setWebgl(supportsWebGL()), []);

  const planet = PLANETS.find((item) => item.articleSlug === slug);
  const isSun = SUN.articleSlug === slug;
  if (!planet && !isSun) return null;

  const name = isSun
    ? locale === "en"
      ? SUN.nameEn
      : SUN.name
    : locale === "en"
      ? planet!.nameEn
      : planet!.name;

  const body: GlobeBody = isSun
    ? { texture: SUN.texture, axialTilt: 7.25, emissive: true }
    : {
        texture: planet!.texture,
        axialTilt: planet!.axialTilt,
        ring: planet!.ring,
      };

  // WebGL không dùng được thì bỏ hẳn khối này, ảnh bìa của bài đã đủ minh hoạ
  if (webgl === false) return null;

  return (
    <figure className="mt-10">
      <div className="relative h-[22rem] w-full overflow-hidden rounded-2xl border bg-[#05070f] sm:h-[28rem]">
        {webgl === null ? (
          <div className="grid h-full place-items-center">
            <Loader2 className="size-5 animate-spin text-white/50" />
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="grid h-full place-items-center">
                <Loader2 className="size-5 animate-spin text-white/50" />
              </div>
            }
          >
            <GlobeScene body={body} spinning={spinning} />
          </Suspense>
        )}

        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-xs text-white/70 backdrop-blur">
            {t("dragToRotate")}
          </span>

          <div className="pointer-events-auto flex items-center gap-2">
            <Button
              size="icon-sm"
              variant="glass"
              onClick={() => setSpinning((value) => !value)}
              aria-label={spinning ? t("pause") : t("play")}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              {spinning ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
            </Button>
            <Button
              size="icon-sm"
              variant="glass"
              asChild
              aria-label={t("openFullModel")}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="/solar-system">
                <Maximize2 className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <figcaption className="mt-2.5 text-xs text-muted-foreground">
        {t("globeCaption", { name })}{" "}
        <a
          href={TEXTURE_CREDIT.url}
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-2"
        >
          {TEXTURE_CREDIT.name}
        </a>{" "}
        ({TEXTURE_CREDIT.license}).
      </figcaption>
    </figure>
  );
}
