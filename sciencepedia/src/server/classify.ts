import "server-only";

import { AiError, generateGemini } from "@/lib/ai";

/**
 * Gợi ý danh mục, thẻ và metadata SEO cho một bản nháp, từ tiêu đề và nội dung.
 *
 * ## Vì sao Gemini chứ không phải Claude Agent SDK (đổi 17/09)
 *
 * Bản đầu đi qua Agent SDK với `CLAUDE_CODE_OAUTH_TOKEN`. Hai cái giá của nó
 * lộ ra khi dùng thật: Agent SDK khởi chạy một tiến trình con nên KHÔNG chạy
 * trên hàm serverless của Vercel — nút này chết trên production — và token
 * đăng ký là thứ phải sinh tay, hết hạn, không nằm sẵn trong biến môi trường
 * deploy. Gemini gọi bằng HTTP, chạy được trên Vercel, dùng chung
 * `GEMINI_API_KEY`/`GEMINI_MODEL` với trợ lý AI.
 *
 * Đây là việc CHỌN trong tập có sẵn, không có phán đoán khoa học nào phải cân,
 * nên model nhanh là đủ. Kết quả chỉ là đề xuất: biên tập viên nhận hay sửa
 * trong form, không có gì tự ghi xuống CSDL.
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
  | {
      ok: false;
      error: "NO_CREDENTIAL" | "NO_OUTPUT" | "RATE_LIMITED" | "FAILED";
      detail?: string;
    };

export function isClassifyConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
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
3. seoTitle: tối đa 60 ký tự, nêu chủ đề, không giật tít, không nhồi từ khoá. Viết hoa kiểu câu tiếng Việt — chỉ hoa chữ đầu và tên riêng, KHÔNG hoa mọi chữ kiểu tiêu đề tiếng Anh.
4. seoDescription: 140–160 ký tự, một câu trọn vẹn nói bài trả lời câu hỏi gì.
5. seoKeywords: 5–8 cụm, phân tách bằng dấu phẩy, tiếng Việt có dấu.
6. reason: một câu ngắn nói vì sao chọn danh mục đó.

Giữ đúng mức độ dè dặt của bản nháp — không nâng "có thể" thành "chắc chắn".

## Cách trả lời

Trả về đúng MỘT đối tượng JSON với các khoá sau, không kèm chữ nào khác:

{"categoryId":"...","tagIds":["...","..."],"seoTitle":"...","seoDescription":"...","seoKeywords":"...","reason":"..."}`;
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
    ({ text } = await generateGemini({
      prompt: buildPrompt(input),
      // Chế độ JSON: Gemini bị ràng buộc trả JSON hợp lệ. `extractJson` bên
      // dưới vẫn giữ, vì đổi model sau này có thể mất ràng buộc đó.
      json: true,
      // Thấp: cùng một bài thì nên ra cùng một đề xuất, không "sáng tạo" thẻ.
      temperature: 0.2,
    }));
  } catch (error) {
    if (error instanceof AiError) {
      if (error.code === "NOT_CONFIGURED") return { ok: false, error: "NO_CREDENTIAL", detail: error.message };
      if (error.code === "RATE_LIMITED" || error.code === "OVERLOADED") {
        return { ok: false, error: "RATE_LIMITED", detail: error.message };
      }
    }
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
