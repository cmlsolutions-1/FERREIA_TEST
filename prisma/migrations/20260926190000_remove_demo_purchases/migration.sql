-- Las cinco órdenes iniciales son datos de demostración. Se eliminan únicamente
-- si siguen intactas y sin factura, para respetar cualquier edición real.
DELETE FROM "PurchaseOrder"
WHERE "id" IN ('OC-2038', 'OC-2039', 'OC-2040', 'OC-2041', 'OC-2042')
  AND "createdAt" = "updatedAt"
  AND NOT EXISTS (SELECT 1 FROM "PurchaseInvoice" WHERE "purchaseOrderId" = "PurchaseOrder"."id");
