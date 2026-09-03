import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";

import { Link } from "@/i18n/navigation";

/**
 * Cột phải của khối Trợ lý AI: những câu hỏi bấm được.
 *
 * ## Vì sao là link thật, không phải chữ trang trí
 *
 * Bản đầu của khối này chỉ có một câu hỏi ví dụ nằm trong khung nét đứt —
 * trông như nút nhưng không bấm được. Nay mỗi câu là một link tới
 * `/assistant?q=…`, và `AssistantChat` đọc tham số đó rồi **điền sẵn vào ô
 * nhập** (không tự gửi: một cú bấm nhầm không nên tiêu một lượt gọi mô hình,
 * và người đọc còn có thể muốn sửa câu hỏi).
 *
 * ## Vì sao chọn đúng bốn câu này
 *
 * Trợ lý trả lời **dựa trên kho bài viết của Sciencepedia**, nên câu hỏi mẫu
 * phải nằm trong vùng kho có bài. Bốn câu dùng chung với danh sách gợi ý sẵn
 * có trên trang trợ lý (`ai.suggestions.*`) thay vì viết một bộ mới: hai bộ
 * câu hỏi khác nhau ở hai nơi sẽ trôi khỏi nhau, và bộ ở trang chủ là bộ
 * không ai nhớ cập nhật.
 *
 * Đã cân nhắc và bỏ các câu kiểu "Có sự sống ngoài Trái Đất không?" — kích
 * tò mò hơn thật, nhưng kho chưa có bài nào chống lưng, và một trợ lý hứa dẫn
 * nguồn mà trả lời bằng kiến thức nền là đúng thứ `docs/content-rules.md`
 * không cho phép.
 */
export async function AiQuestions() {
  const t = await getTranslations("ai");
  const tHome = await getTranslations("home");

  const questions = [
    t("suggestions.one"),
    t("suggestions.two"),
    t("suggestions.three"),
    t("suggestions.four"),
  ];

  return (
    <div className="relative">
      <p className="mb-3 text-xs font-medium tracking-widest text-muted-foreground uppercase">
        {tHome("aiTryAsking")}
      </p>
      <ul className="flex flex-col gap-2">
        {questions.map((question) => (
          <li key={question}>
            <Link
              href={`/assistant?q=${encodeURIComponent(question)}`}
              className="group flex min-h-11 items-center justify-between gap-3 rounded-xl border bg-background/60 px-4 py-2.5 text-sm backdrop-blur transition-colors hover:border-accent hover:bg-accent/10 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              <span className="text-pretty">{question}</span>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
