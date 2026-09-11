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
  },
  {
    id: "solarSystem",
    href: "/solar-system",
    image: "/images/explore/solar-system.jpg",
    emoji: "☀️",
    accent: "#f59e0b",
  },
  {
    id: "earthLive",
    href: "/earth-live",
    image: "/images/explore/earth-live.jpg",
    emoji: "🌍",
    accent: "#34d399",
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
 * Lưới 3 cột, sáu card chia ba–ba trên màn hình lớn.
 *
 * Lúc còn năm card thì bố cục phải là 3–2, cần một lưới 6 cột với span riêng
 * cho hai card hàng dưới để không chừa một ô trống. Sáu card thì chia đều,
 * nên span biến mất và mọi card có cùng bề rộng.
 */

export async function InteractiveExplore() {
  const t = await getTranslations("explore");

  return (
    <section className="container-page section-gap">
      <div className="max-w-3xl">
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
              className="group relative flex h-full min-h-[15rem] flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-[#05070f] p-5 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1.5 hover:border-white/30 hover:shadow-2xl focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none sm:min-h-[17rem]"
            >
              <Image
                src={card.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover opacity-55 transition-[transform,opacity] duration-500 group-hover:scale-[1.06] group-hover:opacity-70"
              />

              {/* Hai lớp phủ chồng nhau: một lớp dọc cho chữ ở đáy luôn đọc
                  được bất kể ảnh sáng tối thế nào, một lớp màu nhận dạng rất
                  nhạt để sáu card không thành sáu ô xám giống nhau. */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-[#05070f]/75 to-[#05070f]/15"
              />
              <div
                aria-hidden
                className="absolute inset-0 opacity-25 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-40"
                style={{
                  background: `radial-gradient(120% 90% at 20% 0%, ${card.accent}, transparent 70%)`,
                }}
              />

              <div className="relative">
                <span
                  aria-hidden
                  className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-xl backdrop-blur-md"
                >
                  {card.emoji}
                </span>

                <h3 className="mt-3 font-display text-xl font-bold text-white">
                  {t(`cards.${card.id}.title`)}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/70">
                  {t(`cards.${card.id}.body`)}
                </p>

                <span
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                  style={{ color: card.accent }}
                >
                  {t(`cards.${card.id}.cta`)}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGroup>

    </section>
  );
}
