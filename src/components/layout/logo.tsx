import { cn } from "@/lib/utils";

/**
 * Dấu hiệu nhận diện: khung chữ nhật vàng kiểu National Geographic,
 * bên trong là một quỹ đạo hành tinh tối giản.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 place-items-center rounded-lg bg-accent">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-5 text-accent-foreground"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3.2" fill="currentColor" />
          <ellipse
            cx="12"
            cy="12"
            rx="10"
            ry="4.4"
            stroke="currentColor"
            strokeWidth="1.6"
            transform="rotate(-24 12 12)"
          />
          <circle cx="20.2" cy="8.6" r="1.5" fill="currentColor" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-tight">
          Sciencepedia
        </span>
        <span className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Khoa học mở
        </span>
      </span>
    </span>
  );
}
