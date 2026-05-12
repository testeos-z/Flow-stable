# @flowise/engram-api

REST API Gateway para [Engram](https://github.com/Gentleman-Programming/engram).

Este paquete expone los 19+ MCP tools de Engram como endpoints HTTP REST, permitiendo que cualquier servicio dentro del ecosistema Flowise (u otros consumidores) interactúe con la memoria de Engram sin necesidad de implementar el protocolo MCP.

> **Arquitectura en Railway**: Engram Cloud corre como un **servicio separado** dentro del mismo proyecto Railway, apuntando directamente al repositorio `Gentleman-Programming/engram`. Este paquete (el REST API Gateway) es otro servicio más que se conecta a Engram Cloud vía variables de entorno.

---

## Arquitectura en Railway

```
┌──────────────────────────────────────────────────────────────┐
│                  Railway Project: goberai/logs                │
│                                                               │
│  ┌─────────────────┐         ┌──────────────────────────┐    │
│  │   flowise       │         │   engram-cloud           │    │
│  │   (este repo)   │         │   (repo: Gentleman-      │    │
│  │                 │         │    Programming/engram)   │    │
│  │                 │         │   Dockerfile: docker/    │    │
│  │                 │         │    cloud/Dockerfile      │    │
│  └─────────────────┘         └──────────┬───────────────┘    │
│           │                              │                    │
│           │     ┌────────────────────────┘                    │
│           │     │      (Railway internal network)             │
│           │     ▼                                           │
│  ┌────────▼──────────────────────────────────────────────┐  │
│  │              engram-api (este paquete)                 │  │
│  │              REST API Gateway                          │  │
│  │              ENGRAM_URL → engram-cloud                 │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Setup en Railway

### Paso 1: Crear servicio Engram Cloud

1. En tu proyecto Railway `goberai/logs`, clickeá **New** → **Service**.
2. Seleccioná **GitHub Repo**.
3. Elegí el repositorio: `Gentleman-Programming/engram`.
4. Railway detectará automáticamente el repo. Configurá:
    - **Root Directory**: `/` (raíz del repo)
    - **Builder**: `Dockerfile`
    - **Dockerfile Path**: `docker/cloud/Dockerfile`
5. Agregá el addon **PostgreSQL** a este servicio.
6. Configurá las variables de entorno del servicio `engram-cloud`:

| Variable              | Valor                        | Descripción                 |
| --------------------- | ---------------------------- | --------------------------- |
| `ENGRAM_DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Conexión a Postgres         |
| `ENGRAM_JWT_SECRET`   | `<generar secreto>`          | Secreto para firmar tokens  |
| `ENGRAM_CLOUD_HOST`   | `0.0.0.0`                    | Bind a todas las interfaces |
| `ENGRAM_PORT`         | `18080`                      | Puerto del servicio         |
| `ENGRAM_CLOUD_TOKEN`  | `<token opcional>`           | Para modo autenticado       |

7. Deployá.

### Paso 2: Crear servicio engram-api (REST Gateway)

1. En el mismo proyecto Railway, clickeá **New** → **Service**.
2. Seleccioná **GitHub Repo**.
3. Elegí tu repositorio: `GobernAI/logs`.
4. Configurá:
    - **Root Directory**: `packages/engram-api`
    - **Builder**: `Dockerfile` (usa el `Dockerfile` de este paquete)
5. Configurá las variables de entorno:

| Variable           | Valor                                      | Descripción                   |
| ------------------ | ------------------------------------------ | ----------------------------- |
| `ENGRAM_URL`       | `https://<tu-engram-cloud>.up.railway.app` | URL del servicio Engram Cloud |
| `ENGRAM_API_TOKEN` | `<mismo token que engram-cloud>`           | Si usás autenticación         |
| `PORT`             | `7438`                                     | Puerto del gateway            |
| `NODE_ENV`         | `production`                               |                               |
| `LOG_LEVEL`        | `info`                                     |                               |

> **Tip**: Si ambos servicios están en el mismo proyecto Railway, podés usar el **internal hostname** de Engram Cloud en vez de la URL pública para evitar latencia y charges de egress. Encontralo en el panel de Engram Cloud → Settings → Internal hostname.

### Paso 3: Verificar conexión

```bash
# Healthcheck del gateway
curl https://<tu-engram-api>.up.railway.app/health

# Guardar una memoria
curl -X POST https://<tu-engram-api>.up.railway.app/api/v1/memories \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Railway deploy test",
    "content": "Engram Cloud running as separate Railway service!",
    "type": "decision",
    "project": "goberai"
  }'

# Buscar
curl "https://<tu-engram-api>.up.railway.app/api/v1/search?q=railway&project=goberai"
```

---

## Endpoints

| Método   | Ruta                     | Descripción            |
| -------- | ------------------------ | ---------------------- |
| `POST`   | `/api/v1/memories`       | Guardar memoria        |
| `GET`    | `/api/v1/memories`       | Listar/buscar memorias |
| `GET`    | `/api/v1/memories/:id`   | Obtener memoria por ID |
| `PUT`    | `/api/v1/memories/:id`   | Actualizar memoria     |
| `DELETE` | `/api/v1/memories/:id`   | Eliminar memoria       |
| `GET`    | `/api/v1/search?q=...`   | Búsqueda FTS5          |
| `GET`    | `/api/v1/context`        | Contexto reciente      |
| `GET`    | `/api/v1/timeline/:id`   | Timeline cronológico   |
| `POST`   | `/api/v1/sessions/start` | Iniciar sesión         |
| `POST`   | `/api/v1/sessions/end`   | Finalizar sesión       |
| `GET`    | `/api/v1/stats`          | Estadísticas           |
| `GET`    | `/api/v1/conflicts`      | Listar conflictos      |
| `POST`   | `/api/v1/conflicts/scan` | Escanear conflictos    |
| `POST`   | `/api/v1/sync/cloud`     | Sync a Engram Cloud    |
| `GET`    | `/health`                | Healthcheck            |

---

## Desarrollo Local

Si querés desarrollar el gateway localmente contra una instancia de Engram Cloud en Railway:

```bash
cd packages/engram-api
cp .env.example .env
# Editá .env y poné ENGRAM_URL=https://<tu-engram-cloud>.up.railway.app
pnpm install
pnpm dev
```

---

## Stack

| Servicio       | Repo                           | Runtime       | Imagen/Base                      |
| -------------- | ------------------------------ | ------------- | -------------------------------- |
| `engram-cloud` | `Gentleman-Programming/engram` | Go 1.25       | `docker/cloud/Dockerfile`        |
| `engram-api`   | `GobernAI/logs` (este paquete) | Node 20       | `packages/engram-api/Dockerfile` |
| `postgres`     | Railway addon                  | PostgreSQL 16 | Railway managed                  |
