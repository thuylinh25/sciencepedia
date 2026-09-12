"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

import { HeroGalaxy } from "@/components/home/hero-galaxy";

/**
 * `search` là một slot: ô tìm kiếm phải là Server Component (chạy khi tắt JS,
 * không hook nào) nhưng Hero buộc phải là client vì framer-motion. Server
 * Component không import được vào client, nên trang chủ render nó rồi truyền
 * xuống đây qua prop.
 */
export function Hero({
  search,
  fields,
}: {
  search?: ReactNode;
  fields?: ReactNode;
}) {
  const t = useTranslations("home");
  const locale = useLocale();
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
      {/* Quầng sáng nền, chuyển động rất chậm */}
      <div
        aria-hidden
        className="animate-aurora pointer-events-none absolute -top-1/3 left-1/2 size-[70rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
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
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-background"
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
      <div className="container-page relative z-10 grid min-h-[min(52svh,28rem)] items-center gap-8 pt-10 pb-3 text-star lg:grid-cols-[minmax(0,1fr)_36rem] lg:gap-12 lg:pt-12 lg:pb-3">
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
            {t("heroTitle")}
          </motion.h1>

          <motion.p
            {...rise(0.16)}
            className="mt-5 max-w-2xl text-lg leading-[1.55] text-pretty text-white/85"
          >
            {t("heroSubtitle")}
          </motion.p>

          {search && (
            <motion.div {...rise(0.2)} className="mt-5">
              {search}
            </motion.div>
          )}

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
            <motion.div {...rise(0.32)} className="mt-5">
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

        {/* Một thể hiện duy nhất, hai cách đặt.

            Từ `lg`: ô vuông ở cột phải của lưới, như cũ.

            Dưới `lg`: `absolute` ở góc dưới phải, tràn ra ngoài mép, mờ đi và
            nằm dưới cột chữ. Cách này chọn sau khi cân hai ràng buộc ngược
            nhau — thiên hà phải thấy được trên điện thoại, nhưng hero vừa được
            hạ từ 88vh xuống 70vh và thêm một ô vuông vào cột dọc là trả lại
            đúng chỗ vừa lấy được. Ra khỏi luồng thì nó cao 0px, CLS vẫn bằng 0.

            KHÔNG dựng hai thẻ rồi ẩn bớt một bằng `hidden`: mỗi thẻ là một
            canvas WebGL riêng, dựng hai cái rồi giấu một là trả tiền hai lần.

            Góc dưới phải chứ không phải sau chữ: ở đó chỉ có nút CTA nằm bên
            trái, nên không có chữ trắng nào phải đọc trên nền có lõi thiên hà
            sáng. Đây là ràng buộc tương phản, không phải sở thích bố cục. */}
        {/* `bottom-14` chứ KHÔNG phải `-bottom-[6%]`.

            Bản cũ để thiên hà thò xuống dưới đáy hero, và ở đó nó bị che hai
            lần: `overflow-hidden` của hero cắt phần tràn ra, rồi StatsBand —
            thụt lên 40px bằng `-mt-10` — phủ nốt 40px cuối. Mất chừng một
            phần ba khối, đúng phần có lõi sáng.

            Thu nhỏ thanh số KHÔNG chữa được: mép trên của nó nằm ở "đáy hero
            trừ 40px", tính từ `-mt-10`, nên nó đứng nguyên chỗ đó dù thanh cao
            hay thấp. Thứ phải đổi là vị trí thiên hà.

            3.5rem = 56px, tức trên mép thanh số 16px. Đo theo px cố định chứ
            không theo % vì thứ phải né là `-mt-10`, một giá trị px cố định —
            dùng % thì khoảng hở đổi theo chiều cao hero và có bề rộng màn hình
            sẽ chạm lại. */}
        {/* Rộng thêm ở cả hai bố cục, và cho tràn qua mép phải.

            Từ `lg`: cột lưới đã lên 36rem, cộng `-mr-10` để đĩa chạy quá mép
            container. Hero có `overflow-hidden` nên phần tràn bị cắt gọn ở
            cạnh khung — đó chính là hiệu ứng cần: thiên hà trông LỚN HƠN khung
            chứa nó, chứ không phải một tấm ảnh dán vừa khít.

            Dưới `lg`: 17rem → 21rem, chừng +24%. Không tăng mạnh hơn vì ở bố
            cục đó nó nằm DƯỚI cột chữ; to quá thì phần sáng của đĩa dâng lên
            sau chữ trắng và ăn mất tương phản. Đây là ràng buộc đọc được, không
            phải sở thích bố cục. */}
        {/* `lg:-mb-16` — thiên hà tràn XUỐNG dưới đáy hàng lưới.

            Thiên hà là ô vuông rộng 36rem cộng `-mr-10`, tức cao chừng 616px,
            trong khi cột chữ chỉ cao chừng 400px. Lưới lấy chiều cao theo ô
            cao nhất, còn `items-center` canh giữa cột chữ trong chiều cao ấy
            — nên dưới hàng chip lĩnh vực còn dư hơn 100px trống. Đó là dải
            trống rộng nhất trang, đúng chỗ cần liền mạch với "Khám phá tương
            tác".

            Cách chữa KHÔNG phải thu nhỏ thiên hà: bề rộng 36rem là một quyết
            định đã cân nhắc ở trên. Lề âm dưới kéo chiều cao hàng lưới xuống
            64px mà kích thước vẽ của thiên hà giữ nguyên — nó tràn qua đáy
            hàng, đúng cùng lối đã dùng cho `-mr-10` ở mép phải.

            Phần tràn ra bị `overflow-hidden` của hero cắt, và chỗ bị cắt chỉ
            là vành quầng sáng mờ (lớp `inset-[4%]` blur), lại nằm sẵn dưới
            dải chuyển mềm cao 80px ở đáy hero. Đệm dưới hạ từ pb-6/pb-7 xuống
            pb-3 trong cùng lượt này.

            Ai tăng bề rộng cột phải lần nữa thì phải tăng cả số âm này, không
            thì quãng trống quay lại y như cũ.

            `lg:-translate-y-10` — nhích đĩa lên 40px.

            Dùng transform chứ KHÔNG dùng `-mt`: lề âm rút chiều cao hàng lưới,
            mà chiều cao ấy đang do chính thiên hà quyết định (xem trên), nên
            nhích bằng lề sẽ kéo theo cả cột chữ và làm hỏng lượt cân khoảng
            trống vừa xong. Transform chỉ dịch lúc VẼ, hàng lưới không đổi một
            pixel nào.

            Đánh đổi đã biết: transform trên thẻ cha tạo containing block cho
            mọi con `position: fixed`. Ở đây an toàn vì bên trong chỉ có một
            canvas WebGL — nhưng ai thêm một lớp phủ `fixed` vào HeroGalaxy thì
            phải đọc lại chỗ này. Cùng cái bẫy đã ghi ở thẻ Khám phá tương tác. */}
        <div className="pointer-events-none absolute -right-[24%] bottom-10 z-0 w-[21rem] max-w-[70%] opacity-60 lg:pointer-events-auto lg:static lg:-mr-10 lg:-mb-16 lg:w-auto lg:max-w-none lg:-translate-y-10 lg:opacity-100">
          <HeroGalaxy locale={locale} />
        </div>
      </div>
    </section>
  );
}
