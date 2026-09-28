import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { ArrowRight, PersonStanding, Sparkles, type LucideIcon } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { assetUrl } from "@/lib/asset";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { PIECE_COUNT, SYSTEM_IDS } from "@/lib/human-atlas/anatomy";
import { SKY_TARGETS } from "@/lib/sky-data";
import { PLANETS } from "@/lib/solar-data";
import { cn } from "@/lib/utils";
import { AssetImage } from "@/components/ui/asset-image";

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
 * ## Ghi nguồn ảnh
 *
 * Sáu ảnh thiên văn thuộc phạm vi công cộng của NASA, ESA hoặc JWST — không
 * đòi ghi nguồn. Hai ảnh ESO dùng lúc đầu là CC BY 4.0 nên đã được THAY, chứ
 * không chỉ xoá dòng chữ.
 *
 * Ảnh thẻ Bản đồ cơ thể người là ngoại lệ không thay được: đó là ảnh chụp
 * chính mô hình BodyParts3D (CC BY 4.0) trên trang `/human-atlas`, và không có
 * ảnh giải phẫu 3D phạm vi công cộng nào nói đúng về công cụ ấy bằng nó. Nên
 * nó mang `credit`, và dưới lưới có dòng ghi nguồn. Thêm ảnh mới vào đây thì
 * phải kiểm giấy phép trước — ảnh CC BY thì bắt buộc có `credit`.
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
  /**
   * Icon lucide thay cho `emoji`. Dùng khi emoji gần nhất đọc sai chủ đề:
   * 🫀 là trái tim, không phải "giải phẫu cơ thể" — thẻ trông như một công cụ
   * tim mạch. `PersonStanding` là icon mà menu Công cụ đã dùng cho chính
   * trang này (`site-tools.ts`), nên hai lối vào nhận ra nhau.
   */
  icon?: LucideIcon;
  /** Màu nhận dạng, trùng với màu chủ đạo của chính mô hình đó */
  accent: string;
  /**
   * Đích là một tệp tĩnh trong `/public`, không phải route của ứng dụng.
   *
   * Phải render bằng thẻ `<a>` thường chứ không bằng `Link` của next-intl:
   * `Link` gắn tiền tố ngôn ngữ vào mọi đường dẫn, nên `/tools/x.html` sẽ
   * thành `/vi/tools/x.html` và trả 404.
   */
  external?: boolean;
  /**
   * Thẻ chủ lực: chiếm 2x2 ô trên lưới lớn.
   *
   * Chỉ ĐÚNG MỘT thẻ được đặt cờ này. Hai thẻ cùng lớn thì không thẻ nào lớn,
   * và lưới quay về trạng thái mọi thẻ ngang hàng — chính thứ cờ này sinh ra
   * để phá.
   */
  feature?: boolean;
  /**
   * Thẻ đứng cột phải, cạnh thẻ chủ lực, ở lưới `xl`: rộng 4/12 thay vì 3/12
   * của hàng dưới. Đúng hai thẻ mang cờ này — hai ô cao bằng thẻ chủ lực.
   */
  besideFeature?: boolean;
  /** `object-position` của ảnh khi khung cắt ngang — giữ phần đầu/ngực thay vì bụng. */
  imagePosition?: string;
  /**
   * Lớp phủ nhẹ ở nửa trên, ảnh đậm hơn. Cho ảnh chụp MÔ HÌNH trên nền tối
   * phẳng: ảnh thiên văn tối sẵn nên lớp phủ chuẩn vừa, còn mô hình sáng màu
   * bị lớp phủ chuẩn dìm thành một khối mờ. Đáy vẫn đặc như mọi thẻ — chữ ở đó.
   */
  lightScrim?: boolean;
  /** Dòng ghi nguồn bắt buộc theo giấy phép ảnh (CC BY). Không có = phạm vi công cộng. */
  credit?: string;
};

