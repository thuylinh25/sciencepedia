"use client";

/*
 * 'use client': hẹn giờ rê chuột, trạng thái popover và modal. Định nghĩa ngắn
 * vẫn đến từ props render sẵn trên server — component này không fetch gì để
 * hiện tooltip.
 */

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import * as Popover from "@radix-ui/react-popover";
import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { glossaryKey } from "@/lib/glossary";

/*
 * Modal vào chunk riêng và chỉ tải khi có người bấm "Xem chi tiết". Một bài có
 * thể mang hàng chục thuật ngữ mà không ai mở modal nào — không lý do gì bắt
 * mọi lượt đọc tải Dialog cùng phần gọi AI.
 */
const loadModal = () => import("./glossary-modal").then((mod) => mod.GlossaryModal);
const GlossaryModal = dynamic(loadModal, { ssr: false });

/**
 * 150ms: đủ để lướt chuột ngang qua dòng chữ mà không bật tooltip nào, đủ
 * ngắn để người cố ý dừng lại không thấy trễ. Đóng chậm hơn một chút để kịp
 * đưa chuột từ chữ sang tooltip mà nó không biến mất giữa đường.
 */
const OPEN_DELAY_MS = 150;
const CLOSE_DELAY_MS = 250;

type Props = {
  term: string;
  definition: string;
  /** Khoá mục từ. Không truyền thì suy từ `term`. */
  slug?: string;
  /** Chữ hiện trong bài, nếu khác tên mục từ (`[[khoá|nhãn]]`). */
  children?: ReactNode;
};

export function GlossaryTerm({ term, definition, slug, children }: Props) {
  const t = useTranslations("glossary");
  const locale = useLocale();
  const key = slug ?? glossaryKey(term);

  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  // Chỉ gắn modal vào cây sau lần mở đầu tiên, để chunk không tải sớm
  const [modalMounted, setModalMounted] = useState(false);

  const anchorRef = useRef<HTMLAnchorElement>(null);
  /*
   * Mở bằng rê chuột thì rời chuột là đóng, và KHÔNG cướp focus. Mở bằng bấm
   * (chuột, chạm, Enter) thì tooltip "ghim": ở lại tới khi bấm ra ngoài hoặc
   * Esc, và focus nhảy vào trong để Tab tới được nút "Xem chi tiết".
   */
  const openedByHover = useRef(false);
  const closedByPointerOutside = useRef(false);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);

  const clearTimers = useCallback(() => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const scheduleOpen = () => {
    window.clearTimeout(closeTimer.current);
    if (open) return;
    openTimer.current = window.setTimeout(() => {
      openedByHover.current = true;
      setOpen(true);
    }, OPEN_DELAY_MS);
  };

  const scheduleClose = () => {
    window.clearTimeout(openTimer.current);
    if (!openedByHover.current) return;
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  const handleClick = (event: MouseEvent) => {
    // Có JS thì bấm là mở tooltip; không có JS thì `href` đưa sang trang thuật ngữ
    event.preventDefault();
    clearTimers();
    if (open && !openedByHover.current) {
      setOpen(false);
    } else {
      openedByHover.current = false;
      setOpen(true);
    }
  };

  const openDetails = () => {
    setOpen(false);
    setModalMounted(true);
    setModalOpen(true);
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Hâm chunk modal khi tooltip hiện: ai đã đọc tooltip mới có thể bấm
        // "Xem chi tiết", và lúc đó modal mở ra không phải chờ tải.
        if (next) void loadModal();
      }}
    >
      <Popover.Anchor asChild>
        <Link
          ref={anchorRef}
          href={`/glossary/${key}`}
          // Mỗi thuật ngữ là một link: prefetch mặc định sẽ bắn hàng chục
          // request RSC ngay khi bài cuộn vào màn hình.
          prefetch={false}
          className="glossary-term"
          aria-label={t("termLabel", { term })}
          aria-haspopup="dialog"
          aria-expanded={open}
          onPointerEnter={(event) => event.pointerType === "mouse" && scheduleOpen()}
          onPointerLeave={(event) => event.pointerType === "mouse" && scheduleClose()}
          onClick={handleClick}
        >
          {children ?? term}
        </Link>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          side="top"
          align="center"
          sideOffset={8}
          collisionPadding={16}
          aria-label={term}
          onOpenAutoFocus={(event) => {
            if (openedByHover.current) event.preventDefault();
          }}
          /*
           * Tự trả focus: Radix chỉ biết trả về `Popover.Trigger`, mà ở đây là
           * Anchor, nên Esc để focus rơi về <body> — người dùng bàn phím mất chỗ
           * đang đọc. Không trả khi mở bằng rê chuột (focus chưa từng vào trong)
           * hay khi đóng bằng bấm ra ngoài (focus phải ở lại chỗ vừa bấm).
           */
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (!openedByHover.current && !closedByPointerOutside.current) {
              anchorRef.current?.focus();
            }
            closedByPointerOutside.current = false;
          }}
          onPointerDownOutside={(event) => {
            // Bấm vào chính thuật ngữ không đóng tooltip (xem onInteractOutside)
            if (!anchorRef.current?.contains(event.target as Node)) {
              closedByPointerOutside.current = true;
            }
          }}
          onInteractOutside={(event) => {
            // Anchor không phải Popover.Trigger nên Radix coi bấm vào nó là bấm
            // "ra ngoài": tooltip sẽ đóng rồi `handleClick` mở lại ngay.
            if (anchorRef.current?.contains(event.target as Node)) {
              event.preventDefault();
            }
          }}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") window.clearTimeout(closeTimer.current);
          }}
          onPointerLeave={(event) => event.pointerType === "mouse" && scheduleClose()}
          className="z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border bg-popover p-4 text-popover-foreground shadow-xl outline-none data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none"
        >
          <p className="font-display text-base font-semibold leading-snug">{term}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {definition}
          </p>
          <button
            type="button"
            onClick={openDetails}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-primary-strong outline-none hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {t("viewDetails")}
            <ArrowRight className="size-3.5" aria-hidden />
          </button>
          <Popover.Arrow className="fill-popover" width={14} height={7} />
        </Popover.Content>
      </Popover.Portal>

      {modalMounted && (
        <GlossaryModal
          slug={key}
          term={term}
          definition={definition}
          locale={locale}
          open={modalOpen}
          onOpenChange={setModalOpen}
          returnFocusRef={anchorRef}
        />
      )}
    </Popover.Root>
  );
}
