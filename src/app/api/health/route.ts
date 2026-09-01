import { prisma } from "@/lib/prisma";
import { isConfigured } from "@/lib/storage";
import { isPostgresSearchReady } from "@/lib/search-postgres";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health — dùng cho load balancer, uptime monitor và healthcheck của
 * container. Kiểm tra từng phụ thuộc riêng để biết chính xác cái nào chết.
 *
 * Trả 200 khi database còn sống (không có DB thì website vô nghĩa).
 * Meilisearch chết chỉ làm mất chức năng tìm kiếm nên báo "degraded" chứ
 * không kéo cả service xuống — tránh việc orchestrator restart liên tục
 * chỉ vì search tạm thời không phản hồi.
 */
export async function GET() {
  const started = Date.now();

  const [database, search] = await Promise.all([
    checkDatabase(),
    checkSearch(),
  ]);

  const healthy = database.ok;
  const degraded = healthy && !search.ok;

  return Response.json(
    {
      status: healthy ? (degraded ? "degraded" : "ok") : "down",
      uptimeSeconds: Math.round(process.uptime()),
      tookMs: Date.now() - started,
      checks: {
        database,
        search,
        storage: { ok: isConfigured(), configured: isConfigured() },
      },
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

async function checkDatabase() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`select 1`;
    return { ok: true, latencyMs: Date.now() - started };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: (error as Error).message.split("\n")[0],
    };
  }
}

/**
 * Tìm kiếm "ok" nếu CÓ ÍT NHẤT MỘT backend dùng được.
 * Không có Meilisearch vẫn ổn — Postgres full-text search gánh thay (đây chính
 * là cấu hình khi deploy lên Vercel mà không host Meilisearch).
 */
async function checkSearch() {
  const started = Date.now();
  const host = process.env.MEILISEARCH_HOST;

  let meilisearch: { configured: boolean; ok: boolean; error?: string } = {
    configured: Boolean(host),
    ok: false,
  };

  if (host) {
    try {
      // Timeout ngắn: healthcheck không được treo chờ một service đã chết
      const response = await fetch(`${host}/health`, {
        signal: AbortSignal.timeout(3000),
        cache: "no-store",
      });
      meilisearch = {
        configured: true,
        ok: response.ok,
        ...(response.ok ? {} : { error: `HTTP ${response.status}` }),
      };
    } catch (error) {
      meilisearch = {
        configured: true,
        ok: false,
        error: (error as Error).message,
      };
    }
  }

  const postgresReady = await isPostgresSearchReady();

  return {
    ok: meilisearch.ok || postgresReady,
    latencyMs: Date.now() - started,
    active: meilisearch.ok ? "meilisearch" : postgresReady ? "postgres" : "none",
    meilisearch,
    postgres: { ok: postgresReady },
  };
}
