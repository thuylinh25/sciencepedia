import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { CONTACT_EMAIL, EDITORIAL_BOARD_NAME, buildMetadata } from "@/lib/seo";
import { StaticPage, type PageSection } from "@/components/static-page";

/**
 * Giới thiệu + Chính sách biên tập — trang trả lời "ai đứng sau nội dung này".
 *
 * Luật của trang, vì nó dễ bị "viết cho hay" nhất:
 *
 * - **Không bịa người.** Không có biên tập viên con người nào ký từng bài, nên
 *   trang không nêu tên ai, không có ảnh "đội ngũ", không có chức danh. Ban
 *   biên tập là tên của một quy trình — `docs/content-rules.md`, mục "Byline
 *   người duyệt". Khi có người thật ký bài thì thêm họ vào đây, kèm chuyên môn.
 * - **Nói thẳng AI làm gì.** Site có bài sức khoẻ; người đọc có quyền biết bài
 *   do AI soạn và AI duyệt. Giấu đi rồi bị phát hiện là mất hết lòng tin mà
 *   trang này sinh ra để xây.
 * - **Không con số, không nhịp độ.** Số bài, "cập nhật hằng ngày" — cùng luật
 *   ở `docs/content-rules.md`, mục "Số liệu trên trang".
 *
 * Mô tả quy trình ở đây phải khớp quy trình thật (CLAUDE.md, "Content
 * pipeline"; docs/architecture.md, "Xuất bản tự động"). Đổi quy trình thì sửa
 * trang này cùng lượt, và sửa hai hằng số ngày bên dưới — đó là ngày NỘI DUNG
 * được xem lại, không phải ngày deploy (xem `privacy/page.tsx`).
 */
const UPDATED_VI = "03/10/2026";
const UPDATED_EN = "3 October 2026";

const DESCRIPTION_VI =
  "Ai đứng sau nội dung Sciencepedia, AI tham gia ở những khâu nào, bài được kiểm chứng ra sao, và cách báo lỗi để chúng tôi đính chính.";
const DESCRIPTION_EN =
  "Who is behind Sciencepedia's content, which steps AI is involved in, how articles are checked, and how to report an error so we can correct it.";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });

  return buildMetadata({
    title: t("about"),
    description: locale === "en" ? DESCRIPTION_EN : DESCRIPTION_VI,
    path: "/about",
    locale: locale as Locale,
  });
}

