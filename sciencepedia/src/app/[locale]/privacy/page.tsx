import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { CONTACT_EMAIL, buildMetadata } from "@/lib/seo";
import { StaticPage, type PageSection } from "@/components/static-page";

/**
 * Ngày cập nhật là một PHÁN QUYẾT, không phải một biến.
 *
 * Không sinh nó từ `new Date()` hay từ thời điểm build: dòng "cập nhật lần
 * cuối" trên một trang chính sách nói rằng NỘI DUNG đã được xem lại vào ngày
 * đó. Gắn nó vào ngày deploy biến một cam kết pháp lý thành một dấu thời gian
 * vô nghĩa, và nó sẽ tự làm mới mỗi lần sửa một dòng CSS ở nơi khác.
 *
 * Sửa nội dung bên dưới thì sửa luôn hai hằng số này.
 */
const UPDATED_VI = "15/10/2026";
const UPDATED_EN = "15 October 2026";

const DESCRIPTION_VI =
  "Sciencepedia thu thập những dữ liệu nào khi bạn tạo tài khoản hoặc đăng nhập bằng Google, GitHub, Facebook; dùng chúng vào việc gì; chia sẻ với ai; lưu trong bao lâu; và cách yêu cầu xoá dữ liệu.";

const DESCRIPTION_EN =
  "What Sciencepedia collects when you create an account or sign in with Google, GitHub or Facebook; what it is used for; who it is shared with; how long it is kept; and how to request deletion.";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });

  return buildMetadata({
    title: t("privacy"),
    description: locale === "en" ? DESCRIPTION_EN : DESCRIPTION_VI,
    path: "/privacy",
    locale: locale as Locale,
  });
}

/**
 * Trang này phải đọc được KHI CHƯA ĐĂNG NHẬP, và nó đọc được: route nằm
 * ngoài mọi lớp bảo vệ, `middleware.ts` chỉ làm việc định tuyến ngôn ngữ.
 * Đây là điều kiện bắt buộc của Facebook App Review và của màn hình chấp
 * thuận OAuth của Google — cả hai đều tự truy cập URL này bằng máy, không
 * mang theo phiên đăng nhập nào.
 *
 * Trang tĩnh hoàn toàn, không truy vấn CSDL nào.
 */
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
    <StaticPage
      title={t("privacy")}
      updatedAt={en ? UPDATED_EN : UPDATED_VI}
      intro={
        en
          ? "Sciencepedia is an open science encyclopedia. This page explains exactly what personal data we hold, why we hold it, who else sees it, and how to have it deleted."
          : "Sciencepedia là một bách khoa toàn thư khoa học mở. Trang này nói rõ chúng tôi giữ những dữ liệu cá nhân nào, vì sao giữ, ai khác nhìn thấy, và làm thế nào để yêu cầu xoá."
      }
      sections={en ? sectionsEn() : sectionsVi()}
    />
  );
}

const mailto = (
  <a href={`mailto:${CONTACT_EMAIL}`} className="break-all">
    {CONTACT_EMAIL}
  </a>
);

