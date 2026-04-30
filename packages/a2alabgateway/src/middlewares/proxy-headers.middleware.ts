import { type Request, type Response, type NextFunction } from 'express'

/**
 * Middleware que inyecta los headers estándar de proxy inverso.
 * Le indica al upstream quién es el cliente real.
 */
export const proxyHeaders = (req: Request, _res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown'
    const proto = req.protocol || 'http'

    req.headers['x-forwarded-for'] = (req.headers['x-forwarded-for'] as string) || clientIp
    req.headers['x-forwarded-proto'] = (req.headers['x-forwarded-proto'] as string) || proto
    req.headers['x-real-ip'] = (req.headers['x-real-ip'] as string) || clientIp

    next()
}
