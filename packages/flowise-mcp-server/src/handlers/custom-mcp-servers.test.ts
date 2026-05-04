import { describe, it, expect, vi } from 'vitest'
import {
    handleCustomMcpList,
    handleCustomMcpGet,
    handleCustomMcpCreate,
    handleCustomMcpUpdate,
    handleCustomMcpDelete,
    handleCustomMcpGetTools,
    handleCustomMcpAuthorize
} from './custom-mcp-servers.js'
import type { FlowiseApiClient } from '../flowise-api.js'

function createMockApiClient(requestFn: FlowiseApiClient['request'] = vi.fn()): FlowiseApiClient {
    return { request: requestFn }
}

describe('custom-mcp-servers handlers', () => {
    // CMS-001: List
    describe('handleCustomMcpList', () => {
        it('should return list of custom MCP servers', async () => {
            const mockServers = [
                { id: 'srv-1', name: 'my-server', transport: 'stdio', enabled: true },
                { id: 'srv-2', name: 'other-server', transport: 'sse', enabled: false }
            ]
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockServers))

            const result = await handleCustomMcpList(mockApi)

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/custom-mcp-servers', undefined)
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('my-server')
            expect(result.content[0].text).toContain('other-server')
        })

        it('should return error on empty result', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Workspace not found')))

            const result = await handleCustomMcpList(mockApi)

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error listing custom MCP servers')
        })
    })

    // CMS-002: Get
    describe('handleCustomMcpGet', () => {
        it('should return a single custom MCP server by ID', async () => {
            const mockServer = { id: 'srv-abc', name: 'test-server', transport: 'stdio', command: 'node', enabled: true }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockServer))

            const result = await handleCustomMcpGet(mockApi, 'srv-abc')

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/custom-mcp-servers/srv-abc', undefined)
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('test-server')
            expect(result.content[0].text).toContain('stdio')
        })

        it('should return error for non-existent server', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Server not found')))

            const result = await handleCustomMcpGet(mockApi, 'nonexistent')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error getting custom MCP server')
            expect(result.content[0].text).toContain('Server not found')
        })
    })

    // CMS-003: Create
    describe('handleCustomMcpCreate', () => {
        it('should create a new custom MCP server', async () => {
            const mockCreated = { id: 'srv-new', name: 'my-server', command: 'node server.js' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockCreated))

            const result = await handleCustomMcpCreate(mockApi, {
                name: 'my-server',
                command: 'node server.js',
                args: ['--port', '3000'],
                env: { NODE_ENV: 'production' }
            })

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/custom-mcp-servers', {
                name: 'my-server',
                command: 'node server.js',
                args: ['--port', '3000'],
                env: { NODE_ENV: 'production' }
            })
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('my-server')
        })

        it('should return error on duplicate name', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Name already exists')))

            const result = await handleCustomMcpCreate(mockApi, {
                name: 'existing-server',
                command: 'node server.js'
            })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error creating custom MCP server')
            expect(result.content[0].text).toContain('Name already exists')
        })

        it('should create server with description only', async () => {
            const mockCreated = { id: 'srv-desc', name: 'desc-server' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockCreated))

            const result = await handleCustomMcpCreate(mockApi, {
                name: 'desc-server',
                description: 'A test server'
            })

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/custom-mcp-servers', {
                name: 'desc-server',
                description: 'A test server'
            })
            expect(result.isError).toBeUndefined()
        })
    })

    // CMS-004: Update
    describe('handleCustomMcpUpdate', () => {
        it('should update command on an existing server', async () => {
            const mockUpdated = { id: 'srv-1', name: 'my-server', command: 'new-command' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockUpdated))

            const result = await handleCustomMcpUpdate(mockApi, 'srv-1', { command: 'new-command' })

            expect(mockApi.request).toHaveBeenCalledWith('PUT', '/custom-mcp-servers/srv-1', { command: 'new-command' })
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('new-command')
        })

        it('should update multiple fields at once', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({ id: 'srv-1' }))

            const result = await handleCustomMcpUpdate(mockApi, 'srv-1', {
                name: 'renamed',
                env: { API_KEY: 'new-key' },
                description: 'Updated description'
            })

            expect(mockApi.request).toHaveBeenCalledWith('PUT', '/custom-mcp-servers/srv-1', {
                name: 'renamed',
                env: { API_KEY: 'new-key' },
                description: 'Updated description'
            })
            expect(result.isError).toBeUndefined()
        })

        it('should return error for non-existent server', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Server not found')))

            const result = await handleCustomMcpUpdate(mockApi, 'nonexistent', { name: 'nope' })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error updating custom MCP server')
        })
    })

    // CMS-005: Delete
    describe('handleCustomMcpDelete', () => {
        it('should delete an existing server', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({ success: true }))

            const result = await handleCustomMcpDelete(mockApi, 'srv-1')

            expect(mockApi.request).toHaveBeenCalledWith('DELETE', '/custom-mcp-servers/srv-1', undefined)
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('success')
        })

        it('should return error when server is in use', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Server is referenced by active flows')))

            const result = await handleCustomMcpDelete(mockApi, 'srv-in-use')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error deleting custom MCP server')
            expect(result.content[0].text).toContain('active flows')
        })
    })

    // CMS-006: Get Tools
    describe('handleCustomMcpGetTools', () => {
        it('should return discovered tools from an authorized server', async () => {
            const mockTools = [
                { name: 'search_docs', description: 'Search documentation', inputSchema: {} },
                { name: 'get_page', description: 'Get documentation page', inputSchema: {} }
            ]
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockTools))

            const result = await handleCustomMcpGetTools(mockApi, 'srv-1')

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/custom-mcp-servers/srv-1/tools', undefined)
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('search_docs')
            expect(result.content[0].text).toContain('get_page')
        })

        it('should return error for unauthorized server', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Server not authorized')))

            const result = await handleCustomMcpGetTools(mockApi, 'srv-unauthorized')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error getting custom MCP server tools')
            expect(result.content[0].text).toContain('not authorized')
        })
    })

    // CMS-007: Authorize
    describe('handleCustomMcpAuthorize', () => {
        it('should authorize and connect to MCP server', async () => {
            const mockResult = { status: 'authorized', tools: ['tool-a', 'tool-b'] }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResult))

            const result = await handleCustomMcpAuthorize(mockApi, 'srv-1')

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/custom-mcp-servers/srv-1/authorize', undefined)
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('authorized')
        })

        it('should return error on connection failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Connection refused: MCP server unreachable')))

            const result = await handleCustomMcpAuthorize(mockApi, 'srv-bad')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error authorizing custom MCP server')
            expect(result.content[0].text).toContain('Connection refused')
        })

        it('should handle timeout during authorization', async () => {
            // Simulates a long-running authorization that times out
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Authorization timed out after 30s')))

            const result = await handleCustomMcpAuthorize(mockApi, 'srv-slow')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error authorizing custom MCP server')
            expect(result.content[0].text).toContain('timed out')
        })
    })
})
