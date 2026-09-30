# Kiến trúc

Ghi lại **vì sao** hệ thống được dựng như hiện tại. Cấu trúc code thì đọc code;
file này chỉ giữ những quyết định mà đọc code không suy ra được.

Cập nhật: 2026-09-02

---

## Truy cập dữ liệu

**Prisma, không phải Supabase client.** Supabase chỉ dùng cho Storage. Không viết
truy vấn bảng bằng `@supabase/supabase-js`.

`DATABASE_URL` trỏ Transaction pooler (6543), `DIRECT_URL` trỏ Direct connection
(5432). `prisma migrate deploy` cần `DIRECT_URL` — pooler không chạy migration được.

`SUPABASE_SERVICE_ROLE_KEY` chỉ được import trong module có `import "server-only"`.

---

## Rendering

**Static/ISR mặc định. Route nội dung không dùng SSR.** Thân bài, citation,
metadata phải có trong HTML đầu tiên — không fetch nội dung phía client.

**Server Component mặc định.** `'use client'` đặt ở lá, kèm comment lý do.

### Sửa dữ liệu thẳng trên Supabase thì trang không tự đổi

Trang bài đặt `revalidate = 300` và được prerender. Một `UPDATE` chạy tay
trong Supabase không đi qua code, nên Next không biết là đã có gì khác: bản
HTML cũ còn được phục vụ tới năm phút, và vì stale-while-revalidate, lượt truy
cập đầu tiên sau khi hết hạn **vẫn** nhận bản cũ — lượt sau mới thấy bản mới.

Ghi lại vì cái bẫy này đã tốn một lượt chẩn đoán: thêm `sketchfabModelId` vào
một bài, mở trang không thấy model 3D, và kết luận đầu tiên là code hỏng.

Muốn thấy ngay: `POST /api/revalidate` với `Authorization: Bearer $CRON_SECRET`
và body `{"slug":"..."}`. Route chỉ nhận slug rồi tự dựng đường dẫn cho từng
locale — nhận `path` thô là để người gọi quyết định cái gì bị xoá khỏi cache.
Dùng chung `CRON_SECRET` vì cùng một loại quyền (bắt máy chủ làm việc nặng
theo yêu cầu); thêm biến môi trường thứ hai chỉ tạo thêm một thứ để quên đặt.

### Build không cần database

Mọi `generateStaticParams` đều bọc `try/catch` trả `[]` khi truy vấn hỏng:

```ts
// src/app/[locale]/articles/[slug]/page.tsx
try {
  const slugs = await getPublishedSlugs();
  return slugs.slice(0, 50).map(({ slug }) => ({ slug }));
} catch (error) {
  console.warn("[build] bỏ qua prerender bài viết:", (error as Error).message);
  return [];
}
```

Hệ quả: `next build` chạy được với `DATABASE_URL` giả, chỉ prerender ít trang hơn.
Đã kiểm chứng 2026-09-02. Đừng "sửa" các khối try/catch này thành throw — chúng
là chủ ý, không phải nuốt lỗi cẩu thả.

---


### Hero trang chủ: hình vẽ, không phải WebGL

Chốt 2026-09-13, đảo lại quyết định trước đó.

Thiên hà ở hero từng là `GalaxyScene` — chính mô hình three.js của trang
/milky-way. Nay là một SVG tự vẽ (`hero-galaxy-art.tsx`), sinh toạ độ cánh xoắn
từ công thức `r = a·e^(bθ)` và quay bằng CSS.

Ba lý do, xếp theo thứ tự quan trọng:

1. **Vài trăm KB three.js rời khỏi vùng LCP của trang nhiều người mở nhất.** Ba
   lớp phòng vệ cũ (dynamic import, chỉ mount sau hydrate, `lowPower`) là cách
   sống chung với chi phí đó; bỏ hẳn thì không phải sống chung nữa.
2. **Hình có mặt trong HTML đầu tiên**, không còn quãng chờ hydrate mà người
   xem đọc ra là "ảnh chưa tải xong".
3. **Điều khiển được màu và độ sáng** mà không phải sửa cảnh đang dùng ở
   /milky-way — nơi màu là màu KHOA HỌC và không được chỉnh cho đẹp.

Mô hình 3D thật vẫn ở /milky-way, có đường dẫn từ hero và từ lưới "Khám phá
tương tác". Số ngẫu nhiên trong hình đi qua bộ sinh có hạt giống cố định:
`Math.random()` ở đây là một lỗi hydration trên chính khối chiếm phần lớn màn
hình đầu tiên.

---
## Đếm lượt đọc — vì sao đếm từ trình duyệt

Trang bài viết đặt `revalidate = 300` và được prerender sẵn, nên phần lớn lượt
truy cập được phục vụ thẳng từ cache. Server component không chạy lại, `after()`
cũng không chạy theo. Đếm trong server component cho ra **số lần trang được dựng
lại**, không phải lượt đọc — đo thực tế: sáu lượt truy cập liên tiếp, con số đứng
nguyên.

Luồng hiện tại:

```
view-counter.tsx (client, lá)
  → POST /api/articles/[id]/view
  → incrementViews()
```

Hai lớp chặn lạm dụng: chốt `sessionStorage` phía trình duyệt (F5 không cộng thêm)
và rate limit theo IP trong route. Bộ đếm rate limit nằm trong RAM, không phải
Postgres — thiệt hại tối đa nếu bị lạm dụng chỉ là con số hiển thị bị thổi, không
đáng một lệnh ghi DB mỗi request.

**Trạng thái dữ liệu 2026-09-02:** `views` = 0 trên toàn bộ bài. Không phải cơ chế
hỏng — project Vercel mới tạo ~24 giờ trước, chưa có lưu lượng. Đừng kết luận
"hệ thống không đo" khi thấy cột này rỗng.

---

## Knowledge graph

Schema đã có và **đã apply lên prod**: `Entity`, `Relationship`, enum `EntityType` /
`RelationType` (gồm `PREREQUISITE_OF`) / `FactCheckState`. `Article.entityId` nullable.

Query đã viết sẵn trong `src/server/queries.ts`: `getPrerequisites()`,
`getRelatedByGraph()`.

**Nhưng graph đang rỗng.** Đo 2026-09-02 bằng `npm run graph:check`:

```
Entity: 0 · Relationship: 0 · Article: 35 · Article có entity: 0/35
```

Không có seed, không có script nào ghi vào `Entity`. Hệ quả: mọi tính năng dựa vào
graph (learning path, related-by-graph, prerequisite) hiện không có dữ liệu để chạy.
Việc phải làm trước là để `knowledge-architect` gắn 35 bài vào graph — dựng UI trước
sẽ ra trang rỗng.

Kiểm lại bất cứ lúc nào: `npm run graph:check` (chỉ đọc, không có lệnh ghi).

---

## Thuật ngữ `[[...]]` — định nghĩa đi cùng HTML, chi tiết đi theo cú bấm

Bảng `GlossaryTerm` (migration `20260917090000_glossary_term`). Trong bài viết
`[[động lượng góc]]` hoặc `[[khoá|nhãn]]`; khoá là `slugify` vế trái, khớp `slug`
hoặc `aliases` (lưu dạng slug).

- **Định nghĩa ngắn tra trên server lúc render** (`getGlossaryForMarkdown`), đi
  vào trang ISR qua props. Tooltip không fetch — rê chuột tức thì, không request
  nào chạm DB theo lượt đọc. Cùng luật "không fetch nội dung phía client".
- **Chi tiết + bài liên quan fetch khi bấm** (`GET /api/glossary/[slug]`, `s-maxage=300`).
  Được phép vì cùng nội dung có bản server-render ở `/[locale]/glossary/[slug]`
  (`DefinedTerm`, có trong sitemap) — cũng là `href` thật của thuật ngữ, nên
  crawler và người không bật JS không gặp 404.
- **Modal là chunk riêng** (`next/dynamic`), hâm khi tooltip mở. Bài có hàng chục
  thuật ngữ mà không ai mở modal thì không tải Dialog.
- **Trigger là `<a>`, không phải `<button>`**: internal link cho SEO + đường lui
  không-JS. Style nằm ở `globals.css` chứ không bằng utility — typography tô `a`
  ngoài layer (xem mục đệm ô bảng ở đó).
- **Giải thích AI không bao giờ được lưu** (`POST .../explain`). Chữ mô hình sinh
  chưa qua science-editor; lưu rồi phát lại là đưa nội dung chưa thẩm định lên trang
  bằng cửa sau. Client chỉ gửi slug — định nghĩa đọc từ DB và neo vào prompt, để
  endpoint không thành proxy LLM tự do. Rate limit khoá riêng `glossary:*`.
- **Hai đường ghi, một bảng**: `/admin/glossary` (EDITOR; xoá đòi ADMIN) và
  `prisma/seed-data/glossary.json` + `glossary:seed`. File vẫn là bản có NGUỒN,
  nhưng seed KHÔNG còn quyền đè vô điều kiện: mục nào trong CSDL đã khác file
  thì `--write` giữ nguyên và in ra lệch ở trường nào, vì lệch gần như luôn có
  nghĩa là biên tập viên vừa sửa tay — đè lên là xoá công của họ mà không có
  một dòng lỗi nào. File thắng chỉ khi gõ thêm `--force`.
- **Slug và alias không được đụng nhau giữa các mục**: `[[khoá]]` trùng thì bài
  hiện định nghĩa nào là may rủi theo thứ tự truy vấn, nên action chặn lúc lưu
  và chỉ đích danh mục đang giữ khoá đó.
- **Khoá không có mục từ hiện như chữ thường**, không phải tooltip rỗng. Liệt kê
  khoá còn thiếu: `npm run glossary:check` (chỉ đọc).

---

## Bản đồ bầu trời — thư viện ngoài không được đè lên phần còn lại

`/space-map` nhúng Aladin Lite v3 của CDS (Strasbourg). Ba quyết định ở đây
đều xoay quanh một câu hỏi: làm sao một thư viện ~1 MB sống trong site mà
không bắt các route khác trả giá.

### Nạp từ CDN, không qua npm

Gói npm kéo WebAssembly vào bundle của chúng ta — nặng cài đặt, nặng build,
nặng tracing của Vercel, cho một tính năng nằm ở đúng một route. CDN thì byte
chỉ đi qua dây khi có người mở route đó.

Đổi lại: phụ thuộc máy chủ ngoài, và phải tự viết type (`src/types/aladin.ts`).
CDS sập thì khung bản đồ hiện thông báo lỗi kèm nút thử lại, phần chữ của
trang vẫn nguyên vì nó là HTML server-render.

URL ghim được qua `NEXT_PUBLIC_ALADIN_SCRIPT_URL`. Mặc định là kênh `latest`,
nên vài method của Aladin khai `?` trong type — CDS có đổi tên giữa các bản
v3, và optional buộc chỗ gọi phải kiểm tra thay vì ném lỗi làm chết cả khung.

### Hai lớp hoãn, không phải một

`next/dynamic({ ssr: false })` mới chỉ tách chunk; nó vẫn tải chunk ngay khi
component render. Lớp thứ hai nằm ở `AladinViewer`: chunk chỉ được yêu cầu khi
khung cuộn tới gần tầm nhìn (`activation="visible"`, trang bản đồ) hoặc khi
người đọc bấm (`activation="click"`, khối nhúng trong bài viết).

Trong bài viết mặc định là bấm, không phải cuộn: ở đó bản đồ là phần phụ dưới
thân bài, và tiêu 1 MB băng thông của người chỉ muốn đọc chữ là lấy của họ thứ
họ không xin. Ai bật `saveData` thì luôn phải tự bấm, kể cả trên trang bản đồ.

Chỉ có `aladin-canvas.tsx` chạm `window.A`. Import tĩnh file đó ở bất cứ đâu
ngoài lệnh `dynamic()` trong `aladin-viewer.tsx` là phá đúng thứ nó sinh ra để
bảo vệ.

