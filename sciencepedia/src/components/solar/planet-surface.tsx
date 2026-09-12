"use client";

import type { ReactNode } from "react";

import Image from "next/image";
import { useTranslations } from "next-intl";

import type { BodyPhoto, BodySurface } from "@/lib/solar-data";
import { AladinViewer } from "@/components/sky/aladin-viewer";

/**
 * Ảnh chụp một thiên thể, bấm vào thì mở bản đồ bề mặt tương tác.
 *
 * ## Vì sao ảnh tĩnh vẫn là lớp thứ nhất
 *
 * Tấm ảnh không phải chỗ giữ chỗ. Nó là nội dung có giá trị tự thân: nằm
 * trong HTML đầu tiên, không cần WebGL, không cần JavaScript, công cụ tìm
 * kiếm đọc được, và người chỉ lướt qua thì chỉ trả giá bằng đúng một tấm ảnh.
 * Aladin — khoảng 1 MB script cộng ô tile — chỉ chạy khi có người bấm.
 *
 * Đó cũng là lý do `activation="click"` chứ không phải `"visible"`: lưới này
 * có tới chín thẻ, để chúng tự nạp khi cuộn tới thì một lần cuộn hết trang là
 * chín instance WebGL cùng sống.
 *
 * ## Vì sao mỗi thẻ là một instance riêng
 *
 * Mỗi HiPS bề mặt gắn với một thiên thể khác nhau (`hips_body`), và Aladin
 * quyết định hệ toạ độ ở lúc khởi tạo. Đổi survey trên một instance đang sống
 * sẽ bắt nó nhảy giữa hai hệ toạ độ — rẻ hơn nhiều nếu ai muốn xem hành tinh
 * nào thì dựng riêng cho hành tinh đó.
 */
export function PlanetSurface({
  name,
  photo,
  surface,
  caption,
  info,
  crumbRoot,
  bodyId,
  priority,
  sizes,
}: {
  /** Tên hiển thị, dùng cho `alt` và nhãn trình đọc màn hình */
  name: string;
  photo: BodyPhoto;
  surface: BodySurface;
  /**
   * Nhãn trên tấm bìa — chỉ là TÊN thiên thể, không phải một câu hướng dẫn.
   *
   * Nút "Mở bản đồ" ngay cạnh đã nói việc cần làm; thêm một câu nữa giải
   * thích cùng điều đó là nói hai lần, và lần thứ hai nằm đè lên ảnh.
   */
  caption: string;
  /**
   * Khối thông tin để hiện khi người xem bấm toàn màn hình.
   *
   * Dựng sẵn ở `PlanetGallery` — một Server Component — rồi truyền xuống đây
   * dưới dạng JSX. Nhờ vậy phần chữ trong thẻ và phần chữ trong toàn màn hình
   * đến từ đúng một chỗ, và không phải kéo next-intl vào lớp client này chỉ để
   * dịch lại đúng những nhãn vừa dịch xong ở trên.
   */
  info?: ReactNode;
  /** Nhánh gốc của breadcrumb khi toàn màn hình, thường là "Hệ Mặt Trời" */
  crumbRoot: string;
  /** Id thiên thể, để dải "Khám phá tiếp" ở thẻ khác mở được thẻ này */
  bodyId: string;
  priority?: boolean;
  sizes: string;
}) {
  const t = useTranslations("solar");

  return (
    <AladinViewer
      view={{
        // Chế độ thiên thể: đây là kinh độ 0, vĩ độ 0 trên chính bề mặt đó,
        // không phải một điểm trên thiên cầu.
        ra: 0,
        dec: 0,
        /*
         * 180 độ, không phải 110.
         *
         * Ở chế độ thiên thể, mặt cầu nhìn từ ngoài trải đúng 180 độ trong
         * phép chiếu — nên fov nhỏ hơn 180 là cắt bớt quả cầu, và cắt đúng
         * hai cực vì đó là chỗ xa tâm nhất theo chiều dọc.
         *
         * Giá trị cũ là 110 với lập luận "chừa một vành lề". Lập luận đó dựa
         * trên con số 91 độ, vốn là bề rộng biểu kiến của một hành tinh nhìn
         * từ xa trên NỀN TRỜI — không phải bề rộng của chính mặt cầu khi
         * Aladin trải nó ra. Nó chạy đúng một thời gian chỉ vì `fovForFrame`
         * nhân fov với tỉ lệ khung, và lúc mount thì khung `aspect-square`
         * chưa có chiều cao cuối nên tỉ lệ đo được đủ rộng để kết quả bị chặn
         * về 180. Từ khi mở thẳng ở chế độ toàn màn hình, phép đo rơi vào
         * khung đã vuông, ra đúng 110, và quả cầu khuyết trên khuyết dưới.
         *
         * Aladin chặn cứng fov ở 180 trong phép chiếu cầu, nên đặt 180 là
         * vừa khít chứ không tràn.
         */
        fovDeg: 180,
        survey: surface.hipsUrl,
        planetary: true,
      }}
      label={t("surfaceLabel", { body: name })}
      activation="click"
      fullscreenInfo={info}
      crumbRoot={crumbRoot}
      crumbCurrent={name}
      openOnEventId={bodyId}
      openFullscreen
      canSpin
      posterCaption={caption}
      posterBackground={
        <Image
          src={photo.url}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          /* `object-contain` chứ KHÔNG `object-cover`.

             Đây là tấm poster hiện TRƯỚC khi người xem bấm vào, tức là thứ họ
             thấy trong lưới thư viện. `cover` phóng ảnh cho phủ kín khung rồi
             cắt phần thừa, nên với ảnh không vuông thì đĩa thiên thể bị xén —
             Mặt Trời, Sao Thuỷ và Sao Kim mất gần nửa hình cầu.

             `p-[7%]` chừa một vành lề đều quanh đĩa, nên thiên thể chiếm chừng
             86% bề ngang khung thay vì chạm sát mép. Nền sau ảnh cùng màu tối
             nên phần letterbox không đọc ra là letterbox. */
          className="object-contain p-[7%]"
        />
      }
      className="aspect-square"
    />
  );
}
