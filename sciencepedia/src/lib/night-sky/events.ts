import type { RawAstronomy } from "./astro";
import { meteorShowerPeak, utcToWallParts } from "./timezone";

/**
 * Sự kiện thiên văn SẮP TỚI (S4) — mọi mốc đều do astronomy-engine
 * tính tại lúc chạy, không có ngày nào gõ tay:
 *
 * - Cực điểm mưa sao băng: ước lệ quốc tế đã dùng cho các chip sự
 *   kiện của trang (17/11 Leonids, 13/12 Geminids lúc 19:00 giờ địa
 *   phương) — ngày cực điểm danh nghĩa theo IMO, giờ 19:00 là giờ
 *   mở xem của trang, không phải giờ cực điểm thiên văn chính xác.
 *   Ghi chú chỉ nói điểm phát xạ (định nghĩa của trận mưa) và quy
 *   luật "càng về khuya càng dày" — KHÔNG in số sao/giờ: con số đó
 *   thay đổi theo năm và phải đối chiếu IMO/AMS từng kỳ.
 * - Trăng tròn/mới: SearchMoonPhase. "Siêu trăng" theo quy tắc
 *   Nolle: khoảng cách trăng tròn nằm trong 90% khoảng
 *   cận điểm–viễn điểm của chính kỳ trăng đó (SearchLunarApsis);
 *   khoảng cách tính được luôn in kèm để người đọc thấy căn cứ.
 * - Điểm chí/điểm phân: Seasons của astronomy-engine.
 */

export type SkyEventKind = "meteor" | "full-moon" | "new-moon" | "season";

export type SkyEvent = {
  id: string;
  kind: SkyEventKind;
  /** Mốc sự kiện (cực điểm danh nghĩa / pha / điểm chí-phân). */
  instant: Date;
  nameVi: string;
  nameEn: string;
  noteVi: string;
  noteEn: string;
};

const AU_KM = 149_597_870.7;

type Shower = {
  id: string;
  month: number;
  day: number;
  nameVi: string;
  nameEn: string;
  radiantVi: string;
  radiantEn: string;
};

const SHOWERS: readonly Shower[] = [
  { id: "quadrantids", month: 1, day: 3, nameVi: "Mưa sao băng Quadrantids", nameEn: "Quadrantid meteor shower", radiantVi: "Mục Phu", radiantEn: "Boötes" },
  { id: "lyrids", month: 4, day: 22, nameVi: "Mưa sao băng Lyrids", nameEn: "Lyrid meteor shower", radiantVi: "Thiên Cầm", radiantEn: "Lyra" },
  { id: "eta-aquariids", month: 5, day: 6, nameVi: "Mưa sao băng Eta Aquariids", nameEn: "Eta Aquariid meteor shower", radiantVi: "Bảo Bình", radiantEn: "Aquarius" },
  { id: "perseids", month: 8, day: 12, nameVi: "Mưa sao băng Perseids", nameEn: "Perseid meteor shower", radiantVi: "Anh Tiên", radiantEn: "Perseus" },
  { id: "orionids", month: 10, day: 21, nameVi: "Mưa sao băng Orionids", nameEn: "Orionid meteor shower", radiantVi: "Lạp Hộ", radiantEn: "Orion" },
  { id: "leonids", month: 11, day: 17, nameVi: "Mưa sao băng Leonids", nameEn: "Leonid meteor shower", radiantVi: "Sư Tử", radiantEn: "Leo" },
  { id: "geminids", month: 12, day: 13, nameVi: "Mưa sao băng Geminids", nameEn: "Geminid meteor shower", radiantVi: "Song Tử", radiantEn: "Gemini" },
];

const SEASONS: readonly {
  key: "mar_equinox" | "jun_solstice" | "sep_equinox" | "dec_solstice";
  nameVi: string;
  nameEn: string;
  noteVi: string;
  noteEn: string;
}[] = [
  {
    key: "mar_equinox",
    nameVi: "Xuân phân",
    nameEn: "March equinox",
    noteVi: "Ngày và đêm dài gần bằng nhau trên khắp Trái Đất.",
    noteEn: "Day and night are nearly equal in length worldwide.",
  },
  {
    key: "jun_solstice",
    nameVi: "Hạ chí",
    nameEn: "June solstice",
    noteVi: "Ngày dài nhất trong năm ở Bắc bán cầu.",
    noteEn: "The longest day of the year in the Northern Hemisphere.",
  },
  {
    key: "sep_equinox",
    nameVi: "Thu phân",
    nameEn: "September equinox",
    noteVi: "Ngày và đêm dài gần bằng nhau trên khắp Trái Đất.",
    noteEn: "Day and night are nearly equal in length worldwide.",
  },
  {
    key: "dec_solstice",
    nameVi: "Đông chí",
    nameEn: "December solstice",
    noteVi: "Đêm dài nhất trong năm ở Bắc bán cầu.",
    noteEn: "The longest night of the year in the Northern Hemisphere.",
  },
];

function fmtKm(km: number, vi: boolean): string {
  const rounded = Math.round(km / 100) * 100;
  return rounded.toLocaleString(vi ? "vi-VN" : "en-US");
}

