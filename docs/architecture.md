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