### Route tĩnh hoàn toàn — kể cả deep link

`/space-map` không đọc `searchParams`. Đọc là mất bản tĩnh, trong khi trang
này không có một truy vấn CSDL nào để mà cần dynamic. `?object=` được đọc
trong effect sau khi mount: HTML server và lần render đầu ở client giống hệt
nhau (không hydration mismatch), deep link vẫn tới đúng thiên thể, và kịp
trước cả lúc Aladin nạp xong.

`SkyMap` là Client Component nhưng vẫn SSR: tên, chòm sao, mô tả, toạ độ đều
nằm trong HTML đầu tiên kèm JSON-LD `ItemList`. Thứ duy nhất bị hoãn là khung
WebGL, mà khung đó không chứa chữ nào để index.

### Toạ độ lưu dạng chuỗi

`SkyObject.ra` / `.dec` là TEXT, không phải số. Catalog công bố toạ độ dạng
sexagesimal và biên tập viên chép nguyên chuỗi từ SIMBAD sang, nên cái nằm
trong CSDL đúng bằng cái đọc được ở nguồn — không có bước làm tròn chen vào
giữa, và đối chiếu lại là so chuỗi với chuỗi. Quy đổi sang độ nằm ở
`src/lib/sky-coords.ts`, một chỗ duy nhất.

`SkyObject` là bảng riêng chứ không phải bốn cột trên `Article`: cùng một
thiên thể xuất hiện trong nhiều bài, mà toạ độ thì chỉ có một bộ đúng. Nhân
bản nó ra từng bài là tạo sẵn chỗ cho hai bài nói hai toạ độ khác nhau về cùng
một vật.

Danh mục nằm ở cả hai nơi và điều đó là chủ ý: `sky-data.ts` phục vụ route
tĩnh, bảng `SkyObject` phục vụ khoá ngoại từ bài viết. `catalogId` là chỗ nối,
UNIQUE ở cả hai bên. Đồng bộ một chiều code → CSDL bằng `npm run sky:seed`;
không có chiều ngược lại, nên không có chuyện hai nguồn cùng tự nhận là đúng.

### Giải tên thiên thể

Ba đường, rẻ dần về sau: danh mục cứng (tức thì, biết tên tiếng Việt) → toạ độ
gõ tay (không cần mạng) → Sesame của CDS (mọi thứ còn lại trong SIMBAD).

Sesame gọi thẳng từ trình duyệt, không qua route của chúng ta: CDS trả
`Access-Control-Allow-Origin: *`, và bọc thêm một route handler thì mỗi lượt
tra cứu thành một lần chạy hàm serverless để chuyển tiếp 3 KB text. Nếu CDS
chặn origin hoặc đổi định dạng thì ô tìm kiếm rơi về danh mục cứng — vẫn dùng
được, không vỡ trang.

---

### Hành tinh không lấy ảnh từ survey bầu trời

Câu hỏi tự nhiên khi đã có Aladin: sao không lấy luôn ảnh hành tinh từ đó.
Không được, vì survey trong `SKY_SURVEYS` (DSS, 2MASS, WISE) chụp thiên cầu
theo RA/Dec cố định. Hành tinh chỉ đi ngang qua rồi bỏ đi, nên ảnh survey ở vị
trí hôm nay của Sao Hoả là ảnh đám sao nền phía sau nó. Chỗ nào hành tinh có
lọt vào khung thì nó cháy trắng — kính khảo sát phơi sáng cho vật thể mờ. Và
đường kính biểu kiến vài chục giây cung ở độ phân giải DSS chỉ ra vài chục
pixel.

Cũng vì thế hành tinh không nằm trong `SKY_TARGETS`: ghi một cặp RA/Dec cứng
cho Sao Hoả là ghi một điều sai ngay hôm sau. Vị trí thật đã có ở
`/solar-system`, lấy từ API Horizons của JPL, cache sáu giờ.

Thứ dùng được là HiPS **bề mặt** thiên thể của CDS (`alasky.cds.unistra.fr`,
khác máy chủ phát script) — hệ toạ độ gắn vào chính thiên thể, ảnh ghép từ tàu
thăm dò. Aladin Lite tự chuyển sang chế độ đó khi đọc thấy khoá `hips_body`
trong file properties, nên chỗ khởi tạo phải **thôi** ép `cooFrame: "ICRS"`;
đó là ý nghĩa của cờ `planetary` trên `SkyView`. CDS hiện có bề mặt cho Mặt
Trời, Sao Thuỷ, Sao Kim, Trái Đất, Sao Hoả, Sao Mộc, Sao Hải Vương — chưa có
Sao Thổ và Sao Thiên Vương, và hai thẻ đó chỉ có ảnh tĩnh.

### Ảnh tĩnh là lớp thứ nhất, không phải chỗ giữ chỗ

Thư viện ảnh Hệ Mặt Trời trên `/space-map` là Server Component thuần: ảnh chụp
thật từ NASA/ESA qua `next/image`, nằm trong HTML đầu tiên, không cần WebGL,
không cần JavaScript. Aladin chỉ chạy khi có người bấm — `activation="click"`
chứ không `"visible"`, vì lưới có chín thẻ và để chúng tự nạp khi cuộn tới thì
một lần cuộn hết trang là chín instance WebGL cùng sống.

Ảnh nào không phải ánh sáng nhìn thấy thì chú thích phải nói ra. Ảnh Mặt Trời
là cực tím, bề mặt Sao Kim là radar, bề mặt Sao Thuỷ là màu tăng cường — bày
chúng như màu mắt thấy là sai về khoa học, và người đọc không có cách nào tự
nhận ra. Đó là lý do `BodyPhoto`/`BodySurface` có trường `captionVi`/`captionEn`
bắt buộc chứ không để tuỳ chọn.

Ảnh bìa và bản đồ bề mặt của cùng một thiên thể phải là CÙNG bước sóng. Mặt
Trời từng vi phạm: bìa là một dải, bản đồ là 304 Å, nên bấm mở là mất hết
quầng sáng thấy trong ảnh và người xem tưởng bản đồ hỏng. Với Mặt Trời còn
thêm một điều phải nói trong chú thích mà hành tinh không cần: nó đổi bộ mặt
từng ngày, nên ảnh và bản đồ chụp khác ngày thì khác nhau là đúng.


### Toàn màn hình nuốt mất trang, nên bảng thông tin phải chở theo điều hướng

Ở toàn màn hình, khung Aladin là một lớp `position: fixed` phủ kín cửa sổ. Mọi
thứ nằm DƯỚI khung trên trang — tên thiên thể, toạ độ, bộ chọn khảo sát, chú
giải, danh sách thiên thể — biến mất đúng lúc người xem có nhiều chỗ nhất để
dùng chúng. Prop `fullscreenInfo` vì thế không phải chú thích: nó chở cả phần
điều hướng của trang.

**Đổi khảo sát KHÔNG được đi qua `goTo`.** `goTo` gọi kèm `setFoV` tính từ
`view.fovDeg` — mức phóng mặc định của mục tiêu, không phải mức người xem đang
dùng. Mà việc người ta làm với bộ chọn khảo sát là so sánh cùng một vùng trời
qua nhiều bước sóng: phóng sâu rồi bấm lần lượt DSS2 · 2MASS · AllWISE. Kéo về
khung rộng ban đầu mỗi lần bấm là giết chính phép so sánh đó. Khi chỉ có survey
đổi, `aladin-canvas` gọi thẳng `setSurvey`.

### Ba cái bẫy của nút toàn màn hình Aladin

CSS của Aladin đặt `.aladin-fullscreen` thành `position: fixed` phủ kín cửa sổ
nhưng **không đặt `z-index`**. Ba hệ quả, cả ba đều chỉ lộ ra khi khung bản đồ
nhỏ hơn màn hình — tức là ở lưới thẻ hành tinh, không phải ở trang bản đồ:

1. **Bị thẻ khác đè.** Không z-index thì lớp toàn màn hình xếp theo thứ tự DOM.
   `overflow: hidden` cũng không cứu được vì nó không cắt phần tử `fixed`.
   Khắc phục bằng một quy tắc `z-index` trong `globals.css` — và khung
   `AladinViewer` **không được** có `isolate`, vì stacking context riêng sẽ
   nhốt z-index đó lại bên trong thẻ.
2. **Đĩa hành tinh cụt hai cực.** `fov` của Aladin là bề RỘNG và bị chặn ở
   180° trong phép chiếu cầu. Khung 2:1 thì bề cao chỉ còn ~86°, trong khi đĩa
   rộng ~90°. Không con số fov nào cứu được, nên CSS ép khung toàn màn hình
   của bề mặt thiên thể về vuông (`.aladin-body-view`).
3. **Không có đường ra.** Aladin chỉ có nút thoát toàn màn hình, không có nút
   đóng bản đồ. Khung mở bằng một cú bấm thì phải đóng lại được bằng một cú
   bấm, nếu không thẻ đó giữ một instance WebGL sống mãi. Trạng thái toàn màn
   hình đọc bằng `MutationObserver` trên thuộc tính `class` của container —
   Aladin không phát sự kiện nào ra ngoài.

### Không có nền sao quanh quả cầu, và sẽ không có

Câu hỏi lặp lại: sao không rắc sao lên nền đen cho đẹp. Vì bản đồ bề mặt dùng
hệ toạ độ gắn vào chính thiên thể — kinh độ vĩ độ xoay theo quả cầu — còn sao
đứng yên trong hệ thiên cầu. Vẽ chồng hai hệ đó lên nhau là dán đám sao vào bề
mặt Trái Đất và bắt chúng quay cùng.

Nền đen là thứ duy nhất không nói dối, và cũng là thứ NASA dùng cho ảnh hành
tinh. Chốt 2026-09-10.


### Trang pháp lý phải công khai với máy

`/privacy` và `/terms` nằm ngoài mọi lớp bảo vệ, và điều đó là bắt buộc chứ
không tình cờ: Facebook App Review và màn hình chấp thuận OAuth của Google tự
truy cập hai URL này bằng máy, không mang theo phiên đăng nhập nào. `middleware`
chỉ làm định tuyến ngôn ngữ, nên đừng thêm bất kỳ điều kiện đăng nhập nào vào đó
mà không kiểm lại hai route này.

Chính sách bảo mật phải mô tả ĐÚNG hệ thống đang chạy, không mô tả hệ thống mong
muốn. Hiện chưa có nút tự xoá tài khoản, nên trang ghi đường xoá bằng email và
cam kết 30 ngày — đó cũng chính là "data deletion instructions" mà Facebook đòi.
Khi có nút tự xoá thì sửa lại trang; một chính sách hứa thứ sản phẩm không làm
được thì tệ hơn là không hứa.

Ngày cập nhật là hằng số viết tay, không sinh từ `new Date()`: dòng "cập nhật
lần cuối" nói rằng NỘI DUNG đã được xem lại vào ngày đó, chứ không phải rằng
trang vừa được deploy.

---

## Bản đồ cơ thể người — Human Atlas thành module, không thành app

`/[locale]/human-atlas` port từ Human Atlas (github.com/ashemag/human-atlas, MIT) —
không iframe, không deploy riêng. Dữ liệu là BodyParts3D 4.0 (CC BY 4.0); giấy phép và
ghi công chép nguyên văn ở `sciencepedia/licenses/human-atlas/`.

### three.js thuần, không viết lại bằng R3F

Repo có React Three Fiber, nhưng thứ làm atlas chạy nổi là cách vẽ của bản gốc: 2.234
mảnh gộp thành một lượt vẽ mỗi hệ mỗi khối, còn dịch/ẩn/tô sáng từng mảnh đi qua hai
texture trạng thái đọc trong vertex shader. Viết lại theo lối khai báo là đổi đúng phần
đã tối ưu lấy phần không cần. `anatomy-scene.tsx` giữ nguyên pipeline; chỉ đổi URL dữ
liệu, mã lỗi (chữ do giao diện dịch), nền theo theme và thêm `focus`.

