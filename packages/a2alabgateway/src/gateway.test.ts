import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import express from 'express'
import request from 'supertest'
import http from 'http'

/**
 * Mock Upstream Server
 * Simula la API de Railway (GobernAI) para validar el comportamiento del Gateway.
 */
function createMockUpstream(): express.Application {
    const app = express()

    // Endpoint que refleja el body recibido tal cual (para validar passthrough)
    app.post('/v1/simulation/:case/start', express.json(), (req, res) => {
        res.status(202).json({
            status: 'pending',
            simulation_id: req.body.simulation_id || 'mock-id',
            received_body: req.body
        })
    })

    // Endpoint que refleja headers recibidos (para validar proxy headers)
    app.get('/v1/a2a/agents', (req, res) => {
        res.json({
            data: {
                agents: [],
                forwarded_for: req.headers['x-forwarded-for'] || null,
                forwarded_proto: req.headers['x-forwarded-proto'] || null
            }
        })
    })

    // Endpoint .well-known (JSON, NOT SSE) — verifica que el Gateway no lo trate como SSE
    app.get('/v1/a2a/chat/:masterAgentId/.well-known/agent.json', (req, res) => {
        res.json({
            name: 'TestAgent',
            description: 'Mock agent card',
            masterAgentId: req.params.masterAgentId
        })
    })

    // Endpoint SSE que emite 3 eventos y cierra
    app.post('/v1/a2a/:contextId/chat', (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive'
        })

        const events = [
            'event: message\ndata: {"agent1":{"message":"Hola "}}\n\n',
            'event: message\ndata: {"agent1":{"message":"mundo"}}\n\n',
            'event: done\ndata: {"status":"completed"}\n\n'
        ]

        let i = 0
        const interval = setInterval(() => {
            if (i < events.length) {
                res.write(events[i])
                i++
            } else {
                clearInterval(interval)
                res.end()
            }
        }, 50)
    })

    // Endpoint GZIP echo: recibe raw body y lo devuelve tal cual
    app.post('/v1/a2a/:contextId/chat-gzip', (req, res) => {
        const chunks: Buffer[] = []
        req.on('data', (chunk) => chunks.push(chunk))
        req.on('end', () => {
            const rawBody = Buffer.concat(chunks)
            res.json({
                received_encoding: req.headers['content-encoding'] || 'none',
                received_content_type: req.headers['content-type'] || 'unknown',
                body_size: rawBody.length
            })
        })
    })

    return app
}

/**
 * Tests del Gateway
 */
describe('Gateway Integration', () => {
    let mockUpstreamServer: http.Server
    let mockUpstreamPort: number

    beforeAll(async () => {
        const mockApp = createMockUpstream()
        mockUpstreamServer = mockApp.listen(0) // Puerto aleatorio
        const addr = mockUpstreamServer.address()
        mockUpstreamPort = typeof addr === 'object' && addr ? addr.port : 0
        process.env.TARGET_API_URL = `http://localhost:${mockUpstreamPort}`
        process.env.JWT_SECRET = 'test_secret_for_gateway'
    })

    afterAll(() => {
        mockUpstreamServer.close()
    })

    // Helper: genera un JWT válido para pasar el middleware de auth
    async function generateValidToken(): Promise<string> {
        const { SignJWT } = await import('jose')
        const secret = new TextEncoder().encode('test_secret_for_gateway')
        return new SignJWT({ id: 1, name: 'Test User' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('2h')
            .sign(secret)
    }

    describe('Routing', () => {
        it('should proxy POST /v1/simulation/one/start to upstream', async () => {
            // Re-import to pick up env changes
            const { createApp } = await import('./app')
            const app = createApp()
            const token = await generateValidToken()

            const res = await request(app)
                .post('/v1/simulation/one/start')
                .set('Authorization', `Bearer ${token}`)
                .send({ simulation_id: 'test-uuid', title: 'Test' })

            expect(res.status).toBe(202)
            expect(res.body.status).toBe('pending')
            expect(res.body.simulation_id).toBe('test-uuid')
        })

        it('should proxy GET /v1/a2a/agents to upstream', async () => {
            const { createApp } = await import('./app')
            const app = createApp()
            const token = await generateValidToken()

            const res = await request(app).get('/v1/a2a/agents').set('Authorization', `Bearer ${token}`)

            expect(res.status).toBe(200)
            expect(res.body.data.agents).toBeInstanceOf(Array)
        })

        it('should proxy GET /v1/a2a/chat/{id}/.well-known/agent.json as JSON (not SSE)', async () => {
            const { createApp } = await import('./app')
            const app = createApp()
            const token = await generateValidToken()

            const res = await request(app).get('/v1/a2a/chat/agent123/.well-known/agent.json').set('Authorization', `Bearer ${token}`)

            expect(res.status).toBe(200)
            expect(res.headers['content-type']).toContain('application/json')
            expect(res.headers['content-type']).not.toContain('text/event-stream')
            expect(res.body.name).toBe('TestAgent')
        })
    })

    describe('SSE Streaming', () => {
        it('should stream SSE events without buffering', async () => {
            const { createApp } = await import('./app')
            const app = createApp()
            const token = await generateValidToken()

            const res = await request(app).post('/v1/a2a/ctx123/chat').set('Authorization', `Bearer ${token}`).send({ message: 'hola' })

            // La respuesta debe contener los eventos SSE completos
            expect(res.headers['content-type']).toContain('text/event-stream')
            expect(res.text).toContain('event: message')
            expect(res.text).toContain('event: done')
            expect(res.text).toContain('"Hola "')
            expect(res.text).toContain('"mundo"')
        })
    })

    describe('CORS', () => {
        it('should include CORS headers in responses', async () => {
            const { createApp } = await import('./app')
            const app = createApp()

            const res = await request(app).options('/v1/a2a/agents').set('Origin', 'https://gobernai.com')

            expect(res.headers['access-control-allow-origin']).toBeDefined()
            expect(res.headers['access-control-allow-methods']).toBeDefined()
        })
    })

    describe('Auth Integration', () => {
        it('should reject requests without JWT', async () => {
            const { createApp } = await import('./app')
            const app = createApp()

            const res = await request(app).get('/v1/a2a/agents')
            expect(res.status).toBe(401)
        })

        it('should allow requests with valid JWT', async () => {
            const { createApp } = await import('./app')
            const app = createApp()
            const token = await generateValidToken()

            const res = await request(app).get('/v1/a2a/agents').set('Authorization', `Bearer ${token}`)

            expect(res.status).toBe(200)
        })
    })

    describe('Health Check', () => {
        it('should respond to /health without auth', async () => {
            const { createApp } = await import('./app')
            const app = createApp()

            const res = await request(app).get('/health')
            expect(res.status).toBe(200)
            expect(res.body.status).toBe('ok')
        })
    })
})
