# Chẩn đoán

Quy tắc rút từ những lần **sửa nhầm chỗ**. Đây không phải mẹo kỹ thuật — mẹo kỹ
thuật nằm ở `docs/design-system.md`. Đây là cách quyết định *sửa cái gì*.

Cập nhật: 2026-09-05

---

## Sửa hai lần không ăn thì chẩn đoán sai, không phải liều lượng sai

Thanh thống kê ở trang chủ bị báo "nội dung dồn lên đầu". Hai lần chữa:

1. Thêm `justify-center` — hợp lý, vì ô lưới bị kéo cao bằng ô cao nhất.
2. Đổi `leading-none` sang `leading-tight` — cũng hợp lý, vì chữ số không có nét
   thò xuống nên hộp dòng lệch tâm thị giác.

Cả hai đều là cải thiện thật. **Cả hai đều không phải nguyên nhân.** Nguyên nhân
là hero `position: relative` vẽ đè lên thanh số tĩnh và dải gradient đáy hero cắt
mất phần đầu các icon.

Tới lần thứ ba mới đọc HTML đã dựng (`grep` trong `.next/server/app/vi.html`) và
thấy `justify-center` vốn đã có mặt — tức triệu chứng không thể là lỗi căn giữa.
**Lẽ ra phải làm việc đó ngay từ lần đầu.**

Quy tắc: khi bản sửa thứ nhất không ăn, đừng tăng liều. Đi tìm bằng chứng trực
tiếp về trạng thái thật — HTML đã dựng, giá trị thật trong CSDL, output thật của
lệnh.

---

## Kiểm tiền đề trước khi thi hành một phán quyết

`science-editor` phủ quyết ô "Lượt đọc" và khối "Được đọc nhiều nhất" với lập luận:
cột `views` toàn số 0, nhãn "Lượt đọc" là tuyên bố sai về hệ thống của chính mình.

Lập luận đúng. **Tiền đề sai.** Cơ chế đếm hoạt động đầy đủ — `ViewCounter` →
`POST /api/articles/[id]/view` → `incrementViews`, có chốt `sessionStorage` và
rate limit. `views` = 0 chỉ vì project mới chạy 24 giờ, chưa có lưu lượng.

Một phán quyết đúng logic nhưng sai dữ kiện vẫn là phán quyết sai. Trước khi thi
hành một phủ quyết, kiểm cái nó dựa vào.

Phần duy nhất trong phủ quyết đó đứng vững độc lập với lưu lượng — `orderBy` đơn
trên cột đồng hạng trả về thứ tự vật lý trong heap Postgres — vẫn được sửa.

---

## Ảnh chụp màn hình là bằng chứng, không chỉ là lời than

Chủ sản phẩm báo ba lần "mô hình 3D không chuyển động". Hai lần đầu tôi đoán sai
(tốc độ quá chậm, rồi điều kiện mount). Lần thứ ba, đọc lại một ảnh cũ:

> Bốn chấm trắng của minh hoạ CSS xếp thành **một cột dọc hoàn hảo** — cả bốn ở
> vị trí 12 giờ trên quỹ đạo của chúng.

Đó là trạng thái ban đầu khi animation chưa từng chạy. Minh hoạ đó dùng
`motion-safe:`, tức chỉ chạy khi hệ điều hành không xin giảm chuyển động. Ảnh
chụp **chứng minh** `prefers-reduced-motion` đang bật, và giải thích luôn cả ba
lần báo lỗi.

Xác nhận lại bằng một phép kiểm dứt điểm chạy trên máy người báo:
`matchMedia('(prefers-reduced-motion: reduce)').matches`.

Quy tắc: đọc ảnh chụp như đọc log. Cái *không* chuyển động, cái nằm sai chỗ, cái
xếp quá đều — đều là dữ kiện.

---

## Đưa người báo lỗi một phép kiểm cho ra `true`/`false`

Khi giả thuyết nằm ngoài tầm với — thiết lập hệ điều hành, trạng thái trình duyệt,
dữ liệu trên máy khác — đừng mô tả triệu chứng rồi chờ. Đưa một lệnh dán vào
console trả về đúng một giá trị, kèm ý nghĩa của cả hai kết quả:

> Ra `true` → đúng như tôi đoán, sửa ở chỗ này.
> Ra `false` → giả thuyết của tôi sai, tôi đào hướng khác.

Nó chấm dứt vòng đoán trong một lượt.

---

## Phân biệt "lỗi hiển thị" với "thiếu dữ liệu"

