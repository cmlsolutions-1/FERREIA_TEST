# Backend de FERREIA

## Arquitectura

El frontend React llama a los Route Handlers de `app/api`. Cada ruta valida con Zod, comprueba la sesión cuando aplica y delega en `server/modules/*/*.service.ts`. Los servicios aplican las reglas y llaman a repositorios; solo los repositorios acceden a Prisma. PostgreSQL 17 corre exclusivamente en Docker Compose. Las respuestas usan `{ ok, message, data }`, metadatos para colecciones y `{ ok: false, message, error: { code, details? } }` para errores.

## Requisitos y variables

- Node.js 22 y npm.
- Docker Desktop o Docker Engine con Compose.
- Copia `.env.example` a `.env` y cambia `POSTGRES_PASSWORD` y `ADMIN_PASSWORD`. `.env` no se versiona.
- `POSTGRES_PORT` es el puerto del host; `APP_PORT` permite elegir el puerto de la aplicación. Si 5432 u 3000 están ocupados, usa otros puertos libres.
- Con `npm run dev` en el host, `DATABASE_URL` usa `localhost:${POSTGRES_PORT}`. Dentro del servicio `app`, Compose configura automáticamente el host `postgres:5432`.
- Ninguna variable de base de datos o contraseña lleva prefijo `NEXT_PUBLIC_`.

## Desarrollo con Next.js local y PostgreSQL en Docker

```bash
docker compose up -d postgres
docker compose ps
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

El seed es idempotente para las entidades iniciales. Crea el administrador solo si `ADMIN_EMAIL` y `ADMIN_PASSWORD` están configurados. La contraseña se guarda como hash scrypt. No se crean clientes de ejemplo. Cambiar una contraseña ya sembrada requiere un procedimiento explícito: el seed no sobrescribe usuarios existentes.

## Ejecución completa en Docker

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app
docker compose logs -f postgres
```

El servicio `app` espera el healthcheck `pg_isready`, aplica las migraciones con `prisma migrate deploy`, ejecuta el seed y arranca el servidor standalone de Next.js. Para nuevas migraciones en desarrollo usa `npx prisma migrate dev --name nombre_del_cambio`; versiona `prisma/migrations/`. En producción se aplica `npx prisma migrate deploy`. No se usa `prisma db push` como procedimiento de despliegue.

`docker compose down` elimina contenedores y conserva `postgres_data`. `docker compose up -d` los vuelve a crear con los mismos datos. **`docker compose down -v` elimina los volúmenes y la base de datos**; no lo uses en mantenimiento normal. Las imágenes cargadas por la API se guardan en `uploads_data`.

## Endpoints

| Recurso | Rutas | Acceso |
| --- | --- | --- |
| Salud | `GET /api/health` | Público; consulta PostgreSQL |
| Productos | `GET, POST /api/products`; `GET, PATCH, DELETE /api/products/:id` | Lectura pública; escritura admin; DELETE desactiva |
| Bodegas | `GET, POST /api/warehouses`; `GET, PATCH, DELETE /api/warehouses/:id` | Admin; DELETE desactiva |
| Inventario | `GET /api/inventory/stock`; `GET /api/inventory/summary` | Admin; existencias y valorización desde PostgreSQL |
| Categorías | `GET, POST /api/categories`; `GET, PATCH, DELETE /api/categories/:id` | Lectura pública; escritura admin |
| Marcas | `GET, POST /api/brands`; `GET, PATCH, DELETE /api/brands/:id` | Lectura pública; escritura admin |
| Proveedores | `GET, POST /api/suppliers`; `GET, PATCH, DELETE /api/suppliers/:id`; `GET /api/suppliers/summary` | Admin; directorio, búsqueda, edición y resumen |
| Clasificaciones de artículos | `GET, POST /api/classifications`; `GET, PATCH /api/classifications/:id` | Admin; líneas, grupos y subgrupos |
| Promociones | `GET, POST /api/promotions`; `DELETE /api/promotions/:sku` | Lectura pública; escritura admin |
| Envíos | `GET, PUT /api/shipping` | Lectura pública; escritura admin |
| Pedidos | `GET, POST /api/orders`; `GET, PATCH /api/orders/:id`; `GET /api/orders/mine` | Crear público; listados y cambios con sesión; consulta invitado por número y correo |
| Compras | `GET, POST /api/purchase-orders`; `GET, PUT /api/purchase-orders/:id`; `POST /api/purchase-orders/:id/invoice` | Admin |
| Pagos | `GET /api/payments`; `GET /api/payments/:id` | Admin, solo lectura |
| Sesiones | `GET, POST, DELETE /api/auth/admin`; `GET, POST, PUT, DELETE /api/auth/customer` | Según sesión |
| Clientes | `GET, POST /api/customers` | Admin; directorio de cuentas y clientes CRM, con compras calculadas desde pedidos |
| Reportes | `GET /api/reports/summary`; `GET /api/reports/export/:kind` | Admin; indicadores consolidados y exportaciones CSV de resumen, ventas, inventario y compras |
| Imágenes | `POST /api/uploads/product-image` | Admin |

