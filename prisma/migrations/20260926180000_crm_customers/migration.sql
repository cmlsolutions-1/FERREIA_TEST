CREATE TABLE "CrmCustomer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrmCustomer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CrmCustomer_document_key" ON "CrmCustomer"("document");
CREATE UNIQUE INDEX "CrmCustomer_email_key" ON "CrmCustomer"("email");
CREATE INDEX "CrmCustomer_name_idx" ON "CrmCustomer"("name");

-- Retira la cuenta de demostración del módulo de clientes sin borrar pedidos.
UPDATE "Order" SET "customerId" = NULL WHERE "customerId" = 'USR-001';
DELETE FROM "Customer" WHERE "id" = 'USR-001' AND "email" = 'lenin@ejemplo.com';
