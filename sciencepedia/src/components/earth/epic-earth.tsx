"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";

/**
 * Trái Đất toàn cảnh từ camera EPIC trên vệ tinh DSCOVR.
 *
 * DSCOVR đứng ở điểm Lagrange L1, cách Trái Đất 1,5 triệu km trên đường nối
 * Trái Đất với Mặt Trời, nên nó luôn nhìn thấy đúng nửa đang được chiếu sáng.
 * Mỗi ngày EPIC gửi về hơn chục ảnh của cùng một bán cầu ở các thời điểm khác
 * nhau; ghép chúng lại thì thấy Trái Đất tự quay.
 */

type EpicImage = {
  identifier: string;
  caption: string;
  image: string;
  /** Dạng "YYYY-MM-DD HH:MM:SS", giờ UTC */
  date: string;
};

type Frame = {
  identifier: string;
  url: string;
  caption: string;
  /** Thời điểm chụp, đã parse */
  takenAt: Date;
};

type Status = "loading" | "ready" | "empty" | "error";

/**
 * Chu kỳ đổi khung hình, mili giây.
 *
 * 250 ms là con số ban đầu và nó gây chóng mặt thật, vì lý do nằm ở khoảng
 * cách giữa hai khung chứ không ở tốc độ phát: EPIC chụp một đến hai giờ một
 * lần, nên mỗi khung Trái Đất đã quay thêm 15–30 độ. Phát chúng cách nhau
 * 250 ms là khoảng 100 độ mỗi giây — nhanh gấp hơn hai nghìn lần thực tế, và
 * mắt đọc ra cú giật chứ không ra chuyển động.
 *
 * Đã hạ hai lần: 250 → 900 → 1600. Ở 900 ms vẫn còn 25 độ mỗi giây, nhanh
 * gấp hơn sáu trăm lần thực tế và vẫn bị báo là chóng mặt.
 *
 * 1600 ms cho khoảng 14 độ mỗi giây, một vòng 13 khung hết 21 giây. Vẫn
 * không phải tốc độ thật — một vòng đúng tỉ lệ mất 24 giờ — nhưng đủ chậm để
 * mắt bám được một đám mây từ khung này sang khung sau.
 */
const FRAME_MS = 1600;

/**
 * Tuổi của TẤM ẢNH đang xem.
 *
 * Trang mang tên "nhìn từ điểm L1" chứ không còn là "thời gian thực", và cái
 * tên đó đổi vì một lý do đo được: EPIC chụp liên tục nhưng NASA phát hành
 * chậm — lúc kiểm ngày 11/09/2026 thì bộ ảnh mới nhất là của 08/09, tức đã
 * 3,3 ngày tuổi, và bộ enhanced còn cũ hơn một ngày nữa.
 *
 * Dòng này nói ra con số đó thay vì để người đọc tự suy từ ngày chụp. Không
 * có nó thì "Ngày chụp 08/09" nằm cạnh một trang nói "thời gian thực" là hai
 * thông tin mâu thuẫn nhau mà không ai hoà giải.
 */
function formatAge(takenAt: Date, vi: boolean): string {
  const hours = (Date.now() - takenAt.getTime()) / 3600000;
  if (hours < 1) return vi ? "dưới một giờ" : "under an hour";
  if (hours < 48) {
    const rounded = Math.round(hours);
    return vi ? `${rounded} giờ` : `${rounded} hours`;
  }
  const days = Math.round(hours / 24);
  return vi ? `${days} ngày` : `${days} days`;
}

/** Cache còn hiệu lực bao lâu. EPIC cập nhật vài giờ một lần. */
const CACHE_TTL_MS = 3 * 60 * 60 * 1000;

const CACHE_KEY = "sciencepedia:epic-natural:v1";

/**
 * Hai đường lấy dữ liệu, thử theo thứ tự.
 *
 * `api.nasa.gov` là cổng chính thức nhưng `DEMO_KEY` bị chặn ở 30 lượt mỗi
 * giờ trên mỗi địa chỉ IP — và vì đây là fetch từ trình duyệt người đọc, một
 * văn phòng dùng chung IP sẽ đốt hết hạn mức đó trong vài phút, rồi cổng trả
 * về trang HTML lỗi chứ không phải JSON.
 *
 * `epic.gsfc.nasa.gov` là chính máy chủ phát dữ liệu, không đòi khoá và không
 * có hạn mức ấy. Để nó làm đường dự phòng thì khối này vẫn sống khi hạn mức
 * cạn. Có khoá thật thì đặt \`NEXT_PUBLIC_NASA_API_KEY\`.
 */
