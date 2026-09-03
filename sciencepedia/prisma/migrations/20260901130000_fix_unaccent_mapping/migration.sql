-- Sửa hàm bỏ dấu: bản đầu dùng MỘT translate() với chuỗi 67 ký tự, và đếm sai
-- số ký tự bên đích. Hệ quả: `đ` bị map thành `a` nên "đen" -> "aen", làm mọi
-- truy vấn chứa chữ có `đ` ("hố đen", "Trái Đất") không khớp được index.
--
-- Bản này tách thành nhiều translate() ngắn theo từng nhóm nguyên âm để dễ đối
-- chiếu, và kết thúc bằng khối DO kiểm tra thật — nếu bản đồ ký tự sai thì
-- migration DỪNG ngay thay vì âm thầm tạo ra index hỏng.
--
-- Lưu ý: CREATE OR REPLACE FUNCTION không tự tính lại cột generated đã STORED,
-- nên phải drop rồi tạo lại cột. Với bảng lớn đây là một lần rewrite bảng.

DROP INDEX IF EXISTS "Article_searchVector_idx";
ALTER TABLE "Article" DROP COLUMN IF EXISTS "searchVector";

CREATE OR REPLACE FUNCTION sciencepedia_unaccent(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
AS $$
  SELECT translate(
           translate(
             translate(
               translate(
                 translate(
                   translate(
                     translate(lower(input), 'áàảãạăắằẳẵặâấầẩẫậ', 'aaaaaaaaaaaaaaaaa'),
                     'đ', 'd'),
                   'éèẻẽẹêếềểễệ', 'eeeeeeeeeee'),
                 'íìỉĩị', 'iiiii'),
               'óòỏõọôốồổỗộơớờởỡợ', 'ooooooooooooooooo'),
             'úùủũụưứừửữự', 'uuuuuuuuuuu'),
           'ýỳỷỹỵ', 'yyyyy');
$$;

-- Kiểm tra thật trước khi dựng lại index. Mỗi ca phủ một nhóm nguyên âm khác
-- nhau; `đ` được kiểm riêng vì đó chính là chỗ bản trước làm sai.
DO $$
DECLARE
  cases text[][] := ARRAY[
    ARRAY['đen',        'den'],
    ARRAY['Hố đen',     'ho den'],
    ARRAY['Trái Đất',   'trai dat'],
    ARRAY['vũ trụ',     'vu tru'],
    ARRAY['sức khoẻ',   'suc khoe'],
    ARRAY['giấc ngủ',   'giac ngu'],
    ARRAY['miễn dịch',  'mien dich'],
    ARRAY['Sao Hoả',    'sao hoa'],
    ARRAY['tế bào',     'te bao'],
    ARRAY['ý nghĩa',    'y nghia'],
    ARRAY['Mặt Trời',   'mat troi'],
    ARRAY['ứng dụng',   'ung dung']
  ];
  i int;
  got text;
BEGIN
  FOR i IN 1 .. array_length(cases, 1) LOOP
    got := sciencepedia_unaccent(cases[i][1]);
    IF got <> cases[i][2] THEN
      RAISE EXCEPTION 'sciencepedia_unaccent(%) = % nhung mong doi %',
        cases[i][1], got, cases[i][2];
    END IF;
  END LOOP;
END $$;

ALTER TABLE "Article"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', sciencepedia_unaccent(coalesce("title", ''))), 'A') ||
    setweight(to_tsvector('simple', sciencepedia_unaccent(coalesce("titleEn", ''))), 'A') ||
    setweight(to_tsvector('simple', sciencepedia_unaccent(coalesce("summary", ''))), 'B') ||
    setweight(to_tsvector('simple', sciencepedia_unaccent(coalesce("summaryEn", ''))), 'B') ||
    setweight(to_tsvector('simple', sciencepedia_unaccent(coalesce("seoKeywords", ''))), 'B') ||
    setweight(to_tsvector('simple', sciencepedia_unaccent(coalesce("content", ''))), 'D') ||
    setweight(to_tsvector('simple', sciencepedia_unaccent(coalesce("contentEn", ''))), 'D')
  ) STORED;

CREATE INDEX "Article_searchVector_idx"
  ON "Article" USING GIN ("searchVector");
