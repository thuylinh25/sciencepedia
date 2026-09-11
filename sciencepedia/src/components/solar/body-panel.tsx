"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Orbit } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { BodyJumpList, type JumpTarget } from "@/components/solar/body-jump-list";

/**
 * Bảng thông tin thiên thể ở chế độ toàn màn hình.
 *
 * ## Vì sao có tab
 *
 * Bản trước xếp mọi thứ thành một cột dọc: mô tả, chú thích ảnh, số đo, danh
 * sách chuyển thẻ. Trên màn hình cao 600 px thì cột đó phải cuộn, và phần
 * cuộn mất đi luôn là phần số liệu — đúng phần người tra cứu cần. Tab giữ
 * mọi nhóm ở cùng một khoảng cách một cú bấm, và không nhóm nào đẩy nhóm nào
 * ra khỏi tầm nhìn.
 *
 * ## Vì sao bốn tab này
 *
 * Bốn tab tương ứng bốn câu hỏi khác nhau, và ai đang hỏi câu nào thì chỉ
 * quan tâm câu đó: "đây là cái gì" · "tôi đang xem ảnh gì" · "số đo bao
 * nhiêu" · "đi đâu tiếp". Gộp hai câu đầu lại thì chú thích nguồn ảnh chen
 * vào giữa phần giới thiệu, mà hai thứ đó không đọc cùng nhịp.
 */

export type BodyPanelFact = {
  label: string;
  value: string;
};

export type BodyPanelData = {
  id: string;
  name: string;
  secondaryName: string | null;
  description: string;
  /** Chú thích tấm ảnh đang làm bìa */
  photoCaption: string;
  photoCredit: string;
  photoSourceUrl: string;
  /** Chú thích bản đồ bề mặt; `null` nếu thiên thể không có bản đồ */
  surfaceCaption: string | null;
  surfaceCredit: string | null;
  facts: BodyPanelFact[];
  /** Đường tới bài viết, chỉ có khi bài đã xuất bản */
  articleHref: string | null;
};

type TabId = "about" | "map" | "physical" | "related";

export function BodyPanel({
  body,
  targets,
}: {
  body: BodyPanelData;
  targets: JumpTarget[];
}) {
  const t = useTranslations("solar");
  const [tab, setTab] = useState<TabId>("about");

  /*
   * Tab bản đồ chỉ tồn tại khi có bản đồ. Hiện một tab rỗng cho Sao Thổ và
   * Sao Thiên Vương là mời người xem bấm vào chỗ không có gì.
   */
  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "about", label: t("tabAbout") },
    ...(body.surfaceCaption
      ? [{ id: "map" as const, label: t("tabMap") }]
      : []),
    { id: "physical", label: t("tabPhysical") },
    { id: "related", label: t("tabRelated") },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">{body.name}</h3>
        {body.secondaryName && (
          <span className="shrink-0 text-xs text-white/50">
            {body.secondaryName}
          </span>
        )}
      </div>

      {/* Thanh tab cuộn ngang được: bốn nhãn tiếng Việt không lọt bề rộng
          bảng trên màn hình hẹp, và bọc xuống hai hàng thì thanh tab cao hơn
          cả nội dung nó điều khiển. */}
      <div
        role="tablist"
        aria-label={body.name}
        className="mt-3 -mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none",
              tab === item.id
                ? "bg-white/15 text-white"
                : "text-white/55 hover:bg-white/8 hover:text-white/85",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-3 border-t border-white/10 pt-3">
        {tab === "about" && (
          <p className="text-sm leading-relaxed text-white/80">
            {body.description}
          </p>
        )}

        {tab === "map" && body.surfaceCaption && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-white/80">
              {body.surfaceCaption}
            </p>
            <p className="text-xs leading-relaxed text-white/50">
              {body.photoCaption}{" "}
              <a
                href={body.photoSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {body.photoCredit}
              </a>
            </p>
          </div>
        )}

        {tab === "physical" && (
          <dl className="space-y-2">
            {body.facts.map((fact) => (
              <div
                key={fact.label}
                className="flex items-baseline justify-between gap-4 border-b border-white/5 pb-1.5"
              >
                <dt className="text-xs text-white/50">{fact.label}</dt>
                {/* tabular-nums để cột số không so le khi đổi thiên thể */}
                <dd className="text-right font-mono text-sm text-white/90 tabular-nums">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {tab === "related" && (
          <div className="space-y-3">
            {/*
              Hai lối đi khác loại nên tách hẳn khỏi nhau.

              Bài viết là chữ — đọc để hiểu. "Xem trong Hệ Mặt Trời" là mô
              hình — xem để thấy nó nằm ở đâu so với các hành tinh khác. Trộn
              hai thứ vào cùng một dãy nút thì người bấm không đoán được cái
              nào dẫn tới đâu.
            */}
            {body.articleHref && (
              <Link
                href={body.articleHref}
                className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-2.5 text-sm text-white/85 transition-colors hover:border-white/30 hover:bg-white/12 hover:text-white"
              >
                <ArrowUpRight className="size-4 shrink-0" aria-hidden />
                {t("readMore")}
              </Link>
            )}

            <Link
              href={`/solar-system?body=${body.id}`}
              className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-2.5 text-sm text-white/85 transition-colors hover:border-white/30 hover:bg-white/12 hover:text-white"
            >
              <Orbit className="size-4 shrink-0" aria-hidden />
              {t("viewInSolarSystem")}
            </Link>

            <BodyJumpList targets={targets} />
          </div>
        )}
      </div>
    </div>
  );
}
