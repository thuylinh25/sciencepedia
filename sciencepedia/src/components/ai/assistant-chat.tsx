"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, Loader2, RotateCcw, Sparkles, Square } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());

export function AssistantChat({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("ai");
  const locale = useLocale();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  /**
   * Nhận câu hỏi từ `?q=` — dùng cho các câu hỏi bấm được ở trang chủ.
   *
   * Đọc phía client bằng `window.location.search` chứ KHÔNG dùng `searchParams`
   * của trang: dùng searchParams sẽ đẩy /assistant sang render động, mà trang
   * đó đang tĩnh và không có lý do gì để đổi chỉ vì một tham số tuỳ chọn.
   *
   * Chỉ điền vào ô nhập, KHÔNG tự gửi. Một cú bấm nhầm không nên tiêu một lượt
   * gọi mô hình, và người đọc còn có thể muốn sửa câu hỏi trước khi hỏi.
   */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (!q) return;
    setInput(q.slice(0, 500));
    textareaRef.current?.focus();
  }, []);

  const suggestions = [
    t("suggestions.one"),
    t("suggestions.two"),
    t("suggestions.three"),
    t("suggestions.four"),
  ];

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || streaming) return;

    setError(null);
    setInput("");

    const history = [...messages, { id: newId(), role: "user" as const, content: trimmed }];
    const assistantId = newId();

    setMessages([...history, { id: assistantId, role: "assistant", content: "" }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          locale,
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "UPSTREAM_ERROR");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Đọc SSE: mỗi sự kiện kết thúc bằng một dòng trống
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const eventLine = chunk.match(/^event: (.+)$/m);
          const dataLine = chunk.match(/^data: (.+)$/m);
          if (!eventLine || !dataLine) continue;

          const event = eventLine[1];
          const data = JSON.parse(dataLine[1]);

          if (event === "delta") {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, content: message.content + data.text }
                  : message,
              ),
            );
          } else if (event === "sources") {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? { ...message, sources: data.slugs }
                  : message,
              ),
            );
          } else if (event === "error") {
            throw new Error(data.code);
          }
        }
      }
    } catch (caught) {
      if ((caught as Error).name === "AbortError") return;

      // Mã lỗi do /api/ai/chat gửi qua sự kiện SSE `error`
      const MESSAGE_BY_CODE: Record<string, string> = {
        NOT_CONFIGURED: t("notConfigured"),
        RATE_LIMITED: t("rateLimited"),
        OVERLOADED: t("overloaded"),
        BLOCKED: t("blocked"),
        MODEL_UNAVAILABLE: t("modelUnavailable"),
      };

      const code = (caught as Error).message;
      setError(MESSAGE_BY_CODE[code] ?? t("error"));
      // Bỏ bong bóng rỗng của trợ lý khi request hỏng
      setMessages((current) =>
        current.filter((message) => message.content !== ""),
      );
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send(input);
    }
  }

  return (
    <div className={cn("flex flex-col", compact ? "h-full" : "h-[70vh] min-h-[32rem]")}>
      {/* ------------------------------------------------------ Hội thoại */}
      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 py-10 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary-strong">
              <Sparkles className="size-7" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold">{t("title")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>

            <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-xl border px-4 py-3 text-left text-sm transition-colors hover:border-accent hover:bg-accent/10"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" && "justify-end",
              )}
            >
              {message.role === "assistant" && (
                <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary-strong">
                  <Sparkles className="size-4" />
                </span>
              )}

              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {message.role === "assistant" && message.content === "" ? (
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    {t("thinking")}
                  </span>
                ) : (
                  <div
                    className={cn(
                      "prose prose-sm dark:prose-invert max-w-none",
                      message.role === "user" &&
                        "prose-invert prose-p:text-primary-foreground",
                    )}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}

                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
                    <span className="text-xs text-muted-foreground">
                      {t("sources")}
                    </span>
                    {message.sources.map((slug) => (
                      <Link key={slug} href={`/articles/${slug}`}>
                        <Badge
                          variant="outline"
                          className="transition-colors hover:border-accent"
                        >
                          {slug}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        <div ref={bottomRef} />
      </div>

      {/* ------------------------------------------------------ Nhập liệu */}
      <div className="mt-4 shrink-0">
        {error && (
          <p className="mb-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="relative rounded-2xl border bg-card shadow-sm focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder={t("placeholder")}
            disabled={streaming}
            className="max-h-40 w-full resize-none bg-transparent px-4 py-3.5 pr-24 text-sm outline-none disabled:opacity-60"
          />

          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
            {messages.length > 0 && !streaming && (
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => {
                  setMessages([]);
                  setError(null);
                }}
                aria-label={t("clear")}
              >
                <RotateCcw className="size-4" />
              </Button>
            )}

            {streaming ? (
              <Button size="icon-sm" variant="outline" onClick={stop}>
                <Square className="size-3.5 fill-current" />
                <span className="sr-only">{t("stop")}</span>
              </Button>
            ) : (
              <Button
                size="icon-sm"
                onClick={() => send(input)}
                disabled={!input.trim()}
                aria-label={t("send")}
              >
                <ArrowUp className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t("disclaimer")}
        </p>
      </div>
    </div>
  );
}
