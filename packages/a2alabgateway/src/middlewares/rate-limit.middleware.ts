import rateLimit from 'express-rate-limit'
import { type Request, type Response, type NextFunction } from 'express'

/**
 * Rate Limiter interno para endpoints de creación de simulaciones.
 * Protege contra abuso de recursos LLM costosos.
 * Límite: 2 simulaciones por minuto por IP.
 */
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 2,
    message: { error: 'Too many simulation requests. Please wait before starting a new one.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown'
    }
})

/**
 * Middleware selectivo: solo aplica rate limiting a rutas POST de inicio de simulación.
 * Para cualquier otra ruta, simplemente pasa al siguiente middleware.
 */
export const simulationRateLimit = (req: Request, res: Response, next: NextFunction) => {
    // Solo aplicar rate limit a POST de inicio de simulaciones
    const fullPath = req.baseUrl + req.path
    const isSimulationStart = req.method === 'POST' && /\/v1\/simulation\/\w+\/start$/.test(fullPath)

    if (isSimulationStart) {
        return limiter(req, res, next)
    }

    // Para todas las demás rutas, pasar de largo
    next()
}
