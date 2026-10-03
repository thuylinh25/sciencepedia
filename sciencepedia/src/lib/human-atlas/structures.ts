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
 * 2 — tóm tắt, vị trí, chức năng (khối `content`), song ngữ. Viết tay trong
 *     `data/anatomy/content-l2.json`, mỗi trường kèm trích dẫn nguyên văn làm
 *     bằng chứng; script kiểm rồi mới phát hành, và CHỈ mục đã qua
 *     science-editor (`review`) được phát hành. Bằng chứng (câu trích) ở lại
 *     trong repo để kiểm, không lên R2.
 * 3+ — quan hệ, cấp máu, thần kinh, lâm sàng… CHƯA có. Chưa khai báo trong
 *      schema cho tới khi có pipeline biên tập của chúng: một trường rỗng
 *      trong schema là lời mời điền bừa.
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
  "openstax-ap2e": {
    id: "openstax-ap2e",
    type: "textbook",
    title: "Anatomy and Physiology 2e",
    publisher: "OpenStax, Rice University",
    version: "2e",
    url: "https://openstax.org/details/books/anatomy-and-physiology-2e",
    /**
     * CC BY-NC-SA 4.0, KHÔNG phải CC BY (kiểm 2026-09-28 trên chính trang sách).
     * Dùng làm nguồn DỮ KIỆN: câu chữ Sciencepedia tự viết, không chép, không
     * phỏng theo câu, không dùng hình — nếu không, trang kế thừa ràng buộc phi
     * thương mại + share-alike. Xem docs/content-rules.md.
     */
    license: "CC BY-NC-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    usage: "facts-only",
    urlTemplate: "https://openstax.org/books/anatomy-and-physiology-2e/pages/{section}",
    accessedAt: "2026-09-28",
  },
  /**
   * Nguồn cho mục Level 2 MỚI từ 2026-10-03: trang sách OpenStax ghi "may not be
   * used in the training of large language models or otherwise be ingested into
   * large language models or generative AI offerings without OpenStax's prior
   * written permission" — mà mục Level 2 do AI soạn. `section` là tên bài (dạng URL).
   */
  "wikipedia-en": {
    id: "wikipedia-en",
    type: "encyclopedia",
    title: "Wikipedia",
    publisher: "Wikimedia Foundation",
    url: "https://en.wikipedia.org/",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    usage: "facts-only",
    urlTemplate: "https://en.wikipedia.org/wiki/{section}",
    accessedAt: "2026-10-03",
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

// ------------------------------------------------------------- Level 2

const bilingual = z.object({ vi: z.string().min(1), en: z.string().min(1) });
export type Bilingual = z.infer<typeof bilingual>;

export const CONTENT_FIELDS = ["summary", "location", "function"] as const;
export type ContentField = (typeof CONTENT_FIELDS)[number];

const contentFieldsSchema = {
  summary: bilingual,
  location: bilingual.nullable(),
  function: bilingual.nullable(),
};

/** Tệp viết tay `data/anatomy/content-l2.json` — có bằng chứng, có trạng thái duyệt. */
export const contentFileSchema = z.object({
  schema: z.literal(1),
  sources: z.record(z.string(), z.object({ id: z.string() }).passthrough()),
  entries: z.record(
    fmaIdSchema,
    z.object({
      ...contentFieldsSchema,
      evidence: z
        .array(
          z.object({
            source: z.string(),
            /** Slug mục trong nguồn, dựng URL bằng `urlTemplate`. */
            section: z.string(),
            /** Nguyên văn, ngắn — để kiểm; không phát hành. */
            quote: z.string().min(10).max(400),
            supports: z.array(z.enum(CONTENT_FIELDS)).min(1),
          }),
        )
        .min(1),
      /** Điều nguồn nói mà cố ý không viết, và vì sao. */
      omitted: z.string().optional(),
      review: z
        .object({
          by: z.literal("science-editor"),
          at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          verdict: z.enum(["approved", "approved-with-edits"]),
          notes: z.string().optional(),
        })
        .optional(),
    }),
  ),
});

export type ContentFile = z.infer<typeof contentFileSchema>;

function releasedContentSchema() {
  return z.object({
    ...contentFieldsSchema,
    /** Một mục mỗi (nguồn, mục) — URL mở thẳng đúng mục sách, kèm trường nó chống lưng. */
    sources: z
      .array(
        z.object({
          ref: z.string(),
          section: z.string(),
          url: z.string().url(),
          supports: z.array(z.enum(CONTENT_FIELDS)),
        }),
      )
      .min(1),
    review: z.object({ by: z.literal("science-editor"), at: z.string() }),
  });
}

export type StructureContent = z.infer<ReturnType<typeof releasedContentSchema>>;

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
      via: z.string().url().optional(),
      /** `facts-only`: nguồn chỉ cho dữ kiện, câu chữ là của Sciencepedia. */
      usage: z.literal("facts-only").optional(),
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
  /** Level 2, chỉ mục đã duyệt. Khoá có thể là mã không có mảnh (Phổi, Nhãn cầu) — cấu trúc con kế thừa qua is-a. */
  content: z.record(fmaIdSchema, releasedContentSchema()).default({}),
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

/**
 * Nội dung Level 2 để hiện cho một cấu trúc, và nó nói về cấu trúc nào.
 *
 * Của chính nó trước. Không có thì đi lên theo is-a ("Xương đùi trái" là một
 * "Xương đùi"), rồi thử cha part-of chính ("Phần ức sườn cơ ngực lớn trái"
 * thuộc "Cơ ngực lớn trái", là một "Cơ ngực lớn"). `about` khác `id` thì bảng
 * chi tiết PHẢI nói rõ đoạn văn đang tả cấu trúc nào — cùng lý do với nhãn
 * "Tổng quan · hệ": không để người đọc tưởng đó là mô tả của đúng mảnh đang chọn.
 */
export function resolveContent(
  data: AnatomyData,
  id: string,
): { about: string; content: StructureContent } | null {
  const viaIsA = (start: string): { about: string; content: StructureContent } | null => {
    let current: string | undefined = start;
    for (let hop = 0; current && hop < 4; hop++) {
      const content = data.content[current];
      if (content) return { about: current, content };
      current = data.structures[current]?.classification.isA[0];
    }
    return null;
  };
  const own = viaIsA(id);
  if (own) return own;
  const structure = data.structures[id];
  const parent = structure ? primaryPartOf(data, structure) : null;
  return parent ? viaIsA(parent) : null;
}

/** Tên Anh của một mã FMA bất kỳ trong dữ liệu (cấu trúc hoặc cha được trỏ tới). */
export function fmaName(data: AnatomyData, id: string): string | null {
  return data.structures[id]?.names.en ?? data.terms[id] ?? null;
}
