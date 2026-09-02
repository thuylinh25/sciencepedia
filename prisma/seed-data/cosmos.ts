import type { SeedArticle, SeedCategory, SeedTag } from "./types";
import { spinArticles } from "./cosmos-spin";

/**
 * Nhánh VŨ TRỤ — được dựng trước theo yêu cầu.
 * Slug của các bài hành tinh phải khớp với `articleSlug` trong src/lib/solar-data.ts,
 * vì bảng thông tin trong mô hình 3D liên kết thẳng tới đây.
 */

export const cosmosCategories: SeedCategory[] = [
  {
    slug: "vu-tru",
    name: "Vũ trụ",
    nameEn: "Cosmos",
    description:
      "Từ Mặt Trời ngay cạnh chúng ta tới những thiên hà cách xa hàng tỉ năm ánh sáng — mọi thứ về không gian, thiên văn học và hành trình con người vươn ra ngoài Trái Đất.",
    descriptionEn:
      "From the Sun next door to galaxies billions of light-years away — space, astronomy, and humanity's journey beyond Earth.",
    icon: "Telescope",
    color: "#4f46e5",
    order: 1,
  },
  {
    slug: "he-mat-troi",
    name: "Hệ Mặt Trời",
    nameEn: "The Solar System",
    description:
      "Mặt Trời, tám hành tinh, các vệ tinh, tiểu hành tinh và sao chổi cùng chuyển động trong một hệ đã tồn tại 4,6 tỉ năm.",
    descriptionEn:
      "The Sun, eight planets, moons, asteroids and comets moving together in a system 4.6 billion years old.",
    icon: "Orbit",
    color: "#f59e0b",
    order: 1,
    parentSlug: "vu-tru",
  },
  {
    slug: "sao-va-thien-ha",
    name: "Sao và Thiên hà",
    nameEn: "Stars and Galaxies",
    description:
      "Vòng đời của các ngôi sao, hố đen, tinh vân và cấu trúc lớn của vũ trụ.",
    descriptionEn:
      "Stellar life cycles, black holes, nebulae and the large-scale structure of the universe.",
    icon: "Sparkles",
    color: "#8b5cf6",
    order: 2,
    parentSlug: "vu-tru",
  },
  {
    slug: "kham-pha-khong-gian",
    name: "Khám phá không gian",
    nameEn: "Space Exploration",
    description:
      "Tàu vũ trụ, kính thiên văn và những sứ mệnh đã thay đổi hiểu biết của chúng ta.",
    descriptionEn:
      "Spacecraft, telescopes and the missions that reshaped what we know.",
    icon: "Rocket",
    color: "#0ea5e9",
    order: 3,
    parentSlug: "vu-tru",
  },
  {
    slug: "vu-tru-hoc",
    name: "Vũ trụ học",
    nameEn: "Cosmology",
    description:
      "Vũ trụ như một tổng thể: Big Bang, giãn nở, vật chất tối và năng lượng tối, các lực cơ bản và những hạt dựng nên mọi thứ.",
    descriptionEn:
      "The universe as a whole: the Big Bang, expansion, dark matter and dark energy, the fundamental forces and the particles behind everything.",
    icon: "Atom",
    color: "#6366f1",
    order: 4,
    parentSlug: "vu-tru",
  },
  {
    slug: "quan-sat-bau-troi",
    name: "Quan sát bầu trời",
    nameEn: "Observing the Sky",
    description:
      "Thiên cầu, các chòm sao, chuyển động biểu kiến của Mặt Trời và hành tinh, cùng dụng cụ để tự quan sát chúng.",
    descriptionEn:
      "The celestial sphere, the constellations, the apparent motion of the Sun and planets, and the instruments for watching them yourself.",
    icon: "Telescope",
    color: "#14b8a6",
    order: 5,
    parentSlug: "vu-tru",
  },
  {
    slug: "lich-su-thien-van",
    name: "Lịch sử thiên văn",
    nameEn: "History of Astronomy",
    description:
      "Từ lịch pháp cổ đại và thiên văn phương Đông tới những bước ngoặt đã dựng nên thiên văn học hiện đại.",
    descriptionEn:
      "From ancient calendars and Eastern astronomy to the turning points that built the modern science.",
    icon: "ScrollText",
    color: "#a16207",
    order: 6,
    parentSlug: "vu-tru",
  },
];

export const cosmosTags: SeedTag[] = [
  { slug: "hanh-tinh", name: "Hành tinh", nameEn: "Planets", color: "#f59e0b" },
  { slug: "mat-troi", name: "Mặt Trời", nameEn: "The Sun", color: "#f97316" },
  { slug: "ho-den", name: "Hố đen", nameEn: "Black holes", color: "#6366f1" },
  { slug: "thien-van", name: "Thiên văn học", nameEn: "Astronomy", color: "#8b5cf6" },
  { slug: "nasa", name: "NASA", nameEn: "NASA", color: "#0b3d91" },
  { slug: "vat-ly", name: "Vật lý", nameEn: "Physics", color: "#0ea5e9" },
  { slug: "ngoi-sao", name: "Ngôi sao", nameEn: "Stars", color: "#eab308" },
  { slug: "chom-sao", name: "Chòm sao", nameEn: "Constellations", color: "#14b8a6" },
  { slug: "quan-sat", name: "Quan sát", nameEn: "Observing", color: "#22c55e" },
  { slug: "vu-tru-hoc", name: "Vũ trụ học", nameEn: "Cosmology", color: "#6366f1" },
];

