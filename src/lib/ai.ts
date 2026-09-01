import "server-only";

import { GoogleGenAI } from "@google/genai";

/**
 * Lớp gọi mô hình cho trợ lý khoa học.
 *
 * Chính:   Google Gemini.
 * Dự phòng: OpenRouter với các model miễn phí, thử theo thứ tự.
 *
 * Vì sao cần dự phòng: pool miễn phí dùng chung nên thường xuyên 429, và
 * Gemini cũng trả 503 "high demand" vào giờ cao điểm. Đã gặp cả hai trong
 * lúc dựng dự án.
 */

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type AiEvent =
  | { type: "provider"; provider: Provider; model: string }
  | { type: "delta"; text: string }
  | { type: "blocked"; reason?: string }
  | { type: "usage"; input?: number; output?: number; total?: number };

export type Provider = "gemini" | "openrouter";

export class AiError extends Error {
  constructor(
    public code: AiErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "AiError";
  }
}

export type AiErrorCode =
  | "NOT_CONFIGURED"
  | "RATE_LIMITED"
  | "OVERLOADED"
  | "MODEL_UNAVAILABLE"
  | "UPSTREAM_ERROR";

/** Các mã lỗi đáng chuyển sang nhà cung cấp khác thay vì báo lỗi ngay. */
const RETRYABLE: ReadonlySet<AiErrorCode> = new Set([
  "RATE_LIMITED",
  "OVERLOADED",
  "MODEL_UNAVAILABLE",
]);

/**
 * `gemini-2.5-flash` trả 404 "no longer available to new users" với API key
 * mới — đã kiểm chứng trực tiếp. Mặc định dùng `gemini-3.6-flash`, chính là
 * model mà API gợi ý thay thế. Đổi bằng GEMINI_MODEL nếu tài khoản của bạn
 * có quyền dùng model khác.
 */
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

/**
 * Chuỗi model miễn phí trên OpenRouter, thử lần lượt từ trên xuống.
 * glm-5.2 đứng đầu theo yêu cầu; minimax-m3 là lựa chọn đã kiểm chứng chạy
 * được và trả lời tiếng Việt tốt khi glm bị 429.
 *
 * Tránh các model hay rò rỉ chain-of-thought vào phần trả lời
 * (ví dụ nemotron-3.5-lightning) — người đọc sẽ thấy cả phần suy luận thô.
 */
const OPENROUTER_MODELS = (
  process.env.OPENROUTER_MODELS ??
  "z-ai/glm-5.2:free,minimax/minimax-m3:free,google/gemma-4-31b-it:free"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

const MAX_OUTPUT_TOKENS = 4096;

// ------------------------------------------------------------------ Gemini

function classifyGeminiError(error: unknown): AiErrorCode {
  const status = (error as { status?: number })?.status;
  const message = (error as Error)?.message ?? "";

  if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(message)) {
    return "RATE_LIMITED";
  }
  if (status === 503 || /UNAVAILABLE|high demand|overloaded/i.test(message)) {
    return "OVERLOADED";
  }
  if (status === 404 || /no longer available|NOT_FOUND/i.test(message)) {
    return "MODEL_UNAVAILABLE";
  }
  if (
    status === 401 ||
    status === 403 ||
    /API key|UNAUTHENTICATED|PERMISSION_DENIED/i.test(message)
  ) {
    return "NOT_CONFIGURED";
  }
  return "UPSTREAM_ERROR";
}

async function* streamGemini(
  system: string,
  turns: ChatTurn[],
  signal: AbortSignal,
): AsyncGenerator<AiEvent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AiError("NOT_CONFIGURED", "Thiếu GEMINI_API_KEY");

  const ai = new GoogleGenAI({ apiKey });

  let result;
  try {
    result = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      // Gemini dùng role "model" cho lượt trợ lý, không phải "assistant"
      contents: turns.map((turn) => ({
        role: turn.role === "assistant" ? "model" : "user",
        parts: [{ text: turn.content }],
      })),
      config: {
        systemInstruction: system,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: 0.7,
        abortSignal: signal,
      },
    });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw new AiError(classifyGeminiError(error), (error as Error)?.message);
  }

  yield { type: "provider", provider: "gemini", model: GEMINI_MODEL };

  let produced = false;
  let blockReason: string | undefined;

  try {
    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        produced = true;
        yield { type: "delta", text };
      }

      blockReason ??= chunk.promptFeedback?.blockReason ?? undefined;

      if (chunk.usageMetadata) {
        yield {
          type: "usage",
          input: chunk.usageMetadata.promptTokenCount,
          output: chunk.usageMetadata.candidatesTokenCount,
          total: chunk.usageMetadata.totalTokenCount,
        };
      }
    }
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw new AiError(classifyGeminiError(error), (error as Error)?.message);
  }

  if (!produced) yield { type: "blocked", reason: blockReason };
}

// ------------------------------------------------------------------ OpenRouter

