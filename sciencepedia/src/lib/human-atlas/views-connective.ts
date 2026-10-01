import type { AtlasViewDef, PartRule } from "./views";

/*
 * ## Góc nhìn theo hệ — Mô liên kết (2026-10-01)
 *
 * Audit dữ liệu: 45 mảnh — dây chằng/màng thanh quản – xương móng, màng gian cốt cẳng
 * tay/cẳng chân, gân gót, dải chậu chày, dây chằng gan chân dài, đường đan (chân bướm
 * hàm, hầu), đường trắng, gân trung gian, cung gân cơ nâng hậu môn, mạc treo (ruột non,
 * ruột thừa, đại tràng ngang), mô liên kết ổ mắt (ròng rọc, dây chằng hãm, gân cơ nâng
 * mi). Grep: KHÔNG có phần lớn dây chằng khớp (chéo, bên, bánh chè, dọc cột sống, vàng), bao
 * khớp, sụn chêm, mạc, cân, phúc mạc, mạc nối, màng phổi, màng tim, màng cứng não — màng cứng tuỷ
 * và lều tiểu não CÓ, ở hệ thần kinh (views-nervous.ts).
 * Mạc giữ gân gấp cổ tay bị BodyParts3D xếp hệ giác quan — lấy theo tên vào đây. Cơ căng
 * mạc đùi (xếp mô liên kết) là CƠ: thuộc góc nhìn hệ cơ, không có ở đây.
 */

const c = (name: RegExp): PartRule => ({ systems: ["connective"], name });

const LARYNGEAL = c(/thyrohyoid (membrane|ligament)$|cricothyroid ligament$|conus elasticus$|vocal ligament$|hyo-epiglottic ligament$|thyro-epiglottic ligament$|stylohyoid ligament$/i);
const LIMB: PartRule = {
  systems: ["connective", "sensory"],
  name: /interosseous membrane of (left |right )?(forearm|leg)$|calcaneal tendon$|iliotibial tract$|long plantar ligament$|flexor retinaculum of (left |right )?wrist$/i,
};
const MESENTERIES = c(/mesentery of small intestine$|^mesoappendix$|^transverse mesocolon$/i);
const ORBITAL = c(/trochlea of (left |right )?superior oblique$|check ligament of (left |right )?(lateral|medial) rectus$|tendon of (left |right )?levator palpebrae superioris$/i);
const RAPHES_TENDONS = c(/pterygomandibular raphe$|^pharyngeal raphe$|^linea alba$|intermediate tendon$|tendinous arch of levator ani$/i);

const sk = (name: RegExp): PartRule => ({ systems: ["skeletal"], name });
const LARYNX_BONES = sk(/^hyoid bone$|^(thyroid|cricoid) cartilage$|(arytenoid|corniculate|cuneiform) cartilage$/i);
const LIMB_BONES = sk(/(radius|ulna|tibia|fibula|femur|calcaneus)$/i);
const INTESTINE: PartRule = { systems: ["digestive"], name: /jejunum|ileum|appendix|transverse colon$/i };

const group = (
  id: string,
  vi: string,
  en: string,
  direction: AtlasViewDef["direction"],
  focus: PartRule[],
  context: PartRule[],
  terms: string[],
): AtlasViewDef => ({ id, systemId: "connective", kind: "group", name: { vi, en }, direction, focus, context, terms, quality: "acceptable" });
const structure = (id: string, vi: string, en: string, direction: AtlasViewDef["direction"], focus: PartRule): AtlasViewDef => ({
  id,
  systemId: "connective",
  kind: "structure",
  name: { vi, en },
  direction,
  focus: [focus],
});

export const CONNECTIVE_VIEWS: readonly AtlasViewDef[] = [
  {
    id: "connective-overview",
    systemId: "connective",
    kind: "overview",
    name: { vi: "Mô liên kết", en: "Connective tissue" },
    direction: "front",
    focus: [{ systems: ["connective"], exclude: /tensor fasciae latae$/i }, LIMB],
    partial: {
      vi: "Chỉ có một số dây chằng, gân, màng và mạc treo; thiếu phần lớn dây chằng khớp, bao khớp, sụn chêm, cân mạc, phúc mạc, mạc nối, màng phổi, màng tim và màng cứng não (trừ lều tiểu não)",
      en: "Only some ligaments, tendons, membranes and mesenteries; most joint ligaments, joint capsules, menisci, fasciae, peritoneum, omenta, pleura, pericardium and the cranial dura (except the tentorium) are missing",
    },
    terms: ["mô liên kết", "connective tissue", "dây chằng", "ligament", "gân", "tendon"],
    quality: "needs-improvement",
  },
  group("connective-larynx", "Dây chằng, màng thanh quản và dây chằng trâm móng", "Laryngeal ligaments, membranes and stylohyoid ligaments", "anterolateral", [LARYNGEAL], [LARYNX_BONES],
    ["dây thanh", "vocal ligament", "nón đàn hồi", "conus elasticus", "màng giáp móng"]),
  group("connective-limbs", "Gân, dây chằng, dải và màng gian cốt chi", "Tendons, ligaments, bands and interosseous membranes of the limbs", "front", [LIMB], [LIMB_BONES],
    ["gân gót", "Achilles", "dải chậu chày", "iliotibial band", "màng gian cốt"]),
  group("connective-mesenteries", "Mạc treo", "Mesenteries", "front", [MESENTERIES], [INTESTINE], ["mạc treo", "mesentery"]),

  structure("laryngeal-ligaments", "Dây chằng, màng thanh quản và dây chằng trâm móng", "Laryngeal ligaments, membranes and stylohyoid ligaments", "anterolateral", LARYNGEAL),
  structure("limb-connective", "Màng gian cốt, gân gót, dải chậu chày, dây chằng gan chân dài, mạc giữ gân gấp", "Interosseous membranes, calcaneal tendon, iliotibial tract, long plantar ligament, flexor retinaculum", "front", LIMB),
  structure("mesenteries", "Mạc treo ruột non, ruột thừa và đại tràng ngang", "Mesentery, mesoappendix and transverse mesocolon", "front", MESENTERIES),
  structure("orbital-connective-both", "Ròng rọc, dây chằng hãm và gân cơ nâng mi (hai mắt)", "Trochlea, check ligaments and levator palpebrae tendon (both eyes)", "front", ORBITAL),
  structure("raphes-tendons", "Đường đan, đường trắng, gân trung gian và cung gân cơ nâng hậu môn", "Raphes, linea alba, intermediate tendon and tendinous arch of levator ani", "front", RAPHES_TENDONS),
];