### Dữ liệu trên R2, prefix có dấu vân — và bucket PHẢI có CORS

~33 MB nén mỗi lượt xem: phát từ Vercel là tính băng thông, R2 thì không. Khoá là
`human-atlas/<phiên bản>-<sha256>/…`, đệm `immutable` một năm; dữ liệu đổi thì chạy lại
`scripts/upload-human-atlas.ts` rồi sửa `HUMAN_ATLAS_DATA_VERSION` — tệp trước, hằng số sau.

Viewer đọc bằng `fetch()`, không phải `<img>`, nên cần CORS — thứ mà mọi ảnh của site chưa
từng cần. Luật GET/HEAD mọi origin được đặt trên bucket ngày 2026-09-28. Gỡ nó thì atlas
báo "Không thể tải mô hình 3D" trong khi ảnh vẫn hiện bình thường: kiểm header
`Access-Control-Allow-Origin` trước khi đọc code.

### Tên tiếng Việt: bảng duyệt tay trước, bảng ghép thuật ngữ sau

Mã FMA là định danh chung của khái niệm lẫn từng mảnh; mã nội bộ không bao giờ thay bằng
chữ. Hai lớp: `VI_NAMES` (`names-vi.ts`, ~100 mục duyệt tay, luôn thắng) rồi
`translateAnatomy()` (`terms-vi.ts`) — dịch ~1.400 cụm gốc một lần rồi ghép theo khuôn
"X of Y", left/right, số thứ tự, phủ đủ 3.432 tên. Ghép chứ không dịch từng tên: sửa một
cụm là đúng ở mọi tên chứa nó, và cụm nào thiếu thì trả tên gốc chứ không ghép dở.
Bảng ghép do AI dịch, CHƯA duyệt chuyên môn — cái giá là UI luôn hiện tên tiếng Anh ngay
dưới tên Việt, và phần ghi công nói rõ. Đừng bỏ dòng tên gốc "cho gọn".

### Camera khung theo hộp bao hệ đang bật, trong vùng không bị bảng che

Khoảng cách cố định (4 m) làm hệ nhỏ (tiêu hoá, tim) còn một góc khung. `fit()` lấy
Box3 các hệ đang bật, chiếu lên trục màn hình của camera, giải khoảng cách từ FOV sao
cho hộp vừa khung (tỉ lệ ở mục "Khung mặc định" bên dưới) — vùng trống đo từ DOM các bảng `data-atlas-avoid`, lệch
tâm thì bù bằng view offset. Chỉ khung lại khi tập hệ đổi, đặt lại, đổi góc nhìn,
resize — không khung lại khi chọn mảnh (lúc đó người đọc vừa tự zoom).

### Sửa phân loại hệ lúc nạp, không sửa tệp trên R2

`atlas.json` xếp 5 khoang não thất vào hệ Tim (khớp chữ "ventricle"). `correctSystems()`
(`anatomy.ts`) trả chúng về hệ thần kinh theo mã FMA. Không dựng lại dữ liệu trên R2:
tệp có dấu phiên bản, dựng lại là 33 MB tải lại cho mọi người.

### CTA "Đọc thêm" chỉ hiện khi bài còn PUBLISHED

`structure-links.ts` ghi FMA → slug; trang lọc qua CSDL lúc render (ISR). Slug nháp hay
đã đổi chỉ làm CTA biến mất, không dẫn vào 404. Không có bài thì không ghi, không viết bài
để lấp.

### Deep link đọc ở client, mở sẵn chế độ "xem riêng"

`?structure=` (slug tiếng Anh, slug tiếng Việt hoặc mã FMA) không đọc trong page —
`searchParams` ép route thành dynamic (cùng lý do `/solar-system`). Mở từ link thì cấu trúc
được tách riêng luôn: phần lớn cơ quan nằm sau lớp cơ, tô sáng mà không tách là tô sáng thứ
không ai thấy.

### Ba bố cục loại trừ nhau: `atlas-phone` / `atlas-short` / `atlas-wide`

Bảng nổi quanh mô hình cần biết cả bề ngang lẫn chiều cao: điện thoại xoay ngang rộng như
tablet nhưng thấp hơn điện thoại dựng. Ghép `md:` với biến thể chiều cao thì hai luật cùng
khớp và thứ tự sinh CSS quyết định bên thắng; ba biến thể không chồng nhau (`globals.css`)
thì không có câu hỏi đó. Thanh dưới trên điện thoại chừa 5rem bên phải cho nút trợ lý AI.

### Slider = bóc lớp rồi mới tách; da là lớp ngoài cùng, mặc định bật

BodyParts3D CÓ da: `FJ2810 Skin` (FMA7163) là một mesh liền toàn thân (~44.700 tam giác —
thô ở mặt và ngón tay, giới hạn của asset), kèm tóc, lông mày, môi, lông mu. Bản gốc tắt nó
và vẽ như kính 10%, nên slider 0% "Nguyên khối" lại cho thấy thẳng cơ. Nay `LAYERS` +
`SYSTEM_LAYER` + `layerOpacity()` (anatomy.ts): 0–20% da mờ dần, 20–45% cơ, 45–65% cơ mờ,
65–100% mới tách không gian (`peelToExplode`). Độ đậm đặt trên vật liệu của từng HỆ (đã có
sẵn một vật liệu mỗi hệ) — không nhân bản vật liệu. Chọn cấu trúc sâu thì lớp ngoài mờ 18%.
Mọi ngưỡng cũ của giao diện (khoá góc nhìn, tắt tự xoay) đọc qua `peelToExplode`, đừng đọc
thẳng `state.explode`.

### Audit phân loại hệ theo FMA, không theo tên (2026-09-29)

`SYSTEM_CORRECTIONS` (anatomy.ts) sửa lúc nạp, có lý do từng dòng. Căn cứ: chuỗi is-a FMA
trong cache OLS. Đã sửa: 8 "Hepatovenous segment" (nhu mô gan, trong chính khái niệm Gan) từ
tĩnh mạch sang tiêu hoá — chúng là "khối xanh" ở bụng trên; 3 mạc treo (phúc mạc) sang mô
liên kết — mạc treo ruột non 45k đỉnh phủ kín ~55 quai ruột non có sẵn.
Thêm 2026-09-29: 14 cơ (chày trước/sau, ba cơ mác, dưới vai, nâng vai) từ hệ xương sang hệ cơ;
dải chậu chày sang mô liên kết — nó là mạc (phần dày của mạc đùi), không phải cơ.

**Giới hạn của BodyParts3D 4.0, đừng tìm lỗi phân loại ở đây:**
- Thần kinh: 144/144 mảnh ở đầu — não + 20 dây thần kinh vùng ổ mắt. Không có thân tuỷ sống
  (chỉ 3,5 cm ống trung tâm ở nền sọ), dây thần kinh sống, đám rối, dây thần kinh chi.
- Tĩnh mạch: không có tĩnh mạch nội sọ/mặt; cao nhất là tĩnh mạch cảnh trong (1,46 m).
  Động mạch đầu thì có (151 mảnh).
- Bạch huyết: đúng 3 mảnh (lách + 2 thuỳ tuyến ức); không hạch, mạch, ống ngực nào.
- Tiêu hoá: không có đại tràng sigma riêng, ống hậu môn, niêm mạc hầu; manh tràng chỉ có
  "Ileocecal junction". Răng và lợi nằm trong hệ xương (đã ghi trong mô tả hệ).
Muốn đầy đủ hơn phải thêm asset hợp pháp khác, đăng ký cùng hệ toạ độ — không vẽ bù.

**Audit 2026-09-29 (`scripts/anatomy-audit.ts` — bảng mọi mảnh + tổ tiên FMA, chỉ đọc).**
So với các atlas thương mại, ba hệ trông "thiếu" là do DỮ LIỆU, không phải phân loại hay
rendering — đừng sửa camera/màu để bù:
- Bạch huyết: đúng 3 mảnh trong cả 2.234 (lách FJ2561, hai thuỳ tuyến ức FJ3150/FJ3151). Không
  mạch bạch huyết, hạch, ống ngực, bể dưỡng chấp, amiđan — tìm cả theo tên lẫn tổ tiên FMA.
- Thần kinh: 146 mảnh, mọi mảnh ở đầu (thấp nhất y = 1,54 m). Tuỷ sống chỉ có ống trung tâm
  3,5 cm; không rễ/dây thần kinh sống, đám rối, dây thần kinh chi. Dây sọ chỉ nhóm ổ mắt (II,
  III, IV, V1). Sửa được: hai đám rối mạch mạc từ "giác quan" về thần kinh.
- Tĩnh mạch: 395 (atlas.json gốc 404 — 9 "Hepatovenous segment" là nhu mô gan). Cao nhất là
  tĩnh mạch cảnh trong (1,46 m): không tĩnh mạch nội sọ, mặt, da đầu, xoang tĩnh mạch màng cứng.
  Mảnh lớn ở ngực là "Set of anterior intercostal veins" (FMA70839) — đúng là tĩnh mạch.

**Mạng bạch huyết UMCG (đã nhập 2026-09-29, CC BY-NC-SA 4.0 — Sciencepedia phi thương mại).**
`scripts/import-umcg-lymphatic.ts`: FBX (tải từ Sketchfab, cần đăng nhập; để trong `.cache`, không
commit) → chỉ giữ khối bạch huyết → căn toạ độ bằng ICP bộ xương UMCG ↔ bộ xương BodyParts3D (trung
vị 1,95 mm; kiểm chéo khí quản 0,93 mm, động mạch chủ 2,94 mm) → 19 nhóm theo loại (hạch/mạch, suy
từ hình dạng thành phần liên thông) × vùng → một khối trên R2 (`human-atlas/supplements/…`, có
LICENSE.txt) + manifest `supplements/umcg-lymphatic.json`. `withSupplements()` nối vào CÙNG danh mục
sau `correctSystems`, nên tìm/chọn/ẩn/góc nhìn chạy như mảnh gốc. Tệp gốc KHÔNG có tên hạch: tên là
tên vùng, mã FMA là khái niệm chung (FMA5034, FMA30315). Bỏ 235 mảnh vụn < 12 đỉnh (cạnh trung vị
2 mm — dư sculpt). Nguồn hình trong bảng chi tiết theo đúng mảnh đang chọn.

**Z-Anatomy (đã nhập 2026-09-29, CC BY-SA 4.0; thêm 2026-09-30: nhu mô 5 thuỳ phổi, tuyến giáp, 4 tuyến
cận giáp — không lấy màng phổi, khối 56k đỉnh bọc kín phổi).** Dây thần kinh ngoại biên, tuỷ sống, tĩnh mạch
đầu–cổ + những tĩnh mạch BodyParts3D không có, 158 hạch bạch huyết CÓ TÊN. Quy trình: `bpy` (Blender
trên PyPI — blender.org bị chặn 403 từ mạng này) chạy `scripts/blender/z-anatomy-dump.py` → curve thành mesh
(tiết diện 8 cạnh; mặc định của tệp gấp 5 lần đỉnh) → `scripts/import-z-anatomy.ts`. Căn: trục
(x, z, −y), dời (−0,5; 7,2; −1,6) mm; lệch còn lại trung vị ~4,7 mm vì Z-Anatomy dựng lại lưới xương
(căn theo vùng không đỡ hơn) — chấp nhận. Mạch/dây thần kinh Z-Anatomy là đường cong VẼ LẠI, không
trùng BodyParts3D: không lấy động mạch, não; ứng viên bị loại nếu > 50% điểm nằm trong 7 mm hình học
gốc CÙNG loại (dây thần kinh so dây thần kinh, không so thân não — so thân não là loại nhầm dây VI).
Hạch không tên của UMCG bị bỏ khi có hạch Z-Anatomy; mạch bạch huyết UMCG giữ. Khái niệm mang mã
`ZA-…` (không phải FMA) → bảng chi tiết ẩn link FMA.

