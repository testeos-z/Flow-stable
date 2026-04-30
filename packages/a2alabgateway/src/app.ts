import express, { type Application } from 'express'
import { router } from './routes'
import { verifyJwt } from './middlewares/auth.middleware'
import { corsMiddleware } from './middlewares/cors.middleware'
import { proxyHeaders } from './middlewares/proxy-headers.middleware'
import { simulationRateLimit } from './middlewares/rate-limit.middleware'

export function createApp(): Application {
    const app = express()

    // ──────────────────────────────────────────────
    // Middleware Global
    // ──────────────────────────────────────────────

    // CORS: permite peticiones desde el frontend (configurable vía CORS_ORIGIN)
    app.use(corsMiddleware)

    // ⚠️ NO usamos express.json() a propósito.
    // El Gateway es un "caño ciego": no lee el body.
    // Esto permite pasar payloads GZIP, binarios y streams sin parsear.

    // ──────────────────────────────────────────────
    // Rutas Públicas
    // ──────────────────────────────────────────────

    // Healthcheck (sin auth)
    app.get('/health', (_req, res) => res.json({ status: 'ok' }))

    // ──────────────────────────────────────────────
    // Rutas Protegidas (requieren JWT)
    // ──────────────────────────────────────────────

    // Todas las rutas bajo /v1 requieren JWT y proxy headers.
    // Rate limiting se aplica solo a POST /v1/simulation/*/start
    // como middleware inline dentro del mismo chain.
    app.use('/v1', verifyJwt, proxyHeaders, simulationRateLimit, router)

    return app
}