Nhiều yêu cầu giao diện thực ra là yêu cầu dữ liệu, và làm bằng CSS sẽ ra một lời
nói dối:

- "Card lĩnh vực nên có ảnh" → cả 14 danh mục có `coverImage = null`. Không phải
  việc của CSS.
- "Thêm badge *Đã kiểm chứng nguồn*" → phải có `reviewedAt` thật. In badge lên
  bài chưa ai kiểm là đúng thứ `docs/content-rules.md` cấm.
- "Thêm *Dòng thời gian* vào navbar" → không có route nào như vậy. Navbar mỏng
  còn hơn navbar có link 404.

Trước khi dựng, hỏi: **thứ này lấy số liệu ở đâu?** Nếu câu trả lời là "chưa có
đâu cả" thì đó là việc dữ liệu, không phải việc giao diện.

---

## Rác cũng phải kiểm: link và nhãn đang chạy

Rà qua footer tìm ra hai link hỏng đã sống trên production:

- Icon RSS trỏ `/rss.xml` — **không có route nào** trong `src/app/`.
- Icon GitHub trỏ `https://github.com` — trang chủ GitHub, không phải repo nào.

Không ai báo, vì không ai bấm. Khi chạm vào một khối, kiểm luôn các link trong đó
có resolve không.

---

## Thứ quyết định thường nằm cao hơn một tầng

Ba lỗi riêng biệt trong dự án này có cùng một hình dạng: chỗ tôi đang sửa không
phải chỗ quyết định kết quả.

| Triệu chứng | Tôi sửa ở | Thứ thật sự quyết định |
|---|---|---|
| Icon thanh số bị cắt cụt | căn lề của chính thanh số | `position` của **hero bao ngoài** |
| Ô bảng dính sát viền | selector trên thẻ bọc bảng | **cascade layer** của cả stylesheet |
| Thiên hà không hiện trên điện thoại | điều kiện mount trong component | `hidden lg:block` ở **thẻ cha** |

Lần thứ ba đặc biệt dễ mắc: tôi đã thêm `lowPower` vào `HeroGalaxy`, chạy
typecheck xanh, và suýt báo xong — trong khi component đó dưới `lg` không hề
được dựng, vì một class ở thẻ bao ngoài đã quyết định điều đó từ trước.

Quy tắc: khi bản sửa **chắc chắn đã được áp dụng** mà không đổi gì, đừng sửa
tiếp ở cùng tầng. Đi lên một tầng và hỏi ba câu:

1. Thẻ cha có đang định vị, cắt, hoặc ẩn thứ này không?
2. Luật CSS kia nằm trong `@layer` nào? (layer đứng trên specificity)
3. Có điều kiện nào ở trên quyết định thứ này có tồn tại hay không?

---

## Phép đo mâu thuẫn với mắt người dùng thì phép đo thiếu, không phải người dùng sai

Chủ sản phẩm báo bảng vẫn dính sát viền. Tôi mở CSS đã dựng, lấy ra hai con số
độ ưu tiên — (0,1,0) của typography so với (0,1,1) của bản vá — rồi kết luận
**"bản vá đáng lẽ thắng"**, và dùng kết luận đó để chuyển nghi ngờ sang một khối
khác. Tôi còn nhờ chủ sản phẩm xác nhận giả thuyết mới đó.

Ảnh chụp gửi về cho thấy đúng cái bảng. Bản vá không thắng, và lý do là thứ tôi
chưa đo: cả hai luật nằm ở hai cascade layer khác nhau, mà layer đứng trên
specificity.

Sai lầm không phải đo sai. Là **đo thiếu rồi coi kết quả là đầy đủ** — và lấy
một phép đo thiếu để lật lại một quan sát trực tiếp.

Quy tắc: người báo lỗi đang nhìn trang thật; tôi chỉ đang nhìn một lát cắt của
nó. Khi hai bên chỏi nhau, mặc định là lát cắt của tôi hụt một biến. Đi tìm biến
đó trước, đừng viết lại chẩn đoán. Và nếu vẫn phải đoán tiếp thì xin ảnh chụp
**trước**, đừng đề xuất thủ phạm mới rồi nhờ xác nhận — ảnh chụp tốn của người
kia năm giây và chấm dứt thứ mà hai mươi phút suy luận không chấm dứt được.

---

## "Cái này thừa, bỏ đi" — đếm xem có bao nhiêu chỗ thật sự thừa

