import { NextRequest } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/i18n-content";
import { localeSchema } from "@/lib/validations";
import { rateLimitShared } from "@/lib/rate-limit";
import { AiError, isConfigured, streamAnswer, type AiEvent } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({ locale: localeSchema.default("vi") });

/*
 * ĐỪNG viết "chữ thường" trong prompt để nói "văn bản thuần": Gemini hiểu thành
 * chữ viết thường và bỏ viết hoa đầu câu (đã gặp 17/09).
 *
 * Mô hình KHÔNG được tự định nghĩa thuật ngữ. Nó chỉ được diễn đạt lại định
 * nghĩa đã qua gate accuracy, nên định nghĩa đó nằm ngay trong prompt và mọi
 * luật bên dưới đều neo vào nó. Không có neo này, "giải thích dễ hiểu" là chỗ
 * dễ sinh ra một phép so sánh sai nghe rất thuyết phục nhất trang.
 */
const SYSTEM_VI = `Bạn giải thích thuật ngữ khoa học cho người mới học trên Sciencepedia.

Luật:
- Chỉ diễn đạt lại ĐỊNH NGHĨA ĐÃ THẨM ĐỊNH được cung cấp. Không thêm khẳng định khoa học nào mà định nghĩa không hàm ý.
- Không đưa số liệu, tên người, năm tháng hay nghiên cứu nào.
- Dùng một ví dụ đời thường. Nếu phép so sánh chỉ đúng một phần, nói rõ nó sai ở đâu trong một câu.
- Tối đa 100 từ, 1–2 đoạn ngắn, văn xuôi thuần (viết hoa đầu câu như bình thường), không Markdown, không tiêu đề.
- Trả lời bằng tiếng Việt.`;

const SYSTEM_EN = `You explain science terms to beginners on Sciencepedia.

Rules:
- Only rephrase the VERIFIED DEFINITION provided. Add no scientific claim the definition does not imply.
- No figures, names, dates or studies.
- Use one everyday example. If the analogy is only partly right, say where it breaks in one sentence.
- At most 100 words, 1-2 short paragraphs, plain text, no Markdown, no headings.
- Answer in English.`;

/**
 * Giải thích dễ hiểu cho một mục từ, stream dạng `text/plain`.
 *
 * Client chỉ gửi slug, KHÔNG gửi định nghĩa: định nghĩa đọc từ CSDL. Nhận định
 * nghĩa từ request thì endpoint này thành một proxy LLM miễn phí cho bất kỳ ai
 * gõ curl, đốt chung quota với trợ lý.
 *
 * Kết quả KHÔNG ghi vào CSDL và KHÔNG cache dùng chung. Chữ do mô hình sinh ra
 * chưa qua science-editor; ghi lại rồi phát cho người đọc sau là đưa nội dung
 * chưa thẩm định lên trang bằng cửa sau. Giao diện gắn nhãn "do AI tạo".
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!isConfigured()) {
    return Response.json({ error: "NOT_CONFIGURED" }, { status: 503 });
  }

  const session = await auth();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  // Khoá riêng với /api/ai/chat: đọc bài và bấm vài thuật ngữ không được làm
  // cạn hạn mức trò chuyện của cùng người đó.
  const limit = await rateLimitShared(
    `glossary:${session?.user?.id ?? `ip:${ip}`}`,
    { limit: session?.user ? 20 : 8, windowMs: 60_000 },
  );
  if (!limit.ok) {
    return Response.json(
      { error: "RATE_LIMITED" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) },
      },
    );
  }

  const { slug } = await params;
  const body = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) {
    return Response.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const { locale } = body.data;

  const row = await prisma.glossaryTerm.findUnique({
    where: { slug },
    select: { term: true, termEn: true, shortDef: true, shortDefEn: true, fullDef: true, fullDefEn: true },
  });
  if (!row) return Response.json({ error: "NOT_FOUND" }, { status: 404 });

  const term = pick(locale, row.term, row.termEn);
  const definition = [
    pick(locale, row.shortDef, row.shortDefEn),
    pick(locale, row.fullDef ?? "", row.fullDefEn),
  ]
    .filter(Boolean)
    .join("\n\n");

  const events = streamAnswer({
    system: locale === "en" ? SYSTEM_EN : SYSTEM_VI,
    turns: [
      {
        role: "user",
        content:
          locale === "en"
            ? `Term: ${term}\n\nVERIFIED DEFINITION:\n${definition}`
            : `Thuật ngữ: ${term}\n\nĐỊNH NGHĨA ĐÃ THẨM ĐỊNH:\n${definition}`,
      },
    ],
    signal: request.signal,
  })[Symbol.asyncIterator]();

  /*
   * Kéo tới chữ đầu tiên TRƯỚC khi trả Response. Lỗi nhà cung cấp (hết quota,
   * quá tải) gần như luôn nổ ở đây, và lúc này vẫn còn đặt được HTTP status —
   * client phân biệt được 429 với 502 thay vì nhận một luồng rỗng mã 200.
   */
  let first: IteratorResult<AiEvent>;
  try {
    do {
      first = await events.next();
    } while (!first.done && first.value.type !== "delta" && first.value.type !== "blocked");
  } catch (error) {
    const code = error instanceof AiError ? error.code : "UPSTREAM_ERROR";
    console.error("[glossary] AI thất bại:", error);
    // Nhà cung cấp hết hạn mức/quá tải KHÁC hạn mức của mình (429 ở trên):
    // gộp chung thì giao diện trách người đọc "hỏi nhiều quá" trong khi lỗi
    // nằm ở Gemini/OpenRouter.
    if (code === "RATE_LIMITED" || code === "OVERLOADED" || code === "MODEL_UNAVAILABLE") {
      return Response.json({ error: "AI_BUSY" }, { status: 503 });
    }
    return Response.json({ error: code }, { status: 502 });
  }

  if (first.done || first.value.type !== "delta") {
    return Response.json({ error: "EMPTY_RESPONSE" }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const opening = first.value.text;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(opening));
      try {
        for (let next = await events.next(); !next.done; next = await events.next()) {
          if (next.value.type === "delta") {
            controller.enqueue(encoder.encode(next.value.text));
          }
        }
        controller.close();
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return controller.close();
        console.error("[glossary] AI đứt giữa luồng:", error);
        // Làm reader phía client ném lỗi, để giao diện không coi nửa câu là
        // câu trả lời hoàn chỉnh.
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
