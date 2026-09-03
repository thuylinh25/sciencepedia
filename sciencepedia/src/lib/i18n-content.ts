import type { Locale } from "@/i18n/routing";

/**
 * Chọn bản dịch phù hợp với locale hiện tại.
 * Nội dung tiếng Việt luôn là bản gốc; nếu chưa có bản tiếng Anh thì
 * quay về bản gốc thay vì hiển thị ô trống.
 */
export function pick(
  locale: Locale,
  vi: string,
  en?: string | null,
): string {
  if (locale === "en" && en && en.trim().length > 0) return en;
  return vi;
}

/** Cho biết bản dịch đang bị thiếu, để hiện thông báo cho người đọc. */
export function isFallback(
  locale: Locale,
  en?: string | null,
): boolean {
  return locale === "en" && (!en || en.trim().length === 0);
}

type Localized = {
  name: string;
  nameEn: string;
};

export function pickName(locale: Locale, entity: Localized): string {
  return locale === "en" ? entity.nameEn : entity.name;
}
