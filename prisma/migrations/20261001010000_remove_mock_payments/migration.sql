-- El panel de pagos ahora se alimenta exclusivamente de operaciones confirmadas por Mercado Pago.
DELETE FROM "Payment"
WHERE "id" IN (
  'MP-1049287612',
  'MP-1049287441',
  'MP-1049287018',
  'MP-1049286882',
  'MP-1049286205',
  'MP-1049285994',
  'MP-1049285180'
);
