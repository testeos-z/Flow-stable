import { describe, it, expect, vi } from 'vitest'
import { passthroughHandler, wrapHandler, successResponse, errorResponse } from './handler-helpers.js'
import type { FlowiseApiClient } from '../flowise-api.js'

function createMockApiClient(requestFn: FlowiseApiClient['request'] = vi.fn()): FlowiseApiClient {
    return { request: requestFn }
}

describe('handler-helpers', () => {
    describe('passthroughHandler', () => {
        it('should call api.request and return success response', async () => {
            const mockData = { id: '123', name: 'Test' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockData))

            const result = await passthroughHandler(mockApi, 'GET', '/test-endpoint')

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/test-endpoint', undefined)
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('"id": "123"')
        })

        it('should pass body to api.request', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({ created: true }))
            const body = { name: 'New Item' }

            await passthroughHandler(mockApi, 'POST', '/items', body)

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/items', body)
        })

        it('should return error response with custom prefix on failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Not found')))

            const result = await passthroughHandler(mockApi, 'GET', '/missing', undefined, 'Custom prefix')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Custom prefix')
            expect(result.content[0].text).toContain('Not found')
        })

        it('should return error response without prefix on failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Server error')))

            const result = await passthroughHandler(mockApi, 'GET', '/fails')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Server error')
        })
    })

    describe('wrapHandler', () => {
        it('should return handler result on success', async () => {
            const handler = vi.fn().mockResolvedValue(successResponse({ ok: true }))
            const wrapped = wrapHandler(handler)

            const result = await wrapped()

            expect(handler).toHaveBeenCalledTimes(1)
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('"ok": true')
        })

        it('should catch unexpected errors and return error response', async () => {
            const handler = vi.fn().mockRejectedValue(new Error('Unexpected boom'))
            const wrapped = wrapHandler(handler)

            const result = await wrapped()

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Unexpected error')
            expect(result.content[0].text).toContain('Unexpected boom')
        })

        it('should pass arguments through to the handler', async () => {
            const handler = vi.fn().mockResolvedValue(successResponse({ received: true }))
            const wrapped = wrapHandler(handler)

            await wrapped('arg1', 42, { key: 'value' })

            expect(handler).toHaveBeenCalledWith('arg1', 42, { key: 'value' })
        })
    })

    describe('successResponse', () => {
        it('should format data as JSON text response', () => {
            const data = { id: '123', name: 'Test' }
            const result = successResponse(data)

            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
            })
        })
    })

    describe('errorResponse', () => {
        it('should format error message with isError flag', () => {
            const message = 'Something went wrong'
            const result = errorResponse(message)

            expect(result).toEqual({
                content: [{ type: 'text', text: message }],
                isError: true
            })
        })
    })
})
