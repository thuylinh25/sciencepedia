/**
 * Hình nền cột phải trang đăng nhập: một quyển sách mở, quỹ đạo nguyên tử và
 * một vầng sáng vàng.
 *
 * ## Vì sao là SVG tự vẽ chứ không phải một tấm ảnh
 *
 * Một tấm ảnh minh hoạ cùng phong cách hoặc là ảnh stock có điều kiện ghi công
 * — tức thêm một dòng ghi công vào đúng trang mà cả thiết kế đang cố giữ cho
 * sạch — hoặc là ảnh sinh bằng máy, thứ mà một bách khoa khoa học không nên
 * dán lên trang của chính mình mà không nói ra. SVG tự vẽ không vướng gì cả,
 * sắc nét ở mọi độ phân giải, đổi màu theo token, và nặng vài KB.
 *
 * ## Ý nghĩa của hình, không phải trang trí ngẫu nhiên
 *
 * Sách mở = tri thức chép lại được. Quỹ đạo electron = khoa học. Vầng sáng
 * vàng = màu thương hiệu, và nó đứng ở vị trí mặt trời mọc phía sau trang
 * sách. Ba thứ ấy là chính câu mà trang này đang nói.
 *
 * ## Ràng buộc tương phản
 *
 * Hình nằm ở GÓC DƯỚI PHẢI và câu trích nằm ở giữa-trái. Đó không phải bố cục
 * tuỳ hứng: chữ trắng đè lên vùng sáng nhất của hình sẽ mất tương phản, nên
 * hai thứ phải tách nhau ra. Ai dịch hình vào giữa thì phải hạ độ sáng của nó
 * xuống, không thì câu trích không đọc được nữa.
 *
 * `aria-hidden`: đây là trang trí. Nó không mang thông tin nào mà câu trích
 * chưa nói.
 */
