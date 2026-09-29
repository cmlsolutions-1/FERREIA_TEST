CREATE TYPE "ProductType" AS ENUM ('TOOL', 'MATERIAL', 'CONSUMABLE', 'FINISHED_PRODUCT');

ALTER TABLE "Product"
ADD COLUMN "productType" "ProductType" NOT NULL DEFAULT 'MATERIAL';

UPDATE "Product" SET "productType" = 'TOOL'
WHERE "id" IN ('p-002', 'p-003', 'p-008', 'p-009', 'p-011');

UPDATE "Product" SET "productType" = 'CONSUMABLE'
WHERE "id" = 'p-001';

UPDATE "Product" SET "productType" = 'FINISHED_PRODUCT'
WHERE "id" IN ('p-006', 'p-010');

CREATE INDEX "Product_productType_active_idx" ON "Product"("productType", "active");