**Da chia nhỏ.** `scripts/smooth-skin.py` (Catmull-Clark một bậc, 44.744 → 268.464 tam giác) +
`scripts/import-smooth-skin.ts`. Mảnh mang cùng mã FJ2810: `withSupplements()` thấy trùng mã thì THAY
mảnh gốc. Da dùng MeshPhysicalMaterial có sheen (lớp ánh mềm ở mép) — không có ảnh bề mặt da hợp
pháp để dùng, nên không có lỗ chân lông/đốm như atlas thương mại.

**Nhập asset ngoài khác (hợp đồng).** Asset bổ sung phải
đi vào CÙNG đường dữ liệu với BodyParts3D, không thành một khối riêng: mỗi cấu trúc một mảnh
có mã riêng + mã FMA + hệ, để tìm kiếm, chọn, ẩn/xem riêng, góc nhìn đều dùng lại được. Không
gộp cả mạng lưới thành một mesh. Trước khi nhận: đăng ký hệ toạ độ bằng mốc giải phẫu đo
được trên cả hai bộ (đỉnh đầu, mỏm cùng vai, ụ nhô, gai chậu trước trên, mắt cá) — sai số
ghi lại; không đặt bằng mắt, không biến đổi viết tay cho khớp ảnh nhìn thẳng. Giấy phép ghi
vào `provenance.ts` như BodyParts3D.

**Nhóm cơ quan → màu:** `scripts/anatomy-groups.ts` suy nhóm (gan, tuỵ, ruột non…; não, thân
não, dây thần kinh…) từ tên + tổ tiên is-a FMA, ghi `part-groups.generated.json`; viewer tạo
một vật liệu mỗi nhóm (`GROUP_COLORS`). Chạy lại script khi đổi phân loại.

### Rê chuột ở nguyên khối; test click phải bấm vào CƠ THỂ, không vào giữa canvas

Mảnh dưới con trỏ sáng viền (kênh B của texture chọn) và hiện tên. pointermove chỉ ghi toạ
độ; raycast tối đa một lần mỗi khung trong vòng vẽ, lọc hộp bao trước. Mesh raycast dùng vật
liệu DoubleSide như vật liệu vẽ.

**Tâm ngang = giữa canvas, không giữa vùng trống (đổi 2026-09-29).** Bản trước canh cơ thể
vào giữa vùng quan sát (giữa bảng hệ bên trái và cột camera) nên lệch phải ~100 px so với thanh
"Tách các lớp" và dòng chú thích — chủ sản phẩm báo "mô hình lệch phải". Nay `centerOffsetX` chỉ
dời ngang khi mô hình THẬT SỰ chạm bảng (cách mép 16 px); không né nổi mới về giữa vùng trống.
Chiều dọc vẫn canh theo vùng trống.

**Bẫy khi test tự động:** camera vẫn có view offset khi mô hình to hoặc bảng rộng, nên cơ thể
không chắc nằm giữa canvas. Bấm vào tâm canvas là bấm vào khoảng
trống — từng kết luận nhầm "click không chọn được". Lấy toạ độ từ ảnh chụp (điểm ảnh màu xương).

### Góc nhìn theo vùng (2026-09-29)

Lưới "Góc nhìn theo vùng" (nút "Góc nhìn" cạnh ô tìm), theo lối Regional Views của các atlas
giải phẫu. Chọn một góc nhìn = hiện MỌI hệ trừ da (chủ sản phẩm chốt), camera nhìn theo hướng
của góc nhìn và tự khung theo hộp bao của tập `focus`; `hide` ẩn thêm thứ che mất vùng cần xem
(cơ phủ lồng ngực; vòm sọ + não che nền sọ). Bản đầu có trạng thái "làm mờ" (dither) nhưng bị
bỏ khi chuyển sang hiện mọi hệ — ở góc nhìn THEO VÙNG, đừng thêm lại. (Góc nhìn theo hệ có
bối cảnh làm mờ — mục dưới.)

**Mã mảnh không viết tay.** Quy tắc tên nằm trong `views.ts`; `scripts/atlas-views.ts` đối chiếu
với `atlas.json` thật, ghi `view-parts.generated.json`, và báo lỗi khi một quy tắc không khớp mảnh
nào. Sửa quy tắc là phải chạy lại script với `--write`. "Răng và mạch máu" đổi tên thành "Răng và
hàm" (id giữ `teeth-vessels`): BodyParts3D 4.0 không có động mạch hàm trên / huyệt răng dưới / mặt,
đừng đặt lại tên hứa "mạch máu". "Mặt cắt vùng chậu" dùng `clip` (mặt phẳng cắt theo vật liệu,
`renderer.localClippingEnabled`); gắn/gỡ `clippingPlanes` đổi shader nên chỉ đụng vật liệu khi trạng
thái THỰC SỰ đổi, và raycast phải tự bỏ điểm trúng ở nửa đã cắt. Mặt cắt để hở (mảnh là bề mặt).

Lưới gắn vào `<body>` (portal) từ mép trên khung xem, cao theo nội dung — KHÔNG làm vùng cuộn
riêng: trên điện thoại khung xem chiếm cả màn, vùng cuộn riêng nuốt mọi cú vuốt và thanh cuộn
của trang biến mất.

**Ảnh thu nhỏ chụp từ chính mô hình**, không phải ảnh tĩnh: sau khi tải xong, mỗi khung vẽ MỘT
góc nhìn vào góc canvas (scissor), chép sang canvas 2D ngay trong cùng tác vụ (bộ đệm WebGL còn
nguyên tới lúc ghép khung), rồi vẽ đè cảnh thật. Mượn camera chính vì đèn gắn vào nó. Trên
SwiftShader (test headless) mỗi khung như vậy mất ~7 s — chờ ~100 s trước khi mở lưới trong test.

`?view=<id>`: chọn góc nhìn (lưới, ô tìm) ghi bằng **pushState** để Back/Forward đi qua từng góc
nhìn (Next đồng bộ `useSearchParams` với pushState gốc); Back ra khỏi mọi góc nhìn trả về tập hệ
của URL ấy. Rời góc nhìn vì đụng tới hệ (bật/tắt, preset, thẻ hệ,
"Đặt lại", chip ×) là rời góc nhìn. Đổi hướng bằng Trước/Bên/Sau trong góc nhìn thắng hướng của
góc nhìn.

### Góc nhìn theo hệ (2026-09-29, pilot: hệ hô hấp)

Tab "Theo hệ" của cùng lưới: mỗi hệ có ba cấp Tổng quan → Nhóm/vùng → Cấu trúc. **Cùng một
registry** với góc nhìn theo vùng (`ATLAS_VIEWS` = `REGIONAL_VIEWS` + `SYSTEM_VIEWS`), phân biệt
bằng `kind`; lưới, deep link, ảnh thu nhỏ và ô tìm đều đọc từ đó — thêm hệ là thêm một mảng
preset (`views-<hệ>.ts`), không thêm JSX. Một "mô hình riêng" chỉ là tập mảnh sẵn có: không GLB
mới, không dời mảnh; cảnh ẩn mọi mảnh ngoài `focus` + `context` rồi khung theo hộp bao `focus`.

**Danh sách cấu trúc rút từ dữ liệu, không từ atlas thương mại.** Quy tắc viết bằng mã FMA
(`fma` trong `PartRule`), không bằng tên; script báo lỗi từng mã không khớp mảnh nào, và
`--audit respiratory` in mảnh của hệ chưa thuộc cấu trúc nào (hiện 119/119 đã thuộc). Thuỳ phổi
lấy theo `regional_part_of` của FMA; thanh quản lấy sụn/cơ/dây chằng từ hệ xương/cơ/mô liên kết
theo is-a FMA ("Laryngeal cartilage", "Intrinsic muscle of larynx"). Nhu mô 5 thuỳ phổi,
tuyến giáp, tuyến cận giáp KHÔNG có trong BodyParts3D — nhập từ Z-Anatomy (mục "Z-Anatomy" ở trên), mã `ZA-…`
nên preset khớp chúng bằng tên. Vẫn không có màng phổi, niêm mạc mũi; lưới có dòng nói rõ.

**Thẻ hệ và `?system=` mở "Tổng quan" của hệ nếu hệ có** (`overviewFor`). Lý do: chủ sản phẩm so
với ảnh Human Anatomy Atlas (chỉ tham chiếu, không lấy hình) — tim của BodyParts3D là 18 mảnh
thành/van; tim "như atlas" là tim + mạch vành + mạch lớn + cây mạch phổi, nằm ở hệ động/tĩnh mạch.
Tổng quan tim loại "Right anterior segmental artery" (FMA8620): FMA gọi là động mạch phổi nhưng
2 mảnh nằm ngang thận — lỗi vị trí dữ liệu, để lại là một đoạn mạch lơ lửng dưới tim.

**Màu theo cơ quan cho hô hấp/tiết niệu/nội tiết** (`anatomy-groups.ts` + `GROUP_COLORS`): cả hệ
một màu thì thận lẫn niệu quản, khí quản lẫn phổi. Sụn khí–phế quản trắng ngà, phổi hồng tím,
thận đỏ nâu, niệu quản vàng nhạt, giáp đỏ sẫm, thượng thận vàng — theo ảnh tham chiếu. Bề mặt mô theo lối atlas (`SURFACES` trong anatomy-scene.tsx, 2026-09-30): phổi lốm đốm + bóng ướt, xương xám be có hạt/lỗ xốp, sụn xanh xám bóng nhẹ, dây chằng trắng bạc có thớ. Một màu trơn trông như nhựa; mesh không có UV nên vân là nhiễu 3D theo toạ độ mô TRƯỚC khi tách (`position`) — dính vào mô khi kéo slider. Chỉ màu + độ nhám, không bump/texture. Mỗi bề mặt cần `customProgramCacheKey` riêng: three.js mặc định gom shader theo mã nguồn `onBeforeCompile` (giống nhau ở mọi vật liệu), nên xương từng dùng lại shader trơn — vân không hiện mà không báo lỗi.

**Góc nhìn theo hệ lấp 74% chiều cao VÙNG TRỐNG**, không của cả khung như theo vùng: cơ quan cao
như khí quản lấp theo cả khung là ~93% vùng trống, đè chip và thanh trượt.

**Mô tả hệ kiểm trên danh mục CÓ phần bổ sung** (`anatomy-enrich.ts` → `buildSystems`). Trước đó
kiểm trên BodyParts3D trơn nên câu kiểm kê lỗi thời vẫn qua: "không có hạch/mạch bạch huyết" sau khi
nhập UMCG, "không có thần kinh toạ" sau Z-Anatomy, "có lông mu" sau khi bỏ lông mu. Mục bị lỗi kiểm
thì RỚT khỏi bản phát hành khi `--write` — sửa nguồn + science-editor duyệt lại TRƯỚC khi ghi. Khớp
`absent` theo nguyên từ ("cochlea" không khớp "cochlear nerve").

**Tập hệ đang bật của góc nhìn theo hệ = các hệ có mảnh trong nó**, không phải `[systemId]`: thiếu
hệ cơ là `effectivePeel` coi cơ như đã bóc, cơ thanh quản biến mất ở 0%.

