UPDATE "PurchaseOrder" AS purchase
SET "quotedTotal" = lines.total
FROM (
  SELECT "purchaseOrderId", SUM("orderedQty" * "quotedUnitCost") AS total
  FROM "PurchaseOrderLine"
  GROUP BY "purchaseOrderId"
) AS lines
WHERE purchase.id = lines."purchaseOrderId" AND purchase."quotedTotal" = 0;

UPDATE "PurchaseOrder"
SET "quotedTotal" = CASE id
  WHEN 'OC-2041' THEN 18400000
  WHEN 'OC-2040' THEN 9200000
  WHEN 'OC-2039' THEN 5600000
  WHEN 'OC-2038' THEN 12100000
END
WHERE id IN ('OC-2041', 'OC-2040', 'OC-2039', 'OC-2038')
  AND "quotedTotal" = 0
  AND NOT EXISTS (
    SELECT 1 FROM "PurchaseOrderLine" AS line
    WHERE line."purchaseOrderId" = "PurchaseOrder".id
  );
