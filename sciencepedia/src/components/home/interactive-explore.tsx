import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";

/**
 * Khối "Khám phá tương tác" trên trang chủ.
 *
 * ## Vì sao nó tồn tại
 *
 * Trang chủ trước đây chỉ có một nút dẫn tới Hệ Mặt Trời 3D. Năm công cụ
 * tương tác còn lại — Ngân Hà, Vũ trụ, hành trình thu phóng, bản đồ bầu trời,
 * Trái Đất thời gian thực — chỉ nằm trong menu thả xuống của thanh điều
 * hướng, tức là chỉ ai đã biết chúng tồn tại mới tìm ra. Người vào lần đầu
 * kết luận đây là một trang đọc bài có kèm một mô hình 3D.
 *
 * ## Vì sao là Server Component
 *
 * Cả khối là ảnh, chữ và liên kết. Không một byte JavaScript nào cho phần
 * này; hiệu ứng xuất hiện khi cuộn do `StaggerGroup` lo, và nó vốn đã nằm
 * trong bundle của trang chủ.
 *
 * ## Vì sao không có dòng ghi nguồn
 *
 * Cả sáu ảnh đều thuộc phạm vi công cộng của NASA, ESA hoặc JWST, và phạm
 * vi công cộng không đòi hỏi ghi nguồn. Hai ảnh ESO dùng lúc đầu là CC BY
 * 4.0 — giấy phép đó BẮT BUỘC ghi nguồn, nên chúng đã được thay chứ không
 * phải chỉ xoá dòng chữ đi. Thêm ảnh mới vào đây thì phải kiểm lại điều kiện
 * này trước.
 *
 * ## Vì sao ảnh nằm trong /public
 *
 * Khối này ở ngay dưới hero nên ảnh của nó rơi vào vùng đo LCP. Trỏ thẳng
 * tới upload.wikimedia.org là thêm một lượt DNS cộng TLS tới máy chủ khác
 * ngay trên đường quan trọng nhất của trang.
 */

type ExploreCard = {
  id: string;
  href: string;
  /** Ảnh nền, đã cắt sẵn 16:10 — xem `scripts` trong ghi chú commit */
  image: string;
  emoji: string;
  /** Màu nhận dạng, trùng với màu chủ đạo của chính mô hình đó */
  accent: string;
  /**
   * Huy hiệu góc trên, nếu có.
   *
   * Chỉ hai giá trị, và cả hai đều là **phán quyết biên tập** chứ không phải
   * phép đo. Cố ý không có nhãn kiểu "🔥 Phổ biến": toàn site mới có 141 lượt
   * đọc, nên gắn nhãn phổ biến là bịa ra một dữ liệu mình không có. Nhãn sai
   * kiểu đó rẻ tiền đúng một lần, rồi người đọc thôi tin mọi nhãn khác.
   *
   * `start` — chỗ nên vào trước. `highlight` — thứ đáng xem nhất.
   */
  badge?: "start" | "highlight";
};

/*
 * Thứ tự là thứ tự ưu tiên giới thiệu, không phải thứ tự quy mô.
 *
 * Hành trình thu phóng đứng đầu vì nó là thứ duy nhất giải thích được cả năm
 * cái kia: đi qua nó một lượt là hiểu các mô hình kia đang ở bậc nào. Hệ
 * Mặt Trời thứ hai vì quen nhất. Trái Đất thời gian thực thứ ba vì nó là thứ
 * duy nhất đổi mỗi ngày. Ngân Hà và Vũ trụ xuống cuối không phải vì kém quan
 * trọng mà vì trừu tượng nhất — người vào lần đầu cần một chỗ bám trước đã.
 */
