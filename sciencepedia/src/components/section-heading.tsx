import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel,
  align = "left",
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-wrap items-end gap-4",
        align === "center" ? "flex-col items-center text-center" : "",
        className,
      )}
    >
      <div className={cn(align === "left" && "flex-1")}>
        {/* Gạch vàng nhỏ — nhịp thị giác lặp lại của National Geographic */}
        <span
          className={cn(
            "mb-3 block h-1 w-10 rounded-full bg-accent",
            align === "center" && "mx-auto",
          )}
        />
        <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-base text-pretty text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      {href && linkLabel && (
        <Link
          href={href}
          className="group flex items-center gap-1.5 text-sm font-medium text-primary-strong"
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}

      {children}
    </div>
  );
}