// ------------------------------------------------------------------ Bài viết

const sun: SeedArticle = {
  slug: "mat-troi",
  title: "Mặt Trời: lò phản ứng giữ cả hệ hành tinh",
  titleEn: "The Sun: the reactor that holds a system together",
  summary:
    "Mặt Trời chiếm 99,86% khối lượng Hệ Mặt Trời và mỗi giây biến 600 triệu tấn hydro thành heli. Toàn bộ ánh sáng, thời tiết và sự sống trên Trái Đất đều bắt nguồn từ đó.",
  summaryEn:
    "The Sun holds 99.86% of the Solar System's mass and fuses 600 million tonnes of hydrogen every second. All light, weather and life on Earth trace back to it.",
  categorySlug: "he-mat-troi",
  tagSlugs: ["mat-troi", "thien-van", "vat-ly"],
  featured: true,
  seoKeywords: "mặt trời, hợp hạch, nhật hoa, gió mặt trời, vết đen mặt trời",
  content: `Mặt Trời là một ngôi sao lùn vàng loại G, tuổi khoảng 4,6 tỉ năm và đang ở khoảng giữa vòng đời của nó. Với đường kính 1,39 triệu km, nó đủ chỗ để chứa 1,3 triệu Trái Đất.

## Năng lượng đến từ đâu

Ở lõi Mặt Trời, nhiệt độ đạt khoảng 15 triệu °C và áp suất lớn tới mức các hạt nhân hydro vượt qua được lực đẩy tĩnh điện để hợp nhất thành heli. Chuỗi phản ứng proton–proton này chuyển khoảng 4 triệu tấn vật chất thành năng lượng mỗi giây, theo đúng quan hệ E = mc².

Điều đáng chú ý là năng lượng ấy không thoát ra ngay. Một photon sinh ra ở lõi phải mất hàng chục nghìn đến hàng trăm nghìn năm để len qua vùng bức xạ dày đặc trước khi tới bề mặt. Ánh sáng bạn thấy hôm nay đã bắt đầu hành trình từ rất lâu trước khi loài người xuất hiện.

## Cấu trúc theo lớp

| Lớp | Nhiệt độ | Đặc điểm |
|---|---|---|
| Lõi | ~15.000.000 °C | Nơi diễn ra hợp hạch |
| Vùng bức xạ | 7.000.000 – 2.000.000 °C | Năng lượng truyền bằng photon |
| Vùng đối lưu | ~2.000.000 – 5.500 °C | Plasma sôi trào như nước đun |
| Quang quyển | ~5.500 °C | Bề mặt nhìn thấy được |
| Sắc quyển | 4.500 – 20.000 °C | Lớp mỏng màu đỏ hồng |
| Nhật hoa | 1.000.000 – 3.000.000 °C | Vành sáng ngoài cùng |

Một nghịch lý lâu đời của vật lý mặt trời nằm ở hai dòng cuối bảng: nhật hoa nóng gấp vài trăm lần bề mặt ngay bên dưới nó. Các sứ mệnh như Parker Solar Probe được thiết kế riêng để tìm lời giải, và bằng chứng hiện nay nghiêng về việc các sóng từ và những vụ tái kết nối từ trường quy mô nhỏ liên tục bơm năng lượng lên phía trên.

## Chu kỳ 11 năm

Từ trường Mặt Trời đảo cực khoảng 11 năm một lần. Ở đỉnh chu kỳ, số vết đen tăng vọt, các vụ bùng phát (solar flare) và phóng khối lượng vành nhật hoa (CME) diễn ra thường xuyên hơn.

Khi một CME hướng về phía Trái Đất, hạt tích điện tương tác với từ quyển và tạo ra cực quang. Ở mức mạnh, chúng có thể gây nhiễu vệ tinh, tín hiệu GPS và thậm chí làm quá tải lưới điện — như sự kiện Québec năm 1989 khiến 6 triệu người mất điện trong 9 giờ.

## Tương lai

Trong khoảng 5 tỉ năm nữa, hydro ở lõi cạn kiệt. Mặt Trời sẽ phồng lên thành sao khổng lồ đỏ, nuốt chửng Sao Thuỷ và Sao Kim, rồi trút bỏ các lớp ngoài thành tinh vân hành tinh, để lại một sao lùn trắng nguội dần.

> Mặt Trời không vĩnh cửu — nó chỉ đủ ổn định trong một khoảng thời gian đủ dài để sinh quyển phức tạp kịp hình thành.`,
  contentEn: `The Sun is a G-type yellow dwarf star, about 4.6 billion years old and roughly halfway through its life. At 1.39 million km across, it could hold 1.3 million Earths.

## Where the energy comes from

In the core, temperatures reach about 15 million °C and pressure is high enough for hydrogen nuclei to overcome electrostatic repulsion and fuse into helium. This proton-proton chain converts roughly 4 million tonnes of matter into energy every second, exactly as E = mc² describes.

That energy does not escape immediately. A photon born in the core takes tens to hundreds of thousands of years to work its way out through the dense radiative zone. The light you see today began its journey long before humans existed.

## A layered structure

| Layer | Temperature | Character |
|---|---|---|
| Core | ~15,000,000 °C | Where fusion happens |
| Radiative zone | 7,000,000 - 2,000,000 °C | Energy carried by photons |
| Convective zone | ~2,000,000 - 5,500 °C | Plasma boiling like heated water |
| Photosphere | ~5,500 °C | The visible surface |
| Chromosphere | 4,500 - 20,000 °C | A thin reddish layer |
| Corona | 1,000,000 - 3,000,000 °C | The outermost halo |

A long-standing puzzle sits in the last two rows: the corona is hundreds of times hotter than the surface below it. Missions such as Parker Solar Probe were built to find out why, and current evidence favours magnetic waves plus countless small-scale reconnection events pumping energy upward.

## The 11-year cycle

The Sun's magnetic field flips roughly every 11 years. At solar maximum, sunspot numbers surge and flares and coronal mass ejections become frequent.

When a CME is aimed at Earth, charged particles interact with the magnetosphere and produce aurorae. Strong events can disrupt satellites and GPS and even overload power grids - as in Québec in 1989, when six million people lost power for nine hours.

## The future

In about five billion years the core will run out of hydrogen. The Sun will swell into a red giant, swallowing Mercury and Venus, then shed its outer layers as a planetary nebula, leaving a slowly cooling white dwarf behind.`,
  sources: [
    {
      title: "Sun Fact Sheet",
      url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html",
      publisher: "NASA NSSDC",
      year: 2024,
    },
    {
      title: "Parker Solar Probe Mission Overview",
      url: "https://science.nasa.gov/mission/parker-solar-probe/",
      publisher: "NASA",
      year: 2024,
    },
    {
      title: "Solar Dynamics Observatory",
      url: "https://science.nasa.gov/mission/sdo/",
      publisher: "NASA",
      year: 2024,
    },
    {
      title: "Solar Orbiter",
      url: "https://www.esa.int/Science_Exploration/Space_Science/Solar_Orbiter",
      publisher: "ESA",
      year: 2024,
    },
    {
      title: "Geomagnetic Storms",
      url: "https://www.swpc.noaa.gov/phenomena/geomagnetic-storms",
      publisher: "NOAA Space Weather Prediction Center",
      year: 2024,
    },
    {
      title: "The Sun",
      url: "https://science.nasa.gov/sun/",
      publisher: "NASA Science",
      year: 2024,
    },
  ],
};

