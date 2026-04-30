# ---- Stage 1: Dependencies ----
FROM oven/bun:1 AS deps
WORKDIR /app

# Copiamos solo los archivos de dependencias primero (cache layer)
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

# ---- Stage 2: Build ----
FROM oven/bun:1 AS builder
WORKDIR /app

# Copiamos deps instaladas
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build del proyecto
RUN bun run build

# ---- Stage 3: Runner (imagen final mínima) ----
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Solo copiamos lo necesario para correr
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 4100

CMD ["bun", "run", "dist/server.js"]
