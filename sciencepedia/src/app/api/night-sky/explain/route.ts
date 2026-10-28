import { NextRequest } from "next/server";

import { AiError, isConfigured, streamAnswer } from "@/lib/ai";
import { rateLimitShared } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * AI giải thích "bạn đang nhìn gì" cho trang Mô phỏng bầu trời.
 *
 * ## Ranh giới sự thật của endpoint này
 *
 * Mô hình KHÔNG được tự biết gì về bầu trời: mọi dữ kiện (nơi, lúc, trạng
 * thái Mặt Trời, pha trăng, các thiên thể đang ở trên chân trời kèm độ
 * cao/hướng) đều do client tính bằng astronomy-engine rồi gửi lên, và chỉ
 * dẫn hệ thống bắt mô hình chỉ dùng đúng các dữ kiện đó. Endpoint này là
 * lớp DIỄN GIẢI trên số đã tính, không phải một nguồn số thứ hai — cùng
 * nguyên tắc với trợ lý: không bịa số liệu.
 *
 * Hạ tầng gọi mô hình dùng lại nguyên vẹn `src/lib/ai.ts` (Gemini →
 * OpenRouter dự phòng) và bộ giới hạn dùng chung của `/api/ai/chat` —
 * không có đường gọi nhà cung cấp nào khác ngoài hai nơi đó.
 */

const SYSTEM_VI = `Bạn là người kể chuyện bầu trời của Sciencepedia. Người đọc đang mở công cụ Mô phỏng bầu trời và muốn biết mình đang nhìn thấy gì.

Nguyên tắc bắt buộc:
- CHỈ dùng các dữ kiện trong phần DỮ KIỆN được cung cấp: nơi quan sát, thời điểm, trạng thái Mặt Trời, Mặt Trăng và danh sách thiên thể kèm độ cao/hướng. Không nhắc tới bất kỳ thiên thể, con số hay sự kiện nào không có trong dữ kiện.
- Viết 3–5 câu tiếng Việt, giọng thân thiện, gợi cảm giác ngẩng lên nhìn thật. Nói rõ thiên thể nào đáng nhìn nhất lúc này dựa trên độ cao trong dữ kiện.
- Không dùng Markdown, không gạch đầu dòng, không tiêu đề — chỉ một đoạn văn liền mạch.`;

const SYSTEM_EN = `You are Sciencepedia's sky narrator. The reader has the Sky Simulator open and wants to know what they are looking at.

Hard rules:
- Use ONLY the facts in the FACTS block provided: the observing place, the moment, the Sun's state, the Moon, and the listed objects with their altitudes and directions. Never mention any object, figure or event that is not in the facts.
- Write 3–5 sentences in English, friendly in tone, evoking the feeling of actually looking up. Point out which object is most worth looking at right now, based on the altitudes in the facts.
- No Markdown, no bullet points, no headings — one flowing paragraph only.`;

type ExplainBody = {
  locale: string;
  placeName: string;
  wallTimeText: string;
  sunState: string;
  moonLine: string;
  objects: { name: string; altDeg: number; compass: string }[];
};

function parseBody(raw: unknown): ExplainBody | null {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;
  const shortText = (value: unknown, max: number): string | null =>
    typeof value === "string" && value.length > 0 && value.length <= max
      ? value
      : null;

  const locale = body.locale === "en" ? "en" : body.locale === "vi" ? "vi" : null;
  const placeName = shortText(body.placeName, 120);
  const wallTimeText = shortText(body.wallTimeText, 120);
  const sunState = shortText(body.sunState, 300);
  const moonLine = shortText(body.moonLine, 300);
  if (!locale || !placeName || !wallTimeText || !sunState || !moonLine) {
    return null;
  }
  if (!Array.isArray(body.objects) || body.objects.length > 8) return null;
  const objects: ExplainBody["objects"] = [];
  for (const item of body.objects) {
    if (typeof item !== "object" || item === null) return null;
    const record = item as Record<string, unknown>;
    const name = shortText(record.name, 80);
    const compass = shortText(record.compass, 40);
    if (
      !name ||
      !compass ||
      typeof record.altDeg !== "number" ||
      !Number.isFinite(record.altDeg)
    ) {
      return null;
    }
    objects.push({ name, altDeg: record.altDeg, compass });
  }
  return { locale, placeName, wallTimeText, sunState, moonLine, objects };
}

export async function POST(request: NextRequest) {
  if (!isConfigured()) {
    return Response.json({ error: "NOT_CONFIGURED" }, { status: 503 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await rateLimitShared(`night-sky-explain:ip:${ip}`, {
    limit: 10,
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

  let parsed: ExplainBody | null = null;
  try {
    parsed = parseBody(await request.json());
  } catch {
    parsed = null;
  }
  if (!parsed) {
    return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const facts =
    parsed.locale === "en"
      ? [
          `Place: ${parsed.placeName}`,
          `Moment: ${parsed.wallTimeText}`,
          `Sun: ${parsed.sunState}`,
          `Moon: ${parsed.moonLine}`,
          parsed.objects.length > 0
            ? `Objects above the horizon: ${parsed.objects
                .map((o) => `${o.name} (${Math.round(o.altDeg)}° up, toward the ${o.compass})`)
                .join("; ")}`
            : "Objects above the horizon: none besides the Moon",
        ].join("\n")
      : [
          `Nơi quan sát: ${parsed.placeName}`,
          `Thời điểm: ${parsed.wallTimeText}`,
          `Mặt Trời: ${parsed.sunState}`,
          `Mặt Trăng: ${parsed.moonLine}`,
          parsed.objects.length > 0
            ? `Thiên thể đang ở trên chân trời: ${parsed.objects
                .map((o) => `${o.name} (cao ${Math.round(o.altDeg)}°, hướng ${o.compass})`)
                .join("; ")}`
            : "Thiên thể đang ở trên chân trời: không có hành tinh nào, ngoài Mặt Trăng",
        ].join("\n");

  try {
    let text = "";
    let blocked = false;
    for await (const event of streamAnswer({
      system: parsed.locale === "en" ? SYSTEM_EN : SYSTEM_VI,
      turns: [{ role: "user", content: facts }],
      signal: request.signal,
    })) {
      if (event.type === "delta") text += event.text;
      if (event.type === "blocked") blocked = true;
    }
    const trimmed = text.trim();
    if (blocked || trimmed.length === 0) {
      return Response.json({ error: "NO_ANSWER" }, { status: 502 });
    }
    return Response.json({ text: trimmed });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      return Response.json({ error: "ABORTED" }, { status: 499 });
    }
    const code = error instanceof AiError ? error.code : "UPSTREAM_ERROR";
    return Response.json(
      { error: code },
      { status: code === "RATE_LIMITED" ? 429 : 502 },
    );
  }
}