/*
 * Thứ tự là thứ tự ưu tiên giới thiệu, không phải thứ tự quy mô.
 *
 * Bản đồ cơ thể người (thêm 2026-09-28) đứng ngay sau thẻ chủ lực, ô đầu cột
 * phải: khối này là thứ người vào lần đầu thấy, và có một thẻ không phải thiên
 * văn ở đó thì mục này đọc ra là "khám phá khoa học", không phải "thư viện
 * thiên văn". Ở cuối lưới nó sẽ bị đọc như món phụ.
 *
 * Nó là thẻ THƯỜNG, không phải thẻ đứng (đổi 2026-09-28). Bản đầu cho nó cả
 * cột phải 1x3 ô, và một thẻ cao gần bằng thẻ chủ lực thì tranh vai chủ lực:
 * người xem thấy hai cửa vào ngang nhau — đúng thứ cờ `feature` sinh ra để
 * phá. Độ nổi của nó đến từ vị trí, không từ kích thước.
 *
 * Hành trình thu phóng đứng đầu vì nó là thứ duy nhất giải thích được cả năm
 * cái kia: đi qua nó một lượt là hiểu các mô hình kia đang ở bậc nào. Hệ
 * Mặt Trời thứ hai vì quen nhất. Trái Đất thời gian thực thứ ba vì nó là thứ
 * duy nhất đổi mỗi ngày. Ngân Hà và Vũ trụ xuống cuối không phải vì kém quan
 * trọng mà vì trừu tượng nhất — người vào lần đầu cần một chỗ bám trước đã.
 */
/**
 * Số điểm đến mà trang `/space-map` thật sự mời người xem bấm vào: danh mục
 * thiên thể sâu của bản đồ bầu trời, cộng Mặt Trời, tám hành tinh và Mặt
 * Trăng trong dải ảnh bề mặt ngay bên dưới.
 *
 * TÍNH RA, không viết tay. Nhãn cũ ghi cứng "18 điểm đến" trong tệp ngôn
 * ngữ — đúng với một phiên bản danh mục đã qua, và từ đó lạc hậu im lặng:
 * thêm một thiên thể vào `SKY_TARGETS` thì nhãn sai mà không có gì kêu lên.
 * Đây đúng loại lỗi mà docs/content-rules.md mở đầu bằng — số trên trang
 * phải bằng số trong thực tế, và cách rẻ nhất để giữ điều đó là đừng có hai
 * bản sao của cùng một con số.
 */
const SKY_MAP_DESTINATIONS = SKY_TARGETS.length + PLANETS.length + 2;

