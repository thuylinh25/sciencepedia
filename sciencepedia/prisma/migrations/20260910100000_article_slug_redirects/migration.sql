CREATE TABLE "ArticleSlugRedirect" (
    "id" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleSlugRedirect_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ArticleSlugRedirect_oldSlug_key" ON "ArticleSlugRedirect"("oldSlug");
CREATE INDEX "ArticleSlugRedirect_articleId_idx" ON "ArticleSlugRedirect"("articleId");

ALTER TABLE "ArticleSlugRedirect"
ADD CONSTRAINT "ArticleSlugRedirect_articleId_fkey"
FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
