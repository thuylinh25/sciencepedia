import { getTranslations } from "next-intl/server";
import { BadgeCheck, CircleAlert, ShieldQuestion } from "lucide-react";

import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Khối tín hiệu tin cậy trên trang bài viết.
 *
 * Bách khoa toàn thư sống bằng độ tin cậy, mà độc giả không thể tự kiểm chứng
 * điều đó — nên trang phải nói thẳng: ai đã thẩm định, thẩm định khi nào, và
 * lần cuối đối chiếu lại với nguồn là bao giờ. Đây vừa là tín hiệu E-E-A-T cho
 * Google, vừa là thứ phân biệt SciencePedia với nội dung máy sinh không kiểm.
 *
 * Server Component: chỉ hiển thị, không có tương tác.
 * Xem .claude/agents/science-editor.md.
 */

/** Quá hạn này mà chưa đối chiếu lại thì coi là cần rà soát. */
const STALE_AFTER_DAYS = 365;

export async function ReviewStatus({
  locale,
  reviewerName,
  reviewedAt,
  lastVerifiedAt,
  sourceCount,
  strongSourceCount,
  hasRetractedSource,
  className,
}: {
  locale: Locale;
  reviewerName?: string | null;
  reviewedAt?: Date | string | null;
  lastVerifiedAt?: Date | string | null;
  sourceCount: number;
  /// Số nguồn bậc 1–2 (bình duyệt hoặc cơ quan thẩm quyền)
  strongSourceCount: number;
  hasRetractedSource: boolean;
  className?: string;
}) {
  const t = await getTranslations("article");
  const verifiedAt = lastVerifiedAt ?? reviewedAt;

  const staleSince = verifiedAt
    ? (Date.now() - new Date(verifiedAt).getTime()) / 86_400_000
    : null;
  const isStale = staleSince !== null && staleSince > STALE_AFTER_DAYS;

  // Nguồn bị rút là lỗi nội dung, không phải chi tiết phụ — báo trước mọi thứ khác
  if (hasRetractedSource) {
    return (
      <aside
        className={cn(
          "flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm",
          className,
        )}
      >
        <CircleAlert
          className="mt-0.5 size-5 shrink-0 text-destructive-strong"
          aria-hidden
        />
        {/* `text-destructive-foreground` từng dùng ở đây là màu chữ ĐẶT TRÊN nền
            đỏ đặc — gần trắng. Trên nền destructive/5 (gần trắng) thì cảnh báo
            quan trọng nhất của trang gần như vô hình. */}
        <p className="text-destructive-strong">{t("review.retracted")}</p>
      </aside>
    );
  }

  // Chưa duyệt thì nói thẳng là chưa duyệt, không im lặng để người đọc tự suy
  if (!reviewerName) {
    return (
      <aside
        className={cn(
          "flex items-start gap-3 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        <ShieldQuestion className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p>{t("review.unreviewed")}</p>
      </aside>
    );
  }

  return (
    <aside
      className={cn("rounded-xl border bg-muted/40 p-4 text-sm", className)}
      aria-label={t("review.label")}
    >
      <div className="flex items-start gap-3">
        <BadgeCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
        <div className="space-y-1">
          <p className="font-medium">
            {t("review.reviewedBy", { name: reviewerName })}
            {reviewedAt ? (
              <>
                {" · "}
                <time dateTime={new Date(reviewedAt).toISOString()}>
                  {formatDate(reviewedAt, locale)}
                </time>
              </>
            ) : null}
          </p>

          <p className="text-muted-foreground">
            {strongSourceCount > 0
              ? t("review.basedOnStrong", {
                  count: sourceCount,
                  strong: strongSourceCount,
                })
              : t("review.basedOn", { count: sourceCount })}
          </p>

          {verifiedAt ? (
            <p className={cn(isStale ? "text-warning" : "text-muted-foreground")}>
              {t.rich(isStale ? "review.stale" : "review.lastVerified", {
                date: formatDate(verifiedAt, locale),
                // Chỉ bản thân ngày mới là <time>, không phải cả câu
                t: (chunks) => (
                  <time dateTime={new Date(verifiedAt).toISOString()}>
                    {chunks}
                  </time>
                ),
              })}
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