const CARDS: ExploreCard[] = [
  {
    /*
     * Thẻ CHỦ LỰC. Đứng đầu vì lưới đọc theo thứ tự nguồn, và to hơn năm thẻ
     * còn lại vì sáu công cụ KHÔNG ngang nhau về mức độ quen thuộc — người
     * vào lần đầu cần một chỗ hiển nhiên để bắt đầu chứ không phải sáu lựa
     * chọn cùng cỡ.
     *
     * Đổi 2026-09-13 (yêu cầu của chủ sản phẩm): trước đây vị trí này là Hệ
     * Mặt Trời 3D, với lý do "ai cũng có sẵn một hình dung trong đầu nên nó
     * là cửa vào rẻ nhất". Bản đồ bầu trời thay chỗ vì nó là thứ DUY NHẤT
     * trong sáu công cụ cho xem ảnh quan sát thật thay vì mô hình dựng —
     * và vì nó dẫn tới 21 điểm đến, nhiều hơn hẳn các thẻ còn lại.
     *
     * Ba thẻ mô hình 3D nay xếp liền nhau ở hàng dưới, từ lớn tới nhỏ:
     * Vũ trụ → Dải Ngân Hà → Hệ Mặt Trời. Thứ tự ấy là một thang quy mô,
     * nên hàng dưới tự đọc ra thành một mạch chứ không phải ba thẻ rời.
     *
     * Huy hiệu góc thẻ đã BỎ HẲN (2026-09-12). Thứ tự và kích thước phải tự
     * nói ra việc nên vào đâu trước — một nhãn chữ dán thêm chỉ cần thiết khi
     * bố cục không nói nổi điều đó.
     */
    id: "skyMap",
    href: "/space-map",
    image: assetUrl("explore/sky-map.jpg"),
    emoji: "⭐",
    accent: "#2dd4bf",
    feature: true,
  },
  {
    id: "humanAtlas",
    besideFeature: true,
    href: "/human-atlas",
    /*
     * Ảnh bìa v2 (2026-09-28), chụp từ CHÍNH viewer `/human-atlas` (theme tối,
     * camera mặc định xoay nhẹ và hạ thấp để đường chân trời xuống dưới đùi),
     * khung đầu → đùi trên. Hai lượt chụp cùng một camera ghép dọc đường
     * giữa: nửa phải người là mặc định của viewer (hệ cơ phủ ngoài), nửa trái
     * là xương + tim + hô hấp + tiêu hoá + động/tĩnh mạch + thần kinh.
     *
     * Vì sao ghép chứ không một hệ: chỉ hệ cơ thì đọc ra "mô hình người",
     * chỉ tuần hoàn thì đọc ra "bản đồ mạch máu". Một ảnh phải nói "nhiều
     * lớp, nhiều hệ", và nửa cơ/nửa trong là cách atlas giải phẫu nói điều
     * đó từ trước khi có 3D. Mọi điểm ảnh vẫn là thứ viewer thật sự vẽ.
     *
     * Bản v1 (`human-atlas.jpg`, toàn thân) còn trên R2, không xoá — ảnh cũ
     * trỏ tới khoá cũ cho tới khi bản triển khai này lên.
     */
    image: assetUrl("explore/human-atlas-v2.jpg"),
    emoji: "🫀",
    icon: PersonStanding,
    accent: "#fb7185",
    /* Ảnh 16:10, người đứng ở ~68% bề ngang — lệch phải để khối chữ canh trái
       không đè đầu/ngực. `0%` dọc: khung nào cao hơn 16:10 (lưới 3 cột ở
       laptop) thì cắt hai bên, đầu vẫn ở mép trên; khung nào dẹt hơn thì cắt
       đáy, tức phần đùi vốn chìm sau lớp phủ. */
    imagePosition: "70% 0%",
    lightScrim: true,
    credit: "BodyParts3D © DBCLS, CC BY 4.0",
  },
  {
    id: "zoom",
    besideFeature: true,
    href: "/zoom",
    image: assetUrl("explore/zoom.jpg"),
    emoji: "🔍",
    accent: "#38bdf8",
  },
  {
    id: "universe",
    href: "/universe",
    image: assetUrl("explore/universe.jpg"),
    emoji: "🌠",
    accent: "#c084fc",
  },
  {
    id: "milkyWay",
    href: "/milky-way",
    image: assetUrl("explore/milky-way.jpg"),
    emoji: "🌌",
    accent: "#818cf8",
  },
  {
    id: "solarSystem",
    href: "/solar-system",
    image: assetUrl("explore/solar-system.jpg"),
    emoji: "☀️",
    accent: "#f59e0b",
  },
  {
    id: "earthLive",
    /*
     * Trỏ lại route `/earth-live` — trang ảnh EPIC/DSCOVR nhìn từ điểm L1.
     *
     * Trang này từng bị gỡ một lượt, và trong quãng đó thẻ trỏ sang tệp tĩnh
     * `/tools/earth-live.html` (bản đồ ảnh vệ tinh NASA GIBS). Nay trang L1
     * quay lại và công cụ GIBS đã xoá hẳn, nên thẻ trỏ về route như ban đầu
     * và KHÔNG còn cần cờ `external`.
     *
     * Hai thứ đó khác nhau thật chứ không phải hai bản của cùng một công cụ:
     * L1 cho toàn đĩa Trái Đất mỗi ngày một vòng, GIBS cho tile phóng to
     * được mười phút một lần. Ai muốn lắp lại GIBS thì lắp thành thẻ RIÊNG,
     * đừng đổi đích của thẻ này — chữ trên thẻ nói về DSCOVR.
     */
    href: "/earth-live",
    image: assetUrl("explore/earth-live.jpg"),
    emoji: "🌍",
    accent: "#34d399",
  },
];

/*
 * Từ `xl` lưới 12 cột: thẻ chủ lực 8/12 x 2 hàng, cột phải 4/12 là Cơ thể
 * người + Hành trình thu phóng, hàng dưới bốn thẻ 3/12 Vũ trụ → Ngân Hà → Hệ
 * Mặt Trời → Trái Đất L1 — dải thang quy mô đi tiếp xuống tận Trái Đất. Kín.
 *
 * Vì sao (chốt 2026-09-28, chủ sản phẩm chọn): bảy thẻ với thẻ chủ lực 2x2
 * trên lưới 3 cột là 10 ô — hàng cuối một thẻ trơ trọi cạnh hai ô trống. Lượt
 * đầu lấp bằng 4 cột với thẻ chủ lực 3/4, nhưng thẻ chủ lực rộng gấp ba hai
 * thẻ bên cạnh thì lệch quá — chủ sản phẩm yêu cầu thu hẹp. 8/12 giữ đúng tỷ
 * lệ 2/3 của lưới `lg`, nên bố cục không đổi dáng khi qua mốc 1280 px. Hai thẻ
 * cột phải rộng hơn hàng dưới một chút; đó là giá của việc kín lưới.
 *
 * `lg` (1024–1279) vẫn 3 cột và vẫn thừa một thẻ ở hàng cuối: ở bề rộng đó 4
 * cột chỉ còn ~230 px mỗi thẻ, tiêu đề gãy ba dòng. Ở lưới 2 cột (sm):
 * 2 + 6 = 8 ô, chẵn.
 *
 * Số card đã dao động 6 → 5 → 6 trong cùng một ngày, nên đừng gắn bố cục vào
 * một con số cụ thể. Quy tắc: chia đều `lg:grid-cols-3` và để hàng cuối thiếu
 * ô nếu số card không chia hết. KHÔNG quay lại lưới 6 cột với span riêng cho
 * hàng cuối — cách đó từng làm hai card cuối rộng hơn phần còn lại, và người
 * xem đọc ra thành hai hạng mục khác nhau trong khi mọi card đều ngang hàng.
 */

