import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { json, urlencoded } from 'express'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'
import { healthcheck } from './middleware/healthcheck'

export function createApp(): Application {
    const app = express()

    // Security
    app.use(helmet())
    app.use(
        cors({
            origin: process.env.CORS_ORIGIN || '*',
            credentials: true
        })
    )

    // Rate limiting
    const limiter = rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
        max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, res) => {
            res.status(429).json({ error: 'Too many requests, please try again later.' })
        }
    })
    app.use(limiter)

    // Body parsing
    app.use(json({ limit: '10mb' }))
    app.use(urlencoded({ extended: true, limit: '10mb' }))

    // Logging
    app.use(requestLogger)

    // Health check (before auth so it's always accessible)
    app.use('/health', healthcheck)

    // API routes
    app.use('/api/v1', routes)

    // Root redirect
    app.get('/', (_req, res) => {
        res.json({
            name: '@flowise/engram-api',
            version: process.env.npm_package_version || '1.0.0',
            status: 'ok',
            docs: '/api/v1/docs'
        })
    })

    // Error handling (must be last)
    app.use(errorHandler)

    return app
}
