import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import logger from '../utils/logger'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
    logger.error('Unhandled error:', { message: err.message, stack: err.stack })

    // Don't leak error details in production
    const isDev = process.env.NODE_ENV === 'development'

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Internal Server Error',
        message: isDev ? err.message : undefined,
        ...(isDev && { stack: err.stack })
    })
}
