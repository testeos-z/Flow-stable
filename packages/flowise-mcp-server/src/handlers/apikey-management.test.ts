import { describe, it, expect, vi } from 'vitest'
import { handleListApiKeys, handleCreateApiKey, handleUpdateApiKey, handleDeleteApiKey } from './apikey-management.js'
import type { FlowiseApiClient } from '../flowise-api.js'

function createMockApiClient(requestFn: FlowiseApiClient['request'] = vi.fn()): FlowiseApiClient {
    return { request: requestFn }
}

describe('apikey-management handlers', () => {
    describe('handleListApiKeys', () => {
        it('should list all API keys', async () => {
            const mockKeys = [
                { id: 'key-1', keyName: 'ci-deploy-key', createdAt: '2026-05-01T10:00:00Z' },
                { id: 'key-2', keyName: 'admin-key', createdAt: '2026-04-15T08:30:00Z' }
            ]
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockKeys))

            const result = await handleListApiKeys(mockApi)

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/apikey', undefined)
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('ci-deploy-key')
            expect(result.content[0].text).toContain('admin-key')
        })

        it('should return error on API failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Unauthorized')))

            const result = await handleListApiKeys(mockApi)

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error listing API keys')
        })
    })

    describe('handleCreateApiKey', () => {
        it('should create an API key and return the full key value', async () => {
            const mockResponse = { id: 'key-3', keyName: 'ci-deploy-key', apiKey: 'sk-abc123def456', createdAt: '2026-05-03T12:00:00Z' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleCreateApiKey(mockApi, {
                apiKeyName: 'ci-deploy-key'
            })

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/apikey', { apiKeyName: 'ci-deploy-key' })
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('ci-deploy-key')
            expect(result.content[0].text).toContain('sk-abc123def456')
        })

        it('should return error on API failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('403: Permission denied')))

            const result = await handleCreateApiKey(mockApi, {
                apiKeyName: 'test-key'
            })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error creating API key')
        })
    })

    describe('handleUpdateApiKey', () => {
        it('should rename an API key', async () => {
            const mockResponse = { id: 'key-1', keyName: 'new-name', createdAt: '2026-05-01T10:00:00Z' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleUpdateApiKey(mockApi, 'key-1', {
                apiKeyName: 'new-name'
            })

            expect(mockApi.request).toHaveBeenCalledWith('PUT', '/apikey/key-1', { apiKeyName: 'new-name' })
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('new-name')
        })

        it('should return error when key not found', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('404: API key not found')))

            const result = await handleUpdateApiKey(mockApi, 'nonexistent', {
                apiKeyName: 'ghost-key'
            })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error updating API key')
        })
    })

    describe('handleDeleteApiKey', () => {
        it('should delete an API key', async () => {
            const mockResponse = { message: 'API key revoked' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleDeleteApiKey(mockApi, 'key-1')

            expect(mockApi.request).toHaveBeenCalledWith('DELETE', '/apikey/key-1', undefined)
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('API key revoked')
        })

        it('should return error when key not found', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('404: API key not found')))

            const result = await handleDeleteApiKey(mockApi, 'nonexistent')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error deleting API key')
        })
    })
})
