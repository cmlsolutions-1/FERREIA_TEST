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

Para probar Checkout Pro, configura el Access Token y la Public Key de una **cuenta vendedora de prueba** de Mercado Pago. `MERCADOPAGO_ENVIRONMENT=sandbox` es la etiqueta interna que usa FERREIA para identificar operaciones de prueba; el checkout abre el `init_point` normal que devuelve Mercado Pago:

```env
MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_WEBHOOK_SECRET=
MERCADOPAGO_ENVIRONMENT=sandbox
```

`MERCADOPAGO_WEBHOOK_SECRET` se obtiene en **Tus integraciones → Webhooks**. Mercado Pago no acepta `localhost` como URL de retorno: para el retorno automático y el Webhook, `NEXT_PUBLIC_APP_URL` debe ser una URL HTTPS pública del despliegue o de un túnel local. Cuando FERREIA se abre desde `localhost`, el checkout se abre en otra pestaña y la tienda permanece abierta; esta consulta el pago cada 10 segundos y muestra el resultado confirmado. Si cierras la tienda, al volver a `/checkout` se retoma la consulta del pedido guardado en esa sesión del navegador. El administrador también puede usar **Pagos → Sincronizar Mercado Pago**.

Para la compra de prueba, abre una ventana de incógnito e inicia sesión en Mercado Pago con una **cuenta compradora de prueba**. Debe ser distinta de la cuenta vendedora asociada al Access Token y ambas deben pertenecer a Colombia. Usa una tarjeta de prueba; no mezcles cuentas reales y de prueba. El carrito se conserva mientras el pago esté pendiente y solo se limpia cuando Mercado Pago confirma la aprobación.

### FerreBot durante el desarrollo local

Si ejecutas Next.js con `npm run dev`, FerreBot necesita un servidor Ollama accesible desde tu equipo. Puedes instalar Ollama localmente e iniciar el servicio:

```bash
ollama serve
```

En otra terminal descarga el modelo indicado en `OLLAMA_MODEL`:

```bash
ollama pull <modelo-configurado-en-OLLAMA_MODEL>
```

Configura `OLLAMA_BASE_URL=http://127.0.0.1:11434` y `OLLAMA_MODEL=qwen2.5vl:3b` en `.env`. Si Next.js corre dentro de Docker y Ollama está instalado en el equipo anfitrión, usa `http://host.docker.internal:11434` en la configuración básica de Compose. Esa dirección no es la configuración recomendada para un VPS Linux.

### FerreBot en un VPS con Docker

En un VPS, Ollama debe ejecutarse **en el servidor o en un servicio de inferencia accesible desde él**. La instalación de Ollama en el computador del administrador no sirve a la aplicación desplegada. Para alojarlo en el mismo VPS, usa el archivo adicional `docker-compose.ai.yml`:

```bash
docker compose -f docker-compose.yml -f docker-compose.ai.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.ai.yml ps
docker compose -f docker-compose.yml -f docker-compose.ai.yml logs -f ollama-pull
```

Esta configuración levanta PostgreSQL, Next.js y Ollama en la red privada de Compose. Next.js se conecta a `http://ollama:11434`; el navegador solo llama a `/api/ai/project-advisor`. El puerto 11434 **no se publica en el VPS**. `ollama-pull` descarga el modelo indicado por `OLLAMA_MODEL` antes de iniciar la aplicación. La primera descarga necesita conexión a Internet y espacio en disco. Los archivos del modelo permanecen en el volumen `ollama_data` al reiniciar o recrear los contenedores. No ejecutes `docker compose down -v` si deseas conservar los modelos y la base de datos.

Para comprobar el modelo y la conexión sin exponer Ollama:

```bash
docker compose -f docker-compose.yml -f docker-compose.ai.yml exec ollama ollama list
docker compose -f docker-compose.yml -f docker-compose.ai.yml exec app node -e 'fetch("http://ollama:11434/api/tags").then(r=>{if(!r.ok)process.exit(1);return r.json()}).then(d=>console.log(d.models.map(m=>m.name)))'
```

El modelo visual `qwen2.5vl:3b` consume memoria y CPU o GPU del VPS; verifica el rendimiento con consultas reales antes de abrir FerreBot a todos los clientes. Un VPS pequeño puede tardar más que `OLLAMA_TIMEOUT_MS` o quedarse sin memoria. Si ya dispones de un servidor de inferencia separado, mantén `docker-compose.yml` y configura `OLLAMA_BASE_URL` con su dirección privada accesible desde el contenedor de Next.js. No expongas la API de Ollama directamente a Internet.

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