/**
 * OpenRouter dùng giao thức tương thích OpenAI. Gọi bằng fetch thay vì thêm
 * một SDK nữa: chỉ cần một endpoint và định dạng SSE đã được tài liệu hoá.
 */
async function* streamOpenRouter(
  model: string,
  system: string,
  turns: ChatTurn[],
  signal: AbortSignal,
): AsyncGenerator<AiEvent> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new AiError("NOT_CONFIGURED", "Thiếu OPENROUTER_API_KEY");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // OpenRouter dùng hai header này để ghi nhận nguồn gọi
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      "X-Title": process.env.NEXT_PUBLIC_SITE_NAME ?? "Sciencepedia",
    },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        ...turns.map((turn) => ({ role: turn.role, content: turn.content })),
      ],
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    const code: AiErrorCode =
      response.status === 429
        ? "RATE_LIMITED"
        : response.status === 402
          ? "RATE_LIMITED" // hết credit — coi như tạm thời để thử model kế tiếp
          : response.status === 404
            ? "MODEL_UNAVAILABLE"
            : response.status === 401 || response.status === 403
              ? "NOT_CONFIGURED"
              : response.status >= 500
                ? "OVERLOADED"
                : "UPSTREAM_ERROR";

    throw new AiError(code, `${model}: HTTP ${response.status} ${detail.slice(0, 300)}`);
  }

  yield { type: "provider", provider: "openrouter", model };

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let produced = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      // OpenRouter chèn dòng comment ": OPENROUTER PROCESSING" để giữ kết nối
      if (!line.startsWith("data: ")) continue;

      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;

      let parsed: {
        choices?: { delta?: { content?: string } }[];
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
        error?: { message?: string; code?: number };
      };
      try {
        parsed = JSON.parse(payload);
      } catch {
        continue;
      }

      // Lỗi có thể xuất hiện GIỮA luồng, không chỉ ở HTTP status
      if (parsed.error) {
        throw new AiError(
          parsed.error.code === 429 ? "RATE_LIMITED" : "UPSTREAM_ERROR",
          `${model}: ${parsed.error.message ?? "lỗi giữa luồng"}`,
        );
      }

      const delta = parsed.choices?.[0]?.delta?.content;
      if (delta) {
        produced = true;
        yield { type: "delta", text: delta };
      }

      if (parsed.usage) {
        yield {
          type: "usage",
          input: parsed.usage.prompt_tokens,
          output: parsed.usage.completion_tokens,
          total: parsed.usage.total_tokens,
        };
      }
    }
  }

  if (!produced) yield { type: "blocked" };
}

// ------------------------------------------------------------------ Điều phối

export function isConfigured() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY);
}

/**
 * Chạy Gemini trước; nếu lỗi thuộc nhóm tạm thời thì lần lượt thử các model
 * miễn phí trên OpenRouter.
 *
 * Quy tắc quan trọng: CHỈ chuyển nhà cung cấp khi chưa gửi chữ nào cho người
 * dùng. Nếu đã stream ra một phần rồi mới lỗi, việc chạy lại model khác sẽ
 * làm câu trả lời bị chắp vá hai giọng khác nhau — thà báo lỗi để người dùng
 * gửi lại.
 */
export async function* streamAnswer({
  system,
  turns,
  signal,
}: {
  system: string;
  turns: ChatTurn[];
  signal: AbortSignal;
}): AsyncGenerator<AiEvent> {
  const attempts: { run: () => AsyncGenerator<AiEvent>; label: string }[] = [];

  if (process.env.GEMINI_API_KEY) {
    attempts.push({
      run: () => streamGemini(system, turns, signal),
      label: `gemini:${GEMINI_MODEL}`,
    });
  }

  if (process.env.OPENROUTER_API_KEY) {
    for (const model of OPENROUTER_MODELS) {
      attempts.push({
        run: () => streamOpenRouter(model, system, turns, signal),
        label: `openrouter:${model}`,
      });
    }
  }

  if (attempts.length === 0) {
    throw new AiError("NOT_CONFIGURED", "Chưa cấu hình nhà cung cấp AI nào");
  }

  let lastError: AiError | undefined;

  for (const [index, attempt] of attempts.entries()) {
    let emitted = false;

    try {
      for await (const event of attempt.run()) {
        if (event.type === "delta") emitted = true;
        yield event;
      }
      return; // xong, không cần thử tiếp
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;

      const aiError =
        error instanceof AiError
          ? error
          : new AiError("UPSTREAM_ERROR", (error as Error)?.message);

      lastError = aiError;

      const isLast = index === attempts.length - 1;
      const canFallback = !emitted && RETRYABLE.has(aiError.code) && !isLast;

      console.warn(
        `[ai] ${attempt.label} thất bại (${aiError.code})${
          canFallback ? " — chuyển sang lựa chọn kế tiếp" : ""
        }: ${aiError.message}`,
      );

      if (!canFallback) throw aiError;
    }
  }

  throw lastError ?? new AiError("UPSTREAM_ERROR");
}