**Bối cảnh = lượt vẽ bóng mờ thứ hai** (đổi 2026-09-30): lượt chính bỏ mảnh bối cảnh (kênh A
của texture chọn); lượt hai vẽ lại cảnh với `scene.overrideMaterial` xám xanh 20%, mặt trước, không
ghi depth, không xoá bộ đệm — cấu trúc chính vẫn che bối cảnh nằm sau. Bản đầu dùng ô cờ để khỏi
đụng thứ tự vẽ: trên màn DPR 1 thành lưới sọc, thu nhỏ thì moiré — chủ sản phẩm chê. KHÔNG bật
`transparent` trên vật liệu thường (mảnh bối cảnh chung vật liệu/lượt vẽ với mảnh nổi bật). Có bối
cảnh thì không AO: composer vẽ vào render target, depth màn hình trống, bóng mờ sẽ đè lên tất cả.
**Bối cảnh tự sáng theo viền, không theo đèn** (2026-09-30): bản chiếu sáng như mô thật ở độ đục 0,2 cho
mặt quay khỏi key light gần đen — 20% của gần-đen trên nền tối là mảng xám đen (thẻ Mũi, Cây phế quản, Thần
kinh hệ hô hấp "chìm"). Nay fresnel: tự phát sáng + đục ở viền (~0,35), trong ở lõi (~0,09) — trung bình vẫn
~0,2, KHÔNG tăng độ đục để làm sáng. Kèm fill gián tiếp nâng vừa (môi trường 0,36, mặt đất đèn bán cầu
0x363a42 thay 0x14161a); key giữ nguyên để phổi/xương không cháy. Không có texture/GLB trong đường vẽ này
(mesh nhị phân: vị trí, pháp tuyến, chỉ số — không UV), nên không có lỗi colorSpace texture để sửa. Ảnh thu
nhỏ vẽ 2× rồi thu nhỏ: dây thần kinh 1–2 mm hẹp hơn một điểm ảnh ở 240 px, khử răng cưa trộn nó thành xám.

**Ảnh thu nhỏ chụp mọi lớp ĐỤC**, không theo độ đậm đang có ở khung xem: độ đậm theo lớp bóc tính từ tập hệ đang bật, nên chụp khi đang ở "Phổi" (không hệ cơ) thì cơ opacity 0 — ảnh bìa "Cơ hít vào" chỉ còn bóng xương sườn. Mở góc nhìn luôn về nguyên khối, ảnh bìa phải khớp thế.

**Ảnh thu nhỏ theo lối atlas:** chỉ cấu trúc của thẻ (không bối cảnh), khung trong 6–94% chiều cao
vùng vẽ, lấp 86%. Nhãn nằm DƯỚI vùng vẽ, không phủ lên ảnh (2026-09-30) — bản trước chừa 20% đáy cho dải nhãn gradient. Sàn khoảng cách camera hạ từ 0,12 m xuống `controls.minDistance`
cho góc nhìn theo hệ — nắp thanh môn ~3,5 cm ở sàn cũ chỉ chiếm nửa khung. Trên SwiftShader, trang
crash sau ~40 ảnh (bộ nhớ tiến trình GPU, heap JS đứng yên ~200 MB) — chưa thấy trên GPU thật.

**Lưới Góc nhìn không nền gần đen** (2026-09-30): token `--gallery-*` trong `.atlas-gallery` (globals.css),
navy #090c14 đồng bộ header, thẻ #121620. Ảnh thu nhỏ nền trong suốt nên mô hình tối và bối cảnh mờ
chìm vào nền đen của cảnh; tương phản lấy từ quầng `--gallery-stage` sau mô hình, KHÔNG từ đổi vật
liệu/đèn — cảnh 3D chính vẫn #05070a (lý do ở `SCENE_BACKGROUND`).

**Mở rộng ra tim, nội tiết, tiêu hoá, tiết niệu, sinh dục (2026-09-30)** — `views-<hệ>.ts`, cùng quy trình hô hấp
(audit → mã FMA → `atlas-views.ts` → science-editor). Test "cấu trúc phủ đủ tập nổi bật" nay chạy cho MỌI hệ.
Đánh đổi dễ bị "sửa lại cho đẹp":
- Sinh dục: dữ liệu là MỘT người nam → tên "Hệ sinh dục nam". Không ghi "thiếu bìu/da dương vật": da là một
  mesh toàn thân, có thể đã gồm vùng đó — chỉ ghi thứ đếm được là thiếu (tuyến hành niệu đạo, ống phóng tinh).
- "Mạch máu lớn của tim": TM chủ dưới là bối cảnh mờ, không nổi bật — một mảnh dài tới chậu, nổi bật thì khung
  kéo xuống bụng (lý do như tổng quan tim).
- Mạch thận: `renal artery$` cũng khớp "…suprarenal artery" — phải `exclude: /suprarenal/`.
- Tiêu hoá: không có manh tràng, đại tràng sigma, ống hậu môn, tuyến mang tai (đã grep bảng mảnh gộp). Hầu nằm ở
  hệ hô hấp của dữ liệu → bối cảnh mờ ở tổng quan tiêu hoá. Tên nhóm mạch theo đúng tập mảnh ("Thân tạng và
  động mạch mạc treo tràng"), không "động mạch nuôi ống tiêu hoá" — tập có cả ĐM gan/lách, thiếu ĐM thực quản.
- Tim: khoang nhĩ là cấu trúc riêng — "Các buồng tim" chỉ hiện khoang, "Tâm nhĩ" (thành + khoang) không nằm
  trọn trong đó nên bảng sẽ có "Phần còn lại".
- Giác quan, bạch huyết, thần kinh (cùng ngày): lớp nhãn cầu lấy MẮT PHẢI (góc nhìn một mắt), hai mắt ở tổng quan
  là "Nhãn cầu phải/trái". Bạch huyết không một hàng mỗi nhóm hạch (~110): gom theo vùng (nông/sâu, thành/tạng).
  Tên hạch là đuôi của từ khác ("submandibular" ⊃ "mandibular", "epigastric" ⊃ "gastric") → regex phải ``
  + liệt kê tiền tố (supra/sub/retro-pyloric…). Phế vị và gian sườn dùng lại cấu trúc của hô hấp — khai báo
  trùng tập mảnh là hai hàng chồng nhau. Không ghi "thiếu ống ngực": lưới mạch ngực có thể đã chứa nó.

### Hệ → Góc nhìn giải phẫu → Cấu trúc (2026-09-30)

Tab "Theo hệ" bản đầu bày ba cấp thẻ ngang hàng (Tổng quan / Nhóm / 20 thẻ cấu trúc) — chủ sản
phẩm chê giống thư viện mô hình hơn atlas để học. Nay lưới chỉ có **Tổng quan (một thẻ lớn) + góc
nhìn giải phẫu** (`kind: "group"`, đánh số); cấu trúc là lớp dưới, nằm trong **bảng "Cấu trúc"** của
trình xem sau khi mở một góc nhìn.

**Không đổi dữ liệu, chỉ thêm lớp đọc** (`atlas-model.ts`): `kind` cũ giữ nguyên nên mọi `?view=`
đã phát hành (kể cả `?view=trachea`) vẫn mở được; cấu trúc vẫn tìm được qua ô tìm.

**Cấu trúc của góc nhìn rút từ tập mảnh, không khai báo tay:** mọi `kind: "structure"` có mảnh nằm
trọn trong tập nổi bật, giữ cái lớn nhất (phổi phải thắng ba thuỳ). Nhờ vậy "Cơ hoành" hiện ở cả "Vị
trí của phổi" lẫn "Cơ hít vào" mà không chép danh sách. Mảnh không thuộc cấu trúc nào gom vào "Phần
còn lại" — test đòi mọi góc nhìn hô hấp không có hàng đó (sụn cánh mũi, đường đan hầu nằm hệ khác
nên phải thêm thẳng vào tổng quan). Góc nhìn không cấu trúc nào khớp (tổng quan tim, nội tiết) thì
không có bảng — chưa có preset cấu trúc cho chúng.

**Bảng thay chỗ danh sách hệ**, không đứng cạnh: trong góc nhìn theo hệ, bật/tắt hệ là rời góc nhìn,
nên danh sách hệ không còn việc. Chỉ ba thao tác cảnh làm được thật: chọn (tô sáng + bay tới), ẩn/hiện
(`hiddenIn`), xem riêng (`isolate` sẵn có). `hiddenIn` mang `viewId`: rời/đổi góc nhìn là tự hết hiệu
lực, không phải nhớ xoá ở từng lối ra; mở lại góc nhìn thì xoá. Mảnh đã ẩn không tính vào "Vừa khung".

**Cấp cấu trúc không có ảnh thu nhỏ** (`hasCard`): bớt ~25 lượt vẽ (~7 s/ảnh trên SwiftShader) và
giữ hàng đợi dưới ngưỡng ~40 ảnh làm tab headless crash.

**Ba trạng thái, không dựng bù** (`viewStatus`): `missing` → unavailable, không có thẻ, chỉ một dòng
dưới lưới nói thiếu gì (điện thoại không hover được để đọc `title`); `partial` → có thẻ, nhãn "Đang hoàn thiện", bảng Cấu trúc nhắc lại phần thiếu. `partial` khi phần có được TỰ NÓ đúng và hữu ích:
"Cơ thở ra" có gian sườn trong/trong cùng, ngang ngực, chéo bụng ngoài (thiếu cơ thẳng bụng, chéo bụng
trong, ngang bụng); "Thần kinh hệ hô hấp" có phế vị, thần kinh gian sườn, thân giao cảm của Z-Anatomy
(thiếu thần kinh hoành). Hai góc nhìn này từng là `missing` vì audit đầu chỉ tìm trong BodyParts3D.
"Khoang mũi" KHÔNG đặt: không có niêm mạc/khoang, thẻ vẫn tên "Mũi". "Rốn phổi" chỉ dựng phổi phải
(camera nhìn mặt trung thất từ +x; vẽ cả hai phổi thì phổi trái che). `quality` là đánh giá nội bộ,
không hiện cho người đọc.

### Chất lượng hình: audit trước, chỉnh cảnh sau (2026-09-30)

`scripts/atlas-asset-audit.ts` đo từng mảnh (tam giác, pháp tuyến, tam giác suy biến, số mảnh rời,
bản trùng) trên đúng các khối viewer tải. Kết quả chốt những việc KHÔNG làm:

- **Không chuẩn hoá scale/hướng:** BodyParts3D, Z-Anatomy, UMCG chung một hệ toạ độ (cây phế quản nằm
  trọn trong phổi Z-Anatomy, khí quản nối đúng). Một lớp biến đổi mỗi nguồn chỉ thêm chỗ sai.
- **Không texture/GLB mới:** dữ liệu không có UV; "bớt nhựa" là việc của vật liệu (metalness 0, độ
  nhám theo mô) và đèn theo camera — đã có, xem "Ánh sáng & vật liệu" trong `anatomy-scene.tsx`.
- **Pháp tuyến:** 0 hỏng trên mọi mảnh đo — không tính lại.

Những việc ĐÃ làm, kèm lý do:

- **Bỏ bản trùng cùng khái niệm** (`correctSystems`, khoá = khái niệm + số đỉnh + số chỉ số + hộp bao):
  4 cặp giống nhau từng byte (sụn nhẫn, xương móng, ĐM thân tạng, 2 nhánh ĐM gan phải) vẽ chồng →
  z-fighting và hai hàng trùng khi tìm. Cùng hình KHÁC khái niệm (cơ đáy chậu nông / cơ thắt hậu môn
  ngoài) giữ nguyên: đó là lỗi nguồn cần báo, không phải bản sao.
- **Sụn một màu** (`*.cartilage`): trước đây sụn thanh quản đỏ như cơ, sụn mũi hồng như da, sụn sườn
  trắng như xương — cùng một mô ba màu, và sụn thanh quản lẫn vào cơ quanh nó. Nhóm xếp theo tên FMA
  trong `anatomy-groups.ts`; xoăn mũi dưới là XƯƠNG nên về màu xương.
