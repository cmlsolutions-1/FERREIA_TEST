ALTER TABLE "Promotion"
ADD COLUMN "baseInnerPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN "baseMasterPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN "unitEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "unitDiscount" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN "innerEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "innerDiscount" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN "masterEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "masterDiscount" DECIMAL(5,2) NOT NULL DEFAULT 0;

UPDATE "Promotion" AS promotion
SET
  "unitDiscount" = CASE
    WHEN promotion."basePrice" > 0 AND promotion."salePrice" < promotion."basePrice"
      THEN ROUND((1 - promotion."salePrice" / promotion."basePrice") * 100, 2)
    ELSE 0
  END,
  "baseInnerPrice" = COALESCE((
    SELECT tier."unitPrice"
    FROM "ProductPriceTier" AS tier
    WHERE tier."productId" = promotion."productId" AND tier."kind" = 'inner'
    LIMIT 1
  ), promotion."basePrice"),
  "baseMasterPrice" = COALESCE((
    SELECT tier."unitPrice"
    FROM "ProductPriceTier" AS tier
    WHERE tier."productId" = promotion."productId" AND tier."kind" = 'master'
    LIMIT 1
  ), promotion."basePrice");
