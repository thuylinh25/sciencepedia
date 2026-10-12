/**
 * Id model Sketchfab từ thứ người biên tập dán vào form: id trần, link trang model
 * (`sketchfab.com/3d-models/<tên>-<id>`), link nhúng (`sketchfab.com/models/<id>/embed`)
 * hoặc nguyên đoạn `<iframe>` của nút "Embed". Trả null nếu không nhận ra.
 *
 * CSDL chỉ giữ id (chú thích cột `sketchfabModelId` trong schema.prisma), nên tách ngay ở
 * đây thay vì bắt người biên tập tự cắt chuỗi 32 ký tự cuối URL. Link rút gọn `skfb.ly`
 * không mang id — không đoán, trả null để form báo dán link đầy đủ.
 */
const BARE_ID = /^[0-9a-f]{32}$/i;
const IN_URL = /sketchfab\.com\/(?:3d-models\/(?:[^/?#"'\s]*-)?|models\/)([0-9a-f]{32})(?![0-9a-z])/i;

export function parseSketchfabId(input: string | null | undefined): string | null {
  const text = input?.trim() ?? "";
  if (!text) return null;
  if (BARE_ID.test(text)) return text.toLowerCase();
  return IN_URL.exec(text)?.[1].toLowerCase() ?? null;
}