export function AuthArtwork({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Vầng sáng lớn sau sách — nguồn sáng ngầm của cả khối */}
        <radialGradient id="aw-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4d8dff" stopOpacity="0.5" />
          <stop offset="55%" stopColor="#2563c9" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0b1a3a" stopOpacity="0" />
        </radialGradient>

        {/* Mặt trang sách: sáng ở gáy, tối dần ra mép ngoài */}
        <linearGradient id="aw-page-l" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cfe2ff" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#6aa4f5" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#1e4796" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="aw-page-r" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8f1ff" stopOpacity="0.98" />
          <stop offset="45%" stopColor="#7db0f8" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#1e4796" stopOpacity="0.45" />
        </linearGradient>

        {/* Quỹ đạo: sáng ở một đầu cung rồi tắt dần, để vòng tròn trông như
            đang quay chứ không phải một đường viền kín */}
        <linearGradient id="aw-orbit" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8fc2ff" stopOpacity="0" />
          <stop offset="40%" stopColor="#8fc2ff" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#8fc2ff" stopOpacity="0.05" />
        </linearGradient>

        <radialGradient id="aw-sun" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffe9a3" />
          <stop offset="55%" stopColor="#f5c518" />
          <stop offset="100%" stopColor="#d99a06" />
        </radialGradient>

        <filter id="aw-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id="aw-tight" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* ── Vầng sáng nền ────────────────────────────────────────────── */}
      <ellipse cx="330" cy="400" rx="290" ry="230" fill="url(#aw-glow)" />

      {/* ── Quỹ đạo, phía trên bên phải ──────────────────────────────
          Ba ellipse cùng tâm, xoay lệch nhau — hình nguyên tử quy ước.
          Bề dày mảnh (1.5) vì chúng là nền: dày hơn thì chúng tranh chỗ với
          câu trích ở nửa trái. */}
      <g transform="translate(430 205)" stroke="url(#aw-orbit)" strokeWidth="1.5">
        <ellipse rx="150" ry="56" transform="rotate(-24)" />
        <ellipse rx="150" ry="56" transform="rotate(36)" />
        <ellipse rx="150" ry="56" transform="rotate(90)" />
      </g>

      {/* Electron trên quỹ đạo. Vị trí đặt tay chứ không tính — chúng chỉ cần
          nằm TRÊN đường cong và không chụm vào nhau. */}
      <g>
        <circle cx="566" cy="172" r="9" fill="#bcd9ff" filter="url(#aw-tight)" />
        <circle cx="566" cy="172" r="5" fill="#eaf3ff" />
        <circle cx="332" cy="243" r="7" fill="#8fc2ff" filter="url(#aw-tight)" />
        <circle cx="332" cy="243" r="3.5" fill="#dcebff" />
        <circle cx="452" cy="96" r="5" fill="#8fc2ff" opacity="0.8" />
      </g>

      {/* ── Mặt trời vàng, nhô lên sau mép sách ──────────────────────── */}
      <circle cx="505" cy="352" r="52" fill="#f5c518" opacity="0.35" filter="url(#aw-soft)" />
      <circle cx="505" cy="352" r="33" fill="url(#aw-sun)" />

      {/* ── Quyển sách ────────────────────────────────────────────────
          Gáy ở (300, 452). Hai trang toả ra hai bên, mép ngoài rủ xuống —
          dáng của một quyển sách mở nhìn chếch từ trên.

          Vẽ các tờ phía sau TRƯỚC rồi mới tới mặt trên, để lớp sau không đè
          lên lớp trước. Mỗi tờ lệch dần lên và ra ngoài, tạo hiệu ứng xoè. */}
      <g>
        {/* Tờ xoè phía sau, bên trái */}
        <path
          d="M300 452 C238 414 150 382 66 398 C62 420 60 446 58 470 C146 462 240 470 300 486 Z"
          fill="#2b5bb5"
          opacity="0.3"
          transform="translate(-14 -26) rotate(-4 300 452)"
        />
        <path
          d="M300 452 C238 414 150 382 66 398 C62 420 60 446 58 470 C146 462 240 470 300 486 Z"
          fill="#3568c9"
          opacity="0.45"
          transform="translate(-7 -13) rotate(-2 300 452)"
        />
        {/* Tờ xoè phía sau, bên phải */}
        <path
          d="M300 452 C362 414 450 382 534 398 C538 420 540 446 542 470 C454 462 360 470 300 486 Z"
          fill="#2b5bb5"
          opacity="0.3"
          transform="translate(14 -26) rotate(4 300 452)"
        />
        <path
          d="M300 452 C362 414 450 382 534 398 C538 420 540 446 542 470 C454 462 360 470 300 486 Z"
          fill="#3568c9"
          opacity="0.45"
          transform="translate(7 -13) rotate(2 300 452)"
        />

        {/* Hai mặt trang trên cùng */}
        <path
          d="M300 452 C238 414 150 382 66 398 C62 420 60 446 58 470 C146 462 240 470 300 486 Z"
          fill="url(#aw-page-l)"
        />
        <path
          d="M300 452 C362 414 450 382 534 398 C538 420 540 446 542 470 C454 462 360 470 300 486 Z"
          fill="url(#aw-page-r)"
        />

        {/* Gáy sách: một vệt sáng mảnh nơi hai trang gặp nhau. Thiếu nó thì
            hai trang đọc ra như hai cánh rời chứ không phải một quyển sách. */}
        <path
          d="M300 452 L300 486"
          stroke="#eaf3ff"
          strokeWidth="2.5"
          strokeOpacity="0.85"
          strokeLinecap="round"
        />

        {/* Ánh sáng hắt lên từ giữa sách — nguồn của cả vầng sáng phía trên */}
        <ellipse cx="300" cy="450" rx="120" ry="30" fill="#cfe2ff" opacity="0.22" filter="url(#aw-soft)" />
      </g>

      {/* ── Bụi sáng lơ lửng ──────────────────────────────────────────
          Thưa và không đều. Rải đều thì nó đọc ra là hoa văn, không phải bụi. */}
      <g fill="#cfe2ff">
        <circle cx="232" cy="318" r="2.5" opacity="0.55" />
        <circle cx="186" cy="404" r="2" opacity="0.4" />
        <circle cx="392" cy="288" r="2" opacity="0.45" />
        <circle cx="540" cy="262" r="2.5" opacity="0.5" />
        <circle cx="270" cy="196" r="1.8" opacity="0.35" />
        <circle cx="486" cy="470" r="2.2" opacity="0.4" />
      </g>
    </svg>
  );
}
