import { describe, it, expect, vi } from 'vitest'
import {
    handleListCredentials,
    handleGetCredential,
    handleCreateCredential,
    handleUpdateCredential,
    handleDeleteCredential
} from './credentials-api.js'
import type { FlowiseApiClient } from '../flowise-api.js'

function createMockApiClient(requestFn: FlowiseApiClient['request'] = vi.fn()): FlowiseApiClient {
    return { request: requestFn }
}

describe('credentials-api handlers', () => {
    describe('handleListCredentials', () => {
        it('should list credentials with default pagination', async () => {
            const mockCredentials = [{ id: 'cred-1', name: 'OpenRouter Key', credentialName: 'openRouterApi' }]
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockCredentials))

            const result = await handleListCredentials(mockApi)

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/credentials')
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('OpenRouter Key')
        })

        it('should pass pagination params', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue([]))

            await handleListCredentials(mockApi, { page: 2, limit: 10 })

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/credentials?page=2&limit=10')
        })

        it('should return error on API failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Unauthorized')))

            const result = await handleListCredentials(mockApi)

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error listing credentials')
        })
    })

    describe('handleGetCredential', () => {
        it('should return credential by ID with masked value', async () => {
            const mockCredential = {
                id: 'cred-123',
                name: 'My Key',
                credentialName: 'openRouterApi',
                plainDataEnv: { openRouterApiKey: '*****' }
            }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockCredential))

            const result = await handleGetCredential(mockApi, 'cred-123')

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/credentials/cred-123')
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('cred-123')
            expect(result.content[0].text).toContain('openRouterApi')
        })

        it('should return error when credential not found', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Credential not found')))

            const result = await handleGetCredential(mockApi, 'nonexistent')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error getting credential')
        })
    })

    describe('handleCreateCredential', () => {
        it('should create a credential with name and type', async () => {
            const mockResponse = { id: 'cred-new', name: 'my-key', credentialName: 'openRouterApi' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleCreateCredential(mockApi, {
                name: 'my-key',
                credentialName: 'openRouterApi',
                plainDataEnv: { openRouterApiKey: 'sk-test123' }
            })

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/credentials', {
                name: 'my-key',
                credentialName: 'openRouterApi',
                plainDataEnv: { openRouterApiKey: 'sk-test123' }
            })
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('cred-new')
        })

        it('should return error on API failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Duplicate credential')))

            const result = await handleCreateCredential(mockApi, {
                name: 'dup',
                credentialName: 'openRouterApi',
                plainDataEnv: {}
            })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error creating credential')
        })
    })

    describe('handleUpdateCredential', () => {
        it('should update credential value', async () => {
            const mockResponse = { id: 'cred-1', message: 'Credential updated' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleUpdateCredential(mockApi, 'cred-1', {
                plainDataEnv: { openRouterApiKey: 'new-key' }
            })

            expect(mockApi.request).toHaveBeenCalledWith('PUT', '/credentials/cred-1', {
                plainDataEnv: { openRouterApiKey: 'new-key' }
            })
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('Credential updated')
        })

        it('should update name and credentialName', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({}))

            await handleUpdateCredential(mockApi, 'cred-1', {
                name: 'New Name',
                credentialName: 'supabaseApi'
            })

            expect(mockApi.request).toHaveBeenCalledWith('PUT', '/credentials/cred-1', {
                name: 'New Name',
                credentialName: 'supabaseApi'
            })
        })

        it('should return error on API failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Credential not found')))

            const result = await handleUpdateCredential(mockApi, 'bad-id', { plainDataEnv: {} })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error updating credential')
        })
    })

    describe('handleDeleteCredential', () => {
        it('should delete credential by ID', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({}))

            const result = await handleDeleteCredential(mockApi, 'cred-1')

            expect(mockApi.request).toHaveBeenCalledWith('DELETE', '/credentials/cred-1')
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('"deleted": "cred-1"')
        })

        it('should return error when credential is in use', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Credential is referenced by flows')))

            const result = await handleDeleteCredential(mockApi, 'cred-active')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error deleting credential')
        })
    })
})