/** Nội dung riêng cho từng hành tinh, ghép với phần số liệu sinh tự động. */
const planetBodies: Record<
  string,
  { title: string; titleEn: string; summary: string; summaryEn: string; body: string }
> = {
  "sao-thuy": {
    title: "Sao Thuỷ: thế giới đá bị nung và đóng băng cùng lúc",
    titleEn: "Mercury: a rock baked and frozen at once",
    summary:
      "Hành tinh nhỏ nhất và gần Mặt Trời nhất, nơi một ngày dài hơn một năm và chênh lệch nhiệt độ giữa ngày và đêm lên tới 600°C.",
    summaryEn:
      "The smallest planet and the closest to the Sun, where a day outlasts a year and the day-night temperature gap reaches 600°C.",
    body: `## Một ngày dài hơn một năm

Sao Thuỷ quay quanh trục rất chậm: một vòng tự quay mất 58,6 ngày Trái Đất, trong khi một vòng quanh Mặt Trời chỉ mất 88 ngày. Kết quả là một ngày mặt trời trên Sao Thuỷ — từ trưa này tới trưa kế tiếp — kéo dài 176 ngày Trái Đất, tức gấp đôi một năm của chính nó.

Đây là hệ quả của cộng hưởng quỹ đạo–tự quay 3:2, một trạng thái ổn định do lực thuỷ triều từ Mặt Trời tạo ra.

## Không khí gần như không tồn tại

Sao Thuỷ chỉ có một lớp "ngoại quyển" cực loãng gồm nguyên tử bị gió mặt trời và va chạm thiên thạch bứt khỏi bề mặt. Không có khí quyển nghĩa là không có gì giữ nhiệt: phía ban ngày lên tới 430°C, phía ban đêm rơi xuống -180°C.

Nghịch lý thú vị: dù ở sát Mặt Trời, các hố va chạm gần cực Sao Thuỷ không bao giờ nhận ánh sáng trực tiếp và radar đã phát hiện băng nước tồn tại vĩnh viễn trong đó.

## Lõi sắt khổng lồ

Khoảng 85% bán kính Sao Thuỷ là lõi kim loại — tỉ lệ lớn bất thường. Giả thuyết được ủng hộ nhiều nhất cho rằng một va chạm khổng lồ thời sơ khai đã bóc đi phần lớn lớp phủ đá, để lại một hành tinh gần như toàn lõi.`,
  },
  "sao-kim": {
    title: "Sao Kim: bài học về hiệu ứng nhà kính mất kiểm soát",
    titleEn: "Venus: a lesson in runaway greenhouse",
    summary:
      "Cùng kích thước với Trái Đất nhưng bề mặt nóng 464°C và áp suất gấp 92 lần — Sao Kim cho thấy khí hậu có thể trượt tới đâu.",
    summaryEn:
      "Earth's twin in size, yet 464°C at the surface under 92 times our pressure - Venus shows how far a climate can slide.",
    body: `## Người chị em sinh đôi đã đi chệch hướng

Sao Kim có bán kính chỉ nhỏ hơn Trái Đất 5% và khối lượng bằng 82%. Nếu chỉ nhìn hai con số đó, ta sẽ đoán hai hành tinh giống nhau. Thực tế thì ngược lại hoàn toàn.

Khí quyển Sao Kim gồm 96% CO₂, dày đến mức áp suất bề mặt tương đương khi lặn sâu 900 mét dưới đại dương Trái Đất. Lớp mây axit sulfuric phản xạ 75% ánh sáng tới, khiến Sao Kim là vật thể sáng thứ ba trên bầu trời sau Mặt Trời và Mặt Trăng.

## Hiệu ứng nhà kính mất kiểm soát

Ánh sáng xuyên qua mây, làm nóng bề mặt, nhưng bức xạ hồng ngoại phát ra lại bị CO₂ giữ lại. Nhiệt độ tăng, nước bốc hơi, hơi nước lại là khí nhà kính mạnh — vòng lặp tự khuếch đại này đã đẩy nhiệt độ tới 464°C, đủ nóng để nung chảy chì, và đồng đều từ xích đạo tới cực.

## Quay ngược và cực chậm

Sao Kim tự quay theo chiều ngược lại so với hầu hết hành tinh khác, và chậm tới mức một ngày dài 243 ngày Trái Đất — dài hơn năm của nó (225 ngày). Nguyên nhân vẫn đang tranh luận, giữa giả thuyết va chạm lớn và giả thuyết thuỷ triều khí quyển.

## Vì sao vẫn đáng nghiên cứu

Ở độ cao 50–60 km, nhiệt độ và áp suất trong khí quyển Sao Kim gần với điều kiện bề mặt Trái Đất. Các sứ mệnh sắp tới như DAVINCI và VERITAS của NASA sẽ khảo sát chính vùng này cùng lịch sử nước của hành tinh.`,
  },
  "trai-dat": {
    title: "Trái Đất: hành tinh duy nhất ta biết có sự sống",
    titleEn: "Earth: the only living world we know",
    summary:
      "Nước lỏng, khí quyển giàu oxy, từ quyển che chắn và kiến tạo mảng — bốn điều kiện hiếm gặp cùng lúc trên một hành tinh.",
    summaryEn:
      "Liquid water, an oxygen-rich atmosphere, a protective magnetosphere and plate tectonics - four rare conditions on one world.",
    body: `## Vị trí vừa đủ

Trái Đất nằm trong "vùng ở được" của Mặt Trời — khoảng cách cho phép nước tồn tại ở thể lỏng trên bề mặt. Nhưng vị trí chỉ là điều kiện cần. Sao Kim và Sao Hoả cũng từng có nước lỏng, và cả hai đều đã mất.

## Bốn hệ thống giữ cho hành tinh sống được

**Từ quyển.** Lõi sắt lỏng chuyển động tạo ra hiệu ứng dynamo, sinh từ trường bao quanh hành tinh. Từ trường này bẻ hướng gió mặt trời, ngăn nó thổi bay dần khí quyển — điều đã xảy ra với Sao Hoả sau khi lõi nguội đi.

**Khí quyển.** 78% nitơ, 21% oxy. Oxy tự do là sản phẩm của quang hợp, không phải điều kiện ban đầu: bầu khí quyển nguyên thuỷ hầu như không có oxy cho tới Sự kiện Oxy hoá Lớn khoảng 2,4 tỉ năm trước.

**Kiến tạo mảng.** Lớp vỏ chia thành các mảng trượt trên lớp phủ. Quá trình này tái chế carbon giữa đá, đại dương và khí quyển — một bộ điều nhiệt dài hạn giữ khí hậu trong khoảng có thể sống được suốt hàng tỉ năm.

**Mặt Trăng.** Vệ tinh lớn bất thường so với hành tinh chủ, giúp ổn định độ nghiêng trục quay ở khoảng 23,4°. Nếu không có nó, độ nghiêng có thể dao động hỗn loạn và kéo theo biến động khí hậu cực đoan.

## Con số đáng nhớ

- Tuổi: 4,54 tỉ năm
- 71% bề mặt là nước, nhưng chỉ 2,5% trong đó là nước ngọt
- Sự sống xuất hiện sớm: bằng chứng hoá thạch có từ ít nhất 3,5 tỉ năm trước
- Trục nghiêng 23,4° tạo ra bốn mùa`,
  },
  "sao-hoa": {
    title: "Sao Hoả: hành tinh đỏ và câu hỏi về nước",
    titleEn: "Mars: the red planet and the water question",
    summary:
      "Từng có sông, hồ và có thể cả đại dương. Hiểu vì sao Sao Hoả mất nước là hiểu điều gì khiến một hành tinh ngừng sống được.",
    summaryEn:
      "It once had rivers, lakes and perhaps an ocean. Understanding how Mars lost its water is understanding how a world stops being habitable.",
    body: `## Vì sao đỏ

Bề mặt Sao Hoả phủ bụi giàu oxit sắt — về bản chất là gỉ sét. Lớp bụi mịn này bị gió thổi khắp hành tinh, tạo nên màu sắc đặc trưng nhìn thấy từ Trái Đất bằng mắt thường.

## Bằng chứng nước

Các tàu quỹ đạo và robot tự hành đã ghi nhận:

- Mạng lưới thung lũng và châu thổ cổ, rõ nhất ở hố Jezero nơi Perseverance đang hoạt động
- Khoáng vật chỉ hình thành khi có nước như đất sét và sulfat
- Băng nước lộ thiên ở hai cực và băng ngầm ở vĩ độ trung bình

Bức tranh hiện nay: khoảng 3,5–4 tỉ năm trước Sao Hoả ấm và ẩm hơn nhiều.

## Nước đã đi đâu

Sao Hoả nhỏ, nên lõi nguội nhanh và từ trường toàn cầu tắt từ sớm. Không còn lá chắn, gió mặt trời bào mòn khí quyển suốt hàng tỉ năm. Sứ mệnh MAVEN đo được quá trình mất khí này vẫn đang tiếp diễn ngày nay.

Áp suất giảm khiến nước lỏng không còn ổn định trên bề mặt: phần thoát vào không gian, phần đóng băng dưới đất.

## Địa hình cực đoan

- **Olympus Mons** — núi lửa cao 22 km, gần gấp ba đỉnh Everest
- **Valles Marineris** — hệ hẻm vực dài 4.000 km, sâu tới 7 km
- Hai vệ tinh nhỏ Phobos và Deimos, nhiều khả năng là tiểu hành tinh bị bắt giữ`,
  },
  "sao-moc": {
    title: "Sao Mộc: người khổng lồ khí và tấm khiên của hệ",
    titleEn: "Jupiter: the gas giant that shields the system",
    summary:
      "Khối lượng gấp 2,5 lần tất cả hành tinh còn lại cộng lại, với cơn bão Vết Đỏ Lớn đã tồn tại ít nhất 350 năm.",
    summaryEn:
      "More massive than every other planet combined times 2.5, with a Great Red Spot storm at least 350 years old.",
    body: `## Không có bề mặt để đứng

Sao Mộc chủ yếu là hydro và heli. Đi xuống từ đỉnh mây, áp suất tăng dần cho tới khi hydro chuyển thành trạng thái kim loại lỏng — dẫn điện và tạo ra từ trường mạnh nhất trong các hành tinh, gấp khoảng 20.000 lần Trái Đất.

Không có ranh giới rõ ràng giữa "khí quyển" và "bề mặt". Tàu thăm dò Galileo thả xuống năm 1995 ngừng hoạt động sau 58 phút, ở độ sâu chỉ khoảng 150 km.

## Vết Đỏ Lớn

Một xoáy nghịch rộng hơn Trái Đất, được quan sát liên tục từ thế kỷ 17. Gió ở rìa đạt khoảng 430 km/h. Đáng chú ý là nó đang co lại: từ khoảng 40.000 km chiều ngang vào cuối thế kỷ 19 xuống còn khoảng 14.000 km hiện nay.

## Hệ vệ tinh như một hệ hành tinh thu nhỏ

Bốn vệ tinh Galilei được Galileo Galilei phát hiện năm 1610 — quan sát đã trực tiếp bác bỏ mô hình địa tâm:

- **Io** — thiên thể có hoạt động núi lửa mạnh nhất Hệ Mặt Trời
- **Europa** — lớp vỏ băng phủ trên đại dương nước mặn, một trong những nơi đáng tìm kiếm sự sống nhất
- **Ganymede** — vệ tinh lớn nhất hệ, lớn hơn cả Sao Thuỷ, và là vệ tinh duy nhất có từ trường riêng
- **Callisto** — bề mặt cổ, dày đặc hố va chạm

## Vai trò trong hệ

Lực hấp dẫn của Sao Mộc định hình vành đai tiểu hành tinh và ảnh hưởng tới quỹ đạo sao chổi. Vai trò "tấm khiên bảo vệ Trái Đất" thường được nhắc tới, dù các mô phỏng gần đây cho thấy bức tranh phức tạp hơn: nó vừa chặn bớt, vừa đẩy một số thiên thể về phía trong.`,
  },
  "sao-tho": {
    title: "Sao Thổ: vành đai mỏng manh và vệ tinh có đại dương",
    titleEn: "Saturn: fragile rings and an ocean moon",
    summary:
      "Hệ vành đai rộng hàng trăm nghìn km nhưng có chỗ chỉ dày 10 mét, cùng Enceladus phun nước mặn vào không gian.",
    summaryEn:
      "Rings spanning hundreds of thousands of kilometres yet ten metres thick in places, plus Enceladus venting salty water into space.",
    body: `## Vành đai làm bằng gì

Vành đai Sao Thổ gồm hàng tỉ mảnh băng nước và đá, kích thước từ hạt bụi tới nhà cao tầng. Chúng trải rộng khoảng 280.000 km nhưng ở nhiều vùng chỉ dày chừng 10 mét — tỉ lệ tương đương một tờ giấy rộng bằng sân bóng đá.

Dữ liệu từ tàu Cassini cho thấy vành đai có thể còn khá trẻ, có lẽ chỉ 100–400 triệu năm tuổi, và đang dần rơi vào hành tinh dưới dạng "mưa vành đai".

## Hành tinh nhẹ hơn nước

Mật độ trung bình của Sao Thổ là 0,687 g/cm³ — thấp hơn nước. Nếu có một đại dương đủ lớn, Sao Thổ sẽ nổi.

## Enceladus và Titan

**Enceladus** chỉ rộng 500 km nhưng phun những cột hơi nước từ các khe nứt ở cực nam. Cassini bay xuyên qua các cột này và phát hiện muối, silica và phân tử hữu cơ — dấu hiệu của một đại dương nước lỏng tiếp xúc với đáy đá.

**Titan** là vệ tinh duy nhất trong hệ có khí quyển dày, chủ yếu là nitơ. Trên bề mặt có sông, hồ và biển — nhưng chứa methane và ethane lỏng ở -179°C, không phải nước. Sứ mệnh Dragonfly của NASA dự kiến đưa một thiết bị bay tới đây trong thập niên 2030.

## Cực bắc hình lục giác

Một dòng tia khí quyển ổn định tạo thành hình lục giác đều rộng khoảng 30.000 km quanh cực bắc. Cấu trúc này đã được quan sát từ thời Voyager và vẫn tồn tại — một hiện tượng chưa có ở bất kỳ hành tinh nào khác.`,
  },
  "sao-thien-vuong": {
    title: "Sao Thiên Vương: hành tinh lăn nghiêng trên quỹ đạo",
    titleEn: "Uranus: the planet that rolls on its side",
    summary:
      "Trục quay nghiêng 98° khiến mỗi cực trải qua 42 năm sáng liên tục rồi 42 năm tối liên tục.",
    summaryEn:
      "A 98° axial tilt gives each pole 42 years of continuous daylight followed by 42 years of night.",
    body: `## Nghiêng gần 98 độ

Hầu hết hành tinh quay như con quay, trục gần vuông góc với mặt phẳng quỹ đạo. Sao Thiên Vương thì nằm nghiêng gần như hoàn toàn. Giả thuyết phổ biến nhất là một hoặc vài va chạm với thiên thể cỡ hành tinh trong giai đoạn sơ khai đã lật nó.

Hệ quả là mùa cực đoan nhất trong Hệ Mặt Trời: mỗi cực có 42 năm Trái Đất được chiếu sáng liên tục, rồi 42 năm chìm trong bóng tối.

## Người khổng lồ băng

Sao Thiên Vương và Sao Hải Vương được xếp riêng là "người khổng lồ băng". Dưới lớp khí quyển hydro–heli là một lớp phủ đặc gồm nước, methane và amoniac ở trạng thái siêu tới hạn — thường gọi là "băng" theo nghĩa hoá học chứ không phải băng lạnh thông thường.

Methane trong khí quyển hấp thụ ánh sáng đỏ, để lại màu lam nhạt đặc trưng.

## Lạnh nhất hệ

Dù Sao Hải Vương xa Mặt Trời hơn, Sao Thiên Vương giữ kỷ lục nhiệt độ thấp nhất từng đo được trong khí quyển hành tinh: -224°C. Nguyên nhân có thể là hành tinh này gần như không toả thêm nhiệt từ bên trong, khác với các hành tinh khổng lồ còn lại.

## Chỉ một lần ghé thăm

Voyager 2 bay ngang năm 1986 và tới nay vẫn là tàu duy nhất từng tới. Phần lớn hiểu biết của chúng ta về hành tinh này đến từ vài giờ quan sát đó cộng với kính thiên văn.`,
  },
  "sao-hai-vuong": {
    title: "Sao Hải Vương: hành tinh tìm ra bằng toán học",
    titleEn: "Neptune: the planet found with mathematics",
    summary:
      "Được dự đoán bằng tính toán nhiễu loạn quỹ đạo trước khi ai kịp nhìn thấy, và là nơi có gió mạnh nhất Hệ Mặt Trời.",
    summaryEn:
      "Predicted from orbital perturbations before anyone saw it, and home to the fastest winds in the Solar System.",
    body: `## Phát hiện trên giấy

Đầu thế kỷ 19, các nhà thiên văn nhận thấy quỹ đạo Sao Thiên Vương lệch khỏi dự đoán. Urbain Le Verrier và John Couch Adams độc lập tính toán vị trí của một hành tinh chưa biết đang gây nhiễu loạn. Năm 1846, Johann Galle hướng kính về toạ độ Le Verrier đưa ra và tìm thấy Sao Hải Vương chỉ trong vòng một giờ, lệch chưa tới 1 độ.

Đây vẫn là một trong những minh chứng đẹp nhất cho sức mạnh dự đoán của cơ học thiên thể.

## Gió 2.100 km/h

Sao Hải Vương nhận lượng ánh sáng chỉ bằng 1/900 Trái Đất, vậy mà khí quyển của nó hoạt động dữ dội nhất hệ. Gió đạt tới khoảng 2.100 km/h — vượt xa tốc độ âm thanh trong khí quyển Trái Đất.

Nguồn năng lượng cho hoạt động này đến từ nhiệt bên trong: Sao Hải Vương phát ra năng lượng gấp khoảng 2,6 lần lượng nhận từ Mặt Trời.

## Vết Tối Lớn

Voyager 2 chụp được một xoáy bão tối rộng cỡ Trái Đất năm 1989. Khi Hubble quan sát lại vài năm sau, nó đã biến mất — và những vết tối mới xuất hiện ở nơi khác. Khác với Vết Đỏ Lớn bền bỉ của Sao Mộc, các cấu trúc bão trên Sao Hải Vương chỉ tồn tại vài năm.

## Triton

Vệ tinh lớn nhất của Sao Hải Vương quay ngược chiều tự quay của hành tinh — dấu hiệu rõ ràng rằng nó là một thiên thể vành đai Kuiper bị bắt giữ. Triton có hoạt động phun trào nitơ và đang dần xoắn vào trong; trong vài tỉ năm nữa nó sẽ bị lực thuỷ triều xé thành một hệ vành đai mới.`,
  },
};

