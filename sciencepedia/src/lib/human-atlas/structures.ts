import { z } from "zod";

/**
 * Dữ liệu cấu trúc giải phẫu của Sciencepedia — lớp làm giàu trên BodyParts3D.
 *
 * Sinh bởi `scripts/anatomy-enrich.ts` vào `data/anatomy/fma-structures.json`,
 * phát qua R2 (`ANATOMY_DATA_FILE`), viewer tải lười. Không có lượt gọi API y
 * sinh nào lúc người xem bấm vào một cấu trúc.
 *
 * ## Khoá là mã FMA
 *
 * `FMA79980` giữ nguyên dù tên Việt được sửa, bản dịch đổi, hay tên Anh được
 * hiển thị khác. Tên tiếng Việt KHÔNG nằm ở đây — nó ở `names-vi.ts`, có hai
 * trạng thái (`viNameStatus`): đã duyệt tay, hoặc dịch ghép chưa duyệt.
 *
 * ## Mức làm giàu
 *
 * 0 — mã FMA, tên Anh, hệ (hệ lấy từ `atlas.json`, không lặp ở đây)
 * 1 — thêm tên Latin, đồng nghĩa, cha is-a / part-of, mã TA98
 * 2+ — tóm tắt, vị trí, chức năng, quan hệ, cấp máu, thần kinh… CHƯA có. Các
 *      trường ấy chưa khai báo trong schema cho tới khi có pipeline biên tập
 *      của chúng: một trường rỗng trong schema là lời mời điền bừa.
 *
 * ## Nguồn
 *
 * `sources` ở gốc là sổ đăng ký (tiêu đề, phiên bản, URL, giấy phép, ngày
 * truy cập); mỗi cấu trúc trỏ vào sổ bằng `ref` và nói rõ trường nào nguồn ấy
 * chống lưng (`supports`). URL của từng cấu trúc dựng từ `urlTemplate`.
 */

export const ANATOMY_SOURCES = {
  fma: {
    id: "fma",
    type: "ontology",
    title: "Foundational Model of Anatomy (FMA)",
    publisher: "Structural Informatics Group, University of Washington",
    version: "5.1.0",
    url: "http://sig.biostr.washington.edu/share/downloads/fma/release/latest/",
    /**
     * Kiểm 2026-09-28 tại tệp `LICENSE` trong thư mục phát hành 5.1.0 (văn bản
     * đầy đủ CC BY 4.0). Registry OBO Foundry và OLS chỉ ghi "CUSTOM" kèm một
     * link đã chết — đừng lấy chúng làm căn cứ.
     */
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    /** Lấy qua EBI OLS, bản FMA 5.1.0 ấy dưới dạng JSON. */
    via: "https://www.ebi.ac.uk/ols4/ontologies/fma",
    urlTemplate: "https://www.ebi.ac.uk/ols4/ontologies/fma/classes?obo_id={id}",
    accessedAt: "2026-09-28",
  },
} as const;

export type AnatomySourceRef = keyof typeof ANATOMY_SOURCES;

const fmaIdSchema = z.string().regex(/^FMA\d+$/);

const partOfSchema = z.object({
  rel: z.enum(["regional_part_of", "constitutional_part_of", "systemic_part_of", "member_of"]),
  id: fmaIdSchema,
});

export type PartOfRelation = z.infer<typeof partOfSchema>;

const structureSchema = z.object({
  id: fmaIdSchema,
  names: z.object({
    /** FMA preferred name. */
    en: z.string().min(1),
    /** Chỉ giá trị FMA gắn nhãn ngôn ngữ "Latin"; không đoán theo mặt chữ. */
    la: z.string().nullable(),
  }),
  synonyms: z.object({ en: z.array(z.string()), la: z.array(z.string()) }),
  classification: z.object({
    /** Cha trực tiếp theo is-a (loại): "Sternocostal part of pectoralis major". */
    isA: z.array(fmaIdSchema),
    /** Cha theo quan hệ bộ phận, xếp theo ưu tiên hiển thị: "Left pectoralis major". */
    partOf: z.array(partOfSchema),
  }),
  identifiers: z.object({
    fma: fmaIdSchema,
    /** Mã Terminologia Anatomica 1998 do FMA ghi. Không phải TA2. */
    ta98: z.string().nullable(),
    /** Chưa có nguồn ánh xạ FMA → TA2; KHÔNG suy từ TA98. */
    ta2: z.null(),
    /** Cần giấy phép UMLS (UTS) — chưa ingest. */
    umls: z.null(),
  }),
  level: z.union([z.literal(0), z.literal(1)]),
  sources: z.array(
    z.object({
      ref: z.enum(Object.keys(ANATOMY_SOURCES) as [AnatomySourceRef, ...AnatomySourceRef[]]),
      supports: z.array(z.string()),
    }),
  ),
});

export type AnatomyStructure = z.infer<typeof structureSchema>;

export const anatomyDataSchema = z.object({
  schema: z.literal(1),
  /** Phiên bản `atlas.json` mà dữ liệu này được dựng cho. */
  atlas: z.string(),
  sources: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      title: z.string(),
      publisher: z.string(),
      version: z.string(),
      url: z.string().url(),
      license: z.string(),
      licenseUrl: z.string().url(),
      via: z.string().url(),
      urlTemplate: z.string(),
      accessedAt: z.string(),
    }),
  ),
  structures: z.record(fmaIdSchema, structureSchema),
  /** Tên Anh (FMA) của mã được trỏ tới làm cha nhưng không có trong atlas. */
  terms: z.record(fmaIdSchema, z.string()),
  /**
   * Mã FMA của BodyParts3D mà FMA 5.1.0 không còn (BodyParts3D dựng trên bản
   * FMA cũ hơn). Để trống dữ liệu, KHÔNG đoán mã thay thế theo tên — các cấu
   * trúc này vẫn chạy ở Level 0 với tên của chính BodyParts3D.
   */
  unresolved: z.array(fmaIdSchema),
});

export type AnatomyData = z.infer<typeof anatomyDataSchema>;

/** Trang FMA của một cấu trúc — thay cho link chung tới trang chủ BodyParts3D. */
export function fmaSourceUrl(id: string): string {
  return ANATOMY_SOURCES.fma.urlTemplate.replace("{id}", id.replace(/^FMA/, "FMA:"));
}

/**
 * Cha "thuộc về" để hiển thị. FMA cho tim tám cha part-of — hệ tim mạch của
 * nam, của nữ, của người nói chung, trung thất… — nên lấy mục đầu là lấy
 * ngẫu nhiên. Ưu tiên cha CÓ MẶT trong chính atlas: đó là những khái niệm
 * BodyParts3D đã chọn để mô hình hoá, tức là thứ người đọc thấy và chọn được.
 * Không có thì theo thứ tự quan hệ (regional → constitutional → systemic →
 * member). Chọn theo dữ liệu, không theo mặt chữ tên.
 */
export function primaryPartOf(data: AnatomyData, structure: AnatomyStructure): string | null {
  const candidates = structure.classification.partOf;
  return (candidates.find((p) => data.structures[p.id]) ?? candidates[0])?.id ?? null;
}

/** Tên Anh của một mã FMA bất kỳ trong dữ liệu (cấu trúc hoặc cha được trỏ tới). */
export function fmaName(data: AnatomyData, id: string): string | null {
  return data.structures[id]?.names.en ?? data.terms[id] ?? null;
}
