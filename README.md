# FERREIA

## Instalación en un equipo nuevo

Requisitos: Node.js 22, npm y Docker Desktop.

### 1. Crear el archivo `.env`

En macOS o Linux:

```bash
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Completa en `.env` las variables de PostgreSQL, administrador y Gmail. El puerto de `DATABASE_URL` debe coincidir con `POSTGRES_PORT`.

Para probar pagos configura las credenciales de prueba de Mercado Pago y conserva el ambiente sandbox:

```env
MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_WEBHOOK_SECRET=
MERCADOPAGO_ENVIRONMENT=sandbox
```

`MERCADOPAGO_WEBHOOK_SECRET` se obtiene en **Tus integraciones → Webhooks**. Mercado Pago no puede llamar URLs `localhost`: para probar el retorno automático y el Webhook, `NEXT_PUBLIC_APP_URL` debe ser una URL HTTPS pública del despliegue o de un túnel local. Sin URL pública el checkout sandbox funciona y el administrador puede traer el resultado con **Pagos → Sincronizar Mercado Pago**.

En sandbox, inicia la compra en una ventana de incógnito y entra a Mercado Pago con una **cuenta compradora de prueba**. Debe ser distinta de la cuenta vendedora asociada al access token y ambas deben pertenecer a Colombia. No uses una cuenta real: Mercado Pago bloquea las operaciones que mezclan usuarios reales y de prueba. El carrito se conserva mientras el pago esté pendiente y solo se limpia cuando Mercado Pago confirma la aprobación.

Si vas a usar FerreBot, instala Ollama. Inicia el servicio en una terminal:

```bash
ollama serve
```

En otra terminal descarga el modelo indicado en `OLLAMA_MODEL`:

```bash
ollama pull <modelo-configurado-en-OLLAMA_MODEL>
```

Cuando Next.js corre con `npm run dev`, `OLLAMA_BASE_URL` normalmente es `http://127.0.0.1:11434`. Si Next.js corre dentro de Docker y Ollama está instalado en el equipo anfitrión, usa `http://host.docker.internal:11434`.

### 2. Instalar las dependencias

```bash
npm ci
```

### 3. Levantar PostgreSQL con Docker

```bash
docker compose up -d postgres
docker compose ps
```

El contenedor `ferreia-postgres` debe aparecer como `healthy`.

### 4. Preparar Prisma

```bash
npx prisma validate
npm run db:generate
npm run db:deploy
```

### 5. Ejecutar el seed

```bash
npm run db:seed
```

### 6. Iniciar FERREIA

```bash
npm run dev
```

Abrir en el navegador:

- Aplicación: http://localhost:3000
- Administrador: http://localhost:3000/admin
- Estado de la API: http://localhost:3000/api/health

## Resumen de comandos

```bash
cp .env.example .env
npm ci
docker compose up -d postgres
npx prisma validate
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

## Para iniciar el proyecto otro día

```bash
docker compose up -d postgres
npm run dev
```

## Después de descargar cambios nuevos

```bash
npm ci
docker compose up -d postgres
npm run db:generate
npm run db:deploy
npm run dev
```

Ejecuta `npm run db:seed` nuevamente solo si la base de datos está vacía o el cambio descargado agregó datos iniciales.

## Ejecutar todo con Docker

Si no quieres ejecutar Next.js con npm:

```bash
docker compose up -d --build
docker compose ps
```

Este modo aplica las migraciones, ejecuta el seed e inicia FERREIA automáticamente.

## Detener el proyecto

```bash
docker compose down
```

Este comando conserva la base de datos. No uses `docker compose down -v` porque elimina el volumen de PostgreSQL.

## Validaciones

```bash
npx prisma validate
npm run lint
npm run build
```
