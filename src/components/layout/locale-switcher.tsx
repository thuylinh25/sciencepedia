"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Languages } from "lucide-react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LABEL: Record<Locale, string> = { vi: "Tiếng Việt", en: "English" };
const SHORT: Record<Locale, string> = { vi: "VI", en: "EN" };

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      // usePathname() của next-intl trả về đường dẫn ĐÃ bỏ tiền tố ngôn ngữ và
      // đã thay các segment động bằng giá trị thật, nên chỉ cần đổi locale.
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          className="gap-1.5 px-2.5"
          aria-label={t("language")}
        >
          <Languages className="size-4" />
          <span className="text-xs font-semibold">{SHORT[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((code) => (
          <DropdownMenuItem key={code} onClick={() => switchTo(code)}>
            <span className="w-6 font-mono text-xs">{SHORT[code]}</span>
            {LABEL[code]}
            {code === locale && <Check className="ml-auto size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
