-- Knowledge graph + truy xuất nguồn gốc biên tập.
--
-- Toàn bộ migration này chỉ THÊM: enum mới, bảng mới, cột nullable hoặc có
-- DEFAULT. Không đổi tên, không xoá, không đổi kiểu cột đang có, nên chạy
-- được trên bảng đang có dữ liệu mà không khoá ghi lâu.

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('CONCEPT', 'PHENOMENON', 'ORGANISM', 'SUBSTANCE', 'OBJECT', 'PROCESS', 'THEORY', 'LAW', 'METHOD', 'PERSON', 'EVENT', 'MISSION', 'DATASET', 'QUANTITY');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('IS_A', 'PART_OF', 'PREREQUISITE_OF', 'CAUSES', 'MEASURED_BY', 'DISCOVERED_BY', 'APPLIES_TO', 'CONTRASTS_WITH', 'EXAMPLE_OF');

-- CreateEnum
CREATE TYPE "FactCheckState" AS ENUM ('PENDING', 'PASSED', 'REVISE', 'FAILED');

-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "canonicalNameEn" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "wikidataQid" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL,
    "fromEntityId" TEXT NOT NULL,
    "toEntityId" TEXT NOT NULL,
    "relType" "RelationType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entity_slug_key" ON "Entity"("slug");
CREATE INDEX "Entity_entityType_idx" ON "Entity"("entityType");
CREATE INDEX "Entity_wikidataQid_idx" ON "Entity"("wikidataQid");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_fromEntityId_toEntityId_relType_key" ON "Relationship"("fromEntityId", "toEntityId", "relType");
CREATE INDEX "Relationship_toEntityId_relType_idx" ON "Relationship"("toEntityId", "relType");
CREATE INDEX "Relationship_relType_idx" ON "Relationship"("relType");

-- AlterTable: truy xuất nguồn gốc biên tập trên bài viết
ALTER TABLE "Article"
    ADD COLUMN "factCheck" "FactCheckState" NOT NULL DEFAULT 'PENDING',
    ADD COLUMN "reviewedById" TEXT,
    ADD COLUMN "reviewedAt" TIMESTAMP(3),
    ADD COLUMN "lastVerifiedAt" TIMESTAMP(3),
    ADD COLUMN "reverifyDueAt" TIMESTAMP(3),
    ADD COLUMN "entityId" TEXT;

-- AlterTable: nguồn tham khảo có bậc, DOI và trạng thái rút bài
ALTER TABLE "Source"
    ADD COLUMN "tier" INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN "doi" TEXT,
    ADD COLUMN "accessedAt" TIMESTAMP(3),
    ADD COLUMN "retractedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Article_entityId_idx" ON "Article"("entityId");
CREATE INDEX "Article_reviewedById_idx" ON "Article"("reviewedById");
-- Hàng đợi đối chiếu lại: content-curator quét cột này hằng tuần
CREATE INDEX "Article_reverifyDueAt_idx" ON "Article"("reverifyDueAt");

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_fromEntityId_fkey" FOREIGN KEY ("fromEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_toEntityId_fkey" FOREIGN KEY ("toEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Article" ADD CONSTRAINT "Article_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Article" ADD CONSTRAINT "Article_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Chặn tự nối: một entity không thể là tiền đề của chính nó.
-- Chu trình dài hơn phải kiểm ở tầng ứng dụng (knowledge-graph-manager).
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_no_self_edge" CHECK ("fromEntityId" <> "toEntityId");

-- Bậc nguồn chỉ nhận 1..4 theo phân cấp của science-editor
ALTER TABLE "Source" ADD CONSTRAINT "Source_tier_range" CHECK ("tier" BETWEEN 1 AND 4);