Chủ sản phẩm chỉ vào một bài có ghi công ảnh hiện hai lần và bảo bỏ cái trên ảnh
đi. Đúng với bài đó. Nhưng dòng ghi công trong thân bài chỉ có ở **6 trên 41
bài** — 35 bài còn lại chỉ có duy nhất cái lớp phủ. Bỏ thẳng theo lời là xoá ghi
công của 35 bài, tức vi phạm CC BY trên phần lớn thư viện.

Người báo mô tả **trang họ đang mở**, không mô tả tập dữ liệu. Họ không có nghĩa
vụ biết 35 bài kia trông thế nào — đó là việc của tôi.

Quy tắc: trước khi xoá thứ gì vì "đã có ở chỗ khác", chạy một câu đếm xem "chỗ
khác" đó phủ được bao nhiêu phần trăm. Nếu không phủ hết, việc phải làm không
phải là xoá mà là **gộp về một chỗ** — rồi nói rõ đã gộp về đâu và mất gì.

---

## Agent chết thì chỉ file sống sót

Trong một phiên, agent chết bốn lần vì lỗi máy chủ và hạn mức. Mỗi lần mất toàn bộ
ngữ cảnh và phải làm lại từ đầu.

Rút ra:

- **Đưa dữ kiện đã dò được vào brief.** Lần khởi động lại thứ hai của
  `content-curator` gồm sẵn: sitemap escape ampersand hai lần, `server-only` chặn
  import từ script tsx, cách lọc `npm notice` khỏi output, và 6 ứng viên đã sàng
  từ 137 bài. Nó không phải dò lại.
- **Kiểm working tree sau mỗi lần agent chết** trước khi kết luận mất gì.
- Agent báo "xong" mà thực ra dừng chờ một tín hiệu không bao giờ đến là chuyện có
  thật. Trong kiến trúc này không có vòng lặp nào đánh thức agent ở giữa pipeline
  — brief phải nói rõ "chạy tới hết, không dừng chờ".

---

## Đo kích thước không phải là đo nội dung

Token OAuth bị máy chủ trả 401. Tôi đo và thấy 109 ký tự, thấy tiền tố
`sk-ant-oat01-` đúng dạng, rồi kết luận: **bị cắt cụt lúc copy**. Đề nghị người
dùng copy lại. Họ copy lại và khẳng định đã lấy trọn.

Họ đúng. Token không thiếu ký tự nào — nó **thừa** một: một dấu cách (U+0020) ở
vị trí 99, do PowerShell chèn vào điểm ngắt dòng khi hiển thị.

Phép đo đúng mất một dòng:

```ts
/\s/.test(token)   // base64url không bao giờ chứa khoảng trắng
```

Sai lầm không phải đo sai. Là **đo một chiều rồi kết luận về chiều khác** — lấy
độ dài để suy ra tính toàn vẹn. Với chuỗi có bảng chữ cái xác định (token, hash,
slug, mã màu), câu hỏi đầu tiên không phải "dài bao nhiêu" mà **"có ký tự nào
không thuộc bảng chữ cái của nó không"**. Câu đó chỉ ra ngay chỗ hỏng, còn độ
dài thì chỉ nói được là "trông hơi ngắn".

Hệ quả thứ hai: đừng đẩy người báo lỗi đi làm lại một việc họ đã làm đúng. Khi
họ nói "tôi đã làm rồi", mặc định là họ làm rồi.

---

## Brief phải nói vào tham số, không nói vào ý định

Lần chạy pipeline tự động đầu tiên: agent giao việc cho `content-curator` rồi
kết thúc lượt, kèm câu "sẽ báo lại khi agent hoàn tất — tôi sẽ được thông báo
tự động". Không có thông báo nào tới. Tiến trình thoát, subagent bị giết theo,
báo cáo mô tả một kết quả không tồn tại.

Brief đã có sẵn dòng **"chạy tới hết, không dừng chờ"** — chính dòng rút ra từ
mục "Agent chết thì chỉ file sống sót" phía trên. Nó không cứu được, vì agent
không cho là mình đang chờ: subagent trong Agent SDK **mặc định chạy nền**, nên
dưới góc nhìn của nó, việc đã được giao xong và lượt đã trọn vẹn.

Câu có tác dụng là câu nói vào đúng tham số:

> Mọi lần gọi công cụ Agent PHẢI đặt `run_in_background: false`.

Quy tắc: khi hành vi hỏng do một **mặc định của công cụ**, đừng mô tả kết quả
mong muốn ("chạy tới hết") — nêu tên tham số và giá trị phải đặt. Mô tả ý định
chỉ sửa được lỗi do agent chọn sai; nó không sửa được lỗi do agent không biết
có một lựa chọn ở đó.

