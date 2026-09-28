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
