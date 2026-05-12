import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
    const start = Date.now()

    _res.on('finish', () => {
        const duration = Date.now() - start
        logger.info('HTTP request', {
            method: req.method,
            path: req.path,
            statusCode: _res.statusCode,
            durationMs: duration,
            userAgent: req.get('user-agent'),
            ip: req.ip
        })
    })

    next()
}
