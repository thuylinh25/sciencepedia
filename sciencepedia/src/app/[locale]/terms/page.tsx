import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { CONTACT_EMAIL, buildMetadata } from "@/lib/seo";
import { Link } from "@/i18n/navigation";
import { StaticPage, type PageSection } from "@/components/static-page";

/** Xem chú thích cùng tên ở trang Chính sách bảo mật. */
const UPDATED_VI = "13/09/2026";
const UPDATED_EN = "13 September 2026";

const DESCRIPTION_VI =
  "Điều kiện sử dụng Sciencepedia: mục đích dịch vụ, trách nhiệm của người dùng, giới hạn về tính chính xác của nội dung, quy định về tài khoản và quyền sở hữu trí tuệ.";

const DESCRIPTION_EN =
  "The terms for using Sciencepedia: what the service is for, what users are responsible for, the limits of content accuracy, account rules and intellectual property.";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });

  return buildMetadata({
    title: t("terms"),
    description: locale === "en" ? DESCRIPTION_EN : DESCRIPTION_VI,
    path: "/terms",
    locale: locale as Locale,
  });
}

/** Công khai với người chưa đăng nhập — xem chú thích ở trang Chính sách bảo mật. */
export default async function TermsPage({
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
      title={t("terms")}
      updatedAt={en ? UPDATED_EN : UPDATED_VI}
      intro={
        en
          ? "By using Sciencepedia you accept the terms below. They describe what the service offers, what we expect of you, and the limits of what we promise."
          : "Khi sử dụng Sciencepedia, bạn chấp nhận các điều khoản dưới đây. Chúng nói rõ dịch vụ cung cấp gì, chúng tôi mong đợi gì ở bạn, và giới hạn của những gì chúng tôi cam kết."
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
      id: "muc-dich-dich-vu",
      title: "Mục đích dịch vụ",
      body: (
        <>
          <p>
            Sciencepedia là một bách khoa toàn thư khoa học mở, cung cấp bài
            viết, mô hình tương tác và công cụ tra cứu nhằm phục vụ việc{" "}
            <strong>học tập và tham khảo</strong>. Dịch vụ được cung cấp miễn
            phí cho người đọc.
          </p>
          <p>
            Nội dung trên trang <strong>không phải</strong> tư vấn y khoa, pháp
            lý, tài chính hay kỹ thuật chuyên môn. Với các quyết định cần độ
            chắc chắn cao, hãy đối chiếu nguồn gốc được trích dẫn và hỏi người
            có chuyên môn.
          </p>
        </>
      ),
    },
    {
      id: "trach-nhiem-nguoi-dung",
      title: "Trách nhiệm người dùng",
      body: (
        <>
          <p>Khi sử dụng Sciencepedia, bạn đồng ý không:</p>
          <ul>
            <li>
              đăng nội dung vi phạm pháp luật, xúc phạm, quấy rối hoặc kích động
              thù ghét;
            </li>
            <li>
              đăng thông tin sai sự thật một cách cố ý, hoặc nội dung bạn không
              có quyền công bố;
            </li>
            <li>phát tán spam, quảng cáo trá hình hoặc mã độc;</li>
            <li>
              dò quét, thu thập dữ liệu tự động ở tần suất gây ảnh hưởng tới hệ
              thống, hoặc tìm cách vượt qua các lớp bảo vệ và giới hạn truy cập;
            </li>
            <li>mạo danh người khác hoặc dùng tài khoản của người khác.</li>
          </ul>
          <p>
            Bạn chịu trách nhiệm về nội dung mình đăng và về mọi hoạt động diễn
            ra dưới tài khoản của mình.
          </p>
        </>
      ),
    },
    {
      id: "noi-dung-chinh-xac",
      title: "Nội dung và tính chính xác",
      body: (
        <>
          <p>
            Chúng tôi biên tập nội dung dựa trên nguồn học thuật và tổ chức khoa
            học uy tín, và ghi rõ nguồn ở cuối mỗi bài. Dù vậy, khoa học luôn
            được cập nhật và sai sót là có thể xảy ra: nội dung được cung cấp
            &ldquo;như hiện có&rdquo;, không kèm bảo đảm về tính đầy đủ hay
            không có lỗi.
          </p>
          <p>
            Câu trả lời của <strong>trợ lý AI</strong> do mô hình ngôn ngữ sinh
            ra và có thể thiếu sót hoặc sai. Hãy luôn đối chiếu với các bài viết
            được trích dẫn kèm theo.
          </p>
          <p>
            Nếu bạn phát hiện một lỗi khoa học, xin báo về {mailto}. Chúng tôi
            xem lại và đính chính những lỗi có cơ sở.
          </p>
        </>
      ),
    },
    {
      id: "tai-khoan",
      title: "Tài khoản người dùng",
      body: (
        <>
          <p>
            Bạn có thể tạo tài khoản bằng email hoặc đăng nhập qua Google,
            GitHub, Facebook. Thông tin chúng tôi nhận và cách xử lý được mô tả
            trong <Link href="/privacy">Chính sách bảo mật</Link>.
          </p>
          <ul>
            <li>
              Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình và thông
              báo cho chúng tôi nếu nghi ngờ tài khoản bị truy cập trái phép.
            </li>
            <li>
              Một người chỉ nên giữ một tài khoản; tài khoản không được mua bán
              hay chuyển nhượng.
            </li>
            <li>
              Chúng tôi có thể tạm khoá hoặc chấm dứt tài khoản vi phạm các điều
              khoản này, và sẽ nêu lý do khi làm vậy, trừ trường hợp việc nêu lý
              do gây rủi ro cho hệ thống hoặc người dùng khác.
            </li>
            <li>
              Bạn có thể yêu cầu xoá tài khoản và dữ liệu bất cứ lúc nào — xem
              hướng dẫn trong Chính sách bảo mật.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "so-huu-tri-tue",
      title: "Quyền sở hữu trí tuệ",
      body: (
        <>
          <p>
            Bài viết do Sciencepedia biên soạn được phát hành theo giấy phép{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/deed.vi"
              rel="noopener noreferrer"
              target="_blank"
            >
              CC BY-SA 4.0
            </a>
            : bạn được sao chép, chỉnh sửa và phân phối lại, kể cả cho mục đích
            thương mại, với điều kiện ghi nguồn Sciencepedia và chia sẻ bản phái
            sinh theo cùng giấy phép.
          </p>
          <p>
            <strong>Hình ảnh và dữ liệu không nằm trong giấy phép trên.</strong>{" "}
            Ảnh thiên văn và dữ liệu đến từ NASA, ESA, NOIRLab, CDS/Aladin,
            Wikimedia Commons và các nguồn mở khác, mỗi nguồn có điều kiện sử
            dụng riêng được ghi ngay cạnh nơi chúng xuất hiện. Hãy theo điều
            kiện của chính nguồn đó khi dùng lại.
          </p>
          <p>
            Mã nguồn giao diện, thiết kế, logo và tên gọi Sciencepedia không
            thuộc giấy phép nội dung và vẫn thuộc về chúng tôi.
          </p>
          <p>
            Khi bạn đăng bình luận hoặc gửi đóng góp, bạn giữ quyền tác giả của
            mình, đồng thời cấp cho Sciencepedia quyền xuất bản, biên tập và
            phân phối lại phần đóng góp đó theo cùng giấy phép nội dung. Nếu bạn
            cho rằng một nội dung trên trang xâm phạm quyền của mình, xin gửi
            thông báo kèm bằng chứng tới {mailto}.
          </p>
        </>
      ),
    },
    {
      id: "thay-doi-dich-vu",
      title: "Thay đổi dịch vụ",
      body: (
        <>
          <p>
            Sciencepedia đang được phát triển liên tục. Chúng tôi có thể bổ
            sung, thay đổi hoặc ngừng một tính năng bất cứ lúc nào, và có thể
            tạm ngưng dịch vụ để bảo trì.
          </p>
          <p>
            Các điều khoản này cũng có thể được cập nhật. Ngày cập nhật ở đầu
            trang luôn phản ánh lần sửa gần nhất; với thay đổi ảnh hưởng đáng kể
            tới quyền của bạn, chúng tôi sẽ báo trước qua email hoặc thông báo
            trên trang. Tiếp tục sử dụng dịch vụ sau khi thay đổi có hiệu lực
            đồng nghĩa với việc bạn chấp nhận bản mới.
          </p>
        </>
      ),
    },
    {
      id: "lien-he",
      title: "Liên hệ",
      body: (
        <p>
          Câu hỏi về các điều khoản này, báo lỗi nội dung hoặc thông báo vi phạm
          bản quyền, xin gửi tới {mailto}.
        </p>
      ),
    },
  ];
}

function sectionsEn(): PageSection[] {
  return [
    {
      id: "muc-dich-dich-vu",
      title: "Purpose of the service",
      body: (
        <>
          <p>
            Sciencepedia is an open science encyclopedia offering articles,
            interactive models and reference tools for{" "}
            <strong>learning and reference</strong>. The service is free for
            readers.
          </p>
          <p>
            Nothing on the site is medical, legal, financial or professional
            engineering advice. For decisions that need certainty, check the
            cited sources and consult a qualified person.
          </p>
        </>
      ),
    },
    {
      id: "trach-nhiem-nguoi-dung",
      title: "Your responsibilities",
      body: (
        <>
          <p>When using Sciencepedia, you agree not to:</p>
          <ul>
            <li>post unlawful, abusive, harassing or hateful content;</li>
            <li>
              knowingly post false information, or material you have no right to
              publish;
            </li>
            <li>distribute spam, disguised advertising or malware;</li>
            <li>
              scrape or automate requests at a rate that degrades the service,
              or attempt to bypass access controls and rate limits;
            </li>
            <li>impersonate anyone, or use someone else&rsquo;s account.</li>
          </ul>
          <p>
            You are responsible for what you post and for everything that
            happens under your account.
          </p>
        </>
      ),
    },
    {
      id: "noi-dung-chinh-xac",
      title: "Content and accuracy",
      body: (
        <>
          <p>
            We edit content against academic and institutional sources, and cite
            them at the foot of every article. Even so, science moves and
            mistakes happen: content is provided &ldquo;as is&rdquo;, without a
            warranty of completeness or freedom from error.
          </p>
          <p>
            Answers from the <strong>AI assistant</strong> are generated by a
            language model and may be incomplete or wrong. Always check them
            against the articles cited alongside.
          </p>
          <p>
            If you find a scientific error, write to {mailto}. We review reports
            and correct what is substantiated.
          </p>
        </>
      ),
    },
    {
      id: "tai-khoan",
      title: "User accounts",
      body: (
        <>
          <p>
            You may create an account with an email address or sign in through
            Google, GitHub or Facebook. What we receive and how we handle it is
            described in our <Link href="/privacy">Privacy Policy</Link>.
          </p>
          <ul>
            <li>
              You are responsible for keeping your credentials secure and for
              telling us if you suspect unauthorised access.
            </li>
            <li>
              One person should hold one account; accounts may not be sold or
              transferred.
            </li>
            <li>
              We may suspend or close accounts that breach these terms, and will
              say why unless doing so would put the service or other users at
              risk.
            </li>
            <li>
              You can request deletion of your account and data at any time —
              see the Privacy Policy for how.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "so-huu-tri-tue",
      title: "Intellectual property",
      body: (
        <>
          <p>
            Articles written for Sciencepedia are published under{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              rel="noopener noreferrer"
              target="_blank"
            >
              CC BY-SA 4.0
            </a>
            : you may copy, adapt and redistribute them, including commercially,
            provided you credit Sciencepedia and share derivatives under the
            same licence.
          </p>
          <p>
            <strong>Images and data are not covered by that licence.</strong>{" "}
            Astronomical imagery and datasets come from NASA, ESA, NOIRLab,
            CDS/Aladin, Wikimedia Commons and other open sources, each with its
            own terms, stated next to where it appears. Follow the terms of the
            original source when reusing them.
          </p>
          <p>
            The interface code, design, logo and the Sciencepedia name are not
            covered by the content licence and remain ours.
          </p>
          <p>
            When you post a comment or submit a contribution you keep your
            authorship, and grant Sciencepedia the right to publish, edit and
            redistribute that contribution under the same content licence. If
            you believe something on the site infringes your rights, send a
            notice with evidence to {mailto}.
          </p>
        </>
      ),
    },
    {
      id: "thay-doi-dich-vu",
      title: "Changes to the service",
      body: (
        <>
          <p>
            Sciencepedia is under active development. We may add, change or
            withdraw a feature at any time, and may pause the service for
            maintenance.
          </p>
          <p>
            These terms may also change. The date at the top of the page always
            reflects the most recent revision; for changes that materially
            affect your rights we will give notice by email or on the site.
            Continuing to use the service after a change takes effect means you
            accept the new version.
          </p>
        </>
      ),
    },
    {
      id: "lien-he",
      title: "Contact",
      body: (
        <p>
          Questions about these terms, content error reports and copyright
          notices all go to {mailto}.
        </p>
      ),
    },
  ];
}
