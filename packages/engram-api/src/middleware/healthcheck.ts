import { Request, Response } from 'express'
import axios from 'axios'
import { StatusCodes } from 'http-status-codes'
import logger from '../utils/logger'

const ENGRAM_URL = process.env.ENGRAM_URL || 'http://localhost:7437'

export async function healthcheck(_req: Request, res: Response) {
    try {
        // Check Engram backend health
        await axios.get(`${ENGRAM_URL}/health`, { timeout: 3000 })
        res.status(StatusCodes.OK).json({
            status: 'healthy',
            engram: 'connected',
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        logger.warn('Engram backend health check failed', { error: (error as Error).message })
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
            status: 'degraded',
            engram: 'disconnected',
            timestamp: new Date().toISOString()
        })
    }
}