const ENDPOINTS = [
  `https://api.nasa.gov/EPIC/api/natural/images?api_key=${
    process.env.NEXT_PUBLIC_NASA_API_KEY ?? "DEMO_KEY"
  }`,
  "https://epic.gsfc.nasa.gov/api/natural",
];

/**
 * Dựng URL ảnh từ một bản ghi EPIC.
 *
 * Kho ảnh xếp theo ngày chụp, và ngày đó nằm trong chính trường `date` chứ
 * không ở đâu khác — nên phải tách từ chuỗi đó, không được lấy ngày hôm nay:
 * ảnh mới nhất thường là của hôm qua theo giờ UTC.
 *
 * Dùng bản `jpg` (1024 px) chứ không phải `png` (2048 px). Khối này preload
 * TOÀN BỘ khung hình trước khi chạy, mà 13 ảnh png là 8,8 MB — trên 4G đó là
 * nửa phút chờ và một khoản dữ liệu không xin phép. Bản jpg là 2,7 MB cho cả
 * loạt, và ở khung rộng nhất 520 px thì 1024 px đã thừa nét.
 */
function buildImageUrl(image: EpicImage, variant: "jpg" | "png" = "jpg"): string {
  const [datePart] = image.date.split(" ");
  const [year, month, day] = datePart.split("-");
  return `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/${variant}/${image.image}.${variant}`;
}

/** "YYYY-MM-DD HH:MM:SS" của NASA là giờ UTC; chuỗi trần thì JS đoán sai múi. */
function parseEpicDate(date: string): Date {
  return new Date(`${date.replace(" ", "T")}Z`);
}

function formatDateUtc(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatTimeUtc(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
}

/** Chỉ giữ ảnh của ngày mới nhất trong danh sách trả về. */
function latestDayOnly(images: EpicImage[]): EpicImage[] {
  if (images.length === 0) return [];
  const days = images.map((item) => item.date.split(" ")[0]);
  const newest = days.reduce((a, b) => (a > b ? a : b));
  return images
    .filter((item) => item.date.startsWith(newest))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function isEpicImage(value: unknown): value is EpicImage {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.identifier === "string" &&
    typeof record.image === "string" &&
    typeof record.date === "string"
  );
}

function readCache(): EpicImage[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { savedAt, images } = parsed as {
      savedAt?: unknown;
      images?: unknown;
    };
    if (typeof savedAt !== "number" || Date.now() - savedAt > CACHE_TTL_MS) {
      return null;
    }
    if (!Array.isArray(images) || !images.every(isEpicImage)) return null;
    return images;
  } catch {
    // Cửa sổ riêng tư, dung lượng đầy, JSON hỏng — mọi trường hợp đều chỉ có
    // nghĩa là "không có cache", không phải lỗi đáng báo cho người đọc.
    return null;
  }
}

function writeCache(images: EpicImage[]): void {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), images }),
    );
  } catch {
    // Ghi cache hỏng thì thôi, không ảnh hưởng gì tới việc hiển thị.
  }
}

async function fetchEpic(signal: AbortSignal): Promise<EpicImage[]> {
  let lastError: unknown = null;

  for (const endpoint of ENDPOINTS) {
    try {
      const response = await fetch(endpoint, { signal });
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }
      const payload: unknown = await response.json();
      if (Array.isArray(payload) && payload.every(isEpicImage)) {
        return payload;
      }
      lastError = new Error("Dữ liệu trả về không đúng dạng");
    } catch (error) {
      if (signal.aborted) throw error;
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Không tải được");
}

/** Nạp sẵn một ảnh. Ảnh hỏng cũng resolve: một khung thiếu không đáng chặn cả loạt. */
function preload(url: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = url;
  });
}

