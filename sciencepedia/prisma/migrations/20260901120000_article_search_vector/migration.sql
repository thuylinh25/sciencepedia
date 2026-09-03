-- Full-text search bằng Postgres, làm phương án dự phòng khi không có Meilisearch
-- (ví dụ khi deploy lên Vercel mà chưa host Meilisearch ở đâu).
--
-- Vì sao KHÔNG dùng extension `unaccent`:
--   1. unaccent() là STABLE, không phải IMMUTABLE, nên không dùng được trong
--      generated column.
--   2. Trên Supabase extension nằm ở schema `extensions`, còn nơi khác ở
--      `public` — migration tĩnh không biết trước để tham chiếu cho đúng.
--
-- Thay vào đó dùng translate(): IMMUTABLE, có sẵn ở mọi bản Postgres, và bỏ dấu
-- đúng cùng cách mà hàm slugify/stripDiacritics phía TypeScript đang làm. Nhờ
-- vậy "ho den" tìm ra "Hố đen".
--
-- Từ điển 'simple' chứ không phải 'english': nó chỉ tách token, không stemming.
-- Postgres không có từ điển tiếng Việt, mà stemming tiếng Anh lại làm méo tiếng
-- Việt — 'simple' là lựa chọn đúng cho nội dung song ngữ.

CREATE OR REPLACE FUNCTION sciencepedia_unaccent(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
AS $$
  SELECT translate(
    lower(input),
    'áàảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ',
    'aaaaaaaaaaaaaaaaaadeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyy'
  );
$$;

ALTER TABLE "Article"
  ADD COLUMN IF NOT EXISTS "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', sciencepedia_unaccent(coalesce("title", ''))), 'A') ||
    setweight(to_tsvector('simple', sciencepedia_unaccent(coalesce("titleEn", ''))), 'A') ||
    setweight(to_tsvector('simple', sciencepedia_unaccent(coalesce("summary", ''))), 'B') ||
    setweight(to_tsvector('simple', sciencepedia_unaccent(coalesce("summaryEn", ''))), 'B') ||
    setweight(to_tsvector('simple', sciencepedia_unaccent(coalesce("seoKeywords", ''))), 'B') ||
    setweight(to_tsvector('simple', sciencepedia_unaccent(coalesce("content", ''))), 'D') ||
    setweight(to_tsvector('simple', sciencepedia_unaccent(coalesce("contentEn", ''))), 'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS "Article_searchVector_idx"
  ON "Article" USING GIN ("searchVector");
