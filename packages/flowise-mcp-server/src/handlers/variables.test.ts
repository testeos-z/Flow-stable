import { describe, it, expect, vi } from 'vitest'
import { handleListVariables, handleCreateVariable, handleUpdateVariable, handleDeleteVariable } from './variables.js'
import type { FlowiseApiClient } from '../flowise-api.js'

function createMockApiClient(requestFn: FlowiseApiClient['request'] = vi.fn()): FlowiseApiClient {
    return { request: requestFn }
}

describe('variables handlers', () => {
    describe('handleListVariables', () => {
        it('should list all variables', async () => {
            const mockVariables = [
                { id: 'var-1', name: 'API_URL', value: '***', type: 'static' },
                { id: 'var-2', name: 'MODEL_NAME', value: '***', type: 'static' }
            ]
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockVariables))

            const result = await handleListVariables(mockApi)

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/variables', undefined)
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('API_URL')
            expect(result.content[0].text).toContain('MODEL_NAME')
        })

        it('should return error on API failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Network error')))

            const result = await handleListVariables(mockApi)

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error listing variables')
        })
    })

    describe('handleCreateVariable', () => {
        it('should create a variable', async () => {
            const mockResponse = { id: 'var-3', name: 'API_URL', value: '***', type: 'static' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleCreateVariable(mockApi, {
                variableName: 'API_URL',
                value: 'https://api.example.com'
            })

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/variables', {
                variableName: 'API_URL',
                value: 'https://api.example.com'
            })
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('API_URL')
        })

        it('should return error when variable name already exists', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('409: Variable name already exists')))

            const result = await handleCreateVariable(mockApi, {
                variableName: 'API_URL',
                value: 'https://api.example.com'
            })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error creating variable')
        })
    })

    describe('handleUpdateVariable', () => {
        it('should update a variable value', async () => {
            const mockResponse = { id: 'var-1', name: 'API_URL', value: '***', type: 'static' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleUpdateVariable(mockApi, 'var-1', {
                value: 'https://new-api.example.com'
            })

            expect(mockApi.request).toHaveBeenCalledWith('PUT', '/variables/var-1', {
                value: 'https://new-api.example.com'
            })
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('API_URL')
        })

        it('should return error when variable not found', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('404: Variable not found')))

            const result = await handleUpdateVariable(mockApi, 'nonexistent', {
                value: 'test'
            })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error updating variable')
        })
    })

    describe('handleDeleteVariable', () => {
        it('should delete a variable', async () => {
            const mockResponse = { message: 'Variable deleted' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleDeleteVariable(mockApi, 'var-1')

            expect(mockApi.request).toHaveBeenCalledWith('DELETE', '/variables/var-1', undefined)
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('Variable deleted')
        })

        it('should return error when variable not found', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('404: Variable not found')))

            const result = await handleDeleteVariable(mockApi, 'nonexistent')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error deleting variable')
        })
    })
})