function sectionsVi(): PageSection[] {
  return [
    {
      id: "thu-thap",
      title: "Thông tin chúng tôi thu thập",
      body: (
        <>
          <p>
            Chúng tôi chỉ thu thập những gì cần để bạn có một tài khoản dùng
            được. Không có trường dữ liệu nào được thu thập &ldquo;để
            dành&rdquo; cho mục đích chưa xác định.
          </p>

          <h3>Khi bạn tạo tài khoản bằng email</h3>
          <ul>
            <li>
              <strong>Tên hiển thị</strong> — tên bạn tự chọn, hiện cạnh bình
              luận và các bài viết bạn đứng tên.
            </li>
            <li>
              <strong>Địa chỉ email</strong> — dùng để đăng nhập, khôi phục mật
              khẩu và liên hệ về chính tài khoản của bạn.
            </li>
            <li>
              <strong>Mật khẩu</strong> — lưu ở dạng băm một chiều. Chúng tôi
              không lưu và không đọc được mật khẩu gốc của bạn.
            </li>
          </ul>

          <h3>Khi bạn đăng nhập bằng Google, GitHub hoặc Facebook</h3>
          <p>
            Nhà cung cấp OAuth trả về cho chúng tôi{" "}
            <strong>tên hiển thị</strong>, <strong>địa chỉ email</strong>,{" "}
            <strong>ảnh đại diện</strong>,{" "}
            <strong>mã định danh tài khoản</strong> tại nhà cung cấp đó, và
            token truy cập dùng để duy trì phiên đăng nhập.
          </p>
          <p>
            Chúng tôi không xin và không nhận thêm quyền nào khác: không đọc
            danh sách bạn bè, bài đăng, ảnh, kho mã nguồn hay danh bạ của bạn.
          </p>

          <h3>Khi bạn sử dụng trang</h3>
          <ul>
            <li>Các bài viết bạn đánh dấu để đọc sau.</li>
            <li>
              Bình luận bạn đăng, và bài viết bạn là tác giả hoặc người duyệt.
            </li>
            <li>
              Câu hỏi bạn gửi cho trợ lý AI. Chúng tôi{" "}
              <strong>không lưu</strong> câu hỏi hay câu trả lời trên máy chủ:
              cuộc trò chuyện chỉ nằm trong trình duyệt và mất khi bạn tải lại
              trang. Câu hỏi được chuyển tới nhà cung cấp AI để tạo câu trả lời
              (xem mục Chia sẻ dữ liệu).
            </li>
            <li>
              Lượt xem bài viết hiển thị công khai, đếm ở dạng{" "}
              <strong>tổng</strong> và không gắn với danh tính người xem.
            </li>
            <li>
              <strong>Lịch sử xem khi bạn đã đăng nhập</strong> — bài viết và
              cấu trúc giải phẫu bạn đã mở, số lần mở và tổng thời gian xem.
              Chỉ quản trị viên đọc được; không hiển thị công khai.
            </li>
            <li>
              Nhật ký máy chủ kỹ thuật (địa chỉ IP, loại trình duyệt, thời điểm
              truy cập) do nền tảng vận hành ghi lại để bảo đảm dịch vụ chạy và
              chống lạm dụng. Mã tài khoản hoặc địa chỉ IP cũng được dùng làm
              khoá đếm tạm thời để giới hạn tần suất yêu cầu.
            </li>
          </ul>

          <p>
            Chúng tôi <strong>không</strong> thu thập thông tin thanh toán, vị
            trí chính xác hay danh bạ, và <strong>không</strong> nhúng mã theo
            dõi quảng cáo của bên thứ ba.
          </p>
        </>
      ),
    },
    {
      id: "muc-dich",
      title: "Mục đích sử dụng thông tin",
      body: (
        <>
          <ul>
            <li>
              <strong>Tạo và quản lý tài khoản</strong> — xác thực bạn khi đăng
              nhập, giữ phiên, và khôi phục quyền truy cập khi bạn quên mật
              khẩu.
            </li>
            <li>
              <strong>Hiển thị danh tính công khai</strong> — tên và ảnh đại
              diện xuất hiện cạnh bình luận và bài viết bạn đứng tên.
            </li>
            <li>
              <strong>Phục vụ nội dung của riêng bạn</strong> — danh sách bài
              đã đánh dấu.
            </li>
            <li>
              <strong>Hiểu nội dung nào được đọc</strong> — lịch sử xem giúp ban
              biên tập biết bài nào được đọc kỹ, bài nào bị bỏ dở, để ưu tiên
              sửa và viết tiếp.
            </li>
            <li>
              <strong>Liên hệ về tài khoản</strong> — đặt lại mật khẩu và các
              thông báo bắt buộc. Chúng tôi không gửi thư quảng cáo.
            </li>
            <li>
              <strong>Giữ an toàn cho dịch vụ</strong> — giới hạn tần suất yêu
              cầu, phát hiện lạm dụng và spam.
            </li>
          </ul>
          <p>
            Dữ liệu của bạn không được dùng cho quảng cáo nhắm mục tiêu, và
            Sciencepedia không tự huấn luyện mô hình nào trên nội dung bạn gửi.
            Riêng câu hỏi gửi trợ lý AI thì đi qua nhà cung cấp bên ngoài — xem
            mục Chia sẻ dữ liệu.
          </p>
        </>
      ),
    },
    {
      id: "chia-se",
      title: "Chia sẻ dữ liệu",
      body: (
        <>
          <p>
            <strong>
              Sciencepedia không bán, không cho thuê và không trao đổi dữ liệu
              cá nhân của bạn.
            </strong>
          </p>
          <p>Dữ liệu chỉ ra khỏi hệ thống trong ba trường hợp:</p>
          <ol>
            <li>
              <strong>Nhà cung cấp hạ tầng</strong> mà dịch vụ phải dựa vào để
              chạy, mỗi bên chỉ nhận phần dữ liệu cần cho đúng việc của mình:
              Vercel (vận hành website), Supabase (cơ sở dữ liệu), Cloudflare
              R2 (lưu ảnh), Resend (gửi email giao dịch như thư đặt lại mật
              khẩu), Google Gemini và OpenRouter (tạo câu trả lời cho câu hỏi
              bạn gửi trợ lý AI). Trợ lý dùng gói miễn phí của các nhà cung cấp
              AI này; theo điều khoản của họ, câu hỏi có thể được lưu và dùng
              để cải thiện mô hình của họ.{" "}
              <strong>
                Đừng nhập thông tin cá nhân hay thông tin nhạy cảm vào trợ lý.
              </strong>
            </li>
            <li>
              <strong>Thông tin bạn chủ động công khai</strong> — tên hiển thị
              và ảnh đại diện hiện công khai cạnh bình luận và bài viết bạn đứng
              tên. Bất kỳ ai vào trang đều đọc được phần này.
            </li>
            <li>
              <strong>Yêu cầu hợp pháp</strong> — khi pháp luật hiện hành buộc
              phải cung cấp.
            </li>
          </ol>
        </>
      ),
    },
    {
      id: "luu-tru",
      title: "Lưu trữ dữ liệu",
      body: (
        <>
          <p>
            Dữ liệu tài khoản được lưu trong cơ sở dữ liệu PostgreSQL do
            Supabase vận hành; ảnh tải lên nằm trên Cloudflare R2 (một số tệp
            cũ vẫn ở Supabase Storage). Máy
            chủ đặt tại trung tâm dữ liệu của các nhà cung cấp nêu trên và có
            thể nằm ngoài Việt Nam.
          </p>
          <p>
            Chúng tôi giữ dữ liệu{" "}
            <strong>trong suốt thời gian tài khoản của bạn còn tồn tại</strong>.
            Khi bạn yêu cầu xoá, hồ sơ, danh sách đã đánh dấu và lịch sử xem
            bị xoá khỏi cơ sở dữ liệu. Bình luận và bài
            viết đã xuất bản có thể được giữ lại nhưng gỡ bỏ liên kết tới danh
            tính của bạn, để mạch nội dung công khai không bị đứt quãng.
          </p>
          <p>
            Mọi kết nối tới trang đều qua HTTPS, và mật khẩu được băm một chiều
            trước khi lưu. Không hệ thống nào an toàn tuyệt đối; nếu xảy ra sự
            cố ảnh hưởng tới dữ liệu cá nhân, chúng tôi sẽ thông báo qua địa chỉ
            email bạn đã đăng ký.
          </p>
        </>
      ),
    },
    {
      id: "quyen-nguoi-dung",
      title: "Quyền của người dùng",
      body: (
        <>
          <ul>
            <li>
              <strong>Xem và sửa</strong> — tên hiển thị, ảnh đại diện và phần
              giới thiệu có thể sửa trực tiếp trong trang Hồ sơ.
            </li>
            <li>
              <strong>Yêu cầu bản sao</strong> dữ liệu cá nhân chúng tôi đang
              giữ về bạn.
            </li>
            <li>
              <strong>Yêu cầu sửa</strong> bất kỳ thông tin nào không chính xác.
            </li>
            <li>
              <strong>Yêu cầu xoá</strong> toàn bộ dữ liệu — xem hướng dẫn ngay
              dưới đây.
            </li>
          </ul>

          <h3>Cách yêu cầu xoá dữ liệu</h3>
          <p>
            Gửi email tới {mailto} từ chính địa chỉ bạn đã dùng để đăng ký, tiêu
            đề <em>Yêu cầu xoá dữ liệu</em>. Chúng tôi xác minh quyền sở hữu tài
            khoản, thực hiện xoá trong vòng <strong>30 ngày</strong> và gửi thư
            xác nhận khi xong.
          </p>

          <h3>Thu hồi quyền đăng nhập bằng mạng xã hội</h3>
          <p>
            Bạn có thể thu hồi quyền đã cấp cho Sciencepedia bất cứ lúc nào
            trong phần cài đặt ứng dụng của Google, GitHub hoặc Facebook. Thu
            hồi sẽ chặn lần đăng nhập sau, nhưng <strong>không</strong> tự xoá
            dữ liệu đã lưu — muốn xoá thì gửi yêu cầu như trên.
          </p>
        </>
      ),
    },
    {
      id: "facebook",
      title: "Trang Facebook của Sciencepedia",
      body: (
        <>
          <p>
            Sciencepedia có một trang Facebook. Bài đăng trên trang được tạo
            tay, hoặc tạo tự động từ những bài viết{" "}
            <strong>đã được duyệt</strong> trên website thông qua một ứng dụng
            Meta do chúng tôi vận hành.
          </p>
          <p>
            Ứng dụng đó chỉ có quyền trên chính trang của Sciencepedia: đăng bài
            và đọc số liệu tổng hợp của các bài đã đăng (lượt xem, lượt tương
            tác). Nó <strong>không</strong> thu thập thông tin cá nhân của người
            theo dõi, không đọc tin nhắn, và không đưa dữ liệu nào từ Facebook
            vào website.
          </p>
          <p>
            Khi bạn thích, bình luận hay nhắn tin cho trang trên Facebook, dữ
            liệu đó do Meta xử lý theo chính sách quyền riêng tư của Meta.
          </p>
        </>
      ),
    },
    {
      id: "lien-he",
      title: "Liên hệ",
      body: (
        <>
          <p>
            Mọi câu hỏi, yêu cầu về dữ liệu hoặc khiếu nại liên quan tới quyền
            riêng tư, xin gửi tới {mailto}.
          </p>
          <p>
            Khi chính sách này thay đổi, ngày cập nhật ở đầu trang sẽ đổi theo.
            Với những thay đổi ảnh hưởng đáng kể tới quyền của bạn, chúng tôi sẽ
            báo qua email trước khi áp dụng.
          </p>
        </>
      ),
    },
  ];
}