const CARDS: ExploreCard[] = [
  {
    id: "zoom",
    href: "/zoom",
    image: "/images/explore/zoom.jpg",
    emoji: "🔍",
    accent: "#38bdf8",
    // Đứng đầu danh sách vì nó giải thích được cả năm cái kia, nên nó cũng là
    // chỗ nên vào trước. Huy hiệu chỉ nói lại điều thứ tự đã nói.
    badge: "start",
  },
  {
    id: "solarSystem",
    href: "/solar-system",
    image: "/images/explore/solar-system.jpg",
    emoji: "☀️",
    accent: "#f59e0b",
    badge: "highlight",
  },
  {
    id: "skyMap",
    href: "/space-map",
    image: "/images/explore/sky-map.jpg",
    emoji: "⭐",
    accent: "#2dd4bf",
  },
  {
    id: "milkyWay",
    href: "/milky-way",
    image: "/images/explore/milky-way.jpg",
    emoji: "🌌",
    accent: "#818cf8",
  },
  {
    id: "universe",
    href: "/universe",
    image: "/images/explore/universe.jpg",
    emoji: "🌠",
    accent: "#c084fc",
  },
];

/*
 * Lưới 3 cột, năm card chia 3–2 trên màn hình lớn.
 *
 * Hàng dưới còn một ô trống, và để nguyên như vậy là cố ý. Bản cũ từng dùng
 * lưới 6 cột với span riêng cho hai card hàng dưới để lấp ô đó, nhưng cái
 * giá là hai card cuối rộng hơn ba card trên — người xem đọc ra thành hai
 * hạng mục khác nhau, trong khi cả năm đều ngang hàng. Một ô trống thành
 * thật hơn một thứ bậc bịa ra.
 */