export function EpicEarth({ locale = "vi" }: { locale?: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [frames, setFrames] = useState<Frame[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const vi = locale !== "en";

  // ------------------------------------------------------------ Tải dữ liệu
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const run = async () => {
      setStatus("loading");

      try {
        const cached = readCache();
        const images = cached ?? (await fetchEpic(controller.signal));
        if (cancelled) return;
        if (!cached) writeCache(images);

        const day = latestDayOnly(images);
        if (day.length === 0) {
          setStatus("empty");
          return;
        }

        const built: Frame[] = day.map((item) => ({
          identifier: item.identifier,
          url: buildImageUrl(item),
          caption: item.caption,
          takenAt: parseEpicDate(item.date),
        }));

        /*
         * Chỉ chạy sau khi mọi khung đã nằm trong bộ nhớ đệm của trình duyệt.
         * Đổi khung mỗi 250 ms mà ảnh còn đang tải thì mỗi vòng quay là một
         * loạt khung trắng — nhìn ra lỗi chứ không ra chuyển động.
         */
        await Promise.all(built.map((frame) => preload(frame.url)));
        if (cancelled) return;

        setFrames(built);
        setIndex(0);
        setStatus("ready");
      } catch (error) {
        if (cancelled || controller.signal.aborted) return;
        console.error("[epic] không tải được ảnh EPIC:", error);
        setStatus("error");
      }
    };

    void run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [attempt]);

  // ---------------------------------------------------------- Chạy khung hình
  useEffect(() => {
    if (status !== "ready" || !playing || frames.length < 2) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % frames.length);
    }, FRAME_MS);

    return () => window.clearInterval(timer);
  }, [status, playing, frames.length]);

  const step = useCallback(
    (delta: number) => {
      setIndex((i) =>
        frames.length === 0 ? i : (i + delta + frames.length) % frames.length,
      );
    },
    [frames.length],
  );

  const current = frames[index];

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0a1730] via-[#050a18] to-[#02030a] p-6 sm:p-8">
      <header className="max-w-2xl">
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
          🌍 {vi ? "Trái Đất nhìn từ điểm L1" : "Earth from the L1 point"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/65">
          {vi
            ? "Hình ảnh toàn cảnh Trái Đất do camera EPIC trên vệ tinh DSCOVR ghi lại từ điểm Lagrange L1, cách đây 1,5 triệu km."
            : "Full-disk images of Earth from the EPIC camera aboard DSCOVR, taken from the L1 Lagrange point 1.5 million km away."}
        </p>
      </header>

      <div className="mt-7 grid items-center gap-8 lg:grid-cols-[auto_1fr]">
        {/* ------------------------------------------------------ Quả cầu */}
        <div className="mx-auto w-[min(280px,80vw)] sm:w-[320px] lg:w-[440px] xl:w-[500px]">
          <div className="relative aspect-square">
            {/* Quầng sáng nằm ở phần tử riêng phía sau, không phải box-shadow
                của khung ảnh: khung có overflow-hidden nên bóng đổ ra ngoài
                sẽ bị chính nó cắt mất. */}
            <div
              aria-hidden
              className="absolute inset-[-12%] rounded-full bg-[radial-gradient(circle,rgba(56,160,255,0.28),transparent_62%)] motion-safe:animate-[epic-glow_7s_ease-in-out_infinite]"
            />

            <div className="relative size-full overflow-hidden rounded-full shadow-[0_28px_80px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10 motion-safe:animate-[epic-float_11s_ease-in-out_infinite]">
              {status === "ready" &&
                frames.map((frame, i) => (
                  /*
                   * Mọi khung cùng nằm trong DOM, chỉ đổi độ mờ. Đổi `src`
                   * của một thẻ ảnh duy nhất sẽ có một nhịp giải mã giữa hai
                   * khung, và ở 250 ms thì nhịp đó thành cái giật thấy rõ.
                   *
                   * `unoptimized` là bắt buộc chứ không phải bỏ qua tối ưu:
                   * phần preload nạp đúng URL gốc của NASA, còn bộ tối ưu ảnh
                   * sẽ phát ra một URL khác — hai URL khác nhau thì bộ nhớ
                   * đệm không khớp và toàn bộ công preload thành vô ích.
                   */
                  <Image
                    key={frame.identifier}
                    src={frame.url}
                    alt={
                      i === index
                        ? vi
                          ? `Trái Đất chụp lúc ${formatTimeUtc(frame.takenAt)} UTC`
                          : `Earth at ${formatTimeUtc(frame.takenAt)} UTC`
                        : ""
                    }
                    fill
                    unoptimized
                    sizes="(min-width: 1280px) 500px, (min-width: 1024px) 440px, (min-width: 640px) 320px, 80vw"
                    priority={i === 0}
                    aria-hidden={i !== index}
                    /*
                     * Phóng 1,36 lần. Đo trên ảnh EPIC thật thì đĩa Trái Đất
                     * chỉ chiếm 73,8% bề ngang khung 1080 px, phần còn lại là
                     * khoảng đen. Không phóng thì khung tròn hiện ra một quầng
                     * đen dày quanh quả cầu, và người xem đọc quầng đó là một
                     * phần của thiết kế chứ không phải lề của tấm ảnh.
                     */
                    /*
                     * Hoà mờ 700 ms, gần nửa chu kỳ 1600 ms giữa hai khung.
                     *
                     * Ở 300 ms thì mỗi khung đứng yên 1,3 giây rồi đổi gần
                     * như tức thì — mắt đọc ra một chuỗi ảnh rời chứ không ra
                     * chuyển động. Hoà mờ dài gần nửa chu kỳ thì luôn có hai
                     * khung chồng nhau ở giữa, và chỗ chồng đó chính là thứ
                     * lấp vào khoảng trống 15–30 độ mà EPIC bỏ qua giữa hai
                     * lần chụp.
                     *
                     * Không dài hơn nửa chu kỳ: quá nửa thì khung thứ ba bắt
                     * đầu hiện trước khi khung thứ nhất tắt hẳn, và ba lớp
                     * chồng nhau cho ra một quả cầu nhoè.
                     */
                    className="scale-[1.36] object-cover transition-opacity duration-700 ease-linear"
                    style={{ opacity: i === index ? 1 : 0 }}
                  />
                ))}

              {status !== "ready" && (
                <div className="grid size-full place-items-center bg-[#040914]">
                  {status === "loading" && (
                    <Loader2
                      className="size-8 animate-spin text-sky-300/70"
                      aria-label={vi ? "Đang tải" : "Loading"}
                    />
                  )}
                  {status === "empty" && (
                    <p className="px-8 text-center text-sm text-white/60">
                      {vi
                        ? "Hiện chưa có dữ liệu hình ảnh Trái Đất."
                        : "No Earth imagery is available right now."}
                    </p>
                  )}
                  {status === "error" && (
                    <AlertTriangle className="size-8 text-amber-400" aria-hidden />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------- Số liệu và nút */}
        <div className="min-w-0">
          {status === "error" ? (
            <div className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-5">
              <p className="text-sm leading-relaxed text-white/75">
                {vi
                  ? "Không tải được dữ liệu từ NASA. Cổng api.nasa.gov giới hạn 30 lượt mỗi giờ cho mỗi địa chỉ IP khi dùng khoá DEMO_KEY."
                  : "Could not load data from NASA. The api.nasa.gov gateway allows 30 requests per hour per IP address on the DEMO_KEY."}
              </p>
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 focus-visible:ring-[3px] focus-visible:ring-sky-400/40 focus-visible:outline-none"
              >
                <RotateCcw className="size-4" aria-hidden />
                {vi ? "Thử lại" : "Try again"}
              </button>
            </div>
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {(
                  [
                    [
                      vi ? "Ngày chụp" : "Date",
                      current ? formatDateUtc(current.takenAt, locale) : "—",
                    ],
                    [
                      vi ? "Thời gian chụp" : "Time",
                      current ? `${formatTimeUtc(current.takenAt)} UTC` : "—",
                    ],
                    [vi ? "Nguồn" : "Source", "NASA EPIC"],
                    [vi ? "Vệ tinh" : "Spacecraft", "DSCOVR"],
                    [vi ? "Thiết bị" : "Instrument", "EPIC Camera"],
                    [
                      vi ? "Số khung hình" : "Frames",
                      frames.length > 0 ? String(frames.length) : "—",
                    ],
                    [
                      vi ? "Ảnh đã cũ" : "Image age",
                      current ? formatAge(current.takenAt, vi) : "—",
                    ],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-white/45">{label}</dt>
                    {/* `tabular-nums` giữ bề rộng chữ số cố định: không có nó
                        thì hàng số nhích ngang mỗi 250 ms theo đồng hồ. */}
                    <dd className="mt-0.5 font-mono text-white/90 tabular-nums">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex items-center gap-2">
                {(
                  [
                    {
                      key: "prev",
                      icon: ChevronLeft,
                      label: vi ? "Khung hình trước" : "Previous frame",
                      onClick: () => step(-1),
                    },
                    {
                      key: "toggle",
                      icon: playing ? Pause : Play,
                      label: playing
                        ? vi
                          ? "Tạm dừng"
                          : "Pause"
                        : vi
                          ? "Phát"
                          : "Play",
                      onClick: () => setPlaying((value) => !value),
                    },
                    {
                      key: "next",
                      icon: ChevronRight,
                      label: vi ? "Khung hình sau" : "Next frame",
                      onClick: () => step(1),
                    },
                  ] as const
                ).map(({ key, icon: Icon, label, onClick }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={onClick}
                    disabled={status !== "ready"}
                    aria-label={label}
                    title={label}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/85 transition-colors hover:border-white/35 hover:bg-white/15 hover:text-white focus-visible:ring-[3px] focus-visible:ring-sky-400/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Icon className="size-4" aria-hidden />
                  </button>
                ))}

                {status === "ready" && frames.length > 1 && (
                  <span className="ml-2 font-mono text-xs text-white/45 tabular-nums">
                    {index + 1}/{frames.length}
                  </span>
                )}
              </div>

              {current?.caption && (
                <p className="mt-5 text-xs leading-relaxed text-white/45">
                  {current.caption}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