- **Ảnh thu nhỏ có bối cảnh:** bản trước bỏ bối cảnh vì ô cờ thu nhỏ thành moiré; bối cảnh nay là lượt
  trong suốt nên ảnh thẻ cho thấy cấu trúc nằm ở đâu (cây phế quản trong phổi, mạch phổi quanh tim).
  `camera.thumbnailFill` hạ riêng cho góc nhìn có bối cảnh rộng hơn tập nổi bật (khí quản trong phổi).
- **Góc nhìn mở đầu tải trước:** khối chứa mảnh của góc nhìn theo hệ đi đầu hàng; đủ nhóm đó là bấm
  được. Không tải lười hẳn từng góc nhìn: 18 khối dùng chung cho mọi góc nhìn, ảnh thu nhỏ/tìm kiếm/
  "Tách các lớp" cần cả cơ thể, nên phần còn lại vẫn tải ở nền.

### Da đục thì không vẽ lớp trong

Mạch và cơ nông của BodyParts3D lòi qua da vài mm (vệt đỏ/xanh ở cổ, cẳng chân). Khi da còn đục
hoàn toàn (slider 0, không chọn cấu trúc sâu, không góc nhìn) thì mọi hệ trừ bề mặt và giác quan
(mắt sau khe mi) không vẽ — hết vệt và bớt ~2 triệu tam giác. Năm mảnh bề mặt có nhóm màu riêng:
da / tóc–lông / môi (trước đây cùng một màu, tóc trông như da đầu).

### Khung mặc định và thanh cuộn dọc

Chiều cao hộp trên màn = min(FILL × khung xem, 88% vùng quan sát); FILL 74% desktop, 70%
tablet, 68% điện thoại. Đo thật (chỉ bật xương, nhìn thẳng — góc mặc định): 71% / 69% / 64%
khung xem. FILL tính trên CẢ khung xem: lấy 70% của vùng ĐÃ trừ thanh "Tách các lớp" là phần
trăm của phần trăm — bộ xương ~50% màn hình, bị báo hai lần. Vế 88% giữ bàn chân khỏi chui sau
thanh trượt. Tiêu đề và ô tìm là mẩu ở góc: KHÔNG trừ như dải ngang. Hệ cục bộ (não 17 cm, tim)
không phóng quá 3,5 lần cỡ toàn thân (`MAX_MAGNIFY`). Hộp bao các hệ đã rà: không mảnh lạc chỗ
nào kéo khung nhỏ lại (xương 0,01–1,71 m), nên không có bước lọc outlier.

Đang tách thì khung theo hộp bao THẬT của mảnh đang hiện (đã cộng độ dời) — đừng nội suy về
"khung lưới" giả định: ở 91% slider mảnh mới đi 40% đường tới ô lưới, tâm nội suy lệch và
"Vừa khung" đẩy mô hình lên mất nửa trên. Đổi hệ đưa slider về 0 (nguyên khối). "Đặt lại"
giữ các hệ đang bật và GIỮ bộ đếm zoom — đưa bộ đếm về 0 là cảnh đọc thành một lượt thu nhỏ,
tween đó đè mất tween về khung vừa.

Căn ngang: tâm vùng quan sát (giữa mép phải danh sách hệ và mép trái cột camera) bằng view
offset — đo 2026-09-29 lệch ≤ 0,5 px ở 1909/1440/1024/800 px. Bảng đổi cỡ mà canvas không đổi
(ResizeObserver trên các `data-atlas-avoid`) chỉ dời view offset, không đụng camera.

Khi phóng to vượt khung, thanh
cuộn dọc dời target + camera theo Y trong giới hạn hộp bao các hệ đang bật (có đệm: đỉnh đầu
và bàn chân không bị cắt ở hai đầu thanh). Vừa khung thì target được kéo dần về giữa — không
nhảy. Zoom quanh tâm (`zoomToCursor` TẮT — theo con trỏ thì phóng to lệch trái, thu nhỏ lệch phải); vừa khung thì tâm tự kéo về giữa theo cả hai trục.

### Provenance: một sổ (`provenance.ts`), bốn vai, kiểm bằng tệp thật

Bảng "Nguồn dữ liệu giải phẫu" đọc URL/giấy phép từ `ATLAS_PROVENANCE`, không viết cứng
trong JSX. Kiểm 2026-09-28 bằng chính tệp: `isa_BP3D_4.0_obj_99.zip` tải từ archive chính
thức có đúng 2.234 OBJ, trùng 2.234/2.234 mã mảnh của `atlas.json` — dù dữ liệu đến qua
repo Human Atlas chứ không tải thẳng. Hai điều bản cũ nói sai, đừng viết lại:

- **Tên tiếng Anh hiển thị là của BodyParts3D** (header OBJ, bảng concept), không phải
  FMA. FMA 5.1.0 chỉ cho Latin, đồng nghĩa, cha, TA98. BodyParts3D dựng trên FMA 3.0.
- **Chuyển đổi hình học (đổi trục, đơn giản hoá, đóng gói) và cách gom 15 hệ là của Human
  Atlas**, không phải Sciencepedia. Sciencepedia: tên Việt, dịch mô tả hệ, mô tả Level 2,
  sửa 5 cấu trúc não thất.
- Chú thích trong OBJ còn ghi CC BY-SA 2.1 JP; trang giấy phép chính thức (cập nhật
  2025-02-27) ghi CC BY 4.0 — trang của bên cấp phép là căn cứ.

### Dữ liệu cấu trúc: FMA làm giàu ngoại tuyến, viewer chỉ đọc bản đã kiểm

`scripts/anatomy-enrich.ts`: `atlas.json` → mã FMA duy nhất (3.432 khái niệm, không phải
2.234 mảnh — một khái niệm gom nhiều mảnh) → FMA 5.1.0 qua EBI OLS → tên Latin, đồng nghĩa,
cha is-a/part-of, TA98 → Zod → `data/anatomy/fma-structures.json` (nguồn thật, commit, diff
được) → `--upload` đẩy bản gọn + `.gz` lên R2 có dấu vân → sửa `ANATOMY_DATA_FILE`. Viewer
tải lười SAU danh mục, không chặn gì; không có lượt gọi API y sinh nào khi người đọc bấm.

- **Khoá là mã FMA**, kể cả `EXPLAINED` (trước đó khoá theo tên Anh viết thường). Tên đổi
  khi bộ dữ liệu dựng lại; mã thì không.
- **OLS chứ không `fma.owl`**: tệp OWL 198 MB; OLS phục vụ đúng bản 5.1.0 dưới dạng JSON kèm
  nhãn mọi lớp được trỏ tới, một lượt gọi mỗi khái niệm là đủ. Script dừng nếu OLS đổi
  phiên bản — bản mới phải kiểm lại giấy phép trước.
- **Giấy phép kiểm ở tệp `LICENSE` của bản phát hành** (CC BY 4.0), không ở registry: OBO
  Foundry và OLS ghi "CUSTOM" kèm link chết. Ghi công ở `licenses/human-atlas/FMA-ATTRIBUTION.md`
  và bảng "Nguồn & ghi công".
- **Latin chỉ nhận giá trị FMA gắn `language: Latin`**: danh sách non-English equivalent trộn
  Pháp/Đức/Tây Ban Nha; đoán theo mặt chữ ("Cor" hay "Coeur") là bịa. Phải dùng API v2 của
  OLS — v1 làm phẳng mất nhãn ngôn ngữ.
- **`TA_ID` của FMA là TA98, không phải TA2.** Lưu `ta98`; `ta2` để `null` cho tới khi có
  nguồn ánh xạ thật. Đừng "nâng cấp" TA98 thành TA2 — hai bảng mã khác nhau.
- **9 mã BodyParts3D không còn trong FMA 5.1.0** (dựng trên FMA cũ hơn) nằm ở `unresolved`,
  không đoán mã thay thế theo tên.
- **"Thuộc" chọn cha có mặt trong atlas** (`primaryPartOf`): FMA cho tim tám cha part-of
  (hệ tim mạch nam, nữ, chung, trung thất…); lấy mục đầu là lấy ngẫu nhiên. Cha is-a không
  hiện — nó là lớp ontology ("Organ with cavitated organ parts"), đúng mà vô nghĩa với người đọc.
- **Cache thô `.cache/anatomy/` gitignored** và giữ cả cấp máu, thần kinh chi phối… (Level 3)
  — lượt sau đọc lại cache chứ không tải lại.

### Level 2: viết tay có bằng chứng, máy kiểm hình thức, science-editor kiểm nghĩa

`data/anatomy/content-l2.json`: tóm tắt / vị trí / chức năng song ngữ, mỗi trường kèm câu trích
NGUYÊN VĂN từ OpenStax A&P 2e. `scripts/anatomy-content.ts` (gọi từ `anatomy-enrich.ts`) loại
mục nếu: câu trích không có nguyên văn trong mục sách đã tải, một con số trong câu không có
trong câu trích chống lưng, trường không có bằng chứng, hoặc câu rào đón khi nguồn không rào
đón. Chỉ mục có `review` (science-editor) vào bản phát hành; câu trích ở lại repo, không lên R2.
Bộ kiểm còn chặn tiếng Anh trùng ≥10 từ liên tiếp với câu trích (giấy phép) và cảnh báo khi rơi
từ hạn định của nguồn. Lượt đầu nó bắt ngay một câu trích bị tự điền nốt phần cuối — đó là lý do nó so nguyên
văn chứ không tin người viết.

- **OpenStax A&P 2e là CC BY-NC-SA 4.0**, không phải CC BY. Chỉ dùng làm nguồn dữ kiện, câu
  chữ tự viết; chép hay phỏng sát câu thì trang kế thừa phi thương mại + share-alike.
- **Viết cho khái niệm chung, cấu trúc con kế thừa** (`resolveContent`): "Xương đùi trái" is-a
  "Xương đùi"; mảnh không có is-a mang nội dung thì thử cha part-of. Khoá nội dung được là mã
  không có mảnh (Phổi FMA7195, Nhãn cầu FMA12513, Cơ ngực lớn FMA9627). Kế thừa luôn hiện
  trong khung "Về <cha>" — không bao giờ như mô tả của chính mảnh đang chọn.
- **Nội dung có nguồn thắng `EXPLAINED`** (lời giải thích port từ bản gốc, không nguồn).

---

## Triển khai

Vercel, project `sciencepedia`, region `icn1` (Seoul — gần Supabase `ap-northeast-2`;
đổi region Supabase thì sửa `vercel.json`).

Build command trong `vercel.json`:

```
prisma migrate deploy && prisma generate && next build
```

**Migration tự chạy mỗi lần deploy.** Không phải chạy tay, và cũng có nghĩa là một
deploy sẽ đẩy schema prod đi theo code — cân nhắc điều đó khi deploy một nhánh có
migration đi trước `main`.

Production deploy từ `main`. Xem `docs/process/` cho quy trình phát hành.

---

## Ảnh — ba kho, ba lý do

| Kho | Chứa gì | Vì sao ở đó |
|---|---|---|
| **Cloudflare R2** | Toàn bộ ảnh tĩnh: hero, bìa thiên thể, ô "khám phá", và bìa tự vẽ của bài khái niệm | 50 tệp, ~5,4 MB, gần như không đổi. Để trong `public/` thì mỗi deploy đóng gói lại toàn bộ và mọi lượt tải tính vào băng thông Vercel. R2 **không tính phí egress**. |
| **Supabase Storage** | Không còn ảnh mới nào. Bucket cũ giữ lại vì `npm run covers:mirror` đã sao hết sang R2, nhưng chưa xoá | Xoá bucket là thao tác một chiều; để đó tới khi chắc chắn không còn URL nào trỏ vào. `scripts/setup-storage.ts` từ đó thành script chết. |
| **`public/`** | Chỉ còn `icon.svg` | Favicon phải nằm cùng gốc với trang. |

