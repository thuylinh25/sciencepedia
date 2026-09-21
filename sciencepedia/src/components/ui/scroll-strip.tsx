"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/* Dải cuộn ngang KÈM thanh cuộn kéo được bằng ngón tay.

   Vì sao không dùng thanh cuộn của trình duyệt: trên cảm ứng, thanh cuộn cổ
   điển (thứ `::-webkit-scrollbar` tạo ra) là vật trang trí — hiện ra nhưng
   không nhận thao tác kéo; còn thanh cuộn phủ thì tự ẩn nên không làm được
   nhiệm vụ "báo còn nội dung bên phải". Muốn vừa thấy vừa kéo được thì thanh
   cuộn phải là phần tử thật của ta, nghe `pointerdown/move`.

   Vì sao bọc chứ không thay: phần tử cuộn vẫn là con trực tiếp, nên bố cục bên
   trong (flex ngang trên điện thoại, flex dọc trên máy tính) không đổi. Radix
   ScrollArea bọc nội dung trong một div `display: table`, làm nền mục đang chọn
   co lại theo chữ thay vì trải hết cột trên máy tính. */
export function ScrollStrip({
  className,
  rootClassName,
  trackClassName,
  tabIndex,
  children,
}: {
  /** Đặt lên thẻ bọc ngoài cùng — lề ngoài phải ở đây để thanh cuộn nằm
      TRONG khoảng lề, không bị đẩy ra ngoài. */
  rootClassName?: string;
  /** Đặt lên chính phần tử cuộn — ví dụ `lg:overflow-visible` để thôi cuộn. */
  className?: string;
  trackClassName?: string;
  /** `0` để vùng cuộn nhận được focus bàn phím (WCAG 2.1.1) — cần cho bảng:
      người dùng bàn phím phải có cách xem phần nằm ngoài khung. */
  tabIndex?: number;
  children: React.ReactNode;
}) {
  const scroller = React.useRef<HTMLDivElement>(null);
  const controlsId = React.useId();
  const [{ ratio, offset }, setMetrics] = React.useState({
    ratio: 1,
    offset: 0,
  });

  const measure = React.useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const { scrollWidth, clientWidth, scrollLeft } = el;
    const nextRatio = scrollWidth > 0 ? clientWidth / scrollWidth : 1;
    const nextOffset = scrollWidth > 0 ? scrollLeft / scrollWidth : 0;
    setMetrics((prev) =>
      prev.ratio === nextRatio && prev.offset === nextOffset
        ? prev
        : { ratio: nextRatio, offset: nextOffset },
    );
  }, []);

  React.useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    /* Đo lại khi khung đổi bề ngang (xoay máy, `lg:` đổi trục) VÀ khi nội dung
       đổi bề ngang (font chữ về muộn, bớt/thêm mục theo quyền). */
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [measure]);

  const drag = React.useRef<{ x: number; scrollLeft: number } | null>(null);

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    const el = scroller.current;
    if (!el) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, scrollLeft: el.scrollLeft };
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    const el = scroller.current;
    const from = drag.current;
    if (!el || !from) return;
    /* Ngón tay đi trên THANH, không đi trên nội dung: quãng nội dung phải nhân
       lên đúng tỉ lệ thanh bị thu nhỏ, nếu không kéo hết thanh vẫn chưa hết
       nội dung. */
    const scale = el.clientWidth > 0 ? el.scrollWidth / el.clientWidth : 1;
    el.scrollLeft = from.scrollLeft + (event.clientX - from.x) * scale;
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function jumpTo(event: React.PointerEvent<HTMLDivElement>) {
    const el = scroller.current;
    if (!el || event.target !== event.currentTarget) return;
    const track = event.currentTarget.getBoundingClientRect();
    const share = (event.clientX - track.left) / track.width;
    el.scrollTo({
      left: share * el.scrollWidth - el.clientWidth / 2,
      behavior: "smooth",
    });
  }

  // `< 0.999`: tránh thanh nhấp nháy vì sai số làm tròn khi vừa đủ chỗ.
  const overflowing = ratio < 0.999;
  const progress = ratio < 1 ? Math.round((offset / (1 - ratio)) * 100) : 0;

  return (
    <div className={cn("relative", rootClassName)}>
      <div
        id={controlsId}
        ref={scroller}
        tabIndex={tabIndex}
        className={cn("scrollbar-none overflow-x-auto", className)}
      >
        {children}
      </div>

      {overflowing ? (
        <div
          onPointerDown={jumpTo}
          className={cn(
            "relative mt-1 flex h-4 w-full cursor-pointer items-center",
            trackClassName,
          )}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 h-1.5 rounded-full bg-border/50"
          />
          <div
            role="scrollbar"
            aria-orientation="horizontal"
            aria-controls={controlsId}
            aria-valuenow={Math.min(100, Math.max(0, progress))}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            /* `touch-none`: không nhường cử chỉ cho trình duyệt, nếu không thì
               kéo thanh lại hoá ra cuộn dọc cả trang. `h-4` là vùng chạm —
               phần nhìn thấy chỉ 6px, chạm vào 6px thì trượt tay. */
            className="relative h-4 touch-none py-[5px]"
            style={{
              width: `${ratio * 100}%`,
              marginLeft: `${offset * 100}%`,
            }}
          >
            <span className="block size-full rounded-full bg-muted-foreground/60 transition-colors" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
