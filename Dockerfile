# Dockerfile principal para desplegar ÚNICAMENTE api-documentation
# Rama exclusiva para documentación de API

# Etapa 1: Builder
FROM node:20-slim as builder
WORKDIR /app

# Copiar configuración de dependencias del paquete específico
COPY packages/api-documentation/package*.json ./
RUN npm install

# Copiar el código del paquete y compilar
COPY packages/api-documentation/ .
RUN npm run build

# Etapa 2: Runner
FROM node:20-slim as runner
WORKDIR /app

# Copiar solo lo necesario desde el builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/yml/swagger.yml ./src/yml/swagger.yml
COPY --from=builder /app/package.json ./package.json

# Railway inyecta PORT automáticamente, escuchamos en el que asigne
EXPOSE 6655

CMD ["node", "dist/index.js"]