---

## Đếm chưa đủ — phải phân loại theo chức năng

Trang bài hiện hai chỗ ghi nguồn. Quy tắc "đếm trước khi xoá" ở mục trên đã có
sẵn, và lần này tôi làm đúng nó:

```
cả hai chỗ     : 22        chỉ trong thân bài : 0
chỉ trong CSDL : 20        không có gì        : 0
```

Không bài nào phụ thuộc duy nhất vào khối trong thân bài, nên phép đếm nói
"xoá an toàn". **Phép đếm sai.** Phân tiếp theo *chức năng* thì bức tranh đổi
hẳn: 21 khối là ghi công tác phẩm phái sinh ("viết lại từ… Bản quyền thuộc
về…"), chỉ 1 khối là danh sách trích dẫn trùng CSDL. Bảng `Source` không mang
được điều kiện giấy phép, nên xoá theo phép đếm là vi phạm giấy phép 21 bài.

Đếm trả lời "có bao nhiêu". Nó không trả lời **"chúng có cùng loại không"**.
Trước khi xoá hàng loạt theo một con số, hỏi thêm: những thứ tôi sắp gộp làm
một có cùng lý do tồn tại không?

---

## Một phép đo đúng trên dữ liệu sai vẫn cho kết luận sai

Ba lần trong một ngày, cùng một hình dạng:

| Phép kiểm | Trả lời đúng câu | Câu thật sự cần hỏi |
|---|---|---|
| "≥3 nguồn bậc 1–2" | đếm đúng cột `tier` | VACA bị gán tier 2, thực chất là tier 4 |
| "link nội bộ resolve được" | slug có trong CSDL | URL có mở ra trang — vẫn 404 vì thiếu tiền tố locale |
| `--links` trả 200 | máy chủ còn sống | tài liệu có nói điều đang trích — Pollack 1996 trả 200 và không hề bàn tới spin |

Cả ba phép kiểm đều chạy đúng như thiết kế. Khoảng cách nằm giữa **câu chúng
trả lời** và **câu ta tưởng chúng trả lời**, và khoảng cách đó đủ rộng để lọt
lỗi tới production.

Quy tắc: khi thêm một phép kiểm, viết ra **bằng lời** câu nó thật sự trả lời,
rồi đặt cạnh câu mình muốn hỏi. Chỗ hai câu lệch nhau là chỗ sẽ lọt lỗi — ghi
nó vào comment ngay, đừng chờ phát hiện lại.

Hệ quả cho gate: `check-publish` là hàng rào cho những gì máy đo được. Nó
không thay được khâu đọc nguồn, và comment trong nó phải nói rõ điều đó để
lần sau không ai tin nhầm.

---

## Chặn hay cảnh báo: hỏi "sửa sau đắt hơn bao nhiêu", không hỏi "giá trị bây giờ"

`entityId` có một nửa giá trị chưa hiện thực hoá — chưa có route learning path,
`getPrerequisites` viết xong mà không component nào gọi. Xét theo giá trị hiện
tại thì nên hạ xuống mức cảnh báo, nhất là khi nó đang chặn 41/41 bài.

Vẫn để CHẶN, vì lý do nằm ở chiều thời gian: gắn entity **sau** đắt hơn hẳn
gắn lúc viết — lúc đó phải đọc lại bài để biết nó trình bày khái niệm nào,
còn lúc viết thì người viết đã biết.

Ngược lại, ảnh bìa thiếu ghi công chỉ là CẢNH: chạy `images:credit` sau rẻ y
như chạy bây giờ.

Ranh giới là **"nợ đo được"** với **"nợ phải đào lại"**, không phải mức độ
quan trọng của trường dữ liệu.

---

## Gỡ một khối hiển thị thì tìm xem có gì đang khai báo về nó

Một commit gỡ khối trạng thái thẩm định khỏi trang bài viết vì nó cồng kềnh.
Một commit khác phát `reviewedBy` + `dateReviewed` trong JSON-LD làm tín hiệu
E-E-A-T. **Cả hai đúng riêng lẻ.** Ghép lại thì site khai dữ liệu không hiển
thị — vi phạm đúng cái luật viết ngay đầu `lib/seo.ts`: *"chỉ khai báo những
gì thật sự hiện trên trang"*.

Không ai sai. Quyết định thứ hai không biết quyết định thứ nhất phụ thuộc vào
nó, và không có gì trong quy trình bắt nó phải biết.

Quy tắc: trước khi gỡ một khối khỏi giao diện, `grep` tên trường của nó trong
`lib/seo.ts` và mọi chỗ sinh metadata. Dữ liệu bị gỡ khỏi mắt người đọc mà còn
nguyên trong lời khai với máy là một dạng nói dối có hệ thống, và nó im lặng —
không lỗi, không cảnh báo, chỉ có chế tài về sau.

---

## Lệnh sửa chạy xong mà không đổi gì là bằng chứng, không phải thất bại

`npm ci` trên CI báo `package.json` và `package-lock.json` lệch nhau, kèm đúng
một lời khuyên: chạy `npm install`. Chủ dự án chạy, rồi báo vẫn hỏng.

Dữ kiện quyết định nằm ở chỗ không ai để ý: `git status` **sạch**. `npm install`
đã chạy và không sửa một byte nào của lock file. Nghĩa là ở máy đó, hai file
*đang* khớp — nên mọi cách sửa dữ liệu đều vô nghĩa, kể cả sinh lại lock.

Chỗ lệch là công cụ, không phải dữ liệu: npm 12 ở máy không còn ghi `overrides`
vào entry gốc của lock, còn npm 10 mà `setup-node` kèm theo Node 22 vẫn đòi
trường đó. Lock không sai — `postcss@8.5.26` và `deepmerge-ts@8.0.2` đều đã được
áp đúng.

Quy tắc: khi lệnh-được-khuyên-dùng chạy xong mà không tạo ra thay đổi nào, đừng
chạy lại và đừng đổi cách sửa dữ liệu. Đó là câu trả lời "dữ liệu ở đây vốn đã
đúng", và câu hỏi tiếp theo phải là **hai bên có đang dùng cùng phiên bản công
cụ không**. Sửa ở phía CI, vì lock còn được viết lại bằng npm ở máy — chỗ đứng
yên nằm ở nơi ít thay đổi hơn.

---

## Giới hạn mà tác nhân nhìn thấy được sẽ định hình công việc, không canh gác nó

Trần chi phí đặt cho một lượt chạy pipeline. Bốn lượt liên tiếp:

| Trần | Chi phí | Kết cục |
|---|---|---|
| $3 | $0.88 | hàng đợi đang bị chặn |
| $4 | $3.66 | **"ngân sách phiên gần cạn nên dừng ở đây"** |
| $5 | $4.32 | xong |
| $5 | $5.04 | chạm trần, cắt giữa chừng |

Chi phí luôn dừng sát ngay dưới trần, dù trần là bao nhiêu. Agent **đọc được**
ngân sách còn lại rồi tự cắt việc — lượt thứ hai nói thẳng ra điều đó. Nâng $5
lên $6 chỉ dời chỗ nó dừng lên $5.9.

Quy tắc: một giới hạn mà tác nhân quan sát được sẽ trở thành mục tiêu nó nhắm
tới, không phải rào chắn nó vô tình chạm. Muốn nó là rào chắn thì đặt xa tới mức
công việc bình thường không bao giờ nhìn thấy — hoặc bỏ hẳn và canh bằng đại
lượng nó không đọc được, ở đây là `timeout-minutes` của runner.

Hệ quả riêng cho gói đăng ký: con số USD không phải tiền, chỉ là ước tính quy
đổi. Đặt "trần chi phí" sát chi phí thật là dựng một cái đích chứ không dựng
một cái phanh.

---

## Cảnh báo trong code mô tả bối cảnh của nó, không mô tả hệ thống của bạn

`publish.ts` có một chú thích dài cảnh báo rằng bỏ qua reindex là "hỏng im lặng:
bài đã lên site nhưng tìm không ra". Lượt chạy trên Actions rơi đúng vào nhánh
nuốt lỗi đó. Tôi đọc chú thích, kết luận đây là cái bẫy nó cảnh báo, và commit
một bản sửa truyền secret Meilisearch vào workflow.

`docs/DEPLOY-VERCEL.md` nói ngược lại ở ba chỗ: *"tìm kiếm chạy bằng full-text
search của Postgres nên không cần host Meilisearch"*, `MEILISEARCH_HOST` —
*"Bỏ trống trên Vercel"*. Nhánh nuốt lỗi **chính là đường chạy đúng** của
production. Commit bị gỡ.

Quy tắc: chú thích cảnh báo được viết trong một bối cảnh cụ thể và thường không
nói ra bối cảnh ấy. Trước khi hành động theo một cảnh báo trong code, kiểm tài
liệu triển khai xem bối cảnh đó có tồn tại trên hệ thống thật không. Một câu
"hỏng im lặng" viết cho môi trường A là mô tả hành vi đúng ở môi trường B.

---

## Câu hỏi không kèm cách kiểm chứng sẽ nhận về một phỏng đoán

Tôi hỏi "production có đặt `MEILISEARCH_HOST` không?" và đưa hai lựa chọn. Nhận
được "có đặt". Tôi dựng bản sửa trên câu trả lời đó.

Câu trả lời sai — và sai một cách dự đoán được, vì tôi hỏi một điều nằm trong
bảng cấu hình Vercel mà không kèm cách mở bảng đó ra xem. Người trả lời không
nói dối; họ ước lượng, đúng như bất kỳ ai bị hỏi một câu không tra cứu được
ngay. Dấu hiệu lộ ra một lượt sau: họ hỏi "hai biến đó lấy ở đâu" — người đã
đặt biến thì không hỏi câu ấy.

Quy tắc: trước khi hỏi, tự trả lời bằng repo nếu trả lời được — ở đây
`DEPLOY-VERCEL.md` đã có sẵn đáp án và tôi chưa đọc. Nếu buộc phải hỏi, đính kèm
cách kiểm: một lệnh, một đường dẫn tới đúng trang cấu hình, hoặc một lựa chọn
"chưa biết, kiểm giúp". Nó nối với mục *"Đưa người báo lỗi một phép kiểm cho ra
true/false"* ở trên: quy tắc đó cho chẩn đoán lỗi, quy tắc này cho **mọi câu hỏi
về trạng thái hệ thống**.

---

## So mốc thời gian với lúc BẮT ĐẦU, không lúc kết thúc

Bước gửi Telegram đã lên `main` lúc 21:34. Bài mới được publish lúc 21:58. Không
có thông báo nào. Nhìn hai con số thì bước gửi đã có mặt trước 24 phút, nên
nghi ngờ đổ sang secret sai.

Workflow được đọc **lúc lượt chạy khởi động**, không lúc nó kết thúc. API công
khai của GitHub cho con số dứt điểm: lượt đó bắt đầu 14:26:53Z — tức 21:26 giờ
Việt Nam, sớm hơn commit 8 phút — và danh sách bước của nó chỉ có 9 mục, không
có bước loan báo nào. Secret không sai; workflow lúc ấy chưa có chỗ nào để gửi.

Quy tắc: với mọi tiến trình chạy dài — lượt CI, job nền, agent — mốc để so là
thời điểm **bắt đầu**, vì đó là lúc nó chụp lại cấu hình và sống với bản chụp ấy
tới hết đời. Push giữa chừng không cứu được lượt đang chạy. Và với repo public,
`api.github.com/repos/<owner>/<repo>/actions/runs` trả lời được điều này mà
không cần đăng nhập — đọc nó trước khi suy luận về thời gian.

---

## Hàng đợi phải phân biệt "đã có" với "đã xong"

Prompt của pipeline dặn: lấy chủ đề tiếp theo trong `topic-queue.md`, **bỏ qua
dòng nào đã có bài**. Một lượt chạy bị trần chi phí cắt giữa chừng để lại
`ba-dinh-luat-newton` ở trạng thái DRAFT — đã qua fact-check, đã được editor
duyệt, đủ nguồn, đủ link, chỉ thiếu đúng bước 11.

Với hàng đợi thì chủ đề đó "đã có bài". Không lượt nào sau đó nhặt lại. Nếu tôi
không truy vấn tay thì nó nằm đó vĩnh viễn, và $5 công đã bỏ ra mất trắng.

Bước rà cuối cũng không cứu được: `publish:check` không kèm `--draft` chỉ nhìn
bài đã PUBLISHED — mù đúng với thứ mà một lượt bị cắt tạo ra.

Quy tắc: trong mọi quy trình có thể bị cắt giữa chừng, "đã tồn tại" không được
phép đồng nghĩa với "đã hoàn thành". Hàng đợi phải đọc **trạng thái**, không đọc
sự tồn tại; và bước kiểm tra sau sự cố phải nhìn được **trạng thái trung gian**,
vì đó chính là dấu vết mà sự cố để lại. Hệ quả thứ ba: việc dở phải được nhặt
lại *trước* khi nhận việc mới, nếu không mỗi lần bị cắt lại thêm một món nợ
không ai đòi.