/** Trang tĩnh hoàn toàn, không truy vấn CSDL nào. */
export default async function AboutPage({
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
      title={t("about")}
      updatedAt={en ? UPDATED_EN : UPDATED_VI}
      intro={
        en
          ? "Sciencepedia is a bilingual science encyclopedia covering the cosmos, life, the human body and the Earth. This page explains who stands behind the articles, how they are written and checked, where AI is involved, and how to tell us when something is wrong."
          : "Sciencepedia là bách khoa toàn thư khoa học song ngữ về vũ trụ, sự sống, cơ thể người và Trái Đất. Trang này nói rõ ai đứng sau các bài viết, bài được viết và kiểm chứng ra sao, AI tham gia ở đâu, và làm thế nào để báo cho chúng tôi khi có chỗ sai."
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
      id: "ai-dung-sau",
      title: "Ai đứng sau nội dung",
      body: (
        <>
          <p>
            Mọi bài viết hiện đứng tên <strong>{EDITORIAL_BOARD_NAME}</strong>.
            Đây là tên chung của quy trình biên tập mô tả bên dưới,{" "}
            <strong>không phải tên một người</strong>.
          </p>
          <p>
            Hiện không có nhà khoa học hay chuyên gia y tế nào duyệt các bài
            trên trang, nên chúng tôi không ghi tên một cá nhân vào ô người
            duyệt. Gắn tên một người chưa đọc bài vào đó là quy công sai. Khi
            có biên tập viên thật ký bài, tên và chuyên môn của họ sẽ hiện trên
            bài và trên trang này.
          </p>
        </>
      ),
    },
    {
      id: "ai-tham-gia",
      title: "AI tham gia ở những khâu nào",
      body: (
        <>
          <p>
            Phần lớn công việc biên soạn do các mô hình AI (Claude, của
            Anthropic) thực hiện theo một quy trình nhiều bước cố định:
          </p>
          <ol>
            <li>
              <strong>Tìm và xếp hạng nguồn</strong> trước khi viết, thay vì
              viết theo trí nhớ của mô hình.
            </li>
            <li>
              <strong>Thẩm định nguồn</strong>: kiểm tra trích dẫn có tồn tại
              và có nói đúng điều được dẫn hay không.
            </li>
            <li>
              <strong>Soạn bài</strong> từ những nguồn đã qua thẩm định.
            </li>
            <li>
              <strong>Duyệt khoa học</strong>: một phiên AI riêng đóng vai biên
              tập viên khoa học, đối chiếu bài với nguồn gốc, có quyền trả bài
              về viết lại hoặc loại hẳn. Trong quy trình tự động, phiên này
              chạy trên một mô hình khác với mô hình viết bài.
            </li>
            <li>
              Gắn bài vào hệ thống khái niệm, chọn danh mục, chọn ảnh minh hoạ,
              và <strong>dịch sang tiếng Anh</strong>.
            </li>
          </ol>
          <p>
            Bước duyệt này vẫn là AI duyệt bài do AI viết. Nó bắt được một số
            lỗi mà bước viết bỏ sót, nhưng có thể chung điểm mù với mô hình
            viết, và đã từng để lọt lỗi, ví dụ một trích dẫn đúng bài báo nhưng
            bài báo ấy không nói điều được dẫn. Nó{" "}
            <strong>không tương đương với một chuyên gia con người</strong>.
            Chúng tôi nói rõ điều này để bạn tự cân nhắc mức tin cậy.
          </p>
          <p>
            Một số bài do người vận hành Sciencepedia soạn và đăng trực tiếp
            qua trang quản trị. Những bài này không đi qua các bước trên trước
            khi lên trang: nguồn và bước duyệt được bổ sung sau, nên có một
            khoảng thời gian bài hiển thị khi chưa được kiểm chứng.
          </p>
          <p>
            Các tính năng hỏi đáp và giải thích thuật ngữ bằng AI luôn mang
            nhãn &ldquo;do AI&rdquo;. Những giải thích ấy được tạo ra lúc bạn
            hỏi, không qua bước duyệt nào, và không được lưu thành nội dung của
            bách khoa.
          </p>
        </>
      ),
    },
    {
      id: "nguon",
      title: "Nguồn và trích dẫn",
      body: (
        <>
          <p>Khi chọn nguồn, quy trình ưu tiên theo thứ tự:</p>
          <ol>
            <li>Nghiên cứu đã qua bình duyệt và các bài tổng quan hệ thống.</li>
            <li>
              Cơ quan khoa học và y tế có thẩm quyền, như NASA, ESA, NOAA, NIH,
              WHO, IPCC.
            </li>
            <li>Tài liệu giáo dục của các trường đại học và bảo tàng.</li>
            <li>
              Báo chí khoa học uy tín, chỉ dùng để bổ sung bối cảnh, không bao
              giờ là chỗ dựa duy nhất cho một khẳng định.
            </li>
          </ol>
          <p>
            Mỗi bài liệt kê nguồn ở mục &ldquo;Nguồn tham khảo&rdquo; cuối bài.
            Bài có dòng &ldquo;Đối chiếu nguồn&rdquo; cho biết lần gần nhất các
            khẳng định trong bài được so lại với nguồn. Khi các nguồn còn bất
            đồng, bài giữ đúng mức dè dặt của nguồn thay vì viết như thể đã có
            kết luận.
          </p>
        </>
      ),
    },
    {
      id: "suc-khoe",
      title: "Bài về sức khoẻ",
      body: (
        <p>
          Các bài về cơ thể người, giấc ngủ, dinh dưỡng hay thuốc chỉ cung cấp
          kiến thức chung. Các bài này cũng chỉ qua bước duyệt bằng AI mô tả ở
          trên, chưa được bác sĩ hay chuyên gia y tế nào duyệt.{" "}
          <strong>Chúng không thay thế lời khuyên của bác sĩ</strong> và không
          dùng để tự chẩn đoán hay tự điều trị. Đừng bắt đầu, ngừng hay đổi
          liều thuốc dựa trên bài viết. Nếu bạn có vấn đề sức khoẻ cụ thể, hãy
          hỏi nhân viên y tế. Trường hợp khẩn cấp, hãy gọi 115.
        </p>
      ),
    },
    {
      id: "anh",
      title: "Ảnh",
      body: (
        <p>
          Ảnh lấy từ nhiều nguồn: ảnh thuộc phạm vi công cộng của NASA, ảnh của
          ESA và ESO theo giấy phép mở, ảnh trên Wikimedia Commons, Unsplash và
          một số kho ảnh khác. Một số ảnh minh hoạ được tạo bằng công cụ AI.
          Tác giả hoặc nguồn ảnh được ghi ở cuối bài; một số ảnh hiện còn thiếu
          ghi công, và chúng tôi coi đó là lỗi cần sửa. Nếu bạn sở hữu một bức
          ảnh và thấy nó bị dùng hoặc ghi công sai, hãy báo cho chúng tôi theo
          cách ở mục dưới đây.
        </p>
      ),
    },
    {
      id: "dinh-chinh",
      title: "Báo lỗi và đính chính",
      body: (
        <>
          <p>
            Thấy một con số sai, một nguồn không nói điều bài dẫn, hay một ảnh
            ghi công nhầm? Hãy gửi email tới {mailto}, hoặc dùng trang{" "}
            <Link href="/contact">Liên hệ</Link>. Kèm đường dẫn bài và đoạn bạn
            thấy có vấn đề, và nếu được thì cả nguồn bạn dựa vào.
          </p>
          <p>
            Mỗi lần sửa một khẳng định trong bài đã đăng được ghi vào nhật ký
            đính chính của chúng tôi (khẳng định cũ, khẳng định mới, căn cứ), và
            bản trước khi sửa được lưu lại. Khẳng định mới phải có nguồn. Bài có
            bản tiếng Anh thì cả hai bản đều được sửa, và ngày cập nhật cùng
            ngày đối chiếu nguồn trên bài đổi theo. Hiện trên bài chưa có ghi
            chú riêng cho từng lần đính chính.
          </p>
        </>
      ),
    },
  ];
}

