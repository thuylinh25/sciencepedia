## Bối cảnh

Tiếp PR #162 (P2, mục 1–2: đánh dấu đích + bay vào đúng điểm). PR này làm **mục 3** — phần bản mô tả P2 ghi "tuỳ chọn, làm sau": trước khi lao, camera trượt khoảng 300 ms cho đích về giữa khung, để cú lao luôn ở giữa và dễ nhìn hơn; đồng thời là phương án cứu khi người xem đã kéo xoay cho đích ra khỏi khung.

## Cách làm

**`CenterTargetRig`** (mới, `src/components/zoom/center-target-rig.tsx`): một rig trong canvas của mỗi cảnh. Khi nhận lệnh, rig tịnh tiến cả camera lẫn tâm OrbitControls theo vector `đích − tâm hiện tại` trong 300 ms (easeInOutQuad) — trượt thuần, không xoay không phóng, nên người xem không mất phương hướng. Trong lúc trượt, điều khiển bị khoá để người xem không giành camera với rig.

**Vị trí 3D của đích**: `TargetTracker` (PR #162) ghi thêm vị trí thế giới của đích vào `worldRef` mỗi khung, TRƯỚC mọi kiểm tra màn hình — đích ở sau camera vẫn có toạ độ 3D, và đó chính là ca rig cần nhất. Ba cảnh tạo `worldRef` nội bộ, nhận thêm prop `centerRef` tuỳ chọn và chỉ gắn rig khi được truyền; trang mô hình riêng không đổi hành vi. Cảnh Hệ Mặt Trời thêm `makeDefault` cho OrbitControls để rig lấy được điều khiển qua state (đã kiểm: không component nào trong cây đó đọc `state.controls`).

**Hành trình**: mọi thao tác đổi cấp (cuộn, phím, nút, thanh cấp, vòng đích) đi qua cửa ngõ mới `requestGo`. Thu vào: ra lệnh trượt, chờ 300 ms + đệm 60 ms, rồi mới `go()` — lúc đó đích đã ở gần đúng tâm và cú lao thẳng vào giữa. Trong lúc chờ, yêu cầu đổi cấp mới bị bỏ qua. Không trượt khi: chiều lùi ra (cảnh cha chưa gắn; mạch của chiều ra là "mọc ra từ vị trí cũ"), người xem bật giảm chuyển động, hoặc cảnh không có rig — các ca đó giữ nguyên hành vi của PR #162. Khoá cuộn được cộng thêm thời gian trượt cho chiều vào.

Hệ quả phụ đáng giá: ca "đích ra khỏi khung" của bản mô tả trước đây lùi về bay vào tâm mù; nay rig trượt theo vị trí 3D đưa đích về giữa được trong mọi trường hợp, nên cú lao vẫn đúng mạch.

## Kiểm chứng

- typecheck / lint sạch, test 86/86.
- QA bản xem trước: ở Ngân Hà, ghi vị trí Mặt Trời → bấm Thu vào → trong ~0,3 s đầu cấp vẫn là Ngân Hà nhưng Mặt Trời đã trượt về gần tâm → sau đó mới lao sang Hệ Mặt Trời. Kiểm thêm chiều lùi ra và lượt thu vào không kéo xoay trước.
