-- CreateEnum
CREATE TYPE "ClassificationKind" AS ENUM ('LINE', 'GROUP', 'SUBGROUP');

-- CreateTable
CREATE TABLE "ProductClassification" (
    "id" TEXT NOT NULL,
    "kind" "ClassificationKind" NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductClassification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductClassification_kind_active_name_idx" ON "ProductClassification"("kind", "active", "name");

-- CreateIndex
CREATE INDEX "ProductClassification_parentId_idx" ON "ProductClassification"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductClassification_kind_parentId_name_key" ON "ProductClassification"("kind", "parentId", "name");

-- AddForeignKey
ALTER TABLE "ProductClassification" ADD CONSTRAINT "ProductClassification_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProductClassification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
