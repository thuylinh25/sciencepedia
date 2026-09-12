import "server-only";

import { query } from "@anthropic-ai/claude-agent-sdk";

/**
 * Gợi ý danh mục, thẻ và metadata SEO cho một bản nháp, từ tiêu đề và nội dung.
 *
 * ## Vì sao đi qua Agent SDK chứ không qua `@anthropic-ai/sdk`
 *
 * `CLAUDE_CODE_OAUTH_TOKEN` xác thực bằng gói đăng ký Claude và CHỈ được Claude
 * Code / Agent SDK đọc. `@anthropic-ai/sdk` không đọc nó — đó cũng là lý do
 * `src/lib/rewrite.ts` phải có `ANTHROPIC_API_KEY` riêng. Chủ repo đã chốt
 * dùng token đăng ký cho tính năng này, nên đường đi là Agent SDK.
 *
 * ## Ràng buộc triển khai phải biết
 *
 * Agent SDK khởi chạy một tiến trình con. Nó chạy được ở máy dev và trên máy
 * chủ Node tự quản, nhưng KHÔNG chạy trên hàm serverless của Vercel. Route gọi
 * hàm này vì thế khai báo `runtime = "nodejs"` và `maxDuration`, và khi thiếu
 * token thì trả về một lỗi nói rõ thay vì treo.
 *
 * ## Vì sao truyền cả danh sách danh mục và thẻ vào prompt
 *
 * Mô hình phải CHỌN trong tập đang có, không được đặt tên mới. Một danh mục
 * bịa ra sẽ không khớp khoá ngoại nào và form sẽ lưu hỏng; một thẻ bịa ra thì
 * lặng lẽ tạo rác trong taxonomy. Nên prompt liệt kê id và tên, và kết quả
 * được lọc lại lần nữa ở dưới — không tin mô hình trả đúng id.
 */

export type ClassifyInput = {
  title: string;
  content: string;
  summary?: string;
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
};

export type ClassifySuggestion = {
  categoryId: string | null;
  tagIds: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  /** Vì sao chọn danh mục ấy — hiện cho người biên tập đọc trước khi nhận. */
  reason: string;
};

export type ClassifyResult =
  | { ok: true; data: ClassifySuggestion }
  | { ok: false; error: "NO_CREDENTIAL" | "NO_OUTPUT" | "FAILED"; detail?: string };

export function isClassifyConfigured(): boolean {
  return Boolean(process.env.CLAUDE_CODE_OAUTH_TOKEN);
}

/** Cắt bài trước khi gửi: phần đầu đã đủ để phân loại, và prompt ngắn thì rẻ. */
const MAX_CONTENT_CHARS = 6_000;

function buildPrompt(input: ClassifyInput): string {
  const categoryList = input.categories
    .map((category) => `- ${category.id} = ${category.name}`)
    .join("\n");
  const tagList = input.tags
    .map((tag) => `- ${tag.id} = ${tag.name}`)
    .join("\n");

  return `Bạn đang giúp biên tập viên của SciencePedia — một bách khoa khoa học tiếng Việt.

Đọc bản nháp dưới đây rồi đề xuất phân loại và metadata SEO.

## Tiêu đề
${input.title}

## Tóm tắt
${input.summary?.trim() || "(chưa có)"}

## Nội dung
${input.content.slice(0, MAX_CONTENT_CHARS)}

## Danh mục có sẵn (chọn ĐÚNG MỘT, trả về id)
${categoryList}

## Thẻ có sẵn (chọn 3–6, trả về id)
${tagList}

## Yêu cầu

1. Chọn một danh mục phù hợp nhất. Chỉ dùng id trong danh sách trên, KHÔNG đặt tên mới.
2. Chọn 3–6 thẻ. Chỉ dùng id trong danh sách trên.
3. seoTitle: tối đa 60 ký tự, nêu chủ đề, không giật tít, không nhồi từ khoá.
4. seoDescription: 140–160 ký tự, một câu trọn vẹn nói bài trả lời câu hỏi gì.
5. seoKeywords: 5–8 cụm, phân tách bằng dấu phẩy, tiếng Việt có dấu.
6. reason: một câu ngắn nói vì sao chọn danh mục đó.

Giữ đúng mức độ dè dặt của bản nháp — không nâng "có thể" thành "chắc chắn".

## Cách trả lời

Chỉ in ra MỘT khối JSON, không kèm giải thích nào ngoài khối đó:

\`\`\`json
{"categoryId":"...","tagIds":["...","..."],"seoTitle":"...","seoDescription":"...","seoKeywords":"...","reason":"..."}
\`\`\``;
}

