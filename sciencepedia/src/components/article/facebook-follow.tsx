import { getTranslations } from "next-intl/server";
import { Facebook } from "lucide-react";

import { FACEBOOK_PAGE_URL } from "@/lib/seo";

/**
 * Dòng mời theo dõi fanpage, đứng ở CUỐI bài ngay sau thanh chia sẻ.
 *
 * Vì sao ở đây mà không phải đầu bài hay thanh bên: lời mời chỉ có nghĩa sau
 * khi người đọc đã đọc xong — đầu bài là lúc họ chưa nhận được gì, mở lời
 * bằng "hãy theo dõi chúng tôi" ở đó là đòi hỏi trước khi cho. Cuối bài cũng
 * là vị trí chiến lược kênh social trong repo `sciencepedia-social` đã chốt
 * ("một dòng mời cuối mỗi bài web"): người đọc hài lòng nhất là người dễ
 * bấm theo dõi nhất, và fanpage là nơi họ quay lại hằng ngày thay vì phải tự
 * nhớ địa chỉ web.
 *
 * Chữ nằm trong tệp ngôn ngữ (khoá `article.followText`/`followCta`) như mọi
 * chuỗi giao diện khác, và địa chỉ trang lấy từ `FACEBOOK_PAGE_URL` — cùng
 * một nguồn với nút theo dõi ở footer, để hai chỗ không bao giờ lệch nhau.
 */
export async function FacebookFollow() {
  const t = await getTranslations("article");

  return (
    <div className="mt-10 flex flex-col gap-4 rounded-2xl border bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {t("followText")}
      </p>

      {/* Nút dạng viên như nút email ở footer: cùng một ngôn ngữ thị giác cho
          mọi lời mời hành động rời khỏi trang đọc. */}
      <a
        href={FACEBOOK_PAGE_URL}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex shrink-0 items-center gap-2.5 self-start rounded-full border px-4 py-2 text-sm font-medium transition-all hover:border-accent hover:text-accent hover:shadow-[0_0_18px_-4px_var(--color-accent)] sm:self-center"
      >
        <Facebook className="size-4" aria-hidden />
        {t("followCta")}
      </a>
    </div>
  );
}
