import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";

/**
 * Dòng ghi công ảnh bìa.
 *
 * ## Vì sao cần
 *
 * Sáu trong mười ba ảnh bìa hiện dùng giấy phép CC BY hoặc CC BY-SA — hai giấy
 * phép này **bắt buộc ghi công ngay tại chỗ hiển thị**, không phải chỉ lưu
 * trong cơ sở dữ liệu. Trước đây schema chỉ có `coverImage` là một chuỗi URL
 * trần, nên không có chỗ nào ghi và không có chỗ nào hiện. Đó là nợ tuân thủ
 * giấy phép, tồn tại từ trước chứ không mới sinh.
 *
 * ## Vì sao là Markdown chứ không phải chuỗi thường
 *
 * Ghi công đúng chuẩn cần **link tới trang gốc** và **link tới giấy phép** —
 * hai thứ mà một chuỗi trần không mang được. Nội dung do biên tập viên nhập,
 * và `react-markdown` mặc định không cho HTML thô nên không mở đường XSS.
 *
 * ## Vì sao chữ nhỏ và mờ
 *
 * Ghi công là nghĩa vụ pháp lý, không phải nội dung. Nó phải **đọc được** —
 * `text-muted-foreground` vẫn đạt ngưỡng contrast — nhưng không được cạnh
 * tranh với tiêu đề bài.
 *
 * ## Vì sao ở cuối bài chứ không đè lên ảnh
 *
 * Bản trước dán dòng này lên chính ảnh bìa. Chỗ đó thua hai lần: nó va vào
 * khối tiêu đề trên màn hình hẹp (đã phải dời từ đáy ảnh lên đỉnh một lần), và
 * nó là chữ trên một tấm ảnh mà độ sáng không đoán trước được, nên phải kèm
 * nền mờ riêng — tức một mảng chữ nhật xám nằm giữa tấm ảnh mở đầu bài.
 *
 * CC BY chỉ đòi ghi công "hợp lý theo phương tiện" (reasonable to the medium),
 * không đòi phải nằm trên ảnh. Cuối bài, cạnh mục nguồn tham khảo, vừa đủ điều
 * kiện giấy phép vừa đúng thứ tự ưu tiên: cùng nguyên tắc provenance đã ghi
 * trong `docs/content-rules.md`.
 *
 * Không có ghi công thì không render gì. Ảnh thuộc phạm vi công cộng không bắt
 * buộc phải có dòng này.
 */
export function ImageCredit({
  credit,
  className,
}: {
  credit: string | null | undefined;
  className?: string;
}) {
  if (!credit?.trim()) return null;

  return (
    <p
      className={cn(
        "text-xs leading-relaxed text-muted-foreground",
        // Link trong ghi công phải phân biệt được với chữ thường, nhưng không
        // được sáng bằng link trong thân bài — đây là chú thích, không phải
        // đường dẫn người đọc nên theo.
        "[&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-foreground",
        className,
      )}
    >
      <ReactMarkdown
        components={{
          // Bọc thành <p> ở ngoài rồi, nên đoạn văn của Markdown phải phẳng ra
          // — <p> lồng <p> là HTML không hợp lệ và trình duyệt sẽ tự tách thẻ.
          p: ({ children }) => <>{children}</>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
        }}
      >
        {credit}
      </ReactMarkdown>
    </p>
  );
}
