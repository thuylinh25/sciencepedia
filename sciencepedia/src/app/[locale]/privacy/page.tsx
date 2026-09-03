import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { StaticPage } from "@/components/static-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });

  return buildMetadata({
    title: t("privacy"),
    description: t("privacy"),
    path: "/privacy",
    locale: locale as Locale,
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("footer");
  const en = locale === "en";

  return (
    <StaticPage title={t("privacy")} updatedAt="01/09/2026">
      {en ? (
        <>
          <h2>What we collect</h2>
          <p>
            If you create an account we store your name, email address and a
            hashed password. If you sign in with GitHub or Google we store the
            profile information those providers return.
          </p>
          <p>
            We also store the articles you bookmark and, if you use the AI
            assistant, the messages you send it. Article view counts are stored
            as aggregate numbers, not per person.
          </p>

          <h2>What we do not do</h2>
          <ul>
            <li>We do not sell or rent personal data.</li>
            <li>We do not run third-party advertising trackers.</li>
            <li>We do not use your content to train models.</li>
          </ul>

          <h2>Third parties</h2>
          <p>
            Search runs on a Meilisearch instance we operate. The AI assistant
            sends your question, plus excerpts of relevant Sciencepedia
            articles, to Anthropic to generate an answer.
          </p>

          <h2>Your choices</h2>
          <p>
            You can delete your account at any time, which removes your profile,
            bookmarks and chat history. Write to
            <a href="mailto:privacy@sciencepedia.dev"> privacy@sciencepedia.dev</a>.
          </p>
        </>
      ) : (
        <>
          <h2>Chúng tôi thu thập gì</h2>
          <p>
            Khi bạn tạo tài khoản, chúng tôi lưu tên, địa chỉ email và mật khẩu
            đã được băm. Nếu bạn đăng nhập bằng GitHub hoặc Google, chúng tôi lưu
            thông tin hồ sơ mà các nhà cung cấp đó trả về.
          </p>
          <p>
            Chúng tôi cũng lưu các bài viết bạn đánh dấu và, nếu bạn dùng trợ lý
            AI, các tin nhắn bạn gửi. Lượt xem bài viết được lưu ở dạng số tổng,
            không gắn với từng cá nhân.
          </p>

          <h2>Chúng tôi không làm gì</h2>
          <ul>
            <li>Không bán hoặc cho thuê dữ liệu cá nhân.</li>
            <li>Không chạy mã theo dõi quảng cáo của bên thứ ba.</li>
            <li>Không dùng nội dung của bạn để huấn luyện mô hình.</li>
          </ul>

          <h2>Bên thứ ba</h2>
          <p>
            Chức năng tìm kiếm chạy trên máy chủ Meilisearch do chúng tôi vận
            hành. Trợ lý AI gửi câu hỏi của bạn, kèm trích đoạn các bài viết liên
            quan trên Sciencepedia, tới Anthropic để tạo câu trả lời.
          </p>

          <h2>Quyền của bạn</h2>
          <p>
            Bạn có thể xoá tài khoản bất cứ lúc nào; thao tác này xoá hồ sơ, danh
            sách đã lưu và lịch sử trò chuyện. Liên hệ
            <a href="mailto:privacy@sciencepedia.dev"> privacy@sciencepedia.dev</a>.
          </p>
        </>
      )}
    </StaticPage>
  );
}
