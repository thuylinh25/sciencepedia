"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowRight, Orbit } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function Hero() {
  const t = useTranslations("home");
  const reduced = useReducedMotion();

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 24 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduced ? 0 : 0.7,
      delay: reduced ? 0 : delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

  return (
    <section className="bg-cosmos starfield relative isolate overflow-hidden">
      {/* Quầng sáng nền, chuyển động rất chậm */}
      <div
        aria-hidden
        className="animate-aurora pointer-events-none absolute -top-1/3 left-1/2 size-[70rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--color-chart-1), transparent 65%)",
        }}
      />

      <div className="container-page relative flex min-h-[min(88vh,46rem)] flex-col justify-center py-24 text-star">
        <motion.p
          {...rise(0)}
          className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-widest text-white/90 uppercase backdrop-blur"
        >
          <span className="size-1.5 animate-pulse rounded-full bg-accent" />
          {t("heroEyebrow")}
        </motion.p>

        <motion.h1
          {...rise(0.08)}
          className="max-w-4xl font-display text-5xl leading-[1.05] font-bold tracking-tight text-balance text-white sm:text-6xl lg:text-7xl"
        >
          {t("heroTitle")}
        </motion.h1>

        <motion.p
          {...rise(0.16)}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-white/75 sm:text-xl"
        >
          {t("heroSubtitle")}
        </motion.p>

        <motion.div {...rise(0.24)} className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="xl" variant="accent">
            <Link href="/categories">
              {t("heroCta")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="xl"
            variant="glass"
            className="border-white/25 bg-white/10 text-white hover:bg-white/20"
          >
            <Link href="/solar-system">
              <Orbit className="size-4" />
              {t("heroCtaSecondary")}
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Chuyển mềm sang nền trang */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
    </section>
  );
}
