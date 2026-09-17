"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { GlossaryDetail } from "@/lib/glossary";

/**
 * Cache theo phiên trang, dùng chung giữa mọi `<GlossaryTerm>`.
 *
 * Lưu PROMISE chứ không lưu kết quả: hai thuật ngữ cùng slug mở gần như cùng
 * lúc thì dùng chung một request thay vì bắn hai. Request hỏng thì bị gỡ khỏi
 * cache để lần bấm "Thử lại" gọi lại thật.
 */
const detailCache = new Map<string, Promise<GlossaryDetail>>();

function loadDetail(slug: string, locale: string) {
  const key = `${locale}:${slug}`;
  let pending = detailCache.get(key);
  if (!pending) {
    pending = fetch(
      `/api/glossary/${encodeURIComponent(slug)}?locale=${locale}`,
    ).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<GlossaryDetail>;
    });
    pending.catch(() => detailCache.delete(key));
    detailCache.set(key, pending);
  }
  return pending;
}

export type ExplainStatus = "idle" | "loading" | "streaming" | "done" | "error";

/**
 * Trạng thái phía client của một mục từ: chi tiết (khi `enabled`) và phần
 * "Giải thích dễ hiểu" do AI sinh.
 *
 * `enabled` gắn với việc modal có mở hay không — tooltip không gọi hook này
 * để lấy dữ liệu, định nghĩa ngắn của nó đến từ props render sẵn trên server.
 */
export function useGlossary(
  slug: string,
  { locale, enabled }: { locale: string; enabled: boolean },
) {
  const [detail, setDetail] = useState<GlossaryDetail | null>(null);
  const [detailError, setDetailError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setDetailError(false);
    loadDetail(slug, locale)
      .then((data) => !cancelled && setDetail(data))
      .catch(() => !cancelled && setDetailError(true));
    return () => {
      cancelled = true;
    };
  }, [slug, locale, enabled, attempt]);

  const retryDetail = useCallback(() => setAttempt((n) => n + 1), []);

  // ---------------------------------------------------------------- AI

  const [explanation, setExplanation] = useState("");
  const [explainStatus, setExplainStatus] = useState<ExplainStatus>("idle");
  const [explainError, setExplainError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // Đóng modal giữa chừng thì huỷ luôn request lên nhà cung cấp — không đốt
  // quota cho một câu trả lời không ai đọc.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const explain = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setExplanation("");
    setExplainError(null);
    setExplainStatus("loading");

    try {
      const response = await fetch(
        `/api/glossary/${encodeURIComponent(slug)}/explain`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale }),
          signal: controller.signal,
        },
      );

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "UPSTREAM_ERROR");
      }

      setExplainStatus("streaming");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setExplanation((text) => text + chunk);
      }
      setExplainStatus("done");
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setExplainError((error as Error).message);
      setExplainStatus("error");
    }
  }, [slug, locale]);

  return {
    detail,
    detailError,
    retryDetail,
    explanation,
    explainStatus,
    explainError,
    explain,
  };
}
