import { revalidateSite } from "./revalidate-site";

/**
 * Làm mới cache site sau khi sửa bài bằng một đường chưa tự báo — script cũ,
 * sửa tay trên Supabase.
 *
 *   npm run revalidate                         # trang chủ + danh sách
 *   npm run revalidate -- --slug a --slug b    # thêm trang của từng bài
 */
const argv = process.argv.slice(2);
const slugs = argv.flatMap((arg, i) =>
  arg === "--slug" && argv[i + 1] ? [argv[i + 1]] : arg.startsWith("--slug=") ? [arg.slice(7)] : [],
);

revalidateSite(slugs).then((ok) => {
  if (!ok) process.exitCode = 1;
});
