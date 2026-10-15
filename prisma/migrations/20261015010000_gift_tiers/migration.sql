CREATE TABLE "GiftTier" (
  "id" TEXT NOT NULL,
  "minSubtotal" DECIMAL(14,2) NOT NULL,
  "maxSubtotal" DECIMAL(14,2),
  "stepAmount" DECIMAL(14,2) NOT NULL,
  "productId" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GiftTier_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "GiftTier" ADD CONSTRAINT "GiftTier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "GiftTier_active_minSubtotal_idx" ON "GiftTier"("active", "minSubtotal");
CREATE INDEX "GiftTier_productId_idx" ON "GiftTier"("productId");

ALTER TABLE "OrderItem" ADD COLUMN "isGift" BOOLEAN NOT NULL DEFAULT false;

INSERT INTO "Category" ("id", "slug", "name", "icon", "parentId", "active", "createdAt", "updatedAt")
VALUES ('gift-products', 'gp', 'GP', 'Gift', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
