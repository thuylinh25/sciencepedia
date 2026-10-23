/**
 * Đệm ảnh thu nhỏ của góc nhìn trong IndexedDB của trình duyệt.
 *
 * Ảnh chụp từ chính mô hình ở client (anatomy-scene, "Ảnh thu nhỏ của góc
 * nhìn"): mỗi ảnh là một lượt vẽ cả mô hình (~150 ms trên GPU tích hợp) và cần
 * gần đủ hình học. Không đệm thì MỖI lần mở lưới chụp lại cả trăm ảnh — người
 * đọc nhìn "Đang dựng ảnh…" hàng chục giây (2026-10-21). Đệm theo khoá nội
 * dung nên lần sau hiện ngay, không phải tải khối chỉ để chụp.
 *
 * Khoá = phiên bản dữ liệu + dấu vân danh mục khối + định nghĩa góc nhìn + mã
 * mảnh của nó: đổi một trong số đó thì ảnh cũ tự bị bỏ. Đổi CÁCH VẼ ảnh (vật
 * liệu, khung, cỡ) thì code không tự biết — tăng `THUMB_STYLE`.
 *
 * Mọi lỗi (chế độ riêng tư, chặn dữ liệu trang) đều nuốt: thiếu đệm chỉ là chụp lại.
 */

import { assetUrl } from "@/lib/asset";

import prebaked from "./thumbnails.generated.json";

/**
 * Tăng khi đổi cách `renderThumbnail` vẽ — ảnh đệm cũ sẽ bị bỏ. Tăng rồi thì
 * chụp sẵn lại (`npm run atlas:thumbs`), không thì mọi thẻ về chụp ở client.
 */
export const THUMB_STYLE = 2;

/*
 * Ảnh chụp sẵn trên R2 (2026-10-21). Đệm IndexedDB chỉ giúp lần SAU: lần đầu
 * một trình duyệt mở lưới vẫn phải tải gần đủ hình học rồi vẽ ~180 ảnh, ~1 ảnh/s
 * trên GPU tích hợp. `scripts/bake-atlas-thumbnails.ts` chụp tất cả bằng chính
 * cảnh này (trình duyệt headless, GPU thật), đẩy lên R2 theo dấu vân nội dung
 * và ghi bản kê dưới đây. Cảnh chỉ dùng ảnh có khoá khớp `thumbKey` — góc nhìn
 * hay dữ liệu đổi mà chưa chụp lại thì thẻ ấy tự về chụp ở client, không sai ảnh.
 */
const PREBAKED = prebaked as Record<string, { key: string; file: string }>;

/** URL ảnh chụp sẵn của một góc nhìn, nếu khoá còn khớp. */
export function prebakedThumbnail(id: string, key: string | null): string | null {
  const entry = PREBAKED[id];
  return entry && key && entry.key === key ? assetUrl(`human-atlas/thumbs/${entry.file}`) : null;
}

const DB = "sciencepedia-atlas";
const STORE = "thumbnails";

type Entry = { id: string; key: string; url: string };

/** FNV-1a 32 bit — đủ để phân biệt phiên bản, không dùng cho bảo mật. */
export function fingerprint(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Ảnh đệm còn khớp khoá, theo id góc nhìn. */
export async function readThumbnails(keyOf: (id: string) => string | null): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  try {
    const db = await open();
    const all = await new Promise<Entry[]>((resolve, reject) => {
      const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result as Entry[]);
      request.onerror = () => reject(request.error);
    });
    db.close();
    for (const entry of all) {
      if (entry && keyOf(entry.id) === entry.key) found.set(entry.id, entry.url);
    }
  } catch {
    // Không đọc được đệm: chụp lại từ đầu.
  }
  return found;
}

export async function writeThumbnail(id: string, key: string, url: string): Promise<void> {
  try {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ id, key, url } satisfies Entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Đệm đầy / bị chặn: lần sau chụp lại.
  }
}