function sectionsEn(): PageSection[] {
  return [
    {
      id: "thu-thap",
      title: "Information we collect",
      body: (
        <>
          <p>
            We collect only what an account needs in order to work. No field is
            collected &ldquo;just in case&rdquo; for some undecided future
            purpose.
          </p>

          <h3>When you create an account with an email address</h3>
          <ul>
            <li>
              <strong>Display name</strong> — the name you choose; it appears
              next to your comments and any article credited to you.
            </li>
            <li>
              <strong>Email address</strong> — used to sign you in, to reset
              your password, and to contact you about your own account.
            </li>
            <li>
              <strong>Password</strong> — stored as a one-way hash. We never
              store or see your plain password.
            </li>
          </ul>

          <h3>When you sign in with Google, GitHub or Facebook</h3>
          <p>
            The OAuth provider returns your <strong>display name</strong>,{" "}
            <strong>email address</strong>, <strong>profile picture</strong>,
            the <strong>account identifier</strong> you hold with that provider,
            and an access token used to keep you signed in.
          </p>
          <p>
            We request no other permission: we do not read your friends, posts,
            photos, repositories or contacts.
          </p>

          <h3>When you use the site</h3>
          <ul>
            <li>Articles you bookmark for later.</li>
            <li>Comments you post, and articles you author or review.</li>
            <li>
              Questions you send to the AI assistant. We do{" "}
              <strong>not</strong> store questions or answers on our servers:
              the conversation lives only in your browser and is gone when you
              reload the page. Questions are passed to an AI provider to
              generate the answer (see Sharing your data).
            </li>
            <li>
              Public article view counts, stored as{" "}
              <strong>aggregate</strong> numbers and never tied to an individual
              reader.
            </li>
            <li>
              <strong>Viewing history while signed in</strong> — the articles
              and anatomy structures you opened, how many times, and total time
              spent. Readable by administrators only; never shown publicly.
            </li>
            <li>
              Technical server logs (IP address, browser type, timestamp) kept
              by our hosting platform to run the service and prevent abuse. Your
              account ID or IP address is also used as a short-lived counter key
              for rate limiting.
            </li>
          </ul>

          <p>
            We do <strong>not</strong> collect payment details, precise location
            or contact lists, and we embed <strong>no</strong> third-party
            advertising trackers.
          </p>
        </>
      ),
    },
    {
      id: "muc-dich",
      title: "How we use the information",
      body: (
        <>
          <ul>
            <li>
              <strong>Creating and managing your account</strong> — signing you
              in, keeping your session, restoring access when you forget your
              password.
            </li>
            <li>
              <strong>Showing your public identity</strong> — your name and
              picture next to your comments and credited articles.
            </li>
            <li>
              <strong>Serving what is yours</strong> — your bookmarks.
            </li>
            <li>
              <strong>Understanding what gets read</strong> — viewing history
              tells the editors which articles are read closely and which are
              abandoned, so they know what to fix and write next.
            </li>
            <li>
              <strong>Contacting you about your account</strong> — password
              resets and required notices. We send no marketing email.
            </li>
            <li>
              <strong>Keeping the service safe</strong> — rate limiting, abuse
              and spam detection.
            </li>
          </ul>
          <p>
            Your data is never used for targeted advertising, and Sciencepedia
            trains no model on what you submit. Questions sent to the AI
            assistant do pass through outside providers — see Sharing your data.
          </p>
        </>
      ),
    },
    {
      id: "chia-se",
      title: "Sharing your data",
      body: (
        <>
          <p>
            <strong>
              Sciencepedia does not sell, rent or trade your personal data.
            </strong>
          </p>
          <p>Data leaves our systems in three cases only:</p>
          <ol>
            <li>
              <strong>Infrastructure providers</strong> the service runs on,
              each receiving only what its job requires: Vercel (hosting),
              Supabase (database), Cloudflare R2 (image storage), Resend
              (transactional email such as password resets), Google Gemini and
              OpenRouter (generating answers to questions you send the AI
              assistant). The assistant uses these providers&rsquo; free tiers;
              under their terms, questions may be retained and used to improve
              their models.{" "}
              <strong>
                Do not enter personal or sensitive information into the
                assistant.
              </strong>
            </li>
            <li>
              <strong>What you publish yourself</strong> — your display name and
              picture appear publicly beside your comments and credited
              articles, readable by anyone who visits the site.
            </li>
            <li>
              <strong>Legal requirements</strong> — where applicable law compels
              disclosure.
            </li>
          </ol>
        </>
      ),
    },
    {
      id: "luu-tru",
      title: "Data storage and retention",
      body: (
        <>
          <p>
            Account data lives in a PostgreSQL database operated by Supabase;
            uploaded images live on Cloudflare R2 (some older files remain in
            Supabase Storage). Servers sit in those
            providers&rsquo; data centres, which may be outside Vietnam.
          </p>
          <p>
            We keep your data{" "}
            <strong>for as long as your account exists</strong>. When you ask us
            to delete it, your profile, bookmarks and viewing history are
            removed from the database. Published comments and articles may be
            retained with your identity detached from them, so that the public
            record stays coherent.
          </p>
          <p>
            All connections use HTTPS, and passwords are hashed one-way before
            storage. No system is perfectly secure; if an incident affects
            personal data, we will notify you at your registered email address.
          </p>
        </>
      ),
    },
    {
      id: "quyen-nguoi-dung",
      title: "Your rights",
      body: (
        <>
          <ul>
            <li>
              <strong>Access and correction</strong> — your display name,
              picture and bio can be edited directly on your profile page.
            </li>
            <li>
              <strong>Request a copy</strong> of the personal data we hold about
              you.
            </li>
            <li>
              <strong>Request correction</strong> of anything inaccurate.
            </li>
            <li>
              <strong>Request deletion</strong> of all of it — see the
              instructions below.
            </li>
          </ul>

          <h3>How to request data deletion</h3>
          <p>
            Email {mailto} from the address you registered with, using the
            subject <em>Data deletion request</em>. We verify that you own the
            account, delete the data within <strong>30 days</strong>, and
            confirm by email once it is done.
          </p>

          <h3>Revoking social sign-in</h3>
          <p>
            You can revoke the permission you granted Sciencepedia at any time
            in the app settings of Google, GitHub or Facebook. Revoking blocks
            the next sign-in but does <strong>not</strong> by itself delete
            stored data — send a deletion request for that.
          </p>
        </>
      ),
    },
    {
      id: "facebook",
      title: "Sciencepedia on Facebook",
      body: (
        <>
          <p>
            Sciencepedia runs a Facebook Page. Posts on it are written by hand,
            or generated automatically from articles that have{" "}
            <strong>passed editorial review</strong> on the website through a
            Meta app we operate.
          </p>
          <p>
            That app holds permissions on Sciencepedia&rsquo;s own Page only:
            publishing posts and reading aggregate metrics for those posts
            (views, engagement). It does <strong>not</strong> collect personal
            data about followers, does not read messages, and brings no data
            from Facebook into the website.
          </p>
          <p>
            When you like, comment on or message the Page on Facebook, that data
            is handled by Meta under Meta&rsquo;s own privacy policy.
          </p>
        </>
      ),
    },
    {
      id: "lien-he",
      title: "Contact",
      body: (
        <>
          <p>
            For any question, data request or privacy complaint, write to{" "}
            {mailto}.
          </p>
          <p>
            When this policy changes, the date at the top of the page changes
            with it. For changes that materially affect your rights, we will
            give notice by email before they take effect.
          </p>
        </>
      ),
    },
  ];
}
