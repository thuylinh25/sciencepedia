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
 * Trang chủ trước đây chỉ có một nút dẫn tới Hệ Mặt Trời 3D. Bốn công cụ
 * tương tác còn lại — Ngân Hà, Vũ trụ, hành trình thu phóng, bản đồ bầu trời
 * — chỉ nằm trong menu thả xuống của thanh điều hướng, tức là chỉ ai đã biết
 * chúng tồn tại mới tìm ra. Người vào lần đầu kết luận đây là một trang đọc
 * bài có kèm một mô hình 3D.
 *
 * ## Vì sao là Server Component
 *
 * Cả khối là ảnh, chữ và liên kết. Không một byte JavaScript nào cho phần
 * này; hiệu ứng xuất hiện khi cuộn do `StaggerGroup` lo, và nó vốn đã nằm
 * trong bundle của trang chủ.
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
  credit: string;
};

const CARDS: ExploreCard[] = [
  {
    id: "solarSystem",
    href: "/solar-system",
    image: "/images/explore/solar-system.jpg",
    emoji: "☀️",
    accent: "#f59e0b",
    credit: "NASA",
  },
  {
    id: "milkyWay",
    href: "/milky-way",
    image: "/images/explore/milky-way.jpg",
    emoji: "🌌",
    accent: "#818cf8",
    credit: "ESO/S. Brunier (CC BY 4.0)",
  },
  {
    id: "universe",
    href: "/universe",
    image: "/images/explore/universe.jpg",
    emoji: "🌠",
    accent: "#c084fc",
    credit: "NASA/ESA",
  },
  {
    id: "zoom",
    href: "/zoom",
    image: "/images/explore/zoom.jpg",
    emoji: "🔍",
    accent: "#38bdf8",
    credit: "NASA / Apollo 17",
  },
  {
    id: "skyMap",
    href: "/space-map",
    image: "/images/explore/sky-map.jpg",
    emoji: "⭐",
    accent: "#2dd4bf",
    credit: "ESO/B. Tafreshi (CC BY 4.0)",
  },
];

/**
 * Ba card hàng trên, hai card hàng dưới trên màn hình lớn.
 *
 * Lưới 6 cột: hàng trên mỗi card chiếm 2 cột, hàng dưới mỗi card chiếm 3.
 * Cách này cho đúng bố cục 3–2 mà không phải tách thành hai lưới rời, nên
 * khoảng cách giữa hai hàng vẫn do `gap` lo và luôn bằng nhau.
 */
const SPAN = ["lg:col-span-2", "lg:col-span-2", "lg:col-span-2", "lg:col-span-3", "lg:col-span-3"];

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

      <StaggerGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {CARDS.map((card, index) => (
          <StaggerItem key={card.id} className={SPAN[index]}>
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
                  nhạt để năm card không thành năm ô xám giống nhau. */}
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

      {/* Một dòng ghi nguồn cho cả lưới thay vì một dòng trên mỗi card: năm
          dòng chữ nhỏ rải trong năm tấm ảnh làm hỏng đúng thứ khối này cần —
          một cú nhìn là hiểu có năm công cụ. Giấy phép vẫn được ghi đủ. */}
      <p className="mt-4 text-xs text-muted-foreground">
        {t("credit")}:{" "}
        {CARDS.map((card) => `${t(`cards.${card.id}.title`)} — ${card.credit}`).join(" · ")}
      </p>
    </section>
  );
}
