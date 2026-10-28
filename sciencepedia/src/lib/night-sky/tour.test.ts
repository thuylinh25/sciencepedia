import { test } from "node:test";
import assert from "node:assert/strict";

import type {
  BodyName,
  BodyReport,
  MoonReport,
  SkyReport,
} from "./astro";
import { buildQuiz, buildTourStops } from "./tour";

/**
 * Kiểm thử bộ dựng tour + trắc nghiệm bằng báo cáo bầu trời TỰ DỰNG (vật
 * thể thuần, không qua engine): thứ cần chốt là logic chọn lọc — chỉ
 * thiên thể trên chân trời mới thành điểm dừng, đáp án trắc nghiệm luôn
 * nằm trong các lựa chọn và là giá trị đúng của ảnh chụp.
 */

const NOW = new Date("2026-10-28T13:00:00Z");

function body(
  name: BodyName,
  altitudeDeg: number,
  azimuthDeg = 180,
  rise: Date | null = null,
): BodyReport {
  return {
    body: name,
    altitudeDeg,
    azimuthDeg,
    compassVi: "Nam",
    compassEn: "South",
    rise,
    set: null,
    culmination: null,
  };
}

function reportWith(
  moonAlt: number,
  planetAlts: Partial<Record<BodyName, number>>,
  rises: Partial<Record<BodyName, Date | null>> = {},
  moonPhaseAngle = 170,
): SkyReport {
  const names: BodyName[] = [
    "Mercury",
    "Venus",
    "Mars",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptune",
  ];
  const moon: MoonReport = {
    ...body("Moon", moonAlt, 120),
    body: "Moon",
    illumFraction: 0.95,
    phaseAngleDeg: moonPhaseAngle,
    phaseNameVi: "Trăng tròn",
    phaseNameEn: "Full Moon",
    nextFullMoon: null,
    nextNewMoon: null,
  };
  return {
    sun: {
      altitudeDeg: -20,
      azimuthDeg: 300,
      state: "night",
      sunrise: null,
      sunset: null,
      darkTime: null,
    },
    moon,
    planets: names.map((name) =>
      body(name, planetAlts[name] ?? -30, 200, rises[name] ?? null),
    ),
  };
}

test("tour: Mặt Trăng đứng đầu, hành tinh theo độ cao giảm dần, tối đa 4 điểm", () => {
  const report = reportWith(40, {
    Venus: 55,
    Jupiter: 30,
    Saturn: 20,
    Mars: 10,
    Mercury: 5,
  });
  const tour = buildTourStops(report);
  assert.equal(tour.enough, true);
  assert.deepEqual(tour.objectBodies, ["Moon", "Venus", "Jupiter", "Saturn"]);
  assert.equal(tour.stops[0].kind, "intro");
  assert.equal(tour.stops[tour.stops.length - 1].kind, "quiz");
  assert.equal(tour.stops.length, 1 + 4 + 1);
});

test("tour: Mặt Trăng dưới chân trời thì hành tinh cao nhất dẫn đầu", () => {
  const report = reportWith(-10, { Venus: 30, Mars: 12 });
  const tour = buildTourStops(report);
  assert.equal(tour.enough, true);
  assert.deepEqual(tour.objectBodies, ["Venus", "Mars"]);
});

test("tour: dưới 2 thiên thể trên trời thì không đủ chất liệu", () => {
  const one = buildTourStops(reportWith(-5, { Venus: 30 }));
  assert.equal(one.enough, false);
  assert.deepEqual(one.stops, []);
  const none = buildTourStops(reportWith(-5, {}));
  assert.equal(none.enough, false);
});

test("quiz: đáp án luôn nằm trong lựa chọn, lựa chọn không trùng", () => {
  const report = reportWith(
    40,
    { Venus: 55, Jupiter: 30, Saturn: 20 },
    {
      Venus: new Date("2026-10-29T10:00:00Z"),
      Jupiter: new Date("2026-10-28T22:00:00Z"),
      Saturn: new Date("2026-10-29T01:00:00Z"),
    },
  );
  const quiz = buildQuiz(report, NOW);
  assert.equal(quiz.length, 3);
  for (const question of quiz) {
    assert.ok(question.options.length >= 3, question.kind);
    assert.equal(
      new Set(question.options).size,
      question.options.length,
      `${question.kind}: lựa chọn trùng`,
    );
    assert.ok(
      question.options.includes(question.correct as never),
      `${question.kind}: thiếu đáp án đúng`,
    );
  }
});

test("quiz: câu cao nhất và câu mọc tiếp theo lấy đúng giá trị của ảnh chụp", () => {
  const report = reportWith(
    40,
    { Venus: 55, Jupiter: 30 },
    {
      Venus: new Date("2026-10-29T10:00:00Z"),
      Jupiter: new Date("2026-10-28T22:00:00Z"),
    },
  );
  const quiz = buildQuiz(report, NOW);
  const highest = quiz.find((q) => q.kind === "highest");
  assert.ok(highest && highest.correct === "Venus");
  const nextRise = quiz.find((q) => q.kind === "nextRise");
  assert.ok(nextRise && nextRise.correct === "Jupiter");
  const phase = quiz.find((q) => q.kind === "moonPhase");
  // Góc pha 170° rơi vào khoảng "Trăng tròn" (chỉ số 4).
  assert.ok(phase && phase.correct === 4);
});

test("quiz: không còn lần mọc nào sắp tới thì câu 3 đổi sang hỏi hướng", () => {
  const report = reportWith(40, { Venus: 55, Jupiter: 30 });
  const quiz = buildQuiz(report, NOW);
  const third = quiz[2];
  assert.equal(third.kind, "direction");
  if (third.kind === "direction") {
    // Thiên thể cao nhất là Sao Kim ở phương vị 200° → hướng Nam (chỉ số 4).
    assert.equal(third.body, "Venus");
    assert.equal(third.correct, 4);
    assert.ok(third.options.includes(4));
  }
});
