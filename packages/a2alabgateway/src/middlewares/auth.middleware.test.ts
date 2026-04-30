import express from 'express'
import request from 'supertest'
import { verifyJwt } from './auth.middleware'
import * as jose from 'jose'
import { describe, it, expect, beforeEach } from 'bun:test'

describe('Auth Middleware', () => {
    let app: express.Application
    const secret = 'test_secret_key_123_456_789'
    process.env.JWT_SECRET = secret

    beforeEach(() => {
        app = express()
        app.use(express.json())
        app.get('/test', verifyJwt, (req, res) => {
            res.status(200).json({ user: (req as any).user })
        })
    })

    it('should return 401 if no authorization header is provided', async () => {
        const res = await request(app).get('/test')
        expect(res.status).toBe(401)
        expect(res.body.error).toBe('Unauthorized: No token provided')
    })

    it('should return 403 if an invalid token is provided', async () => {
        const res = await request(app).get('/test').set('Authorization', 'Bearer invalid_token')
        expect(res.status).toBe(403)
        expect(res.body.error).toBe('Forbidden: Invalid token')
    })

    it('should return 200 and set req.user if a valid token is provided', async () => {
        const jwtSecret = new TextEncoder().encode(secret)
        const token = await new jose.SignJWT({ id: 1, name: 'Test User' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('2h')
            .sign(jwtSecret)

        const res = await request(app).get('/test').set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.user).toMatchObject({ id: 1, name: 'Test User' })
    })
})
