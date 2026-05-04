import { describe, it, expect, vi } from 'vitest'
import {
    handleGetMcpServerConfig,
    handleEnableMcpServer,
    handleUpdateMcpServerConfig,
    handleDisableMcpServer,
    handleRefreshMcpToken
} from './mcp-server-config.js'
import type { FlowiseApiClient } from '../flowise-api.js'

function createMockApiClient(requestFn: FlowiseApiClient['request'] = vi.fn()): FlowiseApiClient {
    return { request: requestFn }
}

describe('mcp-server-config handlers', () => {
    describe('handleGetMcpServerConfig', () => {
        it('should return MCP server config', async () => {
            const mockConfig = { enabled: true, token: 'abc-123', transport: 'stdio', port: 3005, baseUrl: 'http://localhost' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockConfig))

            const result = await handleGetMcpServerConfig(mockApi)

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/mcp-server')
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('abc-123')
            expect(result.content[0].text).toContain('stdio')
        })

        it('should return error on API failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('MCP server not configured')))

            const result = await handleGetMcpServerConfig(mockApi)

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error getting MCP server config')
        })
    })

    describe('handleEnableMcpServer', () => {
        it('should enable MCP server', async () => {
            const mockResponse = { enabled: true, message: 'Server enabled' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleEnableMcpServer(mockApi)

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/mcp-server/enable')
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('Server enabled')
        })

        it('should return error when enable fails', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Permission denied')))

            const result = await handleEnableMcpServer(mockApi)

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error enabling MCP server')
        })
    })

    describe('handleUpdateMcpServerConfig', () => {
        it('should update MCP server config with partial params', async () => {
            const mockResponse = { enabled: true, port: 3001 }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleUpdateMcpServerConfig(mockApi, { port: 3001 })

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/mcp-server', { port: 3001 })
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('3001')
        })

        it('should pass all optional config fields', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({}))

            await handleUpdateMcpServerConfig(mockApi, {
                transport: 'sse',
                port: 8080,
                baseUrl: 'https://example.com'
            })

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/mcp-server', {
                transport: 'sse',
                port: 8080,
                baseUrl: 'https://example.com'
            })
        })

        it('should return error on API failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Invalid config')))

            const result = await handleUpdateMcpServerConfig(mockApi, { port: -1 })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error updating MCP server config')
        })
    })

    describe('handleDisableMcpServer', () => {
        it('should disable MCP server', async () => {
            const mockResponse = { enabled: false, message: 'Server disabled' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleDisableMcpServer(mockApi)

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/mcp-server/disable')
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('Server disabled')
        })

        it('should return error when disable fails', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Server not running')))

            const result = await handleDisableMcpServer(mockApi)

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error disabling MCP server')
        })
    })

    describe('handleRefreshMcpToken', () => {
        it('should refresh MCP token and return new token', async () => {
            const mockResponse = { token: 'new-token-xyz', message: 'Token refreshed' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleRefreshMcpToken(mockApi)

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/mcp-server/token')
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('new-token-xyz')
        })

        it('should return error when token refresh fails', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Token generation failed')))

            const result = await handleRefreshMcpToken(mockApi)

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error refreshing MCP token')
        })
    })
})
