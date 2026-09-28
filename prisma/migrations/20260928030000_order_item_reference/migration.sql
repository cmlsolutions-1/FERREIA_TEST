ALTER TABLE "OrderItem"
ADD COLUMN "reference" TEXT NOT NULL DEFAULT '';

UPDATE "OrderItem" AS item
SET "reference" = product."reference"
FROM "Product" AS product
WHERE item."productId" = product."id";
