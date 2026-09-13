import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, LayoutGrid } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { SCALE_RUNGS, rungIdForModel, type ScaleRung } from "@/lib/models";
import { cn } from "@/lib/utils";

/**
 * Bậc thang kích thước ở cuối mỗi trang mô hình 3D.
 *
 * ## Vì sao bảy nấc chứ không phải hai liên kết
 *
 * Bản trước chỉ in "lùi ra một bậc / thu vào một bậc" — hai thẻ, và trên trang
 * Hệ Mặt Trời thì chỉ còn MỘT vì nó là nấc đầu. Kết quả là một khối tiêu đề
 * rộng cả trang với đúng một thẻ nép bên phải, và người dùng đọc ra là "nội
 * dung chưa tải xong".
 *
 * Nhưng lỗi thật không nằm ở bố cục. Hai liên kết chỉ nói ĐI ĐÂU TIẾP; chúng
 * không nói điều mà cả khối này sinh ra để nói — mỗi bậc lớn hơn bậc trước bao
 * nhiêu lần. Bảy nấc, mỗi nấc kèm một kích thước đo được, làm được việc đó
 * ngay trong một cái liếc: 3.475 km → 12.742 km → 1,39 triệu km → 9 tỉ km →
 * 1–3 năm ánh sáng → 10 năm ánh sáng → 100.000 năm ánh sáng.
 *
 * ## Ba nấc không bấm được, và đó là chủ ý
 *
 * Mặt Trăng, Đám mây Oort và vùng lân cận sao chưa có trang riêng. Chúng vẫn
 * phải có mặt vì bỏ đi là bỏ mất chính chỗ tỉ lệ nhảy mạnh nhất — nhưng chúng
 * KHÔNG được vẽ thành thẻ bấm được. Một thẻ trông bấm được mà không đi đâu
 * còn tệ hơn một thẻ nói thẳng "chưa có mô hình riêng".
 *
 * ## Vì sao cuộn ngang trên di động
 *
 * Bảy thẻ xếp dọc trên điện thoại là bảy màn hình cuộn, và thang bậc thì chỉ
 * đọc được khi các nấc NẰM CẠNH NHAU. Cuộn ngang giữ được phép so sánh ấy;
 * `snap` giữ cho mỗi lần vuốt dừng đúng một thẻ.
 */
export async function ScaleLadder({ current }: { current: string }) {
  const t = await getTranslations("models");
  const locale = (await getLocale()) as Locale;
  const currentRung = rungIdForModel(current);

  const name = (rung: ScaleRung) => (locale === "en" ? rung.nameEn : rung.name);
  const size = (rung: ScaleRung) => (locale === "en" ? rung.sizeEn : rung.size);
  const note = (rung: ScaleRung) => (locale === "en" ? rung.noteEn : rung.note);

  return (
    <section aria-labelledby="scale-ladder" className="mt-10 border-t pt-8">
      <h2
        id="scale-ladder"
        className="text-xs font-semibold tracking-widest text-muted-foreground uppercase"
      >
        {t("ladderTitle")}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {t("ladderLead")}
      </p>

      {/* Cuộn ngang dưới sm, lưới từ sm. `-mx-5 px-5` để thẻ đầu và thẻ cuối
          chạm đúng lề trang khi cuộn, thay vì bị cắt giữa chừng. */}
      <ol className="-mx-5 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {SCALE_RUNGS.map((rung, index) => {
          const here = rung.id === currentRung;

          const body = (
            <>
              <span className="flex items-center justify-between gap-2">
                <span aria-hidden className="text-xl">
                  {rung.emoji}
                </span>
                {here ? (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
                    {t("youAreHere")}
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className="font-mono text-[10px] text-muted-foreground/60"
                  >
                    {index + 1}/{SCALE_RUNGS.length}
                  </span>
                )}
              </span>

              <span
                className="mt-3 block font-display text-base font-semibold"
                style={{ color: rung.color }}
              >
                {name(rung)}
              </span>
              <span className="mt-0.5 block font-mono text-xs text-foreground/80">
                {size(rung)}
              </span>
              <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
                {note(rung)}
              </span>

              {rung.href ? (
                /* Nút "Khám phá" hiện sẵn ở dạng mờ và rõ hẳn khi rê chuột:
                   hiện-khi-hover thì trên màn cảm ứng nó không bao giờ hiện. */
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent opacity-70 transition-opacity group-hover:opacity-100">
                  {t("explore")}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              ) : (
                <span className="mt-3 inline-block text-xs text-muted-foreground/60">
                  {t("noPage")}
                </span>
              )}
            </>
          );

          const shell = cn(
            "flex h-full w-[15rem] shrink-0 snap-start flex-col rounded-2xl border p-4 sm:w-auto",
            here
              ? "border-primary/60 bg-primary/[0.07]"
              : "bg-card/40 hover:bg-card",
          );

          return (
            <li key={rung.id} className="flex">
              {rung.href ? (
                <Link
                  href={rung.href}
                  className={cn(
                    shell,
                    "group transition-[transform,border-color,background-color] duration-200 hover:-translate-y-1 hover:border-accent",
                  )}
                  aria-current={here ? "page" : undefined}
                >
                  {body}
                </Link>
              ) : (
                <div className={shell}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>

      <Link
        href="/models"
        className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <LayoutGrid className="size-4" />
        {t("allModels")}
      </Link>
    </section>
  );
}