function planetArticle(slug: string): SeedArticle {
  const data = planetBodies[slug];
  return {
    slug,
    title: data.title,
    titleEn: data.titleEn,
    summary: data.summary,
    summaryEn: data.summaryEn,
    content: data.body,
    categorySlug: "he-mat-troi",
    tagSlugs: ["hanh-tinh", "thien-van", "nasa"],
    featured: slug === "sao-hoa" || slug === "trai-dat",
    sources: [
      {
        title: "Planetary Fact Sheet",
        url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
        publisher: "NASA NSSDC",
        year: 2024,
      },
    ],
  };
}

const blackHole: SeedArticle = {
  slug: "ho-den",
  title: "Hố đen: nơi hình học của không gian sụp đổ",
  titleEn: "Black holes: where the geometry of space collapses",
  summary:
    "Không phải cái hút mọi thứ, mà là vùng không–thời gian cong tới mức không đường nào dẫn ra ngoài. Từ dự đoán lý thuyết tới bức ảnh đầu tiên năm 2019.",
  summaryEn:
    "Not cosmic vacuum cleaners but regions where spacetime curves so sharply no path leads out. From theory to the first image in 2019.",
  categorySlug: "sao-va-thien-ha",
  tagSlugs: ["ho-den", "thien-van", "vat-ly"],
  featured: true,
  seoKeywords: "hố đen, chân trời sự kiện, thuyết tương đối, Event Horizon Telescope",
  content: `Hố đen thường bị mô tả như một cái máy hút vũ trụ. Cách hiểu đó sai. Nếu thay Mặt Trời bằng một hố đen cùng khối lượng, quỹ đạo Trái Đất sẽ không đổi — chỉ là trời tối đi.

Điều đặc biệt của hố đen không nằm ở lực hút mà ở hình học: khối lượng bị nén vào một thể tích đủ nhỏ khiến độ cong không–thời gian vượt ngưỡng, và từ trong ranh giới đó, mọi đường đi khả dĩ của ánh sáng đều dẫn vào trong.

## Chân trời sự kiện

Ranh giới ấy gọi là chân trời sự kiện. Bán kính của nó — bán kính Schwarzschild — tỉ lệ thuận với khối lượng:

- Một hố đen khối lượng Mặt Trời: bán kính ~3 km
- Một hố đen khối lượng Trái Đất: bán kính ~9 mm
- Sagittarius A* ở tâm Ngân Hà (4,3 triệu khối lượng Mặt Trời): ~12,7 triệu km

Chân trời sự kiện không phải một bề mặt vật chất. Một người rơi qua nó sẽ không cảm nhận điều gì đặc biệt tại thời điểm vượt qua — nhưng từ đó trở đi, không tín hiệu nào của họ có thể quay ra.

## Ba loại

**Hố đen sao** (5–100 khối lượng Mặt Trời) hình thành khi lõi một ngôi sao nặng sụp đổ sau siêu tân tinh.

**Hố đen siêu khối lượng** (hàng triệu tới hàng tỉ khối lượng Mặt Trời) nằm ở tâm hầu hết các thiên hà lớn. Cơ chế hình thành vẫn là câu hỏi mở.

**Hố đen khối lượng trung gian** (100–100.000 khối lượng Mặt Trời) từ lâu chỉ là giả thuyết, đến nay đã có vài ứng viên được xác nhận qua sóng hấp dẫn.

## Cách chúng ta "nhìn thấy"

Bản thân hố đen không phát sáng. Ta quan sát chúng gián tiếp:

1. **Chuyển động của sao xung quanh.** Việc theo dõi quỹ đạo các ngôi sao quanh tâm Ngân Hà trong nhiều thập niên đã mang lại giải Nobel Vật lý 2020.
2. **Đĩa bồi tụ.** Vật chất rơi vào bị nén và nóng lên tới hàng triệu độ, phát tia X rực rỡ.
3. **Sóng hấp dẫn.** LIGO ghi nhận vụ sáp nhập hai hố đen lần đầu năm 2015 — xác nhận trực tiếp một dự đoán của Einstein từ 1916.
4. **Chụp ảnh trực tiếp.** Năm 2019, Event Horizon Telescope công bố ảnh bóng hố đen ở thiên hà M87, và năm 2022 là Sagittarius A*.

## Bức xạ Hawking

Năm 1974, Stephen Hawking chỉ ra rằng hiệu ứng lượng tử gần chân trời sự kiện khiến hố đen phát ra bức xạ nhiệt rất yếu và bốc hơi cực chậm. Với một hố đen khối lượng sao, thời gian bốc hơi hoàn toàn dài hơn tuổi vũ trụ hiện tại nhiều bậc — nên đây vẫn là tiên đoán lý thuyết chưa quan sát được.

> Hố đen là nơi thuyết tương đối rộng và cơ học lượng tử buộc phải gặp nhau, và cũng là nơi chúng mâu thuẫn rõ nhất.`,
  sources: [
    {
      title: "First Image of a Black Hole",
      url: "https://eventhorizontelescope.org/",
      publisher: "Event Horizon Telescope Collaboration",
      year: 2019,
    },
    {
      title: "Observation of Gravitational Waves from a Binary Black Hole Merger",
      publisher: "Physical Review Letters",
      year: 2016,
    },
  ],
};

