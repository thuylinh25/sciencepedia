import type { SeedArticle } from "./types";
import raw from "./vaca-articles.json";

/**
 * Các bài xem nhiều nhất trên thienvanvietnam.org (VACA), biên tập lại theo
 * định dạng Sciencepedia.
 *
 * Thông báo bản quyền của VACA cho phép tái sử dụng kèm ghi rõ tên tác giả và
 * nguồn trích dẫn. Vì vậy mỗi bài ở đây đều dẫn nguồn hai lần và không thể bỏ
 * sót: một khối cuối phần nội dung, và một mục trong danh sách Nguồn tham khảo
 * mà trang bài viết render sẵn ở chân trang.
 *
 * Nội dung trong `vaca-articles.json` là bản viết lại, không phải bản sao —
 * `origin` cho biết bài gốc mà nó dựa vào.
 */

type VacaEntry = {
  slug: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  content: string;
  categorySlug: string;
  tagSlugs: string[];
  coverImage?: string;
  seoKeywords?: string;
  origin: { title: string; url: string; author: string; year?: number };
};

function attribution(origin: VacaEntry["origin"]): string {
  const author = origin.author ? ` của ${origin.author}` : "";
  return `\n\n---\n\nBiên tập lại từ bài **[${origin.title}](${origin.url})**${author}, đăng trên Thiên văn Việt Nam (VACA). Bản quyền nội dung gốc thuộc về VACA.`;
}

export const vacaArticles: SeedArticle[] = (raw as VacaEntry[]).map(
  ({ origin, content, ...entry }) => ({
    ...entry,
    content: content + attribution(origin),
    sources: [
      {
        title: origin.title,
        url: origin.url,
        publisher: origin.author
          ? `Thiên văn Việt Nam (VACA) — ${origin.author}`
          : "Thiên văn Việt Nam (VACA)",
        year: origin.year,
      },
    ],
  }),
);