Las colecciones de productos, categorías, marcas, bodegas, existencias, pedidos, compras y pagos aceptan `page` y `limit` (máximo 100). Productos admite `search`, `category`, `brand`, `minPrice`, `maxPrice`, `active`, `featured` y `sort`. Existencias admite `search` y `warehouseId`; el resumen usa los mismos filtros y calcula unidades, valoración y bajo mínimo sobre todos los artículos coincidentes. La búsqueda y los filtros se ejecutan en PostgreSQL. Para probar, consulta `/api/products?search=taladro&page=1&limit=20`.

## Reglas de datos

- El seed conserva los IDs `p-...` de la tienda, el SKU y la referencia administrativa. Productos también se consultan por SKU o referencia. El producto se desactiva para preservar referencias de operaciones históricas.
- Los pedidos guardan nombre, SKU, imagen, precio unitario y total de cada línea como instantánea. Su creación descuenta stock y registra movimientos en una transacción. La cancelación restaura existencias una sola vez.
- La recepción de factura distribuye el flete por valor de línea, calcula el costo puesto en bodega y actualiza precio de venta solo cuando el administrador lo solicita. Si cambia el costo, registra revisión pendiente.
- Compras selecciona un proveedor activo por ID y artículos guardados en PostgreSQL. Las órdenes de demostración se retiraron y el seed ya no crea órdenes de compra; los totales de compras en Reportes consultan la API.
- El navegador no puede aprobar un pago. El panel muestra pagos históricos sembrados; la conexión real, credenciales y webhooks de Mercado Pago aún requieren una fase de integración con la cuenta del comercio.
- Los secretos de sesión son tokens aleatorios guardados como hashes y enviados en cookies HttpOnly.

## Respaldo y restauración

Haz un respaldo antes de restaurar. En PowerShell, con variables del `.env` cargadas en la sesión:

```powershell
docker compose exec -T postgres pg_dump -U $env:POSTGRES_USER -d $env:POSTGRES_DB -Fc -f /tmp/ferreia.backup
docker cp ferreia-postgres:/tmp/ferreia.backup .\ferreia.backup
docker cp .\ferreia.backup ferreia-postgres:/tmp/ferreia.backup
docker compose exec -T postgres pg_restore -U $env:POSTGRES_USER -d $env:POSTGRES_DB --clean --if-exists /tmp/ferreia.backup
```

En Bash también puedes usar redirección binaria:

```bash
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > ferreia.backup
docker compose exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists < ferreia.backup
```

## Estado de la migración del frontend

La tienda, catálogo principal, detalle, carrito, promociones, checkout y paneles de artículos, clasificaciones, marcas, proveedores, existencias, bodegas, pedidos, compras, envíos, pagos y reportes usan la API para sus datos principales. Reportes consolida ventas, compras, categorías y alertas de stock desde PostgreSQL, y calcula el margen estimado con el costo actual del producto porque las líneas de pedido aún no conservan costo histórico. El modelo actual asigna cada artículo a una bodega y guarda una existencia total; el inventario multibodega por ubicación se abordará cuando se migren las operaciones de traslado. Algunas pantallas administrativas secundarias del proyecto original todavía leen datos de ejemplo o `localStorage` (dashboard, movimientos y notas de inventario, simulador de Mercado Pago y ajustes de margen). No deben tratarse como fuente de verdad ni usarse para operaciones comerciales hasta completar su migración. Las cuentas de clientes y administrador ya usan PostgreSQL.
