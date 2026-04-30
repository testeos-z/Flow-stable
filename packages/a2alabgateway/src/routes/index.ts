import { Router, type Request, type Response } from 'express'
import { externalApi } from '../services/external-api'

export const router = Router()

/**
 * Handler genérico del Gateway.
 * Toma el path completo que llega después del punto de montaje
 * y lo reenvía al upstream tal cual.
 */
const bridgeHandler = async (req: Request, res: Response) => {
    // req.baseUrl contiene el punto de montaje (ej. /v1/simulation)
    // req.path contiene el resto (ej. /one/start)
    // Reconstruimos el path completo para el upstream
    const fullPath = req.baseUrl + req.path

    await externalApi.bridgeRequest(req, res, fullPath)
}

// Capturar TODAS las peticiones que lleguen a este router
router.all('/*', bridgeHandler)