/**
 * Bóc khối JSON ra khỏi câu trả lời.
 *
 * Mô hình được yêu cầu chỉ in JSON, nhưng yêu cầu không phải bảo đảm — nó vẫn
 * có thể thêm một câu dẫn. Tìm khối ```json trước, rồi mới tìm cặp ngoặc nhọn
 * ngoài cùng, thay vì `JSON.parse` thẳng cả chuỗi.
 */
function extractJson(text: string): unknown | null {
  const fenced = text.match(/```json\s*([\s\S]*?)```/);
  const candidate = fenced?.[1] ?? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  if (!candidate.trim()) return null;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

export async function classifyDraft(
  input: ClassifyInput,
): Promise<ClassifyResult> {
  if (!isClassifyConfigured()) {
    return { ok: false, error: "NO_CREDENTIAL" };
  }

  let text = "";

  try {
    for await (const message of query({
      prompt: buildPrompt(input),
      options: {
        /* Sonnet, không Opus. Đây là việc phân loại theo một tập chọn sẵn —
           không có phán đoán khoa học nào phải cân. Opus dành cho bước duyệt
           nội dung, nơi một phán đoán sai không được bước nào bắt lại. */
        model: "sonnet",
        /* KHÔNG nạp setting của project, KHÔNG bật skill, KHÔNG cho công cụ.
           Lượt này chỉ cần một câu trả lời từ chính prompt; mở thêm bất cứ thứ
           gì là mở đường cho nó đọc file hoặc chạy lệnh trên máy chủ. */
        settingSources: [],
        allowedTools: [],
        permissionMode: "bypassPermissions",
        maxTurns: 1,
      },
    })) {
      if (message.type === "assistant") {
        for (const block of message.message.content) {
          if (block.type === "text") text += block.text;
        }
      }
      if (message.type === "result" && "result" in message && message.result) {
        text += message.result;
      }
    }
  } catch (error) {
    return { ok: false, error: "FAILED", detail: (error as Error).message };
  }

  const parsed = extractJson(text);
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "NO_OUTPUT" };
  }

  const raw = parsed as Record<string, unknown>;
  const categoryIds = new Set(input.categories.map((category) => category.id));
  const tagIds = new Set(input.tags.map((tag) => tag.id));

  /* Lọc lại id ở phía mình, KHÔNG tin mô hình trả đúng.
     Một id bịa ra sẽ vi phạm khoá ngoại lúc lưu, và lỗi ấy hiện ra ở một chỗ
     xa nguyên nhân. Chặn tại đây thì người biên tập chỉ thấy "không đề xuất
     được danh mục" — đúng sự thật, và sửa được bằng tay ngay. */
  const categoryId =
    typeof raw.categoryId === "string" && categoryIds.has(raw.categoryId)
      ? raw.categoryId
      : null;

  const suggestedTags = Array.isArray(raw.tagIds)
    ? raw.tagIds.filter(
        (id): id is string => typeof id === "string" && tagIds.has(id),
      )
    : [];

  const str = (value: unknown, max: number): string =>
    typeof value === "string" ? value.trim().slice(0, max) : "";

  return {
    ok: true,
    data: {
      categoryId,
      tagIds: suggestedTags.slice(0, 6),
      seoTitle: str(raw.seoTitle, 70),
      seoDescription: str(raw.seoDescription, 300),
      seoKeywords: str(raw.seoKeywords, 300),
      reason: str(raw.reason, 300),
    },
  };
}