Hai script dựng ảnh — `npm run covers:build` (bìa tự vẽ) và `npm run covers:bodies`
(bìa thiên thể) — ghi ra `assets/` chứ không `public/`. `assets/` bị gitignore: đó là
thư mục dàn, dựng lại được bất cứ lúc nào. Đẩy lên bucket bằng
`npm run assets:upload -- --write` (chạy khô là mặc định); nó giữ nguyên đường dẫn
tương đối thành tiền tố khoá (`covers/…`, `sky/…`) và kiểm lại bằng chính URL công
khai sau mỗi tệp.

Với `covers:build --apply`, thứ tự bắt buộc là **tải lên trước, ghi CSDL sau** —
ghi trước thì bài hiện ô đen cho tới khi tệp có mặt.

`assets:upload` ký SigV4 bằng `node:crypto` (`scripts/r2-client.ts`) thay vì kéo
`@aws-sdk/client-s3` vào: vài chục gói cho hai thao tác chạy tay dăm lần một năm là
cái giá sai.

**Đệm bao lâu tuỳ tên tệp.** Biến thể do `images:variants` dựng mang 8 ký tự hash của
ảnh gốc cộng công thức dựng (`sky/m31.0a1d4b8b-640.webp`) và được đệm
`public, max-age=31536000, immutable`. Mọi tệp khác — bìa gốc `covers/<slug>.webp`,
`article/<slug>.jpg` — giữ `max-age=86400`.

Vì sao phải có hash mới dám đệm một năm: tên theo CHỖ (`sky/m31-640.webp`) bị ghi đè
khi thay ảnh, và trình duyệt đã từng xem giữ bản cũ suốt `max-age` mà không có cách nào
gọi về. Trước 2026-09-17 các biến thể mang tên theo chỗ nên chỉ dám đệm một ngày — tức
khách quay lại sau một ngày tải lại toàn bộ ảnh, và mỗi lượt ấy tính vào giới hạn tốc độ
không công bố của `r2.dev`. Có hash thì ảnh đổi → tên đổi → bản kê đổi, tệp cũ không bao
giờ bị ghi đè.

Hai cái bẫy nếu sửa chỗ này:

- **Đổi tham số `sharp` (chất lượng, định dạng) mà không tăng `RECIPE`** trong
  `scripts/build-image-variants.ts` → byte mới dưới tên cũ đang đệm một năm. Hash chỉ
  từ ảnh gốc là không đủ, nên công thức góp vào hash.
- **Đẩy bản kê lên production trước khi đẩy tệp lên R2** → trang trỏ vào tên chưa tồn
  tại. Thứ tự: `images:variants --write` → `assets:upload --write` → commit bản kê.

Biến thể tên cũ (không hash) vẫn nằm trong bucket sau lượt đổi này; bản deploy cũ còn
trỏ vào chúng cho tới khi bản mới lên. Không có gì trỏ vào chúng nữa sau đó, xoá được.

---

## Ảnh tĩnh KHÔNG đi qua `/_next/image`

Ngày 2026-09-16, production trả **HTTP 402 `OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED`**
cho mọi biến thể ảnh chưa nằm sẵn trong cache: hạn mức Image Optimization của tài khoản
Vercel đã cạn.

Triệu chứng độc ở chỗ nó **không hỏng đều**. Biến thể đã cache vẫn hiện, biến thể mới
thì chết — nên ảnh hỏng theo bề rộng màn hình của từng khách chứ không theo trang, và
mở máy mình ra xem thì thấy bình thường.

```
/_next/image?url=/images/hero-galaxy.jpg&w=828  -> 402
                                         &w=3840 -> 200   (cache cũ)
wikimedia … &w=256      -> 200   (cache cũ)
wikimedia … &w=3840&q=40 -> 402
```

**Đổi kho ảnh không chữa được.** Ảnh Wikimedia cũng chết y hệt, mà Wikimedia đâu phải
Vercel hay R2 — nút thắt nằm ở bộ tối ưu, không ở nơi chứa ảnh. Ai định "chuyển ảnh về
chỗ khác cho nhẹ" lần sau nên đọc lại đoạn này trước.

Cách chữa: dựng SẴN các bề rộng (`npm run images:variants`) và cho trình duyệt tải
thẳng từ R2 qua `<AssetImage>` (`src/components/ui/asset-image.tsx`). Egress R2 miễn
phí, và không cú nào chạm hạn mức Vercel nữa. Hero đo được:

| | Byte |
|---|---|
| JPEG gốc | 285 KB |
| 640w WebP (điện thoại thật sự tải) | 6 KB |
| bản `/_next/image` cũ ở 3840w | 51 KB |

**Quy tắc:** ảnh trên R2 dùng `<AssetImage>`, không dùng `next/image`. Thêm ảnh mới thì
tải lên R2, chạy `images:variants -- --write`, rồi `assets:upload -- --write`; bản kê
`src/lib/image-variants.json` được commit vì component cần nó lúc render.

Bìa trong CSDL (`Article.coverImage`, `Category.coverImage`) đã được sao hết về R2 bằng
`npm run covers:mirror`. Script tải đúng tệp đang hiển thị và đặt lại ở R2 — **không**
đổi ảnh, không cắt, không nén — nên `coverImageCredit` vẫn đúng và điều kiện ghi công
của giấy phép Wikimedia/Unsplash vẫn được giữ. Bài mới do pipeline sinh ra có thể lại
mang URL ngoài; chạy `covers:mirror` lần nữa là xong, nó bỏ qua những gì đã ở trên R2.

`<CoverImage>` giữ nhánh `next/image` cho đúng khoảng thời gian ấy — nhánh đó vẫn dính
402, nhưng `onError` lui về dải màu thay vì để lại ô đen.

Danh sách host hợp lệ của biểu mẫu quản trị (`isAllowedImageUrl` trong `src/lib/utils.ts`)
đọc host R2 từ cùng biến môi trường. Quên chỗ này thì biên tập viên bị từ chối đúng
những URL mà trang đang hiển thị bình thường.

Vì sao là `<img srcset>` chứ không `next/image` kèm `unoptimized`: `unoptimized` bỏ luôn
`srcset`, tức điện thoại tải đúng tệp gốc 285 KB cho một ô rộng 360 px. Thứ đáng giữ
lại của `next/image` là `srcset`, không phải phần biến đổi ảnh lúc chạy.

Vì sao WebP mà không AVIF: `<img srcset>` chỉ trỏ được một định dạng; muốn cả hai phải
`<picture>` hai nguồn, gấp đôi số tệp. WebP chạy trên mọi trình duyệt còn được hỗ trợ.

### Đường tải lên cũng dựng sẵn các cỡ

`/api/upload` ghi thẳng vào R2 (`src/lib/storage.ts`), chuyển ảnh sang WebP và dựng đủ
các nấc **ngay tại lượt tải lên**, rồi trả về URL của nấc lớn nhất.

Cách rẻ hơn là để `images:variants` chạy sau. Nhưng khi đó ảnh vừa tải trông hoàn hảo
trong trang quản trị rồi hỏng ngoài trang công khai, và chỉ hỏng ở vài bề rộng màn
hình — kiểu lỗi phát hiện muộn nhất có thể. Vài giây ở lượt tải lên đổi lấy việc không
ai phải nhớ chạy ba lệnh.

**Quy ước tên tệp thay cho bản kê.** `image-variants.json` sinh lúc dựng nên không thể
biết ảnh tải lên sau đó. Vì vậy đường tải lên tự ràng buộc: dựng đủ các nấc `LADDER`
không vượt bề rộng gốc, và URL trong CSDL trỏ nấc LỚN NHẤT. Con số trong tên tệp
(`…-1400.webp`) nói luôn "có tới đây", và `assetSrcSet()` suy ngược cả bộ. Bản kê vẫn
đứng trước vì ảnh dựng lúc build có bề rộng gốc lẻ (800, 1760, 3200…) mà chỉ nó biết.

**Xoá ảnh thì HỎI R2, đừng đoán theo `LADDER`.** Lượt đầu viết `deleteImage` đoán — và
phép thử cho thấy nó để sót đúng bản to nhất, vì nấc lớn nhất bằng bề rộng gốc nên gần
như luôn là con số lẻ ngoài `LADDER`. Xoá mà để lại bản to nhất thì tệ hơn không xoá:
người ta tin là đã xoá.

`sharp` phải nằm trong `dependencies` (không phải `devDependencies`) và trong
`serverExternalPackages` — nó là thư viện native, gói vào bundle server thì bản nhị
phân đúng nền tảng bị bỏ lại.

### Dán URL ảnh ngoài cũng tự về R2

Ô "Hoặc dán URL ảnh có sẵn" chỉ lưu một chuỗi, nên trước đây dán URL Wikimedia rồi
bấm Lưu sẽ để lại một bìa trỏ ra ngoài: không có các cỡ dựng sẵn, rơi về `next/image`,
dính 402. Chữa được bằng `images:credit` rồi `covers:mirror` — tức một bước phải nhớ
bằng đầu, và bước bị quên thì hỏng âm thầm.

`intakeCover()` (`src/lib/cover-intake.ts`) chạy ngay trong lượt lưu bài và lưu lĩnh
vực: lấy ghi công từ Commons, kéo ảnh về, dựng các cỡ trên R2, trả lại URL R2.

**Thứ tự trong hàm là bắt buộc: ghi công TRƯỚC, sao ảnh SAU.** Ghi công suy ra từ tên
tệp Commons nằm trong URL; sao ảnh xong thì URL không còn dấu vết ấy.

**Hỏng thì vẫn lưu.** Hàm không bao giờ ném lỗi — Wikimedia chậm hay R2 trục trặc là
chuyện của bên thứ ba, chặn lượt lưu vì thế là đổi một phiền toái nhỏ (bìa còn trỏ ra
ngoài, `covers:mirror` dọn sau) lấy một phiền toái lớn (biên tập viên mất bài đang
viết).

Lúc SỬA lĩnh vực chỉ ghi ghi công khi thật sự suy ra được (`coverWrite` trong
`taxonomy.ts`). Ghi thẳng cả ba trường thì mỗi lượt sửa sẽ đặt `coverImageCredit = null`
và xoá mất thứ `images:credit` đã điền.

Phần suy ghi công nằm ở `src/lib/commons-credit.ts`, dùng chung với
`scripts/backfill-image-credit.ts` — một cách suy, hai nơi gọi.

#### Unsplash: phải dán URL TRANG ảnh

URL trên CDN có dạng `images.unsplash.com/photo-1454789548928-9efd52dc4031`. Chuỗi
`photo-…` ấy **không phải** id ảnh của Unsplash. Đo ngày 2026-09-16:

```
unsplash.com/photos/<id CDN>       → 401 (tường chặn bot)
api.unsplash.com/photos/<id CDN>   → 401
EXIF / IPTC / XMP của tệp ảnh      → rỗng sạch
```

Nghĩa là từ một URL CDN thì **không có đường nào** suy ra tác giả, kể cả khi có khoá
API. Muốn ghi công đúng thì phải dán URL trang ảnh (`unsplash.com/photos/…`) — nơi
duy nhất chứa id tra cứu được. `src/lib/unsplash.ts` tra API lấy tác giả và bản gốc,
`intakeCover` dùng kết quả đó rồi mới sao về R2.

Khoá: `UNSPLASH_ACCESS_KEY` (đăng ký miễn phí ở unsplash.com/developers). Bỏ trống thì
dán URL trang ảnh sẽ bị bỏ bìa — nhánh này KHÔNG được phép hụt mà vẫn lưu, vì đầu vào
là một trang HTML.

Hai nghĩa vụ theo điều khoản API, cả hai đã cài sẵn: gọi `download_location` mỗi lần
dùng ảnh (đếm lượt về cho tác giả), và link ghi công mang `utm_source`/`utm_medium`.

