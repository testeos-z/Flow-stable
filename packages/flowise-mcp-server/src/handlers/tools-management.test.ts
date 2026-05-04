import { describe, it, expect, vi } from 'vitest'
import {
    handleFlowListTools,
    handleFlowGetTool,
    handleFlowCreateTool,
    handleFlowUpdateTool,
    handleFlowDeleteTool
} from './tools-management.js'
import type { FlowiseApiClient } from '../flowise-api.js'

function createMockApiClient(requestFn: FlowiseApiClient['request'] = vi.fn()): FlowiseApiClient {
    return { request: requestFn }
}

describe('tools-management handlers', () => {
    describe('handleFlowListTools', () => {
        it('should list tools with default pagination', async () => {
            const mockTools = [{ id: 'tool-1', name: 'Calculator', type: 'CustomTool' }]
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockTools))

            const result = await handleFlowListTools(mockApi)

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/tools')
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('Calculator')
        })

        it('should pass pagination params', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue([]))

            await handleFlowListTools(mockApi, { page: 2, limit: 20 })

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/tools?page=2&limit=20')
        })

        it('should return error on API failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Network error')))

            const result = await handleFlowListTools(mockApi)

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error listing tools')
        })
    })

    describe('handleFlowGetTool', () => {
        it('should return tool by ID', async () => {
            const mockTool = { id: 'tool-456', name: 'BashRunner', type: 'ChildProcess', funcBody: '#!/bin/bash' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockTool))

            const result = await handleFlowGetTool(mockApi, 'tool-456')

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/tools/tool-456')
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('BashRunner')
            expect(result.content[0].text).toContain('#!/bin/bash')
        })

        it('should return error when tool not found', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Tool not found')))

            const result = await handleFlowGetTool(mockApi, 'nonexistent')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error getting tool')
        })
    })

    describe('handleFlowCreateTool', () => {
        it('should create a custom tool', async () => {
            const mockResponse = { id: 'tool-new', name: 'my-tool', type: 'CustomTool' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleFlowCreateTool(mockApi, {
                name: 'my-tool',
                type: 'CustomTool',
                funcBody: 'return 42'
            })

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/tools', {
                name: 'my-tool',
                type: 'CustomTool',
                funcBody: 'return 42'
            })
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('tool-new')
        })

        it('should pass optional fields', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({}))

            await handleFlowCreateTool(mockApi, {
                name: 'my-tool',
                type: 'CustomTool',
                iconSrc: '/icons/tool.svg',
                description: 'A helpful tool'
            })

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/tools', {
                name: 'my-tool',
                type: 'CustomTool',
                iconSrc: '/icons/tool.svg',
                description: 'A helpful tool'
            })
        })

        it('should return error on API failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Duplicate name')))

            const result = await handleFlowCreateTool(mockApi, {
                name: 'duplicate',
                type: 'CustomTool'
            })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error creating tool')
        })
    })

    describe('handleFlowUpdateTool', () => {
        it('should update tool funcBody', async () => {
            const mockResponse = { id: 'tool-1', name: 'my-tool', funcBody: 'return 99' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleFlowUpdateTool(mockApi, 'tool-1', { funcBody: 'return 99' })

            expect(mockApi.request).toHaveBeenCalledWith('PUT', '/tools/tool-1', { funcBody: 'return 99' })
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('return 99')
        })

        it('should return error on API failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Tool not found')))

            const result = await handleFlowUpdateTool(mockApi, 'bad-id', { funcBody: '' })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error updating tool')
        })
    })

    describe('handleFlowDeleteTool', () => {
        it('should delete tool by ID', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({}))

            const result = await handleFlowDeleteTool(mockApi, 'tool-1')

            expect(mockApi.request).toHaveBeenCalledWith('DELETE', '/tools/tool-1')
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('"deleted": "tool-1"')
        })

        it('should return error when tool is referenced by flows', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Tool is in use')))

            const result = await handleFlowDeleteTool(mockApi, 'tool-active')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error deleting tool')
        })
    })
})
