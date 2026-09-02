import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

/**
 * Biên tập lại một bài từ nguồn ngoài thành bài Sciencepedia tiếng Việt.
 *
 * Vì sao không dịch máy nguyên văn: bản tin của NASA hay Physics World là tin
 * tức viết cho người đã biết ngữ cảnh, còn Sciencepedia là bách khoa cho người
 * đọc phổ thông. Dịch thẳng cho ra những câu kiểu "nhóm nghiên cứu đã công bố
 * trên Nature Astronomy hôm thứ Ba" — đúng nghĩa nhưng vô dụng với người tra
 * cứu. Nên yêu cầu ở đây là viết lại: giải thích hiện tượng, nêu con số, đặt
 * vào bối cảnh, dẫn nguồn.
 *
 * Bản quyền: chỉ dùng bài gốc làm tư liệu tham khảo để viết bài mới bằng tiếng
 * Việt, không sao chép câu chữ. Bài luôn dẫn nguồn về trang gốc.
 */

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

/** Cắt bài gốc trước khi gửi đi: phần đầu đã chứa gần hết thông tin cần. */
const MAX_SOURCE_CHARS = 12_000;

export type RewriteInput = {
  title: string;
  url: string;
  publisher: string;
  /** Toàn văn bài gốc nếu lấy được, không thì tóm tắt trong feed. */
  sourceText: string;
  /** Tên danh mục tiếng Việt, để mô hình chọn giọng phù hợp. */
  categoryName: string;
};

export type RewriteOutput = {
  title: string;
  summary: string;
  content: string;
  seoKeywords: string;
  readingTime: number;
};

export function isRewriteConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const ARTICLE_TOOL: Tool = {
  name: "bai_viet",
  description: "Nộp bài viết tiếng Việt đã biên tập xong.",
  input_schema: {
    type: "object" as const,
    properties: {
      title: {
        type: "string",
        description:
          "Tiêu đề tiếng Việt, 40–80 ký tự. Nêu chủ đề chứ không giật tít. Không dùng dấu hai chấm kiểu 'X: Y' quá hai lần trong toàn bài.",
      },
      summary: {
        type: "string",
        description:
          "Tóm tắt 2–3 câu, 150–280 ký tự, đứng độc lập được và nêu được điều đáng chú ý nhất.",
      },
      content: {
        type: "string",
        description:
          "Thân bài Markdown tiếng Việt, 500–900 từ. Dùng ## cho các mục. Không lặp lại tiêu đề ở dòng đầu. Không chèn phần dẫn nguồn — hệ thống tự thêm.",
      },
      seoKeywords: {
        type: "string",
        description: "3–6 từ khoá tiếng Việt, phân tách bằng dấu phẩy.",
      },
    },
    required: ["title", "summary", "content", "seoKeywords"],
  },
};

const SYSTEM = `Bạn là biên tập viên của Sciencepedia, một bách khoa khoa học tiếng Việt.

Nhiệm vụ: đọc tư liệu gốc tiếng Anh và viết MỘT bài bách khoa tiếng Việt mới.

Nguyên tắc:
- Viết lại, không dịch. Câu chữ phải là của bạn.
- Người đọc là người phổ thông ham hiểu biết, không phải nhà nghiên cứu. Giải thích thuật ngữ ngay lần đầu dùng.
- Ưu tiên con số, khoảng cách, thời gian, cơ chế. Bỏ những chi tiết chỉ có nghĩa với báo giới: tên hội nghị, ngày công bố, phát biểu xã giao của lãnh đạo.
- Chỉ viết những gì tư liệu gốc nêu. Không thêm số liệu, tên riêng hay kết luận không có trong tư liệu. Không suy đoán.
- Nếu tư liệu quá mỏng để viết được 500 từ trung thực, hãy viết ngắn hơn còn hơn bịa.
- Giữ thuật ngữ tiếng Anh trong ngoặc khi lần đầu nhắc tới khái niệm chuyên ngành, ví dụ "vật chất tối (dark matter)".
- Đơn vị đo theo hệ mét. Số lớn viết kiểu Việt: "26.670 năm ánh sáng".
- Giọng điềm đạm, không cảm thán, không "thật đáng kinh ngạc".

Luôn trả lời bằng công cụ bai_viet.`;

/**
 * Gọi Claude viết bài. Ném lỗi nếu chưa cấu hình khoá hoặc mô hình trả về
 * không dùng được — bên gọi bắt lỗi và giữ bài ở dạng nháp.
 */
export async function rewriteArticle(
  input: RewriteInput,
  signal?: AbortSignal,
): Promise<RewriteOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Chưa đặt ANTHROPIC_API_KEY");

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create(
    {
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM,
      tools: [ARTICLE_TOOL],
      tool_choice: { type: "tool", name: ARTICLE_TOOL.name },
      messages: [
        {
          role: "user",
          content: [
            `Danh mục trên Sciencepedia: ${input.categoryName}`,
            `Nguồn: ${input.publisher} — ${input.url}`,
            `Tiêu đề gốc: ${input.title}`,
            "",
            "Tư liệu gốc:",
            "---",
            input.sourceText.slice(0, MAX_SOURCE_CHARS),
            "---",
          ].join("\n"),
        },
      ],
    },
    { signal },
  );

  const block = message.content.find((part) => part.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error(`Mô hình không gọi công cụ (stop: ${message.stop_reason})`);
  }

  const draft = block.input as Partial<RewriteOutput>;

  // Mô hình thỉnh thoảng trả trường rỗng; đăng bài rỗng còn tệ hơn không đăng
  if (!draft.title?.trim() || !draft.summary?.trim() || !draft.content?.trim()) {
    throw new Error("Mô hình trả về bài thiếu trường bắt buộc");
  }
  if (draft.content.length < 600) {
    throw new Error(`Bài quá ngắn (${draft.content.length} ký tự)`);
  }

  const words = draft.content.trim().split(/\s+/).length;

  return {
    title: draft.title.trim(),
    summary: draft.summary.trim(),
    content: draft.content.trim(),
    seoKeywords: draft.seoKeywords?.trim() ?? "",
    // Người Việt đọc chừng 200 từ mỗi phút
    readingTime: Math.max(1, Math.round(words / 200)),
  };
}
