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
  /** Chú thích trên tấm bìa, ngay trên nút mở */
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
        // Quả cầu chiếm khoảng 91 độ trong khung. Ở chế độ thiên thể đây là
        // bề CAO (xem `fovForFrame`), nên 110 để lại một vành lề quanh nó và
        // giữ nguyên như vậy khi bấm toàn màn hình.
        fovDeg: 110,
        survey: surface.hipsUrl,
        planetary: true,
      }}
      label={t("surfaceLabel", { body: name })}
      activation="click"
      fullscreenInfo={info}
      crumbRoot={crumbRoot}
      crumbCurrent={name}
      openOnEventId={bodyId}
      posterCaption={caption}
      posterBackground={
        <Image
          src={photo.url}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      }
      className="aspect-square"
    />
  );
}
