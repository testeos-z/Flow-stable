import { type Request, type Response, type NextFunction } from 'express'
import * as jose from 'jose'

export const verifyJwt = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' })
    }

    const token = authHeader.split(' ')[1]

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret')
        const { payload } = await jose.jwtVerify(token, secret)
        ;(req as any).user = payload
        next()
    } catch (err) {
        return res.status(403).json({ error: 'Forbidden: Invalid token' })
    }
}
