"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

import { usePathname } from "@/i18n/navigation";
import { AssistantChat } from "@/components/ai/assistant-chat";

/** Nút nổi mở trợ lý AI ở mọi trang, trừ trang /assistant và khu quản trị. */
export function AssistantLauncher() {
  const t = useTranslations("ai");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/assistant") || pathname.startsWith("/admin")) {
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
        aria-label={t("title")}
        className="fixed right-4 bottom-4 z-50 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {open ? (
          <X className="size-6" />
        ) : (
          <MessageCircle className="size-6" />
        )}
      </button>
    </>
  );
}
