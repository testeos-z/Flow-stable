# Etapa 1: Builder
FROM node:20-slim as builder
WORKDIR /app

# Copiar configuración de dependencias
# Se usa comodín para package-lock.json si existe
COPY package.json package-lock.json* ./
RUN npm install

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
COPY --from=builder /app/package.json ./package.json

# Railway inyecta PORT automáticamente
EXPOSE 6655

CMD ["node", "dist/index.js"]