Id ảnh dài đúng 11 ký tự base64url, tức **chứa được dấu `-`**. Tách id bằng cách cắt
theo dấu gạch cuối cùng là sai và sai lác đác (chỉ với id có gạch) — cắt theo độ dài.

---

Kết quả sau lượt chuyển 2026-09-16: mọi trang nội dung render **0** URL `/_next/image`.
Còn lại đi qua bộ tối ưu chỉ có ảnh người dùng tải lên (avatar) và ảnh EPIC của NASA —
ảnh EPIC vốn đã `unoptimized` vì nó đổi từng giờ.

URL R2 dựng bằng `assetUrl()` trong `src/lib/asset.ts`, **không viết cứng trong
component**. Gốc URL đọc từ `NEXT_PUBLIC_ASSET_BASE_URL`; `next.config.ts` đọc cùng
biến ấy để mở `images.remotePatterns` — một nguồn sự thật, nên không có cảnh đổi
host rồi ngồi đoán vì sao `next/image` trả 400.

**Cảnh báo phải biết trước:** giá trị mặc định là `pub-….r2.dev`, tức *Public
Development URL* của R2. Cloudflare bóp băng thông đường này và nói rõ nó không
dành cho lưu lượng thật. Trước khi trang có tải thật, gắn tên miền riêng vào
bucket và khai vào `NEXT_PUBLIC_ASSET_BASE_URL`.

Đánh đổi đã chốt: bộ ảnh này **không còn trong git**. Thay một tấm là tải trực tiếp
lên bucket — R2 là bản duy nhất, không có bản trong repo để đối chiếu. Đổi lại,
`git clone` nhẹ đi 4,5 MB và deploy không phát lại thứ chưa từng đổi.

---

## Tìm kiếm

Meilisearch, fallback Postgres FTS. HTML highlight từ search **phải** đi qua
`highlightToSafeHtml()` — không đưa thẳng vào `dangerouslySetInnerHTML`.

---

## Song ngữ

next-intl, hai locale `vi`/`en`. Mọi chuỗi mới phải có mặt ở **cả** `messages/vi.json`
và `messages/en.json`. Nội dung song ngữ trong DB dùng `pick()` / `pickName()` từ
`@/lib/i18n-content`, không hardcode.

Cấm fallback hiển thị tiếng Việt trong trang tiếng Anh, cấm dịch máy tại runtime.

## Xuất bản tự động — gate ở đâu và vì sao ở đó

Thêm 2026-09-05.

Pipeline 11 bước chạy được không cần người ngồi cạnh, qua `npm run pipeline`
(`scripts/pipeline.ts`, dùng `@anthropic-ai/claude-agent-sdk`). Ba quyết định
đáng ghi lại, vì lần sau đều dễ bị "sửa cho gọn".

**Không viết lại hệ agent bằng TypeScript.** Agent SDK chính là Claude Code
đóng gói thành thư viện, nên nó nạp thẳng `.claude/agents/` và `.claude/skills/`.
Viết một bản triển khai thứ hai cho máy chủ là tạo ra hai bản sẽ trôi khỏi nhau,
và lần lệch đầu tiên phát hiện được sẽ là qua một bài sai đã lên production.

**Chạy trên GitHub Actions, không phải Vercel.** Hai lý do độc lập, mỗi lý do
đủ để một mình quyết định: hàm Vercel cắt ở 60 giây trong khi một bài mất hàng
chục phút; và `CLAUDE_CODE_OAUTH_TOKEN` (gói đăng ký, không cần API key) chỉ
được Claude Code / Agent SDK đọc — `@anthropic-ai/sdk` không đọc nó, nên đường
cũ qua `src/lib/rewrite.ts` vẫn cần API key riêng.

**Gate nằm trong đường ghi, không nằm trong prompt.** Dặn agent "nhớ kiểm tra
trước khi publish" là lời khuyên; nó hỏng đúng vào ngày không ai ngồi xem. Thay
vào đó:

| Lớp | Ở đâu | Chặn được gì |
|---|---|---|
| Khoá | `scripts/publish.ts` | Không qua `check-publish` thì không đổi state, kể cả người gọi là con người |
| Hàng rào | hook `PreToolUse` trong `pipeline.ts` | Lệnh đổi lược đồ, ghi CSDL bằng lệnh một dòng, `git push` |
| Hạ tầng | không đặt `DIRECT_URL` trong CI | `prisma migrate` không chạy được dù hai lớp trên thủng |

Hàng rào **không kín** — agent viết được một file rồi chạy file đó. Nó tồn tại
để chặn lối đi thẳng và nâng chi phí đường vòng; thứ thật sự giữ là lớp khoá.

### Form quản trị KHÔNG đi qua khoá — có chủ ý

Chốt 2026-09-25, quyết định của chủ sản phẩm. Ba lớp trên giữ đường ghi của
**máy** (pipeline, script). Form ở `/admin` (`src/server/actions/articles.ts`)
ghi thẳng `PUBLISHED`, không gọi `check-publish`, và được giữ như vậy: đó là
đường xuất bản tay của chủ sản phẩm, người chịu trách nhiệm bài đó.

Phát hiện ra vì 25 bài tạo qua form từ 21/09 lên trang với `factCheck =
PENDING`, không người duyệt, 17 bài 0 nguồn và 0 link — gate không hỏng, nó
chỉ chưa bao giờ chạy trên chúng. Đã cân ba hướng (chặn cứng / cảnh báo / giữ
nguyên) và chọn giữ nguyên.

Hệ quả phải biết trước khi đọc số liệu gate:

- `npm run publish:check` rà kho sẽ báo CHẶN ở các bài này. Đó là trạng thái
  thật của bài, không phải gate hỏng; đừng nới gate cho xanh.
- Việc dọn sau (nguồn, link vào/ra, thuật ngữ) là việc đi sau form — ví dụ
  `scripts/add-sources-2026-09-24.ts`, `npm run links:reading`.
- Ngoại lệ duy nhất form VẪN chặn: dấu trích dẫn của công cụ AI
  (`src/lib/draft-artifacts.ts`), vì nó không bao giờ là nội dung hợp lệ nên
  chặn không cản được bài nào đáng lên.

### Nhịp chạy: liên tục tới khi hết hạn mức

Sửa 2026-09-05, đảo quyết định của chính ngày hôm đó.

Bản đầu đặt `--count 1` và trần chi phí $5, cố ý chừa hạn mức cho phiên làm
việc tương tác của người. Thực tế chạy cho thấy trần chi phí không canh gác mà
**tạo hình** công việc: agent đọc được ngân sách còn lại rồi tự cắt việc khi
thấy gần cạn — ba lượt liên tiếp đều dừng ngay dưới trần, một lượt nói thẳng
"ngân sách phiên gần cạn nên dừng ở đây". Nâng trần chỉ dời chỗ nó dừng.

Nên bỏ hẳn trần. Hạn mức tài khoản là giới hạn thật và duy nhất; hàng rào chống
vòng lặp chuyển sang `timeout-minutes` của workflow, thứ đo thời gian thật thay
vì đoán qua tiền. Đánh đổi đi kèm, đã chấp nhận: lượt chạy tự động không nhường
quota nữa và sẽ giành hạn mức với phiên tương tác của người.

Kéo theo hai thứ bắt buộc phải có, nếu không thì cách chạy này tự phá:

**Nhặt lại việc dở.** Chạy tới khi hết hạn mức nghĩa là *chắc chắn* sẽ bị cắt
giữa chừng. Lượt bị cắt để lại một bài DRAFT, mà hàng đợi thì bỏ qua dòng nào
đã có bài — nên bản nháp đó sẽ không lượt nào nhặt lại và thành bài mồ côi vĩnh
viễn. Đã xảy ra thật với `ba-dinh-luat-newton`. Vì vậy prompt có bước 0: chạy
`publish:check --draft` và làm nốt bài DRAFT trước khi lấy chủ đề mới. Trạng
thái nằm trong CSDL chứ không trong tiến trình, nên nó sống sót qua mọi lần
runner chết.

**Hết hạn mức không phải lỗi.** `pipeline.ts` thoát mã 75 (`EX_TEMPFAIL`) cho
trường hợp này, tách khỏi mã 1; workflow đọc 75 thành `::notice::` và báo xanh.
Gộp hai thứ làm một thì mỗi lần hết quota đều đỏ như một sự cố, và báo đỏ
thường xuyên thì đúng lúc hỏng thật sẽ không ai nhận ra.

Cron mỗi 2 giờ không nhằm chạy 12 lượt một ngày, mà để bắt được lúc hạn mức vừa
hồi. Lượt gặp quota còn cạn chết trong vài giây; repo public nên phút Actions
không tính tiền.

`scripts/check-publish.ts` là chỗ duy nhất định nghĩa điều kiện xuất bản, và nó
**chỉ đọc** — một cái gate tự sửa dữ liệu để làm chính mình xanh là gate vô
dụng. Hai mức CHẶN / CẢNH tách nhau vì gộp lại thì hoặc quá chặt (chặn bài hợp
lệ, rồi người ta học cách bỏ qua nó) hoặc quá lỏng.

**`settingSources: ["project"]`, cố ý bỏ "local" và "user".**
`.claude/settings.local.json` nằm trong `.gitignore` nên **không có trong
checkout của CI** — mọi lệnh cấm phải khai lại trong hook, không được trông vào
file đó. Cấu hình chạy được trên máy dev mà biến mất trên máy chủ là dạng cấu
hình tệ nhất.

**Người viết và người duyệt khác model.** `pipeline.ts` ghi đè
`science-editor` sang Opus. Cùng một model chấm bài của chính nó thì cái nó bỏ
sót lúc viết nó cũng bỏ sót lúc chấm — sai sót tương quan, và "đã duyệt" thành
một con dấu rỗng. Đây là gate yếu hơn người duyệt thật; đừng đọc nó như tương
đương.

### Agent được commit, không được push

Chốt 2026-09-05, sau khi lượt chạy pipeline đầu tiên tự commit bài vừa publish.

Ranh giới đúng nằm ở `push`, không ở `commit`. Commit là cục bộ và lùi được
bằng `git reset`; push là hành động hướng ra ngoài. Trong quy trình của dự án
này người đẩy code bằng GitHub Desktop, nên **bước push chính là bước người xem
lại** — nó đã là một cái gate sẵn có, không cần dựng thêm cái thứ hai.

Cấm commit không thêm an toàn nào: agent vẫn sửa được file, chỉ là để lại thay
đổi lơ lửng trong working tree, khó đọc hơn một commit có lời giải thích.

### Vì sao `entityId` là điều kiện CHẶN khi xuất bản

Chốt 2026-09-05, sau khi cân nhắc hạ xuống mức cảnh báo.

Trạng thái thật của knowledge graph, nói cho đúng:

| Thứ phụ thuộc entity | Tình trạng |
|---|---|
| JSON-LD `about` + `sameAs` → Wikidata | Đang chạy. Không entity thì mất hẳn |
| "Bài liên quan" | Đang chạy, **có fallback** về tag/category — kém hơn, không mất |
| `getPrerequisites` | Hàm đã viết, **không component nào gọi** |
| Learning path | **Chưa có route nào** |

Một nửa giá trị vẫn là tiềm năng, nên chặn cả kho vì nó là nặng tay. Vẫn chặn,
vì lý do nằm ở chiều thời gian chứ không ở giá trị hiện tại: hạ xuống cảnh báo
thì bài mới publish mà không vào graph, và gắn entity **sau** đắt hơn hẳn gắn
lúc viết — lúc đó phải đọc lại bài để biết nó trình bày khái niệm nào, trong
khi lúc viết thì người viết đã biết.

Đây là ranh giới giữa "nợ đo được" và "nợ phải đào lại". 41 bài cũ đã ở phía
sau ranh giới đó rồi; việc cần làm là đừng đẩy thêm bài nào sang.
