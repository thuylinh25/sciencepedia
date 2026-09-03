import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireRole } from "@/lib/rbac";
import { articlesIndex, ensureIndex, toDocument } from "@/lib/meili";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Nạp lại toàn bộ bài viết đã xuất bản vào Meilisearch.
 * Dùng khi vừa đổi cấu hình index, khôi phục sau sự cố, hoặc sau khi
 * chỉnh sửa dữ liệu trực tiếp trong DB.
 */
export async function POST() {
  try {
    await requireRole("ADMIN");
    await ensureIndex();

    const index = articlesIndex();
    // Xoá sạch trước để không còn sót tài liệu của bài đã bị gỡ
    await index.deleteAllDocuments();

    const articles = await prisma.article.findMany({
      where: { status: "PUBLISHED" },
      include: {
        category: { select: { slug: true, name: true, nameEn: true } },
        tags: {
          select: { tag: { select: { slug: true, name: true, nameEn: true } } },
        },
      },
    });

    if (articles.length > 0) {
      // Chia lô để không gửi một payload quá lớn
      const BATCH = 200;
      for (let i = 0; i < articles.length; i += BATCH) {
        await index.addDocuments(articles.slice(i, i + BATCH).map(toDocument));
      }
    }

    return Response.json({ indexed: articles.length });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("[reindex]", error);
    return Response.json({ error: "REINDEX_FAILED" }, { status: 500 });
  }
}
