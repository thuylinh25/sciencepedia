import { notFound } from "next/navigation";

/**
 * Bắt mọi đường dẫn không khớp route nào dưới /[locale] rồi gọi notFound().
 *
 * Không có file này, Next dựng trang 404 mặc định NGOÀI layout locale: mất
 * `<html lang>`, mất `<main>`, mất header/footer — người lạc đường không còn
 * lối đi tiếp, và trình đọc màn hình không biết trang là tiếng gì. Gọi
 * notFound() ở đây thì `[locale]/not-found.tsx` được render trong layout.
 */
export default function CatchAllPage() {
  notFound();
}
