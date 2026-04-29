# Plan de Despliegue: api-documentation en Railway

Este plan detalla los pasos para aislar y dockerizar el servicio `api-documentation` para su despliegue en Railway, respetando la restricción de usar Node.js 20 LTS y NPM, y respondiendo a la viabilidad de migrarlo a Bun.

## ⚠️ User Review Required

Por favor, revisa las modificaciones propuestas para `index.ts` y `swagger.config.ts`. Estas son necesarias para que la app respete el entorno de Railway (`PORT` y `FLOWISE_URL`), ya que actualmente están hardcodeadas a `6655` y `http://localhost:3000/api/v1`.

## Open Questions

> [!IMPORTANT]
>
> -   ¿El archivo `src/yml/swagger.yml` se actualiza dinámicamente o es completamente estático? Si otros paquetes del monorepo generan este archivo, ¿necesitamos copiar algo más durante el build?
> -   En Railway, ¿el servicio se llamará diferente a la URL por defecto? Te pregunto para asegurar que el CORS del backend principal permita requests desde este dominio si interactúa con él.

## Proposed Changes

---

### Modificaciones al Código Base

#### [MODIFY] `index.ts` (file:///home/bryan/Desktop/trabajo-programacion/latamearth/Flow-stable/packages/api-documentation/src/index.ts)

Se actualizará para que el puerto no esté hardcodeado:

```diff
- const port = 6655
+ const port = process.env.PORT || 6655
```

#### [MODIFY] `swagger.config.ts` (file:///home/bryan/Desktop/trabajo-programacion/latamearth/Flow-stable/packages/api-documentation/src/configs/swagger.config.ts)

Se actualizará para leer la URL del backend desde las variables de entorno:

```diff
- url: 'http://localhost:3000/api/v1',
+ url: process.env.FLOWISE_URL || 'http://localhost:3000/api/v1',
```

---

### Archivos de Despliegue

#### [NEW] `Dockerfile` (file:///home/bryan/Desktop/trabajo-programacion/latamearth/Flow-stable/packages/api-documentation/Dockerfile)

Se creará un Dockerfile Multi-stage:

```dockerfile
# Etapa 1: Builder
FROM node:20-slim as builder
WORKDIR /app

# Copiar configuración de dependencias
COPY package.json package-lock.json* ./
RUN npm ci

# Copiar el resto del código y compilar
COPY . .
RUN npm run build

# Etapa 2: Runner
FROM node:20-slim as runner
WORKDIR /app

# Copiar solo lo estrictamente necesario desde el builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/yml/swagger.yml ./src/yml/swagger.yml
# Recomendable copiar el package.json por si algún módulo lo consulta
COPY --from=builder /app/package.json ./package.json

EXPOSE 6655

CMD ["node", "dist/index.js"]
```

#### [NEW] `railway.json` (file:///home/bryan/Desktop/trabajo-programacion/latamearth/Flow-stable/packages/api-documentation/railway.json)

Configuración nativa de Railway para forzar puerto y comportamiento:

```json
{
    "$schema": "https://railway.app/railway.schema.json",
    "build": {
        "builder": "DOCKER",
        "dockerfilePath": "Dockerfile"
    },
    "deploy": {
        "numReplicas": 1,
        "sleepApplication": false,
        "restartPolicyType": "ON_FAILURE"
    }
}
```

_(Nota: El puerto en Railway generalmente se inyecta via la variable de entorno `PORT`, por lo que modificar el `index.ts` hará que escuche en el puerto que Railway le asigne internamente, mientras que el router de Railway mapea el 80/443 a ese puerto. Si es OBLIGATORIO forzarlo al 6655, Railway ignorará el $PORT y ruteará al 6655 si lo exponemos en el Dockerfile, pero es mejor práctica escuchar a `process.env.PORT`)._

## ¿Se puede hacer con Bun?

**SÍ, rotundo.**
El servicio `api-documentation` es simplemente un servidor Express levantando un middleware de Swagger-UI. Bun es 100% compatible con la API de Node.js que usa Express y Swagger.

**Ventajas de hacerlo con Bun:**

1. **Evitarías la etapa de Build (TSC):** Bun ejecuta TypeScript de forma nativa. Podrías eliminar la etapa builder y arrancar la app con `bun src/index.ts`.
2. **Imagen más rápida y ligera:** Al no tener que llevar Node ni hacer transpilación, un Dockerfile con `oven/bun:alpine` es ridículamente rápido y pequeño.
3. **Mantenés consistencia:** Si `gbai-agents` ya usa Bun, unificar el _toolchain_ te salva de dolores de cabeza (no lidiar con NPM lockfiles vs Bun lockfiles en CI/CD).

Si me das el visto bueno, ejecuto el plan con Node.js 20-slim como pediste originalmente. O si preferís, te armo la versión full Bun.
