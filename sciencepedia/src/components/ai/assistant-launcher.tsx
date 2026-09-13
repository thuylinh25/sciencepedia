"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

import { usePathname } from "@/i18n/navigation";
import { AssistantChat } from "@/components/ai/assistant-chat";

/** Khoá `sessionStorage` đánh dấu nhãn chữ đã bung một lần trong phiên này. */
const LABEL_SEEN_KEY = "sciencepedia:assistant-label-seen";

/** Nút nổi mở trợ lý AI ở mọi trang, trừ trang /assistant và khu quản trị. */
export function AssistantLauncher() {
  const t = useTranslations("ai");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  /**
   * Nhãn chữ cạnh icon.
   *
   * Nút tròn chỉ có một bong bóng thoại không nói được nó làm gì — người dùng
   * đoán ra "chat hỗ trợ", tức là đoán sai: đây là trợ lý trả lời câu hỏi khoa
   * học, không phải kênh liên hệ.
   *
   * Bung ra sau 4 giây, và **chỉ một lần mỗi phiên**. Bung lại ở mỗi lần tải
   * trang là quấy rối: người đã đọc nhãn một lần rồi thì lần thứ mười nó chỉ
   * còn là thứ nhảy vào mắt. `sessionStorage` giữ dấu trong đúng tab đó, và
   * mất khi đóng tab — vừa đủ để "phiên này đã thấy rồi".
   */
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(LABEL_SEEN_KEY) === "1";
    } catch {
      // Chế độ riêng tư hoặc trình duyệt chặn lưu trữ: coi như chưa thấy. Thà
      // hiện thừa một lần còn hơn ném lỗi làm hỏng cả nút.
    }
    if (seen) return;

    const show = setTimeout(() => {
      setShowLabel(true);
      try {
        sessionStorage.setItem(LABEL_SEEN_KEY, "1");
      } catch {
        /* không lưu được thì thôi, nhãn vẫn hiện đúng lần này */
      }
    }, 4000);

    // Thu lại sau 6 giây để nút về đúng kích thước cũ, không chiếm chỗ mãi.
    const hide = setTimeout(() => setShowLabel(false), 10000);

    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  // Bảng này là một hộp thoại: Esc phải đóng được nó. Trước đây người dùng bàn
  // phím mở ra rồi chỉ còn cách tab ngược lại nút để đóng.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /* Trang xác thực KHÔNG có nút trợ lý.

     Không phải vì nó che mất gì — nó nằm ở góc dưới phải, cách form một quãng.
     Lý do là sự chú ý: trang đăng nhập có đúng MỘT việc để làm, và một nút
     tròn màu vàng tự bung nhãn chữ sau 4 giây là thứ duy nhất trên màn hình
     chuyển động. Nó thắng cuộc tranh chú ý với chính CTA mà trang sinh ra để
     phục vụ.

     Ẩn hẳn chứ không thu nhỏ: thu nhỏ vẫn giữ nguyên chuyển động, mà chuyển
     động mới là thứ kéo mắt, không phải kích thước.

     Bốn route chứ không chỉ /login và /register: quên mật khẩu và đặt lại mật
     khẩu là cùng một luồng, và người đang ở đó còn ít kiên nhẫn hơn. */
  const AUTH_ROUTES = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  if (
    pathname.startsWith("/assistant") ||
    pathname.startsWith("/admin") ||
    AUTH_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    )
  ) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-4 bottom-24 z-50 flex h-[min(32rem,70dvh)] w-[min(26rem,calc(100vw-2rem))] flex-col rounded-2xl border bg-background p-4 shadow-2xl"
            role="dialog"
            aria-label={t("title")}
          >
            <AssistantChat compact />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("title")}
        /* `title` cho tooltip gốc của trình duyệt khi rê chuột.

           Dùng thuộc tính gốc chứ không dựng tooltip riêng: tooltip tự làm cần
           state, cần định vị, cần xử lý bàn phím và màn hình cảm ứng, để đổi
           lấy đúng một dòng chữ. `title` có sẵn tất cả những thứ đó. */
        title={t("askLabel")}
        // env(safe-area-inset-bottom): trên iPhone có thanh chỉ báo trang chủ,
        // bottom-4 thuần đặt nút đè lên vùng vuốt của hệ điều hành.
        /* Đẩy cao hơn trên điện thoại.

           Ở `bottom: 1rem` nút nằm đè lên dòng chữ cuối của phần tử cuối
           trang — trên màn hình hẹp thì gần như luôn có một dòng ở đó. 1,5rem
           cộng safe area cho khoảng cách tối thiểu 24px tới nội dung, và
           `main` cũng được đệm dưới đúng bằng chiều cao nút cộng khoảng cách
           đó (xem layout) nên không còn gì lọt xuống dưới nó.

           Từ `sm` trở lên thì lề trang đã đủ rộng, giữ nguyên 1rem. */
        /* Viên thuốc co giãn thay vì hình tròn cứng.

           `h-12` và `rounded-full`; bề rộng do chính nhãn quyết định. Nhãn thu
           về `max-w-0` thì nút còn đúng 48px — bằng chiều cao, tức tròn. Chuyển
           động chỉ nằm ở bề rộng của chính nút, mà nút là `position: fixed`,
           nên không đẩy một pixel nào của trang.

           56px → 48px (nhỏ đi 14%) và icon 24px → 20px. Nút này nổi trên MỌI
           trang, kể cả những trang mà việc chính là đọc; ở 56px nó là vật sáng
           màu lớn thứ hai trên màn hình sau tiêu đề. Bù lại, `hover:scale-105`
           lên `hover:scale-110`: nhỏ khi bị lờ đi, lớn rõ khi được chú ý.

           48px vẫn trên ngưỡng 44px của WCAG cho vùng chạm, nên nhỏ đi không
           đổi lấy khả năng bấm trúng trên di động.

           Nhãn dùng `max-w` chứ không `display`: `display` không chuyển động
           được, và nhãn bật/tắt đột ngột trông như lỗi render. */
        className="fixed right-4 bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.75rem))] z-50 flex h-12 items-center justify-center rounded-full bg-primary px-3.5 text-primary-foreground shadow-lg transition-[transform,width] duration-300 ease-out hover:scale-110 active:scale-95 sm:bottom-[max(1rem,env(safe-area-inset-bottom))]"
      >
        {open ? (
          <X className="size-5 shrink-0" />
        ) : (
          <MessageCircle className="size-5 shrink-0" />
        )}
        <span
          className={`overflow-hidden ps-2 text-sm font-semibold whitespace-nowrap transition-[max-width,opacity] duration-300 ease-out ${
            showLabel && !open ? "max-w-40 opacity-100" : "max-w-0 opacity-0"
          }`}
        >
          {t("askLabel")}
        </span>
      </button>
    </>
  );
}
