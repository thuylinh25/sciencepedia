export type SeedSource = {
  title: string;
  url?: string;
  publisher?: string;
  year?: number;
};

export type SeedArticle = {
  slug: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  content: string;
  contentEn?: string;
  coverImage?: string;
  categorySlug: string;
  tagSlugs: string[];
  featured?: boolean;
  seoKeywords?: string;
  sources?: SeedSource[];
};

export type SeedCategory = {
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  color: string;
  order: number;
  parentSlug?: string;
};

export type SeedTag = {
  slug: string;
  name: string;
  nameEn: string;
  color: string;
};
