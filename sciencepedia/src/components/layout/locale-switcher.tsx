"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Globe } from "lucide-react";

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
        {/* Viên thuốc có viền, không còn là nút ghost trơn.

            Ghost nghĩa là không viền không nền, nên nút này trôi tự do cạnh
            avatar — vốn là một hình tròn đặc. Hai thứ cạnh nhau, một cái có
            hình dạng rõ một cái không, đọc ra như avatar là nút còn chữ "VI"
            là nhãn trang trí. Viền mảnh cộng `rounded-full` cho nó đúng một
            hình dạng bấm được, và hình dạng ấy đi cùng bộ với hình tròn của
            avatar thay vì chọi lại.

            `bg-card/50` chứ không nền đặc: header vốn trong suốt có làm mờ
            nền, một khối đặc sẽ thành mảng vá trên đó. */}
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          className="gap-1.5 rounded-full border bg-card/50 px-3 transition-colors hover:border-primary/40 hover:bg-card"
          aria-label={t("language")}
        >
          {/* Globe chứ không Languages: icon Languages của lucide vẽ chữ 文
              ghép với A, và trên một site chỉ có tiếng Việt với tiếng Anh thì
              một ký tự Hán ở nút đổi ngôn ngữ khiến người dùng tưởng site có
              thêm ngôn ngữ khác. */}
          <Globe className="size-4" />
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
