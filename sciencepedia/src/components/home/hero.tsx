"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

/**
 * `fields` là một slot: danh sách lĩnh vực phải là Server Component (đọc CSDL,
 * chạy khi tắt JS) nhưng Hero buộc phải là client vì framer-motion. Server
 * Component không import được vào client, nên trang chủ render nó rồi truyền
 * xuống đây qua prop.
 *
 * Prop `search` đã bỏ: ô tìm kiếm chuyển hẳn lên header, nơi nó đứng trên MỌI
 * trang chứ không riêng trang chủ. Hero từng có một ô riêng, và hai ô cùng làm
 * một việc trên cùng một màn hình thì người vào lần đầu phải chọn giữa chúng.
 */
export function Hero({ fields }: { fields?: ReactNode }) {
  const t = useTranslations("home");
  const reduced = useReducedMotion();

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 24 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduced ? 0 : 0.7,
      delay: reduced ? 0 : delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

  return (
    <section className="bg-cosmos starfield relative isolate overflow-hidden">
      {/* Ảnh nền hero — hai bố cục, cắt ở lg.

          ## Dưới lg: một DẢI ghim bên phải, không phải ảnh phủ kín khung

          Đây là lượt sửa thứ tư của cùng một chỗ. Ba lượt trước lần lượt hạ độ
          mờ xuống 60%, nâng lên 80%, rồi đổi lớp phủ — cả ba đều chữa triệu
          chứng, vì nguyên nhân là HÌNH HỌC chứ không phải độ mờ.

          Ảnh là tấm 1760×576, tỉ lệ 3,06:1. Khung dọc của điện thoại phủ kín
          bằng `object-cover` sẽ kéo ảnh cho CHIỀU CAO vừa khung: cao 600 CSS px
          trên màn DPR 3 nghĩa là 1800 điểm ảnh thật lấy từ 576 điểm ảnh gốc —
          phóng hơn ba lần. Không có mức độ mờ nào chữa được phép phóng đó.

          Nên chiều cao dải là con số ĐƯỢC TÍNH: hệ số phóng trên DPR 3 bằng
          `3 × chiều_cao_CSS / 576`, tức 280px cho hệ số 1,46 — và trên DPR 2 thì
          0,97, tức ảnh còn được thu nhỏ. Muốn dải cao hơn thì phải có tệp gốc
          cao hơn; đổi số ở đây mà không đổi tệp là mua lại đúng vết mờ cũ.

          ## `sizes` — cái bẫy đã suýt làm hỏng cả phép tính trên

          `sizes="100vw"` là SAI ở đây, và sai lặng lẽ. Nó khai với trình duyệt
          rằng ảnh rộng bằng khung nhìn, nên ở 390px × DPR 2 trình duyệt xin
          780px và Next trả về tệp 828×271. Nhưng `object-cover` khớp theo CHIỀU
          CAO: 271px ấy phải phủ 560 điểm ảnh thật, tức phóng 2,07 lần — trên
          DPR 3 là 3,1 lần. Đo bằng `img.currentSrc` mới thấy; nhìn ảnh chụp màn
          hình DPR 2 thì không, vì bản thân thiên hà đã mềm sẵn.

          Con số đúng suy ra từ chiều cao, không từ bề ngang: cần
          `3,06 × 280 = 857` CSS px bề ngang ảnh. Khai 900px thì ở DPR 2 trình
          duyệt xin 1800 và nhận đúng tệp gốc 1760 — hệ số phóng trở lại 0,97.

          ## Vì sao bề ngang dải tính bằng rem chứ không bằng %

          Mặt nạ ở dưới dùng bán kính theo rem, mà bán kính rem trên một khung
          rộng theo % thì hình học đổi theo bề ngang màn hình: chỉnh cho vừa ở
          390px là hở mép ở 768px. Đã thấy thật — ở 768px hiện rõ một hình chữ
          nhật sáng hơn nền, đúng thứ mặt nạ sinh ra để xoá. Khung rộng cố định
          26rem giữ cho mọi bề ngang dưới lg cùng một hình học.

          ## Vì sao nằm bên phải chứ không dưới đáy

          Bản trước đặt dải này dưới đáy hero. Nó nét, nhưng bỏ trống đúng vùng
          lớn nhất còn lại của màn hình: khoảng bên phải hàng chip lĩnh vực.
          Chuyển sang phải thì hero không còn khoảng chết, và dải vẫn giữ nguyên
          chiều cao nên vẫn nét.

          ## Mặt nạ, không phải viền

          Một khối ảnh chữ nhật đặt giữa nền vũ trụ để lộ bốn cạnh thẳng thì đọc
          ra như ảnh dán vào chứ không như bầu trời. `mask-image` hình ê-líp,
          tâm lệch về 76% bề ngang, làm ảnh tan hết TRƯỚC khi chạm mép: bán kính
          20rem so với tâm cách mép trái 19,8rem, nên mép trái đã ở ngoài vùng
          nhìn thấy. Đó là điều kiện, không phải thẩm mỹ — mặt nạ chỉ cần còn
          6% độ đục ở mép là cạnh hiện ra.

          Mặt nạ cũng là thứ cho phép GỠ trần `max-w` của hàng chip (xem
          `hero-fields.tsx`): phần ảnh nằm dưới chip đã gần trong suốt.

          ## Lớp phủ gradient chỉ còn từ lg

          Nó sinh ra để cứu chữ trắng nằm ĐÈ lên ảnh. Dưới lg chữ không còn nằm
          trên ảnh, mà một gradient dọc bên trong một dải cao 280px thì tự nó vẽ
          ra hai vệt tối ở mép — đúng thứ mặt nạ vừa xoá đi.

          ## lg trở lên: giữ nguyên ảnh phủ kín khung

          Ở đó chữ nằm CẠNH thiên hà chứ không đè lên, khung đủ rộng để tấm
          3,06:1 gần như không bị cắt, và lớp phủ chạy ngang (đậm trái, trong
          suốt phải) để thiên hà bên phải không bị hạ sáng.

          `priority`: đây là phần tử LCP của trang chủ.

          Lưu ý cho lần thay ảnh sau: Next KHÔNG bao giờ phóng ảnh quá kích
          thước gốc, nên khai `sizes` lớn hơn tệp cũng chỉ trả về tệp gốc. Muốn
          dải cao hơn mà vẫn nét thì phải có tệp lớn hơn — chọn tệp theo TỈ LỆ
          3:1 trước, rồi mới tới số điểm ảnh. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[49%] right-0 h-[17.5rem] w-[26rem] [mask-image:radial-gradient(20rem_10rem_at_76%_50%,#000_24%,rgba(0,0,0,0.5)_52%,transparent_78%)] lg:inset-0 lg:top-0 lg:h-auto lg:w-auto lg:[mask-image:none]"
      >
        <Image
          src="/images/hero-galaxy.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 100vw, 900px"
          className="object-cover object-[66%_center] lg:object-center"
        />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-space-900/90 via-space-900/40 to-transparent lg:block" />
      </div>
      {/* Quầng sáng nền, chuyển động rất chậm */}
      <div
        aria-hidden
        className="animate-aurora pointer-events-none absolute -top-1/3 left-1/2 size-[70rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--color-chart-1), transparent 65%)",
        }}
      />

      {/* Chuyển mềm sang nền trang.
          Phải đứng TRƯỚC khối nội dung trong DOM: là sibling không có z-index,
          thứ tự nguồn quyết định thứ tự chồng. Ở bản cũ nó đứng sau và không có
          `pointer-events-none`, nên khi hero thấp lại nó trùm lên hàng nút và
          nuốt cú nhấp. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-background sm:h-20"
      />

      {/* Hai cột từ `lg` trở lên, cột phải cố định chứ không `1fr`: để nó co
          giãn thì ở 1024px thiên hà chiếm gần nửa bề ngang và bóp cột chữ
          xuống mức tiêu đề phải xuống bốn dòng.

          Chiều cao hạ từ min(64svh,34rem) xuống min(52svh,28rem) — chừng 19%.

          Mục đích không phải tiết kiệm pixel mà là ĐỂ LỘ khối kế tiếp. Ở 64svh
          cộng đệm, "Khám phá tương tác" nằm hoàn toàn dưới nếp gấp trên laptop,
          nên màn hình đầu tiên không có gì gợi rằng còn nội dung phía dưới. Hạ
          xuống 52svh thì tiêu đề mục sau ló lên, và một khối bị cắt dở nói
          "còn nữa" mạnh hơn bất kỳ mũi tên cuộn nào.

          Đệm dưới giảm từ pb-14 xuống pb-6. Khoảng dư cũ chỉ để chừa chỗ cho
          StatsBand thụt lên đè vào đáy hero bằng -mt-10, mà thanh ấy nay đã bỏ
          hẳn — nên nó không còn chừa cho ai cả. Khối ngay dưới cũng đã đổi từ
          `section-gap` (5rem) xuống `mt-10`, vì hai khoảng trống cộng lại tạo ra
          dải trống rộng nhất trang đúng ở chỗ cần liền mạch nhất.

          Cột phải 28rem → 36rem, tức thiên hà rộng thêm chừng 29%. */}
      <div className="container-page relative z-10 grid min-h-[min(52svh,28rem)] items-center gap-8 pt-10 pb-6 text-star lg:pb-3 lg:grid-cols-[minmax(0,1fr)_30rem] lg:gap-12 lg:pt-12 lg:pb-3">
        {/* `relative z-10` là bắt buộc, không phải trang trí.

            Dưới `lg` thiên hà là một lớp `absolute`, và trong CSS phần tử đã
            định vị luôn vẽ SAU phần tử tĩnh bất kể thứ tự trong DOM. Bỏ z-10 ở
            đây thì thiên hà nằm đè lên tiêu đề và ô tìm kiếm. Đúng cái bẫy đã
            ghi trong docs/design-system.md, mục "Ba cái bẫy CSS đã cắn thật". */}
        <div className="relative z-10 flex flex-col justify-center">
          <motion.p
            {...rise(0)}
            className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-widest text-white/90 uppercase backdrop-blur"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-accent" />
            {t("heroEyebrow")}
          </motion.p>

          {/* Bề ngang 44rem (704px) chứ không 48rem: ở 48rem tiêu đề chiếm gần
            hết cột trái và đẩy mắt chạy ngang quá xa trước khi xuống dòng.

            leading 1.08 chứ KHÔNG 1.05, dù 1.05 nhìn chặt hơn. Tiếng Việt xếp
            hai tầng dấu — "ẫ", "ỗ", "ằ" có mũ chồng dấu thanh — nên phần nhô
            lên cao hơn hẳn chữ Latin không dấu. Ở 1.05 với cỡ chữ 60px, dấu
            của dòng dưới chạm chân dòng trên. Chính tiêu đề này ("Vũ trụ trong
            tầm tay bạn") có ũ, ầ, ạ, và nay bề ngang hẹp lại nên nó xuống hai
            dòng ở nhiều bề rộng màn hình — tức rủi ro đó chuyển từ lý thuyết
            thành thường trực. Đây là chỗ chữ Latin cho phép chặt hơn chữ Việt,
            và bản tiếng Việt là bản chính. */}
          <motion.h1
            {...rise(0.08)}
            className="max-w-[44rem] font-display text-4xl leading-[1.08] font-bold tracking-tight text-balance text-white sm:text-5xl lg:text-6xl"
          >
            {/* Nửa sau tiêu đề mang màu accent (xanh), KHÔNG phải primary
                (vàng).

                Vàng đã có chủ trên màn hình này: nút tìm kiếm ở header. Tô
                vàng thêm nửa tiêu đề là dựng hai điểm vàng cạnh nhau, và lúc
                đó không điểm nào còn nhấn mạnh được gì — cùng lập luận đã chốt
                khi bỏ nút CTA vàng thứ hai khỏi hero.

                Dựng bằng `t.rich` nên câu vẫn nằm trọn trong tệp ngôn ngữ.
                Cắt thành hai khoá để nối bằng JSX là cách chắc chắn dịch sai ở
                ngôn ngữ có trật tự từ khác — tiếng Anh là "The universe within
                reach", chỗ ngắt rơi vào vị trí khác hẳn tiếng Việt. */}
            {t.rich("heroTitleRich", {
              hl: (chunks) => <span className="text-accent">{chunks}</span>,
            })}
          </motion.h1>

          <motion.p
            {...rise(0.16)}
            className="mt-5 max-w-2xl text-lg leading-[1.55] text-pretty text-white/85"
          >
            {t("heroSubtitle")}
          </motion.p>

          {/* Giữa ô tìm kiếm và các chip lĩnh vực KHÔNG còn gì.

              Chỗ này đã hai lần được lấp: một thanh bốn ô số liệu, rồi một
              dòng số liệu gọn kèm câu giới thiệu. Cả hai đều bị gỡ, và lý do
              giống nhau — chúng chen vào đúng quãng mắt đang đi từ ô tìm kiếm
              xuống lối vào đầu tiên, và bắt người đọc xử lý một thông tin họ
              không hỏi. Hero chỉ còn: tiêu đề, một câu, ô tìm kiếm, lĩnh vực.

              Muốn khoe số liệu thì chỗ đúng là SAU nội dung, không phải trước
              — nhưng lượt thử đó cũng đã bị gỡ, nên trước khi lắp lại lần ba
              hãy đọc lịch sử này. */}
          {fields && (
            <motion.div {...rise(0.24)} className="mt-7">
              {fields}
            </motion.div>
          )}

          {/* Cuối cột chữ KHÔNG còn khối nào.

              Đã bốn lượt thử lấp chỗ này: một nút lớn, ba chip, sáu card công
              cụ cuộn ngang, rồi ba thẻ nội dung động (bài mới nhất / mô hình
              3D / chủ đề đang quan tâm). Cả bốn đều bị gỡ.

              Lượt thứ tư khác ba lượt trước ở chỗ nó KHÔNG trùng khối bên
              dưới — nội dung của nó đổi theo kho. Vậy mà vẫn bị gỡ, nên lý do
              không nằm ở chuyện trùng lặp: hero đơn giản là không chịu thêm
              được một tầng lựa chọn nào sau ô tìm kiếm và các lĩnh vực.

              Đó là kết luận đáng giữ. Lượt thứ năm nên bắt đầu bằng câu hỏi
              "bỏ bớt gì", không phải "thêm gì". */}
          {/* Một nút, không hai. "Bắt đầu khám phá" trùng đúng mục "Khám phá" trên
            navbar và cạnh tranh trực tiếp với ô tìm kiếm ngay phía trên.

            Dùng `accent` (xanh) chứ KHÔNG dùng `primary` (vàng): vàng đã thuộc
            về nút tìm kiếm ngay phía trên. Hai nút vàng cạnh nhau thì không
            nút nào còn là nút chính, và mắt phải tự chọn — đúng thứ thứ bậc
            thị giác sinh ra để tránh. Xanh accent tách bạch, đủ nổi trên nền
            vũ trụ, và vẫn xếp sau vàng.

            Quầng sáng dùng `--color-accent` chứ không phải một mã màu viết
            cứng, để nó tự theo nếu bảng màu đổi lần nữa. */}
          {/*
            Hero không còn card công cụ nào.

            Đã thử ba lần và mỗi lần đều dồn thêm lựa chọn vào đúng chỗ ít
            chịu được nhất: một nút lớn, rồi ba chip, rồi sáu card cuộn ngang.
            Khối "Khám phá tương tác" ngay bên dưới đã liệt kê đủ sáu công cụ
            với ảnh và mô tả — nhắc lại chúng ở hero là bắt người vào lần đầu
            chọn hai lần cho cùng một việc.

            Hero giờ còn đúng một hành động: ô tìm kiếm. Các lĩnh vực khoa học
            bên dưới nó là lối vào thứ hai cho ai chưa biết mình tìm gì.
          */}
        </div>
      </div>
    </section>
  );
}
