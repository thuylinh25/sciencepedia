import {
  compassIndexFor,
  moonPhaseIndexFor,
  type BodyName,
  type BodyReport,
  type SkyReport,
} from "@/lib/night-sky/astro";

/**
 * Tour dẫn "ngắm sao" + bài trắc nghiệm cuối tour — hàm thuần trên một
 * ảnh chụp báo cáo bầu trời (`SkyReport`).
 *
 * ## Vì sao sinh từ ảnh chụp, không viết cứng
 *
 * Một tour viết cứng ("điểm dừng 1: Sao Kim") sẽ nói dối vào những đêm
 * Sao Kim đang ở dưới chân trời. Tour ở đây được DỰNG từ chính danh sách
 * đang nhìn thấy tại nơi + lúc đang xem: chỉ thiên thể đang ở trên chân
 * trời mới thành điểm dừng, thứ tự theo độ cao giảm dần sau Mặt Trăng.
 * Không đủ hai thiên thể trên trời thì `enough` là `false` và giao diện
 * đề nghị nhảy tới hoàng hôn thay vì dẫn một tour rỗng.
 *
 * Trắc nghiệm cũng sinh từ cùng ảnh chụp: đáp án đúng luôn là giá trị đã
 * tính (thiên thể cao nhất, pha trăng hiện tại, hành tinh mọc tiếp theo),
 * đáp án nhiễu là các giá trị thật khác trong cùng danh sách — không có
 * câu hỏi nào mà đáp án phải tra ngoài dữ liệu trang đang có.
 */

export type TourStop =
  | { kind: "intro" }
  | { kind: "object"; body: BodyName }
  | { kind: "quiz" };

export type BuiltTour = {
  enough: boolean;
  stops: TourStop[];
  objectBodies: BodyName[];
};

/** Tối đa 4 điểm dừng thiên thể: đủ dài để thành một chuyến đi, đủ ngắn
    để không thành bài giảng. */
const MAX_OBJECT_STOPS = 4;
/** Tối thiểu 2 thiên thể trên chân trời mới gọi là một tour. */
const MIN_OBJECT_STOPS = 2;

export function buildTourStops(report: SkyReport): BuiltTour {
  const picked: BodyName[] = [];

  if (report.moon.altitudeDeg > 0) picked.push("Moon");
  const planetsUp = report.planets
    .filter((planet) => planet.altitudeDeg > 0)
    .sort((a, b) => b.altitudeDeg - a.altitudeDeg);
  for (const planet of planetsUp) {
    if (picked.length >= MAX_OBJECT_STOPS) break;
    picked.push(planet.body);
  }

  const enough = picked.length >= MIN_OBJECT_STOPS;
  return {
    enough,
    objectBodies: picked,
    stops: enough
      ? [
          { kind: "intro" },
          ...picked.map((body): TourStop => ({ kind: "object", body })),
          { kind: "quiz" },
        ]
      : [],
  };
}

/* ------------------------------------------------------------------ */
/* Trắc nghiệm                                                         */
/* ------------------------------------------------------------------ */

export type QuizQuestionData =
  | { kind: "highest"; correct: BodyName; options: BodyName[] }
  | { kind: "moonPhase"; correct: number; options: number[] }
  | { kind: "nextRise"; correct: BodyName; options: BodyName[] }
  | { kind: "direction"; body: BodyName; correct: number; options: number[] };

function saltOf(text: string): number {
  let sum = 0;
  for (const ch of text) sum += ch.charCodeAt(0);
  return sum;
}

/** Chèn đáp án đúng vào giữa các đáp án nhiễu ở vị trí xác định bởi
    `salt` — không ngẫu nhiên, để kiểm thử và hiển thị lại đều ổn định. */
function placeCorrect<T>(correct: T, distractors: T[], salt: number): T[] {
  const options = [...distractors.slice(0, 3)];
  const at = Math.abs(salt) % (options.length + 1);
  options.splice(at, 0, correct);
  return options;
}

function bodiesByAltitude(report: SkyReport): BodyReport[] {
  return [report.moon, ...report.planets].sort(
    (a, b) => b.altitudeDeg - a.altitudeDeg,
  );
}

/**
 * Ba câu hỏi từ một ảnh chụp bầu trời. Câu 3 có hai dạng: còn hành tinh
 * nào sắp mọc thì hỏi hành tinh mọc tiếp theo; không còn lần mọc nào
 * trong dữ liệu thì đổi sang hỏi hướng của thiên thể cao nhất.
 */
export function buildQuiz(report: SkyReport, now: Date): QuizQuestionData[] {
  const byAltitude = bodiesByAltitude(report);
  const questions: QuizQuestionData[] = [];

  // Câu 1 — thiên thể cao nhất lúc này.
  const highest = byAltitude[0];
  if (highest) {
    const distractors = byAltitude
      .filter((body) => body.body !== highest.body)
      .slice(0, 3)
      .map((body) => body.body);
    questions.push({
      kind: "highest",
      correct: highest.body,
      options: placeCorrect(highest.body, distractors, saltOf(highest.body)),
    });
  }

  // Câu 2 — pha Mặt Trăng hiện tại.
  const phaseIndex = moonPhaseIndexFor(report.moon.phaseAngleDeg);
  questions.push({
    kind: "moonPhase",
    correct: phaseIndex,
    options: placeCorrect(
      phaseIndex,
      [1, 3, 5].map((offset) => (phaseIndex + offset) % 8),
      phaseIndex * 7 + 1,
    ),
  });

  // Câu 3 — hành tinh mọc tiếp theo, hoặc hướng của thiên thể cao nhất.
  const upcoming = report.planets
    .filter((planet) => planet.rise !== null && planet.rise > now)
    .sort((a, b) => a.rise!.getTime() - b.rise!.getTime());
  if (upcoming.length > 0) {
    const correct = upcoming[0].body;
    const distractors = report.planets
      .filter((planet) => planet.body !== correct)
      .sort((a, b) => {
        const ar = a.rise?.getTime() ?? Number.POSITIVE_INFINITY;
        const br = b.rise?.getTime() ?? Number.POSITIVE_INFINITY;
        return ar - br;
      })
      .slice(0, 3)
      .map((planet) => planet.body);
    questions.push({
      kind: "nextRise",
      correct,
      options: placeCorrect(correct, distractors, saltOf(correct) + 3),
    });
  } else if (highest) {
    const compassIndex = compassIndexFor(highest.azimuthDeg);
    questions.push({
      kind: "direction",
      body: highest.body,
      correct: compassIndex,
      options: placeCorrect(
        compassIndex,
        [1, 4, 7].map((offset) => (compassIndex + offset) % 8),
        compassIndex * 5 + 2,
      ),
    });
  }

  return questions;
}