const jwst: SeedArticle = {
  slug: "kinh-james-webb",
  title: "Kính James Webb: nhìn ngược về thuở vũ trụ sơ sinh",
  titleEn: "James Webb Space Telescope: looking back at the infant universe",
  summary:
    "Gương 6,5 mét hoạt động ở bước sóng hồng ngoại, đặt cách Trái Đất 1,5 triệu km để quan sát những thiên hà hình thành sớm nhất.",
  summaryEn:
    "A 6.5-metre infrared mirror parked 1.5 million km from Earth to observe the earliest galaxies.",
  categorySlug: "kham-pha-khong-gian",
  tagSlugs: ["nasa", "thien-van"],
  content: `Kính viễn vọng không gian James Webb (JWST) phóng ngày 25/12/2021 và bắt đầu gửi ảnh khoa học từ tháng 7/2022. Nó không thay thế Hubble mà bổ sung: Hubble mạnh ở ánh sáng khả kiến và tử ngoại, còn Webb được thiết kế cho hồng ngoại.

## Vì sao phải là hồng ngoại

Vũ trụ đang giãn nở, nên ánh sáng từ các thiên hà xa bị kéo dài bước sóng — dịch chuyển đỏ. Ánh sáng khả kiến phát ra từ những thiên hà đầu tiên, sau hơn 13 tỉ năm, đã dịch hẳn sang vùng hồng ngoại khi tới chỗ chúng ta.

Hồng ngoại cũng xuyên qua các đám mây bụi tốt hơn nhiều so với ánh sáng khả kiến, cho phép quan sát bên trong những vùng đang hình thành sao.

## Bài toán nhiệt

Thiết bị hồng ngoại phải cực lạnh, nếu không chính nhiệt của kính sẽ lấn át tín hiệu. Webb giải quyết bằng hai cách:

- **Tấm chắn nắng năm lớp** rộng cỡ sân tennis, hạ nhiệt từ khoảng 85°C ở mặt hướng Mặt Trời xuống -233°C ở mặt quan sát
- **Quỹ đạo quanh điểm Lagrange L2**, cách Trái Đất 1,5 triệu km, nơi Mặt Trời, Trái Đất và Mặt Trăng luôn nằm cùng một phía

Đánh đổi: ở khoảng cách đó, không có khả năng sửa chữa như từng làm với Hubble. Mọi thứ phải hoạt động đúng ngay lần đầu — bao gồm 344 điểm hỏng đơn lẻ trong quá trình triển khai.

## Gương phân đoạn

Không tên lửa nào chứa nổi một gương 6,5 m nguyên khối. Webb dùng 18 mảnh lục giác mạ vàng, gấp lại khi phóng rồi mở ra và căn chỉnh trong không gian với độ chính xác cỡ nanomet.

## Đã tìm thấy gì

- Những thiên hà hình thành chỉ 300 triệu năm sau Big Bang, sáng và trưởng thành hơn nhiều mô hình dự đoán
- Phân tích khí quyển ngoại hành tinh bằng quang phổ truyền qua, phát hiện CO₂, nước và methane
- Ảnh chi tiết chưa từng có về các "cột trụ sáng tạo" và vùng sinh sao`,
  sources: [
    {
      title: "Webb Space Telescope",
      url: "https://science.nasa.gov/mission/webb/",
      publisher: "NASA",
      year: 2024,
    },
  ],
};

export const cosmosArticles: SeedArticle[] = [
  sun,
  ...Object.keys(planetBodies).map(planetArticle),
  blackHole,
  jwst,
  ...spinArticles,
];
