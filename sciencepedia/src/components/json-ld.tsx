/**
 * Chèn khối JSON-LD vào trang.
 *
 * `data` luôn do server tạo từ dữ liệu của chính chúng ta và được đưa qua
 * JSON.stringify, nên không có nội dung do người dùng nhập chạy như script.
 * Vẫn thoát ký tự `<` để tránh đóng thẻ script sớm.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