/**
 * Một chỗ duy nhất quyết định dùng `Link` hay `<a>`.
 *
 * Tách ra thành component thay vì viết ba toán tử ba ngôi trong JSX: mọi
 * thuộc tính hiển thị (className, children) chỉ khai báo MỘT lần, nên hai
 * nhánh không thể trôi khỏi nhau khi ai đó sửa một bên mà quên bên kia.
 */
function CardLink({
  card,
  className,
  children,
}: {
  card: ExploreCard;
  className?: string;
  children: ReactNode;
}) {
  if (card.external) {
    return (
      <a href={card.href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={card.href} className={className}>
      {children}
    </Link>
  );
}

export async function InteractiveExplore() {
  const t = await getTranslations("explore");

  return (
    /* `mt-4` chứ không `section-gap`.

       Đây là khối ĐẦU TIÊN sau hero, và hero đã tự có đệm dưới. Cộng thêm
       một khoảng cách mục tiêu chuẩn nữa thì hai khoảng trống chồng lên
       nhau, và dải trống giữa hàng chip lĩnh vực với tiêu đề mục này rộng
       hơn hẳn mọi khoảng cách khác trên trang — đúng chỗ cần liền mạch nhất,
       vì hàng chip kia cố ý bị mép màn hình cắt dở để mời cuộn xuống.

       Từ 10 xuống 4 là lượt thu hẹp thứ hai. Lượt này không đứng một mình:
       phần lớn dải trống không nằm ở đây mà nằm TRONG hero — thiên hà cột
       phải cao hơn cột chữ nên `items-center` để lại quãng trống dưới hàng
       chip. Xem ghi chú `lg:-mb-16` ở `hero.tsx`. Ai muốn nới lại chỗ này
       thì phải đo cả hai chỗ, sửa một mình `mt` không đổi được gì nhiều.

       Các mục sau vẫn dùng `section-gap`; chỉ mục đứng ngay dưới hero là
       ngoại lệ. */
    <section className="container-page mt-4">
      <div className="max-w-3xl">
        {/* Nhãn phân loại trên tiêu đề: ba từ nói ngay đây là loại nội dung
            KHÁC với danh sách bài viết bên dưới. Cỡ chữ nhỏ và giãn ký tự rộng
            để nó đọc ra như một nhãn chứ không như một dòng chữ bị lạc. */}
        <p className="mb-2 text-xs font-medium tracking-[0.18em] text-primary-strong uppercase">
          {t("eyebrow")}
        </p>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <StaggerGroup className="mt-8 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12">
        {CARDS.map((card) => (
          <StaggerItem
            key={card.id}
            className={cn(
              card.feature
                ? "sm:col-span-2 lg:row-span-2 xl:col-span-8"
                : card.besideFeature
                  ? "xl:col-span-4"
                  : "xl:col-span-3",
            )}
          >
            <CardLink
              card={card}
              /* Quầng sáng xanh khi rê chuột, thay cho `shadow-2xl` đen.

                 Bóng đen trên nền tối gần như không thấy, nên card cũ nâng lên
                 mà không có gì đi kèm. Quầng xanh accent thì tách khỏi nền và
                 nói "cái này bấm được".

                 `-translate-y-1.5` = 6px. KHÔNG nâng cao hơn: transform trên
                 thẻ cha tạo containing block cho mọi con `position: fixed` —
                 đúng cái đã làm hỏng nút toàn màn hình của Aladin hồi trước.
                 Ở đây an toàn vì card chỉ chứa ảnh và chữ, nhưng ai thêm một
                 lớp phủ `fixed` vào trong card thì phải đọc lại chỗ này. */
              className={cn(
                "group relative flex h-full min-h-[15rem] flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-[#05070f] p-5 transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:border-white/30 hover:shadow-[0_20px_55px_-18px_rgba(56,189,248,0.45)] focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none sm:min-h-[17rem]",
                card.feature && "lg:min-h-[35rem]",
              )}
            >
              {/* Ảnh sáng hơn hẳn: opacity 55% → 72%, cộng `brightness-110`.

                  Ở mức cũ, bốn trong sáu ảnh tối tới mức phải đọc tiêu đề mới
                  biết card nói về cái gì — trong khi cả điểm của một khối ảnh
                  lớn là nhận ra chủ thể trước khi đọc. Chữ vẫn đọc được vì lớp
                  phủ dọc bên dưới giữ nguyên độ đặc ở ĐÁY, nơi có chữ; chỉ
                  phần trên của card sáng lên. */}
              <AssetImage
                src={card.image}
                alt=""
                sizes={
                  card.feature
                    ? "(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
                    : card.besideFeature
                      ? "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      : "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                }
                className={cn(
                  "object-cover brightness-110 transition-[transform,opacity] duration-300 ease-out group-hover:scale-[1.05]",
                  card.lightScrim
                    ? "opacity-90 group-hover:opacity-100"
                    : "opacity-[0.72] group-hover:opacity-90",
                )}
                style={card.imagePosition ? { objectPosition: card.imagePosition } : undefined}
              />

              {/* Hai lớp phủ chồng nhau: một lớp dọc cho chữ ở đáy luôn đọc
                  được bất kể ảnh sáng tối thế nào, một lớp màu nhận dạng rất
                  nhạt để sáu card không thành sáu ô xám giống nhau.

                  Lớp dọc giữ `from-[#05070f]` đặc ở đáy — đó là thứ bảo đảm
                  tương phản chữ, và nó KHÔNG được nới. Phần nới là khúc giữa
                  và trên: /75 → /55 và /15 → /0, để chủ thể trong ảnh lộ ra.

                  `lightScrim` dời điểm giữa xuống thấp hơn và hết phủ sớm hơn:
                  nửa trên gần như trong, đáy đặc y hệt — chữ không mất tương
                  phản, chỉ mô hình phía trên hiện rõ. */}
              <div
                aria-hidden
                className={cn(
                  "absolute inset-0 bg-gradient-to-t from-[#05070f] via-[#05070f]/55 to-transparent",
                  card.lightScrim && "from-15% via-45% to-80%",
                )}
              />
              <div
                aria-hidden
                className="absolute inset-0 opacity-25 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-40"
                style={{
                  background: `radial-gradient(120% 90% at 20% 0%, ${card.accent}, transparent 70%)`,
                }}
              />

              {/* Nhãn "Bắt đầu từ đây", chỉ trên thẻ chủ lực.

                  Sáu thẻ công cụ đều bấm được và đều hấp dẫn như nhau, nên
                  người vào lần đầu không có gợi ý nào về chỗ bắt đầu — và khi
                  mọi lựa chọn ngang nhau thì lựa chọn tốn sức nhất là lựa chọn
                  đầu tiên. Một nhãn trên ĐÚNG MỘT thẻ biến sáu ngả rẽ thành
                  một con đường có điểm vào.

                  Góc trên PHẢI vì cả khối chữ của thẻ nằm ở đáy trái; đặt cùng
                  bên là chồng lên tiêu đề. Màu vàng thương hiệu chứ không phải
                  màu accent của thẻ: nhãn này nói về thứ tự đọc, không nói về
                  nội dung thẻ.

                  `z-10` vì hai lớp phủ gradient phía trên đều `absolute
                  inset-0`; thiếu nó thì nhãn nằm dưới chúng và mờ đi. */}
              {card.feature && (
                <span className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-primary/45 bg-primary/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-primary backdrop-blur-md">
                  <Sparkles className="size-3" aria-hidden />
                  {t("startHere")}
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
                  {card.icon ? <card.icon className="size-5 text-white/90" /> : card.emoji}
                </span>

                <h3 className="mt-3 font-display text-xl font-bold text-white">
                  {t(`cards.${card.id}.title`)}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/70">
                  {t(`cards.${card.id}.body`)}
                </p>

                {/* Dòng dữ liệu: hai mẩu, đều là sự thật KIỂM ĐƯỢC về chính mô
                    hình đó — 8 hành tinh, 4 nhánh xoắn — chứ
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
                      {t(`cards.${card.id}.${key}`, {
                        count: SKY_MAP_DESTINATIONS,
                        pieces: PIECE_COUNT,
                        systems: SYSTEM_IDS.length,
                      })}
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
            </CardLink>
          </StaggerItem>
        ))}
      </StaggerGroup>

      {/* Chỉ ảnh CC BY mới cần dòng này — xem "Ghi nguồn ảnh" ở đầu tệp. */}
      {CARDS.some((card) => card.credit) && (
        <p className="mt-3 text-xs text-muted-foreground">
          {CARDS.filter((card) => card.credit)
            .map((card) => `${t("credit")} — ${t(`cards.${card.id}.title`)}: ${card.credit}`)
            .join(" · ")}
        </p>
      )}

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
