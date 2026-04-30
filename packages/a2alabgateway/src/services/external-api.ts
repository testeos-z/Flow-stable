import { type Request, type Response } from 'express'
import { Readable } from 'stream'

// Timeout para rutas estándar (60 segundos)
const STANDARD_TIMEOUT = 60_000
// Timeout para rutas SSE (2 horas)
const SSE_TIMEOUT = 2 * 60 * 60 * 1000

/**
 * Servicio de proxy transparente para el Gateway.
 *
 * Diseño: "Caño ciego" — el Gateway no lee, no parsea, solo pasa datos.
 *
 * - Request body: Se pasa como stream crudo (soporta GZIP, binarios, JSON, lo que sea).
 * - Response JSON: Se pipea directo al cliente.
 * - Response SSE: Se pipea chunk por chunk sin buffering.
 */
export class ExternalApiService {
    private baseUrl: string

    constructor() {
        this.baseUrl = process.env.TARGET_API_URL || ''
    }

    /**
     * Determina si una ruta es de tipo SSE (streaming de larga duración).
     *
     * Rutas SSE reales del upstream:
     *   - POST /v1/a2a/{contextId}/chat       → SSE (streaming de chat)
     *   - POST /v1/a2a/{contextId}/task/{id}   → SSE (streaming de debate)
     *
     * NO son SSE:
     *   - GET /v1/a2a/chat/{id}/.well-known/agent.json  → JSON estándar
     */
    private isSSERoute(path: string, method: string): boolean {
        if (method !== 'POST') return false
        // Match: /v1/a2a/{contextId}/chat (sin .well-known)
        if (path.includes('/chat') && !path.includes('.well-known')) return true
        // Match: /v1/a2a/{contextId}/task/{taskId}
        if (/\/a2a\/[^/]+\/task\/[^/]+$/.test(path)) return true
        return false
    }

    /**
     * Construye los headers que se envían al upstream.
     * Limpia host y authorization (el Gateway ya validó el JWT).
     */
    private buildUpstreamHeaders(reqHeaders: Request['headers']): Record<string, string> {
        const headers: Record<string, string> = {}

        // Pasar headers relevantes (no todos)
        const passthrough = [
            'content-type',
            'content-encoding',
            'accept',
            'x-forwarded-for',
            'x-forwarded-proto',
            'x-real-ip',
            'x-requested-with'
        ]

        for (const key of passthrough) {
            if (reqHeaders[key]) {
                headers[key] = reqHeaders[key] as string
            }
        }

        return headers
    }

    /**
     * Proxy transparente: pasa la petición al upstream y pipea la respuesta al cliente.
     *
     * NO lee el body del request (soporta GZIP, binarios, etc.).
     * NO buferea la respuesta (soporta SSE, streaming de larga duración).
     */
    async bridgeRequest(req: Request, res: Response, path: string): Promise<void> {
        const url = `${this.baseUrl}${path}`
        const isSSE = this.isSSERoute(path, req.method)
        const timeout = isSSE ? SSE_TIMEOUT : STANDARD_TIMEOUT

        console.info(`[Gateway] ${req.method} ${path} → ${url} ${isSSE ? '(SSE)' : ''}`)

        try {
            const fetchOptions: RequestInit & { signal: AbortSignal } = {
                method: req.method,
                headers: this.buildUpstreamHeaders(req.headers),
                signal: AbortSignal.timeout(timeout)
            }

            // Para métodos con body (POST, PUT, PATCH, DELETE):
            // Pasamos el request como stream crudo — no parseamos nada.
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
                // Convertir el IncomingMessage (Node Readable) a un formato que fetch entienda
                fetchOptions.body = req as unknown as ReadableStream
                // @ts-ignore — Bun/Node soporta pasar un Readable como body de fetch
                fetchOptions.duplex = 'half'
            }

            const response = await fetch(url, fetchOptions)
            const contentType = response.headers.get('content-type') || ''

            // Copiar status code
            res.status(response.status)

            // Copiar headers relevantes de la respuesta del upstream
            const headersToForward = ['content-type', 'cache-control', 'connection', 'x-request-id']
            for (const header of headersToForward) {
                const value = response.headers.get(header)
                if (value) {
                    res.setHeader(header, value)
                }
            }

            // Si es SSE: pipear el stream directamente sin buffer
            if (contentType.includes('text/event-stream') || isSSE) {
                // Asegurar que Express no bufferea
                res.setHeader('Content-Type', 'text/event-stream')
                res.setHeader('Cache-Control', 'no-cache')
                res.setHeader('Connection', 'keep-alive')
                res.setHeader('X-Accel-Buffering', 'no') // Para nginx si hay uno delante
                res.flushHeaders()

                if (response.body) {
                    // Convertir Web ReadableStream a Node Readable y pipear
                    const nodeStream = Readable.fromWeb(response.body as any)
                    nodeStream.pipe(res)

                    // Limpiar si el cliente se desconecta
                    req.on('close', () => {
                        nodeStream.destroy()
                    })
                } else {
                    res.end()
                }
                return
            }

            // Para respuestas normales (JSON, text): también pipear como stream
            if (response.body) {
                const nodeStream = Readable.fromWeb(response.body as any)
                nodeStream.pipe(res)
            } else {
                res.end()
            }
        } catch (error: any) {
            if (error.name === 'TimeoutError') {
                console.error(`[Gateway Timeout] ${req.method} ${url}`)
                if (!res.headersSent) {
                    res.status(504).json({ error: 'Gateway Timeout: upstream did not respond in time' })
                }
                return
            }

            console.error(`[Gateway Error] ${req.method} ${url}:`, error.message || error)
            if (!res.headersSent) {
                res.status(502).json({ error: 'Bad Gateway: could not reach upstream' })
            }
        }
    }
}

export const externalApi = new ExternalApiService()
