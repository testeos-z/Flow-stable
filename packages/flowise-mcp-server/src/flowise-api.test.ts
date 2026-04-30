import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createFlowiseApiClient, getDefaultConfig } from './flowise-api.js'

describe('flowise-api', () => {
    describe('getDefaultConfig', () => {
        const originalEnv = process.env

        beforeEach(() => {
            vi.resetModules()
            process.env = { ...originalEnv }
        })

        afterEach(() => {
            process.env = originalEnv
        })

        it('should return default values when env vars are not set', () => {
            delete process.env.FLOWISE_BASE_URL
            delete process.env.FLOWISE_API_KEY

            const config = getDefaultConfig()

            expect(config.baseUrl).toBe('http://localhost:3000')
            expect(config.apiKey).toBe('')
        })

        it('should use environment variables when set', () => {
            process.env.FLOWISE_BASE_URL = 'http://custom-host:8080'
            process.env.FLOWISE_API_KEY = 'test-api-key'

            const config = getDefaultConfig()

            expect(config.baseUrl).toBe('http://custom-host:8080')
            expect(config.apiKey).toBe('test-api-key')
        })
    })

    describe('createFlowiseApiClient', () => {
        const mockFetch = vi.fn()

        beforeEach(() => {
            vi.stubGlobal('fetch', mockFetch)
            mockFetch.mockReset()
        })

        afterEach(() => {
            vi.unstubAllGlobals()
        })

        it('should make GET request without body', async () => {
            const mockResponse = { id: '123', name: 'Test Flow' }
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            })

            const client = createFlowiseApiClient({
                baseUrl: 'http://localhost:3000',
                apiKey: 'test-key'
            })

            const result = await client.request('GET', '/chatflows/123')

            expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/chatflows/123', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test-key'
                },
                body: undefined
            })
            expect(result).toEqual(mockResponse)
        })

        it('should make POST request with body', async () => {
            const mockResponse = { id: '456', name: 'New Flow' }
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            })

            const client = createFlowiseApiClient({
                baseUrl: 'http://localhost:3000',
                apiKey: 'test-key'
            })

            const body = { name: 'New Flow', flowData: '{}' }
            const result = await client.request('POST', '/chatflows', body)

            expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/chatflows', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test-key'
                },
                body: JSON.stringify(body)
            })
            expect(result).toEqual(mockResponse)
        })

        it('should not include Authorization header when apiKey is empty', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve([])
            })

            const client = createFlowiseApiClient({
                baseUrl: 'http://localhost:3000',
                apiKey: ''
            })

            await client.request('GET', '/chatflows')

            expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/chatflows', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: undefined
            })
        })

        it('should throw error on non-ok response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                text: () => Promise.resolve('Chatflow not found')
            })

            const client = createFlowiseApiClient({
                baseUrl: 'http://localhost:3000',
                apiKey: 'test-key'
            })

            await expect(client.request('GET', '/chatflows/999')).rejects.toThrow('Flowise API error (404): Chatflow not found')
        })

        it('should handle DELETE requests', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true })
            })

            const client = createFlowiseApiClient({
                baseUrl: 'http://localhost:3000',
                apiKey: 'test-key'
            })

            const result = await client.request('DELETE', '/chatflows/123')

            expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/chatflows/123', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test-key'
                },
                body: undefined
            })
            expect(result).toEqual({ success: true })
        })

        it('should handle PUT requests with body', async () => {
            const mockResponse = { id: '123', name: 'Updated Flow' }
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            })

            const client = createFlowiseApiClient({
                baseUrl: 'http://localhost:3000',
                apiKey: 'test-key'
            })

            const body = { name: 'Updated Flow' }
            const result = await client.request('PUT', '/chatflows/123', body)

            expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/chatflows/123', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test-key'
                },
                body: JSON.stringify(body)
            })
            expect(result).toEqual(mockResponse)
        })
    })
})
