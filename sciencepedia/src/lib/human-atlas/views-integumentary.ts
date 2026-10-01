import type { AtlasViewDef, PartRule } from "./views";

/*
 * ## Góc nhìn theo hệ — Bề mặt cơ thể (2026-10-01)
 *
 * Audit dữ liệu: 4 mảnh — da (MỘT mesh toàn thân, ~44,7k tam giác, đã làm mịn), môi, lông
 * mày, tóc. Không tách được vùng da, móng, tuyến da, các lớp da: đừng dựng góc nhìn cho chúng.
 */

const i = (name: RegExp): PartRule => ({ systems: ["integumentary"], name });
const SKIN = i(/^skin$/i);
const LIP = i(/^lip$/i);
const HAIR = i(/^eyebrow$|^hair of head$/i);

export const INTEGUMENTARY_VIEWS: readonly AtlasViewDef[] = [
  {
    id: "integumentary-overview",
    systemId: "integumentary",
    kind: "overview",
    name: { vi: "Bề mặt cơ thể", en: "Body surface" },
    direction: "front",
    focus: [{ systems: ["integumentary"] }],
    partial: {
      // Tóc, lông mày CÓ — chúng là phần phụ của da, nên không nói "không có phần phụ".
      vi: "Da là một bề mặt liền; không có các lớp da, móng, tuyến da (mồ hôi, bã) và lông ngoài tóc, lông mày",
      en: "The skin is a single continuous surface; skin layers, nails, skin glands (sweat, sebaceous) and hair other than the scalp hair and eyebrows are not modelled",
    },
    terms: ["da", "skin", "bề mặt", "surface", "tóc", "hair"],
    quality: "acceptable",
  },
  {
    id: "integumentary-head",
    systemId: "integumentary",
    kind: "group",
    name: { vi: "Tóc, lông mày và môi", en: "Hair, eyebrows and lips" },
    direction: "three-quarter",
    focus: [HAIR, LIP],
    terms: ["tóc", "hair", "lông mày", "eyebrow", "môi", "lip"],
    quality: "acceptable",
  },
  { id: "skin", systemId: "integumentary", kind: "structure", name: { vi: "Da", en: "Skin" }, direction: "front", focus: [SKIN] },
  { id: "lips", systemId: "integumentary", kind: "structure", name: { vi: "Môi", en: "Lips" }, direction: "front", focus: [LIP] },
  { id: "hair-eyebrows", systemId: "integumentary", kind: "structure", name: { vi: "Tóc và lông mày", en: "Hair and eyebrows" }, direction: "three-quarter", focus: [HAIR] },
];
