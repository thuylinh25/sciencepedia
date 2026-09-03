import { createClient } from "@supabase/supabase-js";

/**
 * Tạo (hoặc cập nhật) bucket ảnh trên Supabase Storage.
 *   npm run storage:setup
 *
 * Dùng Management API của Storage thay vì chạy SQL thủ công — kết quả tương
 * đương supabase/storage-setup.sql nhưng chạy được từ dòng lệnh.
 *
 * Bucket để public: ảnh bài viết phải hiển thị với mọi khách truy cập.
 * Quyền GHI không mở cho ai cả — chỉ service role key ở /api/upload ghi được,
 * vì service role bỏ qua RLS còn anon thì không có policy insert nào.
 */
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "article-images";

const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

const FILE_SIZE_LIMIT = 8 * 1024 * 1024;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env",
    );
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing } = await supabase.storage.getBucket(BUCKET);

  const options = {
    public: true,
    fileSizeLimit: FILE_SIZE_LIMIT,
    allowedMimeTypes: ALLOWED_MIME,
  };

  if (existing) {
    const { error } = await supabase.storage.updateBucket(BUCKET, options);
    if (error) throw new Error(`Cập nhật bucket thất bại: ${error.message}`);
    console.log(`✓ Đã cập nhật bucket "${BUCKET}"`);
  } else {
    const { error } = await supabase.storage.createBucket(BUCKET, options);
    if (error) throw new Error(`Tạo bucket thất bại: ${error.message}`);
    console.log(`✓ Đã tạo bucket "${BUCKET}"`);
  }

  const { data: bucket } = await supabase.storage.getBucket(BUCKET);
  console.log(
    `  public=${bucket?.public}  limit=${Math.round(
      (bucket?.file_size_limit ?? 0) / 1024 / 1024,
    )}MB  mime=${bucket?.allowed_mime_types?.length ?? 0} loại`,
  );

  // Kiểm tra thật: tải lên một file rồi xoá đi, để chắc chắn quyền ghi hoạt động
  const probe = `.__healthcheck-${Date.now()}.png`;
  // PNG 1x1 trong suốt
  const pixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(probe, pixel, { contentType: "image/png" });
  if (upErr) throw new Error(`Ghi thử thất bại: ${upErr.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(probe);

  const response = await fetch(publicUrl);
  console.log(`✓ Đọc công khai: HTTP ${response.status}`);

  await supabase.storage.from(BUCKET).remove([probe]);
  console.log("✓ Đã dọn file kiểm tra");
}

main().catch((error) => {
  console.error("Thiết lập Storage thất bại:", (error as Error).message);
  process.exit(1);
});