export async function InteractiveExplore() {
  const t = await getTranslations("explore");

  return (
    /* `mt-10` chứ không `section-gap`.

       Đây là khối ĐẦU TIÊN sau hero, và hero đã tự có đệm dưới. Cộng thêm
       một khoảng cách mục tiêu chuẩn nữa thì hai khoảng trống chồng lên
       nhau, và dải trống giữa hàng thẻ cuối hero với tiêu đề mục này rộng
       hơn hẳn mọi khoảng cách khác trên trang — đúng chỗ cần liền mạch nhất,
       vì hàng thẻ kia cố ý bị mép màn hình cắt dở để mời cuộn xuống.

       Các mục sau vẫn dùng `section-gap`; chỉ mục đứng ngay dưới hero là
       ngoại lệ. */
    <section className="container-page mt-10">
      <div className="max-w-3xl">
        {/* Nhãn phân loại trên tiêu đề: ba từ nói ngay đây là loại nội dung
            KHÁC với danh sách bài viết bên dưới. Cỡ chữ nhỏ và giãn ký tự rộng
            để nó đọc ra như một nhãn chứ không như một dòng chữ bị lạc. */}
        <p className="mb-3 text-xs font-medium tracking-[0.18em] text-primary-strong/80 uppercase">
          {t("eyebrow")}
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <StaggerGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <StaggerItem key={card.id}>
            <Link
              href={card.href}
              /* Quầng sáng xanh khi rê chuột, thay cho `shadow-2xl` đen.

                 Bóng đen trên nền tối gần như không thấy, nên card cũ nâng lên
                 mà không có gì đi kèm. Quầng xanh accent thì tách khỏi nền và
                 nói "cái này bấm được".

                 `-translate-y-1.5` = 6px. KHÔNG nâng cao hơn: transform trên
                 thẻ cha tạo containing block cho mọi con `position: fixed` —
                 đúng cái đã làm hỏng nút toàn màn hình của Aladin hồi trước.
                 Ở đây an toàn vì card chỉ chứa ảnh và chữ, nhưng ai thêm một
                 lớp phủ `fixed` vào trong card thì phải đọc lại chỗ này. */
              className="group relative flex h-full min-h-[15rem] flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-[#05070f] p-5 transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:border-white/30 hover:shadow-[0_20px_55px_-18px_rgba(56,189,248,0.45)] focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none sm:min-h-[17rem]"
            >
              {/* Ảnh sáng hơn hẳn: opacity 55% → 72%, cộng `brightness-110`.

                  Ở mức cũ, bốn trong sáu ảnh tối tới mức phải đọc tiêu đề mới
                  biết card nói về cái gì — trong khi cả điểm của một khối ảnh
                  lớn là nhận ra chủ thể trước khi đọc. Chữ vẫn đọc được vì lớp
                  phủ dọc bên dưới giữ nguyên độ đặc ở ĐÁY, nơi có chữ; chỉ
                  phần trên của card sáng lên. */}
              <Image
                src={card.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover opacity-[0.72] brightness-110 transition-[transform,opacity] duration-300 ease-out group-hover:scale-[1.05] group-hover:opacity-90"
              />

              {/* Hai lớp phủ chồng nhau: một lớp dọc cho chữ ở đáy luôn đọc
                  được bất kể ảnh sáng tối thế nào, một lớp màu nhận dạng rất
                  nhạt để sáu card không thành sáu ô xám giống nhau.

                  Lớp dọc giữ `from-[#05070f]` đặc ở đáy — đó là thứ bảo đảm
                  tương phản chữ, và nó KHÔNG được nới. Phần nới là khúc giữa
                  và trên: /75 → /55 và /15 → /0, để chủ thể trong ảnh lộ ra. */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-[#05070f]/55 to-transparent"
              />
              <div
                aria-hidden
                className="absolute inset-0 opacity-25 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-40"
                style={{
                  background: `radial-gradient(120% 90% at 20% 0%, ${card.accent}, transparent 70%)`,
                }}
              />

              {/* Huy hiệu góc trên phải. Dùng màu nhận dạng của chính card chứ
                  không dùng một màu chung: nó phải đọc ra như một phần của
                  card, không như một nhãn dán từ bên ngoài. */}
              {card.badge && (
                <span
                  className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur-md"
                  style={{
                    color: card.accent,
                    borderColor: `${card.accent}55`,
                    backgroundColor: `${card.accent}1a`,
                  }}
                >
                  {t(`badges.${card.badge}`)}
                </span>
              )}

              <div className="relative">
                {/* Icon nhích lên và sáng viền khi rê chuột — chuyển động nhỏ
                    nhất còn nhận ra được. Dùng transform chứ không đổi kích
                    thước hộp, nên không có lượt bố cục lại nào. */}
                <span
                  aria-hidden
                  className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-xl backdrop-blur-md transition-[transform,border-color] duration-300 ease-out group-hover:-translate-y-0.5 group-hover:border-white/35"
                >
                  {card.emoji}
                </span>

                <h3 className="mt-3 font-display text-xl font-bold text-white">
                  {t(`cards.${card.id}.title`)}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/70">
                  {t(`cards.${card.id}.body`)}
                </p>

                {/* Dòng dữ liệu: hai mẩu, đều là sự thật KIỂM ĐƯỢC về chính mô
                    hình đó — 8 hành tinh, 4 nhánh xoắn, 18 điểm đến — chứ
                    không phải con số quảng cáo. Bản mô tả đề nghị "200+ vệ
                    tinh" cho Hệ Mặt Trời và "cập nhật gần thời gian thực" cho
                    Trái Đất L1; cả hai đều sai: mô hình có 7 vệ tinh, và NASA
                    công bố ảnh EPIC chậm chừng ba ngày — chính lý do tiêu đề
                    thẻ đó đã phải đổi trước đây. */}
                <ul className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/45">
                  {(["metaA", "metaB"] as const).map((key, index) => (
                    <li key={key} className="flex items-center gap-2">
                      {index > 0 && (
                        <span aria-hidden className="text-white/25">
                          ·
                        </span>
                      )}
                      {t(`cards.${card.id}.${key}`)}
                    </li>
                  ))}
                </ul>

                <span
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium transition-transform duration-300 ease-out group-hover:translate-x-1"
                  style={{ color: card.accent }}
                >
                  {t(`cards.${card.id}.cta`)}
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGroup>

      {/* KHÔNG có CTA "xem tất cả" ở cuối mục.

          Đã thử một nút dẫn tới `/models`, và nó bị gỡ. Lý do gốc vẫn đứng:
          sáu thẻ trên đây ĐÃ LÀ toàn bộ công cụ tương tác của site, còn
          `/models` chỉ liệt kê ba mô hình quy mô — một nút "xem tất cả" dẫn
          tới chỗ có ÍT hơn là lời hứa hụt.

          Muốn có nút đó thật thì trước hết phải có một trang liệt kê đủ cả
          sáu trải nghiệm. Đừng lắp nút trước rồi tìm chỗ cho nó trỏ tới. */}
    </section>
  );
}