function sectionsEn(): PageSection[] {
  return [
    {
      id: "ai-dung-sau",
      title: "Who is behind the content",
      body: (
        <>
          <p>
            Every article is currently credited to{" "}
            <strong>{EDITORIAL_BOARD_NAME}</strong> (the Sciencepedia editorial
            board). That is the collective name of the editorial process
            described below. <strong>It is not a person</strong>.
          </p>
          <p>
            No scientist or medical professional currently reviews the articles
            on this site, so we do not put an individual&rsquo;s name in the
            reviewer field. Naming someone who has not read the article would
            be false attribution. When a human editor does sign an article,
            their name and expertise will appear on it and on this page.
          </p>
        </>
      ),
    },
    {
      id: "ai-tham-gia",
      title: "Where AI is involved",
      body: (
        <>
          <p>
            Most of the writing is done by AI models (Claude, by Anthropic)
            following a fixed, multi-step process:
          </p>
          <ol>
            <li>
              <strong>Find and rank sources</strong> before writing, instead of
              writing from the model&rsquo;s memory.
            </li>
            <li>
              <strong>Validate the sources</strong>: check that each citation
              exists and actually says what it is cited for.
            </li>
            <li>
              <strong>Draft the article</strong> from the validated sources.
            </li>
            <li>
              <strong>Scientific review</strong>: a separate AI session acts as
              science editor, checks the article against the original sources,
              and can send it back for rewriting or reject it outright. In the
              automated process, this session runs on a different model from
              the one that wrote the draft.
            </li>
            <li>
              Link the article to related concepts, place it in a category,
              choose images, and <strong>translate it into English</strong>.
            </li>
          </ol>
          <p>
            This review is still AI checking AI-written text. It catches some
            mistakes the writing step misses, but it can share the writing
            model&rsquo;s blind spots, and it has let errors through, for
            example a citation to the right paper where the paper does not say
            what it is cited for. It is{" "}
            <strong>not equivalent to a human expert</strong>. We say so plainly
            so that you can judge how far to rely on it.
          </p>
          <p>
            Some articles are written and published directly by
            Sciencepedia&rsquo;s operator through the admin interface. These do
            not go through the steps above before they appear: sources and
            review are added afterwards, so for a while such an article is
            visible before it has been checked.
          </p>
          <p>
            The AI question-answering and term-explanation features are always
            labelled as AI. Those explanations are generated when you ask,
            are not reviewed, and are never stored as encyclopedia content.
          </p>
        </>
      ),
    },
    {
      id: "nguon",
      title: "Sources and citations",
      body: (
        <>
          <p>When choosing sources, the process prefers, in order:</p>
          <ol>
            <li>Peer-reviewed research and systematic reviews.</li>
            <li>
              Authoritative scientific and health bodies such as NASA, ESA,
              NOAA, NIH, WHO and the IPCC.
            </li>
            <li>Educational material from universities and museums.</li>
            <li>
              Reputable science journalism, used for context only and never as
              the sole support for a claim.
            </li>
          </ol>
          <p>
            Each article lists its sources under &ldquo;References&rdquo; at
            the end. Where an article shows a &ldquo;Sources checked&rdquo;
            date, that is the last time its claims were compared against the
            sources again. Where sources still disagree, the article keeps
            their level of caution rather than writing as if the question were
            settled.
          </p>
        </>
      ),
    },
    {
      id: "suc-khoe",
      title: "Health articles",
      body: (
        <p>
          Articles about the human body, sleep, nutrition or medicines provide
          general knowledge only. They have also only been through the AI
          review described above; no doctor or health professional has
          reviewed them.{" "}
          <strong>They are not a substitute for medical advice</strong> and are
          not meant for self-diagnosis or self-treatment. Do not start, stop or
          change a medicine based on an article. If you have a specific health
          concern, ask a health professional. In an emergency, call your local
          emergency number.
        </p>
      ),
    },
    {
      id: "anh",
      title: "Images",
      body: (
        <p>
          Images come from several places: public-domain images from NASA, ESA
          and ESO images under open licences, Wikimedia Commons, Unsplash and
          some other image libraries. Some illustrations were made with AI
          image tools. The author or source is credited at the end of the
          article; some images are still missing a credit, which we treat as an
          error to fix. If you own an image and find it used or credited
          incorrectly, please tell us as described below.
        </p>
      ),
    },
    {
      id: "dinh-chinh",
      title: "Reporting errors and corrections",
      body: (
        <>
          <p>
            Found a wrong number, a source that does not say what the article
            cites it for, or a miscredited image? Email {mailto}, or use the{" "}
            <Link href="/contact">Contact</Link> page. Include the link to the
            article, the passage you think is wrong and, if you can, the source
            you are relying on.
          </p>
          <p>
            Every change to a claim in a published article is recorded in our
            corrections log (old claim, new claim, basis), and the version
            before the change is kept. The new claim must have a source. Where
            the article has an English version, both versions are fixed, and
            the article&rsquo;s updated and sources-checked dates change
            accordingly. Articles do not yet show a separate note for each
            correction.
          </p>
        </>
      ),
    },
  ];
}
