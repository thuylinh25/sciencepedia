/**
 * Danh sách nguồn tin cậy được theo dõi hằng ngày.
 *
 * Mỗi nguồn phải có feed RSS/Atom **đã kiểm chứng trả về `<item>` thật**. Vài
 * trang trong danh sách mong muốn không có mặt ở đây vì máy chủ của họ từ chối
 * truy cập tự động, chứ không phải vì bị bỏ quên:
 *
 * - NIH, Mayo Clinic, APS Physics, GBIF — trả 403 cho mọi user-agent thử qua.
 * - Cleveland Clinic, CERN, National Geographic — không còn feed công khai
 *   (404 ở mọi đường dẫn feed từng dùng).
 * - USGS — trả 202 (tường lửa chống bot) thay vì nội dung.
 * - Nature Physics — feed có thật, nhưng trả trang chặn bot cho `fetch()` của
 *   Node dù curl lấy được: máy chủ lọc theo dấu vân tay TLS, nên chạy trên
 *   Vercel cũng sẽ hỏng. Bài của Nature vẫn trích dẫn tay được.
 * - PubMed, Encyclopedia of Life, NCBI — chỉ có API tra cứu theo truy vấn,
 *   không có dòng tin để theo dõi.
 * - Hubble và JWST — không có feed riêng nữa; tin của hai kính này chảy vào
 *   feed chung của NASA Science, vốn đã nằm trong danh sách.
 *
 * Những nguồn đó vẫn trích dẫn được bằng tay trong bài; chỉ là không tự động
 * lấy về được.
 */

export type KnowledgeFeed = {
  /** Mã ổn định, dùng làm tiền tố slug khi tiêu đề bài trùng nhau. */
  id: string;
  /** Tên nhà xuất bản, ghi vào phần dẫn nguồn. */
  publisher: string;
  homepage: string;
  feed: string;
  /** Slug danh mục Sciencepedia mà bài từ nguồn này rơi vào. */
  categorySlug: string;
  /** Ngôn ngữ nội dung gốc — tất cả nguồn quốc tế đều là tiếng Anh. */
  language: "en" | "vi";
  /**
   * Bỏ qua mục có URL khớp mẫu này. Vài nguồn dùng chung một feed cho cả tin
   * khoa học lẫn thông báo nội bộ; không lọc thì bản nháp đầy hồ sơ nhân sự.
   */
  skipUrl?: RegExp;
};

export const KNOWLEDGE_FEEDS: KnowledgeFeed[] = [
  // ---------- Vũ trụ ----------
  {
    id: "nasa",
    publisher: "NASA",
    homepage: "https://www.nasa.gov",
    feed: "https://www.nasa.gov/feed/",
    categorySlug: "vu-tru",
    language: "en",
  },
  {
    id: "nasa-science",
    publisher: "NASA Science",
    homepage: "https://science.nasa.gov",
    feed: "https://science.nasa.gov/feed/",
    categorySlug: "vu-tru",
    language: "en",
  },
  {
    id: "esa",
    publisher: "ESA",
    homepage: "https://www.esa.int",
    feed: "https://www.esa.int/rssfeed/Our_Activities/Space_Science",
    categorySlug: "vu-tru",
    language: "en",
  },
  {
    id: "jpl",
    publisher: "NASA JPL",
    homepage: "https://www.jpl.nasa.gov",
    feed: "https://www.jpl.nasa.gov/feeds/news/",
    categorySlug: "he-mat-troi",
    language: "en",
  },
  {
    id: "arxiv-astro",
    publisher: "arXiv (astro-ph)",
    homepage: "https://arxiv.org",
    feed: "http://export.arxiv.org/rss/astro-ph",
    categorySlug: "vu-tru-hoc",
    language: "en",
  },

  // ---------- Sức khoẻ ----------
  {
    id: "who",
    publisher: "WHO",
    homepage: "https://www.who.int",
    feed: "https://www.who.int/rss-feeds/news-english.xml",
    categorySlug: "suc-khoe",
    language: "en",
  },
  {
    id: "medlineplus",
    publisher: "MedlinePlus",
    homepage: "https://medlineplus.gov",
    feed: "https://medlineplus.gov/groupfeeds/new.xml",
    categorySlug: "suc-khoe",
    language: "en",
    // Feed "liên kết mới" trỏ phần lớn ra trang ngoài; ghi những mục đó là
    // nguồn MedlinePlus thì sai tên nhà xuất bản, nên chỉ giữ link nội bộ
    skipUrl: /^(?!https?:\/\/(?:www\.)?medlineplus\.gov\/)/i,
  },

  // ---------- Vật lý ----------
  {
    id: "physicsworld",
    publisher: "Physics World",
    homepage: "https://physicsworld.com",
    feed: "https://physicsworld.com/feed/",
    categorySlug: "vat-ly",
    language: "en",
  },
  {
    id: "science",
    publisher: "Science",
    homepage: "https://www.science.org",
    feed: "https://www.science.org/rss/news_current.xml",
    categorySlug: "vat-ly",
    language: "en",
  },

  // ---------- Sinh học ----------
  {
    id: "smithsonian",
    publisher: "Smithsonian Magazine",
    homepage: "https://www.si.edu",
    feed: "https://www.smithsonianmag.com/rss/latest_articles/",
    categorySlug: "sinh-hoc",
    language: "en",
  },

  // ---------- Trái Đất và Khí hậu ----------
  {
    id: "ipcc",
    publisher: "IPCC",
    homepage: "https://www.ipcc.ch",
    feed: "https://www.ipcc.ch/feed/",
    categorySlug: "trai-dat-va-khi-hau",
    language: "en",
  },
  {
    id: "noaa",
    publisher: "NOAA",
    homepage: "https://www.noaa.gov",
    feed: "https://www.noaa.gov/rss.xml",
    categorySlug: "trai-dat-va-khi-hau",
    language: "en",
    // Feed chung của cả cơ quan: lẫn hồ sơ lãnh đạo, học bổng, tuyển dụng
    skipUrl: /\/(our-people|leadership|scholarship|office-education|careers|jobs)\//i,
  },
];
