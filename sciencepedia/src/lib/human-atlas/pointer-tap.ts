/**
 * Phân biệt một cú chạm với thao tác xoay, chụm, kéo hay chạm bị huỷ.
 *
 * Port từ Human Atlas (MIT, © 2026 ashemag). Không có lớp này thì nhấc ngón
 * tay sau khi xoay mô hình cũng bị tính là "chọn cấu trúc" — trên điện thoại
 * nghĩa là cứ xoay xong là bảng chi tiết bật lên.
 */
export class PointerTap {
  private active = new Map<number, { x: number; y: number; threshold: number }>();
  private blocked = false;

  down(id: number, x: number, y: number, threshold: number) {
    if (this.active.size === 0) this.blocked = false;
    this.active.set(id, { x, y, threshold });
    if (this.active.size > 1) this.blocked = true;
  }

  move(id: number, x: number, y: number) {
    const start = this.active.get(id);
    if (start && Math.hypot(x - start.x, y - start.y) > start.threshold) {
      this.blocked = true;
    }
  }

  up(id: number, x: number, y: number) {
    this.move(id, x, y);
    const tap = this.active.has(id) && this.active.size === 1 && !this.blocked;
    this.active.delete(id);
    return tap;
  }

  cancel(id: number) {
    this.active.delete(id);
    this.blocked = true;
  }
}
