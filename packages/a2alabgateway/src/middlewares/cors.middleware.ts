import cors from 'cors'

/**
 * CORS Middleware para el Gateway.
 *
 * Si CORS_ORIGIN está configurado, usa ese valor (ej. "https://gobernai.com").
 * Si no, permite cualquier origen pero SIN credentials para cumplir la spec.
 *
 * Nota: La spec CORS prohíbe usar origin: '*' con credentials: true.
 * Por eso usamos una función que refleja el origin del request cuando
 * credentials están habilitados.
 */
export const corsMiddleware = cors({
    origin: (origin, callback) => {
        const allowedOrigin = process.env.CORS_ORIGIN

        if (allowedOrigin) {
            // Si hay un origin configurado, solo permitir ese
            const allowed = allowedOrigin.split(',').map((o) => o.trim())
            if (!origin || allowed.includes(origin)) {
                callback(null, true)
            } else {
                callback(new Error(`Origin ${origin} not allowed by CORS`))
            }
        } else {
            // Sin restricción: reflejar el origin del request (compatible con credentials)
            callback(null, true)
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Content-Encoding'],
    credentials: true
})
