-- Bộ đếm rate limit dùng chung giữa các instance.
--
-- Vì sao cần: src/lib/rate-limit.ts đếm bằng Map trong RAM của tiến trình. Trên
-- một server thì đúng, nhưng trên serverless (Vercel) mỗi lambda là một tiến
-- trình riêng với Map riêng, nên hạn mức thực tế bị nhân lên theo số instance
-- đang sống, và cold start làm bộ đếm reset về 0.
--
-- Rủi ro cụ thể: /api/ai/chat tốn quota Gemini. Một script loop endpoint đó sẽ
-- đốt hết quota free tier trong ít phút và làm trợ lý AI chết với mọi người.
--
-- Dùng Postgres thay vì thêm Redis vì Supabase đã có sẵn — 3 endpoint cần bảo
-- vệ đều lưu lượng thấp nên một lệnh ghi mỗi request là chấp nhận được.

CREATE TABLE IF NOT EXISTS "RateLimit" (
  "key"     text            NOT NULL,
  "count"   integer         NOT NULL DEFAULT 0,
  "resetAt" timestamptz(3)  NOT NULL,

  CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- Phục vụ dọn dẹp các dòng đã hết hạn
CREATE INDEX IF NOT EXISTS "RateLimit_resetAt_idx" ON "RateLimit" ("resetAt");