/** Siêu trăng theo quy tắc Nolle: khoảng cách lúc trăng tròn nằm
 *  trong 90% khoảng cận–viễn của kỳ trăng đó. Trả null khi không
 *  đủ dữ kiện điểm cực trị để kết luận. */
function isSupermoon(engine: RawAstronomy, full: Date): boolean | null {
  try {
    const distVector = engine.GeoVector("Moon", full, false);
    const fullKm =
      Math.hypot(distVector.x, distVector.y, distVector.z) * AU_KM;
    const from = new Date(full.getTime() - 20 * 86_400_000);
    const until = full.getTime() + 20 * 86_400_000;
    let apsis = engine.SearchLunarApsis(from);
    let perigee: number | null = null;
    let apogee: number | null = null;
    let guard = 0;
    while (apsis && apsis.time.date.getTime() <= until && guard < 6) {
      if (apsis.kind === 0) perigee = apsis.dist_km;
      if (apsis.kind === 1) apogee = apsis.dist_km;
      apsis = engine.NextLunarApsis(apsis);
      guard += 1;
    }
    if (perigee === null || apogee === null) return null;
    const threshold = apogee - 0.9 * (apogee - perigee);
    return fullKm <= threshold;
  } catch {
    return null;
  }
}

function moonDistanceKm(engine: RawAstronomy, at: Date): number | null {
  try {
    const v = engine.GeoVector("Moon", at, false);
    return Math.hypot(v.x, v.y, v.z) * AU_KM;
  } catch {
    return null;
  }
}

export function upcomingSkyEvents(
  engine: RawAstronomy,
  tz: string,
  now: Date,
  count = 6,
): SkyEvent[] {
  const events: SkyEvent[] = [];
  const grace = now.getTime() - 12 * 3_600_000;

  for (const shower of SHOWERS) {
    const { instant } = meteorShowerPeak(tz, now, shower.month, shower.day, 19, 0);
    if (instant.getTime() <= grace) continue;
    const year = utcToWallParts(tz, instant).year;
    events.push({
      id: `meteor-${shower.id}-${year}`,
      kind: "meteor",
      instant,
      nameVi: shower.nameVi,
      nameEn: shower.nameEn,
      noteVi: `Điểm phát xạ ở chòm ${shower.radiantVi} — càng về khuya chòm này càng lên cao, sao băng càng nhiều.`,
      noteEn: `The radiant lies in ${shower.radiantEn} — the later the night, the higher it climbs and the more meteors appear.`,
    });
  }

  const collectMoons = (targetLon: number, kind: "full-moon" | "new-moon") => {
    let cursor = new Date(now);
    for (let i = 0; i < 3; i += 1) {
      const hit = engine.SearchMoonPhase(targetLon, cursor, 40);
      if (!hit) return;
      const instant = hit.date;
      cursor = new Date(instant.getTime() + 20 * 86_400_000);
      if (instant.getTime() <= grace) continue;
      if (kind === "full-moon") {
        const km = moonDistanceKm(engine, instant);
        const superMoon = isSupermoon(engine, instant);
        events.push({
          id: `full-moon-${instant.toISOString().slice(0, 10)}`,
          kind,
          instant,
          nameVi: superMoon ? "Siêu trăng" : "Trăng tròn",
          nameEn: superMoon ? "Supermoon" : "Full Moon",
          noteVi:
            km !== null
              ? `Mọc từ lúc hoàng hôn và sáng suốt đêm · cách Trái Đất khoảng ${fmtKm(km, true)} km.`
              : "Mọc từ lúc hoàng hôn và sáng suốt đêm.",
          noteEn:
            km !== null
              ? `Rises at sunset and shines all night · about ${fmtKm(km, false)} km from Earth.`
              : "Rises at sunset and shines all night.",
        });
      } else {
        events.push({
          id: `new-moon-${instant.toISOString().slice(0, 10)}`,
          kind,
          instant,
          nameVi: "Trăng mới",
          nameEn: "New Moon",
          noteVi:
            "Đêm không trăng — dịp tốt nhất để ngắm các sao mờ và dải Ngân Hà.",
          noteEn:
            "A moonless night — the best time for faint stars and the Milky Way.",
        });
      }
    }
  };
  collectMoons(180, "full-moon");
  collectMoons(0, "new-moon");

  for (const yearOffset of [0, 1]) {
    const probe = new Date(
      Date.UTC(utcToWallParts(tz, now).year + yearOffset, 0, 15),
    );
    const seasons = engine.Seasons(probe);
    for (const season of SEASONS) {
      const instant = seasons[season.key].date;
      if (instant.getTime() <= grace) continue;
      events.push({
        id: `season-${season.key}-${instant.getUTCFullYear()}`,
        kind: "season",
        instant,
        nameVi: season.nameVi,
        nameEn: season.nameEn,
        noteVi: season.noteVi,
        noteEn: season.noteEn,
      });
    }
  }

  const seen = new Set<string>();
  return events
    .filter((event) => {
      if (seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    })
    .sort((a, b) => a.instant.getTime() - b.instant.getTime())
    .slice(0, count);
}
