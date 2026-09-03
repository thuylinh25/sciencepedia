-- Sciencepedia — khởi tạo bucket ảnh trên Supabase Storage.
-- Chạy một lần trong Supabase Dashboard → SQL Editor.
--
-- Mô hình quyền:
--   • Đọc  : công khai (ảnh bài viết phải hiện được với mọi khách truy cập)
--   • Ghi  : chỉ qua service role key ở server, trong /api/upload — service role
--            bỏ qua RLS nên KHÔNG cần policy insert/update/delete cho anon.
--            Nhờ vậy không client nào ghi thẳng vào bucket được.

-- 1. Tạo bucket công khai, giới hạn 8 MB và chỉ nhận ảnh
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-images',
  'article-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
set public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 2. Cho phép đọc công khai
drop policy if exists "article images are publicly readable" on storage.objects;

create policy "article images are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'article-images');

-- 3. Chặn mọi thao tác ghi từ phía client.
--    Không tạo policy insert/update/delete nào cho anon/authenticated là đủ:
--    RLS mặc định từ chối. Chỉ service role (dùng ở server) mới ghi được.

-- Kiểm tra lại:
--   select id, public, file_size_limit from storage.buckets where id = 'article-images';
--   select policyname, cmd, roles from pg_policies
--   where schemaname = 'storage' and tablename = 'objects';
