import { NextRequest } from "next/server";

import { chatSchema } from "@/lib/validations";
import { searchSlugsForRag } from "@/lib/search";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { auth } from "@/auth";
import { AiError, isConfigured, streamAnswer } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Chỉ dẫn hệ thống — phần tĩnh, giữ nguyên giữa các request. */
const SYSTEM_VI = `Bạn là trợ lý khoa học của Sciencepedia — một bách khoa toàn thư khoa học mở.

Nguyên tắc trả lời:
- Trả lời bằng tiếng Việt, chính xác về mặt khoa học, giọng điệu rõ ràng và thân thiện.
- Ưu tiên dựa vào phần NGỮ CẢNH được cung cấp bên dưới. Khi dùng thông tin từ một bài viết, hãy dẫn nguồn bằng cú pháp [slug-bai-viet] ngay sau câu liên quan.
- Nếu ngữ cảnh không đủ, hãy trả lời bằng kiến thức chung nhưng nói rõ rằng thông tin đó chưa có trong kho bài viết.
- Không bịa số liệu, tên nghiên cứu hay trích dẫn. Nếu không chắc, hãy nói là không chắc.
- Với câu hỏi về sức khoẻ: cung cấp thông tin tham khảo, luôn nhắc người đọc tham vấn bác sĩ, và không đưa ra chẩn đoán hay phác đồ điều trị cá nhân.
- Độ dài vừa phải: 2–5 đoạn ngắn. Dùng gạch đầu dòng khi liệt kê. Dùng Markdown.`;

const SYSTEM_EN = `You are the science assistant for Sciencepedia, an open science encyclopedia.

How to answer:
- Answer in English, scientifically accurate, in a clear and friendly voice.
- Prefer the CONTEXT provided below. When you use an article, cite it as [article-slug] right after the relevant sentence.
- If the context is insufficient, answer from general knowledge but say plainly that it is not yet covered by the library.
- Never invent figures, study names or citations. If unsure, say so.
- For health questions: give reference information, always remind the reader to consult a doctor, and never give a personal diagnosis or treatment plan.
- Keep it to 2-5 short paragraphs. Use bullet lists where they help. Use Markdown.`;

/** Số bài đưa vào ngữ cảnh, và số ký tự tối đa lấy từ mỗi bài. */
const CONTEXT_ARTICLES = 5;
const CONTEXT_CHARS_PER_ARTICLE = 2500;

/**
 * Lấy các bài viết liên quan làm ngữ cảnh cho câu hỏi mới nhất.
 *
 * Meilisearch chỉ dùng để XẾP HẠNG, nội dung lấy từ Postgres. Lý do: `body` và
 * `bodyEn` nằm trong `searchableAttributes` nhưng KHÔNG nằm trong
 * `displayedAttributes`, nên kết quả search không mang theo phần thân bài —
 * `hit.body` là `undefined` lúc chạy. Thêm chúng vào displayedAttributes sẽ
 * khiến mọi response của /api/search phình thêm vài KB mỗi hit và đẩy toàn văn
 * bài viết ra client một cách không cần thiết.
 */
async function buildContext(question: string, locale: "vi" | "en") {
  try {
    const { slugs } = await searchSlugsForRag(question, CONTEXT_ARTICLES);
    if (slugs.length === 0) return null;

    const articles = await prisma.article.findMany({
      where: { slug: { in: slugs }, status: "PUBLISHED" },
      select: {
        slug: true,
        title: true,
        titleEn: true,
        summary: true,
        summaryEn: true,
        content: true,
        contentEn: true,
      },
    });

    // Giữ đúng thứ tự liên quan mà Meilisearch trả về
    const bySlug = new Map(articles.map((article) => [article.slug, article]));
    const ordered = slugs
      .map((slug) => bySlug.get(slug))
      .filter((article): article is NonNullable<typeof article> =>
        Boolean(article),
      );

    if (ordered.length === 0) return null;

    const blocks = ordered.map((article) => {
      const en = locale === "en";
      const title = (en ? article.titleEn : null) ?? article.title;
      const summary = (en ? article.summaryEn : null) ?? article.summary;
      const content = (en ? article.contentEn : null) ?? article.content;

      return [
        `### [${article.slug}] ${title}`,
        summary,
        content.slice(0, CONTEXT_CHARS_PER_ARTICLE),
      ].join("\n\n");
    });

    return {
      text: blocks.join("\n\n---\n\n"),
      slugs: ordered.map((article) => article.slug),
    };
  } catch (error) {
    console.error("[ai] không dựng được ngữ cảnh:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!isConfigured()) {
    return Response.json({ error: "NOT_CONFIGURED" }, { status: 503 });
  }

  // Giới hạn theo user nếu đã đăng nhập, còn lại theo IP
  const session = await auth();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(session?.user?.id ?? `ip:${ip}`, {
    limit: session?.user ? 30 : 10,
    windowMs: 60_000,
  });

  if (!limit.ok) {
    return Response.json(
      { error: "RATE_LIMITED" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
        },
      },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = chatSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { messages, locale } = parsed.data;
  const lastQuestion = [...messages].reverse().find((m) => m.role === "user");
  const context = lastQuestion
    ? await buildContext(lastQuestion.content, locale)
    : null;

  const system = [
    locale === "en" ? SYSTEM_EN : SYSTEM_VI,
    ...(context
      ? [
          (locale === "en"
            ? "CONTEXT (Sciencepedia articles):\n\n"
            : "NGỮ CẢNH (bài viết Sciencepedia):\n\n") + context.text,
        ]
      : []),
  ].join("\n\n");

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        if (context) send("sources", { slugs: context.slugs });

        let usage: { input?: number; output?: number; total?: number } = {};
        let provider: string | undefined;
        let model: string | undefined;

        for await (const event of streamAnswer({
          system,
          turns: messages,
          // Người dùng bấm Dừng -> fetch bị abort -> huỷ luôn request lên nhà cung cấp
          signal: request.signal,
        })) {
          switch (event.type) {
            case "provider":
              provider = event.provider;
              model = event.model;
              // Cho giao diện biết ai đang trả lời — hữu ích khi đã fallback
              send("provider", { provider: event.provider, model: event.model });
              break;
            case "delta":
              send("delta", { text: event.text });
              break;
            case "usage":
              // usage chỉ đầy đủ ở chunk cuối, cứ ghi đè dần
              usage = {
                input: event.input,
                output: event.output,
                total: event.total,
              };
              break;
            case "blocked":
              send("error", {
                code: event.reason ? "BLOCKED" : "EMPTY_RESPONSE",
              });
              break;
          }
        }

        send("done", { usage, provider, model });
      } catch (error) {
        // Người dùng bấm Dừng — không phải lỗi
        if ((error as Error)?.name === "AbortError") return;

        const code =
          error instanceof AiError ? error.code : "UPSTREAM_ERROR";
        console.error("[ai] tất cả nhà cung cấp đều thất bại:", error);
        send("error", { code });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
