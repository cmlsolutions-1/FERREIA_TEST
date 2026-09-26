-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "category" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "commercialTerms" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Supplier_active_name_idx" ON "Supplier"("active", "name");

-- CreateIndex
CREATE INDEX "Supplier_city_idx" ON "Supplier"("city");
